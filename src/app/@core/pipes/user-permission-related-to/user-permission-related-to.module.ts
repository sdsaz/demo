import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserPermissionRelatedToPipe } from './user-permission-related-to.pipe';



@NgModule({
  declarations: [
    UserPermissionRelatedToPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    UserPermissionRelatedToPipe
  ]
})
export class UserPermissionRelatedToModule { }
