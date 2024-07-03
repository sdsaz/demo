import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterLimitPipe } from './character-limit.pipe';



@NgModule({
  declarations: [
    CharacterLimitPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CharacterLimitPipe
  ]
})
export class CharacterLimitModule { }
