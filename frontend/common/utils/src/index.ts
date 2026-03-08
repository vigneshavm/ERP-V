import { format } from 'date-fns';

export class DateUtils {
  static formatDisplayDate(date: Date | string | number): string {
    return format(new Date(date), 'MMM dd, yyyy');
  }

  static formatISO(date: Date): string {
    return date.toISOString();
  }
}

export const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};
