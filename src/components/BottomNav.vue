<template>
  <view class="bottom">
    <view class="nav">
      <view :class="['nav-btn', currentSort=='home'?'active':'']" @tap="switchSort('home')">
        <text class="nav-icon">🏠</text>
        <text>综合</text>
      </view>
      <view :class="['nav-btn', currentSort==='latest'?'active':'']" @tap="switchSort('latest')">
        <text class="nav-icon">🆕</text>
        <text>最新</text>
      </view>
      <view :class="['nav-btn', currentSort==='hot'?'active':'']" @tap="switchSort('hot')">
        <text class="nav-icon">🔥</text>
        <text>热门</text>
      </view>
      <view class="nav-btn" @tap="openAbout">
        <text class="nav-icon">📖</text>
        <text>关于</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'BottomNav',
  props: {
    currentSort: {
      type: String,
      default: 'home'
    }
  },
  methods: {
    switchSort(key) {
      if (key !== 'home' && key !== 'latest' && key !== 'hot') return
      this.$emit('switch-sort', key)
    },
    openAbout() {
      this.$emit('open-about')
    }
  }
}
</script>

<style scoped>
.bottom { 
  position: fixed; 
  left: 0; 
  right: 0; 
  bottom: 0; 
  padding: 20rpx 28rpx 36rpx; 
  backdrop-filter: blur(20rpx);
  background: linear-gradient(180deg, rgba(2,6,23,0), rgba(2,6,23,.55) 25%, rgba(2,6,23,.85)); 
}
.nav { 
  background: #0d1429; 
  border: 1rpx solid rgba(148,163,184,.16); 
  border-radius: 36rpx; 
  padding: 20rpx; 
  display: grid; 
  grid-template-columns: repeat(4, 1fr); 
  gap: 16rpx;
}
.nav-btn { 
  border: 0; 
  outline: 0; 
  cursor: pointer;
  background: transparent; 
  color: #9aa4b2; 
  border-radius: 24rpx; 
  padding: 16rpx 12rpx; 
  display: flex; 
  flex-direction: column;
  align-items: center; 
  gap: 12rpx; 
  transition: all .2s ease; 
  font-size: 24rpx;
}
.nav-btn.active { 
  /* color: #fff !important;
  background: linear-gradient(180deg, rgba(37,99,235,.16), rgba(37,99,235,.08));
  box-shadow: inset 0 0 0 1rpx rgba(59,130,246,.35); */
}
.nav-btn.active text { 
  /* color: #fff !important;  */
}
.nav-btn:hover { 
  color: #fff !important;
  background: linear-gradient(180deg, rgba(37,99,235,.16), rgba(37,99,235,.08));
  box-shadow: inset 0 0 0 1rpx rgba(59,130,246,.35);
  text-emphasis-color: #fff;
  transform: translateY(-2rpx); 
}
.nav-icon {
  font-size: 36rpx;
}
</style>
