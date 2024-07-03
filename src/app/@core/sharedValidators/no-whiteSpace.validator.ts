import { AbstractControl, FormGroup, UntypedFormControl } from '@angular/forms';

// custom validator to check no white Space

export function noWhitespaceValidator(control: UntypedFormControl) {
  const isWhitespace = (control && control.value && control.value.toString() || '').trim().length === 0;
  const isValid = !isWhitespace;
  return isValid ? null : { 'whitespace': true };
}