/**
 * audio.js — Hệ thống âm thanh thuần Web Audio API (Zero-dependency)
 * Tự động tổng hợp nhạc nền lãng mạn và các hiệu ứng âm thanh gameshow
 * Hoạt động 100% offline, không cần file MP3 ngoài, không lo lỗi CORS.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.masterGain = null;

    // Cài đặt mặc định
    this.bgmEnabled = true;
    this.sfxEnabled = true;
    this.volume = 0.7;

    // Trạng thái BGM
    this.isPlayingBGM = false;
    this.bgmInterval = null;

    this.loadSettings();
  }

  // Khởi tạo AudioContext khi người dùng có tương tác đầu tiên
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // BGM Gain
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmEnabled ? 0.25 : 0, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 0.6 : 0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Đọc cài đặt từ localStorage
  loadSettings() {
    try {
      const saved = localStorage.getItem("bmhh_audio_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        this.bgmEnabled = parsed.bgmEnabled ?? true;
        this.sfxEnabled = parsed.sfxEnabled ?? true;
        this.volume = parsed.volume ?? 0.7;
      }
    } catch (e) {
      console.warn("Không đọc được cài đặt âm thanh:", e);
    }
  }

  // Lưu cài đặt vào localStorage
  saveSettings() {
    try {
      localStorage.setItem("bmhh_audio_settings", JSON.stringify({
        bgmEnabled: this.bgmEnabled,
        sfxEnabled: this.sfxEnabled,
        volume: this.volume
      }));
    } catch (e) {
      console.warn("Lỗi lưu cài đặt âm thanh:", e);
    }
  }

  // Cập nhật âm lượng master
  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.saveSettings();
  }

  // Bật/tắt BGM
  toggleBGM(enable) {
    this.bgmEnabled = enable;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(this.bgmEnabled ? 0.25 : 0, this.ctx.currentTime, 0.05);
    }
    if (this.bgmEnabled && !this.isPlayingBGM) {
      this.startBGM();
    } else if (!this.bgmEnabled && this.isPlayingBGM) {
      this.stopBGM();
    }
    this.saveSettings();
  }

  // Bật/tắt SFX
  toggleSFX(enable) {
    this.sfxEnabled = enable;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? 0.6 : 0, this.ctx.currentTime, 0.05);
    }
    this.saveSettings();
  }

  // =========================================================================
  // HIỆU ỨNG ÂM THANH (SFX)
  // =========================================================================

  // Tiếng chuông bấm đèn (Hẹn hò ting ting)
  playChime() {
    if (!this.sfxEnabled) return;
    this.initContext();

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    // Hợp âm E6 & G#6 sáng trong
    osc1.frequency.setValueAtTime(1318.51, now);
    osc2.frequency.setValueAtTime(1661.22, now);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);
  }

  // Tiếng đếm ngược bíp bíp 3..2..1
  playBeep(isHigh = false) {
    if (!this.sfxEnabled) return;
    this.initContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isHigh ? 880 : 440, now);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Tiếng kéo rèm (Whoosh effect)
  playCurtainWhoosh() {
    if (!this.sfxEnabled) return;
    this.initContext();

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.7;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.7);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  // Tiếng vỗ tay rộn ràng (Applause simulation)
  playApplause(duration = 2.5) {
    if (!this.sfxEnabled) return;
    this.initContext();

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Tạo các xung vỗ tay ngẫu nhiên
    for (let i = 0; i < bufferSize; i++) {
      const envelope = Math.sin((i / bufferSize) * Math.PI);
      const clapPulse = Math.random() < 0.15 ? (Math.random() * 2 - 1) * 1.5 : (Math.random() * 0.3 - 0.15);
      data[i] = clapPulse * envelope;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.setValueAtTime(1.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  // Nhạc kèn chiến thắng / Ghép đôi thành công (Fanfare)
  playFanfare() {
    if (!this.sfxEnabled) return;
    this.initContext();

    const notes = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.50, d: 0.45 } // C6
    ];

    let t = this.ctx.currentTime;
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + n.d);
      t += n.d * 0.9;
    });

    // Kèm thêm vỗ tay
    setTimeout(() => this.playApplause(3), 400);
  }

  // Nhạc tiếc nuối khi không thành đôi
  playSadTune() {
    if (!this.sfxEnabled) return;
    this.initContext();

    const notes = [
      { f: 440.00, d: 0.3 }, // A4
      { f: 415.30, d: 0.3 }, // G#4
      { f: 392.00, d: 0.3 }, // G4
      { f: 349.23, d: 0.6 }  // F4
    ];

    let t = this.ctx.currentTime;
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + n.d);
      t += n.d * 0.95;
    });
  }

  // =========================================================================
  // NHẠC NỀN GAMESHOW LÃNG MẠN (PROCEDURAL BGM LOOP)
  // =========================================================================
  startBGM() {
    if (this.isPlayingBGM || !this.bgmEnabled) return;
    this.initContext();
    this.isPlayingBGM = true;

    // Giai điệu lãng mạn nhẹ nhàng (Hợp âm C - G - Am - F)
    const melodyPattern = [
      523.25, 659.25, 783.99, 659.25, // C - E - G - E
      392.00, 493.88, 587.33, 493.88, // G - B - D - B
      440.00, 523.25, 659.25, 523.25, // A - C - E - C
      349.23, 440.00, 523.25, 440.00  // F - A - C - A
    ];

    let step = 0;
    this.bgmInterval = setInterval(() => {
      if (!this.bgmEnabled || !this.isPlayingBGM) return;

      const freq = melodyPattern[step % melodyPattern.length];
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + 0.5);

      step++;
    }, 450);
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

// Khởi tạo đối tượng toàn cục
window.sound = new SoundSystem();
