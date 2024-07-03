//MODULES
import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[ngxPreventScreenshot]'
})
export class PreventScreenshotDirective {

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: any) {
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
      (event.key == 'PrintScreen' || event.keyCode == 44) // Print Screen
      ||
      (event.ctrlKey && (event.key == 'PrintScreen' || event.keyCode == 44)) // Ctrl + Print Screen
      ||
      (event.ctrlKey && event.shiftKey && (event.key == 'PrintScreen' || event.keyCode == 44)) // Ctrl + Shift + Print Screen
      ||
      ((event.metaKey || event.key == "Meta" || event.keyCode == 91) && (event.key == 'PrintScreen' || event.keyCode == 44)) // Windows + Print Screen
      ||
      ((event.metaKey || event.key == "Meta" || event.keyCode == 91) && event.shiftKey && (event.key == 'PrintScreen' || event.keyCode == 44)) // Windows + Shift + Print Screen
      ||
      ((event.metaKey || event.key == "Meta" || event.keyCode == 91) && event.shiftKey && (event.key == '3' || event.keyCode == 99)) // Windows + Shift + 3 (For Mac)
      ||
      ((event.metaKey || event.key == "Meta" || event.keyCode == 91) && event.shiftKey && (event.key == '4' || event.keyCode == 100)) // Windows + Shift + 4 (For Mac)
    ) {      
      return false;
    }
    return true;
  }
}
