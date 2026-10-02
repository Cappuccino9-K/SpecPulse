$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Stop-Tree([System.Diagnostics.Process] $Process) {
  if (-not $Process -or $Process.HasExited) { return }
  $taskkill = Join-Path $env:SystemRoot "System32\taskkill.exe"
  if (-not (Test-Path $taskkill)) { return }
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $taskkill /PID $Process.Id /T /F 2>$null | Out-Null
  } catch {
  } finally {
    $ErrorActionPreference = $previous
  }
}

function Find-Psql {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $installed = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\psql.exe" -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
  if ($installed) { return $installed.FullName }
  return $null
}

function Read-Secret([string] $Label) {
  $secure = Read-Host $Label -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

function Invoke-Psql {
  param(
    [string] $Psql,
    [string] $Database,
    [string] $Sql,
    [switch] $Capture
  )
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  if ($Capture) {
    $output = & $Psql -h 127.0.0.1 -U postgres -d $Database -v ON_ERROR_STOP=1 -tAc $Sql 2>$null
  } else {
    & $Psql -h 127.0.0.1 -U postgres -d $Database -v ON_ERROR_STOP=1 -c $Sql 1>$null 2>$null
    $output = $null
  }
  $code = $LASTEXITCODE
  $ErrorActionPreference = $previous
  return @{ Code = $code; Output = "$output".Trim() }
}

function Initialize-AppDatabase([string] $Psql, [string] $Password) {
  $services = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
  foreach ($service in $services) {
    if ($service.Status -ne "Running") {
      try { Start-Service $service.Name } catch {
        Write-Host "PostgreSQL 서비스 $($service.Name) 를 시작하지 못했습니다. services.msc에서 실행 중인지 확인하세요."
      }
    }
  }

  $previous = $env:PGPASSWORD
  $env:PGPASSWORD = $Password
  $check = Invoke-Psql -Psql $Psql -Database "postgres" -Sql "SELECT 1" -Capture
  if ($check.Code -ne 0) {
    $env:PGPASSWORD = $previous
    throw "postgres 계정으로 접속하지 못했습니다. 비밀번호를 다시 확인하고 start.bat을 다시 실행하세요."
  }

  $exists = Invoke-Psql -Psql $Psql -Database "postgres" -Sql "SELECT 1 FROM pg_database WHERE datname = 'specpulse'" -Capture
  if ($exists.Output -ne "1") {
    $created = Invoke-Psql -Psql $Psql -Database "postgres" -Sql "CREATE DATABASE specpulse"
    if ($created.Code -ne 0) {
      $env:PGPASSWORD = $previous
      throw "specpulse 데이터베이스를 만들지 못했습니다."
    }
  }
  Invoke-Psql -Psql $Psql -Database "specpulse" -Sql "GRANT ALL ON SCHEMA public TO postgres" | Out-Null
  $env:PGPASSWORD = $previous
}

Write-Host "SpecPulse를 루트에서 시작합니다."

$psql = Find-Psql
if (-not $psql) {
  throw "PostgreSQL이 설치되어 있지 않습니다. https://www.postgresql.org/download/windows/ 에서 Windows 설치본을 설치한 뒤 start.bat을 다시 실행하세요."
}

Write-Host "PostgreSQL 설치 때 정한 postgres 비밀번호를 입력하세요. 이 값은 화면에 표시되지 않고 파일에도 저장하지 않습니다."
$password = Read-Secret "postgres password"
if ([string]::IsNullOrWhiteSpace($password)) {
  throw "비밀번호가 비어 있습니다."
}

Initialize-AppDatabase $psql $password
$encoded = [Uri]::EscapeDataString($password)
$env:DATABASE_URL = "postgresql+pg8000://postgres:${encoded}@127.0.0.1:5432/specpulse"
$env:PYTHONUNBUFFERED = "1"
$env:PYTHONFAULTHANDLER = "1"
$password = $null

function Invoke-Quiet {
  param([string] $Exe, [string[]] $ArgumentList)
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $raw = & $Exe @ArgumentList 2>&1
    return @{ Code = $LASTEXITCODE; Lines = @($raw | ForEach-Object { "$_" }) }
  } catch {
    return @{ Code = 1; Lines = @("$_") }
  } finally {
    $ErrorActionPreference = $previous
  }
}

function Get-PythonFacts {
  param([string] $Exe, [string[]] $PrefixArgs)
  if (-not $PrefixArgs) { $PrefixArgs = @() }
  $probe = Invoke-Quiet $Exe ($PrefixArgs + @("-c", "import sys; print(sys.version_info.major); print(sys.version_info.minor); print(64 if sys.maxsize > 2**32 else 32)"))
  if ($probe.Code -ne 0) { return $null }
  $lines = @($probe.Lines | Where-Object { $_ -match '^\d+$' })
  if ($lines.Count -lt 3) { return $null }
  return @{
    Major = [int]$lines[0]
    Minor = [int]$lines[1]
    Bits = [int]$lines[2]
  }
}

function Test-SupportedPython($Facts) {
  if (-not $Facts) { return $false }
  return $Facts.Bits -eq 64 -and $Facts.Major -eq 3 -and $Facts.Minor -ge 11 -and $Facts.Minor -le 15
}

function Get-InstalledPythonCommands {
  $commands = @()
  if (Get-Command py -ErrorAction SilentlyContinue) {
    foreach ($tag in @("-3.13", "-3.12", "-3.11", "-3.14", "-3.15", "-3")) {
      $commands += @{ Exe = "py"; Args = @($tag) }
    }
    $listed = Invoke-Quiet "py" @("-0p")
    foreach ($line in $listed.Lines) {
      if ($line -match '([A-Za-z]:\\[^"]*python\.exe)') {
        $commands += @{ Exe = $Matches[1]; Args = @() }
      }
    }
  }
  if (Get-Command python -ErrorAction SilentlyContinue) {
    $commands += @{ Exe = "python"; Args = @() }
  }
  $patterns = @(
    (Join-Path $env:LocalAppData "Programs\Python\Python*\python.exe"),
    (Join-Path $env:ProgramFiles "Python*\python.exe"),
    "C:\Python*\python.exe"
  )
  foreach ($pattern in $patterns) {
    $found = Get-Item $pattern -ErrorAction SilentlyContinue
    foreach ($item in @($found)) {
      if ($item) { $commands += @{ Exe = $item.FullName; Args = @() } }
    }
  }
  return $commands
}

$venvDir = Join-Path $Root "backend\.venv"
$venvPython = Join-Path $venvDir "Scripts\python.exe"
if (Test-Path $venvPython) {
  $venvFacts = Get-PythonFacts $venvPython @()
  if (-not (Test-SupportedPython $venvFacts)) {
    $label = if ($venvFacts) { "$($venvFacts.Major).$($venvFacts.Minor) $($venvFacts.Bits)비트" } else { "알 수 없음" }
    Write-Host "기존 가상환경 Python $label 는 지원하지 않아 다시 만듭니다."
    Remove-Item -Recurse -Force $venvDir
  }
}
if (-not (Test-Path $venvPython)) {
  $python = $null
  $pythonArgs = @()
  $seen = @{}
  foreach ($candidate in (Get-InstalledPythonCommands)) {
    $key = "$($candidate.Exe) $($candidate.Args -join ' ')"
    if ($seen.ContainsKey($key)) { continue }
    $seen[$key] = $true
    $facts = Get-PythonFacts $candidate.Exe $candidate.Args
    if (Test-SupportedPython $facts) {
      $python = $candidate.Exe
      $pythonArgs = $candidate.Args
      Write-Host "Python $($facts.Major).$($facts.Minor) 64비트를 사용합니다."
      break
    }
  }
  if (-not $python) {
    $listing = ""
    if (Get-Command py -ErrorAction SilentlyContinue) {
      $listing = ((Invoke-Quiet "py" @("-0p")).Lines -join "`n")
    }
    throw "지원하는 Python이 없습니다. 3.11부터 3.15까지 64비트가 필요합니다. 32비트는 휠이 없어 설치가 실패합니다. https://www.python.org/downloads/windows/ 에서 Windows installer (64-bit)를 설치하세요.`n설치된 런타임:`n$listing"
  }
  Write-Host "Python 가상환경을 만듭니다."
  & $python @pythonArgs -m venv $venvDir
  if ($LASTEXITCODE -ne 0) { throw "가상환경을 만들지 못했습니다." }
}

Write-Host "백엔드 패키지를 확인합니다. 처음에는 몇 분 걸립니다."
& $venvPython -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw "pip 업그레이드에 실패했습니다." }
& $venvPython -m pip install --only-binary=:all: -r (Join-Path $Root "backend\requirements.txt")
if ($LASTEXITCODE -ne 0) { throw "pip install에 실패했습니다." }

$envFile = Join-Path $Root "backend\.env"
if (-not (Test-Path $envFile)) {
  Copy-Item (Join-Path $Root "backend\.env.example") $envFile
}

$npm = $null
if (Get-Command npm.cmd -ErrorAction SilentlyContinue) {
  $npm = (Get-Command npm.cmd).Source
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
  $npm = (Get-Command npm).Source
} else {
  throw "Node.js가 필요합니다. https://nodejs.org 에서 LTS를 설치하세요."
}

if (-not (Test-Path (Join-Path $Root "frontend\node_modules"))) {
  Write-Host "프론트엔드 패키지를 설치합니다."
  Push-Location (Join-Path $Root "frontend")
  & $npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install에 실패했습니다." }
  Pop-Location
}

$node = $null
if (Get-Command node.exe -ErrorAction SilentlyContinue) {
  $node = (Get-Command node.exe).Source
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
  $node = (Get-Command node).Source
} else {
  throw "Node.js가 필요합니다. https://nodejs.org 에서 LTS를 설치하세요."
}
$nextBin = Join-Path $Root "frontend\node_modules\next\dist\bin\next"
if (-not (Test-Path $nextBin)) {
  throw "프론트엔드 실행 파일을 찾지 못했습니다. frontend 폴더에서 npm install을 확인해 주세요."
}

Write-Host "PostgreSQL 127.0.0.1:5432  API http://127.0.0.1:8765  화면 http://127.0.0.1:43721"
Write-Host "끝내려면 이 창에서 Ctrl+C 를 누르세요."

$backend = Start-Process -FilePath $venvPython -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8765") -WorkingDirectory (Join-Path $Root "backend") -NoNewWindow -PassThru
$frontend = Start-Process -FilePath $node -ArgumentList @($nextBin, "dev", "-H", "0.0.0.0", "-p", "43721") -WorkingDirectory (Join-Path $Root "frontend") -NoNewWindow -PassThru

function Test-Running([System.Diagnostics.Process] $Process) {
  if (-not $Process) { return $false }
  try { $Process.Refresh() } catch { return $false }
  if (-not $Process.HasExited) { return $true }
  return $null -ne (Get-Process -Id $Process.Id -ErrorAction SilentlyContinue)
}

try {
  while ((Test-Running $backend) -and (Test-Running $frontend)) {
    Start-Sleep -Seconds 1
  }
  if (-not (Test-Running $backend)) {
    Write-Host "API 프로세스가 종료되었습니다. 코드 $($backend.ExitCode)"
  }
  if (-not (Test-Running $frontend)) {
    Write-Host "화면 프로세스가 종료되었습니다. 코드 $($frontend.ExitCode)"
  }
} finally {
  Stop-Tree $backend
  Stop-Tree $frontend
}
