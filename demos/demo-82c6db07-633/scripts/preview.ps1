# Windows 自带静态预览。TCPListener 不需要 HttpListener 的 URL ACL 管理员授权。
param([int]$PreviewPort = 8117, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$ymmRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$ymmPreviewUrl = 'http://127.0.0.1:' + $PreviewPort + '/'
$ymmListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $PreviewPort)
try { $ymmListener.Start() } catch { Write-Host ('Cannot start preview: ' + $_.Exception.Message); Write-Host $ymmPreviewUrl; exit 1 }
Write-Host ('Static preview: ' + $ymmPreviewUrl + '  Keep this window open. Ctrl+C to stop.')
if (-not $NoBrowser) {
  $ymmBrowserInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $ymmBrowserInfo.FileName = $ymmPreviewUrl
  $ymmBrowserInfo.UseShellExecute = $true
  [System.Diagnostics.Process]::Start($ymmBrowserInfo) | Out-Null
}
$ymmTypes = @{ '.html'='text/html; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.svg'='image/svg+xml'; '.jpg'='image/jpeg'; '.png'='image/png' }
try {
  while ($true) {
    $ymmClient = $ymmListener.AcceptTcpClient()
    try {
      $ymmStream = $ymmClient.GetStream()
      $ymmStream.ReadTimeout = 5000
      $ymmReader = [System.IO.StreamReader]::new($ymmStream,[System.Text.Encoding]::ASCII,$false,1024,$true)
      $ymmRequest = $ymmReader.ReadLine()
      if (-not $ymmRequest) { continue }
      $ymmParts = $ymmRequest -split ' ',3
      $ymmHeaderCount = 0
      while ($ymmHeaderCount -lt 100) { $ymmHeader = $ymmReader.ReadLine(); $ymmHeaderCount++; if (-not $ymmHeader) { break } }
      $ymmStatus = '200 OK'
      $ymmContentType = 'text/plain; charset=utf-8'
      $ymmBytes = [byte[]]@()
      if ($ymmParts[0] -notin @('GET','HEAD')) { $ymmStatus = '405 Method Not Allowed' }
      else {
        $ymmUrlPath = [System.Uri]::UnescapeDataString(($ymmParts[1] -split '\?',2)[0])
        if ($ymmUrlPath -eq '/') { $ymmUrlPath = '/index.html' }
        $ymmFile = [System.IO.Path]::GetFullPath((Join-Path $ymmRoot $ymmUrlPath.TrimStart('/')))
        if (-not $ymmFile.StartsWith($ymmRoot + [System.IO.Path]::DirectorySeparatorChar,[System.StringComparison]::OrdinalIgnoreCase) -or $ymmUrlPath.Contains('/.')) { $ymmStatus = '403 Forbidden' }
        elseif (-not [System.IO.File]::Exists($ymmFile)) { $ymmStatus = '404 Not Found' }
        else {
          $ymmBytes = [System.IO.File]::ReadAllBytes($ymmFile)
          $ymmExt = [System.IO.Path]::GetExtension($ymmFile)
          if ($ymmTypes.ContainsKey($ymmExt)) { $ymmContentType = $ymmTypes[$ymmExt] }
        }
      }
      $ymmResponse = "HTTP/1.1 $ymmStatus`r`nContent-Type: $ymmContentType`r`nContent-Length: $($ymmBytes.Length)`r`nConnection: close`r`nCache-Control: no-store`r`n`r`n"
      $ymmHeadBytes = [System.Text.Encoding]::ASCII.GetBytes($ymmResponse)
      $ymmStream.Write($ymmHeadBytes,0,$ymmHeadBytes.Length)
      if ($ymmParts[0] -eq 'GET' -and $ymmBytes.Length -gt 0) { $ymmStream.Write($ymmBytes,0,$ymmBytes.Length) }
      $ymmStream.Flush()
    } catch { Write-Verbose $_.Exception.Message }
    finally { $ymmClient.Close() }
  }
} finally { $ymmListener.Stop() }