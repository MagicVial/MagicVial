import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const Navigation: React.FC = () => {
  const { pathname } = useLocation();
  const { connected } = useWallet();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check scroll to change navigation style
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close mobile menu when clicking a link
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };
  
  return (
    <NavContainer isScrolled={isScrolled}>
      <NavWrapper>
        <LogoSection>
          <Link to="/">
            <Logo>
              <LogoIcon>🧪</LogoIcon>
              <LogoText>MagicVial</LogoText>
            </Logo>
          </Link>
          
          <MobileMenuButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </MobileMenuButton>
        </LogoSection>
        
        <NavLinks isOpen={mobileMenuOpen}>
          <NavItem active={pathname === '/'}>
            <Link to="/" onClick={closeMobileMenu}>Home</Link>
          </NavItem>
          
          <NavItem active={pathname === '/materials'}>
            <Link to="/materials" onClick={closeMobileMenu}>Materials</Link>
          </NavItem>
          
          <NavItem active={pathname === '/recipes'}>
            <Link to="/recipes" onClick={closeMobileMenu}>Recipes</Link>
          </NavItem>
          
          <NavItem active={pathname === '/crafting'}>
            <Link to="/crafting" onClick={closeMobileMenu}>Crafting</Link>
          </NavItem>
          
          <NavItem active={pathname === '/guilds'}>
            <Link to="/guilds" onClick={closeMobileMenu}>Guilds</Link>
          </NavItem>
          
          {connected && (
            <NavItem active={pathname === '/profile'}>
              <Link to="/profile" onClick={closeMobileMenu}>Profile</Link>
            </NavItem>
          )}
        </NavLinks>
        
        <NavRight>
          <StyledWalletButton />
        </NavRight>
      </NavWrapper>
    </NavContainer>
  );
};

interface NavContainerProps {
  isScrolled: boolean;
}

const NavContainer = styled.nav<NavContainerProps>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: ${(props: NavContainerProps) => props.isScrolled ? 'rgba(10, 10, 20, 0.9)' : 'transparent'};
  backdrop-filter: ${(props: NavContainerProps) => props.isScrolled ? 'blur(10px)' : 'none'};
  box-shadow: ${(props: NavContainerProps) => props.isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.15)' : 'none'};
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  z-index: 1000;
`;

const NavWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  
  @media (max-width: 768px) {
    padding: 0 15px;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  z-index: 1001;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoIcon = styled.div`
  font-size: 1.8rem;
`;

const LogoText = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--primary-color);
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-color);
  cursor: pointer;
  margin-left: 20px;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

interface NavLinksProps {
  isOpen: boolean;
}

const NavLinks = styled.ul<NavLinksProps>`
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 0;
  padding: 0;
  list-style: none;
  
  @media (max-width: 768px) {
    position: fixed;
    top: 70px;
    left: 0;
    right: 0;
    background-color: rgba(10, 10, 20, 0.95);
    backdrop-filter: blur(10px);
    flex-direction: column;
    padding: 20px 0;
    transform: ${(props: NavLinksProps) => props.isOpen ? 'translateY(0)' : 'translateY(-150%)'};
    opacity: ${(props: NavLinksProps) => props.isOpen ? 1 : 0};
    visibility: ${(props: NavLinksProps) => props.isOpen ? 'visible' : 'hidden'};
    transition: transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }
`;

interface NavItemProps {
  active: boolean;
}

const NavItem = styled.li<NavItemProps>`
  position: relative;
  
  a {
    display: block;
    padding: 10px 15px;
    color: ${(props: NavItemProps) => props.active ? 'var(--primary-color)' : 'var(--text-color)'};
    font-weight: ${(props: NavItemProps) => props.active ? 'bold' : 'normal'};
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: var(--primary-color);
    }
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: ${(props: NavItemProps) => props.active ? '20px' : '0'};
    height: 3px;
    background: var(--primary-gradient);
    border-radius: 5px;
    transition: width 0.2s ease;
  }
  
  &:hover::after {
    width: 20px;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    text-align: center;
    
    a {
      padding: 15px;
    }
    
    &::after {
      bottom: 5px;
    }
  }
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  z-index: 1001;
`;

const StyledWalletButton = styled(WalletMultiButton)`
  background: var(--primary-gradient) !important;
  color: white !important;
  border-radius: 30px !important;
  height: 40px !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
  
  &:hover {
    transform: translateY(-3px) !important;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2) !important;
  }
`;

export default Navigation;