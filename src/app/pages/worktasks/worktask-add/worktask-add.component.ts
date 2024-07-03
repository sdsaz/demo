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
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AccountAddComponent } from '../../accounts/account-add/account-add.component';
import { ContactAddComponent } from '../../contacts/contact-add/contact-add.component';
import { CaseAddComponent } from '../../cases/case-add/case-add.component';
import { OpportunityAddComponent } from '../../opportunities/opportunity-add/opportunity-add.component';
import { ProductAddComponent } from '../../products/product-add/product-add.component';
import { RelatedToControlComponent } from '../../../@core/sharedComponents/related-to-control/related-to-control/related-to-control.component';

@Component({
  selector: 'ngx-worktask-add',
  templateUrl: './worktask-add.component.html',
  styleUrls: ['./worktask-add.component.scss']
})
export class WorktaskAddComponent implements OnInit {

  @Input() entityHiddenFieldSettings: any;
  @Input() sectionCodes: any;
  @Input() entityTypeId: number;
  
  @ViewChild('relatedTo')relatedTo: RelatedToControlComponent;

  //----------- Record Type ----------------
  @Input() entityRecordTypes: any;
  copyOfRecordTypes: any;
  @Input() entityRecordTypeId: number;
  isShowRecordTypes: boolean = true;
  //----------------------------------------

  //----------- Workflow ----------------
  @Input() entityWorkflowId: number;
  @Input() workflows: any;
  copyOfWorkflows: any;
  isShowWorkFlow: boolean = true;
  //----------------------------------------

  //----------- Related To ----------------
  @Input() relatedEntityTypeId: number;
  @Input() relatedEntityId: number;
  @Input() relatedEntityRecordTypeId: number;
  @Input() isShowRelatedTo: boolean = true;

  relatedToList: any = null;
  parentEntityList:any=null;
  copyOfRelatedToList: any;
  relatedToEntityTypes: any = null;
  relatedToPlaceholder: string;
  addRelatedToTooltip:string;
  relatedToEntiyName: string;

  showRelatedToLoader: boolean = false;
  isShowAddButton:boolean=false;
  isRelatedToGroupDropDown: boolean;
  isReadOnly:boolean=false;
  relatedToIconToolTip: string;

  SelectedEntityTypeId:any=null;
  //----------------------------------------

  //----------- Entity Sub Type ----------------
  @Input() entitySubTypeLevel: number = 1;

  entitySubTypes: any;

  showTypeLoader: boolean = false;
  isShowTypes: boolean = true;
  //----------------------------------------

  //----------- Assigned To ----------------
  isShowAssignTo: boolean = true;
  showAssignedToLoader: boolean = false;
  assignedToUsers: any = null;
  assignedToPlaceholder = 'WORKTASK.ADD_DIALOG.ASSIGNED_TO_PLACEHOLDER';
  @Input() isAssignedToFieldHidden: boolean;
  //----------------------------------------
  //----------- Privacy Level ----------------
  @Input() parentPrivacyLevel: any = null;
  privacyLevels: any = [];
  isShowPrivacyLevels: boolean;
  showPrivacyLevelLoader: boolean = false;
  privacyLevelGeneralSettingValue?: number;
  //----------------------------------------
  //----------- Form ----------------
  submitted = false;

  @Input() dialogTitle: string = '';

  // Work task
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

  validation_messages = {
    'name': [
      { type: 'required', message: 'WORKTASK.ADD_DIALOG.NAME_REQUIRED' },
      { type: 'maxlength', message: 'WORKTASK.ADD_DIALOG.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'WORKTASK.ADD_DIALOG.MESSAGE_NAME_MIN' }
    ],
    'description': [
      { type: 'minlength', message: 'WORKTASK.ADD_DIALOG.MESSAGE_DESCRIPTION_MIN' }
    ],
    'typeId': [
      { type: 'required', message: 'WORKTASK.ADD_DIALOG.TYPE_REQUIRED' }
    ],
    'entityWorkflowId': [
      { type: 'required', message: 'WORKTASK.ADD_DIALOG.WORKFLOW_REQUIRED' }
    ],
  }

  isSpecificWorkflowPage: boolean = true;
  //----------------------------------------

  isAssignWorkTask: boolean = false;

  fieldNames = FieldNames;

  ownerDetail: any;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };
  
  modalRef: NgbModalRef | null;
  isAddRelatedTo: boolean;

  workflowsListAccount: any;
  workflowListContact: any;
  workflowsListProduct: any;
  workflowListOpprotunity: any;
  workflowListCase: any;

  recordTypesForAccount: any;
  recordTypesForContact: any;
  recordTypesForProduct: any;
  recordTypesForCase: any;
  recordTypesForOpportunity: any;

  constructor(private _ngbActiveModal: NgbActiveModal,
    public _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _workTaskService: WorkTasksService,
    private _dataSourceService: DatasourceService,
    private _commonService: CommonService,
    private _settingsService: SettingsService,
    private _modalService: NgbModal) { }

  ngOnInit(): void {

    this.isAssignWorkTask = this._commonHelper.havePermission(enumPermissions.AssignWorkTask);
    

    Promise.all([
      this.getTenantSettingsForPrivacyLevel(),
      this.getEntitySubTypes(),
      this.getWorkflowListForAccount(),
      this.getWorkflowListForContact(),
      this.getWorkflowListForProduct(),
      this.getWorkflowListForCase(),
      this.getWorkflowListForOpprtunity(),
      this.getEntityRecordTypes(),
    ]).then((results: any) => {
    if(this.relatedEntityTypeId >0)
    {
      this.isReadOnly = true;
    }
      this.entitySubTypes = this.entitySubTypes?.filter(x => x.level == this.entitySubTypeLevel);

      if (this.entitySubTypes && this.entitySubTypes.length > 0) {
        if (this.entitySubTypes.length == 1) {
          this.workTaskModel.typeId = this.entitySubTypes[0].id;
          this.isShowTypes = false;
        }
      }
      else {
        this.isShowTypes = false;
      }

      this.workTaskForm = this.createWorkTaskForm();

      if (!this.isShowTypes) {
        this.workTaskForm.controls['typeId'].removeValidators([Validators.required]);
        this.workTaskForm.controls['typeId'].updateValueAndValidity();
      }

      this.privacyLevelGeneralSettingValue = Number.parseInt(results[0]);
      if (this.privacyLevelGeneralSettingValue == PrivacyLevels.None) {
        this.workTaskForm.controls['privacyLevel'].patchValue(0);
        this.workTaskForm.controls['privacyLevel'].updateValueAndValidity();
        this.isShowPrivacyLevels = false;
        this.privacyLevels = [];
      }
      else {
        this.getPrivacyLevelRefererence();
        this.isShowPrivacyLevels = true;
        this.workTaskForm.controls['privacyLevel'].patchValue(this.privacyLevelGeneralSettingValue);
        this.workTaskForm.controls['privacyLevel'].updateValueAndValidity();
      }

      if (this.parentPrivacyLevel && this.parentPrivacyLevel == PrivacyLevels.OnlyMe) {
        this.isShowPrivacyLevels = false;
        this.workTaskForm.controls['privacyLevel'].patchValue(this.parentPrivacyLevel);
        this.workTaskForm.controls['privacyLevel'].updateValueAndValidity();
      }

    // All Listing / Default Page
    if ((!this.entityWorkflowId && !this.entityRecordTypeId) || (this.entityWorkflowId && !this.entityRecordTypeId)) {
      this.isSpecificWorkflowPage = false;

        // Record Types
        if (this.entityRecordTypes && this.entityRecordTypes.length == 1) {
          this.copyOfRecordTypes = this._commonHelper.deepClone(this.entityRecordTypes)
          this.isShowRecordTypes = false;
          this.entityRecordTypeId = this.entityRecordTypes[0].value;
          this.relatedEntityTypeId = this.entityRecordTypes[0].relatedToEntityTypeId;

          if (this.relatedEntityId && this.relatedEntityId > 0) {
            this.isShowRelatedTo = false;
          }
          else {
            if (this.relatedEntityTypeId != null && this.relatedEntityTypeId > 0) {
              this.isShowRelatedTo = true
            }
            else {
              this.isShowRelatedTo = false;
            }
          }
          this.workTaskForm.controls['entityRecordTypeId'].patchValue(this.entityRecordTypeId);
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
          this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
          if (this.copyOfRecordTypes.length == 1) {
            this.workflows = this.workflows?.filter(x => x.isDefault || x.parentEntityTypeID == this.relatedEntityTypeId);
          }
          else {
            this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
          }
        }
        else {
          this.isShowWorkFlow = false;
          this.isShowAssignTo = false;
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
      }
      else {
        this.isSpecificWorkflowPage = true;
        const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.relatedEntityTypeId);
        if (foundRecord) {
          this.relatedToEntiyName = foundRecord?.['displayName'].toString().trim();
          this.relatedToPlaceholder = (this._commonHelper.getInstanceTranlationData('WORKTASK.ADD_DIALOG.DYNAMIC_RELATED_TO_PLACEHOLDER', { entityName: this.relatedToEntiyName }));
          this.addRelatedToTooltip = (this._commonHelper.getInstanceTranlationData('WORKTASK.ADD_DIALOG.DYNAMIC_ADD_RELATED_TO_TOOLTIP', { entityName: this.relatedToEntiyName }));
        }

        // Get Assigned To users
        if (this.isAssignWorkTask) {
          this.getAssignedToUsers(null, 1, null);
        }

        this.isShowRecordTypes = false;
        this.isShowWorkFlow = false;

        this.workTaskForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
        this.workTaskForm.controls['entityWorkflowId'].clearValidators();
        this.workTaskForm.controls['entityWorkflowId'].updateValueAndValidity();

        this.isShowRelatedTo = !(this.relatedEntityTypeId == null)
        this.isShowAssignTo = true;

        this.setRelateToEntityDisplay(this.relatedEntityTypeId);
        this.getTeamOwnerDetail();
      }
    });
    this.checkAddRelatedToEntityPermission();    
  }

  createWorkTaskForm(): UntypedFormGroup {
    //empty custom fields
    var customFields: any = {};

    return this._formBuilder.group({
      id: 0,
      tenantId: 0,
      entityWorkflowId: [this.workTaskModel.entityWorkflowId, Validators.compose([Validators.required])],
      entityTypeId: null,
      entityRecordTypeId: null,
      entityId: null,
      name: [this.workTaskModel.name, Validators.compose([Validators.required, Validators.maxLength(500), Validators.minLength(2)])],
      description: [this.workTaskModel.description, Validators.compose([Validators.minLength(2)])],
      relatedTo: [this.workTaskModel.relatedTo],
      assignedTo: [this.workTaskModel.assignedTo],
      customFieldJSONData: customFields,
      typeId: [this.workTaskModel.typeId, Validators.compose([Validators.required])],
      privacyLevel: null
    });
  }

  setRelateToEntityDisplay(relatedEntityTypeId) {
    const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == relatedEntityTypeId);
    if (foundRecord) {
      this.relatedToEntiyName = foundRecord?.['displayName'].toString().trim();
      this.relatedToPlaceholder = (this._commonHelper.getInstanceTranlationData('WORKTASK.ADD_DIALOG.DYNAMIC_RELATED_TO_PLACEHOLDER', { entityName: this.relatedToEntiyName }));
      this.addRelatedToTooltip = (this._commonHelper.getInstanceTranlationData('WORKTASK.ADD_DIALOG.DYNAMIC_ADD_RELATED_TO_TOOLTIP', { entityName: this.relatedToEntiyName }));
      this.relatedToIconToolTip = foundRecord?.['displayName'].toString().trim();
      this.SelectedEntityTypeId = relatedEntityTypeId;
      
    }
    else {
      this.relatedToEntiyName = '';
      this.relatedToPlaceholder = '';
      this.addRelatedToTooltip = '';
    }
  }


  assignedToOnFilter(e) {
    if (e.value) {
      this.getAssignedToUsers(e.value, 0, e.filter);
    }
  }

  assignedToOnChange(e) {
    if (!e.value) {
      this.getAssignedToUsers(e.value, 1, null);
    }
  }
  // get assigned to users
  getAssignedToUsers(assignedTo, includeAllUsers = 1, searchString = null) {
    this.showAssignedToLoader = true;
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
      this.showAssignedToLoader = false;
    }, (error) => {
      this.showAssignedToLoader = false;
    });
  }

  // prepare params for datasource with required fields
  private prepareParamsForAssignedToUsers(stageId, assignedTo, includeAllUsers = 1, searchString = null) {
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
      entityWorkflowId: formData.entityWorkflowId,
      entityRecordTypeId: this.entityRecordTypeId,
      entityTypeId: this.relatedEntityTypeId,
      entityId: formData.relatedTo  ? formData.relatedTo : this.relatedEntityId,
      name: formData.name,
      description: formData.description,
      assignedTo: formData.assignedTo,
      customFieldJSONData: customFields,
      typeId: formData.typeId,
      privacyLevel: (this.parentPrivacyLevel && this.parentPrivacyLevel == PrivacyLevels.OnlyMe) ? this.parentPrivacyLevel : this.workTaskForm.get('privacyLevel').value
    }

    this._commonHelper.showLoader();
    // save work task
    this._workTaskService.updateWorkTask(params).then(response => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.ADD_DIALOG.SUCCESS_MESSAGE'));
      this._ngbActiveModal.close(true);
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  //for close form
  onCloseForm(status: boolean) {
    this._ngbActiveModal.close(status);
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('WORKTASKS.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }

  onWorkflowChange(e) {
    if (e.value) {
      this.entityWorkflowId = e.value;
      if (this.isAssignWorkTask) {
        this.getAssignedToUsers(null, 1, null);
      }
      this.getTeamOwnerDetail();
      
      // set record type from selected workflow
      if (this.workflows != null && this.workflows.length > 0) {
        this.checkAddRelatedToEntityPermission();
      }
    }
    else {
      this.isAddRelatedTo = !this.entityWorkflowId && !this.entityRecordTypeId ? false : true;
    }
  }

  onWorkflowClear(e) {
    this.entityWorkflowId = null;
    this.assignedToUsers = [];
    this.isAddRelatedTo = !this.entityWorkflowId && !this.entityRecordTypeId ? false : true;
  }

  onRecordTypeChange(e) {
    if (e.value) {

      this.entityRecordTypeId = e.value.value;
      this.relatedEntityTypeId = e.value.relatedToEntityTypeId;

      if (this.relatedEntityTypeId && this.relatedEntityTypeId > 0) {
        this.SelectedEntityTypeId=e.value.relatedToEntityTypeId;;
        this.setRelateToEntityDisplay(this.relatedEntityTypeId);
        this.isAddRelatedTo = true;
        this.isReadOnly=true;
        this.isShowAddButton=true;
        this.checkAddRelatedToEntityPermission();
      } 

      if (this.entityRecordTypeId && this.entityRecordTypeId > 0) {
        this.workflows = this.copyOfWorkflows.filter(s => (s.entityRecordTypeID == this.entityRecordTypeId) || s.isDefault);
      }
      this.assignedToUsers = [];
    }
    else {
      this.relatedToList = null;
      this.parentEntityList=null;
      this.copyOfRelatedToList = null;
      this.setRelateToEntityDisplay(null);
      this.isAddRelatedTo = false;
      this.isReadOnly = false;
      this.isShowAddButton=false;
      this.checkAddRelatedToEntityPermission();
    }
  }
  setIsAddRelatedTo() {
    this.isAddRelatedTo = false;
  }

  setIsShowAddButton() {
    this.isShowAddButton = false;
  }

  onRecordTypeClear(e) {
    this.entityRecordTypeId = null;
    this.relatedEntityTypeId = null;
    this.entityWorkflowId = null;
    this.workTaskForm.controls['entityWorkflowId'].patchValue(null);
    this.workTaskForm.controls['entityWorkflowId'].updateValueAndValidity();
    this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
    this.assignedToUsers = [];
    this.relatedToList=[];
    this.SelectedEntityTypeId=null;
    this.setRelateToEntityDisplay(null);
    this.ownerDetail = {};
    this.workTaskForm.get('privacyLevel').enable();
    this.isAddRelatedTo = false;
    this.isShowAddButton=false;
    this.isReadOnly=false;
    this.checkAddRelatedToEntityPermission();
  }

  onRelatedToChange(e) {
    if (e.value) {
      this.relatedEntityTypeId = e.value;
      this.isShowAddButton=true;
      if (!this.isSpecificWorkflowPage) {
        if (this.relatedEntityTypeId && this.entityRecordTypeId) {
          this.workflows = this.copyOfWorkflows.filter(s => (s.entityRecordTypeID == this.entityRecordTypeId) || s.isDefault);
        }
        else if (this.relatedEntityTypeId && !this.entityRecordTypeId) {
          this.workflows = this.copyOfWorkflows.filter(s => (s.parentEntityTypeID == this.relatedEntityTypeId) || s.isDefault);
        }
        else {
          this.workflows = this.copyOfWorkflows;
        }
        this.setRelateToEntityDisplay(this.relatedEntityTypeId);
      }
    }
    else
    {
      this.relatedEntityTypeId=null;
      this.isShowAddButton=false;
      this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
      this.relatedToEntiyName='';
    }
    this.checkAddRelatedToEntityPermission();
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
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.DEFAULT_WORKTASK_PRIVACY_LEVEL).then((response: any) => {
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.DEFAULT_WORKTASK_PRIVACY_LEVEL, JSON.stringify(response));
          this._commonHelper.hideLoader();
          resolve(response);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      }
      else {
        resolve(cachedData);
      }
    });
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

  addRelatedTo() {
    if (!this.relatedEntityTypeId) return;
    this.optionsForPopupDialog.size = "md";
    if (this.relatedEntityTypeId == Entity.Accounts) {

      this.modalRef = this._modalService.open(AccountAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = Entity.Accounts;
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
      this.modalRef.componentInstance.recordTypes = this.recordTypesForAccount?.filter(x => x.value != 0);
      this.modalRef.componentInstance.entityRecordTypeId = null;
      this.modalRef.componentInstance.workflows = this.workflowsListAccount?.filter((x: any) => x.value != 0);
      this.modalRef.componentInstance.isShowAssignedTo = true;
      this.modalRef.componentInstance.isShowWorkflow =  this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;

    } else if (this.relatedEntityTypeId == Entity.Contacts) {

      this.modalRef = this._modalService.open(ContactAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = Entity.Contacts;
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
      this.modalRef.componentInstance.entityRecordTypeId = null;
      this.modalRef.componentInstance.workflows = this.workflowListContact?.filter((x: any) => x.value != 0);
      this.modalRef.componentInstance.recordTypes = this.recordTypesForContact?.filter(x => x.value != 0);
      this.modalRef.componentInstance.isShowAssignTo = true;
      this.modalRef.componentInstance.isShowWorkflow =  this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;
    
    }
    else if (this.relatedEntityTypeId == Entity.Products) {

      this.modalRef = this._modalService.open(ProductAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = Entity.Products;
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
      this.modalRef.componentInstance.entityRecordTypeId = null;
      this.modalRef.componentInstance.workflows = this.workflowsListProduct?.filter((x: any) => x.value != 0);
      this.modalRef.componentInstance.recordTypes = this.recordTypesForProduct?.filter(x => x.value != 0);
      this.modalRef.componentInstance.isShowAssignTo = true;
      this.modalRef.componentInstance.isShowWorkflow =  this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;
      this.modalRef.componentInstance.isShowProductCategory = true; 
    }
    else if (this.relatedEntityTypeId == Entity.Opportunities) {
      this.optionsForPopupDialog.size = "lg";
      this.modalRef = this._modalService.open(OpportunityAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = Entity.Opportunities;
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.OPPORTUNITIES.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = null;
      this.modalRef.componentInstance.entityRecordTypeId = null;
      this.modalRef.componentInstance.workflows = this.workflowListOpprotunity?.filter((x: any) => x.value != 0);
      this.modalRef.componentInstance.entityRecordTypes = this.recordTypesForOpportunity?.filter(x => x.value != 0);
      this.modalRef.componentInstance.isShowAssignTo = true;
      this.modalRef.componentInstance.isShowWorkflow =   this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;
      this.modalRef.componentInstance.isShowRecordTypes = (this.recordTypesForOpportunity && this.recordTypesForOpportunity.length > 0);
    }
    else if (this.relatedEntityTypeId == Entity.Cases) {

      this.modalRef = this._modalService.open(CaseAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = Entity.Cases;
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CASES.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = null;
      this.modalRef.componentInstance.entityRecordTypeId = null;
      this.modalRef.componentInstance.workflows = this.workflowListCase?.filter((x: any) => x.value != 0);
      this.modalRef.componentInstance.entityRecordTypes = this.recordTypesForCase?.filter(x => x.value != 0);
      this.modalRef.componentInstance.isShowAssignTo = true;
      this.modalRef.componentInstance.isShowAddButton = false;
      this.modalRef.componentInstance.isShowWorkflow =   this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;
      this.modalRef.componentInstance.isShowRecordTypes = (this.recordTypesForCase && this.recordTypesForCase.length > 0);
    }

    this.modalRef.componentInstance.entityRecordTypeId = this.relatedEntityRecordTypeId;
    this.modalRef.componentInstance.isFromSameEntity = false;

    this.modalRef.result.then((response: any) => {
      if (response) {

        if (this.relatedTo.relatedToList &&  this.relatedTo.relatedToList.length > 0) {
          
            const relatedTo = { label: response['name'] ,value: response['id'], };
            this.relatedTo.relatedToList.unshift(relatedTo);
            this.workTaskForm.controls['relatedTo'].patchValue(response['id']);
            this.workTaskForm.controls['relatedTo'].updateValueAndValidity();
        } 
      }
    });
  }
  private getWorkflowListForAccount() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Accounts}`;
      var workflowListAccount = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));

      if (workflowListAccount == null) {
        const params = this.prepareParamsForWorkflows(Entity.Accounts);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflowsListAccount = response;
            this.workflowsListAccount.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflowsListAccount));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.workflowsListAccount = workflowListAccount;
        resolve(null);
      }
    });
  }

  private getWorkflowListForContact() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Contacts}`;
      var workflowListForContactData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));

      if (workflowListForContactData == null) {
        const params = this.prepareParamsForWorkflows(Entity.Contacts);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflowListContact = response;
            this.workflowListContact.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflowListContact));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.workflowListContact = workflowListForContactData;
        resolve(null);
      }
    });
  }

  private getWorkflowListForProduct() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Products}`;
      var workflowListForProductData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));

      if (workflowListForProductData == null) {
        const params = this.prepareParamsForWorkflows(Entity.Products);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflowsListProduct = response;
            this.workflowsListProduct.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflowsListProduct));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.workflowsListProduct = workflowListForProductData;
        resolve(null);
      }
    });
  }

  private getWorkflowListForCase() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Cases}`;
      var workflowListForCaseData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));

      if (workflowListForCaseData == null) {
        const params = this.prepareParamsForWorkflows(Entity.Cases);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflowListCase = response;
            this.workflowListCase.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflowListCase));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.workflowListCase = workflowListForCaseData;
        resolve(null);
      }
    });
  }

  private getWorkflowListForOpprtunity() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Opportunities}`;
      var workflowListForOpportunityData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));

      if (workflowListForOpportunityData == null) {
        const params = this.prepareParamsForWorkflows(Entity.Opportunities);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflowListOpprotunity = response;
            this.workflowListOpprotunity.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflowListOpprotunity));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.workflowListOpprotunity = workflowListForOpportunityData;
        resolve(null);
      }
    });
  }

  //get all entity record types 
   private getEntityRecordTypes() {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
    if (allEntityRecordTypes == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypesForAccount = response?.filter(x => x.entityTypeID == Entity.Accounts).map(x=> ({'label':x.name,'value':x.id }));
            this.recordTypesForContact = response?.filter(x => x.entityTypeID == Entity.Contacts).map(x=> ({'label':x.name,'value':x.id }));
            this.recordTypesForProduct = response?.filter(x => x.entityTypeID == Entity.Products).map(x=> ({'label':x.name,'value':x.id }));
            this.recordTypesForCase = response?.filter(x => x.entityTypeID == Entity.Cases).map(x=> ({'label':x.name,'value':x.id ,'relatedToEntityTypeId': x.parentEntityTypeID }));
            this.recordTypesForOpportunity = response?.filter(x => x.entityTypeID == Entity.Opportunities).map(x=> ({'label':x.name,'value':x.id, 'relatedToEntityTypeId': x.parentEntityTypeID  }));
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
          }
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
      this.recordTypesForAccount = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Accounts).map(x => ({ 'label': x.name, 'value': x.id }));
      this.recordTypesForContact = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Contacts).map(x => ({ 'label': x.name, 'value': x.id }));
      this.recordTypesForProduct = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Products).map(x => ({ 'label': x.name, 'value': x.id }));
      this.recordTypesForCase = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases).map(x => ({ 'label': x.name, 'value': x.id ,'relatedToEntityTypeId': x.parentEntityTypeID  }));
      this.recordTypesForOpportunity = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Opportunities).map(x => ({ 'label': x.name, 'value': x.id ,'relatedToEntityTypeId': x.parentEntityTypeID  }));
    }
  }
 
  checkAddRelatedToEntityPermission() {
    if (this.relatedEntityTypeId == Entity.Accounts) {
      this.isAddRelatedTo = this._commonHelper.havePermission(enumPermissions.AddAccount);
    } else if (this.relatedEntityTypeId == Entity.Contacts) {
      this.isAddRelatedTo = this._commonHelper.havePermission(enumPermissions.AddContact);
    } else if (this.relatedEntityTypeId == Entity.Products) {
      this.isAddRelatedTo = this._commonHelper.havePermission(enumPermissions.AddProduct);
    } else if (this.relatedEntityTypeId == Entity.Cases) {
      this.isAddRelatedTo = this._commonHelper.havePermission(enumPermissions.AddCase);
    } else if (this.relatedEntityTypeId == Entity.Opportunities) {
      this.isAddRelatedTo = this._commonHelper.havePermission(enumPermissions.AddOpportunity);
    }
  }

  private prepareParamsForWorkflows(entityTypeId: number) { return [{ name: 'EntityTypeID', type: 'int', value: entityTypeId }]; }

}
