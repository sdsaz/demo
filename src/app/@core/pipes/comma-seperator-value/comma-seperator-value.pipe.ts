import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'commaSeperatorValue'
})
export class CommaSeperatorValuePipe implements PipeTransform {
  transform(value: string): string {
    if(value != null && value != '')
    {
      return value.replace(/,/g, ', ');
    }
    else
    {
      return ''
    }
  }
}
