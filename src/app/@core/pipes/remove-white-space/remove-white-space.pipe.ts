import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'removeWhiteSpace'})
export class RemoveWhiteSpacePipe implements PipeTransform {

  transform(value: string): string {
    return value.replace(/\s/g, "");
  }
}
