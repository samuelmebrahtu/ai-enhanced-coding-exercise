import { FlashcardSet, Flashcard } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parses and validates a JSON file containing flashcard data
 */
export const parseJSONFile = async (file: File): Promise<FlashcardSet> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate the structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid JSON format');
        }
        
        // Check for required fields
        if (!data.cards || !Array.isArray(data.cards)) {
          throw new Error('JSON must contain a "cards" array');
        }
        
        // Validate each card
        const validatedCards: Flashcard[] = data.cards.map((card: any, index: number) => {
          if (!card || typeof card !== 'object') {
            throw new Error(`Invalid card at position ${index + 1}`);
          }
          
          if (!card.question || typeof card.question !== 'string') {
            throw new Error(`Card at position ${index + 1} is missing a valid question`);
          }
          
          if (!card.answer || typeof card.answer !== 'string') {
            throw new Error(`Card at position ${index + 1} is missing a valid answer`);
          }
          
          return {
            id: card.id || uuidv4(), // Generate new ID if missing
            question: card.question.trim(),
            answer: card.answer.trim()
          };
        });
        
        if (validatedCards.length === 0) {
          throw new Error('No valid flashcards found in the file');
        }
        
        // Create FlashcardSet with defaults for missing fields
        const flashcardSet: FlashcardSet = {
          title: data.title || 'Imported Flashcards',
          source: data.source || 'Imported JSON file',
          cards: validatedCards,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
        };
        
        resolve(flashcardSet);
      } catch (error) {
        reject(new Error(`Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parses and validates a CSV file containing flashcard data
 */
export const parseCSVFile = async (file: File): Promise<FlashcardSet> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length < 2) {
          throw new Error('CSV file must contain at least a header row and one data row');
        }
        
        // Parse header
        const header = parseCSVLine(lines[0]);
        if (header.length < 2) {
          throw new Error('CSV file must have at least 2 columns');
        }
        
        // Validate header format (should be Question, Answer or similar)
        const questionIndex = findColumnIndex(header, ['question', 'q']);
        const answerIndex = findColumnIndex(header, ['answer', 'a']);
        
        if (questionIndex === -1 || answerIndex === -1) {
          // If exact headers not found, assume first two columns are question and answer
          if (header.length < 2) {
            throw new Error('CSV file must have at least 2 columns for questions and answers');
          }
        }
        
        const qIndex = questionIndex !== -1 ? questionIndex : 0;
        const aIndex = answerIndex !== -1 ? answerIndex : 1;
        
        // Parse data rows
        const cards: Flashcard[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVLine(lines[i]);
          
          if (row.length < Math.max(qIndex + 1, aIndex + 1)) {
            console.warn(`Row ${i + 1} has insufficient columns, skipping`);
            continue;
          }
          
          const question = row[qIndex]?.trim();
          const answer = row[aIndex]?.trim();
          
          if (!question || !answer) {
            console.warn(`Row ${i + 1} has empty question or answer, skipping`);
            continue;
          }
          
          cards.push({
            id: uuidv4(),
            question,
            answer
          });
        }
        
        if (cards.length === 0) {
          throw new Error('No valid flashcards found in the CSV file');
        }
        
        // Create FlashcardSet
        const flashcardSet: FlashcardSet = {
          title: `Imported CSV (${cards.length} cards)`,
          source: 'Imported CSV file',
          cards,
          createdAt: new Date()
        };
        
        resolve(flashcardSet);
      } catch (error) {
        reject(new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parses a CSV line, handling quoted values and escaped quotes
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
};

/**
 * Finds the index of a column based on possible header names
 */
const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase().trim();
    if (possibleNames.some(name => header.includes(name))) {
      return i;
    }
  }
  return -1;
};

/**
 * Validates file type and size
 */
export const validateFile = (file: File, expectedType: 'json' | 'csv'): void => {
  const maxSize = 10 * 1024 * 1024; // 10MB limit
  
  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 10MB.');
  }
  
  const extension = file.name.toLowerCase().split('.').pop();
  if (expectedType === 'json' && extension !== 'json') {
    throw new Error('Please select a JSON file (.json)');
  }
  
  if (expectedType === 'csv' && extension !== 'csv') {
    throw new Error('Please select a CSV file (.csv)');
  }
};
