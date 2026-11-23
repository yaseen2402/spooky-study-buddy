export class VisibilityMonitor {
  private running = false;

  constructor(
    private readonly onHidden: () => void,
    private readonly onVisible: () => void,
  ) {}

  private handle = () => {
    if (document.visibilityState === 'hidden') this.onHidden();
    else this.onVisible();
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    document.addEventListener('visibilitychange', this.handle);
    // If we start while already hidden (rare), report it immediately.
    if (document.visibilityState === 'hidden') this.onHidden();
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    document.removeEventListener('visibilitychange', this.handle);
  }
}
