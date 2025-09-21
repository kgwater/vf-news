<template>
  <scroll-view class="tabs" scroll-x>
    <view 
      v-for="c in categories" 
      :key="c.key" 
      :class="['tab', currentCategory===c.key?'active':'']" 
      @tap="switchCategory(c.key)"
    >
<!--      <view v-for = "c in categories" :key="c.key" ></view>-->
<!--      {{c.name}}-->
      {{c.key}}
      <text v-if="typeof c.count==='number' && c.count > 0 && c.key !=='all' " class="count">({{c.count}})</text>
    </view>
  </scroll-view>
</template>

<script>
export default {
  name: 'CategoryTabs',
  props: {
    categories: {
      type: Array,
      default: () => []
    },
    currentCategory: {
      type: String,
      default: 'all'
    }
  },
  methods: {
    switchCategory(key) {
      this.$emit('switch-category', key)
    }
  }
}
</script>


<style scoped>
.tabs { 
  display: flex; 
  gap: 16rpx; 
  padding: 0 32rpx 24rpx; 
  white-space: nowrap;
  overflow-x: auto;
  width: 100%;
  box-sizing: border-box;
}
.tab { 
  display: inline-block; 
  padding: 16rpx 24rpx; 
  font-size: 24rpx;
  border-radius: 999rpx; 
  background:#0f1730; 
  color:#9aa4b2; 
  border:1rpx solid rgba(148,163,184,.16);
  cursor: pointer;
  transition: all .25s ease;
}
.tab.active { 
  //color:#fff;
  //background: linear-gradient(90deg,#2563eb,#7c3aed);
  //border-color: transparent;
  //box-shadow: 0 12rpx 36rpx rgba(124, 58, 237, .35);
}
.tab:hover { 
  color:#fff; 
  background: linear-gradient(90deg,#2563eb,#7c3aed); 
  border-color: transparent;
  box-shadow: 0 12rpx 36rpx rgba(124, 58, 237, .35);
  transform: translateY(-2rpx); 
}
.count {
  font-size: 20rpx;
  color: #60a5fa;
  margin-left: 8rpx;
  opacity: 0.8;
}
</style>
