<template>
  <view class="stats-panel" v-if="show">
    <view class="stats-header">
      <text class="stats-title">📊 数据统计</text>
      <view class="close-btn" @tap="close">✕</view>
    </view>
    
    <view class="stats-content">
      <!-- 总体统计 -->
      <view class="stats-section">
        <text class="section-title">总体概况</text>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-number">{{stats.totalNews || 0}}</text>
            <text class="stat-label">总新闻数</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{stats.totalCategories || 0}}</text>
            <text class="stat-label">分类数量</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{stats.totalViews || 0}}</text>
            <text class="stat-label">总浏览量</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{stats.totalLikes || 0}}</text>
            <text class="stat-label">总点赞数</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{stats.totalComments || 0}}</text>
            <text class="stat-label">总评论数</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{stats.avgHot || 0}}</text>
            <text class="stat-label">平均热度</text>
          </view>
        </view>
      </view>
      
      <!-- 分类统计 -->
      <view class="stats-section" v-if="stats.categoryStats && stats.categoryStats.length > 0">
        <text class="section-title">分类统计</text>
        <view class="category-list">
          <view 
            v-for="category in stats.categoryStats.slice(0, 10)" 
            :key="category.tag" 
            class="category-item"
          >
            <text class="category-name">{{getCategoryName(category.tag)}}</text>
            <text class="category-count">{{category.count}}</text>
          </view>
        </view>
      </view>
      
      <!-- 热门新闻 -->
      <view class="stats-section" v-if="stats.hottestNews && stats.hottestNews.length > 0">
        <text class="section-title">热门新闻</text>
        <view class="news-list">
          <view 
            v-for="(news, index) in stats.hottestNews.slice(0, 5)" 
            :key="news.id" 
            class="news-item"
            @tap="openNews(news)"
          >
            <text class="news-rank">{{index + 1}}</text>
            <text class="news-title">{{news.title}}</text>
            <text class="news-hot">{{news.hot || 0}}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'StatsPanel',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    stats: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    getCategoryName(tag) {
      const tagMap = { 
        technology:'科技', 
        entertainment:'娱乐', 
        life:'生活', 
        sports:'体育', 
        finance:'财经', 
        anime:'动漫', 
        manga:'漫画', 
        novel:'小说', 
        local:'本地', 
        general:'综合' 
      }
      return tagMap[tag] || tag
    },
    openNews(news) {
      this.$emit('open-news', news)
    }
  }
}
</script>

<style scoped>
.stats-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.stats-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}

.close-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24rpx;
}

.stats-content {
  background: #0d1326;
  border-radius: 24rpx;
  padding: 32rpx;
  max-height: 80vh;
  overflow-y: auto;
  width: 100%;
  max-width: 600rpx;
}

.stats-section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 16rpx;
  display: block;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rpx;
  padding: 20rpx;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #60a5fa;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 22rpx;
  color: #9aa4b2;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rpx;
}

.category-name {
  font-size: 24rpx;
  color: #e5e7eb;
}

.category-count {
  font-size: 24rpx;
  color: #60a5fa;
  font-weight: 600;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.news-item {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12rpx;
  cursor: pointer;
  transition: background 0.2s ease;
}

.news-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.news-rank {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #60a5fa;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 600;
  margin-right: 16rpx;
}

.news-title {
  flex: 1;
  font-size: 24rpx;
  color: #e5e7eb;
  margin-right: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.news-hot {
  font-size: 22rpx;
  color: #f59e0b;
  font-weight: 600;
}
</style>
