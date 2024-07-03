import { Component } from '@angular/core';
import { Location } from '@angular/common';
import * as moment from 'moment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { Entity, PublicTenantSettings, RefType } from '../../../@core/enum';
import { WorkTasksService } from '../../worktasks/worktasks.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { MaxDateDiff, MinDateDiff } from '../../../@core/sharedValidators/min-max-datediff-validator';
import { DateGreaterThan, FutureEndDate, FutureStartDate } from '../../../@core/sharedValidators/date-greater-than.validator';
import { SettingsService } from '../../settings/settings.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'ngx-misc-task-detail',
  templateUrl: './misc-task-detail.component.html',
  styleUrls: ['./misc-task-detail.component.scss']
})
export class MiscTaskDetailComponent {

  hasPermission: boolean = false;
  miscWorkTaskId: number = 0;
  miscWorkTask: any;
  entityId: number;
  entityTypeId: number = Entity.WorkTasks;
  isInitialLoading: boolean = true;
  miscTaskForm: FormGroup;
  workTaskReason: any = null;
  isLoaded: boolean = false;
  copyOfMiscWorkTask: any;
  entityRecordTypeId: number;
  totalSpentTime: any;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  
  // flag for details readonly
  isReadOnly: boolean = true;
  //user detail
  _loggedInUser: any;
  activeTab = '';
  selectedTab: string = '';
  navTabs: any[] = [];
  dateTime = new Date();

  // permissions
  isEditWorkTask: boolean = false;
  isViewWorkTask: boolean = false;
  isViewAllMiscTask: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isDeleteWorkTask: boolean = false;


  duration: string = '00:00';

  validation_messages = {
    'reasonId': [
      { type: 'required', message: 'WORKTASK.MISCELINIOUSTASK.DETAIL.MESSAGE_REASON_REQUIRED' },
    ],
    'description': [
      { type: 'required', message: 'WORKTASK.MISCELINIOUSTASK.DETAIL.MESSAGE_DESCRIPTION_REQUIRED' },
      { type: 'maxlength', message: 'WORKTASK.MISCELINIOUSTASK.DETAIL.MESSAGE_DESCRIPTION_MAX' },
      { type: 'minlength', message: 'WORKTASK.MISCELINIOUSTASK.DETAIL.MESSAGE_DESCRIPTION_MIN' }
    ],
    "startTime": [
      { type: 'required', message: 'WORKTASK.MISCELINIOUSTASK.DETAIL.MESSAGE_STARTTIME_REQUIRED' },
      { type: 'futureStartDate', message: 'WORKTASK.MISCELINIOUSTASK.DETAIL.START_DATE_GREATERTHAN_CURRENTDATE' }
    ],
    "endTime": [
      { type: "required", message: "WORKTASK.MISCELINIOUSTASK.DETAIL.MESSAGE_ENDTIME_REQUIRED" },
      { type: 'dateGreaterThan', message: 'WORKTASK.MISCELINIOUSTASK.DETAIL.END_DATE_GREATERTHAN_STARTDATE' },
      { type: 'futureEndDate', message: 'WORKTASK.MISCELINIOUSTASK.DETAIL.END_DATE_GREATERTHAN_CURRENTDATE' },
      
    ]
  }

  minMinutes: number = 15;
  maxMinutes: number = 180;

  minMinutesToHR: string;
  maxMinutesToHR: string;

  submitted: boolean = false;

  constructor(private _router: Router,
    public _commonHelper: CommonHelper,
    private _formBuilder: FormBuilder,
    private _activeRoute: ActivatedRoute,
    private _location: Location,
    private _workTasksService: WorkTasksService,
    private _commonService: CommonService,
    private _settingsService: SettingsService,
    private _confirmationDialogService: ConfirmationDialogService){
    this.isEditWorkTask = this._commonHelper.havePermission(enumPermissions.EditWorkTask);
    this.isViewWorkTask = this._commonHelper.havePermission(enumPermissions.ViewWorkTask);
    this.isViewAllMiscTask = this._commonHelper.havePermission(enumPermissions.ViewAllMiscTasks);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadWorkTaskDocument);
    this.isDeleteWorkTask = this._commonHelper.havePermission(enumPermissions.DeleteWorkTask);

    this.hasPermission = this.isEditWorkTask || this.isViewWorkTask;
    // If Record Edit then set record edit id
    this._activeRoute.params.subscribe(param => {
      if (param['id'] !== undefined) {
        if (param['id'] !== null) {
          this.miscWorkTaskId = param['id'];
          this.entityId = this.miscWorkTaskId;
        }
      }
    });
  }

  ngOnInit(): void {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    if (this.hasPermission) {
      Promise.all([
        this.getTaskMinMinutes(),
        this.getTaskMaxMinutes()
      ]).then(() =>{
        
        this.minMinutesToHR = this.convertMinutesToFormat(this.minMinutes);
        this.maxMinutesToHR = this.convertMinutesToFormat(this.maxMinutes);
      this.getWorkTaskReason().then(() => {
      this.getWorkTaskDetails();
      this.setDefaultNavTabs();
      });
    });
  }
  }

  getWorkTaskDetails() {
    this._commonHelper.showLoader();
    this.isInitialLoading = true;
    this._workTasksService.getMiscWorkTaskById(this.miscWorkTaskId, this.isViewAllMiscTask).then((response: any) => {
      if (response) {
        this.miscWorkTask = response;
        this.miscWorkTask.startTime = this.miscWorkTask.startTime != null ? new Date(moment(this.miscWorkTask.startTime).format("YYYY-MM-DD HH:mm")) : this.miscWorkTask.startTime;
        this.miscWorkTask.endTime = this.miscWorkTask.endTime != null ? new Date(moment(this.miscWorkTask.endTime).format("YYYY-MM-DD HH:mm")) : this.miscWorkTask.endTime;
        this.getDuration(this.miscWorkTask.startTime, this.miscWorkTask.endTime)
        //custom fields
        this.miscWorkTask.customFieldJSONData = this._commonHelper.tryParseJson(this.miscWorkTask.customFieldJSONData);
        // record type
        this.entityRecordTypeId = this.miscWorkTask.entityRecordTypeID;
        // copy detail
        this.copyOfMiscWorkTask = this._commonHelper.deepClone(this.miscWorkTask);

        // form
        this.miscTaskForm = this.createMiscTaskDetailForm();
        //get work task custom fields
      this._commonHelper.hideLoader();
      this.isInitialLoading = false;
      this.isLoaded = true;
    }else {
      this._commonHelper.hideLoader();
      this.isInitialLoading = false;
    }
  }, (error) => {
      this._commonHelper.hideLoader();
      this.isInitialLoading = false;
      this.getTranslateErrorMessage(error);
    });
  }

  getDuration(startTime, endTime) {
    const minutes = Math.floor((endTime - startTime) / 60000);
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

  // convenience getter for easy access to form fields
  get miscWorkTaskfrm() { return this.miscTaskForm.controls; }
  //create worktask form

  createMiscTaskDetailForm(): FormGroup {
    return this._formBuilder.group({
      id: [this.miscWorkTaskId],
      description: [this.miscWorkTask.description, Validators.compose([Validators.required, Validators.maxLength(500), Validators.minLength(20)])],
      reasonId: [this.miscWorkTask.priority, Validators.required],
      startTime: [this.miscWorkTask.startTime, Validators.required],
      endTime: [this.miscWorkTask.endTime, Validators.required],
    },
    {
      validator: [DateGreaterThan('endTime', 'startTime'), FutureStartDate('startTime'), FutureEndDate('endTime'), MinDateDiff('endTime', 'startTime', this.minMinutes), MaxDateDiff('endTime', 'startTime', this.maxMinutes)]
    });
  }
  //show hide detail tab with save

  showHideDetailTab(frmMode, formData) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.miscTaskForm.invalid) {
        this._commonHelper.validateAllFormFields(this.miscTaskForm);
        this.navigateToTabByValidation();
        return;
      }
      this.refreshActivity = true;

      Promise.all([
        this.saveData()
      ]).then(() => {
        this.isReadOnly = !this.isReadOnly;
        this.submitted = false;
      })
    } else if (frmMode === 'CANCEL') {
      this.miscWorkTask = this._commonHelper.deepClone(this.copyOfMiscWorkTask);
      this.isReadOnly = !this.isReadOnly;
      this.submitted = false;
    } else if (frmMode === 'EDIT' && this.isReadOnly) {
      this.isReadOnly = !this.isReadOnly;
      this.submitted = false;
    }
  }

  setTab(activeTab) {
    this.activeTab = activeTab;
    this.selectedTab = activeTab;
  }

  navigateToTabByValidation() {
    document.getElementById('btn_navDetails').click();
  }
  
  saveData() {
    return new Promise((resolve: any, reject: any) => {
      if (this.miscTaskForm.invalid) {
        this._commonHelper.validateAllFormFields(this.miscTaskForm);
        return;
      }
      const formValue = this.miscTaskForm.value;
      //set reasonName as WorkTask Name
      const reasonName = this.workTaskReason.find((x: any) => x.intValue1 == formValue.reasonId)?.name;

      const payload = {
        Id: this.miscWorkTaskId,
        reasonId: formValue.reasonId,
        name: reasonName,
        startTime: moment(formValue.startTime).format("YYYY-MM-DDTHH:mm"),
        endTime: moment(formValue.endTime).format("YYYY-MM-DDTHH:mm"),
        description: formValue.description
      }

      this._commonHelper.showLoader();
      this._workTasksService.saveMiscTask(payload).then(res => {
        this.getWorkTaskDetails();
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.MISCELINIOUSTASK.DETAIL.SUCCESS_MESSAGE'));
        resolve(null)
      }, (err) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(err);
        if (err.messageCode?.toLowerCase() != 'staticmessage') {
          this.getWorkTaskDetails();
          resolve(null)
        } else {
          reject(null)
        }
      });
    })
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('WORKTASK.MISCELINIOUSTASK.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }else if (error.messageCode.toLowerCase() == 'staticmessage') {
      this._commonHelper.showToastrError(error.message);
    }
  }

  onBack() {
    this._location.back();
  }

  closeForm() {
    this._router.navigate(['/misctasks/list/']);
  }

  setRefreshEntityTag() {
    this.refreshEntityTag = !this.refreshEntityTag;
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

  private convertMinutesToFormat(minutes): string {
    if (minutes < 60) {
      return minutes;
    }

    const conversion = this.toHoursAndMinutes(minutes);
    let convertedString = String(conversion.hours);
    if (conversion.minutes > 0) {
      convertedString += ':'+ conversion.minutes;
    }
    return convertedString;
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
            this.isLoaded = true;
            resolve(null);
          }, (error) => {
            this._commonHelper.hideLoader();
            this.isLoaded = false;
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

  private setDefaultNavTabs(): void {
    this.navTabs = [
      { tabName: 'WORKTASK.MISCELINIOUSTASK.DETAIL.DETAILS_TAB.TITLE', tabLink: 'navDetails', isFirst: true, condition: true, displayOrder: 101 },
    ];
    if (this.selectedTab == '')
      this.selectedTab = this.navTabs[0].tabLink;
  }

  onDeleteWorkTaskClick(workTaskId) {
    const optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('WORKTASK.MISCELINIOUSTASK.DETAIL.MESSAGE_CONFIRM_WORKTASK_DELETE', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._workTasksService.deleteWorkTask(workTaskId).then(() => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('WORKTASK.MISCELINIOUSTASK.DETAIL.MESSAGE_WORKTASK_DELETE')
            );
            // Redirect misctasks Listing Page.
            this._router.navigateByUrl('/misctasks');
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }
      })
      .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.MISCELINIOUSTASK.DETAIL.WORKTASK_DISMISS_DIALOG')));
  }
  
}


