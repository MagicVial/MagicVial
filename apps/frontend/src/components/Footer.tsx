import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <FooterLogo>
            <LogoIcon>🧪</LogoIcon>
            <LogoText>MagicVial</LogoText>
          </FooterLogo>
          <FooterDescription>
            A decentralized alchemy platform based on the Solana blockchain, combining magic with modern technology to create a unique virtual alchemy experience.
          </FooterDescription>
        </FooterSection>
        
        <FooterSection>
          <FooterTitle>Links</FooterTitle>
          <FooterLinks>
            <FooterLink to="/">Home</FooterLink>
            <FooterLink to="/materials">Materials</FooterLink>
            <FooterLink to="/recipes">Recipes</FooterLink>
            <FooterLink to="/crafting">Crafting</FooterLink>
            <FooterLink to="/guilds">Guilds</FooterLink>
          </FooterLinks>
        </FooterSection>
        
        <FooterSection>
          <FooterTitle>Resources</FooterTitle>
          <FooterLinks>
            <FooterLink as="a" href="https://docs.solana.com/" target="_blank" rel="noopener noreferrer">
              Solana Docs
            </FooterLink>
            <FooterLink as="a" href="https://github.com/solana-labs" target="_blank" rel="noopener noreferrer">
              GitHub
            </FooterLink>
            <FooterLink as="a" href="/docs/api" target="_blank">
              API Docs
            </FooterLink>
            <FooterLink as="a" href="/docs/faq" target="_blank">
              FAQ
            </FooterLink>
          </FooterLinks>
        </FooterSection>
        
        <FooterSection>
          <FooterTitle>Contact Us</FooterTitle>
          <SocialLinks>
            <SocialLink href="https://x.com/MagicVial_" target="_blank" rel="noopener noreferrer">
              <SocialIcon>𝕏</SocialIcon>
            </SocialLink>
            <SocialLink href="https://discord.gg/magicvial" target="_blank" rel="noopener noreferrer">
              <SocialIcon>𝔻</SocialIcon>
            </SocialLink>
            <SocialLink href="https://t.me/MagicVial" target="_blank" rel="noopener noreferrer">
              <SocialIcon>𝕋</SocialIcon>
            </SocialLink>
            <SocialLink href="https://github.com/MagicVial" target="_blank" rel="noopener noreferrer">
              <SocialIcon>𝔾</SocialIcon>
            </SocialLink>
          </SocialLinks>
          <Newsletter>
            <NewsletterTitle>Subscribe to our newsletter</NewsletterTitle>
            <NewsletterForm>
              <NewsletterInput type="email" placeholder="your@email.com" />
              <NewsletterButton>Subscribe</NewsletterButton>
            </NewsletterForm>
          </Newsletter>
        </FooterSection>
      </FooterContent>
      
      <FooterBottom>
        <Copyright>© {currentYear} MagicVial. All rights reserved.</Copyright>
        <FooterBottomLinks>
          <FooterBottomLink as="a" href="/terms">Terms of Service</FooterBottomLink>
          <FooterBottomLink as="a" href="/privacy">Privacy Policy</FooterBottomLink>
        </FooterBottomLinks>
      </FooterBottom>
    </FooterContainer>
  );
};

const FooterContainer = styled.footer`
  background-color: var(--bg-color-dark);
  color: var(--text-color-light);
  padding: 60px 20px 30px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      var(--primary-color-light),
      transparent
    );
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const LogoIcon = styled.div`
  font-size: 2rem;
  margin-right: 10px;
`;

const LogoText = styled.h2`
  font-size: 1.5rem;
  margin: 0;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

const FooterDescription = styled.p`
  font-size: 0.9rem;
  line-height: 1.5;
  opacity: 0.8;
  margin-top: 0;
`;

const FooterTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 20px;
  position: relative;
  display: inline-block;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 30px;
    height: 2px;
    background: var(--primary-gradient);
    border-radius: 2px;
  }
  
  @media (max-width: 768px) {
    &::after {
      left: 50%;
      transform: translateX(-50%);
    }
  }
`;

const FooterLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FooterLink = styled(Link)`
  color: var(--text-color-light);
  text-decoration: none;
  font-size: 0.9rem;
  opacity: 0.8;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
    color: var(--primary-color-light);
    transform: translateX(5px);
  }
  
  @media (max-width: 768px) {
    &:hover {
      transform: none;
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const SocialLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-color-light);
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: var(--primary-color);
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const SocialIcon = styled.span`
  font-size: 1.2rem;
`;

const Newsletter = styled.div`
  margin-top: 5px;
`;

const NewsletterTitle = styled.h4`
  font-size: 0.9rem;
  margin-bottom: 10px;
  font-weight: normal;
`;

const NewsletterForm = styled.form`
  display: flex;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const NewsletterInput = styled.input`
  flex: 1;
  padding: 10px 15px;
  border: none;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-color-light);
  border-radius: 25px 0 0 25px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    background-color: rgba(255, 255, 255, 0.15);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const NewsletterButton = styled.button`
  background: var(--primary-gradient);
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 0 25px 25px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    filter: brightness(1.1);
  }
`;

const FooterBottom = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 30px;
  margin-top: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const Copyright = styled.p`
  opacity: 0.6;
  margin: 0;
`;

const FooterBottomLinks = styled.div`
  display: flex;
  gap: 20px;
`;

const FooterBottomLink = styled(Link)`
  color: var(--text-color-light);
  text-decoration: none;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
`;

export default Footer; 