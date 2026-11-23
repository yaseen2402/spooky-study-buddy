const EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
const THROTTLE_MS = 250;

export class IdleDetector {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private idle = false;
  private running = false;
  private suspended = false;
  private lastInput = 0;

  constructor(
    private readonly thresholdMs: number,
    private readonly onIdle: () => void,
    private readonly onActive: () => void,
  ) {}

  private arm() {
    this.clear();
    this.timer = setTimeout(() => {
      this.timer = null;
      if (!this.running || this.suspended || this.idle) return;
      this.idle = true;
      this.onIdle();
    }, this.thresholdMs);
  }

  private clear() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  private handleInput = () => {
    if (!this.running || this.suspended) return;
    if (this.idle) {
      this.idle = false;
      this.onActive();
      this.lastInput = Date.now();
      this.arm();
      return;
    }
    const now = Date.now();
    if (now - this.lastInput < THROTTLE_MS) return;
    this.lastInput = now;
    this.arm();
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    this.idle = false;
    this.suspended = false;
    for (const e of EVENTS) window.addEventListener(e, this.handleInput, { passive: true });
    this.arm();
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.clear();
    for (const e of EVENTS) window.removeEventListener(e, this.handleInput);
  }

  /** Pause detection (e.g. tab hidden — browsers deliver no input events then). */
  suspend(): void {
    this.suspended = true;
    this.clear();
  }

  /** Resume detection; the idle countdown restarts from now. */
  resume(): void {
    if (!this.running) return;
    this.suspended = false;
    this.idle = false;
    this.arm();
  }
}
