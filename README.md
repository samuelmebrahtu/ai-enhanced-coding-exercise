# Flashcard Extractor

A TypeScript React application that extracts flashcards from Wikipedia articles or custom text using OpenAI's API.

## Features

- Extract flashcards from Wikipedia URLs or custom text
- View flashcards in card view or list view
- Export flashcards as CSV or JSON
- Fast mock mode for development and testing
- Local proxy server for API requests
- TypeScript for type safety

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- OpenAI API key

## Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   - Copy `template.env` to `.env`
   - Fill in the required environment variables, for example if you prefer to use OpenAI:
     ```
     INFERENCE_SERVER_URL=https://api.openai.com/v1
     MODEL_NAME=gpt-3.5-turbo-1106
     OPENAI_API_KEY=your_api_key_here
     ```

3. Start the development server:
   ```
   npm run dev
   ```
   This will start both the main application and the proxy server in a single command.

4. Open your browser and navigate to `http://localhost:3000` (opens automatically)

## Building for Production

To create a production build:

```
npm run build
```

The build files will be in the `dist` directory.

## Testing

Run the test suite:

```
npm test
```

## Usage

1. Choose between entering a Wikipedia URL or custom text
2. Toggle the mock mode switch if you want to use fast mock responses instead of real API calls
3. Click "Generate Flashcards"
4. View your flashcards in card view (flip cards to see answers) or list view
5. Export your flashcards as CSV or JSON for use in other applications

## Mock Mode

The application includes a fast mock mode for development and testing:

- **What it does**: When enabled, the application uses pre-defined mock responses instead of making real API calls
- **Benefits**: Faster development, no API key required, consistent responses for testing
- **How to use**: Toggle the "Fast Mock Mode" switch in the interface before generating flashcards
- **Persistence**: Your mock mode preference is saved between sessions

This feature is particularly useful for:
- Development and testing without consuming API credits
- Working offline
- Getting consistent flashcard results for demos

## Technologies Used

- React
- TypeScript
- OpenAI API
- Jest for testing
- Webpack for bundling

## License

MIT
