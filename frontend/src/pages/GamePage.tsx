/**
 * Game page component for chess gameplay
 */

import React from 'react';
import styled from 'styled-components';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  min-height: 60vh;
`;

const GameTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
`;

const PlaceholderBoard = styled.div`
  width: 400px;
  height: 400px;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.text.secondary};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme.shadows.medium};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 300px;
    height: 300px;
  }
`;

const PlaceholderText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const GameControls = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  justify-content: center;
`;

const ControlButton = styled.button`
  background-color: ${({ theme }) => theme.colors.secondary};
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

export const GamePage: React.FC = () => {
  return (
    <GameContainer>
      <GameTitle>Chess Game</GameTitle>
      <PlaceholderBoard>
        <PlaceholderText>
          Interactive chess board will be implemented in future tasks.
        </PlaceholderText>
      </PlaceholderBoard>
      <GameControls>
        <ControlButton disabled>Offer Draw</ControlButton>
        <ControlButton disabled>Resign</ControlButton>
      </GameControls>
    </GameContainer>
  );
};