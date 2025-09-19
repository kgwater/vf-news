<template>
  <view class="page">
    <!-- 顶部栏 -->
    <view class="topbar">
      <text class="brand">VF News（Demo）-{{ currentSort }}</text>
      <view class="search">
        <text class="search-icon">🔍</text> 
        <input class="search-input" v-model="q" placeholder="搜索热点 / 话题 / 媒体" confirm-type="search" @input="onSearchInput" @confirm="onSearch" />
      </view>
      <view class="action" title="通知">🔔</view>
    </view>

    <!-- 分类（与排序独立） -->
    <scroll-view class="tabs" scroll-x>
      <view v-for="c in categories" :key="c.key" :class="['tab', currentCategory===c.key?'active':'']" @tap="switchCategory(c.key)">
        {{c.name}}
        <!-- <text v-if="typeof c.count==='number'">({{c.count}})</text> -->
      </view>
    </scroll-view>

    <!-- 列表 -->
    <scroll-view class="feed" scroll-y @scrolltolower="onReachBottom">
      <view v-if="loading && filteredList.length===0">
        <view v-for="n in 4" :key="n" class="card" style="opacity:.6">
          <view class="media" style="background:linear-gradient(90deg,#1e293b,#0b1020);"></view>
          <view class="content">
            <view style="height:28rpx;background:#1f2a44;border-radius:8rpx;margin-bottom:12rpx"></view>
            <view style="height:22rpx;background:#162136;border-radius:8rpx;width:60%"></view>
          </view>
        </view>
      </view>
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
      <view v-if="!loading && filteredList.length===0" class="empty">{{ q ? '未搜索到相关虚拟新闻' : '当前内容无虚拟新闻' }}</view>
      <view v-if="loading && filteredList.length>0" class="loading">加载中...</view>
      <view v-if="loadingMore" class="loading">正在加载更多...</view>
    </scroll-view>

    <!-- 底部排序导航 -->
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

    <!-- 详情抽屉 -->
    <view class="modal" v-if="showDetail" @tap="closeDetail">
      <view class="sheet" @tap.stop>
        <view class="handle"></view>
        <scroll-view scroll-y class="sheet-body">
          <text class="detail-title">{{detail.title}}</text>
          <rich-text :nodes="detailHtml"></rich-text>
        </scroll-view>
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
        { key: 'all', name: '全部', count: 0 },
        {key: '全息技术',name: '全息技术', count: 2},
        {key: '全息技术',name: '虚拟城市', count: 2},
        {key: '全息技术',name: '城市管理', count: 1},
        {key: '全息技术',name: '地标', count: 1}
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
  computed: {
    filteredList(){
      const q = (this.q||'').trim()
      if (!q) return this.list
      return this.list.filter(it => (it.title||'').includes(q))
    }
  },
  onLoad() {
    this.calcFeedHeight()
    // 先拉新闻保证有数据可用于降级聚合标签，再拉后端 tags 覆盖
    this.fetchNews()
    this.fetchTags()
  },
  onPullDownRefresh() {
    this.fetchNews()
    setTimeout(()=>{ uni.stopPullDownRefresh() }, 300)
  },
  methods: {
    
    calcFeedHeight() {
      // 简化：以窗口高度换算，留出顶部与底部空间
      try {
        const info = uni.getSystemInfoSync()
        const vh = info.windowHeight
        this.feedHeight = Math.floor(vh / 750 * 750) - 300
      } catch(e) {}
    },
    primaryTagName(item){
      const first = (item.tags && item.tags[0]) || '综合'
      const tagMap = { technology:'科技', entertainment:'娱乐', life:'生活', sports:'体育', finance:'财经', anime:'动漫', manga:'漫画', novel:'小说', local:'本地', general:'综合' }
      return tagMap[first] || first
    },
    // fetchTags(){
    //   uni.request({
    //     url: `${this.baseURL}/api/tags`,
    //     method: 'GET',
    //     success: (res)=>{
    //       if (res.data && res.data.ok && res.data.tags) {
    //         const tags = res.data.tags;
    //         console.log('获取到的标签:', tags);
    //         this.categories = [
    //           { key: 'all', name: '全部' },
    //           ...tags.map(tag => ({
    //             key: tag,
    //             name: tag === 'general' ? '综合' : tag
    //           }))
    //         ];
    //         console.log('更新后的分类:', this.categories);
    //       }
    //     },
    //     fail: ()=>{
    //       console.log('获取标签失败，使用默认标签');
    //       // 使用默认分类
    //       this.categories = [
    //         { key: 'all', name: '全部' },
    //         { key: '科技', name: '科技' },
    //         { key: '娱乐', name: '娱乐' },
    //         { key: '生活', name: '生活' },
    //         { key: '体育', name: '体育' },
    //         { key: '财经', name: '财经' },
    //         { key: 'general', name: '综合' }
    //       ];
    //     }
    //   })
    // },
    // 2025-9-14
    fetchTags(){
      uni.request({
        url: `${this.baseURL}/api/tags`,
        method: 'GET',
        success: (res)=>{
          if (res.data && res.data.ok && Array.isArray(res.data.tags)) {
            const tags = res.data.tags; // 可能是 []
            console.log('获取到的标签:', tags);
            if (tags.length > 0 && typeof tags[0] === 'object' && ('tag' in tags[0])) {
              const tagMap = { technology:'科技', entertainment:'娱乐', life:'生活', sports:'体育', finance:'财经', anime:'动漫', manga:'漫画', novel:'小说', local:'本地', general:'综合' }
              const newCategories = tags.map(t => ({ key: t.tag, name: tagMap[t.tag] || t.tag, count: t.count }))
              this.categories = [{ key:'all', name:'全部', count: newCategories.reduce((s,c)=>s+c.count,0) } , ...newCategories]
            } else if (tags.length > 0 && typeof tags[0] === 'string') { // 若后端仅返回字符串数组
              const tagMap = { technology:'科技', entertainment:'娱乐', life:'生活', sports:'体育', finance:'财经', anime:'动漫', manga:'漫画', novel:'小说', local:'本地', general:'综合' }
              const newCategories = tags.map(tag => ({ key: tag, name: tagMap[tag] || tag }))
              this.categories = [{ key:'all', name:'全部' }, ...newCategories]
            }
          } else {
            console.log('标签数据为空，使用默认分类');
            // 保持默认分类
          }
        },
        fail: ()=>{
          console.log('获取标签失败，使用默认分类');
          // 保持已设置的默认分类
        }
      })
    },
    // 当 /api/tags 为空时，基于一次性拉取的新闻生成标签（降级方案）
    ensureTagsFromNews(items){
      if (this.categories.length>1) return
      const counts = new Map()
      ;(items||[]).forEach(it=>{
        (it.tags||[]).forEach(t=>counts.set(t,(counts.get(t)||0)+1))
      })
      const tagMap = { technology:'科技', entertainment:'娱乐', life:'生活', sports:'体育', finance:'财经', anime:'动漫', manga:'漫画', novel:'小说', local:'本地', general:'综合' }
      const arr = Array.from(counts.entries()).map(([tag,count])=>({ key:tag, name:tagMap[tag]||tag, count }))
      arr.sort((a,b)=> b.count-a.count || String(a.key).localeCompare(String(b.key)))
      const total = arr.reduce((s,c)=>s+c.count,0)
      this.categories = [{ key:'all', name:'全部', count: total }, ...arr]
    },

    gradient(item){
      const first = (item.tags && item.tags[0]) || 'general'
      const map = { anime: 'linear-gradient(90deg,#4f46e5,#7c3aed)', manga: 'linear-gradient(90deg,#06b6d4,#8b5cf6)', novel: 'linear-gradient(90deg,#10b981,#06b6d4)', local: 'linear-gradient(90deg,#f59e0b,#ef4444)', technology:'linear-gradient(90deg,#2563eb,#7c3aed)', entertainment:'linear-gradient(90deg,#ec4899,#f59e0b)', life:'linear-gradient(90deg,#10b981,#22d3ee)', sports:'linear-gradient(90deg,#f43f5e,#fb7185)', finance:'linear-gradient(90deg,#22c55e,#16a34a)' }
      return map[first] || 'linear-gradient(90deg,#1e293b,#0f172a)'
    },
    // fetchNews(append=false){
    //   this.loading = true
    //   const category = this.currentCategory
    //   const sort = this.currentSort==='home' ? 'composite' : this.currentSort
    //   console.log(`请求新闻: category=${category}, sort=${sort}`)
    //   uni.request({
    //     url: `${this.baseURL}/api/news`,
    //     method: 'GET',
    //     data: { category, sort },
    //     success: (res)=>{
    //       const items = (res.data && res.data.items) || []
    //       console.log(`收到新闻数量: ${items.length}`)
    //       console.log('新闻列表:', items.map(item => item.title))
    //       this.list = append ? this.list.concat(items) : items
    //     },
    //     fail: ()=>{
    //       console.log('请求新闻失败')
    //       this.list = []
    //     },
    //     complete: ()=>{
    //       this.loading = false
    //     }
    //   })
    // },
    // 2025-9-14
    fetchNews(append=false){
      if (!append) { this.page = 1; this.total = 0 }
      this.loading = !append
      this.loadingMore = append
      const tag = this.currentCategory !== 'all' ? this.currentCategory : ''
      const sortMap = { 'home':'composite', 'latest':'latest', 'hot':'hot' }
      const sort = sortMap[this.currentSort] || 'composite'
      const page = this.page
      const pageSize = this.pageSize
      uni.request({
        url: `${this.baseURL}/api/news`,
        method: 'GET',
        data: { tag, sort, page, pageSize },
        success: (res)=>{
          const items = (res.data && res.data.items) || []
          this.total = (res.data && res.data.total) || 0
          this.list = append ? this.list.concat(items) : items
          this.page = append ? (this.page + 1) : 2
          if (!append && this.categories.length===1) this.ensureTagsFromNews(items)
        },
        fail: ()=>{
          if (!append) this.list = []
        },
        complete: ()=>{
          this.loading = false
          this.loadingMore = false
        }
      })
    },
    // ... 其他方法 ...

    onReachBottom(){
      if (this.loadingMore) return
      if (this.list.length >= this.total && this.total > 0) return
      this.fetchNews(true)
    },
    // switchCategory(key){
    //   this.currentCategory = key
    //   this.fetchNews()
    // },
    // 2025-9-14
    switchCategory(key){
      this.currentCategory = key
      this.list = []
      console.log('switchCategory', key)
      this.fetchNews()
    },


    // switchSort(key){
    //   this.currentSort = key
    //   if (key !== 'about') {
    //     this.fetchNews()
    //   }
    // },
    //2025-9-14
    switchSort(key){
      if (key !== 'home' && key !== 'latest' && key !== 'hot') return
      this.currentSort = key
      this.list = []
      this.fetchNews()
    },
    onSearch(){
      // 简易前端过滤：不请求后端
      // 可拓展为携带 q 参数的后端搜索
    },
    onSearchInput(){ /* 响应式通过 computed 过滤 */ },
    openDetail(item){
      this.detail = item
      this.detailHtml = this.markdownToNodes(item.content || '')
      this.showDetail = true
      // 浏览计数
      this.viewItem(item)
    },
    closeDetail(){
      this.showDetail = false
    },
    openAbout(){
      uni.navigateTo({ url: '/pages/me/index' })
    }
    ,markdownToNodes(md){
      // 轻量 markdown -> nodes：依赖后端已含 HTML？此处用极简替换
      // 若运行在H5可引入 marked 直接转；在小程序端采用简易替换
      try {
        // 基于最常见语法做非常简化的转换
        let html = md
          .replace(/^###\s(.+)$/gm,'<h3 style="font-size:28rpx;font-weight:600;margin:20rpx 0 12rpx;color:#e5e7eb;">$1</h3>')
          .replace(/^##\s(.+)$/gm,'<h2 style="font-size:32rpx;font-weight:700;margin:24rpx 0 16rpx;color:#f1f5f9;">$1</h2>')
          .replace(/^#\s(.+)$/gm,'<h1 style="font-size:36rpx;font-weight:800;margin:28rpx 0 20rpx;color:#ffffff;">$1</h1>')
          .replace(/\*\*(.+?)\*\*/g,'<b style="font-weight:700;color:#fbbf24;">$1</b>')
          .replace(/\*(.+?)\*/g,'<i style="font-style:italic;color:#a78bfa;">$1</i>')
          .replace(/`([^`]+)`/g,'<code style="background:#1e293b;color:#10b981;padding:4rpx 8rpx;border-radius:6rpx;font-family:monospace;">$1</code>')
          .replace(/!\[(.*?)\]\((.*?)\)/g,'<img alt="$1" src="$2" style="max-width:100%;border-radius:12rpx;margin:16rpx 0;display:block;"/>')
          .replace(/\[(.*?)\]\((.*?)\)/g,'<a href="$2" style="color:#60a5fa;text-decoration:underline;">$1</a>')
          .replace(/^-\s(.+)$/gm,'<li style="margin:8rpx 0;color:#cbd5e1;">$1</li>')
          .replace(/^>\s(.+)$/gm,'<blockquote style="border-left:4rpx solid #3b82f6;padding-left:16rpx;margin:16rpx 0;color:#94a3b8;font-style:italic;">$1</blockquote>')
          .replace(/\n\n/g,'<br/><br/>')
          .replace(/\n/g,'<br/>')
        return html
      } catch(e){
        return md
      }
    }
    ,viewItem(item){
      if (!item || !item.id) return
      uni.request({
        url: `${this.baseURL}/api/news/${item.id}/view`,
        method: 'POST',
        data: {},
        success: (res)=>{
          item.views = (res.data && res.data.views) || ((item.views||0)+1)
          // 可能影响 hot 的重新显示，简单本地更新
          item.hot = (item.views||0) + (item.likes||0)*3 + (item.commentsCount||0)*4
        }
      })
    }
    ,likeItem(item){
      if (!item || !item.id) return
      uni.request({
        url: `${this.baseURL}/api/news/${item.id}/like`,
        method: 'POST',
        data: { op: 'inc' },
        success: (res)=>{
          item.likes = (res.data && res.data.likes) || ((item.likes||0)+1)
          item.hot = (item.views||0) + (item.likes||0)*3 + (item.commentsCount||0)*4
        }
      })
    }
    ,commentItem(item){
      if (!item || !item.id) return
      uni.request({
        url: `${this.baseURL}/api/news/${item.id}/comment`,
        method: 'POST',
        data: {},
        success: (res)=>{
          item.commentsCount = (res.data && res.data.commentsCount) || ((item.commentsCount||0)+1)
          item.hot = (item.views||0) + (item.likes||0)*3 + (item.commentsCount||0)*4
        }
      })
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
.action-icon { font-size: 26rpx; }
.action-text { font-size: 22rpx; }
.empty, .loading { 
  text-align: center; 
  color:#9aa4b2; 
  padding: 80rpx 0; 
  font-size: 28rpx;
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
  color: #fff !important;
  background: linear-gradient(180deg, rgba(37,99,235,.16), rgba(37,99,235,.08));
  box-shadow: inset 0 0 0 1rpx rgba(59,130,246,.35);
}
.nav-btn.active text { color: #fff !important; }
.nav-btn:hover { 
  transform: translateY(-2rpx); 
}
.nav-icon {
  font-size: 36rpx;
}

.modal { position: fixed; inset: 0; background: rgba(2,6,23,.6); display: flex; align-items: flex-end; }
.sheet { width: 100%; max-height: 78vh; background:#0d1326; border-top-left-radius: 24rpx; border-top-right-radius: 24rpx; border-top:1rpx solid rgba(148,163,184,.2); }
.handle { width: 100rpx; height: 8rpx; border-radius: 8rpx; background: rgba(148,163,184,.35); margin: 16rpx auto; }
.sheet-body { max-height: 70vh; padding: 0 24rpx 24rpx; }
.detail-title { font-size: 32rpx; font-weight: 700; margin-bottom: 12rpx; }
.detail-content { color:#cbd5e1; font-size: 26rpx; line-height: 1.7; white-space: pre-wrap; }
</style>