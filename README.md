# SpecPulse

노트북, 태블릿, 그래픽카드 페이지 주소 두 개를 넣어 스펙을 나란히 비교하고, 사용자 리뷰에서 장점·아쉬운 점·추천 대상을 정리하는 대시보드입니다.

- 백엔드: FastAPI, Pydantic v2, SQLAlchemy, PostgreSQL, Crawl4AI(선택)
- 프론트엔드: Next.js (App Router), TypeScript, Tailwind CSS
- 분석 엔진: 로컬 파서, OpenAI `gpt-4o-mini`, Ollama `qwen2.5` / `llama3.1` 전환

화면은 Material Design의 표면, 톤 버튼, 데이터 테이블 리듬을 따릅니다. 다크 모드와 라이트 모드를 모두 지원합니다.

## 로컬 실행

Windows에서는 Docker를 쓰지 않습니다. [PostgreSQL Windows 설치본](https://www.postgresql.org/download/windows/)을 설치한 뒤, 압축을 푼 루트 폴더의 `start.bat`을 더블클릭합니다. 실행할 때마다 설치 때 정한 `postgres` 비밀번호를 입력받습니다. 비밀번호는 화면에 보이지 않고 파일에도 저장하지 않습니다. PowerShell에서는 루트에서 아래 한 줄입니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

처음 실행은 Python 가상환경과 npm 패키지를 만들면서 몇 분 걸립니다. 끝나면 브라우저는 http://127.0.0.1:43123 입니다. 창을 닫거나 Ctrl+C 로 프론트와 API를 같이 멈춥니다.

직접 나누어 실행할 때는 로컬 PostgreSQL이 `127.0.0.1:5432`에서 떠 있어야 합니다. 접속 주소는 `backend/.env.example`의 `DATABASE_URL`입니다.

백엔드:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8765
```

프론트엔드:

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 [http://127.0.0.1:43123](http://127.0.0.1:43123) 을 엽니다. Next.js가 `/backend-api` 요청을 FastAPI `8765` 포트로 넘깁니다.

샘플 칩(노트북, 태블릿, 그래픽카드)은 `demo.specpulse.app` 주소로 보이지만, 서버가 들고 있는 데모 페이지를 읽습니다. 원문 페이지 링크로 HTML을 직접 볼 수 있습니다. `/?sample=laptops`, `/?sample=tablets`, `/?sample=gpus` 로 열면 해당 샘플 비교가 바로 시작됩니다.

화면 시안은 Figma 파일 [SpecPulse](https://www.figma.com/design/mu5BBjBv8DyF3f7MseVMu3)에 있습니다.

## 분석 엔진

`.env`의 `LLM_PROVIDER` 또는 화면의 로컬 / OpenAI / Ollama 전환으로 고릅니다.

| 엔진 | 동작 |
| --- | --- |
| `local` | 스펙 표·장단점 목록을 파싱하고, 숫자로 비교할 수 있는 항목에 우위 배지를 붙입니다. API 키가 필요 없습니다. |
| `openai` | `OPENAI_API_KEY`로 `gpt-4o-mini`에 정제를 맡깁니다. Crawl4AI가 설치되어 있으면 `LLMExtractionStrategy`로 페이지를 읽고, 아니면 HTTP로 받은 본문을 같은 스키마로 보냅니다. |
| `ollama` | `OLLAMA_BASE_URL`의 `qwen2.5`(또는 `OLLAMA_MODEL`)를 사용합니다. |

Crawl4AI 브라우저를 쓰려면 설치 후 Chromium이 필요합니다.

```bash
pip install crawl4ai
crawl4ai-setup
```

같은 URL은 메모리와 PostgreSQL `extraction_cache`에 잠시 저장합니다. 비교 결과는 `comparisons` 테이블에 남아 왼쪽 최근 비교에서 다시 엽니다.

## API

- `POST /api/extract` — URL 하나의 스펙·리뷰
- `POST /api/compare` — URL 두 개를 병렬로 읽고 1:1 비교와 구매 가이드를 반환
- `GET /api/history`, `GET /api/history/{id}`, `DELETE /api/history/{id}`
- `GET /api/presets`
- `GET /demo/products/{slug}` — 데모 제품 HTML

내부망·링크 로컬 주소는 크롤링하지 않습니다. 데모 경로만 예외입니다.

## 테스트

```bash
cd backend
.venv/bin/pytest
```
