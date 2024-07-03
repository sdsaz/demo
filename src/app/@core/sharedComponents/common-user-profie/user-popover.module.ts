import { NgModule } from '@angular/core';
import { StickyPopoverDirective } from './user-popover.directive';

@NgModule({
  declarations: [
    StickyPopoverDirective
  ],
  exports: [
    StickyPopoverDirective
  ],
})
export class StickyPopoverModule { }
