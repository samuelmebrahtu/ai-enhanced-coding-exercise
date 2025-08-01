import React, { useState, useEffect, useRef } from 'react';

import { getLLMConfig } from '../config';
import { extractFlashcards } from '../services/llmService';
import { fetchWikipediaContent } from '../services/wikipediaService';
import { parseJSONFile, parseCSVFile, validateFile } from '../services/importService';
import { FlashcardSet } from '../types';

import { MockModeToggle } from './MockModeToggle';
import '../styles/InputForm.css';

interface InputFormProps {
  setFlashcardSet: React.Dispatch<React.SetStateAction<FlashcardSet | null>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

const InputForm: React.FC<InputFormProps> = ({ setFlashcardSet, setLoading, setError }) => {
  const [isUrlInput, setIsUrlInput] = useState(true);
  const [input, setInput] = useState('');
  const [useMockMode, setUseMockMode] = useState(false);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedSetting = localStorage.getItem('use_mock_mode');
    if (savedSetting !== null && savedSetting !== '') {
      setUseMockMode(savedSetting === 'true');
    }
  }, []);

  const isValidWikipediaUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.hostname === 'en.wikipedia.org'
        || parsedUrl.hostname === 'wikipedia.org'
      );
    } catch (error) {
      return false;
    }
  };

  const extractTitleFromUrl = (url: string): string => {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/');
      const title = pathParts[pathParts.length - 1];
      return title.replace(/_/g, ' ');
    } catch (error) {
      return 'Wikipedia Article';
    }
  };
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!input.trim()) {
      setError('Please enter a Wikipedia URL or text');
      return;
    }

    const config = getLLMConfig();

    if (config.defaultApiKey === undefined || config.defaultApiKey === '' || config.defaultApiKey.trim() === '') {
      setError('Please set your API key in LLM Settings');
      return;
    }

    setLoading(true);

    try {
      let content = input;
      let source = 'Custom text';

      if (isUrlInput) {
        if (!isValidWikipediaUrl(input)) {
          setError('Please enter a valid Wikipedia URL');
          setLoading(false);
          return;
        }

        const wikiContent = await fetchWikipediaContent(input);
        content = wikiContent.content;
        source = input;
      }

      const flashcards = await extractFlashcards(content, undefined, useMockMode);

      setFlashcardSet({
        title: isUrlInput ? extractTitleFromUrl(input) : 'Custom Text Flashcards',
        source,
        cards: flashcards,
        createdAt: new Date(),
      });
    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJSONImport = (): void => {
    jsonFileInputRef.current?.click();
  };

  const handleCSVImport = (): void => {
    csvFileInputRef.current?.click();
  };

  const handleJSONFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      validateFile(file, 'json');
      const flashcardSet = await parseJSONFile(file);
      setFlashcardSet(flashcardSet);
    } catch (error) {
      setError(`Import Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
      // Reset file input
      if (jsonFileInputRef.current) {
        jsonFileInputRef.current.value = '';
      }
    }
  };

  const handleCSVFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      validateFile(file, 'csv');
      const flashcardSet = await parseCSVFile(file);
      setFlashcardSet(flashcardSet);
    } catch (error) {
      setError(`Import Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
      // Reset file input
      if (csvFileInputRef.current) {
        csvFileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="input-form-container">
      <form
        onSubmit={(e): void => {
          handleSubmit(e).catch((_) => { /* Error handled in handleSubmit */ });
        }}
      >
        <div className="input-type-selector">
          <button
            type="button"
            className={isUrlInput === true ? 'active' : ''}
            onClick={(): void => setIsUrlInput(true)}
          >
            Wikipedia URL
          </button>
          <button
            type="button"
            className={isUrlInput === false ? 'active' : ''}
            onClick={(): void => setIsUrlInput(false)}
          >
            Custom Text
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="input">
            {isUrlInput ? 'Wikipedia URL' : 'Text to extract flashcards from'}
          </label>
          <textarea
            id="input"
            value={input}
            onChange={(e): void => setInput(e.target.value)}
            placeholder={
              isUrlInput
                ? 'https://en.wikipedia.org/wiki/Artificial_intelligence'
                : 'Paste your text here...'
            }
            rows={isUrlInput ? 1 : 10}
          />
        </div>

        <MockModeToggle onChange={setUseMockMode} />

        <button className="submit-button" type="submit">Generate Flashcards</button>
      </form>
      
      <div className="import-section">
        <div className="separator">
          <span className="separator-line"></span>
          <span className="separator-text">OR</span>
          <span className="separator-line"></span>
        </div>
        
        <div className="import-buttons">
          <button
            type="button"
            className="import-button json-import"
            onClick={handleJSONImport}
          >
            Import from JSON
          </button>
          <button
            type="button"
            className="import-button csv-import"
            onClick={handleCSVImport}
          >
            Import from CSV
          </button>
        </div>
        
        {/* Hidden file inputs */}
        <input
          ref={jsonFileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e): void => {
            handleJSONFileChange(e).catch((_) => { /* Error handled in handleJSONFileChange */ });
          }}
        />
        <input
          ref={csvFileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={(e): void => {
            handleCSVFileChange(e).catch((_) => { /* Error handled in handleCSVFileChange */ });
          }}
        />
      </div>
    </div>
  );
};

export default InputForm;
