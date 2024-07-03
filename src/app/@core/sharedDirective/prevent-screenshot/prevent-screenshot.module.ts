import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreventScreenshotDirective } from './prevent-screenshot.directive';



@NgModule({
  declarations: [
    PreventScreenshotDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PreventScreenshotDirective
  ]
})
export class PreventScreenshotModule { }
