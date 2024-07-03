import { NgModule } from '@angular/core';
import { RemoveWhiteSpacePipe } from './remove-white-space.pipe';

@NgModule({
  declarations: [
    RemoveWhiteSpacePipe
  ],
  exports: [
    RemoveWhiteSpacePipe
  ]
})
export class RemoveWhiteSpaceModule { }
