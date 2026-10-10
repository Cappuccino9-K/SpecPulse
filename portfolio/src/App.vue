<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { careerPoints, certificates, familiar, projects, schools } from "./data";

gsap.registerPlugin(ScrollTrigger);

const reel = [...familiar, ...familiar];
const loop = [...reel, ...reel];
const specpulseUrl = import.meta.env.VITE_SPECPULSE_URL || "http://127.0.0.1:43721";
let context: gsap.Context | undefined;

onMounted(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  context = gsap.context(() => {
    gsap.from("[data-hero-line]", {
      y: 32,
      autoAlpha: 0,
      duration: 0.9,
      stagger: 0.1,
      delay: 0.1,
      ease: "power3.out",
    });

    gsap.to("[data-progress]", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3,
      },
    });

    gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
      gsap.from(element, {
        y: 28,
        autoAlpha: 0,
        duration: 0.75,
        ease: "power3.out",
        scrollTrigger: { trigger: element, start: "top 88%" },
      });
    });

    gsap.from("[data-line]", {
      scaleY: 0,
      transformOrigin: "top center",
      ease: "none",
      scrollTrigger: {
        trigger: "[data-edu]",
        start: "top 75%",
        end: "bottom 65%",
        scrub: true,
      },
    });

    gsap.from("[data-point]", {
      y: 20,
      autoAlpha: 0,
      stagger: 0.12,
      duration: 0.55,
      ease: "power2.out",
      scrollTrigger: { trigger: "[data-career]", start: "top 78%" },
    });

    gsap.utils.toArray<HTMLElement>("[data-shot]").forEach((image) => {
      gsap.fromTo(
        image,
        { yPercent: 4 },
        {
          yPercent: -4,
          ease: "none",
          scrollTrigger: {
            trigger: image.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });
  });
});

onBeforeUnmount(() => {
  context?.revert();
});
</script>

<template>
  <div data-progress class="progress" />
  <header class="nav">
    <a class="brand" href="#top">권영준</a>
    <nav class="nav-links" aria-label="페이지">
      <a href="#stack">도구</a>
      <a href="#record">기록</a>
      <a href="#career">경력</a>
      <a href="#work">작업</a>
      <a href="#contact">연락</a>
    </nav>
  </header>

  <main id="top">
    <section class="hero wrap">
      <div>
        <p class="kicker" data-hero-line>Portfolio</p>
        <h1>
          <span class="soft" data-hero-line>안녕하세요</span>
          <span class="soft" data-hero-line>백엔드 개발자</span>
          <span data-hero-line>권영준입니다</span>
        </h1>
        <p class="lede" data-hero-line>Write code, solve problems, make impact.</p>
        <p class="intro" data-hero-line>
          정산이 어긋나는 지점과 화면이 버벅이는 지점을 같이 봅니다. ERP, 학습 시스템, 여행 플랫폼에서
          쿼리와 화면을 한 세트로 고쳤습니다.
        </p>
      </div>
      <div class="hero-foot">
        <ul class="facts">
          <li data-hero-line>
            <strong>80%</strong>
            <span>현장 원가재 LOSS율 감소</span>
          </li>
          <li data-hero-line>
            <strong>300명</strong>
            <span>동시 시험 제출의 교착상태 해소</span>
          </li>
          <li data-hero-line>
            <strong>50%</strong>
            <span>학습 화면 렌더링 속도</span>
          </li>
        </ul>
        <a class="cue" href="#stack" data-hero-line>아래로</a>
      </div>
    </section>

    <section id="stack" class="section">
      <div class="wrap stack-head">
        <div>
          <p class="kicker" data-reveal>Stack</p>
          <h2 data-reveal>오래 써 온 도구</h2>
        </div>
        <ul class="chips">
          <li v-for="name in familiar" :key="name" data-reveal>{{ name }}</li>
        </ul>
      </div>
      <div class="marquee" aria-hidden="true">
        <div class="marquee-clip">
          <div class="track">
            <span v-for="(name, index) in loop" :key="`${name}-${index}`">{{ name }}</span>
          </div>
        </div>
      </div>
    </section>

    <section id="record" class="section wrap record">
      <div>
        <p class="kicker" data-reveal>Certificate</p>
        <h2 data-reveal>자격</h2>
        <ul class="certs">
          <li v-for="item in certificates" :key="item.name" data-reveal>
            <strong>{{ item.name }}</strong>
            <span>{{ item.org }}</span>
            <time>{{ item.date }}</time>
          </li>
        </ul>
      </div>
      <div data-edu>
        <p class="kicker" data-reveal>Education</p>
        <h2 data-reveal>학교</h2>
        <div class="edu-wrap">
          <span class="line" data-line />
          <ol class="edu">
          <li v-for="school in schools" :key="school.name" data-reveal>
            <time>{{ school.range }}</time>
            <h3>{{ school.name }}</h3>
            <p>{{ school.note }}</p>
          </li>
          </ol>
        </div>
      </div>
    </section>

    <section id="career" class="section wrap career" data-career>
      <div class="career-head">
        <p class="kicker" data-reveal>Career</p>
        <h2 data-reveal>황금엑스티 개발팀</h2>
        <div class="meta" data-reveal>
          <span>IT 매니저</span>
          <span>2024.04 — 2025.07</span>
        </div>
        <ul class="tools" data-reveal>
          <li>C#</li>
          <li>.NET</li>
          <li>WinForms</li>
          <li>MSSQL</li>
          <li>Stored Procedure</li>
          <li>Index Tuning</li>
        </ul>
      </div>
      <ol class="points">
        <li v-for="point in careerPoints" :key="point.title" data-point>
          <h3>{{ point.title }}</h3>
          <p>{{ point.body }}</p>
        </li>
      </ol>
    </section>

    <section id="work" class="section wrap">
      <p class="kicker" data-reveal>Work</p>
      <h2 data-reveal>만들어 둔 서비스</h2>
      <div class="cases">
        <article v-for="(project, index) in projects" :key="project.id" class="case" :class="{ reverse: index % 2 === 1 }">
          <div class="copy">
            <p class="kicker" data-reveal>{{ project.index }} · {{ project.mark }}</p>
            <header data-reveal>
              <p>{{ project.range }} · {{ project.kind }}</p>
              <h3>{{ project.title }}</h3>
              <p class="stack-line">{{ project.stack }}</p>
            </header>
            <ul>
              <li v-for="point in project.points" :key="point" data-reveal>{{ point }}</li>
            </ul>
            <ul v-if="project.tools.length" class="chips project-tools">
              <li v-for="name in project.tools" :key="name" data-reveal>{{ name }}</li>
            </ul>
            <a v-if="project.id === 'specpulse'" class="open" :href="specpulseUrl">SpecPulse 열어보기</a>
          </div>
          <figure v-if="project.image" class="frame" data-reveal>
            <img data-shot :src="project.image" :alt="project.alt" />
          </figure>
          <figure v-else class="frame still" data-reveal :aria-label="project.alt">
            <div class="pulse">
              <div class="pulse-bar">
                <strong>SpecPulse</strong>
                <span>스펙 비교</span>
              </div>
              <div class="pulse-stage">
                <article>
                  <p>NVIDIA · 그래픽카드</p>
                  <h4>RTX 4070 SUPER</h4>
                  <p class="price">899,000원</p>
                  <em>220W</em>
                </article>
                <p class="vs">VS</p>
                <article>
                  <p>AMD · 그래픽카드</p>
                  <h4>RX 7800 XT</h4>
                  <p class="price">689,000원</p>
                  <em>16GB</em>
                </article>
              </div>
              <p class="pulse-guide">1440p 게임이라면 4070 SUPER <span>비교</span></p>
            </div>
          </figure>
        </article>
      </div>
    </section>

    <section id="contact" class="section wrap contact">
      <p class="kicker" data-reveal>Contact</p>
      <h2 data-reveal>이야기 나누고 싶으면</h2>
      <ul class="contact-list">
        <li data-reveal>
          <span>메일</span>
          <a href="mailto:jun991221@gmail.com">jun991221@gmail.com</a>
        </li>
        <li data-reveal>
          <span>전화</span>
          <a href="tel:010-4909-6160">010-4909-6160</a>
        </li>
        <li data-reveal>
          <span>위치</span>
          <a href="https://map.kakao.com/link/search/서울특별시 은평구" target="_blank" rel="noreferrer">서울특별시 은평구</a>
        </li>
      </ul>
    </section>
  </main>
</template>
