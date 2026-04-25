import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);

const BASE_DIR = path.join(process.cwd(), 'media-manager');

const VIDEOS_DIR = path.join(BASE_DIR, 'videos-to-upload');
const UPLOADED_DIR = path.join(BASE_DIR, 'uploaded-videos');
const FAILED_DIR = path.join(BASE_DIR, 'failed-videos');
const THUMBNAILS_DIR = path.join(BASE_DIR, 'generated-thumbnails');
const ERROR_LOG = path.join(BASE_DIR, 'upload-errors.txt');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function ensureFoldersExist() {
  [VIDEOS_DIR, UPLOADED_DIR, FAILED_DIR, THUMBNAILS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function cleanFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]/g, '');
}

function moveFile(fromPath, toDir, fileName) {
  const targetPath = path.join(toDir, fileName);

  if (fs.existsSync(targetPath)) {
    const parsed = path.parse(fileName);
    const newName = `${parsed.name}-${Date.now()}${parsed.ext}`;
    fs.renameSync(fromPath, path.join(toDir, newName));
    return;
  }

  fs.renameSync(fromPath, targetPath);
}

function logError(fileName, error) {
  const message = `[${new Date().toISOString()}] ${fileName}: ${error.message}\n`;
  fs.appendFileSync(ERROR_LOG, message);
}

async function generateThumbnail(videoPath, thumbnailPath) {
  await execFileAsync('ffmpeg', [
    '-y',
    '-ss',
    '00:00:01',
    '-i',
    videoPath,
    '-frames:v',
    '1',
    '-vf',
    'scale=720:-1',
    '-q:v',
    '80',
    thumbnailPath,
  ]);
}

async function uploadToR2({ localPath, r2Path }) {
  const fileBuffer = fs.readFileSync(localPath);
  const contentType = mime.lookup(localPath) || 'application/octet-stream';

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Path,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${r2Path}`;
}

async function uploadVideo(fileName, index, total) {
  console.log(`\n📹 ${index}/${total} Starte Upload: ${fileName}`);

  const filePath = path.join(VIDEOS_DIR, fileName);
  const cleanName = cleanFileName(fileName);
  const parsed = path.parse(cleanName);

  const thumbnailFileName = `${parsed.name}.webp`;
  const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFileName);

  const { data: existingVideo, error: checkError } = await supabase
    .from('videos')
    .select('id')
    .eq('original_file_name', fileName)
    .maybeSingle();

  if (checkError) {
    throw checkError;
  }

  if (existingVideo) {
    console.log(`⚠️ Übersprungen, schon in Supabase: ${fileName}`);
    moveFile(filePath, UPLOADED_DIR, fileName);
    return;
  }

  console.log('🖼️ Erzeuge Thumbnail...');
  await generateThumbnail(filePath, thumbnailPath);

  const timestamp = Date.now();

  const videoR2Path = `videos/${timestamp}-${cleanName}`;
  const thumbnailR2Path = `thumbnails/${timestamp}-${thumbnailFileName}`;

  console.log('☁️ Lade Video zu R2 hoch...');
  const videoUrl = await uploadToR2({
    localPath: filePath,
    r2Path: videoR2Path,
  });

  console.log('☁️ Lade Thumbnail zu R2 hoch...');
  const thumbnailUrl = await uploadToR2({
    localPath: thumbnailPath,
    r2Path: thumbnailR2Path,
  });

  const { error: insertError } = await supabase.from('videos').insert({
    title: parsed.name,
    video_url: videoUrl,
    thumbnail_url: thumbnailUrl,
    original_file_name: fileName,
    is_active: true,
  });

  if (insertError) {
    throw insertError;
  }

  moveFile(filePath, UPLOADED_DIR, fileName);

  console.log(`✅ Hochgeladen: ${fileName}`);
  console.log(`🎬 Video: ${videoUrl}`);
  console.log(`🖼️ Thumbnail: ${thumbnailUrl}`);
}

async function main() {
  ensureFoldersExist();

  const files = fs
    .readdirSync(VIDEOS_DIR)
    .filter((file) => file.toLowerCase().endsWith('.mp4'));

  if (files.length === 0) {
    console.log('Keine Videos in media-manager/videos-to-upload gefunden.');
    return;
  }

  console.log(`Gefunden: ${files.length} Video(s)`);

  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = path.join(VIDEOS_DIR, fileName);

    try {
      await uploadVideo(fileName, i + 1, files.length);
    } catch (error) {
      console.log(`❌ Fehler bei ${fileName}:`, error.message);
      logError(fileName, error);

      if (fs.existsSync(filePath)) {
        moveFile(filePath, FAILED_DIR, fileName);
      }
    }
  }

  console.log('\nFertig.');
}

main();