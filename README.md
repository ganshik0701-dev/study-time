# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# 현재 프로젝트 종합 분석
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

  ------------------------------------------------------

  ──────
  ### 1. 로컬 스토리지(LocalStorage)

  로컬 스토리지는 웹 브라우저가 클라이언트(사용자 컴퓨터)에 데이터를 영구적으로 보관할 수 있도록 제공하는
  HTML5의 표준 Web Storage API입니다.
  • 키-값(Key-Value) 구조: 모든 데이터는 키(Key): 값(Value) 쌍으로 저장되며, 오직 문자열(String) 형태로만
  저장됩니다.
  • 영구성 (Persistence): 사용자가 브라우저를 종료하거나 컴퓨터를 재부팅해도 데이터가 지워지지 않고 유지됩니다.
  (사용자가 직접 캐시/쿠키를 삭제하거나 개발자가 코드로 지우기 전까지 유지)
  • 동일 출처 정책(SOP, Same-Origin Policy): 도메인, 프로토콜, 포트 번호가 같은 페이지끼리만 스토리지를
  공유하므로 타 웹사이트가 내 저장소 데이터에 접근할 수 없습니다.
  • 용량: 브라우저별로 대략 5MB ~ 10MB 내외의 텍스트 데이터를 저장할 수 있습니다.

  #### 💡 쿠키(Cookie) 및 세션 스토리지(SessionStorage)와의 차이점

   구분        | 로컬 스토리지 (LocalStorag… | 세션 스토리지 (SessionStor… | 쿠키 (Cookie)
  -------------|-----------------------------|-----------------------------|------------------------------------
   데이터 수명 | 영구적 (삭제 전까지 유지)   | 브라우저 탭을 닫으면 소멸   | 만료일(Expires) 설정에 따름
   저장 위치   | 브라우저 내부               | 브라우저 내부               | 브라우저 내부 & 매 HTTP 요청 시
               |                             |                             | 서버로 자동 전송
   용량 한도   | 약 5MB                      | 약 5MB                      | 약 4KB (매우 작음)
   주요 목적   | 설정값, 영구적인 사용자     | 단일 탭 내 일시적 폼 데이터 | 서버 인증 세션/토큰 관리
               | 데이터                      |                             |
  ──────
  ### 2. 본 프로젝트에서의 로컬 스토리지 활용
  이 앱은 백엔드 데이터베이스(DB) 서버 없이 브라우저만으로 동작하는 프론트엔드 단독 앱입니다. 따라서 새로고침을
  하거나 창을 닫아도 사용자의 학습 기록이 날아가지 않도록 로컬 스토리지를 활용합니다.
  #### 1) 저장소 식별 키 (Timer.jsx:5)
    const STORAGE_KEY = 'taeyi_study_timer_v1';
  네이밍되어 있습니다.

  • 키 이름 끝에 _v1 같은 버전을 명시하여, 추후 저장 데이터 구조가 바뀌더라도 이전 버전 데이터와 충돌하지 않도록
  #### 2) 저장되는 데이터 구조
  로컬 스토리지에는 객체가 JSON 문자열(JSON.stringify)로 변환되어 저장됩니다:
    {
      "studyMins": 30,          // 설정된 공부 시간(분)
      "breakMins": 10,          // 설정된 휴식 시간(분)
      "cycles": 3,              // 완료한 총 교시 수
      "totalStudyTime": 5400,   // 누적 순공 시간 (초 단위)
      "todoText": "리액트 복습", // 작성한 목표/과목
      "isTodoCompleted": true   // 목표 달성 여부 (true/false)
    }
  │ Note
  │ 실시간으로 줄어드는 현재 타이머 시간(timeLeft)이나 일시정지 여부(isActive)는 저장하지 않습니다. 사용자가
  │ 때문입니다.
  │ 브라우저를 껐다 켰을 때 멈춘 초 단위 중간 상태가 아닌, 깨끗한 1교시 시작 시간으로 초기화되도록 설계되었기
  ──────
  ### 3. 코드 레벨 동작 원리 분석

  Timer.jsx에서는 React의 라이프사이클과 결합하여 매우 안전하고 효율적인 방식으로 로컬 스토리지를 제어합니다.
  #### 1) 앱 시작 시: 데이터 복원 (Timer.jsx:301-321)
    const getInitialData = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved); // 문자열 -> 자바스크립트 객체 변환
        }
      } catch (err) {
        console.error('Failed to load local storage data:', err);
      }
      // 저장된 게 없거나 파싱 실패 시 기본값 리턴
      return {
        studyMins: 30,
        breakMins: 10,
        cycles: 0,
        totalStudyTime: 0,
        todoText: '',
        isTodoCompleted: false,
      };
    };
    
    const Timer = () => {
      // 컴포넌트가 리렌더링될 때마다 스토리지를 중복 조회하지 않도록 useRef 사용
      const initialData = useRef(getInitialData()).current;
      const [studyMins, setStudyMins] = useState(initialData.studyMins || 30);
      // ...
  • 안전성 (try...catch): 사용자가 시크릿 모드를 켜거나, 로컬 스토리지에 잘못된 JSON 문자열이 들어가 있어도 앱이
  멈추지 않고 기본값으로 안전하게 렌더링됩니다.
  • 성능 최적화 (useRef): 타이머 동작으로 인해 컴포넌트가 0.25초마다 리렌더링되더라도, 디스크 I/O 작업인
  localStorage.getItem은 컴포넌트가 처음 생성될 때 단 한 번만 실행됩니다.
  #### 2) 상태 변경 시: 자동 저장 파이프라인 (Timer.jsx:351-366)
    useEffect(() => {
      try {
        const dataToSave = {
          studyMins,
          breakMins,
          cycles,
          totalStudyTime,
          todoText,
          isTodoCompleted,
        };
        // 자바스크립트 객체 -> JSON 문자열 변환 후 저장
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (err) {
        console.error('Failed to save to local storage:', err);
      }
    }, [studyMins, breakMins, cycles, totalStudyTime, todoText, isTodoCompleted]);

  • 의존성 배열(deps)에 포함된 6개 상태 중 하나라도 변하면, 변경된 최신 값이 즉각 로컬 스토리지에
  덮어쓰기(setItem)됩니다.
  • 공부 시간이 1초 누적되거나, 투두 체크를 누르는 순간 실시간으로 동기화됩니다.
  ──────
  ### 4. 로컬 스토리지의 장점과 주의할 점

  #### 장점

  1. 서버 없는 영속성: 별도의 백엔드 서버나 DB 계정이 없어도 사용자 경험을 비약적으로 끌어올릴 수 있습니다.
  2. 트래픽 제로: 쿠키처럼 요청할 때마다 HTTP 헤더를 통해 서버로 전송되지 않으므로 네트워크 대역폭을 낭비하지
  않습니다.
  3. 간결한 API: getItem, setItem, removeItem, clear 4가지 메서드로 쉽게 다룰 수 있습니다.

  #### 주의할 점 (한계점)

  1. 오직 문자열만 저장 가능: 숫자, 불리언, 객체, 배열을 그대로 넣으면 [object Object] 문자열로 변환되므로,
  반드시 JSON.stringify()와 JSON.parse()를 거쳐야 합니다.
  2. 동기식(Synchronous) 동작: 메인 UI 스레드를 차단(Blocking)하므로 수십 MB 단위의 너무 큰 데이터를 잦은 빈도로
  읽고 쓰면 브라우저가 버벅일 수 있습니다. (현재 프로젝트의 수 KB 수준 데이터는 성능에 전혀 영향 없음)
  3. 보안 민감 데이터 저장 금지: XSS(크로스 사이트 스크립팅) 공격에 취약하므로 비밀번호, 결제 정보, 중요한 세션
  토큰 등은 로컬 스토리지에 보관하지 않아야 합니다. (현재 프로젝트처럼 타이머 설정, 공부 시간, 할 일 메모 등의
  데이터 저장에는 최적의 도구입니다)
