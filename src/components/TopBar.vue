<template>
  <text class="brand">VF News（Demo）-{{ currentSort }}</text>
  <view class="topbar">
<!--    <text class="brand">VF News（Demo）-{{ currentSort }}</text>-->
    <view class="action" title="统计" @tap="openStats">📊</view>
    <view class="search">
      <text class="search-icon">🔍</text> 
      <input 
        class="search-input" 
        v-model="searchQuery" 
        placeholder="搜索热点 / 话题 / 媒体" 
        confirm-type="search" 
        @input="onSearchInput" 
        @confirm="onSearch" 
      />
    </view>


    <view class="action" title="通知">🔔</view>
  </view>
</template>

<script>
export default {
  name: 'TopBar',
  props: {
    currentSort: {
      type: String,
      default: 'home'
    }
  },
  data() {
    return {
      searchQuery: ''
    }
  },
  methods: {
    onSearchInput() {
      this.$emit('search-input', this.searchQuery)
    },
    onSearch() {
      this.$emit('search', this.searchQuery)
    },
    openStats() {
      this.$emit('open-stats')
    }
  }
}
</script>

<style scoped>
.topbar { 
  padding: 18rpx 18rpx 10rpx; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  position: relative;
  z-index: 1;
}
.brand { 
  font-weight: 800; 
  font-size: 36rpx; 
  letter-spacing: 1rpx;
  background: linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6); 
  background-clip: text; 
  -webkit-background-clip: text; 
  color: transparent;
  display:flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.search { 
  flex: 0.5;
  margin: 0 20rpx 0 28rpx; 
  position: relative;
}
.search-icon {
  position: absolute;
  left: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  color: #9aa4b2;
  font-size: 28rpx;
  z-index: 2;
}
.search-input { 
  background:#11172c; 
  border:1rpx solid rgba(148,163,184,.18); 
  border-radius: 24rpx; 
  padding: 20rpx 20rpx 20rpx 72rpx; 
  color:#e5e7eb; 
  font-size: 26rpx;
  width: 100%;
}
.action {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: linear-gradient(145deg, #1a2544, #0f1833);
  border: 1rpx solid rgba(148,163,184,.16);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fbbf24;
  font-size: 32rpx;
}
</style>
