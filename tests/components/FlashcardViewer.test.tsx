import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FlashcardViewer from '../../src/components/FlashcardViewer';
import { FlashcardSet } from '../../src/types';

describe('FlashcardViewer Component', () => {
  const mockFlashcardSet: FlashcardSet = {
    title: 'Test Flashcards',
    source: 'Test Source',
    cards: [
      { id: '1', question: 'Question 1', answer: 'Answer 1' },
      { id: '2', question: 'Question 2', answer: 'Answer 2' },
      { id: '3', question: 'Question 3', answer: 'Answer 3' }
    ],
    createdAt: new Date()
  };

  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders flashcard set title and source', () => {
    render(<FlashcardViewer flashcardSet={mockFlashcardSet} onReset={mockOnReset} />);
    
    expect(screen.getByText('Test Flashcards')).toBeInTheDocument();
    expect(screen.getByText('Source: Test Source')).toBeInTheDocument();
    expect(screen.getByText('3 flashcards generated')).toBeInTheDocument();
  });

  test('displays first card by default in card view', () => {
    render(<FlashcardViewer flashcardSet={mockFlashcardSet} onReset={mockOnReset} />);
    
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Click to reveal answer')).toBeInTheDocument();
    
    const answerElement = screen.queryByText('Answer 1');
    if (answerElement) {
      expect(answerElement.closest('.flashcard-back')).toBeTruthy();
    }
  });

  test('flips card when clicked', () => {
    render(<FlashcardViewer flashcardSet={mockFlashcardSet} onReset={mockOnReset} />);
    
    const card = screen.getByText('Question 1').closest('.flashcard');
    fireEvent.click(card!);
    
    const frontElement = screen.queryByText('Question 1');
    if (frontElement) {
      expect(frontElement.closest('.flashcard-front')).toBeTruthy();
    }
    
    expect(screen.getByText('Answer 1')).toBeInTheDocument();
    expect(screen.getByText('Click to see question')).toBeInTheDocument();
  });

  test('navigates to next card', () => {
    render(<FlashcardViewer flashcardSet={mockFlashcardSet} onReset={mockOnReset} />);
    
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    expect(screen.queryByText('Question 1')).not.toBeInTheDocument();
  });

  test('navigates to previous card', () => {
    render(<FlashcardViewer flashcardSet={mockFlashcardSet} onReset={mockOnReset} />);
    
    const nextButton = screen.getByRole('button', { name: 'Next' });
    fireEvent.click(nextButton);
    
    const prevButton = screen.getByRole('button', { name: 'Previous' });
    fireEvent.click(prevButton);
    
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.queryByText('Question 2')).not.toBeInTheDocument();
  });

  test('switches to list view', () => {
    render(<FlashcardViewer flashcardSet={mockFlashcardSet} onReset={mockOnReset} />);
    
    const listViewButton = screen.getByRole('button', { name: 'List View' });
    fireEvent.click(listViewButton);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Answer 1')).toBeInTheDocument();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    expect(screen.getByText('Answer 2')).toBeInTheDocument();
    expect(screen.getByText('Question 3')).toBeInTheDocument();
    expect(screen.getByText('Answer 3')).toBeInTheDocument();
  });

  test('calls onReset when reset button is clicked', () => {
    render(<FlashcardViewer flashcardSet={mockFlashcardSet} onReset={mockOnReset} />);
    
    const resetButton = screen.getByRole('button', { name: 'Create New Flashcards' });
    fireEvent.click(resetButton);
    
    expect(mockOnReset).toHaveBeenCalled();
  });
});
