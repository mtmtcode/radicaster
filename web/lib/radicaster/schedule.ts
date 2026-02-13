const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export class ExecutionSchedule {
  wday: string;
  hour: number;
  min: number;

  constructor(wday: string, hour: number, min: number) {
    this.wday = wday;
    this.hour = hour;
    this.min = min;
  }

  static parse(s: string): ExecutionSchedule {
    const m = s.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s*([0-5]?[0-9]):([0-5]?[0-9])(?::([0-5]?[0-9]))?$/i);
    if (!m) {
      throw new Error("execution schedule format is invalid");
    }

    const wday = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    const hour = parseInt(m[2], 10);
    const min = parseInt(m[3], 10);
    // seconds are ignored

    return new ExecutionSchedule(wday, hour, min);
  }

  toCron(): string {
    const jstWday = DAYS_OF_WEEK.indexOf(this.wday);
    let utcWday: number;
    let utcHour: number;

    // Convert JST to UTC
    if (this.hour >= 9) {
      utcWday = jstWday;
      utcHour = this.hour - 9;
    } else {
      utcWday = jstWday === 0 ? 6 : jstWday - 1;
      utcHour = 24 + this.hour - 9;
    }

    return `cron(${this.min} ${utcHour} ? * ${DAYS_OF_WEEK[utcWday]} *)`;
  }

  toYamlString(): string {
    const hourPad = this.hour.toString().padStart(2, '0');
    const minPad = this.min.toString().padStart(2, '0');
    return `${this.wday} ${hourPad}:${minPad}:00`;
  }
}
