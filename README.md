# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

현재 프로젝트 종합 분석
  ──────
  ### 1. 핵심 기능 (Core Features)

  1. 뽀모도로 기반 맞춤형 학습/휴식 타이머
      • 시간 설정: 공부 시간(분)과 휴식 시간(분)을 사용자가 원하는 대로 자유롭게 조절(1분~최대 180분/60분)할 수
      있습니다.
      • 시각적 타이머 & 프로그레스 바: 대형 디지털 시간 디스플레이(mm:ss)와 세션 진행률(ProgressBar)을
      실시간으로 시각화합니다.
      • 종료 임박 알림 (Urgent Effect): 타이머 종료 10초 전부터 시각적 하이라이트(색상 변경 및 글로우 펄스
      애니메이션)가 활성화됩니다.
  2. Web Audio API 기반 내장 알림음 (Chime Sound)
      • 외부 오디오 파일(.mp3, .wav) 의존 없이 브라우저 내장 신디사이저를 통해 부드러운 화음 차임벨을 생성 및
      재생합니다.
      • 휴식 시작음: E5 → G#5 → B5 (부드러운 하모니)
      • 공부 시작 및 교시 완료음: C5 → E5 → G5 (상승 화음)
  3. 오늘의 집중 목표 / To-Do 관리
      • 공부할 과목이나 한 줄 목표를 입력할 수 있으며, 목표 달성 시 체크박스를 눌러 완료(취소선) 표시가
      가능합니다.
  4. 학습 통계 자동 추적
      • 완료한 교시: 공부 및 휴식 1사이클을 완료할 때마다 교시 카운트가 1씩 증가합니다.
      • 누적 순공 시간: 실제 공부 진행 시간만을 초 단위로 누적 측정하여 X시간 Y분 형태로 자동 변환해 보여줍니다.
  5. 브라우저 탭 실시간 상태 연동
      • 다른 탭으로 이동해도 탭 제목(document.title)에 남은 시간, 현재 상태(✍️ 공부 중, ☕ 휴식 시간, 일시정지),
      목표 과목명이 표시되어 백그라운드에서도 진행 상황을 확인할 수 있습니다.
  6. 로컬스토리지(LocalStorage) 데이터 영속화
      • 설정한 공부/휴식 시간, 누적 공부 시간, 완료 교시 수, 투두 텍스트 및 완료 상태가 브라우저에 저장되어
      페이지 새로고침 후에도 유지됩니다.

  ──────
  ### 2. 작동 로직 (Working Logic & Architecture)

  ┌──────────────────────────┐
  │                          │
  │     READY: 준비 상태     │
  │                          │
  └─────────────┬────────────┘
        B -->|매 초마다| C[순공 시간 누적 & 남은 시간 차감]
        C -->|남은 시간 0초 도달| D[휴식 차임음 재생 & REST TIME 전환]
        D --> E[REST TIME: 휴식 세션 진행]
        E -->|남은 시간 0초 도달| F[시작 차임음 재생 & 사이클 +1 증가]
        F -->|초기화 및 일시정지| A

  1. 타임스탬프 기반 정밀 델타 타이머 (Timer Drift 방지)
      • 일반적인 setInterval(1000) 방식은 브라우저 탭이 백그라운드로 전환될 때 브라우저의 스로틀링(자원
      절약)으로 인해 시간이 왜곡됩니다.
      • 이를 방지하기 위해 Timer.jsx:416-457에서는 250ms 주기로 타임스탬프(Date.now())를 비교하여 실제 경과된
      초(elapsedSec)를 계산하고 정확하게 시간을 차감합니다.
  2. 세션 라이프사이클 전이
      • 공부 중(!isBreak && isActive): 누적 순공 시간(totalStudyTime)이 증가하며 시간이 차감됩니다.
      • 공부 종료 (timeLeft <= 0): playChime('break') 호출 후 isBreak = true로 전환되며 휴식 시간으로
      재설정됩니다.
      • 휴식 종료 (timeLeft <= 0): playChime('study') 호출 후 cycles + 1 증가, isBreak = false, isActive =
      false로 다음 교시 준비 상태로 전환됩니다.
  3. 초기화 및 자동 동기화 파이프라인
      • 컴포넌트 마운트 시 Timer.jsx:301-318를 통해 localStorage에서 이전 데이터를 로드합니다.
      • 상태 변경 시 useEffect 감시자를 통해 변경 사항을 실시간 직렬화하여 로컬스토리지에 저장합니다.

  ──────
  ### 3. 구성 요소 (Components & Structure)

   구분             | 파일/모듈  | 역할 및 세부 컴포넌트
  ------------------|------------|------------------------------------------------------------------------------
   진입점           | index.html | Pretendard 웹폰트 로드 및 애플리케이션 마운트 컨테이너 정의
   렌더링 엔트리    | main.jsx   | React 19 createRoot 및 StrictMode 설정
   메인 레이아웃    | App.jsx    | • GlobalStyle: 배경색(RGB: #F9F9F6), 타이포그래피 초기화• HeaderSection:
                    |            | 헤더 타이틀 및 장식용 플로팅 아이콘 클러스터(호버 모션 및 모바일 반응형
                    |            | 처리)• 메인 타이머 컴포넌트 래핑
   핵심 타이머 모듈 | Timer.jsx  | • playChime: Web Audio API 기반 오실레이터/게인 컨트롤러• StatusBadge: 현재
                    |            | 동작 상태 태그 (READY / STUDYING / REST TIME)• TodoCard: 인풋 필드 및 체크
                    |            | 버튼• TimeDisplay: clamp() 기반 반응형 대형 시계• ProgressBar: 세션 진행률
                    |            | 시각화• InputGroup: 시간 설정 숫자 인풋• ButtonGroup: 시작/일시정지 토글 및
                    |            | 리셋 버튼• StatsGrid: 완료 교시 및 누적 학습 시간 표시 카드
  ──────
  ### 4. 들어가는 기술 스택 (Tech Stack)

  #### Frontend Core

  • React 19 (react: ^19.2.6, react-dom: ^19.2.6):
      • 함수형 컴포넌트와 최신 React 훅(useState, useEffect, useRef)을 통한 반응형 UI 및 타이머 상태
      라이프사이클 관리.


  #### 번들러 및 빌드 도구

  • Vite 8 (vite: ^8.0.12, @vitejs/plugin-react: ^6.0.1):
      • 초고속 모듈 번들러 및 Fast Refresh(HMR) 개발 환경 제공.


  #### 스타일링 및 디자인 시스템

  • styled-components 6 (styled-components: ^6.4.2):
      • CSS-in-JS 방식으로 동적 프로퍼티($isUrgent, $isBreak, $progress 등)를 스타일로 직결.
      • 전역 테마 스타일(createGlobalStyle) 및 키프레임 애니메이션(keyframes) 구성.
  • Pretendard:
      • CDN을 통해 주입된 시스템 친화적 현대적 한글 웹폰트.


  #### 아이콘 & 그래픽

  • react-icons 5 (react-icons: ^5.6.0):
      • Feather Icons (FiSmile, FiSun, FiEdit3, FiClock, FiBookOpen, FiMusic, FiCheckCircle, FiCircle) 및 Game
      Icons (GiOakLeaf) 사용.


  #### 브라우저 네이티브 API (Web Platform APIs)

  • Web Audio API (AudioContext, OscillatorNode, GainNode):
      • Sine 웨이브와 엔벨로프(Gain ramp)를 합성하여 오디오 리소스 없이 실시간 차임벨 사운드 합성.
  • Web Storage API (localStorage):
      • 클라이언트 측 브라우저 세션 데이터 유지.
  • DOM Document API (document.title):
      • 브라우저 탭 타이틀 실시간 상태 동기화.


  #### 코드 품질 및 린팅

  • ESLint 10 (eslint: ^10.3.0, eslint-plugin-react-hooks, eslint-plugin-react-refresh):
      • React 훅 의존성 규칙 및 최신 ECMAScript 표준 정적 분석.
