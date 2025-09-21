<template>
  <scroll-view class="feed" scroll-y @scrolltolower="onReachBottom">
    <!-- 加载骨架屏 -->
    <view v-if="loading && filteredList.length===0">
      <view v-for="n in 4" :key="n" class="card" style="opacity:.6">
        <view class="media" style="background:linear-gradient(90deg,#1e293b,#0b1020);"></view>
        <view class="content">
          <view style="height:28rpx;background:#1f2a44;border-radius:8rpx;margin-bottom:12rpx"></view>
          <view style="height:22rpx;background:#162136;border-radius:8rpx;width:60%"></view>
        </view>
      </view>
    </view>
    
    <!-- 新闻列表 -->
    <view v-for="item in filteredList" :key="item.id" class="card" @tap="openDetail(item)">
      <view class="media">
        <image v-if="item.image" :src="item.image" mode="aspectFill" lazy-load class="media-img"></image>
        <view v-else :style="{height:'100%',background: gradient(item)}"></view>
        <view v-if="item.imageAlt" class="media-overlay">{{item.imageAlt}}</view>
      </view>
      <view class="content">
        <text class="title">{{item.title}}</text>
        <text v-if="item.summary" class="summary">{{item.summary}}</text>
        <view class="meta">
          <text class="tag">{{primaryTagName(item)}}</text>
          <text class="muted">· 热度 {{(item.hot||0)}}</text>
          <text v-if="item.author" class="muted">· {{item.author}}</text>
        </view>
        <view v-if="item.tags && item.tags.length > 0" class="tags">
          <text v-for="tag in item.tags.slice(0, 3)" :key="tag" class="tag-small">#{{tag}}</text>
        </view>
        <view class="actions">
          <view class="action-btn" @tap.stop="likeItem(item)">
            <text class="action-icon">👍</text>
            <text class="action-text">{{item.likes||0}}</text>
          </view>
          <view class="action-btn" @tap.stop="commentItem(item)">
            <text class="action-icon">💬</text>
            <text class="action-text">{{item.commentsCount||0}}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 空状态和加载状态 -->
    <view v-if="!loading && filteredList.length===0" class="empty">
      {{ searchQuery ? '未搜索到相关虚拟新闻' : '当前内容无虚拟新闻' }}
    </view>
    <view v-if="loading && filteredList.length>0" class="loading">加载中...</view>
    <view v-if="loadingMore" class="loading">正在加载更多...</view>
  </scroll-view>
</template>

<script>
export default {
  name: 'NewsList',
  props: {
    list: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    loadingMore: {
      type: Boolean,
      default: false
    },
    searchQuery: {
      type: String,
      default: ''
    }
  },
  computed: {
    filteredList() {
      const q = (this.searchQuery || '').trim()
      if (!q) return this.list
      return this.list.filter(it => (it.title || '').includes(q))
    }
  },
  methods: {
    primaryTagName(item) {
      const first = (item.tags && item.tags[0]) || '综合'
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
      return tagMap[first] || first
    },
    gradient(item) {
      const first = (item.tags && item.tags[0]) || 'general'
      const map = { 
        anime: 'linear-gradient(90deg,#4f46e5,#7c3aed)', 
        manga: 'linear-gradient(90deg,#06b6d4,#8b5cf6)', 
        novel: 'linear-gradient(90deg,#10b981,#06b6d4)', 
        local: 'linear-gradient(90deg,#f59e0b,#ef4444)', 
        technology:'linear-gradient(90deg,#2563eb,#7c3aed)', 
        entertainment:'linear-gradient(90deg,#ec4899,#f59e0b)', 
        life:'linear-gradient(90deg,#10b981,#22d3ee)', 
        sports:'linear-gradient(90deg,#f43f5e,#fb7185)', 
        finance:'linear-gradient(90deg,#22c55e,#16a34a)' 
      }
      return map[first] || 'linear-gradient(90deg,#1e293b,#0f172a)'
    },
    onReachBottom() {
      this.$emit('reach-bottom')
    },
    openDetail(item) {
      this.$emit('open-detail', item)
    },
    likeItem(item) {
      this.$emit('like-item', item)
    },
    commentItem(item) {
      this.$emit('comment-item', item)
    }
  }
}
</script>

<style scoped>
.feed { 
  padding: 0 32rpx 172rpx; 
  overflow-y: auto; 
  height: calc(100% - 320rpx);
}
.card { 
  border-radius: 32rpx; 
  overflow: hidden; 
  margin-bottom: 24rpx; 
  background: #0f172a; 
  border:1rpx solid rgba(148,163,184,.14);
  box-shadow: 0 16rpx 48rpx rgba(15, 23, 42, .12);
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease;
}
.card:hover { 
  transform: translateY(-4rpx); 
  box-shadow: 0 20rpx 56rpx rgba(15, 23, 42, .28); 
}
.media { 
  height: 300rpx; 
  background: linear-gradient(120deg, #1e293b, #0b1020);
  position: relative;
}
.media-img {
  width: 100%;
  height: 100%;
  display: block;
}
.media::after { 
  content: ""; 
  position: absolute; 
  inset: 0; 
  background: linear-gradient(0deg, rgba(0,0,0,.45), rgba(0,0,0,0)); 
}
.content { 
  padding: 24rpx; 
}
.title { 
  font-size: 30rpx; 
  font-weight: 700; 
  line-height: 1.35; 
  margin: 4rpx 0 12rpx;
  color: #f1f5f9;
}
.summary {
  font-size: 24rpx;
  color: #cbd5e1;
  line-height: 1.4;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.media-overlay {
  position: absolute;
  bottom: 12rpx;
  left: 12rpx;
  right: 12rpx;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  text-align: center;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}
.tag-small {
  font-size: 20rpx;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
  padding: 4rpx 8rpx;
  border-radius: 6rpx;
  border: 1rpx solid rgba(96, 165, 250, 0.2);
}
.meta { 
  display: flex; 
  align-items: center; 
  gap: 16rpx; 
  color:#9aa4b2; 
  font-size: 24rpx; 
}
.tag { 
  padding: 4rpx 16rpx; 
  border-radius: 999rpx; 
  background: rgba(37,99,235,.12); 
  color:#93c5fd; 
  border:1rpx solid rgba(59,130,246,.25); 
  font-size: 22rpx;
}
.muted { 
  color:#9aa4b2; 
}
.actions {
  display: flex;
  gap: 24rpx;
  margin-top: 12rpx;
}
.action-btn { 
  border: 0; 
  outline: 0; 
  cursor: pointer;
  opacity: 0.8;
  color: #4e709f; 
  border-radius: 24rpx; 
  padding: 16rpx 12rpx; 
  display: flex; 
  flex-direction: column;
  align-items: center; 
  gap: 12rpx; 
  transition: all .2s ease; 
  font-size: 24rpx;
}
.action-icon { font-size: 26rpx; }
.action-text { font-size: 22rpx; }
.empty, .loading { 
  text-align: center; 
  color:#9aa4b2; 
  padding: 80rpx 0; 
  font-size: 28rpx;
}
</style>
