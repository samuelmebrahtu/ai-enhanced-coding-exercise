import { extractFlashcards } from '../../src/services/openaiService';
import OpenAI from 'openai';

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  };
});

describe('OpenAI Service', () => {
  const mockApiKey = 'test-api-key';
  const mockContent = 'Test content for flashcard extraction';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls OpenAI API with correct parameters', async () => {
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

    const mockCreate = jest.fn().mockResolvedValue(mockResponse);
    
    const mockOpenAIInstance = {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
    
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIInstance as any);

    const result = await extractFlashcards(mockContent, mockApiKey);

    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: mockApiKey,
      baseURL: expect.any(String),
      dangerouslyAllowBrowser: true
    });

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-3.5-turbo-1106',
      messages: [
        {
          role: 'system',
          content: expect.stringContaining('You are a helpful assistant that creates flashcards')
        },
        {
          role: 'user',
          content: expect.stringContaining(mockContent)
        }
      ],
      response_format: { type: 'json_object' }
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('question', 'Test Question 1');
    expect(result[0]).toHaveProperty('answer', 'Test Answer 1');
    expect(result[1]).toHaveProperty('question', 'Test Question 2');
    expect(result[1]).toHaveProperty('answer', 'Test Answer 2');
  });

  test('truncates long content', async () => {
    const longContent = 'a'.repeat(20000);
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              flashcards: []
            })
          }
        }
      ]
    };

    const mockCreate = jest.fn().mockResolvedValue(mockResponse);
    
    const mockOpenAIInstance = {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
    
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIInstance as any);

    await extractFlashcards(longContent, mockApiKey);

    const calledContent = mockCreate.mock.calls[0][0].messages[1].content;
    expect(calledContent.length).toBeLessThan(longContent.length);
    expect(calledContent).toContain('[Content truncated due to length]');
  });

  test('throws error when OpenAI response is invalid', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: '{ "invalid": "response" }'
          }
        }
      ]
    };

    const mockCreate = jest.fn().mockResolvedValue(mockResponse);
    
    const mockOpenAIInstance = {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
    
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAIInstance as any);

    await expect(extractFlashcards(mockContent, mockApiKey)).rejects.toThrow('Invalid response format from OpenAI');
  });
});
