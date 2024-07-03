import { Injector } from "@angular/core";
import { TimeFrameToMinutesPipe } from "../pipes/time-frame-to-minutes/time-frame-to-minutes.pipe";
import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { TimeFramePipe } from "../pipes/time-frame-pipe/time-frame-pipe.pipe";
import { timeFrameValidatorForNotification } from "./time-frame.validator";


export function durationRangeValidator(maxMinutes: number): ValidatorFn {

    return (control: AbstractControl): ValidationErrors | null => {

        let injector = Injector.create([{ provide: TimeFrameToMinutesPipe, useClass: TimeFrameToMinutesPipe, deps: [] }])
        let service = injector.get(TimeFrameToMinutesPipe);

        let injector1 = Injector.create([{ provide: TimeFramePipe, useClass: TimeFramePipe, deps: [] }])
        let service1 = injector1.get(TimeFramePipe);

        if (control.value) {
            const minutes = service.transform(control.value);
            if (minutes > maxMinutes) {
                const formattedString = service1.transform(minutes);
                control.setValidators(null);
                control.updateValueAndValidity();
                control.setValue(formattedString);
                control.setValidators(Validators.compose([Validators.required, timeFrameValidatorForNotification(maxMinutes), durationRangeValidator(maxMinutes)]));
                return { 'durationRangeValidator': true };
            }
        }

        return;
    }
}

