import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InputForm from '../../src/components/InputForm';
import { extractFlashcards } from '../../src/services/openaiService';
import { fetchWikipediaContent } from '../../src/services/wikipediaService';

jest.mock('../../src/services/openaiService', () => ({
  extractFlashcards: jest.fn()
}));

jest.mock('../../src/services/wikipediaService', () => ({
  fetchWikipediaContent: jest.fn()
}));

const mockExtractFlashcards = extractFlashcards as jest.MockedFunction<typeof extractFlashcards>;
const mockFetchWikipediaContent = fetchWikipediaContent as jest.MockedFunction<typeof fetchWikipediaContent>;

describe('InputForm Component', () => {
  const mockSetFlashcardSet = jest.fn();
  const mockSetLoading = jest.fn();
  const mockSetError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders input form with default elements', () => {
    render(
      <InputForm
        setFlashcardSet={mockSetFlashcardSet}
        setLoading={mockSetLoading}
        setError={mockSetError}
      />
    );

    expect(screen.getByRole('button', { name: 'Wikipedia URL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Generate Flashcards' })).toBeInTheDocument();
    expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument();
  });

  test('switches between URL and text input modes', () => {
    render(
      <InputForm
        setFlashcardSet={mockSetFlashcardSet}
        setLoading={mockSetLoading}
        setError={mockSetError}
      />
    );

    const textModeButton = screen.getByRole('button', { name: 'Custom Text' });
    fireEvent.click(textModeButton);

    expect(screen.getByRole('button', { name: 'Custom Text' })).toHaveClass('active');
    expect(screen.getByPlaceholderText('Paste your text here...')).toBeInTheDocument();

    const urlModeButton = screen.getByRole('button', { name: 'Wikipedia URL' });
    fireEvent.click(urlModeButton);

    expect(screen.getByRole('button', { name: 'Wikipedia URL' })).toHaveClass('active');
    expect(screen.getByPlaceholderText('https://en.wikipedia.org/wiki/Artificial_intelligence')).toBeInTheDocument();
  });

  test('shows error when submitting without input', async () => {
    render(
      <InputForm
        setFlashcardSet={mockSetFlashcardSet}
        setLoading={mockSetLoading}
        setError={mockSetError}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Generate Flashcards' });
    fireEvent.click(submitButton);

    expect(mockSetError).toHaveBeenCalledWith('Please enter a Wikipedia URL or text');
  });

  test('shows error when submitting without API key', async () => {
    render(
      <InputForm
        setFlashcardSet={mockSetFlashcardSet}
        setLoading={mockSetLoading}
        setError={mockSetError}
      />
    );

    const inputField = screen.getByPlaceholderText('https://en.wikipedia.org/wiki/Artificial_intelligence');
    fireEvent.change(inputField, { target: { value: 'https://en.wikipedia.org/wiki/React_(JavaScript_library)' } });

    const submitButton = screen.getByRole('button', { name: 'Generate Flashcards' });
    fireEvent.click(submitButton);

    expect(mockSetError).toHaveBeenCalledWith('Please enter your OpenAI API key');
  });

  test('processes Wikipedia URL input correctly', async () => {
    const mockWikiContent = {
      title: 'React',
      content: 'React is a JavaScript library for building user interfaces.'
    };
    
    const mockFlashcards = [
      { id: '1', question: 'What is React?', answer: 'A JavaScript library for building user interfaces.' }
    ];

    mockFetchWikipediaContent.mockResolvedValue(mockWikiContent);
    mockExtractFlashcards.mockResolvedValue(mockFlashcards);

    render(
      <InputForm
        setFlashcardSet={mockSetFlashcardSet}
        setLoading={mockSetLoading}
        setError={mockSetError}
      />
    );

    const urlInput = screen.getByPlaceholderText('https://en.wikipedia.org/wiki/Artificial_intelligence');
    fireEvent.change(urlInput, { target: { value: 'https://en.wikipedia.org/wiki/React_(JavaScript_library)' } });

    const apiKeyInput = screen.getByLabelText('OpenAI API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });

    const submitButton = screen.getByRole('button', { name: 'Generate Flashcards' });
    fireEvent.click(submitButton);

    expect(mockSetLoading).toHaveBeenCalledWith(true);

    await waitFor(() => {
      expect(mockFetchWikipediaContent).toHaveBeenCalledWith('https://en.wikipedia.org/wiki/React_(JavaScript_library)');
      expect(mockExtractFlashcards).toHaveBeenCalledWith(mockWikiContent.content, 'test-api-key');
      expect(mockSetFlashcardSet).toHaveBeenCalledWith(expect.objectContaining({
        source: 'https://en.wikipedia.org/wiki/React_(JavaScript_library)',
        cards: mockFlashcards
      }));
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });
});
