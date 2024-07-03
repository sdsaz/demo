import { AbstractControl, UntypedFormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { TimeFrameToMinutesPipe } from '../pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
import {  durationRangeValidator } from './duration-range-validator';

// custom validator to check no white Space

export function timeFrameValidator(isRequired?: boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    isRequired = isRequired == null ? true : isRequired;
    if (control && control.value.toString().trim() != '') {
      const valueWOWitespace = control.value.toString().replace(/\s/g, '');
      const isValid = new RegExp('^(?:\\d+(w|W))?(?:\\d+(d|D))?(?:\\d+(h|H))?(?:\\d+(m|M))?$').test(valueWOWitespace);

      if (isValid) {
        const week = valueWOWitespace.match('\\d+(w|W)');
        const day = valueWOWitespace.match('\\d+(d|D)');
        const hour = valueWOWitespace.match('\\d+(h|H)');
        const min = valueWOWitespace.match('\\d+(m|M)');

        let value = week?.length > 0 ? (week[0] + ' ') : '';
        value += day?.length > 0 ? (day[0] + ' ') : '';
        value += hour?.length > 0 ? (hour[0] + ' ') : '';
        value += min?.length > 0 ? min[0] : '';

        if (new TimeFrameToMinutesPipe().transform(value) >= 2147483647) {
          return { 'timeTooLarge': true };
        }

        control.setValidators(null);
        control.updateValueAndValidity();
        control.setValue(value.trim());
        control.setValidators(timeFrameValidator(isRequired));

        return null;
      }
      else {
        return { 'invalidTimeFrame': true };
      }
    }
    else {
      return isRequired ? { 'required': true } : null;
    }
  }
}


export function timeFrameValidatorForNotification(maxMinutes: number) : ValidatorFn {

  return (control: AbstractControl): ValidationErrors | null => {
    if (control && control.value.toString().trim() != '') {
      const valueWOWhiteSpace = control.value.toString().replace(/\s/g, '');
      const isValid = new RegExp('^(?:\\d+(w|W))?(?:\\d+(d|D))?(?:\\d+(h|H))?(?:\\d+(m|M))?$').test(valueWOWhiteSpace);
  
      if (isValid) {
        const week = valueWOWhiteSpace.match('\\d+(w|W)');
        const day = valueWOWhiteSpace.match('\\d+(d|D)');
        const hour = valueWOWhiteSpace.match('\\d+(h|H)');
        const min = valueWOWhiteSpace.match('\\d+(m|M)');
  
        let value = week?.length > 0 ? (week[0] + ' ') : '';
        value += day?.length > 0 ? (day[0] + ' ') : '';
        value += hour?.length > 0 ? (hour[0] + ' ') : '';
        value += min?.length > 0 ? min[0] : '';
  
        if (new TimeFrameToMinutesPipe().transform(value) >= 2147483647) {
          return { 'timeTooLarge': true };
        }
  
        control.setValidators(null);
        control.updateValueAndValidity();
        control.setValue(value.trim());
        control.setValidators(Validators.compose([Validators.required, timeFrameValidatorForNotification(maxMinutes), durationRangeValidator(maxMinutes)]));
  
        return null;
      }
      else {
        return { 'invalidTimeFrame': true };
      }
    }
    else {
      return { 'required': true };
    }
  }
  
}