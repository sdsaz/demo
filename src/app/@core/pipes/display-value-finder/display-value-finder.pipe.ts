import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'displayValueFinder'
})
export class DisplayValueFinderPipe implements PipeTransform {
  transform(items: any[], filter: any, commaSeperatedJoinProp: string = ''): any {
    if (!items || !filter) {
      return items;
    }
    let prop = '';
    let value = '';
    for (let key in filter) {
      prop = key;
      value = filter[key];
    }

    if (commaSeperatedJoinProp.length > 0) {
      // filter items array, items which match and return true will be kept, false will be filtered out
      // then true values will be joind by prop passed with comma

      if (value && value.length > 0) {
        return items.filter(item => value?.split(',').includes(String(item[prop] || ''))).sort((a,b) => (a[commaSeperatedJoinProp] > b[commaSeperatedJoinProp]) ? 1: -1).map((item) => { return item[commaSeperatedJoinProp] }).join(', ');
      } else {
        return '';
      }

    }
    else {
      // filter items array, items which match and return true will be kept, false will be filtered out
      return items.filter(item => typeof item[prop] === 'string' ? item[prop].indexOf(value) !== -1 : item[prop] === value);
    }
  }
}
