//MODULES
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//DIRECTIVES
import { NoRightClickDirective } from './no-right-click.directive';

@NgModule({
  declarations: [
    NoRightClickDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    NoRightClickDirective
  ]
})
export class NoRightClickModule { }
