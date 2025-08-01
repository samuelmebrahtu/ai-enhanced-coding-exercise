import { parseJSONFile, parseCSVFile, validateFile } from '../../src/services/importService';
import { FlashcardSet } from '../../src/types';

// Mock File constructor for testing
class MockFile {
  name: string;
  size: number;
  type: string;
  content: string;

  constructor(content: string, name: string, options: { type?: string } = {}) {
    this.content = content;
    this.name = name;
    this.size = content.length;
    this.type = options.type || 'text/plain';
  }
}

// Mock FileReader
const mockFileReader = {
  readAsText: jest.fn(),
  onload: null as any,
  onerror: null as any,
  result: null as any
};

// Mock FileReader constructor
(global as any).FileReader = jest.fn(() => mockFileReader);

describe('importService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileReader.onload = null;
    mockFileReader.onerror = null;
    mockFileReader.result = null;
  });

  describe('validateFile', () => {
    it('should validate JSON file correctly', () => {
      const file = new MockFile('{}', 'test.json', { type: 'application/json' }) as any;
      expect(() => validateFile(file, 'json')).not.toThrow();
    });

    it('should validate CSV file correctly', () => {
      const file = new MockFile('question,answer', 'test.csv', { type: 'text/csv' }) as any;
      expect(() => validateFile(file, 'csv')).not.toThrow();
    });

    it('should reject file with wrong extension', () => {
      const file = new MockFile('{}', 'test.txt') as any;
      expect(() => validateFile(file, 'json')).toThrow('Please select a JSON file (.json)');
    });

    it('should reject file that is too large', () => {
      const file = new MockFile('x'.repeat(11 * 1024 * 1024), 'test.json') as any;
      expect(() => validateFile(file, 'json')).toThrow('File size too large. Maximum size is 10MB.');
    });
  });

  describe('parseJSONFile', () => {
    it('should parse valid JSON flashcard file', async () => {
      const validFlashcardSet = {
        title: 'Test Flashcards',
        source: 'Test source',
        cards: [
          { id: '1', question: 'What is 2+2?', answer: '4' },
          { id: '2', question: 'What is the capital of France?', answer: 'Paris' }
        ],
        createdAt: new Date().toISOString()
      };

      const file = new MockFile(JSON.stringify(validFlashcardSet), 'test.json') as any;

      // Mock FileReader behavior
      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          mockFileReader.result = JSON.stringify(validFlashcardSet);
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: JSON.stringify(validFlashcardSet) } });
          }
        }, 0);
      });

      const result = await parseJSONFile(file);

      expect(result.title).toBe('Test Flashcards');
      expect(result.cards).toHaveLength(2);
      expect(result.cards[0].question).toBe('What is 2+2?');
      expect(result.cards[0].answer).toBe('4');
    });

    it('should generate IDs for cards without them', async () => {
      const flashcardSetWithoutIds = {
        title: 'Test Flashcards',
        source: 'Test source',
        cards: [
          { question: 'What is 2+2?', answer: '4' },
          { question: 'What is the capital of France?', answer: 'Paris' }
        ],
        createdAt: new Date().toISOString()
      };

      const file = new MockFile(JSON.stringify(flashcardSetWithoutIds), 'test.json') as any;

      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: JSON.stringify(flashcardSetWithoutIds) } });
          }
        }, 0);
      });

      const result = await parseJSONFile(file);

      expect(result.cards[0].id).toBeDefined();
      expect(result.cards[1].id).toBeDefined();
      expect(result.cards[0].id).not.toBe(result.cards[1].id);
    });

    it('should use default values for missing fields', async () => {
      const minimalFlashcardSet = {
        cards: [
          { question: 'What is 2+2?', answer: '4' }
        ]
      };

      const file = new MockFile(JSON.stringify(minimalFlashcardSet), 'test.json') as any;

      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: JSON.stringify(minimalFlashcardSet) } });
          }
        }, 0);
      });

      const result = await parseJSONFile(file);

      expect(result.title).toBe('Imported Flashcards');
      expect(result.source).toBe('Imported JSON file');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should reject invalid JSON', async () => {
      const file = new MockFile('invalid json', 'test.json') as any;

      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: 'invalid json' } });
          }
        }, 0);
      });

      await expect(parseJSONFile(file)).rejects.toThrow('Failed to parse JSON file');
    });

    it('should reject JSON without cards array', async () => {
      const invalidData = { title: 'Test' };
      const file = new MockFile(JSON.stringify(invalidData), 'test.json') as any;

      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: JSON.stringify(invalidData) } });
          }
        }, 0);
      });

      await expect(parseJSONFile(file)).rejects.toThrow('JSON must contain a "cards" array');
    });
  });

  describe('parseCSVFile', () => {
    it('should parse valid CSV file with standard headers', async () => {
      const csvContent = 'Question,Answer\n"What is 2+2?","4"\n"Capital of France?","Paris"';
      const file = new MockFile(csvContent, 'test.csv') as any;

      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: csvContent } });
          }
        }, 0);
      });

      const result = await parseCSVFile(file);

      expect(result.title).toBe('Imported CSV (2 cards)');
      expect(result.source).toBe('Imported CSV file');
      expect(result.cards).toHaveLength(2);
      expect(result.cards[0].question).toBe('What is 2+2?');
      expect(result.cards[0].answer).toBe('4');
      expect(result.cards[1].question).toBe('Capital of France?');
      expect(result.cards[1].answer).toBe('Paris');
    });

    it('should parse CSV without standard headers', async () => {
      const csvContent = 'Col1,Col2\n"What is 2+2?","4"\n"Capital of France?","Paris"';
      const file = new MockFile(csvContent, 'test.csv') as any;

      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: csvContent } });
          }
        }, 0);
      });

      const result = await parseCSVFile(file);

      expect(result.cards).toHaveLength(2);
      expect(result.cards[0].question).toBe('What is 2+2?');
      expect(result.cards[0].answer).toBe('4');
    });

    it('should handle escaped quotes in CSV', async () => {
      const csvContent = 'Question,Answer\n"What is ""quoted"" text?","It uses double quotes"';
      const file = new MockFile(csvContent, 'test.csv') as any;

      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: csvContent } });
          }
        }, 0);
      });

      const result = await parseCSVFile(file);

      expect(result.cards[0].question).toBe('What is "quoted" text?');
      expect(result.cards[0].answer).toBe('It uses double quotes');
    });

    it('should skip empty rows', async () => {
      const csvContent = 'Question,Answer\n"What is 2+2?","4"\n\n"Capital of France?","Paris"\n,';
      const file = new MockFile(csvContent, 'test.csv') as any;

      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: csvContent } });
          }
        }, 0);
      });

      const result = await parseCSVFile(file);

      expect(result.cards).toHaveLength(2);
    });

    it('should reject CSV with insufficient data', async () => {
      const csvContent = 'Question,Answer';
      const file = new MockFile(csvContent, 'test.csv') as any;

      mockFileReader.readAsText.mockImplementation(() => {
        setTimeout(() => {
          if (mockFileReader.onload) {
            mockFileReader.onload({ target: { result: csvContent } });
          }
        }, 0);
      });

      await expect(parseCSVFile(file)).rejects.toThrow('CSV file must contain at least a header row and one data row');
    });
  });
});
