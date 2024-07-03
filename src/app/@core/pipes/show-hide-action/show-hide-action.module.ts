import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShowHideActionPipe } from './show-hide-action.pipe';




@NgModule({
  declarations: [
    ShowHideActionPipe
  ],
  imports: [
    CommonModule
  ], exports :[
    ShowHideActionPipe
  ]
})
export class ShowHideActionModule { }
