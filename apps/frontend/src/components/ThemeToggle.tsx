import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../contexts/AppContext';

const ThemeToggle: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const toggleTheme = () => {
    setIsTransitioning(true);
    const newTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: newTheme } });
    
    // Apply a brief animation delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };
  
  // Set initial theme based on system preference if not already set
  useEffect(() => {
    if (!state.settings.theme) {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: { theme: prefersDarkMode ? 'dark' : 'light' }
      });
    }
  }, []);
  
  return (
    <ToggleButton
      onClick={toggleTheme}
      isTransitioning={isTransitioning}
      isDark={state.settings.theme === 'dark'}
      aria-label={`Switch to ${state.settings.theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <ToggleIcon>
        {state.settings.theme === 'dark' ? '🌙' : '☀️'}
      </ToggleIcon>
    </ToggleButton>
  );
};

interface ToggleButtonProps {
  isDark: boolean;
  isTransitioning: boolean;
}

const ToggleButton = styled.button<ToggleButtonProps>`
  background: ${props => props.isDark ? 
    'linear-gradient(135deg, #192a56 0%, #273c75 100%)' : 
    'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  opacity: ${props => props.isTransitioning ? 0.7 : 1};
  transform: ${props => props.isTransitioning ? 'scale(0.9)' : 'scale(1)'};
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
`;

const ToggleIcon = styled.span`
  font-size: 20px;
  line-height: 1;
`;

export default ThemeToggle; 