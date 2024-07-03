import { NgModule } from '@angular/core';
import { AvatarPersonNamePipe } from './avatar-person-name-pipe';


@NgModule({
  imports: [
  ],
  declarations: [
    AvatarPersonNamePipe
  ],
  exports: [
    AvatarPersonNamePipe
  ]
})
export class AvatarPersonNamePipeModule { }