//MODULES
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//DIRECTIVES
import { PreventPrintWithInspectElementDirective } from './prevent-print-with-inspect-element.directive';

@NgModule({
  declarations: [
    PreventPrintWithInspectElementDirective
  ],
  imports: [
    CommonModule
  ], 
  exports: [
    PreventPrintWithInspectElementDirective
  ]
})
export class PreventPrintWithInspectElementModule { }
