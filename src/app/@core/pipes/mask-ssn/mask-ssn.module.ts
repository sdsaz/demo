import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaskSsnPipe } from './mask-ssn.pipe';



@NgModule({
  declarations: [
    MaskSsnPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    MaskSsnPipe
  ]
})
export class MaskSsnModule { }
