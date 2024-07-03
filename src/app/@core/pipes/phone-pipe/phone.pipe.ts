import { Pipe, PipeTransform } from '@angular/core';
import { CommonHelper } from '../../common-helper';

@Pipe({ name: 'phone' })
export class PhonePipe implements PipeTransform {

  constructor(private _commonHelper: CommonHelper) { }

  transform(phone: string, mode: string = null): any {
    if (!phone) return;

    if (mode == "link") {
      return 'tel:' + String(phone).replace('|','');
    } else {
      return this._commonHelper.getPhoneNoPrefixCountryCode(phone);
    }
  }
}
