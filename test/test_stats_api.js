// 测试统计API
const http = require('http');

const baseURL = 'http://localhost:5175';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${baseURL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

async function testStatsAPI() {
  console.log('🧪 开始测试统计API...\n');
  
  try {
    // 测试健康检查
    console.log('1. 测试健康检查...');
    const health = await makeRequest('/api/health');
    console.log('✅ 健康检查:', health);
    
    // 测试获取统计信息
    console.log('\n2. 测试获取统计信息...');
    const stats = await makeRequest('/api/stats');
    console.log('✅ 统计信息:', JSON.stringify(stats, null, 2));
    
    // 测试获取分类统计
    console.log('\n3. 测试获取分类统计...');
    const categories = await makeRequest('/api/stats/categories');
    console.log('✅ 分类统计:', JSON.stringify(categories, null, 2));
    
    // 测试获取新闻列表
    console.log('\n4. 测试获取新闻列表...');
    const news = await makeRequest('/api/news');
    console.log('✅ 新闻列表:', `总数: ${news.total}, 当前页: ${news.items.length}`);
    
    // 测试获取标签
    console.log('\n5. 测试获取标签...');
    const tags = await makeRequest('/api/tags');
    console.log('✅ 标签列表:', `标签数量: ${tags.tags.length}`);
    
    console.log('\n🎉 所有API测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testStatsAPI();
