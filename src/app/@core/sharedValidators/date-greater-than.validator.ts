import { UntypedFormGroup } from '@angular/forms';

export function DateGreaterThan(toControlName: string, fromControlName: string) {
    return (formGroup: UntypedFormGroup) => {
        const to = formGroup.controls[toControlName];
        const from = formGroup.controls[fromControlName];
        if (to.errors && !to.errors.dateGreaterThan) {
        return;
        }

        if ((from !== null  && to !== null && from.value && to.value) && to.value < from.value) {
        to.setErrors({ dateGreaterThan: true });
        } else {
        to.setErrors(null);
        }
    }
}

export function FutureStartDate(fromControlName: string) {
    return (formGroup: UntypedFormGroup) => {
        const from = formGroup.controls[fromControlName];
        const date = new Date()
        if (from.errors && !from.errors.futureStartDate) {
        return;
        }

        if ((from !== null && from.value) && from.value > date ) {
        from.setErrors({ futureStartDate: true });
        } else {
        from.setErrors(null);
        }
    }
}

export function FutureEndDate(toControlName: string) {
    return (formGroup: UntypedFormGroup) => {
        const to = formGroup.controls[toControlName];
        const date = new Date()
        if (to.errors && !to.errors.futureEndDate) {
        return;
        }

        if ((to !== null && to.value) && to.value > date ) {
        to.setErrors({ futureEndDate: true });
        } else {
        to.setErrors(null);
        }
    }
}