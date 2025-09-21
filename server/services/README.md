# 统计服务 (Stats Service)

## 概述

统计服务用于统计新闻信息，包括分类数量、浏览量、点赞数、评论数等数据，为前端提供动态的分类生成和统计展示功能。

## 功能特性

### 1. 分类统计
- 统计每个分类的新闻数量
- 支持从JSON文件和数据库合并数据
- 自动处理无标签新闻（归类为"综合"）

### 2. 总体统计
- 总新闻数量
- 总分类数量
- 总浏览量、点赞数、评论数
- 平均热度计算
- 热门新闻排行
- 最新新闻排行

### 3. 分类详情
- 特定分类的详细统计
- 包含该分类下的所有新闻数据

## API 接口

### GET /api/stats
获取总体统计信息

**响应示例:**
```json
{
  "ok": true,
  "stats": {
    "totalNews": 25,
    "totalCategories": 8,
    "totalViews": 1250,
    "totalLikes": 89,
    "totalComments": 45,
    "avgHot": 156,
    "hottestNews": [...],
    "latestNews": [...],
    "categoryStats": [...]
  }
}
```

### GET /api/stats/categories
获取分类统计信息

**响应示例:**
```json
{
  "ok": true,
  "categories": [
    {
      "tag": "technology",
      "count": 8,
      "news": [...]
    },
    {
      "tag": "entertainment", 
      "count": 6,
      "news": [...]
    }
  ]
}
```

### GET /api/stats/categories/:tag
获取特定分类的详细信息

**响应示例:**
```json
{
  "ok": true,
  "category": {
    "tag": "technology",
    "count": 8,
    "totalViews": 450,
    "totalLikes": 32,
    "totalComments": 18,
    "news": [...]
  }
}
```

## 数据源

统计服务从以下数据源获取新闻数据：

1. **JSON文件** (`server/newslog/` 目录)
   - 根目录下的JSON文件
   - 子目录按分类组织的JSON文件

2. **数据库** (`server/data/news.json`)
   - 手动创建的新闻数据

## 热度计算

热度计算公式：
```
热度 = 浏览量 + 点赞数 × 3 + 评论数 × 4
```

## 使用方式

```javascript
const statsService = require('./services/stats');

// 获取所有新闻
const allNews = statsService.getAllNews();

// 获取分类统计
const categoryStats = statsService.getCategoryStats();

// 获取总体统计
const overallStats = statsService.getOverallStats();

// 获取特定分类详情
const categoryDetail = statsService.getCategoryDetail('technology');
```

## 前端集成

前端通过以下方式使用统计服务：

1. **动态分类生成**: 从 `/api/stats/categories` 获取分类数据
2. **统计面板**: 从 `/api/stats` 获取总体统计信息
3. **分类数量显示**: 在分类标签中显示每个分类的新闻数量

## 测试

运行测试脚本验证API功能：

```bash
node test/test_stats_api.js
```

## 注意事项

1. 统计服务会自动合并JSON文件和数据库中的数据
2. 无标签的新闻会自动归类为"综合"分类
3. 统计数据实时计算，确保数据准确性
4. 支持错误处理，API调用失败时会返回适当的错误信息
