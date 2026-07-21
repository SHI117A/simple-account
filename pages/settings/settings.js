var app = getApp()

Page({
  data: { totalCount: 0 },

  onLoad: function() { this.loadCount() },
  onShow: function() { this.loadCount() },

  loadCount: function() {
    this.setData({ totalCount: app.getTransactions().length })
  },

  goImport: function() {
    wx.navigateTo({ url: '/pages/import/import' })
  },

  goFeedback: function() {
    wx.navigateTo({ url: '/pages/feedback/feedback' })
  },

  exportData: function() {
    var transactions = app.getTransactions()
    if (transactions.length === 0) {
      wx.showToast({ title: '暂无数据可导出', icon: 'none' })
      return
    }
    var csv = '类型,金额,备注,分类,日期\n'
    transactions.forEach(function(t) {
      var date = new Date(t.date)
      var dateStr = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
      csv += (t.type === 'income' ? '收入' : '支出') + ',' + t.amount + ',' + t.note + ',' + t.category + ',' + dateStr + '\n'
    })
    wx.setClipboardData({
      data: csv,
      success: function() {
        wx.showModal({ title: '导出成功', content: '数据已复制到剪贴板，请打开 Excel 或 WPS 粘贴保存', showCancel: false })
      }
    })
  },

  clearData: function() {
    wx.showModal({
      title: '⚠️ 确认清空', content: '此操作将删除全部记账记录，且不可恢复！',
      confirmText: '确认清空', confirmColor: '#ef4444',
      success: function(res) {
        if (res.confirm) {
          app.clearAllData()
          this.loadCount()
          wx.showToast({ title: '已清空所有数据', icon: 'success' })
        }
      }.bind(this)
    })
  }
})
