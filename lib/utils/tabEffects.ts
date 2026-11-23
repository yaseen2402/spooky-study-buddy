export const NORMAL_TITLE = 'Spooky Study Buddy';
export const HAUNT_TITLE = '👁️ I SEE YOU SLACKING...';
const NORMAL_ICON = '/favicon.svg';
const HAUNTED_ICON = '/favicon-haunted.svg';

let flashTimer: ReturnType<typeof setInterval> | null = null;

export function startTitleFlash(normalTitle = NORMAL_TITLE): void {
  stopTitleFlash(normalTitle);
  let showHaunt = true;
  document.title = HAUNT_TITLE;
  flashTimer = setInterval(() => {
    showHaunt = !showHaunt;
    document.title = showHaunt ? HAUNT_TITLE : normalTitle;
  }, 1000);
}

export function stopTitleFlash(normalTitle = NORMAL_TITLE): void {
  if (flashTimer !== null) clearInterval(flashTimer);
  flashTimer = null;
  document.title = normalTitle;
}

function iconLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

export function setCreepyFavicon(): void {
  const link = iconLink();
  link.type = 'image/svg+xml';
  link.href = HAUNTED_ICON;
}

export function restoreFavicon(): void {
  const link = iconLink();
  link.type = 'image/svg+xml';
  link.href = NORMAL_ICON;
}
