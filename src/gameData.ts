export interface TriviaItem {
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const TRIVIA_QUESTIONS: TriviaItem[] = [
  {
    category: 'Gaming & Pop Culture',
    question: 'Which iconic video game character was originally known as "Jumpman"?',
    options: ['Sonic', 'Mario', 'Pac-Man', 'Mega Man'],
    correctIndex: 1,
    explanation: 'Mario was called Jumpman in the original 1981 Donkey Kong arcade game.'
  },
  {
    category: 'Movies & TV',
    question: 'In "The Matrix", what color pill does Neo take to wake up from the simulation?',
    options: ['Red', 'Blue', 'Green', 'Yellow'],
    correctIndex: 0,
    explanation: 'Morpheus offers the red pill to see the truth, and the blue pill to remain asleep.'
  },
  {
    category: 'Science & Nature',
    question: 'How many hearts does an octopus have?',
    options: ['1', '2', '3', '4'],
    correctIndex: 2,
    explanation: 'An octopus has 3 hearts: two pump blood to the gills, one to the rest of the body.'
  },
  {
    category: 'Space & Cosmos',
    question: 'Which planet in our solar system spins clockwise (retrograde rotation)?',
    options: ['Mars', 'Venus', 'Saturn', 'Neptune'],
    correctIndex: 1,
    explanation: 'Venus and Uranus rotate clockwise, unlike most other planets.'
  },
  {
    category: 'Food & Drinks',
    question: 'What is the primary ingredient in traditional hummus?',
    options: ['Lentils', 'Chickpeas', 'White Beans', 'Soybeans'],
    correctIndex: 1,
    explanation: 'Hummus is made from cooked, mashed chickpeas blended with tahini and lemon.'
  },
  {
    category: 'Music & Art',
    question: 'Who painted the famous artwork "The Starry Night"?',
    options: ['Pablo Picasso', 'Claude Monet', 'Vincent van Gogh', 'Salvador Dalí'],
    correctIndex: 2,
    explanation: 'Van Gogh painted The Starry Night in June 1889 while in Saint-Rémy-de-Provence.'
  },
  {
    category: 'Geography',
    question: 'What is the smallest country in the world by land area?',
    options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
    correctIndex: 1,
    explanation: 'Vatican City covers roughly 0.49 square kilometers (121 acres).'
  },
  {
    category: 'Tech & Inventions',
    question: 'In what year was the original Apple iPhone first released?',
    options: ['2005', '2007', '2009', '2010'],
    correctIndex: 1,
    explanation: 'Steve Jobs unveiled the iPhone in January 2007, and it launched in June 2007.'
  },
  {
    category: 'Animals',
    question: 'Which mammal is known to have the most powerful bite force relative to size?',
    options: ['Hippopotamus', 'Hyena', 'Grizzly Bear', 'Tasmanian Devil'],
    correctIndex: 3,
    explanation: 'The Tasmanian Devil has the strongest bite relative to its body mass among living mammals.'
  },
  {
    category: 'Internet Culture',
    question: 'What was the first YouTube video ever uploaded called?',
    options: ['Me at the zoo', 'Hello World', 'First Test', 'Guitar Boogie'],
    correctIndex: 0,
    explanation: '"Me at the zoo" was uploaded by co-founder Jawed Karim on April 23, 2005.'
  },
  {
    category: 'Language & Words',
    question: 'What is the only English word that ends with the letters "-mt"?',
    options: ['Burnt', 'Dreamt', 'Spelt', 'Doubt'],
    correctIndex: 1,
    explanation: '"Dreamt" (and its derivatives like undreamt) is the only common English word ending in -mt.'
  },
  {
    category: 'Gaming',
    question: 'What block in Minecraft is completely blast-resistant except to the Ender Dragon?',
    options: ['Obsidian', 'Bedrock', 'Netherite', 'Diamond Block'],
    correctIndex: 0,
    explanation: 'Obsidian has very high blast resistance against TNT and Creeper explosions.'
  }
];

export const DRAWING_WORDS: { word: string; category: string }[] = [
  { word: 'PIZZA', category: 'Food' },
  { word: 'ROCKET', category: 'Space' },
  { word: 'CAT', category: 'Animal' },
  { word: 'GUITAR', category: 'Music' },
  { word: 'RAINBOW', category: 'Nature' },
  { word: 'SUNGLASSES', category: 'Items' },
  { word: 'CASTLE', category: 'Places' },
  { word: 'PENGUIN', category: 'Animal' },
  { word: 'VOLCANO', category: 'Nature' },
  { word: 'BICYCLE', category: 'Vehicles' },
  { word: 'BURGER', category: 'Food' },
  { word: 'ROBOT', category: 'Sci-Fi' },
  { word: 'LIGHTSABER', category: 'Movies' },
  { word: 'HEADPHONES', category: 'Gadgets' },
  { word: 'CAMPFIRE', category: 'Outdoors' },
  { word: 'BALLOON', category: 'Party' },
  { word: 'PIRATE', category: 'Characters' },
  { word: 'DONUT', category: 'Food' },
  { word: 'SNOWMAN', category: 'Winter' },
  { word: 'DRAGON', category: 'Fantasy' }
];

export const SCRAMBLE_WORDS: { word: string; hint: string; category: string }[] = [
  { word: 'GALAXY', hint: 'Massive system of stars and cosmic dust', category: 'Space' },
  { word: 'CHAMELEON', hint: 'Lizard known for changing skin colors', category: 'Animals' },
  { word: 'CHOCOLATE', hint: 'Sweet brown treat made from cocoa beans', category: 'Food' },
  { word: 'HEADSET', hint: 'Audio device worn over ears with a microphone', category: 'Tech' },
  { word: 'STREAMER', hint: 'Creator broadcasting live on the internet', category: 'Internet' },
  { word: 'PANCAKE', hint: 'Flat round batter cake cooked on a griddle', category: 'Breakfast' },
  { word: 'SUBMARINE', hint: 'Watercraft capable of underwater operation', category: 'Vehicles' },
  { word: 'AVATAR', hint: 'Digital representation of an online user', category: 'Digital' },
  { word: 'FIREWORKS', hint: 'Explosive pyrotechnics celebrating festivals', category: 'Celebration' },
  { word: 'SMARTPHONE', hint: 'Handheld touchscreen cellular computer', category: 'Tech' },
  { word: 'ASTRONAUT', hint: 'Person trained to travel in spacecraft', category: 'Space' },
  { word: 'SYMPHONY', hint: 'Elaborate musical composition for orchestra', category: 'Music' }
];
