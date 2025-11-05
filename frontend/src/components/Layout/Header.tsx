/**
 * Header component with navigation and connection status
 */

import React from 'react';
import styled from 'styled-components';
import { ConnectionStatusProps } from '../../types/game';

const HeaderContainer = styled.header`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.small};
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 60px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.sm};
    min-height: auto;
  }
`;

const Logo = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.large};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin: 0;
  color: ${({ theme }) => theme.colors.text.inverse};
`;

const ConnectionStatus = styled.div<{ status: ConnectionStatusProps['status'] }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${({ status, theme }) => {
      switch (status) {
        case 'connected':
          return theme.colors.status.success;
        case 'connecting':
          return theme.colors.status.warning;
        case 'disconnected':
        case 'error':
          return theme.colors.status.error;
        default:
          return theme.colors.text.secondary;
      }
    }};
  }
`;

const StatusText = styled.span`
  text-transform: capitalize;
`;

interface HeaderProps {
  connectionStatus: ConnectionStatusProps['status'];
  connectionError?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  connectionStatus, 
  connectionError 
}) => {
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return connectionError || 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <HeaderContainer>
      <Logo>Chess Multiplayer</Logo>
      <ConnectionStatus status={connectionStatus}>
        <StatusText>{getStatusText()}</StatusText>
      </ConnectionStatus>
    </HeaderContainer>
  );
};