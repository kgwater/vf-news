<template>
  <view class="page">
    <!-- 顶部栏 -->
    <TopBar 
      :current-sort="currentSort" 
      @search-input="onSearchInput" 
      @search="onSearch" 
      @open-stats="openStats" 
    />

    <!-- 分类标签 -->
    <CategoryTabs 
      :categories="categories" 
      :current-category="currentCategory" 
      @switch-category="switchCategory" 
    />

    <!-- 新闻列表 -->
    <NewsList 
      :list="list" 
      :loading="loading" 
      :loading-more="loadingMore" 
      :search-query="q" 
      @reach-bottom="onReachBottom" 
      @open-detail="openDetail" 
      @like-item="likeItem" 
      @comment-item="commentItem" 
    />

    <!-- 底部导航 -->
    <BottomNav 
      :current-sort="currentSort" 
      @switch-sort="switchSort" 
      @open-about="openAbout" 
    />

    <!-- 新闻详情抽屉 -->
    <NewsDetail 
      :show="showDetail" 
      :detail="detail" 
      @close="closeDetail" 
    />

    <!-- 统计面板 -->
    <StatsPanel 
      :show="showStats" 
      :stats="stats" 
      @close="closeStats" 
      @open-news="openDetail" 
    />
  </view>
</template>

<script>
import { TopBar, CategoryTabs, NewsList, BottomNav, NewsDetail, StatsPanel } from '@/components'

export default {
  components: {
    TopBar,
    CategoryTabs,
    NewsList,
    BottomNav,
    NewsDetail,
    StatsPanel
  },
  data() {
    return {
      baseURL: 'http://localhost:5175',
      categories: [
        // { key: 'all', name: '全部', count: 0 },
        // {key: '全息技术',name: '全息技术', count: 2},
        // {key: '全息技术',name: '虚拟城市', count: 2}
      ], // 由后端聚合返回 tags 动态填充
      currentCategory: 'all',
      currentSort: 'home',
      list: [],
      loading: false,
      loadingMore: false,
      page: 1,
      pageSize: 100,
      total: 0,
      q: '',
      showDetail: false,
      detail: {},
      feedHeight: 1000,
      showStats: false,
      stats: {},
    }
  },
  onLoad() {
    this.calcFeedHeight()
    // 先拉新闻保证有数据可用于降级聚合标签，再拉后端 tags 覆盖
    this.fetchNews()
    this.fetchTags()
    this.fetchStats()
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
    // 2025-9-14 - 使用统计API获取分类数据
    fetchTags(){
      uni.request({
        url: `${this.baseURL}/api/stats/categories`,
        method: 'GET',
        success: (res)=>{
          if (res.data && res.data.ok && Array.isArray(res.data.categories)) {
            const categories = res.data.categories; // 分类统计数据
            console.log('获取到的分类统计:', categories);
            
            if (categories.length > 0) {
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
              
              // 转换分类数据格式
              const newCategories = categories.map(cat => ({ 
                key: cat.tag, 
                name: tagMap[cat.tag] || cat.tag, 
                count: cat.count 
              }))
              
              // 计算总数
              const totalCount = newCategories.reduce((sum, cat) => sum + cat.count, 0)
              
              // 更新分类列表
              this.categories = [
                { key:'all', name:'全部', count: totalCount }, 
                ...newCategories
              ]
              
              console.log('更新后的分类:', this.categories);
            }
          } else {
            console.log('分类统计数据为空，使用默认分类');
            // 保持默认分类
          }
        },
        fail: ()=>{
          console.log('获取分类统计失败，使用默认分类');
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
      this.showDetail = true
      // 浏览计数
      this.viewItem(item)
    },
    closeDetail(){
      this.showDetail = false
    },
    openAbout(){
      uni.navigateTo({ url: '/pages/me/index' })
    },
    // 获取统计信息
    fetchStats(){
      uni.request({
        url: `${this.baseURL}/api/stats`,
        method: 'GET',
        success: (res)=>{
          if (res.data && res.data.ok && res.data.stats) {
            this.stats = res.data.stats
            console.log('获取到的统计信息:', this.stats)
          }
        },
        fail: ()=>{
          console.log('获取统计信息失败')
        }
      })
    },
    // 打开统计面板
    openStats(){
      this.showStats = true
      // 刷新统计数据
      this.fetchStats()
    },
    // 关闭统计面板
    closeStats(){
      this.showStats = false
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
</style>