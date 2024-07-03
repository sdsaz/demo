import { Pipe, PipeTransform } from '@angular/core';
import { DynamicTableColumnType } from '../../enum';
import { DynamicTableColumn } from '../../sharedModels/dynamic-table.model';

@Pipe({
  name: 'visible'
})
export class DynamicTableVisibleColumnPipe implements PipeTransform {

  private readonly skipTypes: Array<string>;

  constructor() {
    this.skipTypes = [
      DynamicTableColumnType[DynamicTableColumnType.key],
      DynamicTableColumnType[DynamicTableColumnType.hidden]
    ];
  }

  transform(fields: Array<DynamicTableColumn>): Array<DynamicTableColumn> {
    return fields
      ? fields.filter(f => !this.skipTypes.includes(f.type.toString()))
      : [];
  }
}
