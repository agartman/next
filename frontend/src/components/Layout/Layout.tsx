/**
 * Main layout component with header and content area
 */

import React from 'react';
import styled from 'styled-components';
import { Header } from './Header';
import { ConnectionStatusProps } from '../../types/game';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${({ theme }) => theme.colors.text.secondary};
  border-top: 4px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

interface LayoutProps {
  children: React.ReactNode;
  connectionStatus: ConnectionStatusProps['status'];
  connectionError?: string;
  isLoading?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  connectionStatus,
  connectionError,
  isLoading = false,
}) => {
  return (
    <LayoutContainer>
      <Header connectionStatus={connectionStatus} connectionError={connectionError} />
      <MainContent>{children}</MainContent>
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}
    </LayoutContainer>
  );
};
