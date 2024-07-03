import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimeFrameToMinutesPipe } from './time-frame-to-minutes.pipe';



@NgModule({
  declarations: [
    TimeFrameToMinutesPipe
  ],
  imports: [
    CommonModule
  ]
})
export class TimeFrameToMinutesModule { }
