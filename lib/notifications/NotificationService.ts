export const NOTIFICATION_TITLE = '👻 Your Ghost Buddy is watching…';
const ICON = '/favicon-haunted.svg';

export type PermissionState = NotificationPermission | 'unsupported';

export class NotificationService {
  private requested = false;

  get permission(): PermissionState {
    if (typeof window === 'undefined' || typeof window.Notification !== 'function') return 'unsupported';
    return window.Notification.permission ?? 'unsupported';
  }

  /** Call from a user-gesture handler. Prompts at most once per page load, and only if undecided. */
  async requestPermissionIfNeeded(): Promise<PermissionState> {
    const current = this.permission;
    if (current !== 'default' || this.requested) return current;
    this.requested = true;
    try {
      return await window.Notification.requestPermission();
    } catch {
      return this.permission;
    }
  }

  /** Shows a notification if permitted. A repeated `tag` replaces the earlier notification. */
  notify(body: string, tag?: string): Notification | null {
    if (this.permission !== 'granted') return null;
    try {
      const options: NotificationOptions & { renotify?: boolean } = { body, icon: ICON };
      if (tag) {
        options.tag = tag;
        options.renotify = true;
      }
      const n = new Notification(NOTIFICATION_TITLE, options);
      n.onclick = () => {
        window.focus();
        n.close();
      };
      return n;
    } catch {
      // Some platforms (e.g. Android Chrome) only allow notifications via a service worker.
      return null;
    }
  }
}
