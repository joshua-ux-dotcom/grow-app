import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import mime from 'mime-types';

const execFileAsync = promisify(execFile);

const VIDEO_FOLDER = path.join(process.cwd(), 'videos-to-upload');
const THUMBNAIL_FOLDER = path.join(process.cwd(), 'generated-thumbnails');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
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

function cleanFileName(fileName) {
  return fileName
    .toLowerCase()
    .replace('.mp4', '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function createThumbnail(videoPath, thumbnailPath) {
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
    thumbnailPath,
  ]);
}

async function uploadToR2(localFilePath, r2Key) {
  const fileBuffer = fs.readFileSync(localFilePath);
  const contentType = mime.lookup(localFilePath) || 'application/octet-stream';

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${r2Key}`;
}

async function insertVideoIntoSupabase({ title, videoUrl, thumbnailUrl }) {
  const { error } = await supabase.from('videos').insert({
    title,
    video_url: videoUrl,
    thumbnail_url: thumbnailUrl,
    is_active: true,
  });

  if (error) {
    throw error;
  }
}

async function main() {
  if (!fs.existsSync(VIDEO_FOLDER)) {
    throw new Error(`Ordner nicht gefunden: ${VIDEO_FOLDER}`);
  }

  if (!fs.existsSync(THUMBNAIL_FOLDER)) {
    fs.mkdirSync(THUMBNAIL_FOLDER);
  }

  const files = fs
    .readdirSync(VIDEO_FOLDER)
    .filter((file) => file.toLowerCase().endsWith('.mp4'));

  if (files.length === 0) {
    console.log('Keine MP4-Dateien gefunden.');
    return;
  }

  console.log(`${files.length} Video(s) gefunden.`);

  for (const file of files) {
    try {
      const baseName = cleanFileName(file);
      const videoPath = path.join(VIDEO_FOLDER, file);
      const thumbnailPath = path.join(THUMBNAIL_FOLDER, `${baseName}.webp`);

      const videoKey = `videos/${baseName}.mp4`;
      const thumbnailKey = `thumbnails/${baseName}.webp`;

      console.log(`\nVerarbeite: ${file}`);

      console.log('Thumbnail wird erstellt...');
      await createThumbnail(videoPath, thumbnailPath);

      console.log('Video wird hochgeladen...');
      const videoUrl = await uploadToR2(videoPath, videoKey);

      console.log('Thumbnail wird hochgeladen...');
      const thumbnailUrl = await uploadToR2(thumbnailPath, thumbnailKey);

      console.log('Supabase Eintrag wird erstellt...');
      await insertVideoIntoSupabase({ 
        title: baseName,
        videoUrl, 
        thumbnailUrl 
      });

      console.log(`Fertig: ${file}`);
    } catch (error) {
      console.log(`Fehler bei ${file}:`, error.message);
    }
  }

  console.log('\nUpload-Prozess beendet.');
}

main();