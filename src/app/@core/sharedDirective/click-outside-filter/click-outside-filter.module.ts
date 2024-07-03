import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideFilterDirective } from './click-outside-filter.directive';

@NgModule({
  declarations: [
    ClickOutsideFilterDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ClickOutsideFilterDirective
  ],
})
export class ClickOutsideFilterModule { }
