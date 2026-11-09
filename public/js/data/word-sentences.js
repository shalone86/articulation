// A practice sentence for each practice word, so the sentence always has the word being practiced.
// A card's own sentence (packed with its sound) is used when it already has the word; otherwise
// the one here. Short, everyday, and easy to picture. test/sentences.test.js checks every word has one.

export const WORD_SENTENCES = {
  // p
  pig: "The pink pig played in the mud.", pen: "Please pass me the purple pen.", park: "We played at the park all afternoon.",
  pie: "Grandpa baked an apple pie.", apple: "Pick a shiny apple from the tree.", happy: "The puppy is happy to see you.",
  open: "Please open the door for Pam.", map: "Point to our town on the map.", soap: "Wash your paws with soap, puppy!",
  jump: "Can you jump over the puddle?",
  // b
  bee: "A busy bee buzzed by the flowers.", bus: "Ben rides the big yellow bus.", boat: "The boat bobbed on the blue lake.",
  rabbit: "The brown rabbit hopped behind the bush.", robot: "My robot can beep and blink.", table: "Put the bowls on the table.",
  tub: "The baby splashed in the tub.", web: "A spider built a web by the barn.", crab: "A little crab hid in the sand.",
  cab: "We took a cab to the big building.",
  // t
  tent: "We slept in a tent under the stars.", top: "The cat sat on top of the tower.", toe: "Ouch, I stubbed my toe!",
  ten: "Tom counted to ten.", little: "A little turtle sat on a log.", kitten: "The kitten took a tiny nap.",
  water: "Drink a cup of water.", after: "We eat treats after dinner.", cat: "The cat sat on the mat.",
  hat: "Tess wore a tall hat.", eight: "The octopus has eight arms.",
  // d
  duck: "The duck dived into the pond.", door: "Dad painted the door red.", day: "Today is a sunny day.",
  ladder: "Dan climbed the ladder to the roof.", under: "The dog hid under the bed.", spider: "A spider dangled from a thread.",
  window: "Look out the window at the birds.", bed: "It's time to go to bed.", red: "Dora has a red wagon.",
  food: "The dog ate all his food.", played: "We played tag outside.",
  // k
  key: "Keep the key in your pocket.", kite: "The kite flew up high.", cookie: "Can I have a cookie, please?",
  monkey: "The monkey climbed the coconut tree.", pocket: "I keep a rock in my pocket.", bacon: "We cooked bacon for breakfast.",
  book: "Let's read a book together.", bike: "Kate can ride her bike.", rock: "Kick the rock down the creek.",
  // g
  girl: "The girl giggled at the goat.", game: "Let's play a game of tag.", go: "Ready, set, go!",
  tiger: "The tiger has orange and black stripes.", wagon: "Gus pulled the green wagon.", sugar: "Grandma put sugar in the tea.",
  finger: "Point your finger at the goose.", bag: "Put the grapes in the bag.", dog: "The dog dug a hole in the garden.",
  egg: "The hen laid a big egg.",
  // f
  fan: "Turn on the fan, it's hot!", phone: "Mom's phone is ringing.", four: "A table has four legs.",
  coffee: "Dad drinks coffee in the morning.", elephant: "The elephant flapped its floppy ears.", muffin: "I had a muffin for breakfast.",
  sofa: "The cat fell asleep on the sofa.", leaf: "A leaf fell from the tree.", off: "Please turn off the light.",
  laugh: "Funny faces make me laugh.", knife: "Use a butter knife to spread the jam.",
  // v
  van: "We packed the van for vacation.", vest: "Vince wore a warm vest.", vote: "Let's vote on a movie.",
  river: "We saw a beaver by the river.", oven: "The bread is baking in the oven.", TV: "We watched TV after dinner.",
  five: "I have five fingers on each hand.", love: "I love you very much.", glove: "I lost one glove in the snow.",
  have: "Can I have a turn?",
  // th (quiet)
  thumb: "Give me a thumbs up with your thumb!", thank: "Thank you for the gift.", birthday: "Happy birthday to you!",
  nothing: "There is nothing in the box.", bathtub: "The bathtub is full of bubbles.", author: "The author wrote three books.",
  bath: "The baby had a warm bath.", mouth: "Open your mouth wide.", tooth: "Theo lost his first tooth.",
  math: "We did math at the table.",
  // th (buzzy)
  they: "They went to the park together.", weather: "The weather is nice today.", breathe: "Take a deep breath and breathe out slowly.",
  smooth: "This stone is smooth.", bathe: "We bathe the dog on Saturday.", with: "Come and play with me.",
  // s
  sit: "Sit on the soft seat.", city: "The city has tall buildings.", pencil: "Sam needs a sharp pencil.",
  missing: "One sock is missing.", baseball: "Sally hit the baseball.", glasses: "Grandpa wears glasses to read.",
  house: "Our house has a red door.", ice: "Put some ice in the glass.", yes: "Yes, you may have a snack.",
  // z
  zip: "Zip up your coat.", zero: "Zero comes before one.", busy: "The bees are busy today.",
  puzzle: "Zoe finished the puzzle.", music: "We dance to the music.", buzz: "Bees buzz in the garden.",
  nose: "The clown has a red nose.", cheese: "Mice love cheese.", dogs: "The dogs ran in the yard.",
  // sh
  ship: "The ship sailed across the sea.", shoe: "Tie your shoe, please.", sheep: "The sheep says baa.",
  fishing: "We went fishing at the lake.", washing: "Dad is washing the dishes.", ocean: "Shells wash up from the ocean.",
  station: "The train stopped at the station.", fish: "A fish swam in the bowl.", brush: "Brush your teeth before bed.",
  wash: "Wash your hands with soap.", push: "Push me on the swing!",
  // zh
  genre: "My favorite genre of book is mystery.", vision: "Glasses help your vision.", usual: "We ate lunch at the usual time.",
  beige: "The couch is beige.", garage: "The car is in the garage.", massage: "A back massage feels nice.",
  // h
  hello: "Say hello to Grandma.", ahead: "Go ahead and have a cookie.", perhaps: "Perhaps it will rain today.",
  rehearse: "The choir will rehearse after Mass.",
  // ch
  chair: "Sit on the chair, please.", chin: "Charlie has jam on his chin.", kitchen: "Mom is cooking in the kitchen.",
  teacher: "The teacher read us a story.", picture: "Draw a picture of your family.", nature: "We took a nature walk.",
  watch: "Watch the bird fly away.", beach: "We built a sandcastle at the beach.", match: "Find the socks that match.",
  // j
  jam: "I like jam on my toast.", magic: "The magic trick made us gasp.", pajamas: "Put on your pajamas.",
  angel: "Your guardian angel is always near.", soldier: "The toy soldier stood tall.", page: "Turn the page, please.",
  bridge: "We walked across the bridge.", cage: "The bird sang in its cage.",
  // m
  moon: "The moon is bright tonight.", mouse: "A mouse nibbled the cheese.", hammer: "Mom used a hammer to fix the shelf.",
  lemon: "The lemon tastes sour.", summer: "We swim every summer.", camel: "The camel has a big hump.",
  home: "Let's go home.", drum: "Max played the drum.", ham: "We had ham sandwiches.", lamb: "The little lamb followed Mary.",
  // n
  nest: "The bird sat on its nest.", knee: "Nina scraped her knee.", dinner: "Dinner is ready!",
  banana: "Nan peeled a banana.", penny: "I found a shiny penny.", money: "Put your money in the bank.",
  sun: "The sun is shining.", rain: "The rain fell all night.",
  // ng
  ring: "The ring is gold.", singer: "The singer sang a long song.", jungle: "Monkeys swing in the jungle.",
  sing: "Let's sing a song.", running: "The dog is running fast.",
  // l
  lion: "The lion has a long mane.", lamp: "Turn on the lamp.", balloon: "Lily let go of her yellow balloon.",
  jelly: "Peanut butter and jelly, please.", color: "What color is the leaf?", ball: "Throw the ball to Liam.",
  bell: "The church bell rang loudly.", school: "We walk to school.",
  // r
  carrot: "The rabbit ate a carrot.", orange: "Rosie peeled an orange.", parrot: "The parrot can talk.",
  car: "The red car raced around the track.", star: "Look at that bright star!",
  // w
  one: "I have one red apple.", sandwich: "Will you share your sandwich?", away: "The bird flew away.",
  flower: "Wendy picked a white flower.", quiet: "Please be quiet, the baby is sleeping.",
  // y
  "yo-yo": "Yasmin can do tricks with her yo-yo.", onion: "Chop the onion for the soup.", lawyer: "The lawyer went to court.",
  kayak: "We paddled the yellow kayak.", canyon: "We yelled into the canyon.",
  // short vowels
  hand: "Raise your hand.", man: "The man waved at us.", sad: "The puppy looks sad.",
  bread: "Spread butter on the bread.", friend: "My friend sat next to me.", said: "Ed said hello.",
  head: "Put a hat on your head.", gym: "We ran in the gym.", build: "Let's build a fort.",
  sock: "My sock has a hole.", stop: "Stop at the red light.", box: "The fox hid in the box.",
  father: "Father read us a story.", clock: "The clock says six o'clock.", cup: "Fill the cup up.",
  blood: "A doctor checks your blood.", touch: "Touch your toes.", foot: "Put your foot in the boot.",
  put: "Put the book back.", wood: "The table is made of wood.", could: "Could you help me, please?",
  about: "Tell me about your day.", camera: "Smile for the camera!",
  // long vowels
  eat: "Let's eat some peas.", field: "Sheep eat grass in the field.", me: "Please read to me.",
  pizza: "We each ate a slice of pizza.", cake: "We ate cake at the party.", baby: "The baby is asleep.",
  great: "You did a great job!", play: "Let's play outside today.", light: "Turn on the light.",
  buy: "Let's buy some milk.", time: "What time is it?", road: "Don't play on the road.",
  old: "The old oak tree is tall.", soup: "The soup is hot.", fruit: "Fruit is a good snack.",
  new: "I have new shoes.", two: "I have two hands.", cube: "Put an ice cube in my drink.",
  unicorn: "The unicorn has one horn.", talk: "Let's talk about it.", sauce: "Pour sauce on the pasta.",
  caught: "Paul caught the ball.", long: "That is a long snake.",
  // diphthongs
  now: "Let's go now.", cloud: "A cloud is in the sky.", oil: "Fry the eggs in oil.",
  noise: "What's that noise?", enjoy: "Enjoy your lunch!", point: "Point to the boy.", soil: "Plant the seeds in the soil.",
  // r-vowels
  her: "Give the book to her.", turn: "It's your turn.", word: "Say the word slowly.", learn: "We learn something new every day.",
  nurse: "The nurse helped the girl.", shirt: "Kurt has a blue shirt.", heart: "I love you with all my heart.",
  arm: "Raise your arm up high.", jar: "The cookies are in the jar.", farm: "Cows live on the farm.",
  garden: "Carla planted a garden.", corn: "We ate corn on the cob.", horse: "The horse ran across the field.",
  more: "Can I have more, please?", board: "Write it on the board.", warm: "The blanket is warm.",
  care: "Take care of your pets.", where: "Where are my shoes?", their: "The kids grabbed their coats.",
  pear: "A ripe pear is sweet.", stairs: "Walk up the stairs.", ear: "Whisper in my ear.",
  cheer: "Cheer for the team!", beard: "Grandpa has a white beard.", clear: "The water is clear.",
  cure: "Rest can help cure a cold.", jury: "The jury listened carefully.", poor: "We share food with the poor.",
  mature: "That tomato is mature and red.",
  // spellings
  chip: "Chip ate a potato chip.", thin: "The book is thin.", mother: "My mother made lunch.", three: "Three little birds sat on the fence.",
  when: "When is lunch?", who: "Who is at the door?", graph: "We made a graph of our pets.",
  back: "Come back soon!", chicken: "The chicken laid an egg.", tough: "This meat is tough to chew.",
  night: "Good night, sleep tight.", square: "Draw a square.", quilt: "Grandma sewed a quilt.",
  think: "I think it will snow.", bank: "Put your coins in the bank.", fox: "The fox is quick.",
  exam: "She studied for her exam.", itch: "This sweater makes me itch.", badge: "The scout earned a badge.",
  right: "Turn right at the corner.", fight: "Use kind words, don't fight.", near: "The park is near our house.",
  hair: "Brush your hair.", fair: "Let's take turns, that's fair.", steer: "Steer the boat to the shore.",
  peer: "Peer through the window.", sheer: "The curtains are sheer.", scare: "Don't scare the cat!",
  bare: "Don't walk on the ice in bare feet.", snore: "Dad's snore is loud.", your: "Is this your hat?",
  hour: "We waited one hour.", roar: "The lion let out a roar.", soar: "Eagles soar in the sky.",
  oar: "Row the boat with the oar.", weigh: "Let's weigh the pumpkin.", sleigh: "Santa rode in a sleigh.",
  weight: "What is the weight of the bag?", bought: "We bought apples at the store.", cough: "Cover your cough.",
  taught: "Mom taught me to ride a bike.", naughty: "The naughty puppy chewed my shoe.",
  snail: "A snail moves slowly.", paint: "Let's paint a rainbow.", say: "What did you say?",
  tray: "Put the cups on the tray.", tree: "The tree is green.", see: "I see a bee.",
  feet: "Wipe your feet on the mat.", tie: "Can you tie your shoe?", receive: "Did you receive my letter?",
  vein: "A vein carries blood.", grey: "The sky is grey today.", hoe: "Use the hoe in the garden.",
  canoe: "We paddled the canoe.", snow: "The snow is cold.", out: "Let's go out and play.",
  rescue: "The firefighter came to the rescue.", chew: "Chew your food slowly.", guitar: "Dad plays the guitar.",
  boil: "Boil the water for tea.", joy: "Christmas fills us with joy.", autumn: "The leaves fall in autumn.",
  pause: "Pause the movie, please.", yawn: "I yawn when I'm sleepy.", palm: "Hold the seed in your palm.",
  name: "What is your name?", plate: "Put the cake on a plate.", theme: "The party theme is space.",
  complete: "The puzzle is complete.", eve: "We go to Mass on Christmas Eve.", rope: "Hold on to the rope.",
  stone: "Skip a stone on the pond.", rule: "Follow the rule.", fern: "A fern grows in the shade.",
  bird: "A bird sang on the branch.", burn: "Don't burn the toast.", storm: "The storm was loud.",
  knock: "Knock on the door.", know: "I know the answer.", wrap: "Wrap the present.",
  wren: "A little wren built a nest.", design: "Design your own card.", foreign: "We visited a foreign land.",
  climb: "Let's climb the hill.", comb: "Comb your hair.", bomb: "The bath bomb fizzed in the tub.",
  honor: "Honor your father and mother.", ghost: "He dressed up as a ghost.", half: "Cut the apple in half.",
  calm: "The lake is calm.", debt: "He paid back his debt.",
};

/** The sentence to practice for a word on a card: the card's own when it has the word, else the word's. */
export function sentenceFor(card, word) {
  const has = (s) => s && new RegExp(`(^|[^a-z])${word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z])`, "i").test(s);
  if (has(card.sentence)) return card.sentence;
  return WORD_SENTENCES[word] ?? WORD_SENTENCES[word.toLowerCase()] ?? card.sentence ?? "";
}
