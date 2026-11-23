import type { RoastMode } from '@/lib/types';

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

export function getFallback(mode: RoastMode, random: () => number = Math.random): string {
  const list = mode === 'congratulate' ? CONGRATULATIONS : TAUNTS;
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}
