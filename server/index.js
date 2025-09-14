// Minimal Express backend for VF-News (Virtual Fake News)
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const { generateVirtualNews, testApiKey } = require('./services/ai');

const app = express();
const PORT = process.env.PORT || 5175;

const DATA_DIR = path.join(__dirname, 'data');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const WORLD_FILE = path.join(DATA_DIR, 'worldsetting.json');
const DRAFT_FILE = path.join(DATA_DIR, 'drafts.json');
const NEWSLOG_DIR = path.join(__dirname, 'newslog');

const DISCLAIMER = '内容为AI生成的虚拟新闻，不涉及现实中的一切内容，无任何映射';

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
function violatesPolicy(text) {
  if (!text) return true;
  const forbiddenPatterns = [
    /中国|美国|日本|北京|上海|纽约|东京|伦敦|巴黎|俄罗斯|德国/g, // 现实地名国家（示例）
    /习近平|拜登|泽连斯基|普京|特朗普|马斯克/g, // 现实人物（示例）
    /恐怖|爆炸|炸弹|血腥|色情|强奸|极端主义|ISIS|基地组织/g
  ];
  return forbiddenPatterns.some(re => re.test(text));
}

function attachDisclaimer(text) {
  if (!text) return DISCLAIMER;
  return text.includes(DISCLAIMER) ? text : `${text}\n\n${DISCLAIMER}`;
}

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

// Generate draft via AI
app.post('/api/generate', async (req, res) => {
  try {
    const { apiKey, category = 'general', titleHint, tone, model, length, temperature, baseUrl, customWorld } = req.body || {};
    if (!apiKey) return res.status(400).json({ ok: false, message: '缺少 apiKey' });
    // 将默认设定与用户设定合并（用户设定不落盘，仅参与本次生成）
    const baseWorld = readJson(WORLD_FILE) || {};
    let world = baseWorld;
    if (customWorld && typeof customWorld === 'object') {
      world = { ...baseWorld, ...customWorld };
    }
    const result = await generateVirtualNews({ apiKey, world, model, baseUrl, category, titleHint, tone, length, temperature });
    // policy check before creating draft
    const bodyToCheck = `${result.title}\n${result.content}`;
    if (violatesPolicy(bodyToCheck)) {
      return res.status(400).json({ ok: false, message: 'AI 生成内容不合规，请调整设定后重试' });
    }
    const db = readJson(DRAFT_FILE) || { items: [] };
    const item = {
      id: `d_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      title: result.title,
      content: result.content,
      category,
      createdAt: Date.now()
    };
    db.items.unshift(item);
    writeJson(DRAFT_FILE, db);
    res.json({ ok: true, draft: item });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e.message || e) });
  }
});

// Test API key
app.post('/api/test-api', async (req, res) => {
  try {
    const { apiKey, baseUrl } = req.body || {};
    const r = await testApiKey({ apiKey, baseUrl });
    res.json(r);
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e.message || e) });
  }
});

// Drafts CRUD
app.get('/api/drafts', (req, res) => {
  const db = readJson(DRAFT_FILE) || { items: [] };
  res.json({ ok: true, items: db.items });
});

app.get('/api/drafts/:id', (req, res) => {
  const db = readJson(DRAFT_FILE) || { items: [] };
  const item = (db.items || []).find(d => d.id === req.params.id);
  if (!item) return res.status(404).json({ ok: false, message: 'not found' });
  res.json({ ok: true, item });
});

app.put('/api/drafts/:id', (req, res) => {
  const { title, content, category } = req.body || {};
  const db = readJson(DRAFT_FILE) || { items: [] };
  const idx = (db.items || []).findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, message: 'not found' });
  const next = { ...db.items[idx] };
  if (typeof title === 'string') next.title = title;
  if (typeof category === 'string') next.category = category;
  if (typeof content === 'string') {
    if (violatesPolicy(`${next.title}\n${content}`)) {
      return res.status(400).json({ ok: false, message: '内容不合规：包含现实要素或不允许的主题' });
    }
    next.content = content;
  }
  db.items[idx] = next;
  writeJson(DRAFT_FILE, db);
  res.json({ ok: true, item: next });
});

app.delete('/api/drafts/:id', (req, res) => {
  const db = readJson(DRAFT_FILE) || { items: [] };
  const before = db.items.length;
  db.items = db.items.filter(d => d.id !== req.params.id);
  writeJson(DRAFT_FILE, db);
  res.json({ ok: true, removed: before - db.items.length });
});

// Publish draft -> news
app.post('/api/drafts/:id/publish', (req, res) => {
  const { hot = 0 } = req.body || {};
  const drafts = readJson(DRAFT_FILE) || { items: [] };
  const idx = (drafts.items || []).findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, message: 'draft not found' });
  const draft = drafts.items[idx];
  if (violatesPolicy(`${draft.title}\n${draft.content}`)) {
    return res.status(400).json({ ok: false, message: '内容不合规：包含现实要素或不允许的主题' });
  }
  const newsDb = readJson(NEWS_FILE) || { items: [] };
  const item = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    title: draft.title,
    content: attachDisclaimer(draft.content),
    category: draft.category || 'general',
    time: Math.floor(Date.now()/60000) % (24*60),
    hot: Number(hot) || 0
  };
  newsDb.items.unshift(item);
  writeJson(NEWS_FILE, newsDb);
  // 同步保存为 Markdown 到 newslog
  try {
    if (!fs.existsSync(NEWSLOG_DIR)) fs.mkdirSync(NEWSLOG_DIR, { recursive: true });
    const safeTitle = String(item.title || 'news').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 60);
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const md = `# ${item.title}\n\n${item.content}\n`;
    fs.writeFileSync(path.join(NEWSLOG_DIR, `${ts}_${safeTitle}.md`), md);
  } catch (e) { /* 忽略写入失败，不影响主流程 */ }
  // remove draft
  drafts.items.splice(idx, 1);
  writeJson(DRAFT_FILE, drafts);
  res.json({ ok: true, item });
});

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

// 解析JSON文件为新闻对象
function parseJsonToNews(content, filename, mtime, category) {
  try {
    const data = JSON.parse(content);
    
    // 验证必需字段
    if (!data.title || !data.content) {
      console.warn('JSON文件缺少必需字段:', filename);
      return null;
    }
    
    // 检查内容合规性
    if (violatesPolicy(`${data.title}\n${data.content}`)) {
      console.warn('JSON文件内容不合规:', filename);
      return null;
    }
    
    // 构建新闻对象
    const newsItem = {
      id: data.id || `json_${mtime.getTime()}_${Math.random().toString(36).slice(2,8)}`,
      title: data.title,
      content: data.content,
      category: data.category || category,
      time: data.publishTime ? Math.floor(new Date(data.publishTime).getTime() / 1000) : Math.floor(mtime.getTime() / 1000),
      hot: data.hot || Math.floor(Math.random() * 150 + 10),
      source: 'json',
      filename,
      // 新增字段
      summary: data.summary || '',
      image: data.image || '',
      imageAlt: data.imageAlt || '',
      author: data.author || 'VF News',
      tags: data.tags || [],
      disclaimer: data.disclaimer || '内容为AI生成的虚拟新闻，不涉及现实中的一切内容，无任何映射'
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

// 获取所有可用的tag列表
function getAvailableTags() {
  const tags = ['general']; // 默认包含general（无分区）
  
  try {
    if (!fs.existsSync(NEWSLOG_DIR)) {
      return tags;
    }
    
    const subdirs = fs.readdirSync(NEWSLOG_DIR).filter(item => {
      const itemPath = path.join(NEWSLOG_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    });
    
    tags.push(...subdirs);
    
    // 添加一些默认分类，即使没有对应的文件夹
    const defaultTags = ['科技', '娱乐', '生活', '体育', '财经', '教育', '健康', '旅游'];
    defaultTags.forEach(tag => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });
  } catch (e) {
    console.error('获取tag列表失败:', e);
  }
  
  return tags;
}

// News list with optional filters
app.get('/api/news', (req, res) => {
  const { category, sort = 'composite' } = req.query;
  
  // 优先从JSON文件读取，然后合并数据库中的新闻
  const jsonItems = readNewsFromJson();
  const db = readJson(NEWS_FILE) || { items: [] };
  const dbItems = db.items || [];
  
  console.log(`API请求: category=${category}, sort=${sort}`);
  console.log(`JSON新闻数量: ${jsonItems.length}`);
  console.log(`数据库新闻数量: ${dbItems.length}`);
  
  // 合并所有新闻，去重（基于标题）
  const allItems = [...jsonItems];
  dbItems.forEach(dbItem => {
    if (!allItems.find(item => item.title === dbItem.title)) {
      allItems.push(dbItem);
    }
  });
  
  console.log(`合并后新闻数量: ${allItems.length}`);
  
  let items = allItems;
  
  // 按分类筛选
  if (category && category !== 'all') {
    items = items.filter(n => n.category === category);
    console.log(`分类筛选后数量: ${items.length}`);
  }
  
  // 排序
  if (sort === 'latest') {
    items = items.slice().sort((a,b) => (b.time || 0) - (a.time || 0));
    console.log('按最新排序');
  } else if (sort === 'hot') {
    items = items.slice().sort((a,b) => (b.hot || 0) - (a.hot || 0));
    console.log('按热度排序');
  }
  
  console.log(`最终返回新闻数量: ${items.length}`);
  res.json({ ok: true, items });
});

// 获取可用的tag列表
app.get('/api/tags', (req, res) => {
  const tags = getAvailableTags();
  console.log('返回的标签列表:', tags);
  res.json({ ok: true, tags });
});

// Create/Publish news
app.post('/api/news', (req, res) => {
  const { title, content, category = 'general', hot = 0 } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ ok: false, message: 'title 与 content 必填' });
  }
  const bodyToCheck = `${title}\n${content}`;
  if (violatesPolicy(bodyToCheck)) {
    return res.status(400).json({ ok: false, message: '内容不合规：包含现实要素或不允许的主题' });
  }
  const db = readJson(NEWS_FILE) || { items: [] };
  const item = {
    id: `n_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    title,
    content: attachDisclaimer(content),
    category,
    time: Math.floor(Date.now()/60000) % (24*60), // 简化：分钟数做“新近度”
    hot: Number(hot) || 0
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
  const { content, hot, title, category } = req.body || {};
  const db = readJson(NEWS_FILE) || { items: [] };
  const idx = (db.items || []).findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, message: 'not found' });
  const next = { ...db.items[idx] };
  if (typeof title === 'string') next.title = title;
  if (typeof category === 'string') next.category = category;
  if (typeof content === 'string') {
    if (violatesPolicy(`${next.title}\n${content}`)) {
      return res.status(400).json({ ok: false, message: '内容不合规：包含现实要素或不允许的主题' });
    }
    next.content = attachDisclaimer(content);
  }
  if (hot != null) next.hot = Number(hot) || 0;
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

// Import markdown files from /server/newslog into news
app.post('/api/import-news', (req, res) => {
  try {
    if (!fs.existsSync(NEWSLOG_DIR)) return res.json({ ok: true, imported: 0, items: [] });
    const files = fs.readdirSync(NEWSLOG_DIR).filter(f => /\.md$/i.test(f));
    const newsDb = readJson(NEWS_FILE) || { items: [] };
    let imported = 0; const added = [];
    files.forEach(fn => {
      const full = path.join(NEWSLOG_DIR, fn);
      const text = fs.readFileSync(full, 'utf-8');
      const lines = text.split(/\r?\n/);
      let title = lines.find(l => /^#\s+/.test(l)) || lines[0] || '未命名';
      title = title.replace(/^#\s+/, '').trim();
      const content = lines.slice(lines.findIndex(l => /^#\s+/.test(l)) + 1).join('\n').trim();
      if (!title || !content) return;
      if (violatesPolicy(`${title}\n${content}`)) return; // 跳过不合规
      const item = {
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        title,
        content: attachDisclaimer(content),
        category: 'novel',
        time: Math.floor(Date.now()/60000) % (24*60),
        hot: Math.floor(Math.random()*150 + 10)
      };
      newsDb.items.unshift(item);
      imported++; added.push(item);
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


