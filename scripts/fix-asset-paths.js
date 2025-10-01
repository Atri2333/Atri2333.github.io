/**
 * Hexo filter: fix asset image paths when post_asset_folder is enabled.
 *
 * Problem: In Markdown, author uses `![alt](slug/filename.png)` where `slug`
 * is the same as the post's basename (e.g., games101). When rendered under
 * Hexo, the page URL is .../slug/ and the relative path becomes .../slug/slug/filename.png.
 *
 * Solution: Before rendering, rewrite `!(...](./slug/xxx)` or `!(...](slug/xxx)`
 * to `!(...](xxx)` so generated pages reference the correct asset in the
 * same directory. Also handle <img src="slug/xxx"> patterns.
 */

/* global hexo */

hexo.extend.filter.register('before_post_render', function (data) {
  try {
    const cfg = hexo.config || {};
    if (!cfg.post_asset_folder) return data;

    // Source path like _posts/games101.md -> slug = games101
    const source = data.source || '';
    const base = source.split(/[/\\]/).pop() || '';
    const slug = base.replace(/\.[^./\\]+$/, '');
    if (!slug) return data;

    let content = data.content || '';

    // Escape slug for regex
    const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match Markdown images: ![alt](./slug/path) or ![alt](slug/path)
    // Groups: (1) prefix '![...]( ' with optional spaces, (2) path after slug/, then a closing ')'
    const mdImg = new RegExp(`(!\\[[^\\]]*\\]\\(\\s*)(?:\\.\\/)?${escaped}\\/([^\\)]+)\\)`, 'g');
    content = content.replace(mdImg, '$1$2)');

    // Match HTML <img src="slug/..."> or <img src="./slug/...">
    const htmlImg = new RegExp(`(<img[^>]+src=["'])\\.?\\/?${escaped}\/`, 'gi');
    content = content.replace(htmlImg, '$1');

    data.content = content;
  } catch (e) {
    // Swallow errors to avoid breaking the build; optionally log
    hexo.log.warn('[fix-asset-paths] failed:', e.message);
  }
  return data;
});
