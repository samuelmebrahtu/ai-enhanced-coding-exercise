# Flashcard Extractor

A TypeScript React application that extracts flashcards from Wikipedia articles or custom text using OpenAI's API.

## Features

- Extract flashcards from Wikipedia URLs or custom text
- View flashcards in card view or list view
- Export flashcards as CSV or JSON
- Fully client-side application (no backend required)
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

2. Start the development server:
   ```
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

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
2. Enter your OpenAI API key (this is not stored and only used for the current session)
3. Click "Generate Flashcards"
4. View your flashcards in card view (flip cards to see answers) or list view
5. Export your flashcards as CSV or JSON for use in other applications

## Technologies Used

- React
- TypeScript
- OpenAI API
- Jest for testing
- Webpack for bundling

## License

MIT
