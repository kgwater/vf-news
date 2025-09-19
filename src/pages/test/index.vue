<template>
  <view class="page">
    <!-- 底部排序导航 -->
    <view class="bottom">
      <view class="nav">
        <view :class="['nav-btn']">
          <text class="nav-icon">  状态 </text>
          <text>{{currentSort}}</text>
        </view>
        <view :class="['nav-btn', currentSort==='home'?'active':'']" @tap="switchSort('home')">
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
        
      </view>
    </view>
  </view>

</template>
<script>

  export default {
    data() {
    return {
      baseURL: 'http://localhost:5175',
      categories: [
        { key: 'all', name: '全部', count: 0 }
      ], // 由后端聚合返回 tags 动态填充
      currentCategory: 'all',
      currentSort: 'home',
      list: [],
      loading: false,
      loadingMore: false,
      page: 1,
      pageSize: 10,
      total: 0,
      q: '',
      showDetail: false,
      detail: {},
      detailHtml: [],
      feedHeight: 1000,
    }
  },
  methods:{
    switchSort(key){
        if (key !== 'home' && key !== 'latest' && key !== 'hot') return
        const next = String(key)
        // 永远只保留一个高亮：更新 currentSort 即可

        this.currentSort = next
        this.list = []
        console.log('switchSort:', next)
        console.log('this.currenSort===',String(this.currentSort==='home'),String(this.currentSort==='latest'),String(this.currentSort==='hot'),String(this.currentSort==='test'))
        this.fetchNews()
      }
    }
  }
</script>




<style>

.page { 
  background: linear-gradient(180deg, #0c1226 0%, #0a0f21 100%); 
  min-height: 100vh; 
  color: #e5e7eb; 
}

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
.page .bottom .nav .nav-btn.active { 
  color: #000000; /* 明确色值，避免继承覆盖 */
  background: linear-gradient(180deg, rgba(213, 102, 102, 0.16), rgba(199, 173, 173, 0.633)); 
  box-shadow: inset 0 0 0 1rpx rgba(59,130,246,.35); 
  opacity: 1; /* 覆盖默认的 opacity: 0.8 */
}
.nav-btn.active text { color: #fff; }
.nav-btn:hover { 
  transform: translateY(-2rpx); 
}
.nav-icon {
  font-size: 36rpx;
}
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
}
.search { 
  flex: 1; 
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
  color:#fff; 
  background: linear-gradient(90deg,#2563eb,#7c3aed); 
  border-color: transparent;
  box-shadow: 0 12rpx 36rpx rgba(124, 58, 237, .35);
}
.tab:hover { 
  transform: translateY(-2rpx); 
}

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
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 12rpx;
  background: rgba(148,163,184,.1);
  border: 1rpx solid rgba(148,163,184,.18);
  border-radius: 999rpx;
  color: #cbd5e1;
}
.action-icon { font-size: 26rpx; }
.action-text { font-size: 22rpx; }
.empty, .loading { 
  text-align: center; 
  color:#9aa4b2; 
  padding: 80rpx 0; 
  font-size: 28rpx;
}


.modal { position: fixed; inset: 0; background: rgba(2,6,23,.6); display: flex; align-items: flex-end; }
.sheet { width: 100%; max-height: 78vh; background:#0d1326; border-top-left-radius: 24rpx; border-top-right-radius: 24rpx; border-top:1rpx solid rgba(148,163,184,.2); }
.handle { width: 100rpx; height: 8rpx; border-radius: 8rpx; background: rgba(148,163,184,.35); margin: 16rpx auto; }
.sheet-body { max-height: 70vh; padding: 0 24rpx 24rpx; }
.detail-title { font-size: 32rpx; font-weight: 700; margin-bottom: 12rpx; }
.detail-content { color:#cbd5e1; font-size: 26rpx; line-height: 1.7; white-space: pre-wrap; }
</style>