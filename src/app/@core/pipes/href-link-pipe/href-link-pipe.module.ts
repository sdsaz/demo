import { NgModule } from '@angular/core';
import { HrefLinkPipe } from './href-link.pipe';

@NgModule({
  declarations: [HrefLinkPipe],
  exports: [HrefLinkPipe]
})
export class HrefLinkPipeModule { }
