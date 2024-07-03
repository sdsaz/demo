import { NgModule } from '@angular/core';
import { DynamicTableVisibleColumnPipe } from './dynamic-table-visible-column.pipe';

@NgModule({
  declarations: [DynamicTableVisibleColumnPipe],
  exports: [DynamicTableVisibleColumnPipe]
})
export class DynamicTableVisibleColumnPipeModule { }
