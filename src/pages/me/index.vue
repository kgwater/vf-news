<template>
  <view class="page">
    <!-- 头部品牌区域 -->
    <view class="header">
      <view class="brand-logo">
        <text class="brand-text">VF News</text>
        <text class="brand-subtitle">虚拟新闻阅读器</text>
      </view>
    </view>

    <!-- 功能介绍 -->
    <view class="section">
      <text class="title">📱 应用介绍</text>
      <text class="content">VF News 是一款专注于虚拟新闻阅读的小程序。我们提供来自不同领域的虚拟新闻内容，包括科技、娱乐、生活等多个分类，为用户带来丰富的阅读体验。</text>
    </view>

    <!-- 功能特色 -->
    <view class="section">
      <text class="title">✨ 功能特色</text>
      <view class="feature-list">
        <view class="feature-item">
          <text class="feature-icon">📰</text>
          <view class="feature-content">
            <text class="feature-title">虚拟新闻阅读</text>
            <text class="feature-desc">提供多样化的虚拟新闻内容</text>
          </view>
        </view>
        <view class="feature-item">
          <text class="feature-icon">🏷️</text>
          <view class="feature-content">
            <text class="feature-title">分类筛选</text>
            <text class="feature-desc">支持按标签分类浏览新闻</text>
          </view>
        </view>
        <view class="feature-item">
          <text class="feature-icon">🔍</text>
          <view class="feature-content">
            <text class="feature-title">智能搜索</text>
            <text class="feature-desc">快速找到感兴趣的新闻内容</text>
          </view>
        </view>
        <view class="feature-item">
          <text class="feature-icon">📱</text>
          <view class="feature-content">
            <text class="feature-title">移动优化</text>
            <text class="feature-desc">专为移动端设计的阅读体验</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 免责声明 -->
    <view class="section">
      <text class="title">⚠️ 免责声明</text>
      <text class="content">本应用中的所有新闻内容均为虚拟创作，不涉及现实中的任何真实事件、人物或组织。所有内容仅供娱乐和阅读体验，请勿将其与现实情况混淆。</text>
    </view>

    <!-- 版本信息 -->
    <view class="section">
      <text class="title">ℹ️ 版本信息</text>
      <view class="version-info">
        <text class="version-item">版本号：2.9.20</text>
        <text class="version-item">更新时间：2025年9月</text>
        <text class="version-item">开发者：Water</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data(){
    return {
      // 关于页面不需要复杂的数据
    }
  },
  onLoad(){
    // 关于页面加载时的逻辑
  }
}
</script>

<style>
.page{ 
  padding: 24rpx; 
  color:#e5e7eb; 
  background:#0b1020; 
  min-height:100vh 
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
  padding: 40rpx 0;
}

.brand-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.brand-text {
  font-size: 48rpx;
  font-weight: 800;
  background: linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  letter-spacing: 2rpx;
}

.brand-subtitle {
  font-size: 28rpx;
  color: #9aa4b2;
  font-weight: 500;
}

.section{ 
  margin-bottom: 24rpx; 
  background:#0f172a; 
  border:1rpx solid rgba(148,163,184,.2); 
  border-radius:16rpx; 
  padding:24rpx 
}

.title{ 
  font-weight:700; 
  margin-bottom: 16rpx; 
  display:block;
  font-size: 32rpx;
  color: #f1f5f9;
}

.content {
  font-size: 28rpx;
  line-height: 1.6;
  color: #cbd5e1;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 16rpx;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 12rpx;
  border: 1rpx solid rgba(148,163,184,.1);
}

.feature-icon {
  font-size: 32rpx;
  margin-top: 4rpx;
}

.feature-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.feature-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #e5e7eb;
}

.feature-desc {
  font-size: 24rpx;
  color: #9aa4b2;
  line-height: 1.4;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.version-item {
  font-size: 26rpx;
  color: #9aa4b2;
  padding: 8rpx 0;
  border-bottom: 1rpx solid rgba(148,163,184,.1);
}

.version-item:last-child {
  border-bottom: none;
}
</style>

