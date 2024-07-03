import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IsEntityFieldHiddenPipe } from './is-entity-field-hidden.pipe';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    IsEntityFieldHiddenPipe
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    IsEntityFieldHiddenPipe
  ]
})
export class IsEntityFieldHiddenModule { }
