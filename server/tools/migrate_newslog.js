// 迁移脚本：将 server/newslog 下的旧结构（含子目录分类）统一扁平为根目录 JSON
// 使用方法：node server/tools/migrate_newslog.js

const fs = require('fs');
const path = require('path');

const NEWSLOG_DIR = path.join(__dirname, '..', 'newslog');

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const items = fs.readdirSync(dir);
  for (const name of items) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.json$/i.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function normalize(item, filename, mtime, fallbackTag) {
  // 允许旧字段：category/time/hot/disclaimer
  const tags = Array.isArray(item.tags)
    ? item.tags
    : (item.category ? [item.category] : (fallbackTag ? [fallbackTag] : []));
  const createdAt = item.publishTime ? new Date(item.publishTime).getTime() : (item.createdAt || mtime.getTime());
  return {
    id: item.id || `json_${mtime.getTime()}_${Math.random().toString(36).slice(2,8)}`,
    title: item.title,
    content: item.content,
    tags,
    createdAt,
    views: Number(item.views || 0),
    likes: Number(item.likes || 0),
    commentsCount: Number(item.commentsCount || 0),
    summary: item.summary || '',
    image: item.image || '',
    imageAlt: item.imageAlt || '',
    author: item.author || 'VF News',
    source: 'json',
    filename: path.basename(filename)
  };
}

function main() {
  ensureDir(NEWSLOG_DIR);
  const files = walk(NEWSLOG_DIR);
  if (files.length === 0) {
    console.log('newslog 目录为空，无需迁移');
    return;
  }
  let migrated = 0;
  for (const full of files) {
    try {
      const rel = path.relative(NEWSLOG_DIR, full);
      const parts = rel.split(path.sep);
      const maybeTag = parts.length > 1 ? parts[0] : '';
      const text = fs.readFileSync(full, 'utf-8');
      const json = JSON.parse(text);
      if (!json || !json.title || !json.content) {
        console.warn('跳过，缺少必需字段:', rel);
        continue;
      }
      const stat = fs.statSync(full);
      const next = normalize(json, full, stat.mtime, maybeTag);
      const safeTitle = String(next.title).replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 60);
      const outName = `${next.id}_${safeTitle}.json`;
      const outFull = path.join(NEWSLOG_DIR, outName);
      fs.writeFileSync(outFull, JSON.stringify(next, null, 2));
      migrated++;
    } catch (e) {
      console.warn('迁移失败:', full, e.message);
    }
  }
  console.log(`迁移完成，输出 ${migrated} 条到根目录 JSON。`);
}

if (require.main === module) {
  main();
}


