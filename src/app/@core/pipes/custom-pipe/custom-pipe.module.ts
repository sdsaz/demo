import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { CustomPipe } from './custom-pipe.pipe';



@NgModule({
  declarations: [
    CustomPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CustomPipe
  ],
  providers: [
    DatePipe, 
    DecimalPipe
  ]
})
export class CustomPipeModule { }
