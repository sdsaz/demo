import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisplayValueFinderPipe } from './display-value-finder.pipe';



@NgModule({
  declarations: [
    DisplayValueFinderPipe
  ],
  imports: [
    CommonModule
  ], 
  exports:[
    DisplayValueFinderPipe
  ]
})
export class DisplayValueFinderModule { }
