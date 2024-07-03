import { Pipe, PipeTransform } from '@angular/core';
import { CommonHelper } from '../../common-helper';

@Pipe({
  name: 'getFileNameOrExtensionPipe'
})
export class GetFileNameOrExtensionPipe implements PipeTransform {

  constructor(public _commonHelper: CommonHelper) { }

  transform(value: string, isFileExtensionOnly?: boolean): any {
    if(!value) return;
    return this._commonHelper.getFileNameOrExtension(value, isFileExtensionOnly);
  }

}
