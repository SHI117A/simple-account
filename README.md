# simple-account
simple-account is a lightweight WeChat mini program focused on addressing three major pain points of traditional accounting applications: cumbersome operations, high privacy risks, and difficulty in data migration.All in all, this is the homework I’m submitting.总之，这是我的课程作业

---

# 简记账微信小程序说明文档

> **产品名称**：简记账微信小程序
> **产品版本**：V1.3.0
> **开发团队**：简记账开发团队
> **反馈邮箱**：hzxshi117a@outlook.com

---

## 一、项目简介

简记账是一款面向个人用户的轻量级记账工具，以微信小程序为载体，无需安装独立 APP，用户可快速记录日常收支、查看统计报表，并支持从微信账单导入历史数据。核心功能包括：

- **快速记账**：支持一键记录支出和收入，3 秒内完成记账操作
- **智能分类**：提供 17 种预设收支分类，支持从微信账单自动识别分类
- **数据统计**：支持按月、按分类、按商户查看收支统计
- **账单导入**：支持 CSV、XLSX、ZIP 格式导入微信账单
- **数据管理**：支持数据导出、清空等操作

---

## 二、运行环境

| 项目 | 要求 |
|------|------|
| 操作系统 | iOS 9.0+ / Android 5.0+ |
| 微信版本 | 微信客户端 8.0+ |
| 小程序基础库 | 2.19.0+ |
| 存储方式 | 微信小程序本地存储（wx.getStorageSync），容量约 10MB |
| 网络依赖 | 除账单文件导入外，核心功能无需联网 |

### 条件与限制

1. 数据存储限制：微信小程序本地存储容量约 10MB，大量数据需定期导出清理
2. ZIP 导入不支持加密压缩包
3. 微信导出的 CSV 文件为 GBK 编码，需先转换为 UTF-8

---

## 三、技术架构

### 3.1 总体架构

简记账采用标准微信小程序架构，由以下四层组成：

```
┌─────────────────────────────────────┐
│            应用层（Pages）           │
│  首页 | 统计 | 设置 | 导入 | 反馈    │
├─────────────────────────────────────┤
│          数据服务层（app.js）         │
│    数据存取 | 统计计算 | 数据转换      │
├─────────────────────────────────────┤
│            工具层（utils/libs）       │
│  fileParser.js（文件解析）            │
│  fflate.js（ZIP 解压）               │
├─────────────────────────────────────┤
│            资源层（images）           │
│  TabBar 图标资源                     │
└─────────────────────────────────────┘
```

### 3.2 模块间调用关系

- 各页面通过 `getApp()` 获取全局应用实例，调用 `app.js` 中的数据服务方法
- 导入页面通过 `require` 引用 `fileParser.js` 进行文件解析
- `fileParser.js` 通过 `require` 引用 `fflate.js` 进行 ZIP 解压

### 3.3 外部接口

| 接口类型 | API | 用途 |
|----------|-----|------|
| 本地存储 | `wx.getStorageSync` / `wx.setStorageSync` | 读写交易数据 |
| 文件选择 | `wx.chooseMessageFile` | 从微信聊天记录选择文件 |
| 剪贴板 | `wx.setClipboardData` | 数据导出、邮箱复制 |
| 文件系统 | `wx.getFileSystemManager` | 读取导入的账单文件 |

---

## 四、项目文件结构

```
简记账/
├── app.js                  # 应用入口，数据服务层（核心业务逻辑）
├── app.json                # 应用配置（页面路由、窗口样式、TabBar）
├── app.wxss                # 全局样式
├── project.config.json     # 项目配置
├── project.private.config.json  # 项目私有配置
├── sitemap.json            # 站点地图配置
├── pages/                  # 页面目录
│   ├── index/              # 首页 - 快速记账
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── stats/              # 统计页 - 数据统计
│   │   ├── stats.js
│   │   ├── stats.json
│   │   ├── stats.wxml
│   │   └── stats.wxss
│   ├── settings/           # 设置页 - 数据管理
│   │   ├── settings.js
│   │   ├── settings.json
│   │   ├── settings.wxml
│   │   └── settings.wxss
│   ├── import/             # 导入页 - 账单导入
│   │   ├── import.js
│   │   ├── import.json
│   │   ├── import.wxml
│   │   └── import.wxss
│   └── feedback/           # 反馈页 - 问题反馈
│       ├── feedback.js
│       ├── feedback.json
│       ├── feedback.wxml
│       └── feedback.wxss
├── utils/                  # 工具目录
│   └── fileParser.js       # 文件解析工具（CSV/XLSX/ZIP 解析）
├── libs/                   # 第三方库
│   └── fflate.js           # ZIP 解压库
└── images/                 # 图标资源
    ├── home.png            # 首页 TabBar 图标
    ├── home-active.png     # 首页 TabBar 选中图标
    ├── stats.png           # 统计 TabBar 图标
    ├── stats-active.png    # 统计 TabBar 选中图标
    ├── settings.png        # 设置 TabBar 图标
    └── settings-active.png # 设置 TabBar 选中图标
```

### app.json 配置

```json
{
  "pages": [
    "pages/index/index",
    "pages/stats/stats",
    "pages/settings/settings",
    "pages/import/import",
    "pages/feedback/feedback"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#667eea",
    "navigationBarTitleText": "简记账",
    "navigationBarTextStyle": "white"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#667eea",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      { "pagePath": "pages/index/index",   "text": "记账" },
      { "pagePath": "pages/stats/stats",   "text": "统计" },
      { "pagePath": "pages/settings/settings", "text": "设置" }
    ]
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

- TabBar 包含 3 个主入口：记账、统计、设置
- 导入页和反馈页通过 `wx.navigateTo` 从设置页跳转进入

---

## 五、功能模块详细设计

### 5.1 模块总览

| 模块编号 | 模块名称 | 功能描述 |
|----------|----------|----------|
| M01 | 首页记账模块 | 显示收支概况、最近记录、记账弹窗 |
| M02 | 统计模块 | 按时间范围统计、分类排行、商户明细 |
| M03 | 设置模块 | 数据导入、导出、清空、反馈 |
| M04 | 账单导入模块 | CSV/XLSX/ZIP 文件解析与导入 |
| M05 | 数据服务模块 | 数据存取、统计计算、数据转换 |

---

### 5.2 首页记账模块（M01）

**文件位置**：`pages/index/`

**功能说明**：显示本月收支结余、最近 50 条记录，提供记账弹窗快速记录收支。

#### 页面数据（data）

```javascript
{
  balance: '0.00',       // 本月结余
  income: '0.00',        // 本月收入
  expense: '0.00',       // 本月支出
  transactions: [],      // 最近50条交易记录
  showModal: false,      // 是否显示记账弹窗
  modalType: 'expense',  // 弹窗类型：expense/income
  categories: [],        // 当前可选择的分类列表
  selectedCategory: 'food', // 选中的分类
  inputAmount: '',       // 输入的金额
  inputNote: ''          // 输入的备注
}
```

#### 核心方法

| 方法名 | 说明 |
|--------|------|
| `loadData()` | 页面加载/显示时调用，获取本月统计和最近 50 条记录 |
| `formatDate(isoString)` | 将 ISO 日期格式化为友好文本（刚刚/N分钟前/今天 HH:MM/昨天/前天/N天前/M月D日） |
| `openAddModal(e)` | 打开记账弹窗，根据 type 筛选对应分类列表 |
| `confirmAdd()` | 确认记账，生成交易记录对象并保存 |
| `deleteTransaction(e)` | 删除指定交易记录（需二次确认） |

#### 记账流程

1. 用户点击「记支出」或「记收入」按钮
2. 弹出记账弹窗，显示对应类型的分类网格
3. 用户输入金额、选择分类、填写备注（可选）
4. 点击「确认记账」，生成交易记录并保存到本地存储
5. 刷新页面数据

#### 交易记录生成格式

```javascript
{
  id: Date.now(),                    // 时间戳作为ID
  type: 'expense' | 'income',        // 交易类型
  amount: 35.50,                     // 金额
  note: '麦当劳',                     // 备注/商户名称
  category: 'food',                  // 分类编码
  categoryIcon: 'food',              // 分类图标标识
  icon: '🍜',                        // 分类 emoji
  date: '2026-06-11T12:00:00.000Z'  // ISO 8601 日期
}
```

---

### 5.3 统计模块（M02）

**文件位置**：`pages/stats/`

**功能说明**：按时间范围筛选收支统计，展示分类排行列表，点击分类查看商户明细。

#### 时间筛选

| 筛选项 | 说明 |
|--------|------|
| 当月 | 当前自然月 |
| 上月 | 上一个自然月 |
| 近三月 | 最近三个自然月 |
| 全部 | 不限时间范围 |
| 自定义 | 用户选择起止日期 |

#### 页面数据（data）

```javascript
{
  filterTabs: ['当月', '上月', '近三月', '全部'],
  activeFilter: 0,              // 当前选中的筛选索引（4=自定义）
  customStartDate: '',          // 自定义开始日期
  customEndDate: '',            // 自定义结束日期
  income: '0.00',               // 收入总额
  expense: '0.00',              // 支出总额
  balance: '0.00',              // 结余
  count: 0,                     // 记录笔数
  rankTab: 'expense',           // 排行类型：expense/income
  rankList: [],                 // 分类排行数据
  showMerchant: false,          // 是否显示商户明细浮层
  merchantTitle: '',            // 商户明细标题
  merchantTotal: '0.00',        // 商户合计金额
  merchantList: []              // 商户明细列表
}
```

#### 核心方法

| 方法名 | 说明 |
|--------|------|
| `getDateRange()` | 根据当前筛选条件计算日期范围对象 `{startDate, endDate}` |
| `loadData()` | 加载统计概览和排行数据 |
| `loadRankData(dateRange)` | 加载分类排行数据 |
| `formatCategories(rawStats)` | 将原始分类统计格式化为排行列表，计算百分比 |
| `onTapCategory(e)` | 点击分类项，查询该分类下的商户明细 |
| `hideMerchant()` | 隐藏商户明细浮层 |

#### 排行列表数据结构

```javascript
{
  key: 'food',           // 分类编码
  name: '餐饮',          // 分类名称
  icon: '🍜',            // 分类图标
  amount: '1234.56',     // 金额（字符串）
  percent: 100           // 占比（相对于最高分类的百分比）
}
```

#### 商户明细数据结构

```javascript
{
  name: '麦当劳',        // 商户名称
  amount: '356.50',      // 金额
  count: 12,             // 笔数
  percent: '28.9'        // 占比百分比
}
```

---

### 5.4 设置模块（M03）

**文件位置**：`pages/settings/`

**功能说明**：提供数据导入、导出、清空和反馈入口。

#### 核心方法

| 方法名 | 说明 |
|--------|------|
| `loadCount()` | 加载当前记录总数 |
| `goImport()` | 跳转至导入页面 |
| `goFeedback()` | 跳转至反馈页面 |
| `exportData()` | 将所有记录导出为 CSV 格式并复制到剪贴板 |
| `clearData()` | 清空所有数据（需二次确认，不可恢复） |

#### 导出 CSV 格式

```
类型,金额,备注,分类,日期
支出,35.50,麦当劳,food,2026-6-11
收入,8000,工资,salary,2026-6-1
```

---

### 5.5 账单导入模块（M04）

**文件位置**：`pages/import/` + `utils/fileParser.js`

**功能说明**：支持从微信聊天记录中选择 CSV、XLSX、ZIP 文件，解析微信账单并导入。

#### 支持的文件格式

| 格式 | 说明 |
|------|------|
| XLSX | 微信账单导出的 Excel 格式，通过解析 XLSX 内部 XML 获取数据 |
| CSV | 微信账单导出的 CSV 格式（需 UTF-8 编码） |
| ZIP | 包含 XLSX 或 CSV 的压缩包，自动识别并解压（不支持加密） |

#### 导入流程

1. 用户选择文件格式并选择文件（从微信聊天记录）
2. 调用对应解析方法：`parseCSV` / `parseXLSX` / `parseZIP`
3. 解析表头识别微信账单格式（检测「交易时间」和「收/支」关键词）
4. 逐行解析交易数据，自动识别分类
5. 弹出导入选项弹窗，显示解析到的记录数量
6. 用户选择导入模式：**追加**（保留原有记录）或 **替换**（清空原有记录）
7. 调用 `app.importTransactions()` 或 `app.replaceTransactions()` 完成导入

#### 导入模式

| 模式 | 说明 |
|------|------|
| 追加（append） | 保留原有记录，新记录插入到数组头部 |
| 替换（replace） | 清空原有记录，只保留导入的记录 |

---

### 5.6 反馈模块

**文件位置**：`pages/feedback/`

**功能说明**：提供联系方式，用户可复制邮箱地址后发送反馈邮件。

---

## 六、数据服务模块（M05）API 参考

**文件位置**：`app.js`

所有数据服务方法封装在 `App()` 实例中，页面通过 `getApp()` 调用。

### 6.1 初始化方法

| 方法名 | 说明 |
|--------|------|
| `checkLocalStorage()` | 检查本地存储是否存在 `transactions` 键，不存在则初始化为空数组 |
| `fixCategoryMismatch()` | 修复分类与类型不匹配的数据（收入记录不应归属支出分类，反之亦然） |

### 6.2 数据操作方法

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `saveTransaction(transaction)` | 交易对象 | `true` | 保存单条记录，插入到数组头部 |
| `getTransactions()` | 无 | Array | 获取所有交易记录 |
| `deleteTransaction(id)` | 记录ID | 无 | 根据ID删除指定记录 |
| `clearAllData()` | 无 | 无 | 清空所有交易记录 |
| `importTransactions(newData)` | 新记录数组 | Number | 追加导入（新记录插入头部） |
| `replaceTransactions(newData)` | 新记录数组 | Number | 替换所有记录 |

### 6.3 统计方法

| 方法名 | 参数 | 返回值 | 说明 |
|--------|------|--------|------|
| `getMonthlyStats()` | 无 | `{income, expense, balance}` | 获取当月收支统计 |
| `getStatsByCategory(type)` | `'income'`/`'expense'` | `Object{category: amount}` | 获取当月指定类型的分类统计 |
| `getMerchantStatsByCategory(categoryKey)` | 分类编码 | `Object{merchant: amount}` | 获取当月指定分类的商户统计 |
| `getAllStats()` | 无 | `{income, expense, balance, count}` | 获取全部收支统计 |
| `getAllStatsByCategory(type)` | `'income'`/`'expense'` | `Object{category: amount}` | 获取全部分类统计 |
| `getStatsByDateRange(dateRange)` | `{startDate, endDate}` | `{income, expense, balance, count}` | 按日期范围统计 |
| `getStatsByDateRangeAndCategory(type, dateRange)` | 类型+日期范围 | `Object{category: amount}` | 按日期范围和类型获取分类统计 |
| `getMerchantStatsByDateRange(categoryKey, dateRange)` | 分类+日期范围 | `Object{merchant: {amount, count}}` | 按分类和日期范围获取商户统计 |

> **注意**：日期范围参数 `dateRange` 为 `null` 时表示不限时间范围。

---

## 七、数据模型与存储

### 7.1 存储方式

- 采用微信小程序本地存储（LocalStorage）
- 键值对存储，键名为 `transactions`，值为 JSON 数组
- 同步读写接口，数据持久化
- 容量限制约 10MB，单条记录约 200 字节，理论支持约 50000 条记录

### 7.2 交易记录数据结构

```json
{
  "id": 1686451200000,
  "type": "expense",
  "amount": 35.50,
  "note": "麦当劳",
  "category": "food",
  "categoryIcon": "food",
  "icon": "🍜",
  "date": "2026-06-11T12:00:00.000Z"
}
```

| 属性名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number/String | 是 | 记录唯一标识（时间戳 或 时间戳_随机数_序号） |
| type | String | 是 | 交易类型：`income`（收入）/ `expense`（支出） |
| amount | Number | 是 | 金额（元） |
| note | String | 否 | 备注/商户名称 |
| category | String | 是 | 分类编码 |
| categoryIcon | String | 是 | 分类图标标识（与 category 相同） |
| icon | String | 是 | 分类 emoji 图标 |
| date | String | 是 | ISO 8601 格式日期 |

### 7.3 收支分类编码

#### 支出分类（11 种）

| 分类编码 | 分类名称 | 图标 |
|----------|----------|------|
| food | 餐饮 | 🍜 |
| transport | 交通 | 🚇 |
| shopping | 购物 | 🛒 |
| entertainment | 娱乐 | 🎮 |
| medical | 医疗 | 💊 |
| housing | 住房 | 🏠 |
| education | 教育 | 📚 |
| communication | 通讯 | 📱 |
| other_expense | 其他支出 | 📦 |
| transfer_out | 转账支出 | ↔️ |
| red_packet_out | 发出红包 | 🧧 |

#### 收入分类（6 种）

| 分类编码 | 分类名称 | 图标 |
|----------|----------|------|
| salary | 工资 | 💰 |
| bonus | 转账收款 | 🎁 |
| red_packet_in | 收到红包 | 🧧 |
| refund | 商户退款 | 🔄 |
| investment | 投资 | 📈 |
| other_income | 其他收入 | 💵 |

---

## 八、核心算法

### 8.1 微信账单解析算法

**文件**：`utils/fileParser.js` → `convertToTransactions()`

**输入**：微信导出的 CSV 或 XLSX 解析后的二维数组 + 表头

**处理流程**：

1. **识别微信账单格式**：检查表头是否同时包含「交易时间」和「收/支」关键词
2. **定位列索引**：遍历表头，定位交易时间、交易类型、交易对方、商品、收/支、金额(元)、当前状态、备注等列
3. **逐行解析**：
   - 跳过状态为「已取消」的记录
   - 跳过收支方向非「收入」「支出」的记录
   - 金额解析：去除货币符号（¥/￥）和千分位逗号
   - 日期解析：优先尝试 Excel 序列号转换，其次尝试标准日期格式
4. **分类识别**：根据交易类型、交易对方、商品名称匹配关键词，自动归类
5. **生成记录**：构建标准交易记录对象

### 8.2 智能分类识别

**文件**：`utils/fileParser.js` → `matchWechatCategory()`

根据交易类型和文本内容（交易类型 + 交易对方 + 商品）进行关键词匹配：

| 分类 | 关键词 |
|------|--------|
| 餐饮 | 美团、饿了么、麦当劳、肯德基、星巴克、瑞幸、奶茶、饮品、超市、便利店、盒马、叮咚、水果、菜场、食堂等 |
| 交通 | 滴滴、地铁、公交、12306、高德、哈啰、青桔、加油、停车、机票等 |
| 购物 | 淘宝、京东、拼多多、天猫、抖音、唯品会、苏宁、衣服、数码、电器等 |
| 娱乐 | 游戏、电影、KTV、旅游、酒店、携程、腾讯视频、爱奇艺、B站等 |
| 医疗 | 医院、药、体检、药房、口腔等 |
| 住房 | 房租、物业、水费、电费、燃气等 |
| 教育 | 学习、课程、培训、书、考试等 |
| 通讯 | 话费、流量、移动、联通、电信、充值等 |
| 工资 | 工资、薪资、薪水 |
| 转账收款 | 转账 |
| 红包 | 红包（收入→收到红包，支出→发出红包） |
| 退款 | 退款 |
| 投资 | 理财、基金、股票、利息、零钱通 |

### 8.3 XLSX 解析算法

**文件**：`utils/fileParser.js` → `parseXLSX()`

XLSX 文件本质是 ZIP 压缩包，解析流程：

1. 使用 `fflate.unzipSync()` 解压 XLSX
2. 查找并解析 `xl/sharedStrings.xml` 获取共享字符串表
3. 查找并解析 `xl/worksheets/sheet1.xml` 获取工作表数据
4. 单元格类型为 `s`（共享字符串）时，通过索引引用共享字符串表
5. 返回二维数组（每行一个子数组）

### 8.4 CSV 解析算法

**文件**：`utils/fileParser.js` → `parseCSV()`

1. **编码检测**：检测是否存在乱码字符（`\uFFFD`）或中文字符缺失
2. **表头定位**：在前 20 行中查找包含「交易时间」的行作为表头
3. **逐行解析**：支持带引号的字段（含逗号的值用双引号包裹），处理转义双引号
4. 返回二维数组

### 8.5 统计计算算法

**文件**：`app.js`

遍历所有交易记录，根据筛选条件（日期范围、交易类型、分类）进行内存过滤和聚合：

```
输入: 交易记录数组 + 筛选条件
处理:
  1. 遍历交易记录
  2. 筛选日期范围内的记录（将日期字符串转为毫秒时间戳比较）
  3. 按 type 分别累加 income 和 expense 金额
  4. 按 category 聚合分类统计
  5. 按 note 聚合商户统计（含金额和笔数）
输出: 统计结果对象
```

---

## 九、用户界面设计

### 9.1 页面总览

| 页面 | 路径 | 入口方式 | 主要元素 |
|------|------|----------|----------|
| 首页 | pages/index/index | TabBar | 余额卡片、记账按钮、交易列表、记账弹窗 |
| 统计页 | pages/stats/stats | TabBar | 筛选标签、收支概览、分类排行、商户明细浮层 |
| 设置页 | pages/settings/settings | TabBar | 导入/导出/清空入口、反馈入口、版本信息 |
| 导入页 | pages/import/import | 设置页跳转 | XLSX/CSV/ZIP 导入选项、导入模式选择弹窗 |
| 反馈页 | pages/feedback/feedback | 设置页跳转 | 邮箱复制、反馈说明 |

### 9.2 全局样式

- 背景色：`#f5f5f5`
- 字体：系统字体栈（-apple-system, BlinkMacSystemFont, ...）
- 基础字号：`28rpx`
- 文字颜色：`#333`
- 导航栏背景色：`#667eea`（紫蓝色）
- TabBar 选中色：`#667eea`

---

## 十、编码规范

| 编码对象 | 规则 | 示例 |
|----------|------|------|
| 交易记录 ID | 时间戳 | `1686451200000` |
| 导入记录 ID | 时间戳_随机字符串_序号 | `1686451200000_a1b2c3d4e_0` |
| 分类编码 | 英文小写单词/下划线连接 | `food`、`other_expense` |
| 交易类型 | 英文小写 | `income`、`expense` |
| 日期格式 | ISO 8601 | `2026-06-11T12:00:00.000Z` |
| 存储键名 | 英文小写 | `transactions` |

---

## 十一、数据库安全

1. 数据存储在用户设备本地，不上传服务器
2. 微信小程序 Storage 数据受微信客户端保护
3. 用户可通过导出功能自行备份数据
4. 清空数据操作需二次确认，且不可恢复

---

## 十二、术语表

| 术语 | 说明 |
|------|------|
| WXML | 微信小程序标记语言，类似 HTML |
| WXSS | 微信小程序样式语言，类似 CSS |
| rpx | 响应式像素单位，适配不同屏幕宽度 |
| wx.getStorageSync | 微信小程序本地同步存储读取 API |
| wx.setStorageSync | 微信小程序本地同步存储写入 API |
| TabBar | 小程序底部导航栏 |
| fflate | 轻量级 ZIP 压缩/解压 JavaScript 库 |
