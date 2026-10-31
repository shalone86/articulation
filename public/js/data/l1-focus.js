// "Start here" suggestions by first language (L1).
//
// sounds:  phoneme ids, most important first — the contrasts that most often make
//          speakers of this language hard to understand in English
// lessons: lesson ids for the habits that come with it (endings, stress, clusters…)
// why:     one plain sentence the learner sees
//
// Based on standard contrastive analyses of each language with English (e.g. Swan &
// Smith, *Learner English*). Individual learners vary; the checkup shows what applies.

export const L1_FOCUS = {
  arabic: {
    why: "Arabic has no p or v and only three vowel qualities, so p/b, f/v and the short vowels need the most work.",
    sounds: ["p", "v", "short-e", "short-o", "ch", "ng"],
    lessons: ["clusters", "vowel-length"],
  },
  cantonese: {
    why: "Cantonese has no th, v or z, r and l are easy to swap, and word endings are easy to drop.",
    sounds: ["th-voiceless", "th-voiced", "v", "r", "l", "z"],
    lessons: ["final-consonants", "clusters"],
  },
  farsi: {
    why: "Farsi v is close to English w, there is no th, and s-clusters tend to get an extra vowel (“eschool”).",
    sounds: ["w", "v", "th-voiceless", "th-voiced", "short-a", "ng"],
    lessons: ["clusters", "v-w-b"],
  },
  french: {
    why: "French h is silent, there is no th or ch, and every syllable gets equal weight.",
    sounds: ["h", "th-voiceless", "th-voiced", "short-i", "ch", "schwa"],
    lessons: ["h-sound", "schwa-stress"],
  },
  german: {
    why: "German swaps w and v, has no th, and turns final b, d, g, z into p, t, k, s.",
    sounds: ["w", "v", "th-voiceless", "th-voiced", "short-a", "j"],
    lessons: ["final-consonants", "v-w-b"],
  },
  greek: {
    why: "Greek has five vowels and no sh or zh, so ship/sheep and s/sh are the usual focus.",
    sounds: ["short-i", "sh", "zh", "short-u", "ch", "schwa"],
    lessons: ["vowel-length", "schwa-stress"],
  },
  hindi: {
    why: "Hindi/Urdu has one sound between v and w, uses a dental t/d for th, and has few z words.",
    sounds: ["v", "w", "th-voiceless", "th-voiced", "z", "short-a"],
    lessons: ["v-w-b", "clusters"],
  },
  italian: {
    why: "Italian h is silent, there are five vowels, and words like to end in a vowel.",
    sounds: ["h", "short-i", "th-voiceless", "schwa", "short-oo", "r"],
    lessons: ["h-sound", "schwa-stress", "final-consonants"],
  },
  japanese: {
    why: "Japanese has one sound between r and l, no th, v or f, and adds vowels after consonants.",
    sounds: ["r", "l", "th-voiceless", "v", "f", "er"],
    lessons: ["liquids-glides", "final-consonants", "clusters"],
  },
  korean: {
    why: "Korean has no f, v, z or th, and its r and l are one sound.",
    sounds: ["f", "v", "r", "l", "z", "th-voiced"],
    lessons: ["liquids-glides", "final-consonants"],
  },
  luganda: {
    why: "Luganda treats r and l as one sound, has no th, ends every word in a vowel, and has fewer vowels than English.",
    sounds: ["r", "l", "th-voiceless", "short-u", "short-i", "er"],
    lessons: ["final-consonants", "clusters", "schwa-stress"],
  },
  mandarin: {
    why: "Mandarin has no th or v, few word-final consonants, and fewer vowel contrasts (ship/sheep).",
    sounds: ["th-voiceless", "th-voiced", "v", "short-i", "n", "r"],
    lessons: ["final-consonants", "vowel-length"],
  },
  polish: {
    why: "Polish has no th, its w sounds like English v, and final consonants lose their voicing.",
    sounds: ["th-voiceless", "th-voiced", "w", "short-a", "ng", "short-i"],
    lessons: ["final-consonants", "v-w-b"],
  },
  portuguese: {
    why: "Portuguese h is silent, ship/sheep tend to merge, and vowels get added around consonants.",
    sounds: ["h", "th-voiceless", "short-i", "r", "l", "schwa"],
    lessons: ["h-sound", "clusters"],
  },
  russian: {
    why: "Russian has no w, h or th, final consonants lose their voicing, and the vowel in “cat” is new.",
    sounds: ["w", "h", "th-voiceless", "th-voiced", "short-a", "ng"],
    lessons: ["final-consonants", "v-w-b"],
  },
  spanish: {
    why: "Spanish has one b/v sound, five vowels, no z or sh in most dialects, and adds an “e” before s-clusters.",
    sounds: ["v", "short-i", "z", "sh", "j", "short-u"],
    lessons: ["clusters", "vowel-length", "schwa-stress"],
  },
  tagalog: {
    why: "Tagalog often uses p for f and b for v, has no th or z, and gives every vowel full length.",
    sounds: ["f", "v", "th-voiceless", "z", "sh", "short-a"],
    lessons: ["schwa-stress", "v-w-b"],
  },
  thai: {
    why: "Thai speakers often use l for r and w for v, and word-final consonants are quiet or dropped.",
    sounds: ["r", "v", "th-voiceless", "sh", "z", "ch"],
    lessons: ["final-consonants"],
  },
  turkish: {
    why: "Turkish v is close to w, there is no th, and final consonants lose their voicing.",
    sounds: ["w", "th-voiceless", "th-voiced", "short-a", "short-i"],
    lessons: ["final-consonants", "clusters"],
  },
  vietnamese: {
    why: "Vietnamese softens or drops word endings, has no th, and final s and z (plurals) are easy to lose.",
    sounds: ["th-voiceless", "th-voiced", "s", "z", "sh"],
    lessons: ["final-consonants", "endings-ed-s"],
  },
};

export const l1Focus = (lang) => L1_FOCUS[lang] ?? null;
