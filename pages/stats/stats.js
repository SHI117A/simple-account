const app = getApp()

const categoryMap = {
  food: { name: '餐饮', icon: '🍜' }, transport: { name: '交通', icon: '🚇' },
  shopping: { name: '购物', icon: '🛒' }, entertainment: { name: '娱乐', icon: '🎮' },
  medical: { name: '医疗', icon: '💊' }, housing: { name: '住房', icon: '🏠' },
  education: { name: '教育', icon: '📚' }, communication: { name: '通讯', icon: '📱' },
  salary: { name: '工资', icon: '💰' }, bonus: { name: '转账收款', icon: '🎁' },
  red_packet_in: { name: '收到红包', icon: '🧧' },
  refund: { name: '商户退款', icon: '🔄' },
  investment: { name: '投资', icon: '📈' }, other_income: { name: '其他收入', icon: '💵' },
  other_expense: { name: '其他支出', icon: '📦' }, transfer_out: { name: '转账支出', icon: '↔️' },
  red_packet_out: { name: '发出红包', icon: '🧧' }
}

Page({
  data: {
    filterTabs: ['当月', '上月', '近三月', '全部'],
    activeFilter: 0,
    showCustomDate: false,
    customStartDate: '',
    customEndDate: '',
    income: '0.00', expense: '0.00', balance: '0.00', count: 0,
    rankTab: 'expense',
    rankList: [],
    showMerchant: false,
    merchantTitle: '',
    merchantTotal: '0.00',
    merchantType: '',
    merchantList: []
  },

  onLoad() {
    this.initDates()
    this.loadData()
  },
  onShow() { this.loadData() },
  initDates() {
    var now = new Date()
    var y = now.getFullYear()
    var m = String(now.getMonth() + 1).padStart(2, '0')
    this.setData({
      customStartDate: y + '-' + m + '-01',
      customEndDate: y + '-' + m + '-' + String(now.getDate()).padStart(2, '0')
    })
  },

  getDateRange() {
    var now = new Date()
    var y = now.getFullYear(), m = now.getMonth()

    switch (this.data.activeFilter) {
      case 0:
        return { startDate: this.formatMonthStart(y, m), endDate: this.formatMonthEnd(y, m) }
      case 1:
        if (m === 0) { m = 11; y-- } else { m-- }
        return { startDate: this.formatMonthStart(y, m), endDate: this.formatMonthEnd(y, m) }
      case 2:
        var startM = m - 2, startY = y
        if (startM < 0) { startM += 12; startY-- }
        return { startDate: this.formatMonthStart(startY, startM), endDate: this.formatMonthEnd(y, m) }
      case 3:
        return null
      case 4:
        return { startDate: this.data.customStartDate, endDate: this.data.customEndDate }
      default:
        return null
    }
  },

  formatMonthStart(y, m) {
    return y + '-' + String(m + 1).padStart(2, '0') + '-01'
  },

  formatMonthEnd(y, m) {
    var lastDay = new Date(y, m + 1, 0).getDate()
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0')
  },

  loadData() {
    var dateRange = this.getDateRange()
    var stats = app.getStatsByDateRange(dateRange)

    this.setData({
      income: stats.income.toFixed(2),
      expense: stats.expense.toFixed(2),
      balance: stats.balance.toFixed(2),
      count: stats.count
    })

    this.loadRankData(dateRange)
  },

  loadRankData(dateRange) {
    if (!dateRange) dateRange = this.getDateRange()
    var type = this.data.rankTab
    var rawStats = app.getStatsByDateRangeAndCategory(type, dateRange)
    this.setData({ rankList: this.formatCategories(rawStats) })
  },

  formatCategories(rawStats) {
    var entries = Object.entries(rawStats)
    if (entries.length === 0) return []
    var maxAmount = Math.max.apply(null, entries.map(function(e) { return e[1] }))
    return entries.map(function(entry) {
      return {
        key: entry[0],
        name: categoryMap[entry[0]] ? categoryMap[entry[0]].name : entry[0],
        icon: categoryMap[entry[0]] ? categoryMap[entry[0]].icon : '📦',
        amount: entry[1].toFixed(2),
        percent: maxAmount > 0 ? ((entry[1] / maxAmount) * 100).toFixed(0) : 0
      }
    }).sort(function(a, b) { return parseFloat(b.amount) - parseFloat(a.amount) })
  },

  onFilterTap: function(e) {
    var idx = e.currentTarget.dataset.index
    if (idx === 4) {
      this.setData({ showCustomDate: true })
      return
    }
    this.setData({ activeFilter: idx })
    this.loadData()
  },

  onCustomDateConfirm: function() {
    if (!this.data.customStartDate || !this.data.customEndDate) {
      wx.showToast({ title: '请选择完整日期范围', icon: 'none' })
      return
    }
    if (this.data.customStartDate > this.data.customEndDate) {
      wx.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })
      return
    }
    this.setData({ activeFilter: 4, showCustomDate: false })
    this.loadData()
  },

  onCustomDateCancel: function() {
    this.setData({ showCustomDate: false })
  },

  onStart_dateChange: function(e) {
    this.setData({ customStartDate: e.detail.value })
  },

  onEnd_dateChange: function(e) {
    this.setData({ customEndDate: e.detail.value })
  },

  onRankTabTap: function(e) {
    var type = e.currentTarget.dataset.type
    this.setData({ rankTab: type })
    this.loadRankData()
  },

  onTapCategory: function(e) {
    var categoryKey = e.currentTarget.dataset.key
    var categoryName = e.currentTarget.dataset.name
    var dateRange = this.getDateRange()
    var merchants = app.getMerchantStatsByDateRange(categoryKey, dateRange)
    var entries = Object.entries(merchants)

    if (entries.length === 0) {
      wx.showToast({ title: '无商户明细', icon: 'none' })
      return
    }

    entries.sort(function(a, b) { return b[1].amount - a[1].amount })
    var total = 0, totalCount = 0
    entries.forEach(function(entry) { total += entry[1].amount; totalCount += entry[1].count })

    var merchantList = entries.map(function(entry) {
      return {
        name: entry[0],
        amount: entry[1].amount.toFixed(2),
        count: entry[1].count,
        percent: total > 0 ? ((entry[1].amount / total) * 100).toFixed(1) : '0.0'
      }
    })

    this.setData({
      showMerchant: true,
      merchantTitle: categoryName + ' - 商户明细',
      merchantTotal: total.toFixed(2),
      merchantTotalCount: totalCount,
      merchantType: categoryKey,
      merchantList: merchantList
    })
  },

  hideMerchant: function() {
    this.setData({ showMerchant: false })
  }
})