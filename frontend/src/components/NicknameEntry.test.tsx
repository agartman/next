/**
 * Tests for NicknameEntry component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { vi } from 'vitest';
import { NicknameEntry } from './NicknameEntry';
import { theme } from '../styles/theme';

// Test wrapper with theme
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('NicknameEntry', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders nickname input field', () => {
    render(
      <TestWrapper>
        <NicknameEntry onSubmit={mockOnSubmit} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/enter your nickname/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/your nickname/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('validates nickname input correctly', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <NicknameEntry onSubmit={mockOnSubmit} />
      </TestWrapper>
    );

    const input = screen.getByLabelText(/enter your nickname/i);
    const submitButton = screen.getByTestId('nickname-submit');

    // Test empty nickname
    await user.click(submitButton);
    expect(screen.getByText(/nickname is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Test nickname too short
    await user.type(input, 'a');
    await user.click(submitButton);
    expect(screen.getByText(/nickname must be at least 2 characters long/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Clear and test nickname too long
    await user.clear(input);
    await user.type(input, 'a'.repeat(21));
    await user.click(submitButton);
    expect(
      screen.getByText(/nickname must be no more than 20 characters long/i)
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Test invalid characters
    await user.clear(input);
    await user.type(input, 'test@user');
    await user.click(submitButton);
    expect(
      screen.getByText(/nickname can only contain letters, numbers, underscores, and hyphens/i)
    ).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid nickname', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <NicknameEntry onSubmit={mockOnSubmit} />
      </TestWrapper>
    );

    const input = screen.getByLabelText(/enter your nickname/i);
    const submitButton = screen.getByTestId('nickname-submit');

    await user.type(input, 'TestUser123');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('TestUser123');
  });

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <NicknameEntry onSubmit={mockOnSubmit} />
      </TestWrapper>
    );

    const input = screen.getByLabelText(/enter your nickname/i);
    const submitButton = screen.getByTestId('nickname-submit');

    // Trigger validation error
    await user.click(submitButton);
    expect(screen.getByText(/nickname is required/i)).toBeInTheDocument();

    // Start typing to clear error
    await user.type(input, 'a');
    expect(screen.queryByText(/nickname is required/i)).not.toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <TestWrapper>
        <NicknameEntry onSubmit={mockOnSubmit} isLoading={true} />
      </TestWrapper>
    );

    const submitButton = screen.getByTestId('nickname-submit');
    expect(submitButton).toHaveTextContent(/creating session/i);
    expect(submitButton).toBeDisabled();
    expect(screen.getByLabelText(/enter your nickname/i)).toBeDisabled();
  });

  it('displays server error message', () => {
    const errorMessage = 'Server connection failed';

    render(
      <TestWrapper>
        <NicknameEntry onSubmit={mockOnSubmit} error={errorMessage} />
      </TestWrapper>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('disables submit button when nickname is empty', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <NicknameEntry onSubmit={mockOnSubmit} />
      </TestWrapper>
    );

    const input = screen.getByLabelText(/enter your nickname/i);
    const submitButton = screen.getByTestId('nickname-submit');

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
        <NicknameEntry onSubmit={mockOnSubmit} />
      </TestWrapper>
    );

    const input = screen.getByLabelText(/enter your nickname/i);

    await user.type(input, 'TestUser');
    await user.keyboard('{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('TestUser');
  });
});
