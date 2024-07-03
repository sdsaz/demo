import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateMaskDirective } from './date-mask.directive';



@NgModule({
  declarations: [
    DateMaskDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    DateMaskDirective
  ]
})
export class DateMaskModule { }
