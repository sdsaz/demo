//MODULES
import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[ngxPreventPrintWithInspectElement]'
})
export class PreventPrintWithInspectElementDirective {

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: any): void {
    if (!this.isValidKey(event)) {

      if (navigator?.clipboard) {
        navigator?.clipboard?.writeText('');
      }
      event.cancelBubble = true;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  isValidKey(event: any): boolean {
    if (
      event.keyCode == 123 //Inspect Element
      ||
      (event.ctrlKey && event.shiftKey && event.keyCode == 'I'.charCodeAt(0)) //Inspect Element
      ||
      (event.ctrlKey && event.shiftKey && event.keyCode == 'J'.charCodeAt(0)) //Inspect Element
      ||
      (event.ctrlKey && event.shiftKey && event.keyCode == 'C'.charCodeAt(0)) //Inspect Element
      ||
      (event.ctrlKey && event.keyCode == 'U'.charCodeAt(0)) //View Source
      ||
      (event.ctrlKey && (event.key == 'P'  || event.keyCode == 'P'.charCodeAt(0))) //Ctrl + P 
      ||
      (event.ctrlKey && event.shiftKey && (event.key == 'P'  || event.keyCode == 'P'.charCodeAt(0))) //Ctrl + Shift + P
      ||
      ((event.metaKey || event.key == "Meta" || event.keyCode == 91)) //Windows Key
    ) {
      return false;
    }
    return true;
  }
}
