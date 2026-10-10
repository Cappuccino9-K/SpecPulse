export const familiar = [
  "Vue",
  "React",
  "Java",
  "Spring",
  "C#",
  ".NET",
  "MSSQL",
  "MySQL",
  "Bootstrap",
  "Git",
  "AWS",
]

export const recent = [
  "TypeScript",
  "Next.js",
  "Spring Boot",
  "FastAPI",
  "PostgreSQL",
  "Python",
  "Tailwind",
  "GSAP",
]

export const certificates = [
  { name: "정보처리산업기사", org: "한국산업인력공단", date: "2021.06.20" },
  { name: "컴퓨터활용능력 2급", org: "대한상공회의소", date: "2016.08.19" },
  { name: "GTQ 그래픽기술자격 1급", org: "한국생산성본부", date: "2015.09.11" },
  { name: "JLPT N2", org: "일본국제교육협회", date: "2025.12" },
  { name: "2종 보통운전면허", org: "서울특별시경찰청", date: "2013.06.12" },
]

export const schools = [
  {
    range: "2023.03.02 — 2025.02.17",
    name: "숭실사이버대학교",
    note: "졸업 · 학사 편입 · ICT공학과",
  },
  {
    range: "2018.03 — 2023.02.08",
    name: "한국폴리텍대학 서울강서캠퍼스",
    note: "졸업 · 전문학사 · 빅데이터소프트웨어공학과",
  },
  {
    range: "2015.03.02 — 2018.02.21",
    name: "강서공업고등학교",
    note: "졸업 · 친환경에너지화학과",
  },
]

export const careerPoints = [
  {
    title: "사내 ERP 고도화",
    body: "WinForm과 MSSQL로 된 사내 ERP를 고도화하고 병목을 정리했습니다.",
  },
  {
    title: "월간 정산",
    body: "계산 알고리즘을 직접 구현해 현장 원가재 LOSS율을 80% 줄였습니다.",
  },
  {
    title: "세금계산서",
    body: "대량 자동 업로드 모듈로 업무 처리 건수를 90% 단축했습니다.",
  },
  {
    title: "입출고",
    body: "실시간 관리 모듈과 Stored Procedure를 새로 설계하고 쿼리를 튜닝했습니다.",
  },
]

export const projects = [
  {
    id: "specpulse",
    index: "01",
    mark: "SPECPULSE",
    range: "2026",
    kind: "개인 프로젝트",
    title: "두 주소로 스펙을 나란히",
    stack: "Next.js / FastAPI / Spring Boot",
    image: "",
    alt: "SpecPulse 비교 화면. 그래픽카드 두 장의 스펙과 이긴 항목, 구매 가이드가 한 화면에 있습니다.",
    points: [
      "상품 페이지 주소 두 개로 CPU, 그래픽카드, 노트북 스펙을 한 표에 나란히 둡니다.",
      "이긴 항목과 구매 가이드를 만들고, 그 비교를 마이너갤 글로 남깁니다.",
      "스펙 API는 FastAPI, 갤러리는 Spring Boot, 화면은 Next.js로 나누고 PostgreSQL을 같이 씁니다.",
      "첫 화면은 짧은 영상과 GSAP 스크롤로, 비교가 갤러리 글이 되는 흐름을 보여 줍니다.",
    ],
  },
  {
    id: "benedu",
    index: "02",
    mark: "BENEDU",
    range: "2024.12.20 — 2025.07.01",
    kind: "팀 프로젝트 · 3명",
    title: "디미고 학생 자기주도학습",
    stack: "ASP.NET / MSSQL",
    image: "/work/benedu.jpg",
    alt: "BENEDU 학습목록 화면. 시험과목과 학습종류를 거르고 과목 목록을 보여 줍니다.",
    points: [
      "부트스트랩 그리드로 PC, 태블릿, 모바일 3단과 다크 모드를 맞췄습니다.",
      "학생 300명이 동시에 시험을 내고 볼 때 나던 교착상태를 Lock으로 없앴습니다.",
      "실행 계획을 보고 인덱스와 프로시저를 고쳐 쿼리를 빠르게 했습니다.",
      "코드 압축과 AJAX 비동기로 렌더링 속도를 50% 높였습니다.",
      "입력값 검증으로 XSS와 악성 스크립트를 막았습니다.",
    ],
  },
  {
    id: "bikestory",
    index: "03",
    mark: "BIKESTORY",
    range: "2023.11.12 — 2024.02.15",
    kind: "개인 프로젝트",
    title: "자전거 여행 계획 및 동행 모집",
    stack: "React / MyBatis",
    image: "/work/bikestory.jpg",
    alt: "BikeStory 첫 화면. 여행 글, 날씨, 동행 모집이 한 페이지에 있습니다.",
    points: [
      "컴포넌트로 반응형 화면과 프론트 구조를 나눴습니다.",
      "MyBatis로 SQL과 비즈니스 로직을 나누고 게시판 CRUD를 만들었습니다.",
      "SonarQube로 코드 품질과 보안 취약점을 미리 걸렀습니다.",
    ],
  },
]
