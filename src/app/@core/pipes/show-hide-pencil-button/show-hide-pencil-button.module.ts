import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShowHidePencilButtonPipe } from './show-hide-pencil-button.pipe';



@NgModule({
  declarations: [
    ShowHidePencilButtonPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [ ShowHidePencilButtonPipe ]
})
export class ShowHidePencilButtonModule { }
