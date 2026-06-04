export interface Quote {
  text: string
  author: string
  category: string
}

export const QUOTES: Quote[] = [
  {
    text: "The pages of your diary are a secret garden only you have the key to.",
    author: "FairyDiary",
    category: "writing",
  },
  {
    text: "One day you will look back at the pages you wrote and understand exactly why you had to go through all of it.",
    author: "Unknown",
    category: "reflection",
  },
  {
    text: "Writing is the painting of the voice.",
    author: "Voltaire",
    category: "writing",
  },
  {
    text: "Fill your paper with the breathings of your heart.",
    author: "William Wordsworth",
    category: "writing",
  },
  {
    text: "In the diary you find proof that in situations which today would seem unbearable, you lived, looked around and wrote down observations.",
    author: "Franz Kafka",
    category: "diary",
  },
  {
    text: "Journal writing is a voyage to the interior.",
    author: "Christina Baldwin",
    category: "diary",
  },
  {
    text: "There is no greater agony than bearing an untold story inside you.",
    author: "Maya Angelou",
    category: "writing",
  },
  {
    text: "Writing in a journal reminds you of your goals and of your learning in life.",
    author: "Robin Sharma",
    category: "diary",
  },
  {
    text: "Keep a diary, and someday it'll keep you.",
    author: "Mae West",
    category: "diary",
  },
  {
    text: "I can shake off everything as I write; my sorrows disappear, my courage is reborn.",
    author: "Anne Frank",
    category: "healing",
  },
  {
    text: "The cure for anything is salt water: sweat, tears, or the sea.",
    author: "Isak Dinesen",
    category: "healing",
  },
  {
    text: "To write is to think. To think is to live.",
    author: "FairyDiary",
    category: "writing",
  },
  {
    text: "Every day is a story waiting to be told in your own handwriting.",
    author: "FairyDiary",
    category: "inspiration",
  },
  {
    text: "She was a girl who knew how to be happy even when she was sad.",
    author: "Marilyn Monroe",
    category: "resilience",
  },
  {
    text: "Write hard and clear about what hurts.",
    author: "Ernest Hemingway",
    category: "writing",
  },
  {
    text: "Your journal is the mirror your soul uses to see itself clearly.",
    author: "FairyDiary",
    category: "reflection",
  },
  {
    text: "Some stories are written in stars, but yours is written in your own words.",
    author: "FairyDiary",
    category: "inspiration",
  },
  {
    text: "Let everything happen to you: beauty and terror. Just keep going.",
    author: "Rainer Maria Rilke",
    category: "resilience",
  },
  {
    text: "The most important things are the hardest to say.",
    author: "Stephen King",
    category: "writing",
  },
  {
    text: "Write the book you want to read, live the life you want to write about.",
    author: "FairyDiary",
    category: "inspiration",
  },
  {
    text: "You are not your past. You are the author of your next chapter.",
    author: "FairyDiary",
    category: "healing",
  },
  {
    text: "One line a day keeps the emptiness away.",
    author: "FairyDiary",
    category: "diary",
  },
  {
    text: "Your feelings are valid. Your story matters. Keep writing.",
    author: "FairyDiary",
    category: "encouragement",
  },
  {
    text: "In the quiet of your own pages, you are free to be everything.",
    author: "FairyDiary",
    category: "freedom",
  },
  {
    text: "She made broken look beautiful and strong look invincible.",
    author: "Ariana Dancu",
    category: "resilience",
  },
  {
    text: "Words have power. Write yours with intention.",
    author: "FairyDiary",
    category: "writing",
  },
  {
    text: "Today is a blank page. Make it a beautiful one.",
    author: "FairyDiary",
    category: "inspiration",
  },
  {
    text: "The heart speaks. The diary listens. Always.",
    author: "FairyDiary",
    category: "diary",
  },
  {
    text: "Magic is just believing in yourself.",
    author: "Goethe",
    category: "inspiration",
  },
  {
    text: "You are living a story worth telling.",
    author: "FairyDiary",
    category: "encouragement",
  },
]

export function getDailyQuote(): Quote {
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  )
  return QUOTES[dayOfYear % QUOTES.length]
}

export function getRandomQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}
