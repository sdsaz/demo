import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'linkFormat'
})
export class DynamicTableLinkFormatPipe implements PipeTransform {

  transform(value: string, data: any, args: string[]): string {
    if (!value || !data || !args || args.length <= 0) {
      return value;
    }

    let nolink = false;
    const res = value.replace(/{(\d+)}/g, (match, index) => {
      const vl = data[args[Number(index)]] || '';
      if (!vl) {
        nolink = true;
      }
      return vl;
    });
    return nolink ? '' : res;
  }
}
