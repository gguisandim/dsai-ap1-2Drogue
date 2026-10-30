// src/managers/SoundManager.ts
// Synthetic Web Audio API Sound Generator for retro/arcade audio feedback.
// Plays gunshots, sword slashes, Witch Time sound-warps, halo ring chimes, explosions,
// and boss roars dynamically without external audio assets.

import type { ResolvedStageAudioProfile, ResolvedStageSound, StageAudioEvent } from '../stages/contracts';

export type StageAudioApplyStatus = 'started' | 'unchanged' | 'blocked' | 'disabled' | 'stopped';

export class SoundManager {
  private static ctx: AudioContext | null = null;
  private static enabled: boolean = true;
  private static desiredStageProfile?: ResolvedStageAudioProfile;
  private static activeStageProfileId?: string;
  private static stageLoops: Array<{ oscillator: OscillatorNode; gain: GainNode }> = [];
  private static retryHandler?: () => void;

  public static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stopStageAudio();
  }

  private static getContext(requestResume = true): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (requestResume && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  public static async applyStageAudio(profile?: ResolvedStageAudioProfile): Promise<StageAudioApplyStatus> {
    this.desiredStageProfile = profile;
    if (!this.enabled) {
      this.stopStageLoops();
      return 'disabled';
    }
    if (!profile) {
      this.stopStageAudio();
      return 'stopped';
    }
    if (this.activeStageProfileId === profile.id && this.stageLoops.length > 0) return 'unchanged';
    this.stopStageLoops();
    let context: AudioContext;
    try {
      context = this.getContext(false);
      if (context.state === 'suspended') await context.resume();
      if (context.state !== 'running') {
        this.installStageAudioRetry();
        return 'blocked';
      }
    } catch {
      this.installStageAudioRetry();
      return 'blocked';
    }
    if (this.desiredStageProfile?.id !== profile.id) return 'stopped';
    [profile.music, profile.ambient].forEach(sound => {
      if (sound) this.stageLoops.push(this.createStageLoop(context, sound, profile.masterVolume));
    });
    this.activeStageProfileId = profile.id;
    this.removeStageAudioRetry();
    return 'started';
  }

  public static playStageEvent(event: StageAudioEvent): boolean {
    if (!this.enabled || !this.desiredStageProfile ||
      this.activeStageProfileId !== this.desiredStageProfile.id) return false;
    const sound = this.desiredStageProfile.eventSounds[event];
    if (!sound) return false;
    try {
      const context = this.getContext();
      if (context.state !== 'running') return false;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = sound.waveform;
      oscillator.frequency.setValueAtTime(sound.frequency, context.currentTime);
      gain.gain.setValueAtTime(sound.volume * this.desiredStageProfile.masterVolume, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start();
      oscillator.stop(context.currentTime + 0.24);
      return true;
    } catch {
      return false;
    }
  }

  public static stopStageAudio(): void {
    this.desiredStageProfile = undefined;
    this.stopStageLoops();
    this.removeStageAudioRetry();
  }

  public static stageAudioState(): Readonly<{
    desiredProfileId?: string;
    activeProfileId?: string;
    loopCount: number;
  }> {
    return Object.freeze({
      ...(this.desiredStageProfile ? { desiredProfileId: this.desiredStageProfile.id } : {}),
      ...(this.activeStageProfileId ? { activeProfileId: this.activeStageProfileId } : {}),
      loopCount: this.stageLoops.length,
    });
  }

  private static createStageLoop(
    context: AudioContext,
    sound: ResolvedStageSound,
    masterVolume: number,
  ): { oscillator: OscillatorNode; gain: GainNode } {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = sound.waveform;
    oscillator.frequency.setValueAtTime(sound.frequency, context.currentTime);
    gain.gain.setValueAtTime(sound.volume * masterVolume, context.currentTime);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    return { oscillator, gain };
  }

  private static stopStageLoops(): void {
    const context = this.ctx;
    this.stageLoops.forEach(({ oscillator, gain }) => {
      try {
        if (context) {
          gain.gain.cancelScheduledValues(context.currentTime);
          gain.gain.setValueAtTime(0.0001, context.currentTime);
          oscillator.stop(context.currentTime + 0.02);
        } else oscillator.stop();
        oscillator.disconnect();
        gain.disconnect();
      } catch {
        // A browser may already have disposed a node during scene shutdown.
      }
    });
    this.stageLoops = [];
    this.activeStageProfileId = undefined;
  }

  private static installStageAudioRetry(): void {
    if (this.retryHandler || typeof window === 'undefined') return;
    this.retryHandler = () => {
      const desired = this.desiredStageProfile;
      this.removeStageAudioRetry();
      if (desired) void this.applyStageAudio(desired);
    };
    window.addEventListener('pointerdown', this.retryHandler, { once: true });
    window.addEventListener('keydown', this.retryHandler, { once: true });
  }

  private static removeStageAudioRetry(): void {
    if (!this.retryHandler || typeof window === 'undefined') return;
    window.removeEventListener('pointerdown', this.retryHandler);
    window.removeEventListener('keydown', this.retryHandler);
    this.retryHandler = undefined;
  }

  public static playGunshot(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Audio fallback
    }
  }

  public static playSwordSlash(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Audio fallback
    }
  }

  public static playWitchTimeActivate(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      // Low gong / clock chime warp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      // Audio fallback
    }
  }

  public static playWickedWeave(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio fallback
    }
  }

  public static playHaloPickup(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.06); // E6

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // Audio fallback
    }
  }

  public static playDodgeSwoosh(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio fallback
    }
  }

  public static playExplosion(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio fallback
    }
  }
}
