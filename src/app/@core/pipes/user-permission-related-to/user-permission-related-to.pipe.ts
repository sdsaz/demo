import { Pipe, PipeTransform } from '@angular/core';
import { CommonHelper, enumPermissions } from '../../common-helper';

@Pipe({
  name: 'userPermissionRelatedTo'
})
export class UserPermissionRelatedToPipe implements PipeTransform {

  constructor(private _commonHelper: CommonHelper) {
  }

  transform(entityTypeName: string, ): boolean {
    let isViewRelatedToEntity = false;
    switch (entityTypeName) {
      case "Accounts":
        isViewRelatedToEntity = this._commonHelper.havePermission(enumPermissions.ViewAccount);
        break;
      case "Contacts":
        isViewRelatedToEntity = this._commonHelper.havePermission(enumPermissions.ViewContact);
        break;
    }
    return isViewRelatedToEntity;
  }

}
