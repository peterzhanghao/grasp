# Loop Atlas QA test entry (Windows PowerShell 5.1, ASCII-only to avoid ANSI/BOM parsing issues).
#
# Usage:
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools\qa\run-tests.ps1
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools\qa\run-tests.ps1 -Browser
#
# Steps:
#   1. node --test test/harness          (fake-host harness self test)
#   2. node --test test/integration      (R0/R1/R3/R4 integration tests; Node >= 24 dir arg handled by test/integration/package.json)
#   3. node tools/qa/probe-host.mjs      (host contract probe)
#   4. node tools/qa/repro-host-defects.mjs (known defect regression; all FIXED expected)
#   5. optional -Browser: node tools/qa/browser-check.mjs (fake host + real Chromium layout check, dev evidence only)
# Outputs: console + tools\qa\evidence\runs\<timestamp>\*.log and summary.json

param(
  [switch]$Browser,
  [switch]$SkipProbe
)

$ErrorActionPreference = 'Continue'
try {
  $OutputEncoding = [System.Text.Encoding]::UTF8
  [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch { }

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$evidence = Join-Path $root ("tools\qa\evidence\runs\" + $stamp)
New-Item -ItemType Directory -Force -Path $evidence | Out-Null

$summary = New-Object System.Collections.ArrayList

function Invoke-Step {
  param(
    [string]$Name,
    [string]$Command
  )
  Write-Host ""
  Write-Host ("===== " + $Name + " =====") -ForegroundColor Cyan
  Write-Host ("$ " + $Command)
  $log = Join-Path $evidence ($Name + '.log')
  $started = Get-Date
  cmd /c "$Command 2>&1" | Tee-Object -FilePath $log
  $exit = $LASTEXITCODE
  $elapsed = [int]((Get-Date) - $started).TotalSeconds
  $result = [PSCustomObject]@{
    step    = $Name
    exit    = $exit
    seconds = $elapsed
    log     = $log
  }
  [void]$summary.Add($result)
  if ($exit -eq 0) {
    Write-Host ("[OK] " + $Name + " (" + $elapsed + "s)") -ForegroundColor Green
  } else {
    Write-Host ("[FAIL] " + $Name + " (exit " + $exit + ", " + $elapsed + "s, log " + $log + ")") -ForegroundColor Red
  }
}

Push-Location $root
try {
  Write-Host ("Loop Atlas QA run started: " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
  Write-Host ("Root: " + $root)
  Write-Host ("Evidence: " + $evidence)

  Invoke-Step '01-harness' 'node --test test/harness'
  Invoke-Step '02-integration' 'node --test test/integration'
  if (-not $SkipProbe) {
    Invoke-Step '03-probe-host' 'node tools/qa/probe-host.mjs'
    Invoke-Step '04-repro-defects' 'node tools/qa/repro-host-defects.mjs'
  }
  if ($Browser) {
    Invoke-Step '05-browser-check' 'node tools/qa/browser-check.mjs'
  }

  Write-Host ""
  Write-Host "===== summary =====" -ForegroundColor Cyan
  $failed = New-Object System.Collections.ArrayList
  foreach ($item in $summary) {
    Write-Host (("{0,-20} exit={1}  {2}s  {3}" -f $item.step, $item.exit, $item.seconds, $item.log))
    if ($item.exit -ne 0) { [void]$failed.Add($item) }
  }
  $summaryPath = Join-Path $evidence 'summary.json'
  $summary | ConvertTo-Json -Depth 4 | Out-File -FilePath $summaryPath -Encoding utf8
  Write-Host ("Summary: " + $summaryPath)

  if ($failed.Count -gt 0) {
    Write-Host ""
    $names = ($failed | ForEach-Object { $_.step }) -join ', '
    Write-Host ("FAILED steps: " + $names) -ForegroundColor Red
    exit 1
  }
  Write-Host ""
  Write-Host "All steps passed (mock/harness PASS != real-app acceptance; see docs/acceptance.md)" -ForegroundColor Green
  exit 0
} finally {
  Pop-Location
}
