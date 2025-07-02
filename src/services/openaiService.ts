import { Flashcard } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getLLMConfig } from '../config';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

interface FlashcardResponse {
  flashcards: Array<{
    question: string;
    answer: string;
  }>;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export const extractFlashcards = async (
  content: string,
  apiKey?: string
): Promise<Flashcard[]> => {
  const config = getLLMConfig();
  try {
    // For local endpoints like LMStudio, API key can be empty
    const isLocalEndpoint = !config.baseUrl.includes('openai.com');
    const apiKeyToUse = isLocalEndpoint ? 
      (apiKey || config.defaultApiKey || 'not-needed') : 
      (apiKey || config.defaultApiKey || '');
    
    // Ensure baseURL has the correct format
    let baseURL = config.baseUrl;
    
    // For LMStudio, use our proxy server instead
    if (isLocalEndpoint) {
      // Use our local proxy server to avoid CORS issues
      baseURL = 'http://localhost:3001/api';
      
      // If the original URL had /v1 at the end, keep it
      if (!baseURL.endsWith('/v1')) {
        baseURL = baseURL.endsWith('/') ? `${baseURL}v1` : `${baseURL}/v1`;
      }
      
      console.log('Using proxy server for LMStudio:', baseURL);
    }
    
    const truncatedContent = truncateContent(content, 15000);

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful assistant that creates flashcards from educational content. 
        Extract key concepts and create question-answer pairs that would be useful for studying.
        Focus on important facts, definitions, and concepts.
        Create between 10-20 flashcards depending on the content length.
        Format your response as a valid JSON object with a "flashcards" array containing objects with "question" and "answer" properties.`
      },
      {
        role: 'user',
        content: `Create flashcards from the following content:\n\n${truncatedContent}`
      }
    ];
    
    // Try a different format for LMStudio
    let requestBody;
    
    if (isLocalEndpoint) {
      // For LMStudio, format exactly as expected
      requestBody = {
        model: config.model,
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that creates flashcards from educational content. 
            Extract key concepts and create question-answer pairs that would be useful for studying.
            Focus on important facts, definitions, and concepts.
            Create between 10-20 flashcards depending on the content length.
            Format your response as a valid JSON object with a "flashcards" array containing objects with "question" and "answer" properties.`
          },
          {
            role: "user",
            content: `Create flashcards from the following content:\n\n${truncatedContent}`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: false
      };
    } else {
      // For OpenAI, use the original format
      requestBody = {
        model: config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: -1,
        stream: false
      };
      
      // Only add response_format for OpenAI API
      (requestBody as any).response_format = { type: "json_object" };
    }
    
    // Log the request body for debugging
    console.log('Request body for', isLocalEndpoint ? 'LMStudio' : 'OpenAI', ':', JSON.stringify(requestBody, null, 2));
    
    // Response format is now handled in the requestBody construction
    
    console.log('Request URL:', `${baseURL}/chat/completions`);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Exactly match the curl example headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Only add Authorization if we have an API key and it's not a local endpoint
    if (apiKeyToUse && !isLocalEndpoint) {
      headers['Authorization'] = `Bearer ${apiKeyToUse}`;
    }
    
    let responseContent: string | undefined;
    
    try {
      // Use default mode (same as curl)
      // Stringify the request body manually to ensure proper formatting
      const requestBodyString = JSON.stringify(requestBody);
      console.log('Final request body string:', requestBodyString);
      
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: requestBodyString
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }
      
      const responseData: ChatCompletionResponse = await response.json();
      responseContent = responseData.choices[0]?.message?.content;
    } catch (error: any) {
      console.error('Fetch error details:', error);
      throw new Error(`Network error when connecting to ${baseURL}: ${error.message || 'Unknown error'}`);
    }
    
    if (!responseContent) {
      throw new Error('No response from LLM API');
    }

    const parsedResponse = JSON.parse(responseContent) as FlashcardResponse;
    
    if (!parsedResponse.flashcards || !Array.isArray(parsedResponse.flashcards)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return parsedResponse.flashcards.map(card => ({
      id: uuidv4(),
      question: card.question,
      answer: card.answer
    }));
  } catch (error) {
    console.error('Error extracting flashcards:', error);
    throw new Error(`Failed to extract flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const truncateContent = (content: string, maxLength: number): string => {
  if (content.length <= maxLength) {
    return content;
  }
  
  return content.substring(0, maxLength) + '... [Content truncated due to length]';
};
