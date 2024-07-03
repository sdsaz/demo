import { DateMaskDirective } from './date-mask.directive';
import { Calendar } from 'primeng/calendar';

describe('DateMaskDirective', () => {
  it('should create an instance', () => {
    let primeCalendar: Calendar;
    const directive = new DateMaskDirective(primeCalendar);
    expect(directive).toBeTruthy();
  });
});
