# Windows 自带静态预览。TCPListener 不需要 HttpListener 的 URL ACL 管理员授权。
param([int]$PreviewPort = 8126, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$jiaheRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$jiahePreviewUrl = 'http://127.0.0.1:' + $PreviewPort + '/'
function Open-JiahePreview {
  $jiaheBrowserInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $jiaheBrowserInfo.FileName = $jiahePreviewUrl
  $jiaheBrowserInfo.UseShellExecute = $true
  [System.Diagnostics.Process]::Start($jiaheBrowserInfo) | Out-Null
}
$jiaheListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $PreviewPort)
try { $jiaheListener.Start() } catch {
  $jiaheBindError = $_.Exception.Message
  $jiaheExisting = $null
  try { $jiaheExisting = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri $jiahePreviewUrl } catch {}
  if ($jiaheExisting -and $jiaheExisting.Content -match '嘉禾农业' -and $jiaheExisting.Content -match 'assets/intake.js') {
    Write-Host ('Static preview is already running: ' + $jiahePreviewUrl)
    if (-not $NoBrowser) { Open-JiahePreview }
    exit 0
  }
  Write-Host ('Cannot start preview: ' + $jiaheBindError)
  exit 1
}
Write-Host ('Static preview: ' + $jiahePreviewUrl + '  Keep this window open. Ctrl+C to stop.')
if (-not $NoBrowser) { Open-JiahePreview }
$jiaheTypes = @{ '.html'='text/html; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.svg'='image/svg+xml'; '.jpg'='image/jpeg'; '.png'='image/png'; '.wav'='audio/wav' }
try {
  while ($true) {
    $jiaheClient = $jiaheListener.AcceptTcpClient()
    try {
      $jiaheStream = $jiaheClient.GetStream()
      $jiaheStream.ReadTimeout = 5000
      $jiaheReader = [System.IO.StreamReader]::new($jiaheStream,[System.Text.Encoding]::ASCII,$false,1024,$true)
      $jiaheRequest = $jiaheReader.ReadLine()
      if (-not $jiaheRequest) { continue }
      $jiaheParts = $jiaheRequest -split ' ',3
      $jiaheHeaderCount = 0
      while ($jiaheHeaderCount -lt 100) { $jiaheHeader = $jiaheReader.ReadLine(); $jiaheHeaderCount++; if (-not $jiaheHeader) { break } }
      $jiaheStatus = '200 OK'
      $jiaheContentType = 'text/plain; charset=utf-8'
      $jiaheBytes = [byte[]]@()
      if ($jiaheParts[0] -notin @('GET','HEAD')) { $jiaheStatus = '405 Method Not Allowed' }
      else {
        $jiaheUrlPath = [System.Uri]::UnescapeDataString(($jiaheParts[1] -split '\?',2)[0])
        if ($jiaheUrlPath -eq '/') { $jiaheUrlPath = '/index.html' }
        $jiaheFile = [System.IO.Path]::GetFullPath((Join-Path $jiaheRoot $jiaheUrlPath.TrimStart('/')))
        if (-not $jiaheFile.StartsWith($jiaheRoot + [System.IO.Path]::DirectorySeparatorChar,[System.StringComparison]::OrdinalIgnoreCase) -or $jiaheUrlPath.Contains('/.')) { $jiaheStatus = '403 Forbidden' }
        elseif (-not [System.IO.File]::Exists($jiaheFile)) { $jiaheStatus = '404 Not Found' }
        else {
          $jiaheBytes = [System.IO.File]::ReadAllBytes($jiaheFile)
          $jiaheExt = [System.IO.Path]::GetExtension($jiaheFile)
          if ($jiaheTypes.ContainsKey($jiaheExt)) { $jiaheContentType = $jiaheTypes[$jiaheExt] }
        }
      }
      $jiaheResponse = "HTTP/1.1 $jiaheStatus`r`nContent-Type: $jiaheContentType`r`nContent-Length: $($jiaheBytes.Length)`r`nConnection: close`r`nCache-Control: no-store`r`n`r`n"
      $jiaheHeadBytes = [System.Text.Encoding]::ASCII.GetBytes($jiaheResponse)
      $jiaheStream.Write($jiaheHeadBytes,0,$jiaheHeadBytes.Length)
      if ($jiaheParts[0] -eq 'GET' -and $jiaheBytes.Length -gt 0) { $jiaheStream.Write($jiaheBytes,0,$jiaheBytes.Length) }
      $jiaheStream.Flush()
    } catch { Write-Verbose $_.Exception.Message }
    finally { $jiaheClient.Close() }
  }
} finally { $jiaheListener.Stop() }
