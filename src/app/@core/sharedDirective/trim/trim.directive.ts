import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[trim]'
})
export class TrimDirective {

  private validators: any;

  constructor(private elementRef: ElementRef, private formControl: NgControl) { }

  @HostListener("focus")
  onFocus($event) {
    this.validators = this.formControl.control.validator;
  }

  @HostListener("blur")
  onBlur(event: any) {
    const textValue: string = this.elementRef.nativeElement.value;
    if (textValue) {
      this.elementRef.nativeElement.value = textValue.trim();
      this.formControl.control.setValue(textValue.trim());
    }
    
    this.formControl.control.setValidators(this.validators);
    this.formControl.control.updateValueAndValidity();
  }

}
