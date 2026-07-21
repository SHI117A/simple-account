var fflate = require('../libs/fflate.js')

function parseCSV(content) {
  if (!content || content.length === 0) return []

  var hasGarbled = false
  if (content.indexOf('\uFFFD') >= 0) {
    hasGarbled = true
  } else {
    var chineseCount = 0
    for (var ci = 0; ci < Math.min(content.length, 500); ci++) {
      var code = content.charCodeAt(ci)
      if (code >= 0x4E00 && code <= 0x9FFF) chineseCount++
    }
    if (content.length > 100 && chineseCount === 0) hasGarbled = true
  }

  if (hasGarbled) {
    console.log('[fileParser] CSV 检测到可能的编码问题，尝试 GBK 解码')
    console.log('[fileParser] 提示：微信导出的 CSV 可能是 GBK 编码，请先用 Excel 打开并另存为 UTF-8 编码的 CSV')
  }

  var lines = content.split(/\r?\n/).filter(function(line) { return line.trim() })
  if (lines.length < 2) return []

  var headerIndex = -1
  for (var i = 0; i < Math.min(lines.length, 20); i++) {
    if (lines[i].indexOf('交易时间') >= 0) { headerIndex = i; break }
  }

  var startLine = (headerIndex >= 0) ? headerIndex : 0
  return lines.slice(startLine).map(function(line) {
    return parseCSVLine(line)
  }).filter(function(row) { return row.length >= 3 })
}

function parseCSVLine(line) {
  var result = [], current = '', inQuotes = false
  for (var i = 0; i < line.length; i++) {
    var ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++ 
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current.trim())
  return result
}

function parseXLSX(arrayBuffer) {
  var data = new Uint8Array(arrayBuffer)
  var files = fflate.unzipSync(data)

  var fileNames = Object.keys(files)
  console.log('[fileParser] ZIP 内文件列表:', fileNames.join(', '))

  var sharedStrings = []
  var ssFile = findFile(files, 'xl/sharedStrings.xml')
  if (ssFile) {
    var ssXml = fflate.strFromU8(ssFile)
    sharedStrings = parseSharedStrings(ssXml)
    console.log('[fileParser] 共享字符串数量:', sharedStrings.length)
  } else {
    console.log('[fileParser] 未找到 sharedStrings.xml')
  }

  var sheetFile = findFile(files, 'xl/worksheets/sheet1.xml')
  if (!sheetFile) throw new Error('未找到工作表')

  var sheetXml = fflate.strFromU8(sheetFile)
  var rows = parseSheetXml(sheetXml, sharedStrings)
  console.log('[fileParser] 解析行数:', rows.length)
  if (rows.length > 0) {
    console.log('[fileParser] 第一行:', JSON.stringify(rows[0]))
    console.log('[fileParser] 第二行:', JSON.stringify(rows[1]))
  }

  if (rows.length < 2) return []

  var headerIndex = -1
  for (var i = 0; i < Math.min(rows.length, 20); i++) {
    var firstCell = (rows[i][0] || '').toString()
    if (firstCell.indexOf('交易时间') >= 0) { headerIndex = i; break }
  }

  console.log('[fileParser] 表头行索引:', headerIndex)

  if (headerIndex >= 0) {
    return rows.slice(headerIndex)
  }
  return rows
}

function findFile(files, targetPath) {
  var lower = targetPath.toLowerCase()
  var names = Object.keys(files)
  for (var i = 0; i < names.length; i++) {
    if (names[i].toLowerCase() === lower) return files[names[i]]
  }
  var fileName = targetPath.split('/').pop()
  for (var j = 0; j < names.length; j++) {
    if (names[j].toLowerCase().endsWith(fileName.toLowerCase())) return files[names[j]]
  }
  return null
}

function parseSharedStrings(xml) {
  var strings = []
  var start = 0
  while (true) {
    var siStart = xml.indexOf('<si', start)
    if (siStart === -1) break
    var siEnd = xml.indexOf('</si>', siStart)
    if (siEnd === -1) break
    var block = xml.substring(siStart, siEnd + 4)
    var text = ''

    var tStart = 0
    while (true) {
      var tOpen = block.indexOf('<t', tStart)
      if (tOpen === -1) break
      var tClose = block.indexOf('</t>', tOpen)
      if (tClose === -1) break
      var gtPos = block.indexOf('>', tOpen)
      if (gtPos === -1 || gtPos > tClose) break
      text += decodeXml(block.substring(gtPos + 1, tClose))
      tStart = tClose + 4
    }

    strings.push(text)
    start = siEnd + 4
  }
  return strings
}

function parseSheetXml(xml, sharedStrings) {
  var rows = []
  var start = 0

  while (true) {
    var rowStart = xml.indexOf('<row ', start)
    if (rowStart === -1) break
    var rowEnd = xml.indexOf('</row>', rowStart)
    if (rowEnd === -1) break
    var rowBlock = xml.substring(rowStart, rowEnd + 6)

    var cells = []
    var cStart = 0

    while (true) {
      var cOpen = rowBlock.indexOf('<c ', cStart)
      if (cOpen === -1) break
      var cClose = rowBlock.indexOf('</c>', cOpen)
      if (cClose === -1) break
      var cellBlock = rowBlock.substring(cOpen, cClose + 4)

      var rMatch = cellBlock.match(/r="([A-Z]+)(\d+)"/)
      if (!rMatch) { cStart = cClose + 4; continue }
      var colRef = rMatch[1]
      var rowNum = parseInt(rMatch[2])

      var tMatch = cellBlock.match(/\st="([^"]*)"/)
      var cellType = tMatch ? tMatch[1] : ''

      var cellValue = ''
      var vMatch = cellBlock.match(/<v>([^<]*)<\/v>/)
      if (vMatch) {
        var value = vMatch[1]
        if (cellType === 's') {
          var idx = parseInt(value)
          cellValue = (idx >= 0 && idx < sharedStrings.length) ? sharedStrings[idx] : ''
        } else {
          cellValue = value
        }
      } else {
        var isMatch = cellBlock.match(/<is><t[^>]*>([^<]*)<\/t><\/is>/)
        if (isMatch) {
          cellValue = decodeXml(isMatch[1])
        }
      }

      cells.push({ col: colRef, row: rowNum, value: cellValue })
      cStart = cClose + 4
    }

    if (cells.length > 0) {
      cells.sort(function(a, b) { return a.col < b.col ? -1 : a.col > b.col ? 1 : 0 })
      rows.push(cells.map(function(c) { return c.value }))
    }

    start = rowEnd + 6
  }

  return rows
}

function decodeXml(str) {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
}

var expenseCategoryMap = {
  '餐饮': 'food', '美食': 'food', '外卖': 'food', '零食': 'food',
  '美团': 'food', '饿了么': 'food', '麦当劳': 'food', '肯德基': 'food',
  '星巴克': 'food', '瑞幸': 'food', '奶茶': 'food', '饮品': 'food',
  '超市': 'food', '便利店': 'food', '盒马': 'food', '叮咚': 'food',
  '水果': 'food', '菜场': 'food', '食堂': 'food',
  '交通': 'transport', '出行': 'transport', '打车': 'transport',
  '滴滴': 'transport', '地铁': 'transport', '公交': 'transport',
  '铁路': 'transport', '12306': 'transport', '机票': 'transport',
  '航空': 'transport', '加油': 'transport', '停车': 'transport',
  '高德': 'transport', '哈啰': 'transport', '青桔': 'transport',
  '购物': 'shopping', '淘宝': 'shopping', '京东': 'shopping',
  '拼多多': 'shopping', '天猫': 'shopping', '抖音': 'shopping',
  '唯品会': 'shopping', '苏宁': 'shopping', '衣服': 'shopping',
  '服饰': 'shopping', '数码': 'shopping', '电器': 'shopping',
  '娱乐': 'entertainment', '游戏': 'entertainment', '电影': 'entertainment',
  'KTV': 'entertainment', '旅游': 'entertainment', '酒店': 'entertainment',
  '携程': 'entertainment', '门票': 'entertainment',
  '视频': 'entertainment', '音乐': 'entertainment',
  '腾讯视频': 'entertainment', '爱奇艺': 'entertainment', '优酷': 'entertainment', 'B站': 'entertainment',
  '医疗': 'medical', '医院': 'medical', '药': 'medical', '体检': 'medical',
  '药房': 'medical', '口腔': 'medical',
  '住房': 'housing', '房租': 'housing', '物业': 'housing',
  '水费': 'housing', '电费': 'housing', '燃气': 'housing',
  '教育': 'education', '学习': 'education', '课程': 'education',
  '培训': 'education', '书': 'education', '考试': 'education',
  '通讯': 'communication', '话费': 'communication', '充值': 'communication',
  '流量': 'communication', '移动': 'communication', '联通': 'communication', '电信': 'communication',
  '红包': 'red_packet_out',
  '理财': 'investment', '基金': 'investment', '股票': 'investment',
  '利息': 'investment', '零钱通': 'investment'
}

var incomeCategoryMap = {
  '工资': 'salary', '薪资': 'salary', '薪水': 'salary',
  '红包': 'red_packet_in', '转账': 'bonus',
  '退款': 'refund'
}

var iconMap = {
  food:'🍜', transport:'🚇', shopping:'🛒', entertainment:'🎮',
  medical:'💊', housing:'🏠', education:'📚', communication:'📱',
  salary:'💰', bonus:'🎁', red_packet_in:'🧧', refund:'🔄', transfer_out:'↔️', red_packet_out:'🧧', investment:'📈',
  other_expense:'📦', other_income:'💵'
}

function matchWechatCategory(typeStr, counterparty, product, recordType) {
  var searchText = ((typeStr || '') + ' ' + (counterparty || '') + ' ' + (product || '')).trim()

  if (recordType === 'income') {
    var incomeKeys = Object.keys(incomeCategoryMap)
    for (var i = 0; i < incomeKeys.length; i++) {
      if (searchText.indexOf(incomeKeys[i]) >= 0) return incomeCategoryMap[incomeKeys[i]]
    }
    return 'other_income'
  } else {
    if ((typeStr || '').indexOf('转账') >= 0) return 'transfer_out'
    var expenseKeys = Object.keys(expenseCategoryMap)
    for (var j = 0; j < expenseKeys.length; j++) {
      if (searchText.indexOf(expenseKeys[j]) >= 0) return expenseCategoryMap[expenseKeys[j]]
    }
    return 'other_expense'
  }
}

function parseAmount(str) {
  if (!str) return NaN
  var cleaned = str.replace(/[¥￥`\s]/g, '').replace(/,/g, '')
  return parseFloat(cleaned)
}

function excelSerialToDate(serial) {
  var num = parseFloat(serial)
  if (isNaN(num) || num < 1) return null
  var timestamp = (num - 25569) * 86400 * 1000
  var offset = new Date().getTimezoneOffset() * 60 * 1000
  var d = new Date(timestamp + offset)
  console.log('[fileParser] Excel序列号', serial, '→ UTC:', d.toISOString(), '本地:', d.toLocaleString())
  return d
}

function convertToTransactions(rows, headers) {
  var result = []

  var isWechatBill = false
  if (headers && headers.length >= 6) {
    var headerStr = headers.join(',')
    if (headerStr.indexOf('交易时间') >= 0 && headerStr.indexOf('收/支') >= 0) {
      isWechatBill = true
    }
  }

  console.log('[fileParser] isWechatBill:', isWechatBill, 'headers:', JSON.stringify(headers))
  console.log('[fileParser] 数据行数:', rows.length)
  if (rows.length > 0) {
    console.log('[fileParser] 第一行数据:', JSON.stringify(rows[0]))
    console.log('[fileParser] CSV/XLSX 来源:', typeof rows[0][0] === 'number' ? 'XLSX(数字)' : 'CSV(字符串)')
  }

  if (isWechatBill) {
    var colTime = -1, colType = -1, colCounterparty = -1, colProduct = -1
    var colDirection = -1, colAmount = -1, colMethod = -1, colStatus = -1
    var colOrderNo = -1, colMerchantNo = -1, colRemark = -1

    for (var i = 0; i < headers.length; i++) {
      var h = (headers[i] || '').trim()
      if (h === '交易时间') colTime = i
      else if (h === '交易类型') colType = i
      else if (h === '交易对方') colCounterparty = i
      else if (h === '商品') colProduct = i
      else if (h === '收/支') colDirection = i
      else if (h === '金额(元)') colAmount = i
      else if (h === '支付方式') colMethod = i
      else if (h === '当前状态') colStatus = i
      else if (h === '交易单号') colOrderNo = i
      else if (h === '商户单号') colMerchantNo = i
      else if (h === '备注') colRemark = i
    }

    console.log('[fileParser] 列索引 - 时间:', colTime, '类型:', colType, '对方:', colCounterparty,
      '商品:', colProduct, '收支:', colDirection, '金额:', colAmount, '状态:', colStatus)

    var skipped = 0
    rows.forEach(function(row) {
      if (!row || row.length < 4) return

      var status = colStatus >= 0 ? (row[colStatus] || '').trim() : ''
      if (status === '已取消') { skipped++; return }

      var direction = colDirection >= 0 ? (row[colDirection] || '').trim() : ''
      if (direction !== '收入' && direction !== '支出') { skipped++; return }

      var recordType = (direction === '收入') ? 'income' : 'expense'

      var amountStr = colAmount >= 0 ? (row[colAmount] || '') : ''
      var amount = parseAmount(amountStr)
      if (isNaN(amount) || amount <= 0) { skipped++; return }

      var dateStr = colTime >= 0 ? (row[colTime] || '').trim() : ''
      var dateObj = new Date()
      if (dateStr) {
        var serialDate = excelSerialToDate(dateStr)
        if (serialDate && !isNaN(serialDate.getTime())) {
          dateObj = serialDate
        } else {
          var normalized = dateStr.replace(/-/g, '/')
          var parsed = new Date(normalized)
          if (!isNaN(parsed.getTime())) {
            dateObj = parsed
          } else {
            var fallback = new Date(dateStr)
            if (!isNaN(fallback.getTime())) dateObj = fallback
          }
        }
      }

      var typeStr = colType >= 0 ? (row[colType] || '').trim() : ''
      var counterparty = colCounterparty >= 0 ? (row[colCounterparty] || '').trim() : ''
      var product = colProduct >= 0 ? (row[colProduct] || '').trim() : ''
      if (product.indexOf('收款方备注:') === 0) {
        product = product.substring(6).trim()
      }
      var remark = colRemark >= 0 ? (row[colRemark] || '').trim() : ''
      var note = counterparty || product || typeStr || remark || '未分类'

      var categoryKey = matchWechatCategory(typeStr, counterparty, product, recordType)

      result.push({
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + result.length,
        type: recordType, amount: amount, note: note,
        category: categoryKey, categoryIcon: categoryKey,
        icon: iconMap[categoryKey] || '📦',
        date: dateObj.toISOString()
      })
    })

    console.log('[fileParser] 导入结果: 成功', result.length, '条, 跳过', skipped, '条')

  } else {
    rows.forEach(function(row) {
      if (!row || row.length < 2) return
      var amount, note, category, date, recordType

      if (row.length >= 5) {
        var typeStr = (row[0] || '').trim()
        recordType = (typeStr.indexOf('收入') >= 0 || typeStr === 'income') ? 'income' : 'expense'
        amount = parseFloat(row[1]); note = (row[2] || '').trim()
        category = (row[3] || '').trim(); date = (row[4] || '').trim()
      } else if (row.length >= 4) {
        amount = parseFloat(row[0]); note = (row[1] || '').trim()
        category = (row[2] || '').trim(); date = (row[3] || '').trim()
        recordType = 'expense'
      } else {
        amount = parseFloat(row[0]); note = (row[1] || '').trim()
        category = ''; date = ''; recordType = 'expense'
      }

      if (isNaN(amount) || amount <= 0) return

      var categoryKey = matchWechatCategory(category, '', note, recordType)

      var dateObj = new Date()
      if (date) {
        var normalized = date.replace(/-/g, '/')
        var parsed = new Date(normalized)
        if (!isNaN(parsed.getTime())) dateObj = parsed
      }

      result.push({
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '_' + result.length,
        type: recordType, amount: amount, note: note || category || '未分类',
        category: categoryKey, categoryIcon: categoryKey,
        icon: iconMap[categoryKey] || '📦', date: dateObj.toISOString()
      })
    })
  }

  return result
}

function parseWithHeaders(rows) {
  if (rows.length < 2) return { headers: [], dataRows: rows }
  return { headers: rows[0], dataRows: rows.slice(1) }
}

function parseZIP(zipData) {
  var data = new Uint8Array(zipData)
  var files = {}

  try {
    files = fflate.unzipSync(data)
  } catch (e) {
    console.log('[fileParser] ZIP 解压失败:', e.message || e)
    return { error: 'password', message: '解压失败，该 ZIP 文件可能已加密，请先手动解压后再导入' }
  }

  console.log('[fileParser] ZIP 内文件列表:', Object.keys(files).join(', '))

  var xlsxFile = null, csvFile = null
  var keys = Object.keys(files)
  for (var i = 0; i < keys.length; i++) {
    var name = keys[i].toLowerCase()
    if (!xlsxFile && name.indexOf('.xlsx') >= 0) xlsxFile = keys[i]
    if (!csvFile && name.indexOf('.csv') >= 0) csvFile = keys[i]
  }

  if (xlsxFile) {
    console.log('[fileParser] ZIP 中找到 XLSX:', xlsxFile)
    var parsed = parseWithHeaders(parseXLSX(files[xlsxFile].buffer))
    var transactions = convertToTransactions(parsed.dataRows, parsed.headers)
    return { type: 'xlsx', transactions: transactions }
  }

  if (csvFile) {
    console.log('[fileParser] ZIP 中找到 CSV:', csvFile)
    var content = fflate.strFromU8(files[csvFile])
    var parsed2 = parseWithHeaders(parseCSV(content))
    var transactions2 = convertToTransactions(parsed2.dataRows, parsed2.headers)
    return { type: 'csv', transactions: transactions2 }
  }

  return { error: 'no_file', message: 'ZIP 中未找到 XLSX 或 CSV 文件' }
}

module.exports = {
  parseCSV: parseCSV,
  parseXLSX: parseXLSX,
  parseZIP: parseZIP,
  convertToTransactions: convertToTransactions,
  parseWithHeaders: parseWithHeaders
}
