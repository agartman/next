/**
 * Home page component for nickname entry and room selection
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { RoomInterface } from '../components/RoomInterface';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const WelcomeHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const WelcomeTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xlarge};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const WelcomeText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.large};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  max-width: 600px;
`;

interface GameData {
  roomId: string;
  playerColor: 'white' | 'black';
  nickname: string;
  sessionId: string;
}

export const HomePage: React.FC = () => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const navigate = useNavigate();

  const handleGameReady = (data: GameData) => {
    setGameData(data);
    console.log('Game ready with data:', data);

    // Navigate to the game page with state
    navigate('/game', {
      state: {
        roomId: data.roomId,
        playerColor: data.playerColor,
        nickname: data.nickname,
        sessionId: data.sessionId
      }
    });
  };

  return (
    <HomeContainer>
      <WelcomeHeader>
        <WelcomeTitle>Chess Multiplayer</WelcomeTitle>
        <WelcomeText>
          Play chess with friends in real-time. Create or join a room to get started.
        </WelcomeText>
      </WelcomeHeader>

      {!gameData ? (
        <RoomInterface onGameReady={handleGameReady} />
      ) : (
        <div>
          <h2>Game Ready!</h2>
          <p>Room: {gameData.roomId}</p>
          <p>Playing as: {gameData.playerColor}</p>
          <p>Nickname: {gameData.nickname}</p>
        </div>
      )}
    </HomeContainer>
  );
};