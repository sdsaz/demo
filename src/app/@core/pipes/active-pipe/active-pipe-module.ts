import { NgModule } from '@angular/core';
import { ActivePipe } from './active-pipe';

@NgModule({
  imports: [
    // dep modules
  ],
  declarations: [ 
    ActivePipe
  ],
  exports: [
    ActivePipe
  ]
})
export class ActivePipeModule {}