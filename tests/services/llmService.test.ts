import { extractFlashcards } from '../../src/services/llmService';
import { getLLMConfig } from '../../src/config';

jest.mock('../../src/config', () => ({
  getLLMConfig: jest.fn().mockReturnValue({
    baseUrl: 'http://test-api.com',
    model: 'test-model',
    defaultApiKey: 'default-test-key'
  })
}));

global.fetch = jest.fn();

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid')
}));

describe('LLM Service', () => {
  const mockContent = 'Test content for flashcard generation';
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls LLM API with correct parameters', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              flashcards: [
                { question: 'Test Question 1', answer: 'Test Answer 1' },
                { question: 'Test Question 2', answer: 'Test Answer 2' }
              ]
            })
          }
        }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    const result = await extractFlashcards(mockContent, mockApiKey, false);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: expect.stringContaining(mockContent)
      })
    );

    expect(result).toEqual([
      { id: 'mocked-uuid', question: 'Test Question 1', answer: 'Test Answer 1' },
      { id: 'mocked-uuid', question: 'Test Question 2', answer: 'Test Answer 2' }
    ]);
  });

  test('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));

    await expect(extractFlashcards(mockContent, mockApiKey, false)).rejects.toThrow('Failed to extract flashcards');
  });

  test('throws error when LLM response is invalid', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: '{ "invalid": "response" }'
          }
        }
      ]
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse)
    });

    await expect(extractFlashcards(mockContent, mockApiKey, false)).rejects.toThrow('Invalid response format from LLM');
  });

  test('handles non-ok response from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValueOnce('Bad request')
    });

    await expect(extractFlashcards(mockContent, mockApiKey, false)).rejects.toThrow('API request failed');
  });
});
