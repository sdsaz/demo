import { NgModule } from '@angular/core';
import { HasPermissionPipe } from './has-permission.pipe';

@NgModule({
  declarations: [HasPermissionPipe],
  exports: [HasPermissionPipe]
})
export class HasPermissionPipeModule { }
