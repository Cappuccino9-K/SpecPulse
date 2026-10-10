# 권영준 포트폴리오

백엔드 개발자 권영준의 한 페이지 포트폴리오입니다. Vue 3와 GSAP 스크롤 애니메이션으로 구성되어 있고, SpecPulse 화면과는 따로 실행합니다.

```bash
cd portfolio
npm install
npm run dev
```

브라우저에서 http://127.0.0.1:43831 을 엽니다. SpecPulse가 http://127.0.0.1:43721 에서 떠 있으면 작업 카드의 「SpecPulse 열어보기」가 그 주소로 이동합니다.

서버에 올릴 때는 빌드 전에 공개 주소를 넣습니다.

```bash
VITE_SPECPULSE_URL=https://가지고-있는-도메인 npm run build
```
