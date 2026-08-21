import { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiCheckCircle, FiCircle, FiEdit3 } from 'react-icons/fi';

const STORAGE_KEY = 'taeyi_study_timer_v1';

// Web Audio API를 활용한 알림음 (외부 파일 없이 부드러운 차임음 재생)
const playChime = (type = 'study') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'break') {
      // 쉬는 시간 시작 알림 (E5 -> G#5 -> B5 부드러운 하모니)
      const notes = [659.25, 830.61, 987.77];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.6);
      });
    } else {
      // 공부 시작 및 사이클 완료 알림 (C5 -> E5 -> G5 상승 화음)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.6);
      });
    }
  } catch {
    // 오디오 미지원 브라우저 예외 방지
  }
};

const gentleGlow = keyframes`
  0% { box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06), 0 0 0 0 rgba(218, 119, 86, 0.2); }
  50% { box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06), 0 0 20px 4px rgba(218, 119, 86, 0.35); }
  100% { box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06), 0 0 0 0 rgba(218, 119, 86, 0.2); }
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  min-height: calc(100vh - 200px);
  transition: background-color 0.4s ease;
`;

const FloatingCard = styled.div`
  background-color: #ffffff;
  width: 100%;
  max-width: 480px;
  padding: 40px 36px;
  border-radius: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06), 0 2px 10px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
  border: ${props => props.$isUrgent ? '2px solid rgba(218, 119, 86, 0.6)' : '2px solid transparent'};
  animation: ${props => props.$isUrgent ? gentleGlow : 'none'} 1.5s infinite ease-in-out;

  @media (max-width: 500px) {
    padding: 30px 20px;
    border-radius: 24px;
  }
`;

const StatusBadge = styled.div`
  background-color: ${props => props.$isBreak ? 'rgba(218, 119, 86, 0.15)' : props.$isActive ? 'rgba(88, 160, 102, 0.15)' : 'rgba(51, 51, 51, 0.08)'};
  color: ${props => props.$isBreak ? '#DA7756' : props.$isActive ? '#3F874F' : '#666666'};
  padding: 10px 28px;
  border-radius: 100px;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
`;

const TodoCard = styled.div`
  width: 100%;
  background-color: #faf9f6;
  border: 1px dashed #e2ded5;
  border-radius: 16px;
  padding: 12px 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:focus-within {
    border-color: #DA7756;
    border-style: solid;
    background-color: #ffffff;
  }
`;

const TodoCheckBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$completed ? '#DA7756' : '#bbb'};
  transition: color 0.2s ease, transform 0.1s ease;

  &:hover {
    transform: scale(1.15);
    color: #DA7756;
  }
`;

const TodoInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: ${props => props.$completed ? '#999' : '#333'};
  text-decoration: ${props => props.$completed ? 'line-through' : 'none'};
  font-family: inherit;
  font-weight: 500;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: #aaa;
    font-size: 0.88rem;
  }
`;

const TimeDisplay = styled.div`
  font-size: clamp(3.8rem, 15vw, 5.8rem);
  font-weight: 200;
  color: ${props => props.$isUrgent ? '#DA7756' : '#333333'};
  font-variant-numeric: tabular-nums;
  letter-spacing: -2px;
  line-height: 1;
  transition: color 0.3s ease;
  user-select: none;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 6px;
  background-color: #f0ede8;
  border-radius: 3px;
  margin: 24px 0 32px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  background-color: ${props => props.$isBreak ? '#76B9D6' : '#DA7756'};
  width: ${props => props.$progress}%;
  transition: width 0.3s ease, background-color 0.4s ease;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
  margin-bottom: 28px;
`;

const InputField = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #888888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  input {
    width: 100%;
    padding: 12px;
    border: 1px solid #e8e5de;
    border-radius: 12px;
    font-size: 1.05rem;
    font-weight: 600;
    text-align: center;
    color: #333333;
    transition: all 0.2s ease;
    background-color: #faf9f6;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #DA7756;
      background-color: #ffffff;
      box-shadow: 0 0 0 3px rgba(218, 119, 86, 0.12);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.65;
      background-color: #f5f5f5;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  margin-bottom: 32px;
`;

const ActionButton = styled.button`
  flex: ${props => props.$isMain ? '2' : '1'};
  padding: 15px;
  font-size: 1.05rem;
  font-weight: 700;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  background-color: ${props => props.$isMain ? (props.$isActive ? '#555555' : '#DA7756') : '#f2efe9'};
  color: ${props => props.$isMain ? '#ffffff' : '#555555'};

  &:hover {
    transform: translateY(-2px);
    background-color: ${props => props.$isMain ? (props.$isActive ? '#333333' : '#C16246') : '#e5e1d8'};
    box-shadow: ${props => props.$isMain ? '0 6px 16px rgba(218, 119, 86, 0.25)' : '0 2px 6px rgba(0, 0, 0, 0.05)'};
  }

  &:active {
    transform: translateY(0);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
  padding-top: 24px;
  border-top: 1px solid #f0ede8;
`;

const StatCard = styled.div`
  text-align: center;
  
  .label {
    font-size: 0.8rem;
    color: #888888;
    margin-bottom: 4px;
    font-weight: 600;
  }
  
  .value {
    font-size: 1.15rem;
    font-weight: 700;
    color: #333333;
    
    span {
      color: #DA7756;
      margin-right: 2px;
    }
  }
`;

// 로컬 스토리지 초기 데이터 로더
const getInitialData = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load local storage data:', err);
  }
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
  const initialData = useRef(getInitialData()).current;

  const [studyMins, setStudyMins] = useState(initialData.studyMins || 30);
  const [breakMins, setBreakMins] = useState(initialData.breakMins || 10);
  const [timeLeft, setTimeLeft] = useState((initialData.studyMins || 30) * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [cycles, setCycles] = useState(initialData.cycles || 0);
  const [totalStudyTime, setTotalStudyTime] = useState(initialData.totalStudyTime || 0);
  const [todoText, setTodoText] = useState(initialData.todoText || '');
  const [isTodoCompleted, setIsTodoCompleted] = useState(initialData.isTodoCompleted || false);

  const totalTimeForProgress = (isBreak ? breakMins : studyMins) * 60;
  const progress = Math.min(100, Math.max(0, ((totalTimeForProgress - timeLeft) / totalTimeForProgress) * 100));

  const formatTime = (seconds) => {
    const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
    const ss = (seconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const formatTotalTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  // 로컬 스토리지 자동 저장
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.error('Failed to save to local storage:', err);
    }
  }, [studyMins, breakMins, cycles, totalStudyTime, todoText, isTodoCompleted]);

  // 브라우저 탭 타이틀 실시간 연동
  useEffect(() => {
    const timeStr = formatTime(timeLeft);
    if (!isActive) {
      if (timeLeft === (isBreak ? breakMins : studyMins) * 60) {
        document.title = '스터디 타임 - 공부를 위한 즐거운 시간';
      } else {
        document.title = `[일시정지 ${timeStr}] 스터디 타임`;
      }
    } else if (isBreak) {
      document.title = `[${timeStr}] ☕ 휴식 시간 - 스터디 타임`;
    } else {
      const taskLabel = todoText.trim() ? ` [${todoText.trim()}]` : '';
      document.title = `[${timeStr}] ✍️ 공부 중${taskLabel} - 스터디 타임`;
    }
  }, [timeLeft, isActive, isBreak, studyMins, breakMins, todoText]);

  // 시작 / 정지 토글
  const handleToggle = () => {
    setIsActive(!isActive);
  };

  // 타이머 초기화
  const handleReset = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(studyMins * 60);
  };

  // 공부 시간 변경
  const handleStudyMinsChange = (e) => {
    const val = Math.max(1, parseInt(e.target.value) || 1);
    setStudyMins(val);
    if (!isActive && !isBreak) {
      setTimeLeft(val * 60);
    }
  };

  // 휴식 시간 변경
  const handleBreakMinsChange = (e) => {
    const val = Math.max(1, parseInt(e.target.value) || 1);
    setBreakMins(val);
    if (!isActive && isBreak) {
      setTimeLeft(val * 60);
    }
  };

  // 타이머 백그라운드 오차 방지 (타임스탬프 기반 정밀 델타 계산)
  useEffect(() => {
    let interval = null;
    if (isActive) {
      let lastTimestamp = Date.now();

      interval = setInterval(() => {
        const currentTimestamp = Date.now();
        const elapsedSec = Math.floor((currentTimestamp - lastTimestamp) / 1000);

        if (elapsedSec >= 1) {
          lastTimestamp = currentTimestamp - ((currentTimestamp - lastTimestamp) % 1000);

          if (!isBreak) {
            setTotalStudyTime(prev => prev + elapsedSec);
          }

          setTimeLeft(prev => {
            if (prev <= elapsedSec) {
              if (!isBreak) {
                // 공부 종료 -> 휴식 시작
                playChime('break');
                setIsBreak(true);
                return breakMins * 60;
              } else {
                // 휴식 종료 -> 사이클 증가 및 다음 세션 준비
                playChime('study');
                setIsBreak(false);
                setCycles(c => c + 1);
                setIsActive(false);
                return studyMins * 60;
              }
            }
            return prev - elapsedSec;
          });
        }
      }, 250);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isBreak, studyMins, breakMins]);

  const isUrgent = isActive && timeLeft <= 10;

  return (
    <Container className="timer-container">
      <FloatingCard $isUrgent={isUrgent}>
        {/* 상태 뱃지 */}
        <StatusBadge $isBreak={isBreak} $isActive={isActive}>
          {isBreak ? '☕ REST TIME' : isActive ? '✍️ STUDYING' : '⚡ READY'}
        </StatusBadge>

        {/* 오늘의 공부 과목 / 한 줄 메모 (To-Do) */}
        <TodoCard>
          <TodoCheckBtn 
            type="button"
            onClick={() => setIsTodoCompleted(prev => !prev)} 
            $completed={isTodoCompleted}
            title={isTodoCompleted ? '완료 취소' : '목표 완료 체크'}
          >
            {isTodoCompleted ? <FiCheckCircle size={20} /> : <FiCircle size={20} />}
          </TodoCheckBtn>
          <TodoInput 
            type="text"
            placeholder="오늘 집중할 공부 과목 / 한 줄 목표 입력..."
            value={todoText}
            onChange={(e) => setTodoText(e.target.value)}
            $completed={isTodoCompleted}
          />
          <FiEdit3 size={16} color="#aaa" />
        </TodoCard>

        {/* 타이머 시간 디스플레이 */}
        <TimeDisplay $isUrgent={isUrgent}>{formatTime(timeLeft)}</TimeDisplay>

        {/* 프로그레스 바 */}
        <ProgressBarContainer>
          <ProgressBar $progress={progress} $isBreak={isBreak} />
        </ProgressBarContainer>

        {/* 시간 입력 필드 */}
        <InputGroup>
          <InputField>
            <label>공부 시간 (분)</label>
            <input 
              type="number" 
              min="1"
              max="180"
              value={studyMins} 
              onChange={handleStudyMinsChange}
              disabled={isActive}
            />
          </InputField>
          <InputField>
            <label>휴식 시간 (분)</label>
            <input 
              type="number" 
              min="1"
              max="60"
              value={breakMins} 
              onChange={handleBreakMinsChange}
              disabled={isActive}
            />
          </InputField>
        </InputGroup>

        {/* 컨트롤 버튼 */}
        <ButtonGroup>
          <ActionButton $isMain $isActive={isActive} onClick={handleToggle}>
            {isActive ? '일시 정지' : '시작'}
          </ActionButton>
          <ActionButton onClick={handleReset}>
            초기화
          </ActionButton>
        </ButtonGroup>

        {/* 학습 통계 */}
        <StatsGrid>
          <StatCard>
            <div className="label">완료한 교시</div>
            <div className="value"><span>{cycles}</span>교시</div>
          </StatCard>
          <StatCard>
            <div className="label">총 누적 공부 시간</div>
            <div className="value"><span>{formatTotalTime(totalStudyTime)}</span></div>
          </StatCard>
        </StatsGrid>
      </FloatingCard>
    </Container>
  );
};

export default Timer;


