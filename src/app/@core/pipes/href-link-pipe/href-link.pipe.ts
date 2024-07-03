import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hrefLink'
})
export class HrefLinkPipe implements PipeTransform {

  transform(value: string): string {
    if(value == null || value == ''){
      return value;
    }

    if (value.toLocaleUpperCase().startsWith("HTTP")) {
      return value;
    }
    else {
      return '//' + value;
    }
  }

}
