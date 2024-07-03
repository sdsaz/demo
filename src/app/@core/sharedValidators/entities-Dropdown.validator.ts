import { AbstractControl, FormGroup } from '@angular/forms';

// custom validator to check that two fields match
export function ValidateDropdown(control: AbstractControl) {

    if (!control.value.entityTypeID) {
        return { required: true };
      }
      return null;
}