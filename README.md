# SpecPulse

CPU, 메모리, SSD, 메인보드, 노트북, 태블릿, 그래픽카드처럼 상품 페이지 주소 두 개를 넣어 스펙을 나란히 비교하고, 사용자 리뷰에서 장점·아쉬운 점·추천 대상을 정리하는 대시보드입니다.

- 스펙 서비스: FastAPI, Pydantic v2, SQLAlchemy, PostgreSQL, Crawl4AI(선택)
- 마이너갤 서비스: Spring Boot, Spring Data JPA. 스펙 API와 프로세스가 분리된 두 번째 서비스입니다.
- 프론트엔드: Next.js (App Router), TypeScript, Tailwind CSS. 두 API 앞의 화면입니다.
- 분석 엔진: 로컬 파서, OpenAI `gpt-4o-mini`, Ollama `qwen2.5` / `llama3.1` 전환

화면은 Material Design의 표면, 톤 버튼, 데이터 테이블 리듬을 따릅니다. 다크 모드와 라이트 모드를 모두 지원합니다.

## 로컬 실행

Python은 3.11부터 3.15까지 64비트를 지원합니다. 32비트 설치본은 미리 빌드된 패키지가 없어 `pip install`이 실패합니다.

Windows에서는 Docker를 쓰지 않습니다. [PostgreSQL Windows 설치본](https://www.postgresql.org/download/windows/)을 설치한 뒤, 압축을 푼 루트 폴더의 `start.bat`을 더블클릭합니다. 실행할 때마다 설치 때 정한 `postgres` 비밀번호를 입력받습니다. 비밀번호는 화면에 보이지 않고 파일에도 저장하지 않습니다. PowerShell에서는 루트에서 아래 한 줄입니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

처음 실행은 Python 가상환경, npm 패키지, 갤러리용 Maven 의존성을 받느라 몇 분 걸립니다. 마이너갤러리는 JDK 17 또는 21이 필요합니다. 없으면 [Temurin 21](https://adoptium.net) Windows x64를 설치한 뒤 다시 실행하세요. 끝나면 브라우저는 http://127.0.0.1:43721 입니다. 상단에서 스펙 비교와 마이너갤을 오갑니다. 창을 닫거나 Ctrl+C 로 프론트, 스펙 API, 갤러리를 같이 멈춥니다.

직접 나누어 실행할 때는 로컬 PostgreSQL이 `127.0.0.1:5432`에서 떠 있어야 합니다. 접속 주소는 `backend/.env.example`의 `DATABASE_URL`입니다.

백엔드:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 18765
```

프론트엔드:

```bash
cd frontend
npm install
npm run dev
```

마이너갤:

```bash
cd gallery-service
export GALLERY_JDBC_URL=jdbc:postgresql://127.0.0.1:5432/specpulse
export GALLERY_DB_USER=postgres
export GALLERY_DB_PASSWORD='설치할 때 정한 비밀번호'
./mvnw spring-boot:run
```

브라우저에서 [http://127.0.0.1:43721](http://127.0.0.1:43721) 을 엽니다. Next.js가 `/backend-api` 를 FastAPI `18765`로, `/gallery-api` 를 Spring Boot `18766`으로 넘깁니다.

## 서비스 구성

스펙 비교와 마이너갤러리는 서로 다른 프로세스로 뜹니다. 저장소는 로컬 PostgreSQL `specpulse` 하나를 공유하고, 테이블은 나뉩니다. 스펙 API는 `comparisons`, `extraction_cache`를 쓰고 갤러리는 `mg_gallery`, `mg_post`, `mg_comment`, `mg_recommend`를 씁니다. 화면만 둘을 한 주소로 묶습니다.

`specpulse`에 연결한 뒤 사용자 테이블마다 앞에서 20행을 보려면 `SELECT * FROM preview_all_tables();` 를 실행합니다. 앱을 한 번 켜면 `backend/sql/preview_all_tables.sql`의 함수가 만들어집니다. 행 수를 바꾸려면 `SELECT * FROM preview_all_tables(5);` 처럼 호출합니다.

| 프로세스 | 포트 | 역할 |
| --- | --- | --- |
| Next.js | 43721 | 스펙 비교 화면, 마이너갤 화면 |
| FastAPI | 18765 | URL 스펙 추출과 비교 |
| Spring Boot | 18766 | 갤러리, 글, 댓글, 추천 |

마이너갤은 닉네임과 글 비밀번호만 사용합니다. 비밀번호는 BCrypt 해시로만 저장되고, 추천은 브라우저에 둔 `X-Client-Id`로 한 번만 집계된 뒤 다시 누르면 취소됩니다. 글을 쓰고 댓글을 다는 일은 로그인하지 않아도 됩니다.

갤러리를 새로 여는 권한만 구글 로그인을 씁니다. 로그인 방식은 OpenID Connect입니다. 구글이 신원을 확인해 주면 갤러리 서비스가 자체 JWT를 발급하고, 이후 API는 그 토큰으로 권한을 확인합니다. 역할은 사용자, 모더레이터, 어드민 세 가지입니다. 모더레이터와 어드민은 갤러리를 바로 만들고, 사용자는 개설 요청을 올린 뒤 승인을 받습니다. 어드민이 한 명도 없으면 처음 로그인한 계정이 어드민이 됩니다. 특정 이메일을 어드민으로 고정하려면 `GALLERY_ADMIN_EMAILS`에 쉼표로 구분해 넣습니다.

구글 클라우드에서 받은 JSON은 `gallery-service/google-oauth.json`에 둡니다. 이 파일은 git에 올라가지 않습니다. 웹 애플리케이션 클라이언트를 만들고 승인된 리디렉션 URI에 `http://127.0.0.1:18766/login/oauth2/code/google` 과 `http://localhost:18766/login/oauth2/code/google` 을 넣어야 브라우저 로그인이 끝납니다. 데스크톱 앱용 JSON은 이 주소와 맞지 않을 수 있습니다. 형식 예시는 `gallery-service/google-oauth.json.example` 입니다.

처음 기동하면 CPU, 그래픽카드, 노트북, 메모리 갤러리와 예시 글이 비어 있을 때만 들어갑니다. 예시 글의 비밀번호는 실행할 때마다 임의 값으로 해시하므로 공개된 비밀번호로 지울 수 없습니다.

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

## 갤러리 API

- `GET /api/galleries`, `GET /api/galleries/{slug}`
- `GET /api/galleries/{slug}/posts`, `POST /api/galleries/{slug}/posts`
- `GET /api/posts/{id}`
- `POST /api/posts/{id}/comments`
- `POST /api/posts/{id}/recommend` — 헤더 `X-Client-Id`
- `POST /api/posts/{id}/delete`, `POST /api/comments/{id}/delete` — 본문 비밀번호

## 테스트

```bash
cd backend
.venv/bin/pytest
cd ../gallery-service
./mvnw test
```
