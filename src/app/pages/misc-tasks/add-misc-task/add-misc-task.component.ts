import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../@core/common-helper';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { PublicTenantSettings, RefType } from '../../../@core/enum';
import { WorkTasksService } from '../../worktasks/worktasks.service';
import * as moment from 'moment';
import { DateGreaterThan, FutureEndDate, FutureStartDate } from '../../../@core/sharedValidators/date-greater-than.validator';
import { SettingsService } from '../../settings/settings.service';
import { MaxDateDiff, MinDateDiff } from '../../../@core/sharedValidators/min-max-datediff-validator';


@Component({
  selector: 'ngx-add-misc-task',
  templateUrl: './add-misc-task.component.html',
  styleUrls: ['./add-misc-task.component.scss']
})

export class AddMiscTaskComponent implements OnInit {

  miscTaskForm: FormGroup;
  workTaskReason: any = null;
  dateTime = new Date();

  isInitialLoaded = false;

  duration: string = '00:00';

  validation_messages = {
    'reasonId': [
      { type: 'required', message: 'WORKTASK.MISCELINIOUSTASK.ADD_DIALOG.MESSAGE_REASON_REQUIRED' },
    ],
    'description': [
      { type: 'required', message: 'WORKTASK.MISCELINIOUSTASK.ADD_DIALOG.MESSAGE_DESCRIPTION_REQUIRED' },
      { type: 'maxlength', message: 'WORKTASK.MISCELINIOUSTASK.ADD_DIALOG.MESSAGE_DESCRIPTION_MAX' },
      { type: 'minlength', message: 'WORKTASK.MISCELINIOUSTASK.ADD_DIALOG.MESSAGE_DESCRIPTION_MIN' }
    ],
    "startTime": [
      { type: 'required', message: 'WORKTASK.MISCELINIOUSTASK.ADD_DIALOG.MESSAGE_STARTTIME_REQUIRED' },
      { type: 'futureStartDate', message: 'WORKTASK.MISCELINIOUSTASK.ADD_DIALOG.START_DATE_GREATERTHAN_CURRENTDATE' }
    ],
    "endTime": [
      { type: "required", message: "WORKTASK.MISCELINIOUSTASK.ADD_DIALOG.MESSAGE_ENDTIME_REQUIRED" },
      { type: 'dateGreaterThan', message: 'WORKTASK.MISCELINIOUSTASK.ADD_DIALOG.END_DATE_GREATERTHAN_STARTDATE' },
      { type: 'futureEndDate', message: 'WORKTASK.MISCELINIOUSTASK.ADD_DIALOG.END_DATE_GREATERTHAN_CURRENTDATE' },
    ]
  }

  minMinutes: number = 15;
  maxMinutes: number = 180;

  minMinutesToHR: string;
  maxMinutesToHR: string;

  constructor(private _ngbActiveModal: NgbActiveModal, private _formBuilder: FormBuilder,
    public _commonHelper: CommonHelper, private _commonService: CommonService,
    private _workTaskService: WorkTasksService,
    private _settingsService: SettingsService) {
  }

  ngOnInit(): void {

    Promise.all([
      this.getTaskMinMinutes(),
      this.getTaskMaxMinutes()
    ]).then(() => {
      
      this.minMinutesToHR = this.convertMinutesToFormat(this.minMinutes);
      this.maxMinutesToHR = this.convertMinutesToFormat(this.maxMinutes);

      this.getWorkTaskReason().then(() => {
        this.miscTaskForm = this.createMiscForm();
        this.isInitialLoaded = true;
        this.valueChangeObservable();
      });
    });

  }

  createMiscForm(): FormGroup {
    return this._formBuilder.group({
      reasonId: [undefined, Validators.required],
      startTime: [undefined, Validators.required],
      endTime: [undefined, Validators.required],
      description: [undefined, Validators.compose([Validators.required, Validators.maxLength(500), Validators.minLength(20)])]
    },
      {
        validator: [DateGreaterThan('endTime', 'startTime'), FutureEndDate('endTime'), FutureStartDate('startTime'), MinDateDiff('endTime', 'startTime', this.minMinutes), MaxDateDiff('endTime', 'startTime', this.maxMinutes)]
      });
  }

  //for close form
  onCloseForm(status: boolean) {
    this._ngbActiveModal.close(status);
  }

  private getTaskMinMinutes() {
    const minTaskMinutes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.MISC_TASK_MIN_TIME));
    if (minTaskMinutes == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.MISC_TASK_MIN_TIME).then((response: any) => {
          this.minMinutes = (response != null && !isNaN(Number(response))) ? Number(response) : 15;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.MISC_TASK_MIN_TIME, JSON.stringify(this.minMinutes));
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.minMinutes = minTaskMinutes;
    }
  }

  private getTaskMaxMinutes() {
    const maxTaskMinutes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.MISC_TASK_MAX_TIME));
    if (maxTaskMinutes == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.MISC_TASK_MAX_TIME).then((response: any) => {
          this.maxMinutes = (response != null && !isNaN(Number(response))) ? Number(response) : 180;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.MISC_TASK_MAX_TIME, JSON.stringify(this.maxMinutes));
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.maxMinutes = maxTaskMinutes;
    }
  }
  
  private getWorkTaskReason(): Promise<any> {
    return new Promise((resolve, reject) => {
      const params = { refType: RefType.WorkTaskReason };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.WorkTaskReason}`;

      const workTaskReasons = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (workTaskReasons == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params)
          .then((response: any) => {
            this._commonHelper.hideLoader();
            this.workTaskReason = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
            this.isInitialLoaded = true;
            resolve(null);
          }, (error) => {
            this._commonHelper.hideLoader();
            this.isInitialLoaded = false;
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      }
      else {
        this.workTaskReason = workTaskReasons;
        resolve(null);
      }
    });
  }

  saveMiscTask() {

    if (this.miscTaskForm.invalid) {
      this._commonHelper.validateAllFormFields(this.miscTaskForm);
      return;
    }

    const formValue = this.miscTaskForm.value;

    //set reasonName as WorkTask Name
    const reasonName = this.workTaskReason.find((x: any) => x.intValue1 == formValue.reasonId)?.name;

    const payload = {
      reasonId: formValue.reasonId,
      name: reasonName,
      startTime: moment(formValue.startTime).format("YYYY-MM-DDTHH:mm"),
      endTime: moment(formValue.endTime).format("YYYY-MM-DDTHH:mm"),
      description: formValue.description
    }

    this._commonHelper.showLoader();
    this._workTaskService.saveMiscTask(payload).then(res => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.MISCELINIOUSTASK.ADD_DIALOG.SUCCESS_MESSAGE'));
      this._ngbActiveModal.close(true);
    }, (err) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(err);
    });
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('WORKTASK.MISCELINIOUSTASK.ADD_DIALOG.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }

  valueChangeObservable() {
    this.miscTaskForm.get('startTime').valueChanges.subscribe(value => {
      if (value && this.miscTaskForm.get('endTime').value) {
        this.changeDurationLabel(this.miscTaskForm.get('endTime').value, value);
      }
    });

    this.miscTaskForm.get('endTime').valueChanges.subscribe(value => {
      if (value && this.miscTaskForm.get('startTime').value) {
        this.changeDurationLabel(value, this.miscTaskForm.get('startTime').value);
      }
    });
  }

  changeDurationLabel(endDate, startDate) {
    const end = new Date(moment(endDate).format("YYYY-MM-DD HH:mm")).getTime();
    const start = new Date(moment(startDate).format("YYYY-MM-DD HH:mm")).getTime();
    const minutes = Math.floor((end - start) / 60000);
    const result = this.toHoursAndMinutes(minutes);

    if (result) {
      if (result.hours < 0) {
        this.duration = '00';
      } else {
        this.duration = result.hours >= 0 && result.hours < 10 ? ('0' + result.hours) : String(result.hours);
      }

      if (result.minutes < 0) {
        this.duration += ':00';
      } else {
        this.duration += result.minutes >= 0 && result.minutes < 10 ? ':0' + result.minutes : ':' + String(result.minutes);
      }
    }
  }

  toHoursAndMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  }

  private convertMinutesToFormat(minutes): string {
    if (minutes < 60) {
      return minutes;
    }

    const conversion = this.toHoursAndMinutes(minutes);
    let convertedString = String(conversion.hours);
    if (conversion.minutes > 0) {
      convertedString += ':' + conversion.minutes;
    }
    return convertedString;
  }
}
