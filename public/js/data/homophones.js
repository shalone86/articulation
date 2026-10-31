// Homophone groups: words that sound identical in General American English.
// Each entry: [word, short meaning / clue].
// The speech checker treats any word in a group as a correct match for the others.

export const HOMOPHONES = [
  [["night", "the dark part of the day"], ["knight", "a soldier in armor"]],
  [["see", "to look"], ["sea", "a big body of salt water"]],
  [["flower", "a rose or a daisy"], ["flour", "white powder for baking"]],
  [["their", "belonging to them"], ["there", "in that place"], ["they're", "they are"]],
  [["to", "toward"], ["too", "also"], ["two", "the number 2"]],
  [["pair", "two of something"], ["pear", "a fruit"], ["pare", "to peel"]],
  [["bear", "a big furry animal"], ["bare", "with nothing on"]],
  [["right", "correct / not left"], ["write", "to put words on paper"]],
  [["hear", "to listen"], ["here", "in this place"]],
  [["eight", "the number 8"], ["ate", "past of eat"]],
  [["wood", "what trees are made of"], ["would", "as in “I would like…”"]],
  [["one", "the number 1"], ["won", "past of win"]],
  [["blue", "a color"], ["blew", "past of blow"]],
  [["sun", "the star in the sky"], ["son", "a boy child"]],
  [["mail", "letters"], ["male", "a boy or man"]],
  [["tail", "a dog wags it"], ["tale", "a story"]],
  [["meat", "food from animals"], ["meet", "to get together"]],
  [["week", "seven days"], ["weak", "not strong"]],
  [["know", "to understand"], ["no", "the opposite of yes"]],
  [["new", "not old"], ["knew", "past of know"]],
  [["road", "a street"], ["rode", "past of ride"]],
  [["hole", "an opening"], ["whole", "all of it"]],
  [["sail", "on a boat"], ["sale", "low prices"]],
  [["wait", "to stay until"], ["weight", "how heavy"]],
  [["deer", "a forest animal"], ["dear", "loved"]],
  [["hair", "on your head"], ["hare", "a fast rabbit"]],
  [["for", "a gift ___ you"], ["four", "the number 4"]],
  [["buy", "to pay for"], ["by", "next to"], ["bye", "goodbye"]],
  [["I", "me"], ["eye", "you see with it"]],
  [["be", "to exist"], ["bee", "a buzzing insect"]],
  [["knows", "understands"], ["nose", "on your face"]],
  [["plain", "simple"], ["plane", "it flies"]],
  [["rain", "water from clouds"], ["reign", "a king’s rule"]],
  [["stair", "a step"], ["stare", "to look hard"]],
  [["peace", "no war"], ["piece", "a part"]],
  [["red", "a color"], ["read", "past of read"]],
  [["wear", "to have clothes on"], ["where", "which place"]],
  [["which", "what one"], ["witch", "casts spells"]],
  [["flu", "an illness"], ["flew", "past of fly"]],
  [["knot", "a tie in rope"], ["not", "no"]],
  [["made", "past of make"], ["maid", "a cleaner"]],
  [["toe", "on your foot"], ["tow", "to pull a car"]],
  [["sew", "with needle and thread"], ["so", "very"], ["sow", "to plant seeds"]],
  [["berry", "a small fruit"], ["bury", "to put in the ground"]],
  [["cell", "a tiny unit / a room in jail"], ["sell", "to trade for money"]],
  [["cent", "a penny"], ["sent", "past of send"], ["scent", "a smell"]],
  [["allowed", "permitted"], ["aloud", "out loud"]],
  [["hour", "60 minutes"], ["our", "belonging to us"]],
  [["ant", "a tiny insect"], ["aunt", "your parent’s sister"]],
  [["chews", "bites food"], ["choose", "to pick"]],
  [["seem", "to appear"], ["seam", "where cloth is sewn"]],
  [["missed", "did not hit"], ["mist", "light fog"]],
  [["role", "a part in a play"], ["roll", "bread / to turn over"]],
  [["steal", "to take"], ["steel", "a metal"]],
  [["heel", "back of the foot"], ["heal", "to get better"]],
  [["fair", "just / a carnival"], ["fare", "the price of a ticket"]],
  [["ball", "you throw it"], ["bawl", "to cry loudly"]],
  [["your", "belonging to you"], ["you're", "you are"]],
  [["higher", "more high"], ["hire", "to give a job"]],
  [["weather", "rain or sun"], ["whether", "if"]],
];

const index = new Map();
for (const group of HOMOPHONES) {
  const words = group.map(([w]) => w.toLowerCase().replace(/[’']/g, ""));
  for (const w of words) {
    const set = index.get(w) ?? new Set();
    words.forEach((o) => o !== w && set.add(o));
    index.set(w, set);
  }
}

/** Words that sound exactly like `word` (lowercase, no apostrophes). */
export function homophonesOf(word) {
  return [...(index.get(word.toLowerCase().replace(/[’']/g, "")) ?? [])];
}

// Heteronyms: same spelling, different sound and meaning.
export const HETERONYMS = [
  { word: "read", a: ["reed", "I like to read books."], b: ["red", "Yesterday I read a book."] },
  { word: "lead", a: ["leed", "Lead the way!"], b: ["led", "Lead is a heavy metal."] },
  { word: "live", a: ["liv", "I live in a house."], b: ["lyve", "We saw a live band."] },
  { word: "wind", a: ["wind (rhymes with pinned)", "The wind is cold."], b: ["wynd (rhymes with find)", "Wind the clock."] },
  { word: "tear", a: ["teer", "A tear rolled down her cheek."], b: ["tair", "Don’t tear the paper."] },
  { word: "bow", a: ["bow (rhymes with go)", "Tie a bow."], b: ["bow (rhymes with cow)", "Bow to the queen."] },
  { word: "close", a: ["cloze", "Close the door."], b: ["clohss", "We live close to school."] },
  { word: "record", a: ["REC-ord", "I broke the record."], b: ["re-CORD", "Record your voice."] },
  { word: "present", a: ["PREZ-ent", "I got a present."], b: ["pre-ZENT", "Present your project."] },
  { word: "desert", a: ["DEZ-ert", "The desert is hot."], b: ["de-ZERT", "Don’t desert your friends."] },
];
