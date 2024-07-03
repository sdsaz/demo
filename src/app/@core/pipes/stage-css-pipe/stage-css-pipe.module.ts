import { NgModule } from '@angular/core';
import { StageCssPipe } from './stage-css.pipe';

@NgModule({
  declarations: [StageCssPipe],
  exports: [StageCssPipe]
})
export class StageCssPipeModule { }
