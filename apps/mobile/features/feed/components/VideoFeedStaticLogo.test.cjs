const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const feedSource = fs.readFileSync(path.resolve(__dirname, './VideoFeed.jsx'), 'utf8');
const overlaySource = fs.readFileSync(path.resolve(__dirname, './VideoOverlay.jsx'), 'utf8');
const mainRouteSource = fs.readFileSync(path.resolve(__dirname, '../../../app/(tabs)/index.jsx'), 'utf8');
const savedRouteSource = fs.readFileSync(path.resolve(__dirname, '../../../app/(tabs)/saved-feed.jsx'), 'utf8');

test('VideoOverlay no longer renders the Grow header logo', () => {
  assert.doesNotMatch(overlaySource, /GROW_LOGO_HEADER/);
  assert.doesNotMatch(overlaySource, /grow_banner_lossless/);
});

test('VideoFeed renders the Grow header logo exactly once, outside FlatList/renderItem, with pointerEvents disabled', () => {
  assert.match(feedSource, /^const GROW_LOGO_HEADER = require\(.*grow_banner_lossless.*\);$/m);

  const logoJsxMatches = feedSource.match(/<Image\s+source=\{GROW_LOGO_HEADER\}[\s\S]*?\/>/g) ?? [];
  assert.equal(logoJsxMatches.length, 1);

  const [logoJsx] = logoJsxMatches;
  assert.match(logoJsx, /pointerEvents="none"/);

  const renderItemStart = feedSource.indexOf('const renderItem = useCallback(');
  const renderItemEnd = feedSource.indexOf('const feedExtraData', renderItemStart);
  assert.ok(renderItemStart > -1 && renderItemEnd > renderItemStart);
  const renderItemBody = feedSource.slice(renderItemStart, renderItemEnd);
  assert.doesNotMatch(renderItemBody, /GROW_LOGO_HEADER/);

  const flatListOpenIndex = feedSource.indexOf('<FlatList');
  const flatListCloseIndex = feedSource.indexOf('/>', flatListOpenIndex);
  const logoIndex = feedSource.indexOf(logoJsx);
  assert.ok(logoIndex > flatListCloseIndex);
});

test('main and saved feed routes still share the VideoFeed component', () => {
  assert.match(mainRouteSource, /import VideoFeed from ['"]\.\.\/\.\.\/features\/feed\/components\/VideoFeed['"]/);
  assert.match(savedRouteSource, /import VideoFeed from ['"]\.\.\/\.\.\/features\/feed\/components\/VideoFeed['"]/);
});
