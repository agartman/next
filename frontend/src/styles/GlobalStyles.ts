/**
 * Global styles using styled-components
 */

import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.fontSize.medium};
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.background};
    line-height: 1.6;
  }

  #root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  button {
    font-family: inherit;
    font-size: inherit;
    border: none;
    border-radius: 4px;
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.text.inverse};

    &:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  input {
    font-family: inherit;
    font-size: inherit;
    border: 2px solid ${({ theme }) => theme.colors.text.secondary};
    border-radius: 4px;
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text.primary};
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.secondary};
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.text.secondary};
    }
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  h1 {
    font-size: ${({ theme }) => theme.typography.fontSize.xlarge};
  }

  h2 {
    font-size: ${({ theme }) => theme.typography.fontSize.large};
  }

  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  a {
    color: ${({ theme }) => theme.colors.secondary};
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.primary};
    }
  }

  .error-message {
    color: ${({ theme }) => theme.colors.status.error};
    font-size: ${({ theme }) => theme.typography.fontSize.small};
    margin-top: ${({ theme }) => theme.spacing.xs};
  }

  .success-message {
    color: ${({ theme }) => theme.colors.status.success};
    font-size: ${({ theme }) => theme.typography.fontSize.small};
    margin-top: ${({ theme }) => theme.spacing.xs};
  }

  .loading {
    opacity: 0.7;
    pointer-events: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    html, body {
      font-size: ${({ theme }) => theme.typography.fontSize.small};
    }

    button, input {
      padding: ${({ theme }) => theme.spacing.md};
      font-size: ${({ theme }) => theme.typography.fontSize.medium};
    }
  }
`;
