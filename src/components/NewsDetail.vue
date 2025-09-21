<template>
  <view class="modal" v-if="show" @tap="closeDetail">
    <view class="sheet" @tap.stop>
      <view class="handle"></view>
      <scroll-view scroll-y class="sheet-body">
        <text class="detail-title">{{detail.title}}</text>
        <rich-text :nodes="detailHtml"></rich-text>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'NewsDetail',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    detail: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    detailHtml() {
      return this.markdownToNodes(this.detail.content || '')
    }
  },
  methods: {
    closeDetail() {
      this.$emit('close')
    },
    markdownToNodes(md) {
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
  }
}
</script>

<style scoped>
.modal { 
  position: fixed; 
  inset: 0; 
  background: rgba(2,6,23,.6); 
  display: flex; 
  align-items: flex-end; 
}
.sheet { 
  width: 100%; 
  max-height: 78vh; 
  background:#0d1326; 
  border-top-left-radius: 24rpx; 
  border-top-right-radius: 24rpx; 
  border-top:1rpx solid rgba(148,163,184,.2); 
}
.handle { 
  width: 100rpx; 
  height: 8rpx; 
  border-radius: 8rpx; 
  background: rgba(148,163,184,.35); 
  margin: 16rpx auto; 
}
.sheet-body { 
  max-height: 70vh; 
  padding: 0 24rpx 24rpx; 
}
.detail-title { 
  font-size: 32rpx; 
  font-weight: 700; 
  margin-bottom: 12rpx; 
}
.detail-content { 
  color:#cbd5e1; 
  font-size: 26rpx; 
  line-height: 1.7; 
  white-space: pre-wrap; 
}
</style>
