$ErrorActionPreference = 'Stop'

$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
$BackendDir = Join-Path $Root 'legacy\backend-python'
$RustExe = Join-Path $Root 'backend-dist\koudanbao-backend.exe'
$DataDir = Join-Path ([System.IO.Path]::GetTempPath()) ('koudanbao-backend-test-' + [System.Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force $DataDir | Out-Null

# 优先用 Rust 版产物（backend-dist），缺失时回退 Python
$useRust = Test-Path $RustExe
$stdout = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()
$stderr = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()

$psi = [System.Diagnostics.ProcessStartInfo]::new()
if ($useRust) {
  $psi.FileName = $RustExe
  $psi.WorkingDirectory = (Split-Path $RustExe)
  $psi.Arguments = '--host 127.0.0.1 --port 0 --print-json-ready'
} else {
  $psi.FileName = 'python'
  $psi.WorkingDirectory = $BackendDir
  $psi.Arguments = 'server.py --host 127.0.0.1 --port 0 --print-json-ready'
}
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.Environment['KDB_DATA_DIR'] = $DataDir

$proc = [System.Diagnostics.Process]::new()
$proc.StartInfo = $psi
$proc.EnableRaisingEvents = $true
$null = Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
  if ($EventArgs.Data) { $Event.MessageData.Enqueue($EventArgs.Data) }
} -MessageData $stdout
$null = Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
  if ($EventArgs.Data) { $Event.MessageData.Enqueue($EventArgs.Data) }
} -MessageData $stderr

try {
  if (-not $proc.Start()) { throw '无法启动后端测试进程' }
  $proc.BeginOutputReadLine()
  $proc.BeginErrorReadLine()

  $ready = $null
  $line = $null
  $errLine = $null
  $deadline = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $deadline) {
    while ($stdout.TryDequeue([ref]$line)) {
      Write-Host $line
      if ($line.TrimStart().StartsWith('{')) {
        try {
          $obj = $line | ConvertFrom-Json -ErrorAction Stop
          if ($obj.event -eq 'ready' -and $obj.url) { $ready = $obj; break }
        } catch {}
      }
    }
    if ($ready) { break }
    if ($proc.HasExited) {
      $errLines = @()
      while ($stderr.TryDequeue([ref]$errLine)) { $errLines += $errLine }
      throw "后端提前退出，exit=$($proc.ExitCode)`n$($errLines -join [Environment]::NewLine)"
    }
    Start-Sleep -Milliseconds 100
  }
  if (-not $ready) { throw '等待后端 ready 超时' }

  Write-Host "[test-backend] url=$($ready.url) dataDir=$DataDir"
  $test = Start-Process -FilePath 'python' -ArgumentList @('tests/test_backend_protocol.py', $ready.url) -WorkingDirectory $Root -NoNewWindow -Wait -PassThru
  if ($test.ExitCode -ne 0) { exit $test.ExitCode }
  # 引擎 golden 校验（M6：复用已启动后端，Rust 单后端比对固化期望）
  $golden = Start-Process -FilePath 'python' -ArgumentList @('tests/test-engine-parity.py', '--golden', 'tests/engine-golden.json', $ready.url) -WorkingDirectory $Root -NoNewWindow -Wait -PassThru
  if ($golden.ExitCode -ne 0) { exit $golden.ExitCode }
} finally {
  if ($proc -and -not $proc.HasExited) {
    try { $proc.Kill($true) } catch { try { $proc.Kill() } catch {} }
    try { $proc.WaitForExit(5000) | Out-Null } catch {}
  }
  try { Remove-Item -LiteralPath $DataDir -Recurse -Force -ErrorAction SilentlyContinue } catch {}
}
