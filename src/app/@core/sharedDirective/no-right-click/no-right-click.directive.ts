//MODULES
import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[ngxNoRightClick]'
})
export class NoRightClickDirective {
  
  @HostListener('contextmenu', ['$event'])
  onRightClick(event: any) {
    event.preventDefault();
  }
}
