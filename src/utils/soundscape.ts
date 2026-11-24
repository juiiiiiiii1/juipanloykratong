export class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private chimeTimer: number | null = null;
  private running = false;

  public start(): boolean {
    if (this.running) return true;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return false;

      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }

      const master = this.ctx.createGain();
      master.gain.value = 0.001;
      master.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 0.8);
      master.connect(this.ctx.destination);
      this.masterGain = master;

      // Synthesize gentle river flow via low-passed pink-ish noise
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.08;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 340;
      filter.Q.value = 0.7;

      // Subtle slow wave swell
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.14;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 90;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(master);

      noise.start();
      lfo.start();

      this.noiseSource = noise;
      this.lfoOsc = lfo;
      this.running = true;

      // Soft Thai pentatonic notes occasionally
      const pentatonicNotes = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33];
      const scheduleNextChime = () => {
        if (!this.running) return;
        const note =
          pentatonicNotes[Math.floor(Math.random() * pentatonicNotes.length)];
        this.playSoftNote(note, 0.06, 2.2);
        this.chimeTimer = window.setTimeout(
          scheduleNextChime,
          3200 + Math.random() * 3600
        );
      };
      this.chimeTimer = window.setTimeout(scheduleNextChime, 900);
      return true;
    } catch {
      return false;
    }
  }

  public stop(): void {
    this.running = false;
    if (this.chimeTimer !== null) {
      clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
    try {
      this.noiseSource?.stop();
      this.noiseSource?.disconnect();
      this.lfoOsc?.stop();
      this.lfoOsc?.disconnect();
      this.masterGain?.disconnect();
    } catch {
      // Ignore audio cleanup errors
    }
    this.noiseSource = null;
    this.lfoOsc = null;
    this.masterGain = null;
  }

  public playSoftNote(freq: number, peakGain = 0.08, durationSec = 1.6): void {
    if (!this.ctx || !this.masterGain || !this.running) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + durationSec + 0.05);
    } catch {
      // Ignore
    }
  }
}
