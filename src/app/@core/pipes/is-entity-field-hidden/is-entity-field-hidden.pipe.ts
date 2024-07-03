import { Pipe, PipeTransform } from '@angular/core';
import { CommonHelper } from '../../common-helper';

@Pipe({
  name: 'isEntityFieldHidden'
})
export class IsEntityFieldHiddenPipe implements PipeTransform {

  constructor(private _commonHelper: CommonHelper) { }
  
  transform(data: any, entityTypeId: number, sectionCodes: any, fieldName: any): any {
    return this._commonHelper.isEntityFieldHidden(data, entityTypeId, sectionCodes, fieldName);
  }

}
