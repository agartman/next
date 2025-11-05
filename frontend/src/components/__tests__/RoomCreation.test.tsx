/**
 * Tests for RoomCreation component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { vi } from 'vitest';
import { RoomCreation } from '../RoomCreation';
import { theme } from '../../styles/theme';

// Test wrapper with theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('RoomCreation', () => {
  const mockOnCreateRoom = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnCreateRoom.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders room creation form', () => {
    render(
      <TestWrapper>
        <RoomCreation onCreateRoom={mockOnCreateRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    expect(screen.getByText(/create new room/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/room password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter room password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('validates password input correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <RoomCreation onCreateRoom={mockOnCreateRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const input = screen.getByLabelText(/room password/i);
    const submitButton = screen.getByTestId('create-room-submit');

    // Test empty password
    await user.click(submitButton);
    expect(screen.getByText(/room password is required/i)).toBeInTheDocument();
    expect(mockOnCreateRoom).not.toHaveBeenCalled();

    // Test password too short
    await user.type(input, 'abc');
    await user.click(submitButton);
    expect(screen.getByText(/password must be at least 4 characters long/i)).toBeInTheDocument();
    expect(mockOnCreateRoom).not.toHaveBeenCalled();

    // Test password too long
    await user.clear(input);
    await user.type(input, 'a'.repeat(51));
    await user.click(submitButton);
    expect(screen.getByText(/password must be no more than 50 characters long/i)).toBeInTheDocument();
    expect(mockOnCreateRoom).not.toHaveBeenCalled();
  });

  it('submits valid password', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <RoomCreation onCreateRoom={mockOnCreateRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const input = screen.getByLabelText(/room password/i);
    const submitButton = screen.getByTestId('create-room-submit');

    await user.type(input, 'validPassword123');
    await user.click(submitButton);

    expect(mockOnCreateRoom).toHaveBeenCalledWith('validPassword123');
  });

  it('handles cancel button click', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <RoomCreation onCreateRoom={mockOnCreateRoom} onCancel={mockOnCancel} />
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
        <RoomCreation onCreateRoom={mockOnCreateRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const input = screen.getByLabelText(/room password/i);
    const submitButton = screen.getByTestId('create-room-submit');

    // Trigger validation error
    await user.click(submitButton);
    expect(screen.getByText(/room password is required/i)).toBeInTheDocument();

    // Start typing to clear error
    await user.type(input, 'a');
    expect(screen.queryByText(/room password is required/i)).not.toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <TestWrapper>
        <RoomCreation 
          onCreateRoom={mockOnCreateRoom} 
          onCancel={mockOnCancel} 
          isLoading={true} 
        />
      </TestWrapper>
    );

    const submitButton = screen.getByTestId('create-room-submit');
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    
    expect(submitButton).toHaveTextContent(/creating room/i);
    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByLabelText(/room password/i)).toBeDisabled();
  });

  it('displays server error message', () => {
    const errorMessage = 'Failed to create room';
    
    render(
      <TestWrapper>
        <RoomCreation 
          onCreateRoom={mockOnCreateRoom} 
          onCancel={mockOnCancel} 
          error={errorMessage} 
        />
      </TestWrapper>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows helper text when no error', () => {
    render(
      <TestWrapper>
        <RoomCreation onCreateRoom={mockOnCreateRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    expect(screen.getByText(/share this password with your friend/i)).toBeInTheDocument();
  });

  it('disables submit button when password is empty', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <RoomCreation onCreateRoom={mockOnCreateRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const input = screen.getByLabelText(/room password/i);
    const submitButton = screen.getByTestId('create-room-submit');

    // Initially disabled
    expect(submitButton).toBeDisabled();

    // Enabled when typing
    await user.type(input, 'test');
    expect(submitButton).not.toBeDisabled();

    // Disabled when cleared
    await user.clear(input);
    expect(submitButton).toBeDisabled();
  });

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <RoomCreation onCreateRoom={mockOnCreateRoom} onCancel={mockOnCancel} />
      </TestWrapper>
    );

    const input = screen.getByLabelText(/room password/i);
    
    await user.type(input, 'testPassword');
    await user.keyboard('{Enter}');

    expect(mockOnCreateRoom).toHaveBeenCalledWith('testPassword');
  });
});