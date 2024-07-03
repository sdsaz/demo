import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeFramePipe } from './time-frame-pipe.pipe';



@NgModule({
  declarations: [
    TimeFramePipe
  ],
  imports: [
    CommonModule
  ],
  exports:[
    TimeFramePipe
  ]
})
export class TimeFramePipeModule { }
