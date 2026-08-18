import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.css'],
})
export class CounterComponent implements OnInit, OnDestroy {

  countdownMinutes = 10;

  countdownSeconds = 0;

  alerts = [
    {
      id: 1,
      value: 5,
      unit: 'minutes',
      enabled: true,
    },
    {
      id: 2,
      value: 1,
      unit: 'minutes',
      enabled: true,
    },
    {
      id: 3,
      value: 30,
      unit: 'seconds',
      enabled: true,
    },
  ];

  totalMilliseconds = 0;
  remainingMilliseconds = 0;
  private startTime = 0;
  private endTime = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;

  /*
   * Keeps track of alerts that have already been played.
   *
   * Without this, an alert such as "5 minutes" could potentially
   * trigger multiple times while the timer is around 05:00.
   */

  private triggeredAlerts = new Set<number>();

  // ============================================================
  // AUDIO
  // ============================================================

  private audioContext: AudioContext | null = null;

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {
    // Try to load countdown configuration from the previous page.
    const raw = sessionStorage.getItem('countdownData');

    if (raw) {
      try {
        const data = JSON.parse(raw);

        if (typeof data.minutes === 'number') {
          this.countdownMinutes = data.minutes;
        }

        if (typeof data.seconds === 'number') {
          this.countdownSeconds = data.seconds;
        }

        if (Array.isArray(data.alerts)) {
          this.alerts = data.alerts;
        }

        console.log('Loaded alerts from sessionStorage:', this.alerts);
      } catch (err) {
        console.warn('Failed to parse countdownData from sessionStorage', err);
      }
    }

    this.totalMilliseconds =
      this.countdownMinutes * 60 * 1000 + this.countdownSeconds * 1000;

    this.remainingMilliseconds = this.totalMilliseconds;

    // Start the timer automatically.
    this.startCountdown();
  }

  // ============================================================
  // START COUNTDOWN
  // ============================================================

  startCountdown(): void {
    this.stopCountdown();

    // Calculate an absolute end time so the timer doesn't drift.
    this.endTime = performance.now() + this.remainingMilliseconds;

    /*
     * Run frequently so that the progress ring looks smooth.
     *
     * We don't subtract 50ms from the timer.
     *
     * Instead, we calculate the actual elapsed time using
     * performance.now().
     *
     * This prevents timer drift.
     */

    this.timerId = setInterval(() => {
      this.updateCountdown();
    }, 50);
  }

  // ============================================================
  // UPDATE COUNTDOWN
  // ============================================================

  private updateCountdown(): void {
    const currentTime = performance.now();

    // Derive remaining time from the absolute end time to avoid drift.
    this.remainingMilliseconds = Math.max(0, this.endTime - currentTime);

    /*
     * Check whether any alert has been reached.
     */

    this.checkAlerts();

    /*
     * Tell Angular to update the screen.
     */

    this.changeDetectorRef.detectChanges();

    /*
     * Countdown finished.
     */

    if (this.remainingMilliseconds <= 0) {
      this.remainingMilliseconds = 0;

      this.stopCountdown();
    }
  }

  // ============================================================
  // STOP COUNTDOWN
  // ============================================================

  stopCountdown(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);

      this.timerId = null;
    }
  }

  // ============================================================
  // MINUTES DISPLAY
  // ============================================================

  get minutes(): string {
    const minutes = Math.floor(this.remainingMilliseconds / 60000);

    return minutes.toString().padStart(2, '0');
  }

  // ============================================================
  // SECONDS DISPLAY
  // ============================================================

  get seconds(): string {
    const seconds = Math.floor((this.remainingMilliseconds % 60000) / 1000);

    return seconds.toString().padStart(2, '0');
  }

  // ============================================================
  // PROGRESS
  // ============================================================

  /*
   * Returns a value between 0 and 1.
   *
   * 1 = timer is full
   * 0 = timer is finished
   */

  get progress(): number {
    if (this.totalMilliseconds <= 0) {
      return 0;
    }

    return this.remainingMilliseconds / this.totalMilliseconds;
  }

  /*
   * Returns a value between 0 and 100.
   */

  get progressPercent(): number {
    return this.progress * 100;
  }

  // ============================================================
  // ALERTS
  // ============================================================

  private checkAlerts(): void {
    /*
     * Convert remaining time into whole seconds.
     */

    const remainingSeconds = Math.ceil(this.remainingMilliseconds / 1000);

    for (const alert of this.alerts) {
      /*
       * Ignore disabled alerts.
       */

      if (!alert.enabled) {
        continue;
      }

      /*
       * Convert the alert into seconds.
       */

      let alertSeconds = 0;

      if (alert.unit === 'minutes') {
        alertSeconds = alert.value * 60;
      } else {
        alertSeconds = alert.value;
      }

      /*
       * Check if we crossed the alert threshold.
       */

      if (
        remainingSeconds <= alertSeconds &&
        !this.triggeredAlerts.has(alert.id)
      ) {
        /*
         * Remember that this alert has already fired.
         */

        this.triggeredAlerts.add(alert.id);

        console.log(`Alert triggered: id=${alert.id} value=${alert.value} unit=${alert.unit}`);

        // Play a bell-like sound for alerts.
        this.playBellSound();
      }
    }
  }

  // ============================================================
  // AUDIO INITIALIZATION
  // ============================================================

  private initializeAudio(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // ============================================================
  // ALERT SOUND
  // ============================================================

  private playAlertSound(): void {
    // Kept for backward compatibility: delegate to the new bell sound.
    this.playBellSound();
  }

  private playBellSound(): void {
    this.initializeAudio();

    if (!this.audioContext) return;

    const ctx = this.audioContext;

    const now = ctx.currentTime;

    // Two oscillators combined give a richer bell tone.
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Base frequencies (in Hz).
    osc1.frequency.setValueAtTime(880, now);
    osc2.frequency.setValueAtTime(1320, now);

    // Slight detune for character.
    osc2.detune.setValueAtTime(-10, now);

    // Short bell envelope.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(1.0, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);

    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);

    // Stop after decay.
    osc1.stop(now + 1.3);
    osc2.stop(now + 1.3);
  }

  resetCountdown(): void {
    this.triggeredAlerts.clear();

    this.remainingMilliseconds = this.totalMilliseconds;

    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.stopCountdown();

    if (this.audioContext) {
      this.audioContext.close();

      this.audioContext = null;
    }
  }
}
