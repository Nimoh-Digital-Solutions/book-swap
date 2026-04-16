import type { BookCondition } from '@/types';

export interface MockBook {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  condition: BookCondition;
  language: string;
  time: string;
  available: boolean;
  owner: { id: string; initial: string; name: string };
  coverBg: string;
}

export const MOCK_BOOKS: MockBook[] = [
  {
    id: '1',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    genre: 'Fantasy',
    description:
      'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices… Would you have done anything different, if you had the chance to undo your regrets?',
    condition: 'like_new',
    language: 'English',
    time: '5h 20m',
    available: true,
    owner: { id: 'u1', initial: 'S', name: 'Sarah J.' },
    coverBg: '#1A2B4C',
  },
  {
    id: '2',
    title: 'Cloud Cuckoo Land',
    author: 'Anthony Doerr',
    genre: 'Historical Fiction',
    description:
      'A richly imagined, spellbinding novel about three young dreamers across centuries, bound together by a single ancient text, who each find resourcefulness and hope in the midst of vast upheaval.',
    condition: 'good',
    language: 'English',
    time: '12h 15m',
    available: false,
    owner: { id: 'u2', initial: 'M', name: 'Mark T.' },
    coverBg: '#7FB5D5',
  },
  {
    id: '3',
    title: 'The Seven Husbands of Evelyn Hugo',
    author: 'Taylor Jenkins Reid',
    genre: 'Romance',
    description:
      'Aging and reclusive Hollywood movie icon Evelyn Hugo is finally ready to tell the truth about her glamorous and scandalous life. But when she chooses unknown magazine reporter Monique Grant for the job, no one is more surprised than Monique herself.',
    condition: 'fair',
    language: 'English',
    time: '8h 45m',
    available: false,
    owner: { id: 'u3', initial: 'E', name: 'Elena R.' },
    coverBg: '#1E4D4F',
  },
  {
    id: '4',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    genre: 'Sci-Fi',
    description:
      "Ryland Grace is the sole survivor on a desperate, last-chance mission — and if he fails, humanity and the Earth itself are finished. The only problem is he doesn't remember his own name, let alone the nature of his assignment.",
    condition: 'new',
    language: 'English',
    time: '10h 30m',
    available: true,
    owner: { id: 'u4', initial: 'D', name: 'David K.' },
    coverBg: '#0F2B2F',
  },
];

export function getMockBookById(id: string): MockBook | undefined {
  return MOCK_BOOKS.find((b) => b.id === id);
}
