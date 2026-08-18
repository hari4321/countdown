import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface CountdownAlert {
  id: number;
  value: number;
  unit: 'minutes' | 'seconds';
  enabled: boolean;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  // ============================================================
  // COUNTDOWN
  // ============================================================

  minutes = 10;

  seconds = 0;

  milliseconds = 0;

  // ============================================================
  // ALERTS
  // ============================================================

  alerts: CountdownAlert[] = [
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

  private nextAlertId = 4;

  constructor(private router: Router) {}

  // ============================================================
  // MINUTES
  // ============================================================

  increaseMinutes(): void {
    if (this.minutes < 999) {
      this.minutes++;
    }
  }

  decreaseMinutes(): void {
    if (this.minutes > 0) {
      this.minutes--;
    }
  }

  // ============================================================
  // SECONDS
  // ============================================================

  increaseSeconds(): void {
    if (this.seconds < 59) {
      this.seconds++;
    }
  }

  decreaseSeconds(): void {
    if (this.seconds > 0) {
      this.seconds--;
    }
  }

  // ============================================================
  // MILLISECONDS
  // ============================================================

  increaseMilliseconds(): void {
    if (this.milliseconds < 99) {
      this.milliseconds++;
    }
  }

  decreaseMilliseconds(): void {
    if (this.milliseconds > 0) {
      this.milliseconds--;
    }
  }

  // ============================================================
  // ALERTS
  // ============================================================

  addAlert(): void {
    this.alerts.push({
      id: this.nextAlertId++,

      value: 1,

      unit: 'minutes',

      enabled: true,
    });
  }

  removeAlert(id: number): void {
    this.alerts = this.alerts.filter((alert) => alert.id !== id);
  }

  toggleAlert(alert: CountdownAlert): void {
    alert.enabled = !alert.enabled;
  }

  // ============================================================
  // ALERT VALUE
  // ============================================================

  setAlertValue(alert: CountdownAlert, event: Event): void {
    const select = event.target as HTMLSelectElement;

    alert.value = Number(select.value);
  }

  // ============================================================
  // ALERT UNIT
  // ============================================================

  setAlertUnit(alert: CountdownAlert, event: Event): void {
    const select = event.target as HTMLSelectElement;

    alert.unit = select.value as 'minutes' | 'seconds';

    /*
     * If switching to seconds,
     * keep the value within a sensible range.
     */

    if (alert.unit === 'seconds' && alert.value > 59) {
      alert.value = 30;
    }
  }

  // ============================================================
  // ALERT OPTIONS
  // ============================================================

  getAlertValues(alert: CountdownAlert): number[] {
    if (alert.unit === 'minutes') {
      return [1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60];
    }

    return [5, 10, 15, 20, 30, 45, 50, 55];
  }

  // ============================================================
  // START COUNTDOWN
  // ============================================================

  startCountdown(): void {
    /*
     * Don't allow an empty countdown.
     */

    if (this.minutes === 0 && this.seconds === 0 && this.milliseconds === 0) {
      return;
    }

    /*
     * Prepare the configuration that will be
     * passed to the CounterComponent.
     */

    const countdownData = {
      minutes: this.minutes,

      seconds: this.seconds,

      milliseconds: this.milliseconds,

      alerts: this.alerts.map((alert) => ({
        ...alert,
      })),
    };

    /*
     * Store it temporarily.
     *
     * The CounterComponent can read this
     * when it starts.
     */

    sessionStorage.setItem('countdownData', JSON.stringify(countdownData));

    /*
     * Navigate to the counter screen.
     */

    this.router.navigate(['/counter']);
  }
}
