// Minimal Express backend for VF-News (Virtual Fake News)
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5175;

const DATA_DIR = path.join(__dirname, 'data');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const WORLD_FILE = path.join(DATA_DIR, 'worldsetting.json');
const DRAFT_FILE = path.join(DATA_DIR, 'drafts.json');
const NEWSLOG_DIR = path.join(__dirname, 'newslog');

// 已移除 AI 相关逻辑与免责声明
// 新闻仍为AI生成，但由人工维护 

app.use(bodyParser.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(NEWS_FILE)) fs.writeFileSync(NEWS_FILE, JSON.stringify({ items: [] }, null, 2));
  if (!fs.existsSync(WORLD_FILE)) fs.writeFileSync(WORLD_FILE, JSON.stringify({
    worldName: 'Default Virtual World',
    description: '一个持续演化的虚拟世界，所有新闻均为AI生成的虚构内容',
    rules: [
      '不得出现现实中的地名、人名、国家等',
      '不得涉及恐怖主义、色情、血腥、恐怖等内容',
      '所有内容末尾附加免责声明'
    ]
  }, null, 2));
  if (!fs.existsSync(DRAFT_FILE)) fs.writeFileSync(DRAFT_FILE, JSON.stringify({ items: [] }, null, 2));
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return null; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// rudimentary content policy check
// 移除内容合规与免责声明拼接
function violatesPolicy() { return false; }
function attachDisclaimer(text) { return text || ''; }

ensureDataFiles();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'vf-news-backend' });
});

// Worldsetting get/update
app.get('/api/worldsetting', (req, res) => {
  const data = readJson(WORLD_FILE);
  res.json({ ok: true, data });
});

app.put('/api/worldsetting', (req, res) => {
  const next = req.body || {};
  writeJson(WORLD_FILE, next);
  res.json({ ok: true });
});

// 已移除 AI 生成与测试接口

// 已移除草稿相关接口，改为纯手动维护新闻

// 从newslog文件夹读取JSON文件的函数
function readNewsFromJson() {
  const items = [];
  
  try {
    if (!fs.existsSync(NEWSLOG_DIR)) {
      return items;
    }
    
    // 读取根目录下的JSON文件（无分区）
    const rootFiles = fs.readdirSync(NEWSLOG_DIR).filter(f => f.endsWith('.json'));
    rootFiles.forEach(fn => {
      const fullPath = path.join(NEWSLOG_DIR, fn);
      const stat = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const newsItem = parseJsonToNews(content, fn, stat.mtime, 'general');
      if (newsItem) items.push(newsItem);
    });
    
    // 读取子目录（tag分区）下的JSON文件
    const subdirs = fs.readdirSync(NEWSLOG_DIR).filter(item => {
      const itemPath = path.join(NEWSLOG_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    subdirs.forEach(tag => {
      const tagDir = path.join(NEWSLOG_DIR, tag);
      const tagFiles = fs.readdirSync(tagDir).filter(f => f.endsWith('.json'));
      tagFiles.forEach(fn => {
        const fullPath = path.join(tagDir, fn);
        const stat = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const newsItem = parseJsonToNews(content, fn, stat.mtime, tag);
        if (newsItem) items.push(newsItem);
      });
    });
    
  } catch (e) {
    console.error('读取newslog文件失败:', e);
  }
  
  return items;
}

// 解析JSON文件为新闻对象（从 newslog 根目录读取，文件内自带 tags/统计字段）
function parseJsonToNews(content, filename, mtime, category) {
  try {
    const data = JSON.parse(content);
    
    // 验证必需字段
    if (!data.title || !data.content) {
      console.warn('JSON文件缺少必需字段:', filename);
      return null;
    }
    
    // 检查内容合规性
    // 已移除内容合规校验
    
    // 构建新闻对象
    const newsItem = {
      id: data.id || `json_${mtime.getTime()}_${Math.random().toString(36).slice(2,8)}`,
      title: data.title,
      content: data.content,
      tags: Array.isArray(data.tags) ? data.tags : (data.category ? [data.category] : []),
      createdAt: data.publishTime ? new Date(data.publishTime).getTime() : mtime.getTime(),
      views: Number(data.views || 0),
      likes: Number(data.likes || 0),
      commentsCount: Number(data.commentsCount || 0),
      source: 'json',
      filename,
      summary: data.summary || '',
      image: data.image || '',
      imageAlt: data.imageAlt || '',
      author: data.author || 'VF News'
    };
    
    return newsItem;
  } catch (e) {
    console.error('解析JSON文件失败:', filename, e);
    return null;
  }
}

// 解析markdown文件为新闻对象（保留向后兼容）
function parseMarkdownToNews(content, filename, mtime, category) {
  try {
    const lines = content.split(/\r?\n/);
    const titleLine = lines.find(l => /^#\s+/.test(l));
    if (!titleLine) return null;
    
    const title = titleLine.replace(/^#\s+/, '').trim();
    const titleIndex = lines.findIndex(l => /^#\s+/.test(l));
    const contentLines = lines.slice(titleIndex + 1);
    const content = contentLines.join('\n').trim();
    
    if (!title || !content) return null;
    
    // 检查内容合规性
    if (violatesPolicy(`${title}\n${content}`)) return null;
    
    return {
      id: `md_${mtime.getTime()}_${Math.random().toString(36).slice(2,8)}`,
      title,
      content: attachDisclaimer(content),
      category,
      time: Math.floor(mtime.getTime() / 60000) % (24*60),
      hot: Math.floor(Math.random() * 150 + 10),
      source: 'markdown',
      filename
    };
  } catch (e) {
    console.error('解析markdown文件失败:', filename, e);
    return null;
  }
}

// 基于新闻数据聚合得到 tags 及数量
function aggregateTags(items) {
  const tagToCount = new Map();
  for (const it of items) {
    const tagList = Array.isArray(it.tags) ? it.tags : [];
    for (const t of tagList) {
      tagToCount.set(t, (tagToCount.get(t) || 0) + 1);
    }
  }
  const arr = Array.from(tagToCount.entries()).map(([tag, count]) => ({ tag, count }));
  // 按数量降序，数量相同按字母/拼音升序
  arr.sort((a,b)=> b.count - a.count || String(a.tag).localeCompare(String(b.tag)));
  return arr;
}

// News list with optional filters
app.get('/api/news', (req, res) => {
  const { category, tag, sort = 'composite', page = '1', pageSize = '10' } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const sizeNum = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 10));

  // 从JSON与DB合并
  const jsonItems = readNewsFromJson();
  const db = readJson(NEWS_FILE) || { items: [] };
  const dbItems = db.items || [];

  const merged = [...jsonItems];
  for (const it of dbItems) {
    if (!merged.find(x => x.id === it.id)) merged.push(it);
  }

  // 计算热度：views + likes*3 + comments*4
  for (const it of merged) {
    const views = Number(it.views || 0);
    const likes = Number(it.likes || 0);
    const commentsCount = Number(it.commentsCount || 0);
    it.hot = views + likes * 3 + commentsCount * 4;
  }

  let items = merged;
  const tagFilter = tag || (category && category !== 'all' ? category : '');
  if (tagFilter) {
    items = items.filter(n => Array.isArray(n.tags) && n.tags.includes(tagFilter));
  }

  if (sort === 'latest') {
    items = items.slice().sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
  } else if (sort === 'hot') {
    items = items.slice().sort((a,b) => (b.hot || 0) - (a.hot || 0));
  } else {
    // 默认综合：按 hot 与 createdAt 组合
    items = items.slice().sort((a,b) => (b.hot || 0) - (a.hot || 0) || (b.createdAt || 0) - (a.createdAt || 0));
  }

  const total = items.length;
  const start = (pageNum - 1) * sizeNum;
  const end = start + sizeNum;
  const pageItems = items.slice(start, end);

  // 调试信息
  //console.log('/api/news', items, merged, dbItems, jsonItems);
  res.json({ ok: true, items: pageItems, total, page: pageNum, pageSize: sizeNum });
});

// 获取可用的tag列表
app.get('/api/tags', (req, res) => {
  const jsonItems = readNewsFromJson();
  const db = readJson(NEWS_FILE) || { items: [] };
  const all = [...jsonItems, ...((db.items)||[])];
  const agg = aggregateTags(all);
  //console.log('/api/tags', agg , all , db , jsonItems);
  
  res.json({ ok: true, tags: agg });

});

// Create/Publish news
app.post('/api/news', (req, res) => {
  const { title, content, tags = [], summary = '', image = '', imageAlt = '', author = 'VF News' } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ ok: false, message: 'title 与 content 必填' });
  }
  const db = readJson(NEWS_FILE) || { items: [] };
  const item = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    title,
    content,
    tags: Array.isArray(tags) ? tags : [],
    summary,
    image,
    imageAlt,
    author,
    createdAt: Date.now(),
    views: 0,
    likes: 0,
    commentsCount: 0
  };
  db.items.unshift(item);
  writeJson(NEWS_FILE, db);
  res.json({ ok: true, item });
});

// Single news by id
app.get('/api/news/:id', (req, res) => {
  const db = readJson(NEWS_FILE) || { items: [] };
  const item = (db.items || []).find(n => n.id === req.params.id);
  if (!item) return res.status(404).json({ ok: false, message: 'not found' });
  res.json({ ok: true, item });
});

// Update news (e.g., content or hot)
app.put('/api/news/:id', (req, res) => {
  const { content, title, tags, summary, image, imageAlt, author } = req.body || {};
  const db = readJson(NEWS_FILE) || { items: [] };
  const idx = (db.items || []).findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, message: 'not found' });
  const next = { ...db.items[idx] };
  if (typeof title === 'string') next.title = title;
  if (Array.isArray(tags)) next.tags = tags;
  if (typeof summary === 'string') next.summary = summary;
  if (typeof image === 'string') next.image = image;
  if (typeof imageAlt === 'string') next.imageAlt = imageAlt;
  if (typeof author === 'string') next.author = author;
  if (typeof content === 'string') next.content = content;
  db.items[idx] = next;
  writeJson(NEWS_FILE, db);
  res.json({ ok: true, item: next });
});

// Delete news
app.delete('/api/news/:id', (req, res) => {
  const db = readJson(NEWS_FILE) || { items: [] };
  const before = db.items.length;
  db.items = db.items.filter(n => n.id !== req.params.id);
  writeJson(NEWS_FILE, db);
  res.json({ ok: true, removed: before - db.items.length });
});

// 互动统计：浏览 +1
app.post('/api/news/:id/view', (req, res) => {
  const db = readJson(NEWS_FILE) || { items: [] };
  const idx = (db.items || []).findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, message: 'not found' });
  db.items[idx].views = Number(db.items[idx].views || 0) + 1;
  writeJson(NEWS_FILE, db);
  res.json({ ok: true, views: db.items[idx].views });
});

// 点赞 +1 / -1（可选）
app.post('/api/news/:id/like', (req, res) => {
  const { op = 'inc' } = req.body || {};
  const db = readJson(NEWS_FILE) || { items: [] };
  const idx = (db.items || []).findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, message: 'not found' });
  const cur = Number(db.items[idx].likes || 0);
  db.items[idx].likes = op === 'dec' ? Math.max(0, cur - 1) : cur + 1;
  writeJson(NEWS_FILE, db);
  res.json({ ok: true, likes: db.items[idx].likes });
});

// 评论计数 +1（可扩展为存储评论内容）
app.post('/api/news/:id/comment', (req, res) => {
  const db = readJson(NEWS_FILE) || { items: [] };
  const idx = (db.items || []).findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, message: 'not found' });
  db.items[idx].commentsCount = Number(db.items[idx].commentsCount || 0) + 1;
  writeJson(NEWS_FILE, db);
  res.json({ ok: true, commentsCount: db.items[idx].commentsCount });
});

// Import markdown files from /server/newslog into news
app.post('/api/import-news', (req, res) => {
  try {
    if (!fs.existsSync(NEWSLOG_DIR)) return res.json({ ok: true, imported: 0, items: [] });
    const files = fs.readdirSync(NEWSLOG_DIR).filter(f => /\.json$/i.test(f));
    const newsDb = readJson(NEWS_FILE) || { items: [] };
    let imported = 0; const added = [];
    files.forEach(fn => {
      const full = path.join(NEWSLOG_DIR, fn);
      const text = fs.readFileSync(full, 'utf-8');
      const parsed = parseJsonToNews(text, fn, fs.statSync(full).mtime, 'general');
      if (!parsed) return;
      newsDb.items.unshift(parsed);
      imported++; added.push(parsed);
    });
    writeJson(NEWS_FILE, newsDb);
    res.json({ ok: true, imported, items: added });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`VF-News backend running at http://localhost:${PORT}`);
});


