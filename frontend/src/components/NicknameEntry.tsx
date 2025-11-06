/**
 * Nickname entry component with validation
 */

import React, { useState } from 'react';
import styled from 'styled-components';

const NicknameContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: 400px;
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
  shouldForwardProp: (prop) => prop !== 'hasError',
}) <{ hasError?: boolean }>`
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

const SubmitButton = styled.button<{ disabled?: boolean }>`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme, disabled }) =>
    disabled ? theme.colors.text.secondary : theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  border-radius: 8px;
  font-size: ${({ theme }) => theme.typography.fontSize.medium};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.secondary};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export interface NicknameEntryProps {
  onSubmit: (nickname: string) => void;
  isLoading?: boolean;
  error?: string;
}

export const NicknameEntry: React.FC<NicknameEntryProps> = ({
  onSubmit,
  isLoading = false,
  error,
}) => {
  const [nickname, setNickname] = useState('');
  const [validationError, setValidationError] = useState('');

  const validateNickname = (value: string): string => {
    if (!value.trim()) {
      return 'Nickname is required';
    }
    if (value.trim().length < 2) {
      return 'Nickname must be at least 2 characters long';
    }
    if (value.trim().length > 20) {
      return 'Nickname must be no more than 20 characters long';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) {
      return 'Nickname can only contain letters, numbers, underscores, and hyphens';
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedNickname = nickname.trim();
    const error = validateNickname(trimmedNickname);

    if (error) {
      setValidationError(error);
      return;
    }

    onSubmit(trimmedNickname);
  };

  const displayError = error || validationError;
  const isDisabled = isLoading || !nickname.trim();

  return (
    <NicknameContainer>
      <form onSubmit={handleSubmit}>
        <InputGroup>
          <Label htmlFor="nickname">Enter your nickname</Label>
          <Input
            id="nickname"
            type="text"
            value={nickname}
            onChange={handleInputChange}
            placeholder="Your nickname"
            hasError={!!displayError}
            disabled={isLoading}
            maxLength={20}
            autoComplete="off"
            autoFocus
          />
          {displayError && <ErrorMessage>{displayError}</ErrorMessage>}
        </InputGroup>
        <SubmitButton type="submit" disabled={isDisabled} data-testid="nickname-submit">
          {isLoading ? 'Creating Session...' : 'Continue'}
        </SubmitButton>
      </form>
    </NicknameContainer>
  );
};
