import { NgModule } from '@angular/core';
import { TrimValueDirective } from './trim-value.directive';

@NgModule({
  declarations: [
    TrimValueDirective
  ],
  exports: [
    TrimValueDirective
  ],
})
export class TrimValueModule { }
