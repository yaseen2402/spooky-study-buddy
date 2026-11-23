import type { FeynmanResponse, RoastMode } from '@/lib/types';

export const TAUNTS: readonly string[] = [
  "I've haunted this house for 300 years and never seen anyone dodge work this skillfully.",
  'Your textbook called. It says it feels like a ghost too — ignored and see-through.',
  "Boo! Oh wait, that's just the sound of your grades dropping.",
  'Even zombies have more focus than you, and their brains are literally falling out.',
  "I'm not mad, I'm just… eternally disappointed. Get back here.",
  'The only thing you are haunting right now is your own future.',
  "Wandering off again? Careful — that's how I ended up stuck in this tab.",
  'I can see you scrolling. I can always see you scrolling.',
  'Every minute you slack, a candle in my crypt goes out. Please. I am running out of candles.',
  "Your study session called. It's lonely. Like me. Come back.",
  'Procrastination is a slow curse, mortal. I would know — I invented it.',
  'The deadline is creeping closer. Unlike me, it will not just float away.',
];

export const CONGRATULATIONS: readonly string[] = [
  'You survived the session! Even the skeletons in my closet are applauding.',
  'Spooktacular focus! You have earned one (1) haunted cookie.',
  "Session complete. I'd give you a high five, but my hand goes right through.",
  'You faced the darkness of distraction and won. The crypt is proud of you.',
  'Well studied, mortal. Rest now — the books will still be here. So will I.',
  'Not bad for a living person. I may have to haunt someone lazier.',
];

type FallbackFeynman = Omit<FeynmanResponse, 'source'>;

const FEYNMAN_FALLBACKS: readonly FallbackFeynman[] = [
  {
    feedback: "Ooooh, a brave attempt to explain to the Ghost Mentor! The spectral archives are impressed you tried.",
    clear: "Your explanation shows some genuine grasp of the core idea — the ghost can sense the effort.",
    missing: "A concrete example or analogy would make this hauntingly clear. The spirit world demands specifics.",
    simplifyPrompt: "Now explain it as if the ghost is a confused medieval peasant who has never seen electricity.",
  },
  {
    feedback: "The Ghost Mentor has floated through centuries of explanations, and yours shows real promise.",
    clear: "You've captured the essential skeleton of the concept — the bones are in the right place.",
    missing: "Consider: what would happen if one piece were missing? Naming that would sharpen your understanding.",
    simplifyPrompt: "Try explaining it again in exactly three sentences — no more, no less.",
  },
  {
    feedback: "Interesting… the crypt walls are etched with more complicated explanations than yours, and that is a compliment.",
    clear: "The opening of your explanation demonstrates solid command of the fundamentals.",
    missing: "What connects your ideas together? The ghost senses a missing chain link haunting the middle.",
    simplifyPrompt: "Imagine you must explain this to a friendly ghost who can only understand words of two syllables or fewer.",
  },
];

export function getFallback(mode: RoastMode, random: () => number = Math.random): string {
  const list = mode === 'congratulate' ? CONGRATULATIONS : TAUNTS;
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

export function getFallbackFeynman(random: () => number = Math.random): FallbackFeynman {
  return FEYNMAN_FALLBACKS[Math.min(FEYNMAN_FALLBACKS.length - 1, Math.floor(random() * FEYNMAN_FALLBACKS.length))];
}
