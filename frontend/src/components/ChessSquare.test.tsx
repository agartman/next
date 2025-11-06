/**
 * Tests for ChessSquare component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { ChessSquare } from './ChessSquare';
import { theme } from '../styles/theme';
import { ChessPiece } from '../utils/chessUtils';
import { expect, it, beforeEach, describe, vi } from 'vitest';

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

const defaultProps = {
    square: 'e4',
    piece: null,
    isSelected: false,
    isValidMove: false,
    isCheck: false,
    onClick: vi.fn(),
    disabled: false
};

describe('ChessSquare', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders square with correct test id', () => {
        renderWithTheme(<ChessSquare {...defaultProps} />);

        expect(screen.getByTestId('chess-square-e4')).toBeInTheDocument();
    });

    it('renders piece when provided', () => {
        const piece: ChessPiece = { type: 'king', color: 'white' };
        renderWithTheme(
            <ChessSquare
                {...defaultProps}
                piece={piece}
            />
        );

        expect(screen.getByTestId('piece-white-king')).toBeInTheDocument();
    });

    it('renders no piece when piece is null', () => {
        renderWithTheme(<ChessSquare {...defaultProps} />);

        expect(screen.queryByTestId(/piece-/)).not.toBeInTheDocument();
    });

    it('handles click events', () => {
        const onClick = vi.fn();
        renderWithTheme(
            <ChessSquare
                {...defaultProps}
                onClick={onClick}
            />
        );

        const square = screen.getByTestId('chess-square-e4');
        fireEvent.click(square);

        expect(onClick).toHaveBeenCalledWith('e4');
    });

    it('does not handle clicks when disabled', () => {
        const onClick = vi.fn();
        renderWithTheme(
            <ChessSquare
                {...defaultProps}
                onClick={onClick}
                disabled={true}
            />
        );

        const square = screen.getByTestId('chess-square-e4');
        fireEvent.click(square);

        expect(onClick).not.toHaveBeenCalled();
    });

    it('shows file coordinate on bottom row squares', () => {
        renderWithTheme(
            <ChessSquare
                {...defaultProps}
                square="e1"
            />
        );

        expect(screen.getByText('e')).toBeInTheDocument();
    });

    it('shows rank coordinate on left column squares', () => {
        renderWithTheme(
            <ChessSquare
                {...defaultProps}
                square="a4"
            />
        );

        expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('shows both coordinates on corner squares', () => {
        renderWithTheme(
            <ChessSquare
                {...defaultProps}
                square="a1"
            />
        );

        expect(screen.getByText('a')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('does not show coordinates on middle squares', () => {
        renderWithTheme(
            <ChessSquare
                {...defaultProps}
                square="d4"
            />
        );

        expect(screen.queryByText('d')).not.toBeInTheDocument();
        expect(screen.queryByText('4')).not.toBeInTheDocument();
    });

    it('renders different piece types correctly', () => {
        const pieces: ChessPiece[] = [
            { type: 'pawn', color: 'white' },
            { type: 'rook', color: 'black' },
            { type: 'knight', color: 'white' },
            { type: 'bishop', color: 'black' },
            { type: 'queen', color: 'white' },
            { type: 'king', color: 'black' }
        ];

        pieces.forEach((piece, index) => {
            const { unmount } = renderWithTheme(
                <ChessSquare
                    {...defaultProps}
                    square={`e${index + 1}`}
                    piece={piece}
                />
            );

            expect(screen.getByTestId(`piece-${piece.color}-${piece.type}`)).toBeInTheDocument();
            unmount();
        });
    });

    it('applies correct styling classes based on props', () => {
        // Test selected state
        const { rerender } = renderWithTheme(
            <ChessSquare
                {...defaultProps}
                isSelected={true}
            />
        );

        let square = screen.getByTestId('chess-square-e4');
        expect(square).toBeInTheDocument();

        // Test valid move state
        rerender(
            <ThemeProvider theme={theme}>
                <ChessSquare
                    {...defaultProps}
                    isValidMove={true}
                />
            </ThemeProvider>
        );

        square = screen.getByTestId('chess-square-e4');
        expect(square).toBeInTheDocument();

        // Test check state
        rerender(
            <ThemeProvider theme={theme}>
                <ChessSquare
                    {...defaultProps}
                    isCheck={true}
                />
            </ThemeProvider>
        );

        square = screen.getByTestId('chess-square-e4');
        expect(square).toBeInTheDocument();
    });
});