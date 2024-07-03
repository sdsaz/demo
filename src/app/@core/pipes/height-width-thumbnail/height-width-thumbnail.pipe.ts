import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'heightWidthThumbnail'
})
export class HeightWidthThumbnailPipe implements PipeTransform {

  transform(value: string, type: string, multiplier: number = 15): number {
    if (type.toLowerCase() == 'width') {
      return (Number(value.charAt(3)) * multiplier) || 0;
    }
    else if (type.toLowerCase() == 'height') {
      return (Number(value.charAt(1)) * multiplier) || 0;
    }
    else {
      return 0
    }
  }
}
