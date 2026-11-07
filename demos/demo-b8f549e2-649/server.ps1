# Pet Store Manager - local REST server (PowerShell 5.1, no dependencies)
# Serves pet-store-manager.html and a small JSON API on http://localhost:8787

$ErrorActionPreference = 'Stop'

$Port     = 8787
$Root     = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Root) { $Root = (Get-Location).Path }
$DataFile = Join-Path $Root 'pet-store-data.json'
$HtmlFile = Join-Path $Root 'pet-store-manager.html'

$Seed = @'
{
  "today": { "revenue": 6820, "orders": 42, "appts": 18, "members": 6 },
  "store": { "name": "森田宠物生活馆", "manager": "陈森田", "code": "ST-0286", "open": true, "hours": "09:00-21:00" },
  "seq": 15,
  "updatedAt": "2026-11-07 09:41",
  "orders": [
    { "no": "#2026110714", "type": "服务", "avatar": "🐕", "name": "林小满", "phone": "138****6621", "pet": "豆豆 · 金毛 28.5kg",
      "items": [{ "n": "全身造型精剪", "q": 1, "p": 268 }, { "n": "宠物香波 温和型", "q": 1, "p": 60 }], "amount": 328,
      "pay": "已付款 · 微信", "time": "11-07 14:20", "status": "待服务", "staff": "Amy" },
    { "no": "#2026110713", "type": "商品", "avatar": "🐩", "name": "周雨桐", "phone": "139****8802", "pet": "团子 · 贵宾",
      "items": [{ "n": "渴望无谷六种鱼成犬粮 1.4kg", "q": 1, "p": 568 }], "amount": 568,
      "pay": "已付款 · 支付宝", "time": "11-07 13:52", "status": "待发货", "staff": "" },
    { "no": "#2026110712", "type": "服务", "avatar": "🐱", "name": "陈一诺", "phone": "137****2049", "pet": "毛毛 · 英短 4.2kg",
      "items": [{ "n": "猫咪专属美容", "q": 1, "p": 328 }], "amount": 328,
      "pay": "已付款 · 微信", "time": "11-07 15:30", "status": "待服务", "staff": "小林" },
    { "no": "#2026110711", "type": "商品", "avatar": "🐕", "name": "吴思远", "phone": "150****3316", "pet": "暂无宠物档案",
      "items": [{ "n": "皇家金毛幼犬粮 15kg", "q": 2, "p": 299 }], "amount": 598,
      "pay": "待付款", "time": "11-07 13:05", "status": "待付款", "staff": "" },
    { "no": "#2026110710", "type": "服务", "avatar": "🐱", "name": "何雨", "phone": "136****7788", "pet": "奶糖 · 布偶",
      "items": [{ "n": "局部修剪（垫/脚/臀）", "q": 1, "p": 88 }], "amount": 88,
      "pay": "已付款 · 微信", "time": "11-07 11:40", "status": "已完成", "staff": "小林" },
    { "no": "#2026110709", "type": "商品", "avatar": "🐈", "name": "张宁", "phone": "158****9021", "pet": "团子 · 英短",
      "items": [{ "n": "逗猫棒套装", "q": 2, "p": 39 }], "amount": 78,
      "pay": "已付款 · 微信", "time": "11-07 10:58", "status": "已完成", "staff": "" },
    { "no": "#2026110708", "type": "服务", "avatar": "🐶", "name": "徐嘉", "phone": "135****4432", "pet": "布丁 · 比熊 6kg",
      "items": [{ "n": "宠物寄养（3 天）", "q": 1, "p": 240 }], "amount": 240,
      "pay": "已付款 · 储值卡", "time": "11-07 10:20", "status": "已完成", "staff": "Amy" }
  ],
  "appts": {
    "0": [
      { "time": "09:30", "end": "10:30", "name": "徐嘉", "pet": "布丁 · 比熊", "svc": "全身造型精剪", "price": 268, "staff": "Amy", "status": "已完成" },
      { "time": "11:00", "end": "12:30", "name": "陈一诺", "pet": "毛毛 · 英短", "svc": "猫咪专属美容", "price": 328, "staff": "小林", "status": "服务中" },
      { "time": "14:30", "end": "15:30", "name": "林小满", "pet": "豆豆 · 金毛", "svc": "全身造型精剪", "price": 268, "staff": "Amy", "status": "已确认" },
      { "time": "15:30", "end": "16:20", "name": "周雨桐", "pet": "团子 · 贵宾", "svc": "宠物深层洗护", "price": 158, "staff": "阿杰", "status": "待确认" },
      { "time": "17:00", "end": "17:40", "name": "何雨", "pet": "奶糖 · 布偶", "svc": "局部修剪", "price": 88, "staff": "小林", "status": "已确认" }
    ],
    "1": [
      { "time": "10:00", "end": "11:00", "name": "沈心怡", "pet": "可乐 · 泰迪", "svc": "全身造型精剪", "price": 268, "staff": "Amy", "status": "已确认" },
      { "time": "13:30", "end": "14:40", "name": "赵一鸣", "pet": "大福 · 边牧", "svc": "宠物深层洗护", "price": 158, "staff": "阿杰", "status": "已确认" },
      { "time": "16:00", "end": "17:00", "name": "钱多多", "pet": "雪球 · 布偶", "svc": "猫咪专属美容", "price": 328, "staff": "小林", "status": "待确认" }
    ],
    "2": [
      { "time": "09:30", "end": "10:30", "name": "孙悦", "pet": "年糕 · 英短", "svc": "猫咪专属美容", "price": 328, "staff": "小林", "status": "已确认" },
      { "time": "11:00", "end": "12:00", "name": "李想", "pet": "奥利奥 · 金毛", "svc": "局部修剪", "price": 88, "staff": "Amy", "status": "已确认" },
      { "time": "14:00", "end": "15:10", "name": "周舟", "pet": "奶昔 · 比熊", "svc": "宠物深层洗护", "price": 158, "staff": "阿杰", "status": "已确认" },
      { "time": "18:00", "end": "19:00", "name": "林恬", "pet": "布丁 · 贵宾", "svc": "全身造型精剪", "price": 268, "staff": "Amy", "status": "待确认" }
    ],
    "3": [
      { "time": "10:30", "end": "11:30", "name": "徐嘉", "pet": "布丁 · 比熊", "svc": "局部修剪", "price": 88, "staff": "Amy", "status": "已确认" },
      { "time": "15:00", "end": "16:10", "name": "陈一诺", "pet": "毛毛 · 英短", "svc": "宠物深层洗护", "price": 158, "staff": "小林", "status": "待确认" }
    ]
  },
  "goods": [
    { "id": 1, "emoji": "🍚", "name": "皇家金毛幼犬粮", "spec": "15kg / 幼犬", "cat": "主粮", "stock": 6, "min": 10, "price": 299, "sold": 68 },
    { "id": 2, "emoji": "🐟", "name": "渴望无谷六种鱼成犬粮", "spec": "1.4kg / 成犬", "cat": "主粮", "stock": 18, "min": 8, "price": 568, "sold": 42 },
    { "id": 3, "emoji": "🍼", "name": "幼猫奶粉", "spec": "1kg / 幼猫", "cat": "主粮", "stock": 3, "min": 6, "price": 98, "sold": 35 },
    { "id": 4, "emoji": "🥩", "name": "鲜肉冻干全价猫粮", "spec": "1.8kg / 成猫", "cat": "主粮", "stock": 9, "min": 10, "price": 168, "sold": 96 },
    { "id": 5, "emoji": "🦴", "name": "冻干鸡胸肉粒", "spec": "100g / 零食", "cat": "零食", "stock": 25, "min": 10, "price": 39, "sold": 120 },
    { "id": 6, "emoji": "🧴", "name": "宠物香波 温和型", "spec": "500ml", "cat": "清洁", "stock": 32, "min": 10, "price": 60, "sold": 54 },
    { "id": 7, "emoji": "🧸", "name": "逗猫棒套装", "spec": "3 件套", "cat": "玩具", "stock": 2, "min": 5, "price": 39, "sold": 88 },
    { "id": 8, "emoji": "🪮", "name": "宠物按摩梳", "spec": "去浮毛", "cat": "护理", "stock": 14, "min": 6, "price": 45, "sold": 61 }
  ]
}
'@

function Write-TextUtf8 {
  param([string]$Path, [string]$Text, [bool]$Bom = $false)
  [System.IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding($Bom)))
}

function Read-TextUtf8 {
  param([string]$Path)
  [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

function Load-Db {
  if (Test-Path $DataFile) {
    return (Read-TextUtf8 $DataFile | ConvertFrom-Json)
  }
  $db = $Seed | ConvertFrom-Json
  Write-TextUtf8 $DataFile ($Seed) $false
  return $db
}

function Save-Db {
  $script:Db.updatedAt = Get-Date -Format 'yyyy-MM-dd HH:mm'
  $json = $script:Db | ConvertTo-Json -Depth 12
  Write-TextUtf8 $DataFile $json $false
}

function Set-Cors {
  param($Ctx)
  $Ctx.Response.Headers['Access-Control-Allow-Origin']  = '*'
  $Ctx.Response.Headers['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, OPTIONS'
  $Ctx.Response.Headers['Access-Control-Allow-Headers'] = 'Content-Type'
  $Ctx.Response.Headers['Access-Control-Allow-Private-Network'] = 'true'
  $Ctx.Response.Headers['Cache-Control'] = 'no-store'
}

function Send-Json {
  param($Ctx, $Obj, [int]$Code = 200)
  Set-Cors $Ctx
  $bytes = [System.Text.Encoding]::UTF8.GetBytes(($Obj | ConvertTo-Json -Depth 12 -Compress))
  $Ctx.Response.StatusCode = $Code
  $Ctx.Response.ContentType = 'application/json; charset=utf-8'
  $Ctx.Response.ContentLength64 = $bytes.Length
  $Ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Ctx.Response.Close()
}

function Send-Empty {
  param($Ctx, [int]$Code = 204)
  Set-Cors $Ctx
  $Ctx.Response.StatusCode = $Code
  $Ctx.Response.ContentLength64 = 0
  $Ctx.Response.Close()
}

function Send-File {
  param($Ctx, [string]$Path)
  $ext = [System.IO.Path]::GetExtension($Path).ToLower()
  $type = switch ($ext) {
    '.html' { 'text/html; charset=utf-8' }
    '.css'  { 'text/css; charset=utf-8' }
    '.js'   { 'application/javascript; charset=utf-8' }
    '.json' { 'application/json; charset=utf-8' }
    '.svg'  { 'image/svg+xml' }
    '.png'  { 'image/png' }
    '.jpg'  { 'image/jpeg' }
    '.ico'  { 'image/x-icon' }
    default { 'application/octet-stream' }
  }
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  Set-Cors $Ctx
  $Ctx.Response.StatusCode = 200
  $Ctx.Response.ContentType = $type
  $Ctx.Response.ContentLength64 = $bytes.Length
  $Ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $Ctx.Response.Close()
}

function Read-Body {
  param($Ctx)
  $reader = New-Object System.IO.StreamReader($Ctx.Request.InputStream, [System.Text.Encoding]::UTF8)
  $text = $reader.ReadToEnd()
  $reader.Close()
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
  return ($text | ConvertFrom-Json)
}

function Get-DayKey($Obj, [string]$Key) {
  return $Obj.PSObject.Properties[$Key]
}

$script:Db = Load-Db

try {
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add("http://localhost:$Port/")
  $listener.Prefixes.Add("http://127.0.0.1:$Port/")
  $listener.Start()
} catch {
  Write-Host "Cannot start server on port $Port : $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "If the port is busy, close the other program. If you see Access Denied, run PowerShell as administrator once:"
  Write-Host "  netsh http add urlacl url=http://localhost:$Port/ user=$env:USERNAME"
  exit 1
}

Write-Host ""
Write-Host "  Pet Store Manager server is running" -ForegroundColor Green
Write-Host "  H5 : http://localhost:$Port/"
Write-Host "  API: http://localhost:$Port/api/bootstrap"
Write-Host "  Data: $DataFile"
Write-Host "  Press Ctrl+C to stop."
Write-Host ""

while ($listener.IsListening) {
  $ctx = $null
  try {
    $ctx = $listener.GetContext()
  } catch {
    if ($listener.IsListening) { continue } else { break }
  }

  try {
    $method = $ctx.Request.HttpMethod
    $rawPath = $ctx.Request.Url.AbsolutePath
    $path = [System.Uri]::UnescapeDataString($rawPath)
    Write-Host ("[{0}] {1}" -f $method, $path)

    if ($method -eq 'OPTIONS') { Send-Empty $ctx 204; continue }

    # ---------- API ----------
    if ($path -eq '/api/bootstrap' -and $method -eq 'GET') {
      Send-Json $ctx @{
        ok = $true
        today = $script:Db.today
        store = $script:Db.store
        orders = $script:Db.orders
        appts = $script:Db.appts
        goods = $script:Db.goods
        seq = $script:Db.seq
        updatedAt = $script:Db.updatedAt
        serverTime = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
      }
      continue
    }

    if ($path -eq '/api/orders' -and $method -eq 'GET') {
      Send-Json $ctx @{ ok = $true; orders = $script:Db.orders; updatedAt = $script:Db.updatedAt }
      continue
    }

    if ($path -eq '/api/orders' -and $method -eq 'POST') {
      $body = Read-Body $ctx
      if ($null -eq $body) { Send-Json $ctx @{ ok = $false; error = 'Empty body' } 400; continue }
      $script:Db.seq = [int]$script:Db.seq + 1
      $new = [PSCustomObject]@{
        no = '#20261107' + ([string]$script:Db.seq)
        type = [string]$body.type
        avatar = [string]$body.avatar
        name = [string]$body.name
        phone = [string]$body.phone
        pet = [string]$body.pet
        items = @($body.items)
        amount = [int]$body.amount
        pay = [string]$body.pay
        time = (Get-Date).ToString('MM-dd HH:mm')
        status = [string]$body.status
        staff = [string]$body.staff
      }
      $script:Db.orders = @($new) + @($script:Db.orders)
      Save-Db
      Send-Json $ctx @{ ok = $true; order = $new; seq = $script:Db.seq; updatedAt = $script:Db.updatedAt }
      continue
    }

    if ($path -eq '/api/orders' -and $method -eq 'PATCH') {
      $no = [string]$ctx.Request.QueryString['no']
      if ([string]::IsNullOrEmpty($no)) { Send-Json $ctx @{ ok = $false; error = 'Missing order no' } 400; continue }
      $body = Read-Body $ctx
      $order = @($script:Db.orders) | Where-Object { $_.no -eq $no } | Select-Object -First 1
      if ($null -eq $order) { Send-Json $ctx @{ ok = $false; error = 'Order not found: ' + $no } 404; continue }
      $action = ''
      if ($null -ne $body -and $body.PSObject.Properties['action']) { $action = [string]$body.action }
      if ($action -eq 'done' -or $action -eq 'ship') { $order.status = '已完成' }
      elseif ($action -eq 'pay') { $order.status = '已完成'; $order.pay = '已付款 · 微信' }
      Save-Db
      Send-Json $ctx @{ ok = $true; order = $order; orders = $script:Db.orders; today = $script:Db.today; updatedAt = $script:Db.updatedAt }
      continue
    }

    if ($path -eq '/api/appointments' -and $method -eq 'GET') {
      $day = '0'
      $q = $ctx.Request.QueryString['day']
      if ($q) { $day = $q }
      $prop = Get-DayKey $script:Db.appts $day
      $list = @()
      if ($null -ne $prop) { $list = @($prop.Value) | Sort-Object { $_.time } }
      Send-Json $ctx @{ ok = $true; day = $day; appointments = $list }
      continue
    }

    if ($path -eq '/api/appointments' -and $method -eq 'POST') {
      $body = Read-Body $ctx
      if ($null -eq $body) { Send-Json $ctx @{ ok = $false; error = 'Empty body' } 400; continue }
      $day = '0'
      if ($body.PSObject.Properties['day']) { $day = [string]$body.day }
      $prop = Get-DayKey $script:Db.appts $day
      if ($null -eq $prop) { Send-Json $ctx @{ ok = $false; error = 'Bad day: ' + $day } 400; continue }
      $new = [PSCustomObject]@{
        time = [string]$body.time
        end = [string]$body.end
        name = [string]$body.name
        pet = [string]$body.pet
        svc = [string]$body.svc
        price = [int]$body.price
        staff = [string]$body.staff
        status = '已确认'
      }
      $prop.Value = @(@($prop.Value) + $new) | Sort-Object { $_.time }
      $script:Db.today.appts = [int]$script:Db.today.appts + 1
      Save-Db
      Send-Json $ctx @{
        ok = $true
        appointment = $new
        appointments = @(Get-DayKey $script:Db.appts $day).Value | Sort-Object { $_.time }
        today = $script:Db.today
      }
      continue
    }

    if ($path -eq '/api/goods' -and $method -eq 'GET') {
      Send-Json $ctx @{ ok = $true; goods = $script:Db.goods; updatedAt = $script:Db.updatedAt }
      continue
    }

    if ($path -match '^/api/goods/(\d+)/restock$' -and $method -eq 'POST') {
      $id = [int]$Matches[1]
      $body = Read-Body $ctx
      $qty = 20
      if ($null -ne $body -and $body.PSObject.Properties['qty']) { $qty = [int]$body.qty }
      $g = @($script:Db.goods) | Where-Object { $_.id -eq $id } | Select-Object -First 1
      if ($null -eq $g) { Send-Json $ctx @{ ok = $false; error = 'Goods not found' } 404; continue }
      $g.stock = [int]$g.stock + $qty
      Save-Db
      Send-Json $ctx @{ ok = $true; goods = $script:Db.goods; item = $g; updatedAt = $script:Db.updatedAt }
      continue
    }

    if ($path -eq '/api/store' -and $method -eq 'GET') {
      Send-Json $ctx @{ ok = $true; store = $script:Db.store }
      continue
    }

    if ($path -eq '/api/store' -and $method -eq 'PATCH') {
      $body = Read-Body $ctx
      if ($null -ne $body -and $body.PSObject.Properties['open']) {
        $script:Db.store.open = [bool]$body.open
      }
      Save-Db
      Send-Json $ctx @{ ok = $true; store = $script:Db.store; updatedAt = $script:Db.updatedAt }
      continue
    }

    if ($path -eq '/api/checkout' -and $method -eq 'POST') {
      $body = Read-Body $ctx
      if ($null -eq $body) { Send-Json $ctx @{ ok = $false; error = 'Empty body' } 400; continue }
      $amount = [int]$body.amount
      $script:Db.seq = [int]$script:Db.seq + 1
      $order = [PSCustomObject]@{
        no = '#20261107' + ([string]$script:Db.seq)
        type = [string]$body.type
        avatar = $(if ([string]$body.type -eq '服务') { '🐾' } else { '📦' })
        name = [string]$body.name
        phone = '到店顾客'
        pet = $(if ([string]$body.type -eq '服务') { '现场登记宠物' } else { '门店自提' })
        items = @([PSCustomObject]@{ n = [string]$body.itemName; q = 1; p = $amount })
        amount = $amount
        pay = '已收款 · ' + [string]$body.pay
        time = (Get-Date).ToString('MM-dd HH:mm')
        status = '已完成'
        staff = '店长'
      }
      $script:Db.orders = @($order) + @($script:Db.orders)
      $script:Db.today.revenue = [int]$script:Db.today.revenue + $amount
      $script:Db.today.orders = [int]$script:Db.today.orders + 1
      Save-Db
      Send-Json $ctx @{ ok = $true; order = $order; today = $script:Db.today; seq = $script:Db.seq; updatedAt = $script:Db.updatedAt }
      continue
    }

    if ($path -eq '/api/reset' -and $method -eq 'POST') {
      $script:Db = $Seed | ConvertFrom-Json
      Save-Db
      Send-Json $ctx @{ ok = $true; message = 'Data reset to demo seed' }
      continue
    }

    if ($path -like '/api/*') {
      Send-Json $ctx @{ ok = $false; error = 'No route for ' + $method + ' ' + $path } 404
      continue
    }

    # ---------- static ----------
    if ($method -eq 'GET') {
      $target = $null
      if ($path -eq '/' -or $path -eq '/index.html') { $target = $HtmlFile }
      elseif ($path -eq '/pet-store-manager.html') { $target = $HtmlFile }
      else {
        $rel = $path.TrimStart('/')
        if ($rel -and -not $rel.EndsWith('.json')) {
          $candidate = Join-Path $Root $rel
          $full = [System.IO.Path]::GetFullPath($candidate)
          if ($full.StartsWith([System.IO.Path]::GetFullPath($Root)) -and (Test-Path $full -PathType Leaf)) {
            $target = $full
          }
        }
      }
      if ($null -eq $target -or -not (Test-Path $target -PathType Leaf)) {
        Send-Json $ctx @{ ok = $false; error = 'Not found' } 404
        continue
      }
      Send-File $ctx $target
      continue
    }

    Send-Json $ctx @{ ok = $false; error = 'Method not allowed' } 405
  } catch {
    try {
      Send-Json $ctx @{ ok = $false; error = $_.Exception.Message } 500
    } catch { }
  }
}

$listener.Stop()
$listener.Close()
Write-Host "Server stopped."
