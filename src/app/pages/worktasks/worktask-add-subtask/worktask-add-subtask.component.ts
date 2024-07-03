//ANGULAR
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { DataSources, Entity, FieldNames, LocalStorageKey, PrivacyLevels, PublicTenantSettings, RefType } from '../../../@core/enum';
//SERVICES
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { WorkTasksService } from '../worktasks.service';
import { SettingsService } from '../../settings/settings.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
//OTHER
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ngx-worktask-add-subtask',
  templateUrl: './worktask-add-subtask.component.html',
  styleUrls: ['./worktask-add-subtask.component.scss']
})
export class WorktaskAddSubTaskComponent implements OnInit {

  @Input() parentId: number = null;
  @Input() entityId: number = null;
  @Input() entityTypeId: number = null;
  entityRecordTypeId: number = null;
  @Input() workflows: any;
  @Input() dialogTitle: string = '';
  @Input() workflowSelectLabel: string = '';
  @Input() workflowSelectPlaceholder: string = '';
  @Input() parentEntityTypeId: number;
  @Input() typeId: number = null;
  @Input() parentTypeId: number = null;
  @Input() entityHiddenFieldSettings: any;
  @Input() sectionCodes: any;

  @Input() parentPrivacyLevel?: number;

  entitySubTypes: any;
  showTypeLoader: boolean = false;
  isShowTypes: boolean = true;

  assignedToUsers: any = null; //assigned to users
  assignedToPlaceholder = 'WORKTASK.ADD_DIALOG.ASSIGNED_TO_PLACEHOLDER';

  //save Flag
  submitted = false;
  isInitialLoaded = false;
 
  //Record types
   @Input() entityRecordTypes: any;
   isShowRecordTypes: boolean = true;
   copyOfRecordTypes: any;

   @Input() relatedEntityTypeId: number;
   copyOfWorkflows: any;
   isShowWorkFlow: boolean = true;

  //work task
  workTaskModel: any = {
    id: 0,
    tenantId: 0,
    entityWorkflowId: null,
    entityRecordTypeId: null,
    entityTypeId: null,
    entityId: null,
    name: '',
    description: '',
    relatedTo: null,
    assignedTo: null,
    customFieldJSONData: '',
    typeId: null
  };
  workTaskForm: UntypedFormGroup;
  entityWorkflowId: 0;
  //user detail
  _loggedInUser: any;

  validation_messages = {
    'name': [
      { type: 'required', message: 'WORKTASK.ADD_DIALOG.NAME_REQUIRED' },
      { type: 'maxlength', message: 'WORKTASK.ADD_DIALOG.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'WORKTASK.ADD_DIALOG.MESSAGE_NAME_MIN' }
    ],
    'description': [
      { type: 'minlength', message: 'WORKTASK.ADD_DIALOG.MESSAGE_DESCRIPTION_MIN' }
    ],
    'entityWorkflowId': [
      { type: 'required', message: 'WORKTASK.ADD_DIALOG.WORKFLOW_REQUIRED' }
    ],
    'typeId': [
      { type: 'required', message: 'WORKTASK.ADD_DIALOG.TYPE_REQUIRED' }
    ],
    'entityRecordTypeId': [
      { type: 'required', message: 'WORKTASK.ADD_DIALOG.RECORDTYPE_REQUIRED' }
    ],
  }

  //----------- Privacy Level ----------------
  privacyLevels: any = [];
  isShowPrivacyLevels: boolean = false;
  showPrivacyLevelLoader: boolean = false;
  privacyLevelGeneralSettingValue?: number;
  //----------------------------------------

  isAssignWorkTask: boolean = false;

  fieldNames = FieldNames;
  
  workTaskEntityTypeID = Entity.WorkTasks;

  ownerDetail: any;
  
  constructor(private _ngbActiveModal: NgbActiveModal,
    private _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _workTaskService: WorkTasksService,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService,
    private _commonService: CommonService) { }

  ngOnInit(): void {

    this.isAssignWorkTask = this._commonHelper.havePermission(enumPermissions.AssignWorkTask);
    
    Promise.all([
      this.getTenantSettingsForPrivacyLevel(),
      this.getEntitySubTypes()
    ]).then((results: any) => {
      if (this.typeId == null) {
        let entitySubTypeLevel = this.entitySubTypes?.find(x => x.id == this.parentTypeId)?.level + 1 ?? null;
        this.entitySubTypes = this.entitySubTypes?.filter(x => x.parentID == this.parentTypeId && x.level == entitySubTypeLevel);

        if (this.entitySubTypes && this.entitySubTypes.length > 0) {
          if (this.entitySubTypes.length == 1) {
            this.workTaskModel.typeId = this.entitySubTypes[0].id;
            this.isShowTypes = false;
          }
        }
        else {
          this.isShowTypes = false;
        }
      }
      else {
        this.workTaskModel.typeId = this.typeId;
        this.isShowTypes = false;
      }

      this.workTaskForm = this.createWorkTaskForm();

      if(!this.isShowTypes){
        this.workTaskForm.controls['typeId'].clearValidators();
        this.workTaskForm.controls['typeId'].updateValueAndValidity();
      }

      //loaded
      this.isInitialLoaded = true;

      this.privacyLevelGeneralSettingValue = Number.parseInt(results[0]);
      if (this.parentPrivacyLevel && this.parentPrivacyLevel == PrivacyLevels.OnlyMe) {
        this.workTaskForm.controls['privacyLevel'].patchValue(this.parentPrivacyLevel);
        this.workTaskForm.controls['privacyLevel'].updateValueAndValidity();
        this.isShowPrivacyLevels = false;
        this.privacyLevels = [];
      } else if (this.privacyLevelGeneralSettingValue == PrivacyLevels.None) {
        this.workTaskForm.controls['privacyLevel'].patchValue(0);
        this.workTaskForm.controls['privacyLevel'].updateValueAndValidity();
        this.isShowPrivacyLevels = false;
        this.privacyLevels = [];
      } else {
        this.getPrivacyLevelRefererence();
        this.isShowPrivacyLevels = true;
        this.workTaskForm.controls['privacyLevel'].patchValue(this.privacyLevelGeneralSettingValue);
        this.workTaskForm.controls['privacyLevel'].updateValueAndValidity();
      }
       // Record Types
    if (this.entityRecordTypes && this.entityRecordTypes.length == 1) {
      this.copyOfRecordTypes = this._commonHelper.deepClone(this.entityRecordTypes)
      this.isShowRecordTypes = false;
      this.entityRecordTypeId = this.entityRecordTypes[0].value;
      this.relatedEntityTypeId = this.entityRecordTypes[0].relatedToEntityTypeId;

      this.workTaskForm.controls['entityRecordTypeId'].patchValue(this.entityRecordTypes.find(x=> x.value == this.entityRecordTypeId));
      this.workTaskForm.controls['entityRecordTypeId'].updateValueAndValidity();
    }
    else if (this.entityRecordTypes && this.entityRecordTypes.length > 0) {
      this.copyOfRecordTypes = this._commonHelper.deepClone(this.entityRecordTypes)
    }
    else {
      this.isShowRecordTypes = false;
    }

    // Workflows
    if (this.workflows && this.workflows.length == 1) {
      this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
      this.isShowWorkFlow = false;
      this.entityWorkflowId = this.workflows[0].value;
      this.workTaskForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
      this.workTaskForm.controls['entityWorkflowId'].clearValidators();
      this.workTaskForm.controls['entityWorkflowId'].updateValueAndValidity();
      this.getTeamOwnerDetail();
    }
    else if (this.workflows && this.workflows.length > 0) {
      this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows);
      if (this.copyOfRecordTypes.length == 1) {
        this.workflows = this.workflows?.filter(x => x.isDefault || x.parentEntityTypeID == this.parentEntityTypeId);
      }
      else 
      {
        this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
      }
    }
    else {
      this.isShowWorkFlow = false;
      if (this.workflows.length <= 0) {
        this.workTaskForm.controls['entityWorkflowId'].clearValidators();
        this.workTaskForm.controls['entityWorkflowId'].updateValueAndValidity();
      }
    }
      // Get Assigned To users
      if (this.isAssignWorkTask) {
        this.getAssignedToUsers(null, 1, null);
      }
      this.entityWorkflowId = null;
    });
  }

  createWorkTaskForm(): UntypedFormGroup {
    //empty custom fields
    var customFields: any = {};

    return this._formBuilder.group({
      id: 0,
      tenantId: 0,
      parentId: this.parentId,
      entityTypeId: this.entityTypeId,
      entityId: this.entityId,
      entityWorkflowId: this.workTaskModel.entityWorkflowId,
      entityRecordTypeId: this.entityRecordTypeId,
      name: [this.workTaskModel.name, Validators.compose([Validators.required, Validators.maxLength(500), Validators.minLength(2)])],
      description: [this.workTaskModel.description, Validators.compose([Validators.minLength(2)])],
      assignedTo: [this.workTaskModel.assignedTo],
      customFieldJSONData: customFields,
      typeId: [this.workTaskModel.typeId,Validators.compose([Validators.required])],
      privacyLevel: null
    });
  }

  workflowOnChange(e) {
    if(e.value) {
      this.entityWorkflowId = e.value;
      if (this.isAssignWorkTask) {
        this.getAssignedToUsers(null, 1, '');
      }
      this.getTeamOwnerDetail();
    }
  }

  assignedToOnFilter(e) {
    this.getAssignedToUsers(e.value, 0, e.filter);
  }

  assignedToOnChange(e) {
    if (!e.value) {
      this.getAssignedToUsers(e.value, 1, null);
    }
  }

  // get assigned to users
  getAssignedToUsers(assignedTo, includeAllUsers, searchString) {
    this._commonHelper.showLoader();
    let defaultStageID = this.workflows?.find(x => x.value == this.entityWorkflowId)?.defaultStageID;
    
    // prepare params
    var params = this.prepareParamsForAssignedToUsers(defaultStageID, assignedTo, includeAllUsers, searchString);
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKASSIGNEDTO, params).then((response: any) => {
      //assigned to users
      if (response != undefined) {
        // users to assign to dropdwon
        this.assignedToUsers = response as [];
      }
      this._commonHelper.hideLoader();
    }, (error) => {
      this._commonHelper.hideLoader();
    });
  }

  // prepare params for datasource with required fields
  prepareParamsForAssignedToUsers(stageId, assignedTo, includeAllUsers, searchString) {
    const params = [];
    const paramItem = {
      name: 'EntityWorkflowID',
      type: 'int',
      value: this.entityWorkflowId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'StageID',
      type: 'int',
      value: stageId
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SelectedUserID',
      type: 'int',
      value: assignedTo
    };
    params.push(paramItem2);

    const paramItem3 = {
      name: 'IncludeAllUsers',
      type: 'bit',
      value: includeAllUsers
    };
    params.push(paramItem3);

    const paramItem4 = {
      name: 'SearchString',
      type: 'string',
      value: searchString
    };
    params.push(paramItem4);

    return params;
  }

  //For Form Validate
  validateAllFormFields(formGroup: UntypedFormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      }
      else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  //save work task
  saveWorkTask(formData) {
    this.submitted = true;
    if (this.workTaskForm.invalid) {
      this.validateAllFormFields(this.workTaskForm);
      return;
    }

    //empty custom fields
    var customFields: any = {};

    //prepare params
    let params = {
      id: 0,
      tenantId: 0,
      parentId: this.parentId,
      entityTypeId: this.entityTypeId,
      entityId: this.entityId,
      entityWorkflowId: formData.entityWorkflowId,
      entityRecordTypeId: this.entityRecordTypeId,
      name: formData.name,
      description: formData.description,
      assignedTo: formData.assignedTo,
      customFieldJSONData: customFields,
      typeId: formData.typeId,
      privacyLevel: this.workTaskForm.get('privacyLevel').value
    }

    this._commonHelper.showLoader();
    // save work task
    this._workTaskService.updateWorkTask(params).then(response => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.ADD_SUBTASK_DIALOG.SUCCESS_MESSAGE', { entitySubTypeName: this.entitySubTypes.find(x=>x.id==params.typeId)?.name ?? '' }));
      this._ngbActiveModal.close(true);
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error != null && String(error.messageCode).toLowerCase() === 'worktasks.pausedorinactiveerror') {
          this._ngbActiveModal.close(true);
        }
      });
  }

  //for close form
  onCloseForm(status: boolean) {
    this._ngbActiveModal.close(status);
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('WORKTASK.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

  private getEntitySubTypes() {
    return new Promise((resolve, reject) => {
      let storageKey = `${LocalStorageKey.ALLENTITYSUBTYPES}`;
      const allEntitySubTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntitySubTypes == null) {

        this._commonHelper.showLoader();
        this._commonService.getEntitySubTypes().then((response: any) => {
          if (response) {
            this.entitySubTypes = response;
            this.entitySubTypes = this.entitySubTypes.sort((a, b) => a.parentID - b.parentID);
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
          }
          this._commonHelper.hideLoader();
          resolve(this.entitySubTypes);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });

      }
      else {
        this.entitySubTypes = allEntitySubTypes;
        resolve(this.entitySubTypes);
      }
    });
  }

  private getPrivacyLevelRefererence() {
    return new Promise((resolve, reject) => {
      this.showPrivacyLevelLoader = true;
      let params = { refType: RefType.PrivacyLevels };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.PrivacyLevels}`;
      // get data
      const refPrivacyLevels = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refPrivacyLevels == null) {
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.showPrivacyLevelLoader = false;
            this.privacyLevels = response as [];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.privacyLevels));
          }
          resolve(null);
        },
          (error) => {
            this.showPrivacyLevelLoader = false;
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.showPrivacyLevelLoader = false;
        this.privacyLevels = refPrivacyLevels;
        resolve(null);
      }
    });
  }
 
  private getTenantSettingsForPrivacyLevel() {
    return new Promise((resolve, reject) => {
      const cachedData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.DEFAULT_WORKTASK_PRIVACY_LEVEL));
      if (cachedData == null) {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.DEFAULT_WORKTASK_PRIVACY_LEVEL).then((response: any) => {
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.DEFAULT_WORKTASK_PRIVACY_LEVEL, JSON.stringify(response));
          resolve(response);
        },
          (error) => {
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      }
      else {
        resolve(cachedData);
      }
    });
  }

  onRecordTypeChange(e) {
    if (e.value) {
      this.entityRecordTypeId = e.value;
      this.relatedEntityTypeId = e.value.relatedToEntityTypeId;

      if (this.entityRecordTypeId && this.entityRecordTypeId > 0) {
        this.workflows = this.copyOfWorkflows.filter(s => (s.entityRecordTypeID == this.entityRecordTypeId) || s.isDefault);
      }
      this.assignedToUsers = [];
    }
  }

  onRecordTypeClear(e) {
    this.entityRecordTypeId = null;
    this.relatedEntityTypeId = null;
    this.entityWorkflowId = null;
    this.workTaskForm.controls['entityWorkflowId'].patchValue(null);
    this.workTaskForm.controls['entityWorkflowId'].updateValueAndValidity();
    this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
    this.assignedToUsers = [];
    this.ownerDetail = {};
    this.workTaskForm.get('privacyLevel').enable();
  }

  private getTeamOwnerDetail() {
    
    const defaultStageID = this.workflows?.find(x => x.value == this.entityWorkflowId)?.defaultStageID;
    const payload = {
      'entityTypeID': Entity.WorkTasks,
      'entityWorkFlowID': Number(this.entityWorkflowId),
      'stageID': defaultStageID
    };

    this._commonService.GetEntityStageTeamOwnerWithPrivacy(payload).then((res: any) => {
      if (res) {
        this.ownerDetail = res;
        this.workTaskForm.controls['privacyLevel'].patchValue(this.ownerDetail.privacyLevel);
        if (this._commonHelper.loggedUserDetail.userId != this.ownerDetail?.id) {
          this.workTaskForm.get('privacyLevel').disable();
          this.workTaskForm.controls['privacyLevel'].updateValueAndValidity();
        } else {
          this.workTaskForm.get('privacyLevel').enable();
        }
      }
    });
  }
}
