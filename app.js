App({
  onLaunch() {
    this.checkLocalStorage()
  },

  checkLocalStorage() {
    const transactions = wx.getStorageSync('transactions')
    if (!transactions) {
      wx.setStorageSync('transactions', [])
    }
    this.fixCategoryMismatch()
  },

  fixCategoryMismatch() {
    var transactions = wx.getStorageSync('transactions') || []
    var expenseCategories = ['food','transport','shopping','entertainment','medical','housing','education','communication','other_expense','transfer_out','red_packet_out']
    var incomeCategories = ['salary','bonus','red_packet_in','refund','investment','other_income']
    var fixed = false

    transactions.forEach(function(t) {
      if (t.type === 'income' && expenseCategories.indexOf(t.category) >= 0) {
        t.category = 'other_income'
        t.categoryIcon = 'other_income'
        t.icon = '💵'
        fixed = true
      } else if (t.type === 'expense' && incomeCategories.indexOf(t.category) >= 0) {
        t.category = 'other_expense'
        t.categoryIcon = 'other_expense'
        t.icon = '📦'
        fixed = true
      }
    })

    if (fixed) {
      wx.setStorageSync('transactions', transactions)
      console.log('[app] 已自动修复分类不匹配的数据')
    }
  },

  saveTransaction(transaction) {
    let transactions = wx.getStorageSync('transactions') || []
    transactions.unshift(transaction)
    wx.setStorageSync('transactions', transactions)
    return true
  },

  getTransactions() {
    return wx.getStorageSync('transactions') || []
  },

  deleteTransaction(id) {
    let transactions = wx.getStorageSync('transactions') || []
    transactions = transactions.filter(t => t.id !== id)
    wx.setStorageSync('transactions', transactions)
  },

  getMonthlyStats() {
    const transactions = this.getTransactions()
    const now = new Date()
    let income = 0, expense = 0

    transactions.forEach(t => {
      const date = new Date(t.date)
      if (date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()) {
        if (t.type === 'income') income += t.amount
        else expense += t.amount
      }
    })

    return { income, expense, balance: income - expense }
  },

  getStatsByCategory(type) {
    const transactions = this.getTransactions()
    const now = new Date()
    const stats = {}

    transactions.forEach(t => {
      if (t.type !== type) return
      const date = new Date(t.date)
      if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return
      stats[t.category] = (stats[t.category] || 0) + t.amount
    })

    return stats
  },

  getMerchantStatsByCategory(categoryKey) {
    const transactions = this.getTransactions()
    const now = new Date()
    const merchants = {}

    transactions.forEach(t => {
      if (t.category !== categoryKey) return
      const date = new Date(t.date)
      if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return
      var note = (t.note || '未分类').trim()
      merchants[note] = (merchants[note] || 0) + t.amount
    })

    return merchants
  },

  getAllStats() {
    const transactions = this.getTransactions()
    let income = 0, expense = 0, count = 0

    transactions.forEach(t => {
      count++
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    })

    return { income, expense, balance: income - expense, count }
  },

  getAllStatsByCategory(type) {
    const transactions = this.getTransactions()
    const stats = {}

    transactions.forEach(t => {
      if (t.type !== type) return
      stats[t.category] = (stats[t.category] || 0) + t.amount
    })

    return stats
  },

  getStatsByDateRange(dateRange) {
    const transactions = this.getTransactions()
    let income = 0, expense = 0, count = 0
    const startMs = dateRange ? new Date(dateRange.startDate).getTime() : 0
    const endMs = dateRange ? new Date(dateRange.endDate + 'T23:59:59').getTime() : Infinity

    transactions.forEach(t => {
      const tMs = new Date(t.date).getTime()
      if (tMs < startMs || tMs > endMs) return
      count++
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    })

    return { income, expense, balance: income - expense, count }
  },

  getStatsByDateRangeAndCategory(type, dateRange) {
    const transactions = this.getTransactions()
    const stats = {}
    const startMs = dateRange ? new Date(dateRange.startDate).getTime() : 0
    const endMs = dateRange ? new Date(dateRange.endDate + 'T23:59:59').getTime() : Infinity

    transactions.forEach(t => {
      if (t.type !== type) return
      const tMs = new Date(t.date).getTime()
      if (tMs < startMs || tMs > endMs) return
      stats[t.category] = (stats[t.category] || 0) + t.amount
    })

    return stats
  },

  getMerchantStatsByDateRange(categoryKey, dateRange) {
    const transactions = this.getTransactions()
    const merchants = {}
    const startMs = dateRange ? new Date(dateRange.startDate).getTime() : 0
    const endMs = dateRange ? new Date(dateRange.endDate + 'T23:59:59').getTime() : Infinity

    transactions.forEach(t => {
      if (t.category !== categoryKey) return
      const tMs = new Date(t.date).getTime()
      if (tMs < startMs || tMs > endMs) return
      var note = (t.note || '未分类').trim()
      if (!merchants[note]) merchants[note] = { amount: 0, count: 0 }
      merchants[note].amount += t.amount
      merchants[note].count++
    })

    return merchants
  },

  clearAllData() {
    wx.setStorageSync('transactions', [])
  },

  importTransactions(newData) {
    var transactions = wx.getStorageSync('transactions') || []
    transactions = newData.concat(transactions)
    wx.setStorageSync('transactions', transactions)
    return newData.length
  },

  replaceTransactions(newData) {
    wx.setStorageSync('transactions', newData)
    return newData.length
  }
})
