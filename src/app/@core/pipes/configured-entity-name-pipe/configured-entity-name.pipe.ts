import { Pipe, PipeTransform } from '@angular/core';
import { CommonHelper } from '../../common-helper';

@Pipe({
  name: 'configuredEntityName'
})
export class ConfiguredEntityNamePipe implements PipeTransform {

  constructor(public _commonHelper: CommonHelper) {

  }

  transform(value: string, args: any[] = null): any {
    let charLimi=15;
    if(typeof(args) == 'string' && args == 'sortName'){
      let val= this._commonHelper.getConfiguredEntityName(value, args);
      return val.length > charLimi ? val.substring(0, charLimi) + '...' : val;

    }
    else
      return this._commonHelper.getConfiguredEntityName(value, args);
  }

}
