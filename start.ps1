$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Stop-Tree([System.Diagnostics.Process] $Process) {
  if (-not $Process -or $Process.HasExited) { return }
  & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Null
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
$env:DATABASE_URL = "postgresql+psycopg://postgres:${encoded}@127.0.0.1:5432/specpulse"
$password = $null

function Get-PythonFacts {
  param([string] $Exe, [string[]] $PrefixArgs)
  $raw = & $Exe @PrefixArgs -c "import sys; print(sys.version_info.major); print(sys.version_info.minor); print(64 if sys.maxsize > 2**32 else 32)" 2>$null
  if ($LASTEXITCODE -ne 0) { return $null }
  $lines = @($raw | Where-Object { $_ -ne $null -and "$_".Trim() -ne "" })
  if ($lines.Count -lt 3) { return $null }
  return @{
    Major = [int]$lines[0]
    Minor = [int]$lines[1]
    Bits = [int]$lines[2]
  }
}

function Test-SupportedPython($Facts) {
  if (-not $Facts) { return $false }
  return $Facts.Bits -eq 64 -and $Facts.Major -eq 3 -and $Facts.Minor -ge 11 -and $Facts.Minor -le 14
}

$pythonCandidates = @()
if (Get-Command py -ErrorAction SilentlyContinue) {
  $pythonCandidates += @{ Exe = "py"; Args = @("-3.13") }
  $pythonCandidates += @{ Exe = "py"; Args = @("-3.12") }
  $pythonCandidates += @{ Exe = "py"; Args = @("-3.11") }
  $pythonCandidates += @{ Exe = "py"; Args = @("-3.14") }
  $pythonCandidates += @{ Exe = "py"; Args = @("-3") }
}
if (Get-Command python -ErrorAction SilentlyContinue) {
  $pythonCandidates += @{ Exe = "python"; Args = @() }
}
if ($pythonCandidates.Count -eq 0) {
  throw "Python 3.11-3.14 64비트가 필요합니다. https://www.python.org/downloads/ 에서 Windows installer (64-bit)를 설치하고 Add python.exe to PATH를 켜 주세요."
}

$python = $null
$pythonArgs = @()
foreach ($candidate in $pythonCandidates) {
  $facts = Get-PythonFacts $candidate.Exe $candidate.Args
  if (Test-SupportedPython $facts) {
    $python = $candidate.Exe
    $pythonArgs = $candidate.Args
    break
  }
}
if (-not $python) {
  throw "지원하는 Python이 없습니다. 3.11, 3.12, 3.13, 3.14 64비트만 사용할 수 있습니다. Python 3.15와 32비트는 휠이 없어 설치가 실패합니다. https://www.python.org/downloads/windows/ 에서 Windows installer (64-bit) 3.13을 설치하세요."
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

Write-Host "PostgreSQL 127.0.0.1:5432  API http://127.0.0.1:8765  화면 http://127.0.0.1:43123"
Write-Host "끝내려면 이 창에서 Ctrl+C 를 누르세요."

$backend = Start-Process -FilePath $venvPython -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8765") -WorkingDirectory (Join-Path $Root "backend") -NoNewWindow -PassThru
$frontend = Start-Process -FilePath $npm -ArgumentList @("run", "dev") -WorkingDirectory (Join-Path $Root "frontend") -NoNewWindow -PassThru

try {
  while (-not $backend.HasExited -and -not $frontend.HasExited) {
    Start-Sleep -Seconds 1
  }
} finally {
  Stop-Tree $backend
  Stop-Tree $frontend
}
