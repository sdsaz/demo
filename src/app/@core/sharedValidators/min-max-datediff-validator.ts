import { UntypedFormGroup } from "@angular/forms";
import * as moment from "moment";

export function MinDateDiff(endTime: string, startTime: string, minDiff: number) {
    return (formGroup: UntypedFormGroup) => {
        const endDuration = formGroup.controls[endTime];

        if (endDuration.errors && !endDuration.errors.minDateDiff) {
            return;
        }

        const startDuration = formGroup.controls[startTime];

        if (endDuration.value && startDuration.value) {
            const end = new Date(moment(endDuration.value).format("YYYY-MM-DD HH:mm")).getTime();
            const start = new Date(moment(startDuration.value).format("YYYY-MM-DD HH:mm")).getTime();
            if (Math.floor((end - start) / 60000) < minDiff) {
                endDuration.setErrors({ minDateDiff: true });
            } 
            else if (Math.floor((end - start) / 60000) >= 0 && Math.floor((end - start) / 60000) < 0) {
                endDuration.setErrors({ dateGreaterThan: true });
            } else {
                endDuration.setErrors(null);
            }
        } else if (!startDuration.value && endDuration.value) {
            endDuration.setErrors(null);
        } else {
            return;
        }
    }
}

export function MaxDateDiff(endTime: string, startTime: string, maxDiff: number) {
    return (formGroup: UntypedFormGroup) => {
        const endDuration = formGroup.controls[endTime];

        if (endDuration.errors && !endDuration.errors.maxDateDiff) {
            return;
        }

        const startDuration = formGroup.controls[startTime];

        if (endDuration.value && startDuration.value) {
            const end = new Date(moment(endDuration.value).format("YYYY-MM-DD HH:mm")).getTime();
            const start = new Date(moment(startDuration.value).format("YYYY-MM-DD HH:mm")).getTime();

            if (Math.floor((end - start) / 60000) > maxDiff) {
                endDuration.setErrors({ maxDateDiff: true });
            } 
            else if (Math.floor((end - start) / 60000) < 0) {
                endDuration.setErrors({ dateGreaterThan: true })
            }  else if (Math.floor((end - start) / 60000) == 0) {
                endDuration.setErrors({ minDateDiff: true })
            }  else {
                endDuration.setErrors(null);
            }
        } else if (!startDuration.value && endDuration.value) {
            endDuration.setErrors(null);
        } else {
            return;
        }
    }
}