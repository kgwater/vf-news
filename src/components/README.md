# 组件说明

本目录包含了从主页面拆分出来的各个组件：

## 组件列表

### 1. TopBar.vue - 顶部栏组件
- **功能**: 显示品牌名称、搜索框、通知按钮
- **Props**: 
  - `currentSort`: 当前排序方式
- **Events**: 
  - `search-input`: 搜索输入事件
  - `search`: 搜索确认事件

### 2. CategoryTabs.vue - 分类标签组件
- **功能**: 显示新闻分类标签，支持横向滚动
- **Props**: 
  - `categories`: 分类数组
  - `currentCategory`: 当前选中的分类
- **Events**: 
  - `switch-category`: 切换分类事件

### 3. NewsList.vue - 新闻列表组件
- **功能**: 显示新闻列表，包含加载状态、空状态、操作按钮等
- **Props**: 
  - `list`: 新闻列表数据
  - `loading`: 加载状态
  - `loadingMore`: 加载更多状态
  - `searchQuery`: 搜索关键词
- **Events**: 
  - `reach-bottom`: 滚动到底部事件
  - `open-detail`: 打开详情事件
  - `like-item`: 点赞事件
  - `comment-item`: 评论事件

### 4. BottomNav.vue - 底部导航组件
- **功能**: 底部导航栏，包含综合、最新、热门、关于等选项
- **Props**: 
  - `currentSort`: 当前排序方式
- **Events**: 
  - `switch-sort`: 切换排序事件
  - `open-about`: 打开关于页面事件

### 5. NewsDetail.vue - 新闻详情抽屉组件
- **功能**: 新闻详情抽屉，支持Markdown渲染
- **Props**: 
  - `show`: 是否显示抽屉
  - `detail`: 新闻详情数据
- **Events**: 
  - `close`: 关闭抽屉事件

## 使用方式

```javascript
import { TopBar, CategoryTabs, NewsList, BottomNav, NewsDetail } from '@/components'
```

## 组件特点

1. **职责单一**: 每个组件只负责一个特定的功能模块
2. **可复用**: 组件可以在其他页面中重复使用
3. **易维护**: 代码结构清晰，便于维护和修改
4. **事件驱动**: 通过事件与父组件通信，保持组件间的解耦
5. **样式隔离**: 每个组件都有独立的样式作用域
