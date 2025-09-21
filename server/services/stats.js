// 统计服务 - 用于统计新闻信息，如分类数量等
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const NEWSLOG_DIR = path.join(__dirname, '..', 'newslog');

// 读取JSON文件
function readJson(file) {
  try { 
    return JSON.parse(fs.readFileSync(file, 'utf-8')); 
  } catch { 
    return null; 
  }
}

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

// 获取所有新闻数据
function getAllNews() {
  const jsonItems = readNewsFromJson();
  const db = readJson(NEWS_FILE) || { items: [] };
  const dbItems = db.items || [];
  
  // 合并数据，避免重复
  const merged = [...jsonItems];
  for (const it of dbItems) {
    if (!merged.find(x => x.id === it.id)) merged.push(it);
  }
  
  return merged;
}

// 统计分类信息
function getCategoryStats() {
  const allNews = getAllNews();
  const categoryStats = new Map();
  
  // 统计每个分类的数量
  allNews.forEach(news => {
    const tags = Array.isArray(news.tags) ? news.tags : [];
    if (tags.length === 0) {
      // 如果没有标签，归类为"综合"
      const general = categoryStats.get('general') || { count: 0, news: [] };
      general.count += 1;
      general.news.push(news);
      categoryStats.set('general', general);
    } else {
      tags.forEach(tag => {
        const existing = categoryStats.get(tag) || { count: 0, news: [] };
        existing.count += 1;
        existing.news.push(news);
        categoryStats.set(tag, existing);
      });
    }
  });
  
  // 转换为数组格式
  const result = Array.from(categoryStats.entries()).map(([tag, data]) => ({
    tag,
    count: data.count,
    news: data.news
  }));
  
  // 按数量降序排序
  result.sort((a, b) => b.count - a.count);
  
  return result;
}

// 获取总体统计信息
function getOverallStats() {
  const allNews = getAllNews();
  const categoryStats = getCategoryStats();
  
  // 计算总浏览量、点赞数、评论数
  const totalViews = allNews.reduce((sum, news) => sum + (news.views || 0), 0);
  const totalLikes = allNews.reduce((sum, news) => sum + (news.likes || 0), 0);
  const totalComments = allNews.reduce((sum, news) => sum + (news.commentsCount || 0), 0);
  
  // 计算平均热度
  const totalHot = allNews.reduce((sum, news) => {
    const views = Number(news.views || 0);
    const likes = Number(news.likes || 0);
    const commentsCount = Number(news.commentsCount || 0);
    return sum + (views + likes * 3 + commentsCount * 4);
  }, 0);
  
  const avgHot = allNews.length > 0 ? Math.round(totalHot / allNews.length) : 0;
  
  // 获取最热门的新闻
  const hottestNews = allNews
    .map(news => ({
      ...news,
      hot: (news.views || 0) + (news.likes || 0) * 3 + (news.commentsCount || 0) * 4
    }))
    .sort((a, b) => b.hot - a.hot)
    .slice(0, 5);
  
  // 获取最新的新闻
  const latestNews = allNews
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 5);
  
  return {
    totalNews: allNews.length,
    totalCategories: categoryStats.length,
    totalViews,
    totalLikes,
    totalComments,
    avgHot,
    hottestNews,
    latestNews,
    categoryStats
  };
}

// 获取分类详情
function getCategoryDetail(tag) {
  const allNews = getAllNews();
  const categoryNews = allNews.filter(news => {
    const tags = Array.isArray(news.tags) ? news.tags : [];
    return tags.includes(tag) || (tag === 'general' && tags.length === 0);
  });
  
  const totalViews = categoryNews.reduce((sum, news) => sum + (news.views || 0), 0);
  const totalLikes = categoryNews.reduce((sum, news) => sum + (news.likes || 0), 0);
  const totalComments = categoryNews.reduce((sum, news) => sum + (news.commentsCount || 0), 0);
  
  return {
    tag,
    count: categoryNews.length,
    totalViews,
    totalLikes,
    totalComments,
    news: categoryNews
  };
}

module.exports = {
  getAllNews,
  getCategoryStats,
  getOverallStats,
  getCategoryDetail
};
