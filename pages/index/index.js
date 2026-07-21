const app = getApp()

const allCategories = [
  { name: '餐饮', value: 'food', icon: '🍜' },
  { name: '交通', value: 'transport', icon: '🚇' },
  { name: '购物', value: 'shopping', icon: '🛒' },
  { name: '娱乐', value: 'entertainment', icon: '🎮' },
  { name: '医疗', value: 'medical', icon: '💊' },
  { name: '住房', value: 'housing', icon: '🏠' },
  { name: '教育', value: 'education', icon: '📚' },
  { name: '通讯', value: 'communication', icon: '📱' },
  { name: '工资', value: 'salary', icon: '💰' },
  { name: '转账收款', value: 'bonus', icon: '🎁' },
  { name: '收到红包', value: 'red_packet_in', icon: '🧧' },
  { name: '商户退款', value: 'refund', icon: '🔄' },
  { name: '投资', value: 'investment', icon: '📈' },
  { name: '其他收入', value: 'other_income', icon: '💵' },
  { name: '其他支出', value: 'other_expense', icon: '📦' },
  { name: '转账支出', value: 'transfer_out', icon: '↔️' },
  { name: '发出红包', value: 'red_packet_out', icon: '🧧' }
]

const incomeCategories = ['salary', 'bonus', 'red_packet_in', 'refund', 'investment', 'other_income']

Page({
  data: {
    balance: '0.00',
    income: '0.00',
    expense: '0.00',
    transactions: [],
    showModal: false,
    modalType: 'expense',
    categories: [],
    selectedCategory: 'food',
    inputAmount: '',
    inputNote: ''
  },

  onLoad() { this.loadData() },
  onShow() { this.loadData() },

  loadData() {
    const stats = app.getMonthlyStats()
    const transactions = app.getTransactions().slice(0, 50)
    transactions.forEach(t => { t.dateText = this.formatDate(t.date) })
    this.setData({
      balance: stats.balance.toFixed(2),
      income: stats.income.toFixed(2),
      expense: stats.expense.toFixed(2),
      transactions: transactions
    })
  },

  formatDate(isoString) {
    const date = new Date(isoString)
    const now = new Date()
  
    const dateYMD = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const nowYMD = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
    const diffDays = Math.floor((nowYMD - dateYMD) / (1000 * 60 * 60 * 24))
  
    if (diffDays === 0) {
      const diff = now - date
      const minutes = Math.floor(diff / (1000 * 60))
      if (minutes === 0) return '刚刚'
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) return minutes + '分钟前'
      return '今天 ' + this.formatTime(date)
    }
    if (diffDays === 1) return '昨天' + this.formatTime(date)
    if (diffDays === 2) return '前天' + this.formatTime(date)
    if (diffDays < 7) return diffDays + '天前' + this.formatTime(date)
    return (date.getMonth() + 1) + '月' + date.getDate() + '日'
  },

  formatTime(date) {
    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0')
  },

  openAddModal(e) {
    const type = e.currentTarget.dataset.type
    const filtered = allCategories.filter(c =>
      type === 'income' ? incomeCategories.includes(c.value) : !incomeCategories.includes(c.value)
    )
    this.setData({
      showModal: true, modalType: type, categories: filtered,
      selectedCategory: filtered[0].value, inputAmount: '', inputNote: ''
    })
  },

  closeAddModal() { this.setData({ showModal: false }) },
  stopPropagation() {},
  onAmountInput(e) { this.setData({ inputAmount: e.detail.value }) },
  onNoteInput(e) { this.setData({ inputNote: e.detail.value }) },
  selectCategory(e) { this.setData({ selectedCategory: e.currentTarget.dataset.value }) },

  confirmAdd() {
    const amount = parseFloat(this.data.inputAmount)
    if (!amount || amount <= 0) { wx.showToast({ title: '请输入有效金额', icon: 'none' }); return }
    const category = this.data.categories.find(c => c.value === this.data.selectedCategory)
    const transaction = {
      id: Date.now(), type: this.data.modalType, amount: amount,
      note: this.data.inputNote || category.name, category: category.value,
      categoryIcon: category.value, icon: category.icon, date: new Date().toISOString()
    }
    app.saveTransaction(transaction)
    this.setData({ showModal: false })
    wx.showToast({ title: '记账成功', icon: 'success' })
    this.loadData()
  },

  deleteTransaction(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除', content: '确定要删除这条记录吗？',
      success: (res) => { if (res.confirm) { app.deleteTransaction(id); this.loadData(); } }
    })
  }
})
