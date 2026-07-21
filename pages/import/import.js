// pages/import/import.js
var app = getApp()
var fileParser = require('../../utils/fileParser.js')
var fs = wx.getFileSystemManager()

Page({
  data: {
    showImportModal: false,
    pendingTransactions: [],
    pendingCount: 0,
    importMode: 'append'
  },

  stopPropagation: function() {},

  importCSV: function() {
    wx.showModal({
      title: 'CSV 导入提示',
      content: '微信导出的 CSV 文件为 GBK 编码，可能导致乱码。建议先用 Excel 打开 CSV 文件，另存为时选择 UTF-8 编码后再导入。',
      confirmText: '继续选择',
      cancelText: '取消',
      success: function(modalRes) {
        if (!modalRes.confirm) return
        wx.chooseMessageFile({
          count: 1, type: 'file', extension: ['csv'],
          success: function(res) {
            wx.showLoading({ title: '解析中...' })
            try {
              var content = fs.readFileSync(res.tempFiles[0].path, 'utf-8')
              var parsed = fileParser.parseWithHeaders(fileParser.parseCSV(content))
              var transactions = fileParser.convertToTransactions(parsed.dataRows, parsed.headers)
              wx.hideLoading()
              if (transactions.length === 0) {
                wx.showToast({ title: '未找到有效数据', icon: 'none' }); return
              }
              this.setData({
                pendingTransactions: transactions, pendingCount: transactions.length,
                showImportModal: true, importMode: 'append'
              })
            } catch (e) {
              wx.hideLoading()
              wx.showToast({ title: '解析失败', icon: 'none' })
            }
          }.bind(this),
          fail: function() {}
        })
      }
    })
  },

  importXLSX: function() {
    wx.chooseMessageFile({
      count: 1, type: 'file', extension: ['xlsx', 'xls'],
      success: function(res) {
        wx.showLoading({ title: '解析中...' })
        try {
          var arrayBuffer = fs.readFileSync(res.tempFiles[0].path)
          var parsed = fileParser.parseWithHeaders(fileParser.parseXLSX(arrayBuffer))
          var transactions = fileParser.convertToTransactions(parsed.dataRows, parsed.headers)
          wx.hideLoading()
          if (transactions.length === 0) {
            wx.showToast({ title: '未找到有效数据', icon: 'none' }); return
          }
          this.setData({
            pendingTransactions: transactions, pendingCount: transactions.length,
            showImportModal: true, importMode: 'append'
          })
        } catch (e) {
          wx.hideLoading()
          wx.showToast({ title: 'Excel 解析失败', icon: 'none' })
        }
      }.bind(this),
      fail: function() {}
    })
  },

  importZIP: function() {
    wx.chooseMessageFile({
      count: 1, type: 'file', extension: ['zip'],
      success: function(res) {
        var filePath = res.tempFiles[0].path
        wx.showLoading({ title: '解压中...' })
        try {
          var arrayBuffer = fs.readFileSync(filePath)
          var result = fileParser.parseZIP(arrayBuffer)
          wx.hideLoading()

          if (result.error === 'password') {
            wx.showModal({
              title: 'ZIP 已加密',
              content: '当前环境不支持解密 ZIP 文件。请先在手机文件管理或电脑上手动解压，然后将里面的 XLSX/CSV 文件直接导入。',
              showCancel: false,
              confirmText: '我知道了'
            })
            return
          }

          if (result.error === 'no_file') {
            wx.showToast({ title: result.message, icon: 'none' }); return
          }

          if (!result.transactions || result.transactions.length === 0) {
            wx.showToast({ title: '未找到有效数据', icon: 'none' }); return
          }

          var fileType = result.type === 'xlsx' ? 'Excel' : 'CSV'
          wx.showToast({ title: '从ZIP中识别到' + fileType + '文件', icon: 'none' })

          setTimeout(function() {
            this.setData({
              pendingTransactions: result.transactions,
              pendingCount: result.transactions.length,
              showImportModal: true, importMode: 'append'
            })
          }.bind(this), 500)
        } catch (e) {
          wx.hideLoading()
          wx.showToast({ title: 'ZIP 解析失败', icon: 'none' })
        }
      }.bind(this),
      fail: function() {}
    })
  },

  hideImportModal: function() { this.setData({ showImportModal: false }) },
  selectImportMode: function(e) { this.setData({ importMode: e.currentTarget.dataset.mode }) },

  confirmImport: function() {
    var pending = this.data.pendingTransactions
    var mode = this.data.importMode
    this.hideImportModal()
    wx.showLoading({ title: '导入中...' })
    var count
    if (mode === 'replace') { count = app.replaceTransactions(pending) }
    else { count = app.importTransactions(pending) }
    wx.hideLoading()
    wx.showToast({ title: '成功导入 ' + count + ' 条记录', icon: 'success' })
    this.setData({ pendingTransactions: [], pendingCount: 0 })
  }
})
