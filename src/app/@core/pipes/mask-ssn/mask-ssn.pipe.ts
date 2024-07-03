import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskSsn'
})
export class MaskSsnPipe implements PipeTransform {
  transform(ssn: string): string {
    const visibleDigits = 4;
    let maskedSection = ssn.slice(0, -visibleDigits);
    let visibleSection = ssn.slice(-visibleDigits);
    return maskedSection.slice(0,3).replace(/./g, '#') + "-" + maskedSection.slice(3,5).replace(/./g, '#') + "-" + visibleSection;
  }
}
