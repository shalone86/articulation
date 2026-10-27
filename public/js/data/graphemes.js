// Graphemes: the letters (or letter teams) that spell a sound.
//
//   type   consonant-digraph | vowel-digraph | split-digraph | r-controlled |
//          trigraph | quadgraph | silent | glued
//   sounds [phoneme id, example word] — some graphemes spell more than one sound
//   words  practice words (first one is the key word)
//   note   spelling tip

export const GRAPHEME_TYPES = {
  "consonant-digraph": { name: "Consonant digraphs", blurb: "Two consonant letters, one sound." },
  "vowel-digraph": { name: "Vowel teams", blurb: "Two letters working together to spell one vowel sound." },
  "split-digraph": { name: "Magic e (split digraphs)", blurb: "A vowel and a final e, split by a consonant. The e is silent but changes the vowel." },
  "r-controlled": { name: "Bossy R (r-controlled vowels)", blurb: "When r follows a vowel, it changes the vowel’s sound." },
  trigraph: { name: "Trigraphs", blurb: "Three letters, one sound." },
  quadgraph: { name: "Quadgraphs", blurb: "Four letters, one sound." },
  silent: { name: "Silent letters", blurb: "One of the letters is written but not said." },
  glued: { name: "Glued sounds", blurb: "Letter groups that are easiest to learn as a chunk." },
};

export const GRAPHEMES = [
  // ── consonant digraphs ──
  { id: "g-sh", g: "sh", type: "consonant-digraph", sounds: [["sh", "ship"]], words: ["ship", "shoe", "fish", "brush", "wash"], sentence: "She washed the shiny dish.", note: "Always says /ʃ/ (shh)." },
  { id: "g-ch", g: "ch", type: "consonant-digraph", sounds: [["ch", "chip"], ["k", "school"], ["sh", "chef"]], words: ["chip", "lunch", "school", "chef", "chin"], sentence: "The chef at school ate cheese for lunch.", note: "Usually /tʃ/ (chip). In Greek words it’s /k/ (school, chorus, stomach). In French words it’s /ʃ/ (chef, machine)." },
  { id: "g-th", g: "th", type: "consonant-digraph", sounds: [["th-voiceless", "thin"], ["th-voiced", "this"], ["t", "Thomas"]], words: ["thin", "this", "bath", "mother", "three"], sentence: "This is the third bath this month.", note: "Two sounds: quiet /θ/ (thin, bath) and buzzy /ð/ (this, mother). Small everyday words (the, this, that, they, there) use the buzzy one." },
  { id: "g-wh", g: "wh", type: "consonant-digraph", sounds: [["w", "whale"], ["h", "who"]], words: ["whale", "when", "white", "why", "who"], sentence: "Why is the white whale here?", note: "Usually /w/ (when, white). Before o it’s often /h/ (who, whole, whose)." },
  { id: "g-ph", g: "ph", type: "consonant-digraph", sounds: [["f", "phone"]], words: ["phone", "photo", "elephant", "graph", "dolphin"], sentence: "The dolphin took a photo of the elephant.", note: "Says /f/. Usually in words from Greek." },
  { id: "g-ck", g: "ck", type: "consonant-digraph", sounds: [["k", "duck"]], words: ["duck", "sock", "back", "rocket", "chicken"], sentence: "The duck put a sock on the rocket.", note: "Says /k/. Used right after a short vowel (duck, back), never at the start of a word." },
  { id: "g-ng", g: "ng", type: "consonant-digraph", sounds: [["ng", "ring"]], words: ["ring", "sing", "king", "long", "song"], sentence: "The king sang a long song.", note: "One nasal sound /ŋ/ — no /g/ popped at the end of “sing”." },
  { id: "g-gh", g: "gh", type: "consonant-digraph", sounds: [["g", "ghost"], ["f", "laugh"]], words: ["ghost", "laugh", "tough", "night", "enough"], sentence: "The ghost laughed — enough was enough!", note: "At the start it’s /g/ (ghost). At the end it can be /f/ (laugh, tough). Often it’s silent (night, though)." },
  { id: "g-qu", g: "qu", type: "glued", sounds: [["k", "queen"], ["w", "queen"]], words: ["queen", "quick", "quiet", "square", "quilt"], sentence: "The queen was quick and quiet.", note: "Usually /kw/ (queen). Q almost always comes with u." },
  { id: "g-nk", g: "nk", type: "glued", sounds: [["ng", "think"], ["k", "think"]], words: ["think", "pink", "bank", "monkey", "drink"], sentence: "The pink monkey thinks about a drink.", note: "The n says /ŋ/ (like in sing) and then a /k/ follows: thi-ng-k." },
  { id: "g-x", g: "x", type: "glued", sounds: [["k", "box"], ["s", "box"], ["z", "xylophone"]], words: ["box", "fox", "six", "taxi", "exam"], sentence: "Six foxes sat in a box in the taxi.", note: "Usually /ks/ (box). Sometimes /gz/ (exam) or /z/ at the start (xylophone)." },

  // ── trigraphs ──
  { id: "g-tch", g: "tch", type: "trigraph", sounds: [["ch", "match"]], words: ["match", "watch", "kitchen", "catch", "itch"], sentence: "Catch the watch in the kitchen.", note: "Says /tʃ/ right after a short vowel (match, catch). Exceptions: much, such, rich, which." },
  { id: "g-dge", g: "dge", type: "trigraph", sounds: [["j", "bridge"]], words: ["bridge", "badge", "edge", "fudge", "judge"], sentence: "The judge ate fudge on the edge of the bridge.", note: "Says /dʒ/ right after a short vowel (bridge, badge)." },
  { id: "g-igh", g: "igh", type: "trigraph", sounds: [["long-i", "night"]], words: ["night", "light", "high", "right", "fight"], sentence: "The light is high and bright at night.", note: "Says long i /aɪ/. The gh is silent." },
  { id: "g-ear", g: "ear", type: "trigraph", sounds: [["ear", "ear"], ["er", "learn"], ["air", "bear"], ["ar", "heart"]], words: ["ear", "near", "learn", "bear", "heart"], sentence: "I hear the bear learned to draw a heart.", note: "Four sounds! Most often /ɪr/ (ear, hear), but also /ɝ/ (learn, early), /ɛr/ (bear, wear), /ɑr/ (heart)." },
  { id: "g-air", g: "air", type: "trigraph", sounds: [["air", "hair"]], words: ["hair", "chair", "fair", "stairs", "pair"], sentence: "A pair of chairs sat by the stairs.", note: "Says /ɛr/." },
  { id: "g-ure", g: "ure", type: "trigraph", sounds: [["ure", "pure"], ["er", "picture"]], words: ["pure", "cure", "sure", "picture", "nature"], sentence: "I’m sure this picture of nature is pure.", note: "Stressed: /jʊr/ (pure, cure). Unstressed at the end of longer words: /tʃɚ/ (picture, nature)." },
  { id: "g-eer", g: "eer", type: "trigraph", sounds: [["ear", "deer"]], words: ["deer", "cheer", "steer", "peer", "sheer"], sentence: "The deer cheered as we steered.", note: "Says /ɪr/." },
  { id: "g-are", g: "are", type: "trigraph", sounds: [["air", "care"]], words: ["care", "share", "square", "scare", "bare"], sentence: "Take care to share the square.", note: "Says /ɛr/. (But “are” on its own says /ɑr/!)" },
  { id: "g-ore", g: "ore", type: "trigraph", sounds: [["or", "more"]], words: ["more", "store", "shore", "snore", "before"], sentence: "Before the store, we snored on the shore.", note: "Says /ɔr/." },
  { id: "g-our", g: "our", type: "trigraph", sounds: [["or", "four"], ["ow", "hour"], ["er", "journey"]], words: ["four", "your", "hour", "our", "journey"], sentence: "Our journey took four hours.", note: "Can say /ɔr/ (four, your), /aʊr/ (hour, our), or /ɝ/ (journey)." },
  { id: "g-oar", g: "oar", type: "trigraph", sounds: [["or", "board"]], words: ["board", "roar", "soar", "boar", "oar"], sentence: "The boar roared on the board.", note: "Says /ɔr/." },

  // ── quadgraphs ──
  { id: "g-eigh", g: "eigh", type: "quadgraph", sounds: [["long-a", "eight"]], words: ["eight", "weigh", "sleigh", "neighbor", "weight"], sentence: "Our neighbor weighed eight sleighs.", note: "Says long a /eɪ/. (In “height” it says long i.)" },
  { id: "g-ough", g: "ough", type: "quadgraph", sounds: [["aw", "bought"], ["long-o", "though"], ["long-oo", "through"], ["ow", "bough"], ["short-u", "tough"]], words: ["bought", "though", "through", "tough", "cough"], sentence: "Though it was tough, I thought it through.", note: "The trickiest spelling in English — it has at least six sounds: bought /ɔ/, though /oʊ/, through /u/, bough /aʊ/, tough /ʌf/, cough /ɔf/. Learn each word by heart." },
  { id: "g-augh", g: "augh", type: "quadgraph", sounds: [["aw", "caught"], ["short-a", "laugh"]], words: ["caught", "daughter", "taught", "naughty", "laugh"], sentence: "My daughter caught the ball and laughed.", note: "Usually /ɔ/ (caught, taught). In “laugh” it’s /æf/." },

  // ── vowel teams ──
  { id: "g-ai", g: "ai", type: "vowel-digraph", sounds: [["long-a", "rain"], ["short-e", "said"]], words: ["rain", "train", "snail", "paint", "wait"], sentence: "Wait for the train in the rain.", note: "Long a /eɪ/, used in the middle of a word. At the end, use ay." },
  { id: "g-ay", g: "ay", type: "vowel-digraph", sounds: [["long-a", "day"]], words: ["day", "play", "say", "stay", "tray"], sentence: "Stay and play all day.", note: "Long a /eɪ/, used at the end of a word." },
  { id: "g-ee", g: "ee", type: "vowel-digraph", sounds: [["long-e", "tree"]], words: ["tree", "see", "feet", "green", "sleep"], sentence: "Three green trees sleep.", note: "Always long e /i/." },
  { id: "g-ea", g: "ea", type: "vowel-digraph", sounds: [["long-e", "eat"], ["short-e", "bread"], ["long-a", "steak"]], words: ["eat", "sea", "bread", "head", "steak"], sentence: "Eat the bread and steak by the sea.", note: "Three sounds: long e (eat — most common), short e (bread, head), long a (steak, great, break)." },
  { id: "g-ie", g: "ie", type: "vowel-digraph", sounds: [["long-i", "pie"], ["long-e", "field"]], words: ["pie", "tie", "field", "chief", "piece"], sentence: "The chief ate a piece of pie in the field.", note: "Long i at the end of short words (pie, tie). Long e in the middle (field, piece)." },
  { id: "g-ei", g: "ei", type: "vowel-digraph", sounds: [["long-e", "ceiling"], ["long-a", "vein"]], words: ["ceiling", "receive", "vein", "reindeer", "their"], sentence: "The reindeer received a gift on the ceiling.", note: "Long e (ceiling, receive) or long a (vein, reindeer). “I before e except after c” has many exceptions!" },
  { id: "g-ey", g: "ey", type: "vowel-digraph", sounds: [["long-e", "key"], ["long-a", "they"]], words: ["key", "monkey", "honey", "they", "grey"], sentence: "They gave the monkey a key and honey.", note: "Long e at the end of longer words (monkey, honey). Long a in they, grey, obey." },
  { id: "g-y", g: "y (as a vowel)", type: "vowel-digraph", sounds: [["long-i", "fly"], ["long-e", "happy"], ["short-i", "gym"]], words: ["fly", "my", "happy", "baby", "gym"], sentence: "My happy baby can fly to the gym.", note: "At the end of a one-syllable word: long i (my, fly). At the end of a longer word: long e (happy). In the middle: short i (gym)." },
  { id: "g-oa", g: "oa", type: "vowel-digraph", sounds: [["long-o", "boat"]], words: ["boat", "coat", "road", "soap", "goat"], sentence: "The goat in a coat rode a boat down the road.", note: "Long o /oʊ/, in the middle of a word." },
  { id: "g-oe", g: "oe", type: "vowel-digraph", sounds: [["long-o", "toe"], ["long-oo", "shoe"]], words: ["toe", "goes", "hoe", "shoe", "canoe"], sentence: "Joe’s toe goes in his shoe.", note: "Usually long o (toe, goes). Sometimes /u/ (shoe, canoe)." },
  { id: "g-ow", g: "ow", type: "vowel-digraph", sounds: [["long-o", "snow"], ["ow", "cow"]], words: ["snow", "grow", "cow", "town", "now"], sentence: "Now the cow can grow in the snowy town.", note: "Two sounds: long o (snow, grow) and /aʊ/ (cow, town). You have to know the word." },
  { id: "g-ou", g: "ou", type: "vowel-digraph", sounds: [["ow", "out"], ["long-oo", "soup"], ["short-u", "touch"], ["short-oo", "could"]], words: ["out", "house", "soup", "touch", "could"], sentence: "Could you touch the soup in the house?", note: "Usually /aʊ/ (out, house). Also /u/ (soup, you), /ʌ/ (touch, young), /ʊ/ (could, would)." },
  { id: "g-oo", g: "oo", type: "vowel-digraph", sounds: [["long-oo", "moon"], ["short-oo", "book"], ["short-u", "blood"]], words: ["moon", "food", "book", "look", "foot"], sentence: "Look at the book about food on the moon.", note: "Long /u/ (moon, food) or short /ʊ/ (book, look — especially before k). Rarely /ʌ/ (blood, flood)." },
  { id: "g-ue", g: "ue", type: "vowel-digraph", sounds: [["long-oo", "blue"], ["long-u", "cue"]], words: ["blue", "glue", "true", "clue", "rescue"], sentence: "True blue glue is the clue.", note: "Says /u/ (blue) or /ju/ (cue, rescue), usually at the end of a word." },
  { id: "g-ew", g: "ew", type: "vowel-digraph", sounds: [["long-oo", "new"], ["long-u", "few"]], words: ["new", "flew", "chew", "few", "grew"], sentence: "A few new birds flew and grew.", note: "Says /u/ (flew, chew) or /ju/ (few, nephew)." },
  { id: "g-ui", g: "ui", type: "vowel-digraph", sounds: [["long-oo", "fruit"], ["short-i", "build"]], words: ["fruit", "juice", "suit", "build", "guitar"], sentence: "Build a fruit juice suit.", note: "Says /u/ (fruit, juice) or /ɪ/ (build, guilt)." },
  { id: "g-oi", g: "oi", type: "vowel-digraph", sounds: [["oy", "coin"]], words: ["coin", "oil", "boil", "point", "soil"], sentence: "Point at the coin in the soil.", note: "Says /ɔɪ/, in the middle of a word." },
  { id: "g-oy", g: "oy", type: "vowel-digraph", sounds: [["oy", "boy"]], words: ["boy", "toy", "enjoy", "joy", "royal"], sentence: "The boy enjoyed his royal toy.", note: "Says /ɔɪ/, at the end of a word or syllable." },
  { id: "g-au", g: "au", type: "vowel-digraph", sounds: [["aw", "sauce"]], words: ["sauce", "August", "author", "autumn", "pause"], sentence: "In August the author paused for sauce.", note: "Says /ɔ/, in the middle of a word." },
  { id: "g-aw", g: "aw", type: "vowel-digraph", sounds: [["aw", "saw"]], words: ["saw", "paw", "draw", "straw", "yawn"], sentence: "I saw a paw draw with a straw.", note: "Says /ɔ/, at the end of a word or before n/l (yawn, crawl)." },
  { id: "g-al", g: "al", type: "glued", sounds: [["aw", "ball"], ["short-o", "palm"]], words: ["ball", "talk", "walk", "chalk", "palm"], sentence: "Walk and talk with chalk and a ball.", note: "In “all” and “alk” the a says /ɔ/ and in “alk” the l is silent (talk, walk)." },

  // ── split digraphs (magic e) ──
  { id: "g-a_e", g: "a_e", type: "split-digraph", sounds: [["long-a", "cake"]], words: ["cake", "game", "lake", "name", "plate"], sentence: "Jane ate cake by the lake.", note: "The silent e makes the a say its name: cap → cape." },
  { id: "g-e_e", g: "e_e", type: "split-digraph", sounds: [["long-e", "these"]], words: ["these", "theme", "Pete", "complete", "eve"], sentence: "Pete completed these themes.", note: "The e makes the first e say its name. Less common." },
  { id: "g-i_e", g: "i_e", type: "split-digraph", sounds: [["long-i", "kite"]], words: ["kite", "bike", "five", "time", "slide"], sentence: "Five kites flew by the bike slide.", note: "The silent e makes the i say its name: kit → kite." },
  { id: "g-o_e", g: "o_e", type: "split-digraph", sounds: [["long-o", "home"]], words: ["home", "rope", "bone", "nose", "stone"], sentence: "The dog took the bone home.", note: "The silent e makes the o say its name: hop → hope." },
  { id: "g-u_e", g: "u_e", type: "split-digraph", sounds: [["long-u", "cube"], ["long-oo", "rule"]], words: ["cube", "cute", "huge", "rule", "flute"], sentence: "A huge cute cube played the flute.", note: "Says /ju/ (cube, cute) or /u/ (rule, flute): cut → cute." },

  // ── r-controlled ──
  { id: "g-ar", g: "ar", type: "r-controlled", sounds: [["ar", "car"], ["or", "warm"]], words: ["car", "star", "park", "farm", "shark"], sentence: "A shark parked a car at the farm.", note: "Usually /ɑr/. After w it says /ɔr/ (warm, war)." },
  { id: "g-er", g: "er", type: "r-controlled", sounds: [["er", "her"]], words: ["her", "fern", "teacher", "letter", "water"], sentence: "Her teacher wrote a letter.", note: "Says /ɝ/. Very common at the end of words (teacher, water)." },
  { id: "g-ir", g: "ir", type: "r-controlled", sounds: [["er", "bird"]], words: ["bird", "girl", "shirt", "first", "dirt"], sentence: "The first girl’s shirt had dirt.", note: "Says /ɝ/ — same as er and ur." },
  { id: "g-ur", g: "ur", type: "r-controlled", sounds: [["er", "turn"]], words: ["turn", "nurse", "purple", "burn", "turtle"], sentence: "The nurse’s purple turtle turned.", note: "Says /ɝ/ — same as er and ir." },
  { id: "g-or", g: "or", type: "r-controlled", sounds: [["or", "corn"], ["er", "word"]], words: ["corn", "fork", "horse", "storm", "word"], sentence: "The horse ate corn with a fork.", note: "Usually /ɔr/. After w it says /ɝ/ (word, work, world)." },

  // ── silent letters ──
  { id: "g-kn", g: "kn", type: "silent", sounds: [["n", "knee"]], words: ["knee", "knife", "knock", "know", "knight"], sentence: "The knight knocked his knee with a knife.", note: "The k is silent: just say /n/." },
  { id: "g-wr", g: "wr", type: "silent", sounds: [["r", "write"]], words: ["write", "wrong", "wrist", "wrap", "wren"], sentence: "Write the wrong word on your wrist.", note: "The w is silent: just say /r/." },
  { id: "g-gn", g: "gn", type: "silent", sounds: [["n", "gnome"]], words: ["gnome", "sign", "gnat", "design", "foreign"], sentence: "The gnome made a sign with a gnat.", note: "The g is silent: just say /n/." },
  { id: "g-mb", g: "mb", type: "silent", sounds: [["m", "lamb"]], words: ["lamb", "thumb", "climb", "comb", "bomb"], sentence: "The lamb climbed with its thumb.", note: "The b is silent at the end of a word: just say /m/." },
  { id: "g-silent-h", g: "h (silent)", type: "silent", sounds: [], words: ["hour", "honest", "honor", "heir", "ghost"], sentence: "An honest heir waited an hour.", note: "In a few words from French, h is silent (hour, honest, honor, heir). Everywhere else in English, say the /h/!" },
  { id: "g-lk", g: "lk / lf / lm", type: "silent", sounds: [["k", "talk"], ["f", "half"], ["m", "calm"]], words: ["talk", "walk", "half", "calf", "calm"], sentence: "Walk calmly and talk about the calf.", note: "The l is silent in talk, walk, half, calf, calm, palm, could, should, would." },
  { id: "g-bt", g: "bt / st", type: "silent", sounds: [["t", "doubt"], ["s", "listen"]], words: ["doubt", "debt", "listen", "castle", "whistle"], sentence: "Listen to the whistle at the castle, no doubt.", note: "Silent b (doubt, debt) and silent t (listen, castle, whistle, often)." },
];

export const graphemeById = Object.fromEntries(GRAPHEMES.map((g) => [g.id, g]));
