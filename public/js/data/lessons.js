// "Learn" lessons: the ideas behind the sounds.
//
// Each section can carry:
//   html     explanation (trusted, authored here)
//   words    single words with a play button
//   pairs    minimal pairs with "hear both" buttons
//   cards    links to phoneme/grapheme cards (ids)

export const LESSONS = [
  {
    id: "how-sounds-work",
    title: "How speech sounds are made",
    emoji: "🗣️",
    summary: "Every consonant is described by three things: voice, place, and manner.",
    sections: [
      {
        h: "Three questions for every consonant",
        html: `<ol>
          <li><b>Voice:</b> is your voice box buzzing (voiced) or not (voiceless)?</li>
          <li><b>Place:</b> where does the air get blocked or squeezed? Lips, teeth, tongue tip, roof of the mouth, or throat.</li>
          <li><b>Manner:</b> how is the air blocked? Stopped and popped (plosive), squeezed (fricative), stopped then squeezed (affricate), sent through the nose (nasal), or let flow around the tongue (liquid/glide).</li>
        </ol>
        <p>For example, <b>/p/</b> is voiceless + lips + plosive. <b>/b/</b> is the same but voiced. Change just one of the three, and you get a different sound — and often a different word.</p>`,
      },
      {
        h: "Vowels are different",
        html: `<p>Vowels never block the air. They are shaped by three things: how <b>high</b> your tongue is (jaw open or closed), how <b>far forward</b> your tongue is, and whether your <b>lips are round</b>. Some vowels <b>glide</b> from one shape to another — these are called <b>diphthongs</b> (the long a in “cake” glides from “eh” to “ee”).</p>
        <p>English has about 15 vowel sounds (plus r-colored ones), but only 5 vowel letters. That’s why vowels have so many spellings!</p>`,
        cards: ["short-a", "long-a", "short-i", "long-e"],
      },
      {
        h: "Practice tools you already have",
        html: `<ul>
          <li><b>A mirror</b> — see your lips and tongue.</li>
          <li><b>Your hand on your throat</b> — feel your voice turn on and off.</li>
          <li><b>A tissue or your palm in front of your lips</b> — feel puffs of air.</li>
          <li><b>Pinching your nose</b> — nasal sounds (m, n, ng) stop; all others keep going.</li>
          <li><b>Recording yourself</b> — that’s what the flip cards are for!</li>
        </ul>`,
      },
    ],
  },
  {
    id: "voicing",
    title: "Voiced vs. voiceless",
    emoji: "🐝",
    summary: "Many English sounds come in pairs that only differ by whether your voice buzzes.",
    sections: [
      {
        h: "The throat test",
        html: `<p>Put your fingers on the front of your throat and say a long <b>“sssss”</b>, then a long <b>“zzzzz”</b>. Feel the buzz on /z/? That buzz is your vocal folds vibrating. Sounds with the buzz are <b>voiced</b>; sounds without it are <b>voiceless</b>.</p>
        <p>Try it with <b>ffff / vvvv</b> and the quiet <b>thhh</b> (thin) / buzzy <b>thhh</b> (this).</p>`,
      },
      {
        h: "The voicing pairs",
        html: `<table class="pairs-table">
          <tr><th>Voiceless</th><th>Voiced</th></tr>
          <tr><td>p (pig)</td><td>b (big)</td></tr>
          <tr><td>t (ten)</td><td>d (den)</td></tr>
          <tr><td>k (coat)</td><td>g (goat)</td></tr>
          <tr><td>f (fan)</td><td>v (van)</td></tr>
          <tr><td>θ (thigh)</td><td>ð (thy)</td></tr>
          <tr><td>s (sue)</td><td>z (zoo)</td></tr>
          <tr><td>ʃ (pressure)</td><td>ʒ (pleasure)</td></tr>
          <tr><td>tʃ (chin)</td><td>dʒ (gin)</td></tr>
        </table>
        <p>All vowels, and m, n, ng, l, r, w, y, are voiced. /h/ is voiceless — it’s just breath.</p>`,
        pairs: [["pig", "big"], ["coat", "goat"], ["fan", "van"], ["sue", "zoo"], ["chin", "gin"]],
      },
      {
        h: "The secret at the end of words",
        html: `<p>At the end of a word, English speakers often don’t buzz very much on /b d g v z/. So how do listeners tell “bed” from “bet”? <b>The vowel is longer before a voiced consonant.</b></p>
        <p>Say <b>“bed”</b> slowly and stretch the e: <i>beeeed</i>. Say <b>“bet”</b> and cut it short: <i>bet!</i> This length difference is one of the most useful tricks for clear English.</p>`,
        pairs: [["bed", "bet"], ["bag", "back"], ["prize", "price"], ["leave", "leaf"], ["card", "cart"]],
      },
    ],
  },
  {
    id: "plosives",
    title: "Plosives (stops)",
    emoji: "💥",
    summary: "p, b, t, d, k, g — block the air completely, then pop it out.",
    sections: [
      {
        h: "What a plosive is",
        html: `<p>A plosive has three steps: <b>close</b> (lips or tongue block the air), <b>hold</b> (air pressure builds up), and <b>release</b> (pop!). You can’t stretch a plosive — try saying “pppppp”. You can only repeat it.</p>
        <ul><li><b>Lips:</b> p, b</li><li><b>Tongue tip on the gum ridge:</b> t, d</li><li><b>Back of the tongue on the soft palate:</b> k, g</li></ul>`,
        cards: ["p", "b", "t", "d", "k", "g"],
      },
      {
        h: "Aspiration — the puff of air",
        html: `<p>When <b>p, t, k</b> start a stressed syllable in English, they come with a strong puff of air (aspiration). Hold a tissue in front of your mouth and say <b>“pie”</b> — it should flutter. Say <b>“buy”</b> — it shouldn’t.</p>
        <p>Many languages (Spanish, French, Italian, Russian, Tagalog, and others) have no puff, so their /p/ sounds like an English /b/ to American ears: “pig” is heard as “big”. Adding the puff fixes it.</p>
        <p>After /s/ there’s no puff: compare <b>pin</b> (puff) and <b>spin</b> (no puff).</p>`,
        pairs: [["pie", "buy"], ["tie", "die"], ["cold", "gold"]],
        words: ["pin", "spin", "top", "stop", "kit", "skit"],
      },
      {
        h: "Stops at the end of words",
        html: `<p>At the end of a word, American speakers often close for a stop but don’t pop it loudly (“ca<sup>t</sup>”). That’s fine — <b>but the stop must still be there</b>. Your lips or tongue need to close. If you skip it, “cat” becomes “ca”.</p>
        <p>Speakers of Mandarin, Cantonese, Vietnamese, Thai and Korean often have unreleased or missing final stops. Speakers of German, Russian, Polish, Turkish and Dutch turn final b, d, g into p, t, k (“dog” → “dock”). Practice ending words clearly.</p>`,
        pairs: [["cap", "cab"], ["bat", "bad"], ["back", "bag"]],
      },
      {
        h: "The American T",
        html: `<p>In American English, t (and d) between vowels often becomes a quick <b>tap</b>, almost like a soft d: <b>water</b> (“wadder”), <b>butter</b>, <b>city</b>, <b>little</b>. And before “n”, t is often stopped in the throat: <b>button</b>, <b>mountain</b>. Both are normal American pronunciation; a clear /t/ is fine too.</p>`,
        words: ["water", "butter", "city", "little", "button"],
      },
    ],
  },
  {
    id: "fricatives",
    title: "Fricatives",
    emoji: "🌬️",
    summary: "f, v, th, s, z, sh, zh, h — squeeze the air through a narrow gap to make friction.",
    sections: [
      {
        h: "What a fricative is",
        html: `<p>For a fricative, you make a <b>narrow gap</b> and push air through it, making a hissing or buzzing noise. Unlike plosives, <b>you can stretch them</b>: ffffff, ssssss, shhhhh.</p>
        <ul>
          <li><b>Top teeth on bottom lip:</b> f, v</li>
          <li><b>Tongue between the teeth:</b> θ (thin), ð (this)</li>
          <li><b>Tongue tip near the gum ridge:</b> s, z</li>
          <li><b>Tongue further back, lips round:</b> ʃ (ship), ʒ (treasure)</li>
          <li><b>Open throat:</b> h</li>
        </ul>`,
        cards: ["f", "v", "th-voiceless", "th-voiced", "s", "z", "sh", "zh", "h"],
      },
      {
        h: "Don’t stop the air!",
        html: `<p>The most common fricative mistake is turning it into a stop: <b>th → t/d</b> (“tink” for think, “dis” for this), <b>v → b</b> (“berry” for very), <b>f → p</b> (“pan” for fan). Fix: <b>make it long first</b>. Say “thhhhhink”, “vvvvery”, “ffffan”, then shorten it bit by bit.</p>
        <p>Kids do this too — it’s called <b>stopping</b> (“tun” for sun) and is normal in young children.</p>`,
        pairs: [["think", "tink"], ["very", "berry"], ["fan", "pan"], ["sun", "ton"]],
      },
      {
        h: "Wrong place",
        html: `<p>The other common swap is keeping the hiss but moving the tongue: <b>th → s</b> (“sink” for think), <b>th → f</b> (“free” for three), <b>sh → s</b> (“sip” for ship). Use a mirror: for th you should see the tip of your tongue; for sh your lips should push forward.</p>`,
        pairs: [["think", "sink"], ["three", "free"], ["ship", "sip"], ["mouth", "mouse"]],
      },
    ],
  },
  {
    id: "affricates",
    title: "Affricates",
    emoji: "🚂",
    summary: "ch and j — a stop and a fricative glued together.",
    sections: [
      {
        h: "Stop + hiss",
        html: `<p>An affricate starts like a plosive (tongue touching, air stopped) and releases into a fricative. <b>ch = t + sh</b>, <b>j = d + zh</b>. Say “t-sh, t-sh, tsh, ch!”</p>
        <p>The stop at the start is what makes <b>chip</b> different from <b>ship</b>, and <b>jet</b> different from <b>yet</b>.</p>`,
        cards: ["ch", "j"],
        pairs: [["chip", "ship"], ["cheap", "sheep"], ["jet", "yet"], ["jello", "yellow"], ["watch", "wash"]],
      },
    ],
  },
  {
    id: "nasals",
    title: "Nasals",
    emoji: "👃",
    summary: "m, n, ng — the air goes out through your nose.",
    sections: [
      {
        h: "The pinch test",
        html: `<p>For m, n and ng, your mouth is blocked and all the air goes out through your nose. Pinch your nose while saying “mmmm” — the sound stops! Try it with “ssss” — it keeps going.</p>
        <ul><li><b>m:</b> lips closed</li><li><b>n:</b> tongue tip on the gum ridge</li><li><b>ng:</b> back of the tongue on the soft palate</li></ul>`,
        cards: ["m", "n", "ng"],
      },
      {
        h: "The -ng ending",
        html: `<p>In “sing”, there’s no /g/ or /k/ at the end — just the hum. A common pattern for speakers of Polish, Russian, Spanish, Arabic and others is to add a click at the end (“sing-g” or “sink”). Hold the hum and let it fade: <i>siiiing~</i>.</p>
        <p>In words like <b>finger</b> and <b>longer</b> you do hear a /g/; in <b>singer</b> you don’t. In <b>think</b> and <b>bank</b>, the n says /ŋ/ and is followed by /k/.</p>`,
        pairs: [["sing", "sink"], ["thing", "think"], ["sing", "sin"], ["bang", "bank"]],
      },
    ],
  },
  {
    id: "liquids-glides",
    title: "Liquids & glides: l, r, w, y",
    emoji: "🌊",
    summary: "Smooth, vowel-like consonants — and the famous r/l challenge.",
    sections: [
      {
        h: "L vs. R",
        html: `<p><b>L:</b> tongue tip <i>touches</i> the gum ridge; air flows around the sides.<br><b>R:</b> tongue tip <i>touches nothing</i> — pull your tongue back, curl or bunch it, sides touch your back teeth, lips a little round.</p>
        <p>Japanese, Korean, Cantonese and Thai speakers often find this pair hard because their languages have one sound in this space. Practice by holding each: <i>lllll</i> (touch!) vs <i>rrrrr</i> (no touch).</p>`,
        cards: ["l", "r"],
        pairs: [["light", "right"], ["lock", "rock"], ["glass", "grass"], ["fly", "fry"], ["collect", "correct"]],
      },
      {
        h: "Glides",
        html: `<p><b>W</b> starts from “oo” (round lips) and <b>Y</b> starts from “ee”. They glide quickly into the next vowel. Teeth never touch the lip for W (that’s V).</p>`,
        cards: ["w", "y"],
        pairs: [["west", "vest"], ["wine", "vine"], ["yet", "jet"], ["year", "ear"]],
      },
      {
        h: "Gliding in kids",
        html: `<p>Young children often replace r and l with w or y: <b>“wabbit”</b> for rabbit, <b>“yeyo”</b> for yellow. This is called <b>gliding</b>, and it’s one of the last patterns to go away (often around age 5–7 for r). If it continues past about age 8, a speech-language pathologist can help.</p>`,
        pairs: [["rabbit", "wabbit"], ["red", "wed"], ["ring", "wing"]],
      },
    ],
  },
  {
    id: "h-sound",
    title: "The H sound",
    emoji: "🌫️",
    summary: "Dropped h, added h, scratchy h — and the few words where h really is silent.",
    sections: [
      {
        h: "H is just breath",
        html: `<p>/h/ is the softest consonant in English: open your mouth for the next vowel and breathe out, like fogging a mirror. It is <b>voiceless</b> — there’s no buzz and no scratch.</p>
        <p>Hold your hand in front of your mouth. You should feel warm air on <b>“hat”</b> but not on <b>“at”</b>.</p>`,
        pairs: [["hat", "at"], ["heat", "eat"], ["hair", "air"], ["hold", "old"], ["hear", "ear"]],
      },
      {
        h: "Dropping H",
        html: `<p>In French, Italian and Portuguese, the letter h is silent, so learners often drop it: “I ’ave an ’ouse”. Then “hair” sounds like “air” and “heat” like “eat”. Practice by exaggerating the breath at first: <i>hhhhat</i>.</p>`,
      },
      {
        h: "Adding H",
        html: `<p>Once learners know about h-dropping, some start adding h where it doesn’t belong: “h-I h-eat h-eggs”. This is called <b>hypercorrection</b>. Only breathe out on words spelled with h.</p>`,
      },
      {
        h: "A scratchy H",
        html: `<p>Speakers of Spanish (j), Russian (х), Polish (ch), Arabic (خ), Farsi (kh) and Mandarin (h) may use a scratchy sound made at the back of the mouth. English /h/ is much softer — no tongue involved, just air.</p>`,
        words: ["hello", "happy", "house", "who", "behind"],
      },
      {
        h: "The truly silent H",
        html: `<p>A handful of words borrowed from French keep a silent h: <b>hour, honest, honor, heir</b> (and their family: hourly, honesty). That’s why we say “<b>an</b> hour” but “<b>a</b> house”. Also, h is silent after some letters: <b>ghost, rhyme, school</b>. In fast speech, the h in <i>he, his, him, her, have</i> is often dropped in the middle of a sentence (“tell ’im”) — that’s natural, not an error.</p>`,
        words: ["hour", "honest", "honor", "heir"],
      },
    ],
  },
  {
    id: "final-consonants",
    title: "Word endings: voicing, dropping, and extra sounds",
    emoji: "🔚",
    summary: "Many ESL patterns happen at the end of the word: devoicing, dropping, and adding vowels or k’s.",
    sections: [
      {
        h: "Final devoicing (dog → dock)",
        html: `<p>In German, Russian, Ukrainian, Polish, Turkish, Dutch and Czech, voiced consonants at the end of a word automatically become voiceless. So English words change: <b>dog → dock</b>, <b>bed → bet</b>, <b>leave → leaf</b>, <b>eyes → ice</b>, <b>badge → batch</b>.</p>
        <p>Fix: <b>stretch the vowel</b> before the final sound (doooog) and keep your voice buzzing through to the end.</p>`,
        pairs: [["dog", "dock"], ["bed", "bet"], ["leave", "leaf"], ["eyes", "ice"], ["badge", "batch"], ["prize", "price"]],
      },
      {
        h: "Dropping final consonants (cat → ca)",
        html: `<p>Mandarin, Cantonese, Vietnamese, Thai and Korean have few or no consonants at the end of syllables (or they’re not released), and Spanish allows only a few. Learners may drop or blur the end of the word: <b>“ca”</b> for cat, <b>“fi”</b> for five, <b>“tes”</b> for test.</p>
        <p>This matters a lot in English, because grammar lives at the end of the word: <b>walk → walked</b>, <b>cat → cats</b>. Practice by tapping your finger on the final sound.</p>
        <p>Young children do this too (“ba” for ball) — it’s called <b>final consonant deletion</b> and usually goes away by about age 3.</p>`,
        words: ["cat", "five", "test", "walked", "cats", "hand"],
      },
      {
        h: "Adding a vowel (big → bigu)",
        html: `<p>Japanese, Korean, Italian and Brazilian Portuguese prefer words that end in a vowel, so speakers may add one: <b>“bigu”</b>, <b>“bed-o”</b>, <b>“think-u”</b>, <b>“bookie”</b> for book. This can change the number of syllables and the rhythm. Close the final consonant and stop — no extra puff of voice.</p>`,
        words: ["big", "bed", "book", "think", "milk"],
      },
      {
        h: "Adding a K or G (sing → sink)",
        html: `<p>For speakers of Polish, Russian, Spanish, Arabic, Hindi and others, the “-ng” at the end of words often comes out with an extra click: <b>sing → “sink”</b> or <b>“sing-g”</b>, <b>going → “goink”</b>. In English, -ng is <i>only</i> a hum through the nose. Hold it and let it fade.</p>`,
        pairs: [["sing", "sink"], ["thing", "think"], ["wing", "wink"], ["rang", "rank"]],
      },
    ],
  },
  {
    id: "endings-ed-s",
    title: "The -ed and -s endings",
    emoji: "➕",
    summary: "Each ending has three pronunciations, chosen by the sound before it.",
    sections: [
      {
        h: "-ed: /t/, /d/, or /ɪd/",
        html: `<ul>
          <li>After a <b>voiceless</b> sound (p, k, f, s, sh, ch): <b>/t/</b> — walked (walkt), jumped, laughed, kissed, washed.</li>
          <li>After a <b>voiced</b> sound (vowels, b, g, v, z, m, n, l, r…): <b>/d/</b> — played, cleaned, smiled, loved.</li>
          <li>After <b>t or d</b>: <b>/ɪd/</b> (an extra syllable) — wanted, needed, started.</li>
        </ul>
        <p>Common error: adding a syllable to every -ed (“walk-ed”). Only t/d words get the extra syllable!</p>`,
        words: ["walked", "jumped", "played", "cleaned", "wanted", "needed"],
      },
      {
        h: "-s: /s/, /z/, or /ɪz/",
        html: `<ul>
          <li>After a <b>voiceless</b> sound (p, t, k, f, θ): <b>/s/</b> — cats, books, cups.</li>
          <li>After a <b>voiced</b> sound: <b>/z/</b> — dogs, bees, cars, runs.</li>
          <li>After <b>s, z, sh, ch, j, zh</b>: <b>/ɪz/</b> (an extra syllable) — buses, roses, wishes, watches, pages.</li>
        </ul>`,
        words: ["cats", "books", "dogs", "cars", "buses", "watches"],
      },
    ],
  },
  {
    id: "th-sounds",
    title: "The two TH sounds",
    emoji: "👅",
    summary: "Quiet th (think) and buzzy th (this) — rare in other languages, common in English.",
    sections: [
      {
        h: "Tongue out!",
        html: `<p>Both th sounds are made with the tip of your tongue <b>between your teeth</b> (or touching the back of your top teeth). Blow air gently over it. Use a mirror — you should see your tongue tip.</p>
        <p><b>Quiet /θ/:</b> think, three, bath, mouth. <b>Buzzy /ð/:</b> the, this, that, they, mother, with.</p>`,
        cards: ["th-voiceless", "th-voiced"],
      },
      {
        h: "What it turns into",
        html: `<p>Depending on the first language, th often becomes /s/ /z/ (French, German, Japanese, Mandarin), /t/ /d/ (Italian, Hindi, Tagalog, Turkish, Vietnamese, many Spanish speakers), or /f/ /v/ (Cantonese, some Russian and Polish speakers — and young English-speaking kids!).</p>`,
        pairs: [["think", "sink"], ["think", "tink"], ["three", "free"], ["three", "tree"], ["they", "day"], ["then", "zen"]],
      },
    ],
  },
  {
    id: "v-w-b",
    title: "V, W and B",
    emoji: "🚐",
    summary: "Three sounds that get mixed up in Spanish, German, Hindi, Korean, Japanese and more.",
    sections: [
      {
        h: "Three mouth shapes",
        html: `<ul>
          <li><b>B:</b> both lips close completely, then pop.</li>
          <li><b>V:</b> top teeth rest on the bottom lip, voice buzzes, air keeps flowing.</li>
          <li><b>W:</b> lips make a round “oo” shape, no teeth, then glide open.</li>
        </ul>
        <p>Look in a mirror: B = lips together, V = teeth showing on lip, W = small round circle.</p>`,
        cards: ["b", "v", "w"],
        pairs: [["berry", "very"], ["best", "vest"], ["vest", "west"], ["vine", "wine"], ["boat", "vote"]],
      },
    ],
  },
  {
    id: "vowel-length",
    title: "Short vs. long vowels",
    emoji: "📏",
    summary: "ship/sheep, full/fool, bed/bad — English has more vowels than most languages.",
    sections: [
      {
        h: "Tense and lax",
        html: `<p>English has pairs of vowels where one is <b>tense</b> (lips and tongue tight, longer) and one is <b>lax</b> (relaxed, shorter):</p>
        <ul><li><b>sheep</b> (tight smile) vs <b>ship</b> (relaxed)</li><li><b>fool</b> (tight round lips) vs <b>full</b> (loose lips)</li></ul>
        <p>Many languages (Spanish, Italian, Japanese, Greek, Arabic, Mandarin…) have only five vowels, so these pairs sound the same to learners at first. Listening practice helps a lot — try the Minimal Pairs game.</p>`,
        pairs: [["sheep", "ship"], ["seat", "sit"], ["leave", "live"], ["fool", "full"], ["pool", "pull"]],
      },
      {
        h: "The open vowels",
        html: `<p>Four more vowels crowd into the open-mouth space: <b>bat</b> /æ/ (wide, spread), <b>bet</b> /ɛ/ (half open), <b>but</b> /ʌ/ (relaxed “uh”), <b>bought/bot</b> /ɑ/ (wide open “ah”).</p>`,
        pairs: [["bad", "bed"], ["cat", "cut"], ["cup", "cop"], ["hat", "hot"]],
      },
      {
        h: "“Long” vowels say their name",
        html: `<p>In phonics, the “long” vowels are the ones that say the letter’s name: A (cake), E (tree), I (kite), O (boat), U (cube). Most of them actually glide (A = eh-ee, I = ah-ee, O = oh-oo, U = y-oo). Don’t say them flat!</p>`,
        cards: ["long-a", "long-e", "long-i", "long-o", "long-u"],
      },
    ],
  },
  {
    id: "schwa-stress",
    title: "Schwa and word stress",
    emoji: "🥁",
    summary: "English rhythm: one strong syllable, the rest squashed into “uh”.",
    sections: [
      {
        h: "Stress",
        html: `<p>Every English word with 2+ syllables has one <b>stressed</b> syllable: it’s <b>longer, louder and higher</b>. Moving stress can change the word: <b>DE</b>sert (sand) vs de<b>SERT</b> (leave), <b>RE</b>cord (noun) vs re<b>CORD</b> (verb).</p>`,
        words: ["banana", "photograph", "photography", "computer", "elephant"],
      },
      {
        h: "Schwa",
        html: `<p>Unstressed vowels usually shrink to <b>schwa /ə/</b> — a tiny, lazy “uh”. It’s the most common sound in English. <b>ba-NA-na</b> is really <b>bə-NA-nə</b>. <b>to-DAY</b> is <b>tə-DAY</b>.</p>
        <p>Speakers of syllable-timed languages (Spanish, Italian, French, Japanese, Tagalog, Hindi, Turkish…) give every syllable a full vowel, which can make English harder to understand even when every sound is right. Squash the weak syllables!</p>`,
        cards: ["schwa"],
      },
      {
        h: "Sentence rhythm",
        html: `<p>The same thing happens in sentences: important words are stressed; small words shrink. “I want <b>to</b> go <b>to</b> the store” → “I <b>WANT</b> tə <b>GO</b> tə thə <b>STORE</b>”. <b>can</b> becomes “kən”, <b>and</b> becomes “ən”, <b>of</b> becomes “əv”.</p>`,
      },
    ],
  },
  {
    id: "clusters",
    title: "Consonant clusters",
    emoji: "🧱",
    summary: "str, spl, -sts — English stacks up to 3 consonants at the start and 4 at the end.",
    sections: [
      {
        h: "Adding a vowel (school → eschool)",
        html: `<p>Spanish, Portuguese, Farsi, Arabic, Hindi/Punjabi and Turkish speakers may add a vowel before <b>s + consonant</b>: “espeak”, “eschool”, “estreet”. Japanese and Korean speakers may add vowels between consonants: “sutoreeto”. Fix: <b>start on the hiss</b>. Hold “sssss” and slide into the next sound: <i>ssss-peak</i>.</p>`,
        words: ["speak", "school", "street", "spring", "strong", "snake"],
      },
      {
        h: "Dropping a consonant (spoon → poon)",
        html: `<p>Young children often simplify clusters: <b>“poon”</b> for spoon, <b>“top”</b> for stop, <b>“bue”</b> for blue. This is called <b>cluster reduction</b> and is normal until around age 4–5 (clusters with s, l, and r can take longer). Adults may also drop the middle of big end-clusters (“tex” for texts) — native speakers do this in fast speech too.</p>`,
        words: ["spoon", "stop", "blue", "tree", "frog", "plant"],
      },
    ],
  },
  {
    id: "homophones",
    title: "Homophones, homographs & minimal pairs",
    emoji: "👯",
    summary: "Words that sound the same, words that look the same, and words that differ by one sound.",
    sections: [
      {
        h: "Homophones: same sound, different word",
        html: `<p><b>Homophones</b> sound exactly the same but have different meanings and (usually) spellings: <b>knight / night</b>, <b>flower / flour</b>, <b>see / sea</b>, <b>their / there / they’re</b>. You can’t tell them apart by sound — only by context.</p>
        <p>In this app, if the speech checker writes a homophone of your word (you said “knight” and it wrote “night”), <b>that counts as correct</b> — you said it right!</p>`,
        pairs: [["knight", "night"], ["flower", "flour"], ["see", "sea"], ["pair", "pear"]],
      },
      {
        h: "Homographs and heteronyms: same spelling",
        html: `<p><b>Homographs</b> are spelled the same. Some sound the same (<b>bat</b> the animal / <b>bat</b> for baseball). Others, called <b>heteronyms</b>, sound different: <b>read</b> (now, “reed”) / <b>read</b> (past, “red”); <b>lead</b> (guide) / <b>lead</b> (metal); <b>wind</b> (air) / <b>wind</b> (turn); <b>tear</b> (crying) / <b>tear</b> (rip); <b>live</b> (verb) / <b>live</b> (adjective).</p>`,
        words: ["read", "red", "lead", "led"],
      },
      {
        h: "Minimal pairs: one sound different",
        html: `<p><b>Minimal pairs</b> are two words that differ by just one sound: <b>ship / sheep</b>, <b>light / right</b>, <b>think / sink</b>. They’re the best way to practice a difficult sound — if you can make a listener hear the difference, you’ve got it. Try the Minimal Pairs game for listening and speaking practice.</p>`,
        pairs: [["ship", "sheep"], ["light", "right"], ["think", "sink"], ["very", "berry"]],
      },
    ],
  },
  {
    id: "spelling-patterns",
    title: "Digraphs, trigraphs & vowel teams",
    emoji: "🔤",
    summary: "Why English needs 250+ spellings for 44 sounds.",
    sections: [
      {
        h: "Letters vs. sounds",
        html: `<p>English has 26 letters but about 44 sounds. So we team letters up:</p>
        <ul>
          <li><b>Digraph:</b> 2 letters, 1 sound — sh, ch, th, ph, ck, ee, oa</li>
          <li><b>Trigraph:</b> 3 letters, 1 sound — tch, dge, igh, air</li>
          <li><b>Quadgraph:</b> 4 letters, 1 sound — eigh, ough</li>
          <li><b>Split digraph (magic e):</b> a_e, i_e, o_e, u_e — the e jumps over a consonant to change the vowel (cap → cape)</li>
          <li><b>Bossy R:</b> ar, er, ir, or, ur — the r changes the vowel</li>
        </ul>
        <p>Open the <b>Spelling Chart</b> to see every way to spell each sound, or practice the digraph and vowel-team decks.</p>`,
      },
      {
        h: "One sound, many spellings",
        html: `<p>The long a sound can be spelled <b>a_e</b> (cake), <b>ai</b> (rain), <b>ay</b> (day), <b>a</b> (baby), <b>eigh</b> (eight), <b>ey</b> (they), <b>ea</b> (great), <b>ei</b> (vein). The /ɝ/ sound in “bird” has at least seven spellings. That’s why reading English aloud is hard, even for native speakers.</p>`,
        words: ["cake", "rain", "day", "eight", "they", "great"],
      },
    ],
  },
  {
    id: "kids-patterns",
    title: "Kids’ speech patterns (for parents)",
    emoji: "🧒",
    summary: "Common, normal patterns as children learn to talk — and when to check with a professional.",
    sections: [
      {
        h: "Typical patterns",
        html: `<table class="pairs-table">
          <tr><th>Pattern</th><th>Example</th><th>Usually gone by about</th></tr>
          <tr><td>Final consonant deletion</td><td>“ca” for cat</td><td>3</td></tr>
          <tr><td>Weak syllable deletion</td><td>“nana” for banana</td><td>4</td></tr>
          <tr><td>Fronting (k, g → t, d)</td><td>“tat” for cat, “do” for go</td><td>3½–4</td></tr>
          <tr><td>Stopping (s, f → t, p)</td><td>“tun” for sun, “pish” for fish</td><td>3–5</td></tr>
          <tr><td>Cluster reduction</td><td>“poon” for spoon</td><td>4–5</td></tr>
          <tr><td>Gliding (r, l → w, y)</td><td>“wabbit”, “yeyo”</td><td>5–7</td></tr>
          <tr><td>th → f / d</td><td>“free” for three, “dat”</td><td>5–7</td></tr>
        </table>
        <p>Ages are rough guides; children vary a lot, and kids learning two languages may follow a different path.</p>`,
      },
      {
        h: "Lisps",
        html: `<p>A <b>frontal lisp</b> (tongue between the teeth on s/z: “thun” for sun) is common in young children. A <b>lateral lisp</b> (a slushy s where air escapes over the sides of the tongue) is not a typical developmental pattern.</p>`,
        cards: ["s", "z"],
      },
      {
        h: "When to talk to a speech-language pathologist",
        html: `<ul>
          <li>Strangers can’t understand most of what a 4-year-old says.</li>
          <li>Patterns continue well past the ages above (for example, r still “w” after age 8).</li>
          <li>A lateral (slushy) lisp at any age.</li>
          <li>Speech is slurred, very slow, or effortful, or a child is frustrated or teased about speech.</li>
          <li>Speech sounds were there before and then were lost.</li>
        </ul>
        <p><b>This app is a practice tool, not a diagnosis or a substitute for a speech-language pathologist.</b></p>`,
      },
    ],
  },
  {
    id: "clear-speech",
    title: "Clear speech: pace, breath & slurring",
    emoji: "🐢",
    summary: "Habits that make every sound clearer, especially for slurred or rushed speech.",
    sections: [
      {
        h: "Slow down",
        html: `<p>Slurred speech often comes from speaking faster than the mouth can move precisely. Try speaking at about <b>half your usual speed</b> while practicing. Tap a finger on the table for each syllable: <i>ba-na-na</i> = three taps.</p>`,
      },
      {
        h: "Over-articulate",
        html: `<p>Exaggerate your mouth movements: open wider, close lips firmly, push the tongue clearly to each spot. It will feel too big — that’s the right amount for practice. Make sure every word has its <b>last sound</b>.</p>`,
      },
      {
        h: "Breathe and phrase",
        html: `<p>Take a breath before you start, and say a short phrase (3–5 words) per breath. Running out of air makes speech mumbly at the end. Practice with the sentence on each card: one breath, then the whole sentence slowly.</p>`,
      },
      {
        h: "When slurring is new or getting worse",
        html: `<p>If slurred speech starts suddenly, it can be a medical emergency (such as a stroke) — call emergency services right away. Slurring that develops over time should be checked by a doctor and a speech-language pathologist.</p>`,
      },
    ],
  },
];

export const lessonById = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
