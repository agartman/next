/**
 * Room creation form component with password input and type safety
 */

import React, { useState } from 'react';
import styled from 'styled-components';

const RoomCreationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.large};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  text-align: center;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Input = styled.input.withConfig({
  shouldForwardProp: prop => prop !== 'hasError',
})<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid
    ${({ theme, hasError }) => (hasError ? theme.colors.status.error : theme.colors.text.secondary)};
  border-radius: 8px;
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text.primary};
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) =>
      hasError ? theme.colors.status.error : theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.status.error};
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const HelperText = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary'; disabled?: boolean }>`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme, variant, disabled }) => {
    if (disabled) return theme.colors.text.secondary;
    return variant === 'secondary' ? 'transparent' : theme.colors.primary;
  }};
  color: ${({ theme, variant, disabled }) => {
    if (disabled) return theme.colors.text.inverse;
    return variant === 'secondary' ? theme.colors.primary : theme.colors.text.inverse;
  }};
  border: ${({ theme, variant }) =>
    variant === 'secondary' ? `2px solid ${theme.colors.primary}` : 'none'};
  border-radius: 8px;
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${({ theme, variant }) =>
      variant === 'secondary' ? theme.colors.primary : theme.colors.secondary};
    color: ${({ theme, variant }) =>
      variant === 'secondary' ? theme.colors.text.inverse : theme.colors.text.inverse};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export interface RoomCreationProps {
  onCreateRoom: (password: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

export const RoomCreation: React.FC<RoomCreationProps> = ({
  onCreateRoom,
  onCancel,
  isLoading = false,
  error,
}) => {
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const validatePassword = (value: string): string => {
    if (!value.trim()) {
      return 'Room password is required';
    }
    if (value.trim().length < 4) {
      return 'Password must be at least 4 characters long';
    }
    if (value.trim().length > 50) {
      return 'Password must be no more than 50 characters long';
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPassword = password.trim();
    const error = validatePassword(trimmedPassword);

    if (error) {
      setValidationError(error);
      return;
    }

    onCreateRoom(trimmedPassword);
  };

  const displayError = error || validationError;
  const isDisabled = isLoading || !password.trim();

  return (
    <RoomCreationContainer>
      <Title>Create New Room</Title>
      <form onSubmit={handleSubmit}>
        <InputGroup>
          <Label htmlFor="room-password">Room Password</Label>
          <Input
            id="room-password"
            type="password"
            value={password}
            onChange={handleInputChange}
            placeholder="Enter room password"
            hasError={!!displayError}
            disabled={isLoading}
            maxLength={50}
            autoComplete="new-password"
            autoFocus
          />
          {displayError && <ErrorMessage>{displayError}</ErrorMessage>}
          {!displayError && (
            <HelperText>Share this password with your friend to let them join your room</HelperText>
          )}
        </InputGroup>
        <ButtonGroup>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isDisabled} data-testid="create-room-submit">
            {isLoading ? 'Creating Room...' : 'Create Room'}
          </Button>
        </ButtonGroup>
      </form>
    </RoomCreationContainer>
  );
};
