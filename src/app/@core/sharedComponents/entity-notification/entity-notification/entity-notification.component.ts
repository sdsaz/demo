import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../common-helper';
import { CommonService } from '../../../sharedServices/common.service';
import { NotificationStatus, RefType, ReferenceType } from '../../../enum';
import { FormGroup, FormArray, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import { timeFrameValidatorForNotification } from '../../../sharedValidators/time-frame.validator';
import { TimeFrameToMinutesPipe } from '../../../pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
import {  durationRangeValidator } from '../../../sharedValidators/duration-range-validator';
import { TimeFramePipe } from '../../../pipes/time-frame-pipe/time-frame-pipe.pipe';


@Component({
  selector: 'ngx-entity-notification',
  templateUrl: './entity-notification.component.html',
  styleUrls: ['./entity-notification.component.scss']
})
export class EntityNotificationComponent implements OnInit {

  @Input() existingNotificationLists: any[] = [];
  @Input() activityId: number;

  notificationTypes: ReferenceType[] = [];
  
  entityNotificationForm: FormGroup;
  notificationArray: FormArray;

  validation_messages = {
    'typeID': [
      { type: 'required', message: 'CRM.ENTITY_NOTIFICATION_COMPONENT.ERROR_NOTIFICATION_REQUIRED' },
    ],
    'remindBeforeMins': [
      { type: 'required', message: 'CRM.ENTITY_NOTIFICATION_COMPONENT.ERROR_DURATION_REQUIRED' },
      { type: 'durationRangeValidator', message: 'CRM.ENTITY_NOTIFICATION_COMPONENT.ERROR_DURATION_RANGE' },
      { type: 'invalidTimeFrame', message: 'CRM.ENTITY_NOTIFICATION_COMPONENT.ERROR_DURATION_INVALID_FORMAT' }
    ]
  }

  maxMinutes: number;

  constructor(private _ngbActiveModal: NgbActiveModal, private _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _formBuilder: FormBuilder,
    private _timeFrameToMinutesPipe: TimeFrameToMinutesPipe,
    private _timeFramePipe: TimeFramePipe) {

  }

  ngOnInit(): void {
    Promise.all([
      this.getNotificationTypes(),
      this.getReminderTimespan()
    ]).then(() => {
      if (this.existingNotificationLists.length == 0) {
        this.entityNotificationForm = this._formBuilder.group({
          notificationArray: this._formBuilder.array([this.createNotification()])
        });
      } else {
        this.entityNotificationForm = this._formBuilder.group({
          notificationArray: this._formBuilder.array([])
        });

        this.existingNotificationLists.forEach(data => {
          this.notificationArray = this.entityNotificationForm.get('notificationArray') as FormArray;
          this.notificationArray.push(this.createNotification(data));
        });
      }
    });
  }

  private getNotificationTypes(): Promise<any> {
    return new Promise((resolve, reject) => {

      // storage key
      const storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.NotificationType}`;

      const notificationType = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (notificationType == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType({ refType: RefType.NotificationType })
          .then((response: ReferenceType[]) => {
            this._commonHelper.hideLoader();
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
            this.notificationTypes = response;
            resolve(null);
          }, (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      }
      else {
        this.notificationTypes = notificationType;
        resolve(null);
      }
    }).catch();
  }

  private getReminderTimespan(): Promise<any> {
    return new Promise((resolve, reject) => {

      // storage key
      const storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.ReminderTimespan}`;

      const notificationType = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (notificationType == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType({ refType: RefType.ReminderTimespan })
          .then((response: ReferenceType[]) => {
            this._commonHelper.hideLoader();
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
            this.maxMinutes = Number(response[0].intValue2);
            resolve(null);
          }, (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      }
      else {
        this.maxMinutes = Number(notificationType[0].intValue2);
        resolve(null);
      }
    }).catch();
  }

  createNotification(notificationDetail?: any) {
    if (!notificationDetail) {
      return this._formBuilder.group({
        id: 0,
        typeID: ["", Validators.required],
        remindBeforeMins: ["", Validators.compose([Validators.required, timeFrameValidatorForNotification(this.maxMinutes), durationRangeValidator(this.maxMinutes)])],
        statusID: NotificationStatus.Pending
      });
    } else {
      return this._formBuilder.group({
        id: notificationDetail.id,
        typeID: [notificationDetail.typeID, Validators.required],
        remindBeforeMins: [this._timeFramePipe.transform(notificationDetail.remindBeforeMins), Validators.compose([Validators.required, timeFrameValidatorForNotification(this.maxMinutes), durationRangeValidator(this.maxMinutes)])],
        statusID: notificationDetail.statusID
      });
    }

  }

  addRow(): void {

    if (this.entityNotificationForm.invalid) {
      this._commonHelper.validateAllFormFields(this.entityNotificationForm);
      return;
    }

    this.notificationArray = this.entityNotificationForm.get('notificationArray') as FormArray;
    if (this.notificationArray.length == this._commonHelper.maxNotification) return;
    this.notificationArray.push(this.createNotification());
  }

  removeRow(index: number) {
    (<FormArray>this.entityNotificationForm.get("notificationArray")).removeAt(index);
  }

  onCloseForm() {
    this._ngbActiveModal.close();
  }

  saveData() {

    if (this.entityNotificationForm.invalid) {
      this._commonHelper.validateAllFormFields(this.entityNotificationForm);
      return;
    }

    const payload: any = [];
    this.entityNotificationForm.controls.notificationArray['controls'].forEach((x: AbstractControl) => {
      payload.push(x.value);
    });

    payload.forEach(x => {
      x.remindBeforeMins = this._timeFrameToMinutesPipe.transform(x.remindBeforeMins);
    });

    this._ngbActiveModal.close(payload);
  }
}
