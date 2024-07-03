import { Pipe, PipeTransform } from '@angular/core';
import { CommonHelper } from '../../common-helper';

@Pipe({
  name: 'showHideAction'
})
export class ShowHideActionPipe implements PipeTransform {

  constructor(private _commonHelper: CommonHelper) {
  }

  transform(col: any, rowData: any): boolean {
    let showActionButton = false;
    let hasActions = false;
    if (col && col.type === 'action' && col.actionGroup.length > 0) {
      showActionButton = true;
      for (let i = 0; i < col.actionGroup.length; i++) {
        if (this._commonHelper.havePermission(col.actionGroup[i].permissionHash.split(','))) {
          if (col.actionGroup[i].hasOwnProperty('visibilityExpression')
            && rowData[col.actionGroup[i].visibilityExpression] === false) {
            hasActions = false;
          } else {
            hasActions = true;
            break;
          }
        } else {
          hasActions = false;
        }
      }
    }
    return showActionButton && hasActions;
  }

}
