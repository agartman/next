/**
 * Tests for RoomJoining component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { vi } from 'vitest';
import { RoomJoining } from './RoomJoining';
import { theme } from '../styles/theme';

// Test wrapper with theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('RoomJoining', () => {
  const mockOnJoinRoom = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnJoinRoom.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders room joining form', () => {
    render(
      <TestWrapper>
        <RoomJoining onJoinRoom={mockOnJoinRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    expect(screen.getByText(/join existing room/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/room id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/room password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter room id/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter room password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join room/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('validates room ID and password correctly', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RoomJoining onJoinRoom={mockOnJoinRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const roomIdInput = screen.getByLabelText(/room id/i);
    const passwordInput = screen.getByLabelText(/room password/i);
    const submitButton = screen.getByTestId('join-room-submit');

    // Test empty fields
    await user.click(submitButton);
    expect(screen.getByText(/room id is required/i)).toBeInTheDocument();
    expect(screen.getByText(/room password is required/i)).toBeInTheDocument();
    expect(mockOnJoinRoom).not.toHaveBeenCalled();

    // Test room ID too short
    await user.type(roomIdInput, 'ab');
    await user.click(submitButton);
    expect(screen.getByText(/room id must be at least 3 characters long/i)).toBeInTheDocument();
    expect(mockOnJoinRoom).not.toHaveBeenCalled();

    // Test password too short
    await user.clear(roomIdInput);
    await user.type(roomIdInput, 'validRoomId');
    await user.type(passwordInput, 'abc');
    await user.click(submitButton);
    expect(screen.getByText(/password must be at least 4 characters long/i)).toBeInTheDocument();
    expect(mockOnJoinRoom).not.toHaveBeenCalled();
  });

  it('submits valid room ID and password', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RoomJoining onJoinRoom={mockOnJoinRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const roomIdInput = screen.getByLabelText(/room id/i);
    const passwordInput = screen.getByLabelText(/room password/i);
    const submitButton = screen.getByTestId('join-room-submit');

    await user.type(roomIdInput, 'room123');
    await user.type(passwordInput, 'validPassword');
    await user.click(submitButton);

    expect(mockOnJoinRoom).toHaveBeenCalledWith('room123', 'validPassword');
  });

  it('handles cancel button click', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RoomJoining onJoinRoom={mockOnJoinRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RoomJoining onJoinRoom={mockOnJoinRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const roomIdInput = screen.getByLabelText(/room id/i);
    const passwordInput = screen.getByLabelText(/room password/i);
    const submitButton = screen.getByTestId('join-room-submit');

    // Trigger validation errors
    await user.click(submitButton);
    expect(screen.getByText(/room id is required/i)).toBeInTheDocument();
    expect(screen.getByText(/room password is required/i)).toBeInTheDocument();

    // Start typing to clear errors
    await user.type(roomIdInput, 'a');
    expect(screen.queryByText(/room id is required/i)).not.toBeInTheDocument();

    await user.type(passwordInput, 'a');
    expect(screen.queryByText(/room password is required/i)).not.toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <TestWrapper>
        <RoomJoining onJoinRoom={mockOnJoinRoom} onCancel={mockOnCancel} isLoading={true} />
      </TestWrapper>
    );

    const submitButton = screen.getByTestId('join-room-submit');
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    expect(submitButton).toHaveTextContent(/joining room/i);
    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByLabelText(/room id/i)).toBeDisabled();
    expect(screen.getByLabelText(/room password/i)).toBeDisabled();
  });

  it('displays server error message', () => {
    const errorMessage = 'Room not found';

    render(
      <TestWrapper>
        <RoomJoining onJoinRoom={mockOnJoinRoom} onCancel={mockOnCancel} error={errorMessage} />
      </TestWrapper>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows helper text when no errors', () => {
    render(
      <TestWrapper>
        <RoomJoining onJoinRoom={mockOnJoinRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    expect(screen.getByText(/ask your friend for the room id/i)).toBeInTheDocument();
  });

  it('disables submit button when fields are empty', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RoomJoining onJoinRoom={mockOnJoinRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const roomIdInput = screen.getByLabelText(/room id/i);
    const passwordInput = screen.getByLabelText(/room password/i);
    const submitButton = screen.getByTestId('join-room-submit');

    // Initially disabled
    expect(submitButton).toBeDisabled();

    // Still disabled with only room ID
    await user.type(roomIdInput, 'test');
    expect(submitButton).toBeDisabled();

    // Enabled when both fields have values
    await user.type(passwordInput, 'test');
    expect(submitButton).not.toBeDisabled();

    // Disabled when room ID is cleared
    await user.clear(roomIdInput);
    expect(submitButton).toBeDisabled();
  });

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RoomJoining onJoinRoom={mockOnJoinRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const roomIdInput = screen.getByLabelText(/room id/i);
    const passwordInput = screen.getByLabelText(/room password/i);

    await user.type(roomIdInput, 'room123');
    await user.type(passwordInput, 'testPassword');
    await user.keyboard('{Enter}');

    expect(mockOnJoinRoom).toHaveBeenCalledWith('room123', 'testPassword');
  });
});
