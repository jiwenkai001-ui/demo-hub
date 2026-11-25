param(
    [ValidateRange(1024,65535)][int]$Port = 8800,
    [switch]$NoBrowser,
    [switch]$NoSeed
)
$ErrorActionPreference = 'Stop'
$address = "http://127.0.0.1:$Port/"

try {
    $existing = Invoke-RestMethod -Uri ($address + 'health') -TimeoutSec 2
    if ($existing.app -eq 'yunshang-queue') {
        if ($existing.version -ne '2.2') {
            Write-Host '检测到旧版服务，请关闭原启动窗口，再启动新版 Demo。' -ForegroundColor Yellow
            exit 1
        }
        Write-Host "演示服务已在运行：$address" -ForegroundColor Green
        if (-not $NoBrowser) { Start-Process $address }
        exit 0
    }
} catch { }

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
try { $listener.Start() } catch {
    Write-Host "端口 $Port 被其他程序占用。请使用：.\start-demo.ps1 -Port 8801" -ForegroundColor Yellow
    exit 1
} finally { $listener.Stop() }

$candidates = @()
if (Get-Command py -ErrorAction SilentlyContinue) { $candidates += @{Command='py'; Prefix=@('-3')} }
if (Get-Command python -ErrorAction SilentlyContinue) { $candidates += @{Command='python'; Prefix=@()} }
$pythonRoot = Join-Path $env:LOCALAPPDATA 'Programs\Python'
if (Test-Path -LiteralPath $pythonRoot) {
    Get-ChildItem -LiteralPath $pythonRoot -Directory -Filter 'Python*' | Sort-Object Name -Descending | ForEach-Object {
        $executable = Join-Path $_.FullName 'python.exe'
        if (Test-Path -LiteralPath $executable) { $candidates += @{Command=$executable; Prefix=@()} }
    }
}
$runtime = $null
foreach ($candidate in $candidates) {
    try {
        $candidateCommand = $candidate.Command
        $candidatePrefix = $candidate.Prefix
        $detected = & $candidateCommand @candidatePrefix --version 2>&1
        if ($LASTEXITCODE -eq 0 -and "$detected" -match 'Python (\d+\.\d+\.\d+)' -and [version]$Matches[1] -ge [version]'3.10.0') {
            $runtime = $candidate
            break
        }
    } catch { }
}
if ($null -eq $runtime) {
    Write-Host '未找到 Python 3.10 或以上版本。请安装 Python 后重新启动。' -ForegroundColor Yellow
    Write-Host '下载地址：https://www.python.org/downloads/'
    exit 1
}

Write-Host ''
Write-Host '云裳序 · 排队叫号演示系统' -ForegroundColor Cyan
Write-Host "访问地址：$address"
Write-Host '商户账号：admin / 123456（若已设置环境变量，以自定义口令为准）'
Write-Host '关闭窗口或按 Ctrl+C 停止服务。再次启动会保留已保存的数据。'
Write-Host ''
$runtimeCommand = $runtime.Command
$runtimePrefix = $runtime.Prefix
$demoArgs = @((Join-Path $PSScriptRoot 'serve_demo.py'), '--host', '0.0.0.0', '--port', "$Port")
if (-not $NoSeed) { $demoArgs += '--seed-demo' }
if (-not $NoBrowser) { $demoArgs += '--open-browser' }
& $runtimeCommand @runtimePrefix @demoArgs
exit $LASTEXITCODE
