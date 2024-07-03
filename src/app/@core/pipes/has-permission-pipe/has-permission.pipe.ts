import { Pipe, PipeTransform } from '@angular/core';
import { CommonHelper } from '../../common-helper';

@Pipe({
  name: 'hasPermission'
})
export class HasPermissionPipe implements PipeTransform {

  constructor(private _commonHelper: CommonHelper) { }

  transform(value: string): boolean {
    return value && this._commonHelper.havePermission(value);
  }
}
