function getDailyTarotCard() {
  // Get current date components
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // Months are 0-indexed
  const day = currentDate.getDate();

  // Create a unique seed based on the date (YYYYMMDD)
  const seed = year * 10000 + month * 100 + day;

  // Seeded PRNG using Mulberry32 algorithm
  function mulberry32(a) {
      return function() {
          a |= 0; a = a + 0x6D2B79F5 | 0;
          var t = Math.imul(a ^ a >>> 15, 1 | a);
          t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
      }
  }
  const random = mulberry32(seed);

  // Define all 78 Tarot cards
  const majorArcana = [
      'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
      'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
      'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
      'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun',
      'Judgement', 'The World'
  ];

  const suits = ['Wands', 'Cups', 'Swords', 'Pentacles'];
  const minorRanks = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 
                     'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];

  let minorArcana = [];
  for (const suit of suits) {
      for (const rank of minorRanks) {
          minorArcana.push(`${rank} of ${suit}`);
      }
  }

  const tarotDeck = majorArcana.concat(minorArcana);

  // Generate deterministic index and return card
  const cardIndex = Math.floor(random() * tarotDeck.length);
  return tarotDeck[cardIndex];
}

// Usage example:
console.log(getDailyTarotCard());