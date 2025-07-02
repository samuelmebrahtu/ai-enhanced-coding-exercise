export type Flashcard = {
  id: string;
  question: string;
  answer: string;
};

export type InputType = 'text' | 'url';

export type FlashcardSet = {
  title: string;
  source: string;
  cards: Flashcard[];
  createdAt: Date;
};
