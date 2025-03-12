import React from 'react';
import styled, { keyframes } from 'styled-components';

interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  fullscreen?: boolean;
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'medium',
  color = 'var(--primary-color)',
  fullscreen = false,
  message = 'Loading...'
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return '30px';
      case 'large':
        return '70px';
      case 'medium':
      default:
        return '50px';
    }
  };

  if (fullscreen) {
    return (
      <FullscreenContainer>
        <LoadingContent>
          <Spinner size={getSizeValue()} color={color} />
          {message && <LoadingMessage>{message}</LoadingMessage>}
        </LoadingContent>
      </FullscreenContainer>
    );
  }

  return (
    <Container>
      <Spinner size={getSizeValue()} color={color} />
      {message && <LoadingMessage>{message}</LoadingMessage>}
    </Container>
  );
};

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { opacity: 0.4; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0.4; transform: scale(0.98); }
`;

interface SpinnerProps {
  size: string;
  color: string;
}

const Spinner = styled.div<SpinnerProps>`
  width: ${props => props.size};
  height: ${props => props.size};
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top: 4px solid ${props => props.color};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const FullscreenContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  background-color: var(--bg-card);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
`;

const LoadingMessage = styled.p`
  margin-top: 15px;
  font-size: 1rem;
  color: var(--text-color);
  text-align: center;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

export default LoadingIndicator; 