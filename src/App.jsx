import styled, { createGlobalStyle } from 'styled-components';
import Timer from './components/Timer';
import './App.css';
import { 
  FiSmile, 
  FiSun, 
  FiEdit3, 
  FiClock, 
  FiBookOpen, 
  FiMusic 
} from 'react-icons/fi';
import { GiOakLeaf } from 'react-icons/gi';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background-color: #F9F9F6;
    color: #333333;
    font-family: 'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const HeaderSection = styled.header`
  padding: 60px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

const HeaderTitleWrapper = styled.div`
  position: relative;
  text-align: center;
  z-index: 2;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: #333333;
  letter-spacing: -0.5px;
`;

const FlourishLine = styled.div`
  width: 120px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #333333, transparent);
  margin: 12px auto 0;
  position: relative;
  opacity: 0.6;

  &::after {
    content: '';
    position: absolute;
    top: -3px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    background-color: #DA7756;
    border-radius: 50%;
  }
`;

const DecorationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  width: 100%;
  max-width: 800px;
  margin-top: -10px;

  @media (max-width: 600px) {
    gap: 12px;
  }
`;

const IconCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  position: relative;

  @media (max-width: 600px) {
    gap: 6px;
    padding: 4px;
    
    /* 화면이 좁을 때 바깥쪽 아이콘 일부 숨김 */
    & > div:nth-child(n+3) {
      display: none;
    }
  }
`;

const FloatingIcon = styled.div`
  color: ${props => props.$color || '#DA7756'};
  font-size: ${props => props.$size || '1.5rem'};
  opacity: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.1) rotate(5deg);
  }

  &::before {
    content: '';
    position: absolute;
    width: ${props => props.$bgSize || '0px'};
    height: ${props => props.$bgSize || '0px'};
    background-color: ${props => props.$bgColor || 'transparent'};
    border-radius: 50%;
    z-index: -1;
    opacity: 0.3;
  }
`;

const App = () => {
  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <HeaderSection>
          <DecorationContainer>
            {/* Left Decorative Cluster */}
            <IconCluster>
              <FloatingIcon $color="#DA7756" $size="1.4rem" $bgColor="#FFE8E1" $bgSize="30px">
               <FiSmile /> {/* 문양*/}
              </FloatingIcon>
              <FloatingIcon $color="#FFD966" $size="1.6rem" $bgColor="#FFF9E6" $bgSize="35px">
                <FiSun />
              </FloatingIcon>
              <FloatingIcon $color="#A7D676" $size="1.3rem" $bgColor="#F2F9EC" $bgSize="28px">
                <GiOakLeaf />
              </FloatingIcon>
              <FloatingIcon $color="#76B9D6" $size="1.4rem" $bgColor="#EAF6FB" $bgSize="32px">
                <FiEdit3 />
              </FloatingIcon>
            </IconCluster>

            {/* Central Title Area */}
            <HeaderTitleWrapper>
              <HeaderTitle>스터디 타임</HeaderTitle>
              <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '4px', fontWeight: '500' }}>
                공부를 위한 즐거운 시간
              </div>
              <FlourishLine />
            </HeaderTitleWrapper>

            {/* Right Decorative Cluster */}
            <IconCluster>
              <FloatingIcon $color="#DA7756" $size="1.5rem" $bgColor="#FFE8E1" $bgSize="32px">
                <FiClock />
              </FloatingIcon>
              <FloatingIcon $color="#D69676" $size="1.4rem" $bgColor="#F9F1EC" $bgSize="30px">
                <FiBookOpen />
              </FloatingIcon>
              <FloatingIcon $color="#B776D6" $size="1.3rem" $bgColor="#F7ECF9" $bgSize="28px">
                <FiMusic />
              </FloatingIcon>
            </IconCluster>
          </DecorationContainer>
        </HeaderSection>
        
        <main>
          <Timer />
        </main>
      </AppContainer>
    </>
  );
};

export default App;
