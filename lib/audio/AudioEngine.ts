import { ESCALATION_INTERVAL_MS, START_VOLUME, nextVolume } from './volume';

const FADE_SECONDS = 2;
const HEARTBEAT_LOOKAHEAD_S = 1.5;

type Ctor = typeof AudioContext;

function getAudioContextCtor(): Ctor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * Synthesised haunt soundtrack: a detuned low drone with slow tremolo plus a heartbeat.
 * No audio files. Call `unlock()` from a click handler so autoplay policy allows playback later.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: AudioScheduledSourceNode[] = [];
  private escalationTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private nextBeatAt = 0;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private volume = START_VOLUME;
  private muted = false;
  private playing = false;

  get supported(): boolean {
    return getAudioContextCtor() !== null;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  get currentVolume(): number {
    return this.volume;
  }

  unlock(): void {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return;
    try {
      if (!this.ctx) {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
      this.master = null;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGain(0.15);
  }

  start(): void {
    this.unlock();
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    if (this.stopTimer !== null) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
      this.teardownNodes();
    }
    if (this.playing) return;
    this.playing = true;
    this.volume = START_VOLUME;

    // Drone: two detuned saws through a low-pass, with tremolo.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 6;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.35;
    filter.connect(droneGain).connect(master);

    for (const [freq, detune] of [
      [55, -9],
      [55.5, 11],
      [82.4, 4],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start();
      this.nodes.push(osc);
    }

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.18;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.2;
    lfo.connect(lfoDepth).connect(droneGain.gain);
    lfo.start();
    this.nodes.push(lfo);

    const sweep = ctx.createOscillator();
    sweep.frequency.value = 0.05;
    const sweepDepth = ctx.createGain();
    sweepDepth.gain.value = 250;
    sweep.connect(sweepDepth).connect(filter.frequency);
    sweep.start();
    this.nodes.push(sweep);

    // Heartbeat scheduler (lookahead so background-tab timer throttling doesn't stutter it much).
    this.nextBeatAt = ctx.currentTime + 0.2;
    const schedule = () => this.scheduleHeartbeats();
    schedule();
    this.heartbeatTimer = setInterval(schedule, 500);

    this.applyGain(0.3);
    this.escalationTimer = setInterval(() => {
      this.volume = nextVolume(this.volume);
      this.applyGain(1);
    }, ESCALATION_INTERVAL_MS);
  }

  stop(): void {
    if (!this.playing) return;
    this.playing = false;
    if (this.escalationTimer !== null) clearInterval(this.escalationTimer);
    if (this.heartbeatTimer !== null) clearInterval(this.heartbeatTimer);
    this.escalationTimer = null;
    this.heartbeatTimer = null;
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
    this.stopTimer = setTimeout(() => {
      this.stopTimer = null;
      this.teardownNodes();
    }, FADE_SECONDS * 1000 + 50);
  }

  private teardownNodes() {
    for (const n of this.nodes) {
      try {
        n.stop();
        n.disconnect();
      } catch {
        // already stopped
      }
    }
    this.nodes = [];
  }

  private applyGain(rampSeconds: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const target = this.muted || !this.playing ? 0 : this.volume;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target, now + rampSeconds);
  }

  private scheduleHeartbeats() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || !this.playing) return;
    // Faster heart as volume rises: 60 → ~110 bpm.
    const bpm = 60 + this.volume * 50;
    const period = 60 / bpm;
    while (this.nextBeatAt < ctx.currentTime + HEARTBEAT_LOOKAHEAD_S) {
      this.thump(this.nextBeatAt, 1);
      this.thump(this.nextBeatAt + 0.22, 0.7);
      this.nextBeatAt += period;
    }
  }

  private thump(at: number, strength: number) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(70, at);
    osc.frequency.exponentialRampToValueAtTime(38, at + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(1.6 * strength, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
    osc.connect(g).connect(master);
    osc.start(at);
    osc.stop(at + 0.25);
  }
}
