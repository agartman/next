import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { socketService } from './services/socketService';
import { ConnectionStatusProps } from './types/game';

function App() {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatusProps['status']>('disconnected');
  const [connectionError, setConnectionError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const initializeConnection = async () => {
      setConnectionStatus('connecting');
      setIsLoading(true);

      try {
        await socketService.connect();
        setConnectionStatus('connected');
        setConnectionError(undefined);
      } catch (error) {
        console.error('Failed to connect to server:', error);
        setConnectionStatus('error');
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      } finally {
        setIsLoading(false);
      }
    };

    initializeConnection();

    // Set up socket event listeners for connection status
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('connect', () => {
        setConnectionStatus('connected');
        setConnectionError(undefined);
      });

      socket.on('disconnect', () => {
        setConnectionStatus('disconnected');
      });

      socket.on('connect_error', error => {
        setConnectionStatus('error');
        setConnectionError(error.message);
      });
    }

    // Cleanup on unmount
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Layout
        connectionStatus={connectionStatus}
        connectionError={connectionError}
        isLoading={isLoading}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
