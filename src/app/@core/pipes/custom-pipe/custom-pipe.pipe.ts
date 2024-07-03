import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

@Pipe({
  name: 'customPipe'
})
export class CustomPipe implements PipeTransform {
  constructor(private datePipe: DatePipe,
    private decimalPipe: DecimalPipe
  ) {

  }
  //HOW to use {{ 1234567 | customPipe: 'numeric': '' }}  {{ 1234567 | customPipe: 'numeric': '##,###' }}
  transform(value: any, dataType: string, format: string, hrsInDay: number = 24): any {
    if (dataType) {
      switch (dataType.toLocaleLowerCase()) {
        case 'numeric': {
          if (format) {
            return this.decimalPipe.transform(value, format);
          } else {
            //TODO return with thousand seperate format
            return this.decimalPipe.transform(value);
          }
        }
        case 'datetime': {
          if (format) {
            if (format.endsWith(" a")) {
              format = format.replace(" a", "");
              return this.datePipe.transform(value, format) + this.datePipe.transform(value, " a").toLowerCase();
            }
            else {
              return this.datePipe.transform(value, format);
            }

          }
          else {
            // TODO return with "MM/DD/YYYY"
            return this.datePipe.transform(value, 'M/d/yyyy');
          }
        }
        case 'duration': {
          if (value && value != '') {

            //if value is nagative then convert it to positive and at the end put negative sign
            var isNagativeValue: boolean = false;
            if(value < 0 ){
              value = Math.abs(value);
              isNagativeValue = true;
            }

            const d = Math.floor(value / (60 * 24));
            const h = Math.floor(value % (60 * 24) / 60);
            const m = Math.floor(value % 60);

            const dDisplay = d > 0 ? d + (d === 1 ? 'd ' : 'd ') : '';
            const hDisplay = h > 0 ? h + (h === 1 ? 'h ' : 'h ') : '';
            const mDisplay = m > 0 ? m + (m === 1 ? 'm' : 'm') : '';
            
            const returnVal = dDisplay + hDisplay + mDisplay;
            return isNagativeValue ? '(' + returnVal + ')' : returnVal;
          } else {
            return '0m';
          }
        }
        case 'workingduration': {
          if (value && value != '') {

            //if value is nagative then convert it to positive and at the end put negative sign
            var isNagativeValue: boolean = false;
            if(value < 0 ){
              value = Math.abs(value);
              isNagativeValue = true;
            }
            
            hrsInDay = hrsInDay && hrsInDay == 0 ? 24 : hrsInDay;
            
            const d = Math.floor(value / (60 * hrsInDay));
            const h = Math.floor(value % (60 * hrsInDay) / 60);
            const m = Math.floor(value % 60);

            const dDisplay = d > 0 ? d + (d === 1 ? 'd ' : 'd ') : '';
            const hDisplay = h > 0 ? h + (h === 1 ? 'h ' : 'h ') : '';
            const mDisplay = m > 0 ? m + (m === 1 ? 'm' : 'm') : '';

            const returnVal = dDisplay + hDisplay + mDisplay;
            return isNagativeValue ? '(' + returnVal + ')' : returnVal;
          } else {
            return '0m';
          }
        }
      }
    }

    return value;
  }
}

export class CustomPipeArg {
  dataType: string;
  format: string
}
