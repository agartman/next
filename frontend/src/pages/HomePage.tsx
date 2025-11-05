/**
 * Home page component for nickname entry and room selection
 */

import React from 'react';
import styled from 'styled-components';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
`;

const WelcomeTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xlarge};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const WelcomeText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.large};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 600px;
`;

const PlaceholderCard = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  max-width: 400px;
  width: 100%;
`;

const PlaceholderText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
`;

export const HomePage: React.FC = () => {
  return (
    <HomeContainer>
      <WelcomeTitle>Welcome to Chess Multiplayer</WelcomeTitle>
      <WelcomeText>
        Play chess with friends in real-time. Create or join a room to get started.
      </WelcomeText>
      <PlaceholderCard>
        <PlaceholderText>
          Nickname entry and room management components will be implemented in future tasks.
        </PlaceholderText>
      </PlaceholderCard>
    </HomeContainer>
  );
};