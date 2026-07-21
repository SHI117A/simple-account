// pages/feedback/feedback.js
Page({
  data: {},

  copyEmail: function() {
    wx.setClipboardData({
      data: 'hzxshi117a@outlook.com',
      success: function() {
        wx.showToast({ title: '邮箱已复制', icon: 'success' })
      }
    })
  },

  sendEmail: function() {
    wx.setClipboardData({
      data: 'hzxshi117a@outlook.com',
      success: function() {
        wx.showModal({
          title: '邮箱已复制',
          content: '请打开邮箱应用，粘贴收件人地址后发送反馈。如果有错误复现视频、截图或详细文字说明，能帮助作者更快定位问题哦！',
          showCancel: false,
          confirmText: '好的'
        })
      }
    })
  }
})
