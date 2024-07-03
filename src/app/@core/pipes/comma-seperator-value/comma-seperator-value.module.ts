import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommaSeperatorValuePipe } from './comma-seperator-value.pipe';



@NgModule({
  declarations: [
    CommaSeperatorValuePipe
  ],
  imports: [
    CommonModule
  ], 
  exports:[
    CommaSeperatorValuePipe
  ]
})
export class CommaSeperatorValueModule { }
