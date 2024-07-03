import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'characterLimit'
})
export class CharacterLimitPipe implements PipeTransform {
  
  transform(value: string, characterLimit: number): any {
    if(value && value != null && value !== undefined && value.length >= characterLimit) {
      return value.substring(0, characterLimit) + "...";
    }
    return value;
  }

}
