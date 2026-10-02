$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Stop-Tree([System.Diagnostics.Process] $Process) {
  if (-not $Process -or $Process.HasExited) { return }
  & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Null
}

Write-Host "SpecPulse를 루트에서 시작합니다."

$useSqlite = $true
if (Get-Command docker -ErrorAction SilentlyContinue) {
  docker info 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL을 띄웁니다."
    docker compose up -d
    if ($LASTEXITCODE -eq 0) {
      for ($i = 0; $i -lt 30; $i++) {
        docker compose exec -T db pg_isready -U specpulse -d specpulse 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $useSqlite = $false; break }
        Start-Sleep -Seconds 1
      }
    }
  }
}

if ($useSqlite) {
  Write-Host "Docker 가상화를 쓸 수 없어 파일 데이터베이스로 실행합니다. BIOS 설정 없이도 동작합니다."
  $env:DATABASE_URL = "sqlite+aiosqlite:///./specpulse.db"
} else {
  $env:DATABASE_URL = "postgresql+asyncpg://specpulse:specpulse@127.0.0.1:5432/specpulse"
}

$python = $null
$pythonArgs = @()
if (Get-Command py -ErrorAction SilentlyContinue) {
  $python = "py"
  $pythonArgs = @("-3")
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  $python = "python"
} else {
  throw "Python 3.11 이상이 필요합니다. https://www.python.org/downloads/ 에서 설치하고 Add python.exe to PATH를 켜 주세요."
}

$venvPython = Join-Path $Root "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
  Write-Host "Python 가상환경을 만듭니다."
  & $python @pythonArgs -m venv (Join-Path $Root "backend\.venv")
  if ($LASTEXITCODE -ne 0) { throw "가상환경을 만들지 못했습니다." }
}

Write-Host "백엔드 패키지를 확인합니다. 처음에는 몇 분 걸립니다."
& $venvPython -m pip install -q -r (Join-Path $Root "backend\requirements.txt")
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

Write-Host "API http://127.0.0.1:8765  화면 http://127.0.0.1:43123"
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
