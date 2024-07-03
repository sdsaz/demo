import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { DataSources, Entity, FieldNames, LocalStorageKey, PrivacyLevels, PublicTenantSettings, RefType } from '../../../@core/enum';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { CasesService } from '../cases.service';
import { SettingsService } from '../../settings/settings.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { ProductAddComponent } from '../../products/product-add/product-add.component';
import { ContactAddComponent } from '../../contacts/contact-add/contact-add.component';
import { AccountAddComponent } from '../../accounts/account-add/account-add.component';
import { Dropdown } from 'primeng/dropdown';
import { RelatedToControlComponent } from '../../../@core/sharedComponents/related-to-control/related-to-control/related-to-control.component';

@Component({
  selector: 'ngx-case-add',
  templateUrl: './case-add.component.html',
  styleUrls: ['./case-add.component.scss']
})
export class CaseAddComponent {

  @Input() entityRecordTypes: any;
  @Input() entityRecordTypeId: number;
  @Input() relatedEntityTypeId: number;
  @Input() relatedEntityId: number;
  @Input() relatedEntityRecordTypeId: number;
  @Input() workflows: any;
  @Input() entityWorkflowId: number;
  @Input() entityHiddenFieldSettings: any;
  @Input() sectionCodes: any;
  @Input() entityTypeId: number;
  @Input() isShowAddButton :boolean=true;

  @ViewChild('relatedTo')relatedTo: RelatedToControlComponent;
  
  copyOfRecordTypes: any;
  isShowRecordTypes: boolean = true;
  copyOfRelatedToList: any;
  relatedToEntityId: number;
  relatedToList: any = [];
  relatedToPlaceholder: string;
  addRelatedToTooltip:string;
  relatedToEntiyName: string;
  showRelatedToLoader: boolean = false;
  isShowRelatedTo: boolean = true;
  isRelatedToGroupDropDown: boolean;
  relatedToIconToolTip: string;
  copyOfWorkflows: any;
  isShowWorkFlow: boolean = true;
  assignedToUsers: any = null;
  showAssignedToLoader: boolean = false;
  isShowAssignTo: boolean = true;
  SelectedEntityTypeId:any=null;
  submitted = false;
  ownerDetail: any;
  isReadOnly:boolean=false;

  caseModel: any = {
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
    customFieldJSONData: ''
  };
  caseForm: UntypedFormGroup;

  //user detail
  _loggedInUser: any;

  validation_messages = {
    'name': [
      { type: 'required', message: 'CASES.ADD_DIALOG.NAME_REQUIRED' },
      { type: 'maxlength', message: 'CASES.ADD_DIALOG.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'CASES.ADD_DIALOG.MESSAGE_NAME_MIN' }
    ],
    'description': [
      { type: 'minlength', message: 'CASES.ADD_DIALOG.MESSAGE_DESCRIPTION_MIN' }
    ],
    'entityWorkflowId': [
      { type: 'required', message: 'CASES.ADD_DIALOG.WORKFLOW_REQUIRED' }
    ],
  }

  isSpecificWorkflowPage: boolean = true;
  //----------------------------------------

  isAssignCase: boolean = false;
  fieldNames = FieldNames;

  //----------- Privacy Level ----------------
  privacyLevels: any = [];
  isShowPrivacyLevels: boolean;
  showPrivacyLevelLoader: boolean = false;
  //----------------------------------------


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

  recordTypesForAccount: any;
  recordTypesForContact: any;
  recordTypesForProduct: any;

  constructor(private _ngbActiveModal: NgbActiveModal,
    public _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _casesService: CasesService,
    private _dataSourceService: DatasourceService,
    private _commonService: CommonService,
    private _settingsService: SettingsService,
    private _modalService: NgbModal) { }

  ngOnInit(): void {
    this.isAssignCase = this._commonHelper.havePermission(enumPermissions.AssignCase);
    this.getTenantSettingsForPrivacyLevel();

    this.caseForm = this.createCaseForm();
    this.setInitialValues();

    this.getWorkflowListForAccount();
    this.getWorkflowListForContact();
    this.getWorkflowListForProduct();
    this.getEntityRecordTypes();

    if (this.isShowRelatedTo) {
      if(this.relatedEntityTypeId >0)
      {
        this.isReadOnly = true;
      }
      
    }
    this.checkAddRelatedToEntityPermission();
  }

  private setInitialValues() {
    if ((!this.entityWorkflowId && !this.entityRecordTypeId) || (this.entityWorkflowId && !this.entityRecordTypeId)) {
      this.isSpecificWorkflowPage = false;

      this.showHideRelatedToBasedOnRecordType();

      this.showHideWorkflowAndAssignedTo();

      // Get Assigned To users
      if (this.isAssignCase) {
        this.getAssignedToUsers(null, 1, null);
      }
      this.entityWorkflowId = null;
    }
    else {
      this.setDataForSpecificWorkflow();
    }
  }

  private showHideRelatedToBasedOnRecordType() {
    // Record Types
    if (this.entityRecordTypes && this.entityRecordTypes?.length == 1) {
      this.copyOfRecordTypes = this._commonHelper.deepClone(this.entityRecordTypes)
      this.isShowRecordTypes = false;
      this.entityRecordTypeId = this.entityRecordTypes[0].value;
      this.relatedEntityTypeId = this.entityRecordTypes[0].relatedToEntityTypeId;

      this.caseForm.controls['entityRecordTypeId'].patchValue(this.entityRecordTypeId);
      this.caseForm.controls['entityRecordTypeId'].updateValueAndValidity();
    }
    else if (this.entityRecordTypes && this.entityRecordTypes?.length > 0) {
      this.copyOfRecordTypes = this._commonHelper.deepClone(this.entityRecordTypes)
    }
    else {
      this.isShowRecordTypes = false;
    }
  }

  private showHideWorkflowAndAssignedTo() {
    // Workflows
    if (this.workflows && this.workflows?.length == 1) {
      this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
      this.isShowWorkFlow = false;
      this.entityWorkflowId = this.workflows[0].value;
      this.caseForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
      this.caseForm.controls['entityWorkflowId'].clearValidators();
      this.caseForm.controls['entityWorkflowId'].updateValueAndValidity();
    }
    else if (this.workflows && this.workflows?.length > 0) {
      this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
      if (this.copyOfRecordTypes?.length == 1) {
        this.workflows = this.workflows?.filter(x => x.isDefault || x.parentEntityTypeID == this.relatedEntityTypeId);
      }
      else {
        this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
      }
    }
    else {
      this.isShowWorkFlow = false;
      this.isShowAssignTo = false;
      if (this.workflows?.length <= 0) {
        this.caseForm.controls['entityWorkflowId'].clearValidators();
        this.caseForm.controls['entityWorkflowId'].updateValueAndValidity();
      }
    }
  }


  private setDataForSpecificWorkflow() {
    this.isSpecificWorkflowPage = true;

    // Get Assigned To users
    if (this.isAssignCase) {
      this.getAssignedToUsers(null, 1, null);
    }

    this.isShowRecordTypes = false;
    this.isShowWorkFlow = false;

    this.caseForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
    this.caseForm.controls['entityWorkflowId'].clearValidators();
    this.caseForm.controls['entityWorkflowId'].updateValueAndValidity();

    this.isShowRelatedTo = !(this.relatedEntityTypeId == null)
    this.isShowAssignTo = true;

    this.setRelateToEntityDisplay(this.relatedEntityTypeId);
  }

  createCaseForm(): UntypedFormGroup {
    //empty custom fields
    var customFields: any = {};

    return this._formBuilder.group({
      id: 0,
      tenantId: 0,
      entityWorkflowId: [this.caseModel.entityWorkflowId, Validators.compose([Validators.required])],
      entityTypeId: null,
      entityRecordTypeId: null,
      entityId: null,
      name: [this.caseModel.name, Validators.compose([Validators.required, Validators.maxLength(500), Validators.minLength(2)])],
      description: [this.caseModel.description, Validators.compose([Validators.minLength(2)])],
      relatedTo: [this.caseModel.relatedTo],
      assignedTo: [this.caseModel.assignedTo],
      customFieldJSONData: customFields,
      privacyLevel: null
    });
  }

  setRelateToEntityDisplay(relatedEntityTypeId) {
    const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == relatedEntityTypeId);
    if (foundRecord) {
      this.relatedToEntiyName = foundRecord?.['displayName'].toString().trim();
      this.relatedToPlaceholder = (this._commonHelper.getInstanceTranlationData('CASES.ADD_DIALOG.RELATED_TO_PLACEHOLDER', { entityName: this.relatedToEntiyName }));
      this.addRelatedToTooltip = (this._commonHelper.getInstanceTranlationData('CASES.ADD_DIALOG.DYNAMIC_ADD_RELATED_TO_TOOLTIP', { entityName: this.relatedToEntiyName }));
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
    this.getAssignedToUsers(e.value, 0, e.filter);
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
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CASEASSIGNEDTO, params).then((response: any) => {
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

  saveCase(formData) {
    this.submitted = true;
    if (this.caseForm.invalid) {
      this.validateAllFormFields(this.caseForm);
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
      entityId: formData.relatedTo ? formData.relatedTo : this.relatedEntityId,
      name: formData.name,
      description: formData.description,
      assignedTo: formData.assignedTo,
      customFieldJSONData: customFields,
      privacyLevel: formData.privacyLevel
    }

    this._commonHelper.showLoader();
    this._casesService.saveCase(params).then(response => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CASES.ADD_DIALOG.SUCCESS_MESSAGE'));
      this._ngbActiveModal.close(response);
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
      if (error.messageCode.toLowerCase() == 'cases.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CASES.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }

  onWorkflowChange(e) {
    if (e.value) {
      this.entityWorkflowId = e.value;
      if (this.isAssignCase) {
        this.getAssignedToUsers(null, 1, null);
      }
      this.getTenantSettingsForPrivacyLevel();
      if (this.workflows != null && this.workflows.length > 0) {
        this.checkAddRelatedToEntityPermission();
      }
    }
    else{
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
       // this.getRelatedTo([this.relatedEntityTypeId], 0, null);
        this.setRelateToEntityDisplay(this.relatedEntityTypeId);
        this.isAddRelatedTo = true;
        this.isReadOnly=true;
        this.checkAddRelatedToEntityPermission();
      } 

      if (this.entityRecordTypeId && this.entityRecordTypeId > 0) {
        this.workflows = this.copyOfWorkflows.filter(s => (s.entityRecordTypeID == this.entityRecordTypeId) || s.isDefault);
      }

      this.assignedToUsers = [];
    }
    else {
      this.relatedToList = null;
      this.copyOfRelatedToList = null;
      this.setRelateToEntityDisplay(null);
      this.isAddRelatedTo = false;
      this.isReadOnly = false;
      this.checkAddRelatedToEntityPermission();
    }
  }
 

  onRecordTypeClear(e) {
    this.entityRecordTypeId = null;
    this.relatedEntityTypeId = null;
    this.entityWorkflowId = null;
    this.caseForm.controls['entityWorkflowId'].patchValue(null);
    this.caseForm.controls['entityWorkflowId'].updateValueAndValidity();
    this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
    this.assignedToUsers = [];
    this.SelectedEntityTypeId=null;
    this.setRelateToEntityDisplay(null);
    this.isAddRelatedTo = false;
  }
  
  setIsAddRelatedTo() {
    this.isAddRelatedTo = false;
  }

  onRelatedToChange(e) {
    if (e.value) {
      this.relatedEntityTypeId = e.value;
      this.isAddRelatedTo = true;
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
      this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
      this.relatedToEntiyName = '';
    }
    this.checkAddRelatedToEntityPermission();
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
    const defaultStageID = this.workflows?.find(x => x.value == this.entityWorkflowId)?.defaultStageID;
    const params = {
      'entityTypeID': Entity.Cases,
      'entityWorkFlowID': Number(this.entityWorkflowId),
      'stageID': defaultStageID
    };

    this._commonService.GetEntityStageTeamOwnerWithPrivacy(params).then((response: any) => {
      if (response) {
        this.ownerDetail = response;
        let selectedPrivacyLevel = this.ownerDetail != null && this.ownerDetail.privacyLevel != null ? Number.parseInt(this.ownerDetail.privacyLevel) : 0;
        
        if (selectedPrivacyLevel == PrivacyLevels.None) {
          this.isShowPrivacyLevels = false;
          this.privacyLevels = [];
        }
        else {
          this.getPrivacyLevelRefererence();
          
          this.isShowPrivacyLevels = true;
          this.caseForm.controls['privacyLevel'].patchValue(selectedPrivacyLevel);
        }
        
        if (this._commonHelper.loggedUserDetail.userId != this.ownerDetail?.id) {
          this.caseForm.get('privacyLevel').disable();
          this.caseForm.controls['privacyLevel'].updateValueAndValidity();
        } else {
          this.caseForm.get('privacyLevel').enable();
        }
      }
    });
  }

  addRelatedTo() {
    if (!this.relatedEntityTypeId) return;
    this.optionsForPopupDialog.size = "md";
    if (this.relatedEntityTypeId == Entity.Accounts) {

      this.modalRef = this._modalService.open(AccountAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
      this.modalRef.componentInstance.entityTypeId = Entity.Accounts;
      this.modalRef.componentInstance.recordTypes = this.recordTypesForAccount?.filter(x => x.value != 0);
      this.modalRef.componentInstance.entityRecordTypeId = null;
      this.modalRef.componentInstance.workflows = this.workflowsListAccount?.filter((x: any) => x.value != 0);
      this.modalRef.componentInstance.isShowAssignedTo = true;
      this.modalRef.componentInstance.isShowWorkflow =  this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;

    } else if (this.relatedEntityTypeId == Entity.Contacts) {

      this.modalRef = this._modalService.open(ContactAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
      this.modalRef.componentInstance.entityTypeId = Entity.Contacts;
      this.modalRef.componentInstance.entityRecordTypeId = null;
      this.modalRef.componentInstance.workflows = this.workflowListContact?.filter((x: any) => x.value != 0);
      this.modalRef.componentInstance.recordTypes = this.recordTypesForContact?.filter(x => x.value != 0);
      this.modalRef.componentInstance.isShowAssignTo = true;
      this.modalRef.componentInstance.isShowWorkflow =   this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;
    
    }
    else if (this.relatedEntityTypeId == Entity.Products) {

      this.modalRef = this._modalService.open(ProductAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
      this.modalRef.componentInstance.entityTypeId = Entity.Products;
      this.modalRef.componentInstance.entityRecordTypeId = null;
      this.modalRef.componentInstance.workflows = this.workflowsListProduct?.filter((x: any) => x.value != 0);
      this.modalRef.componentInstance.recordTypes = this.recordTypesForProduct?.filter(x => x.value != 0);
      this.modalRef.componentInstance.isShowAssignTo = true;
      this.modalRef.componentInstance.isShowWorkflow =   this.entityWorkflowId && this.entityWorkflowId > 0 ? false : true;
      this.modalRef.componentInstance.isShowProductCategory = true; 
    }

    this.modalRef.componentInstance.entityRecordTypeId = this.relatedEntityRecordTypeId;
    this.modalRef.componentInstance.isFromSameEntity = false;

    this.modalRef.result.then((response: any) => {
      if (response) {

        if (this.relatedTo.relatedToList &&  this.relatedTo.relatedToList.length > 0) {
      
            const relatedTo = { value: response['id'], label: response['name'] };
            this.relatedTo.relatedToList.unshift(relatedTo);
            this.caseForm.controls['relatedTo'].patchValue(response['id']);
            this.caseForm.controls['relatedTo'].updateValueAndValidity();
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
            this.recordTypesForProduct.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.LIST.FILTER_OPTION_TEXT_RECORDTYPE') });
            this.recordTypesForProduct.sort((a, b) => a.value - b.value);
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
      this.recordTypesForAccount = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Accounts).map(x=> ({'label':x.name,'value':x.id }));
      this.recordTypesForContact = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Contacts).map(x=> ({'label':x.name,'value':x.id }));
      this.recordTypesForProduct = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Products).map(x=> ({'label':x.name,'value':x.id }));
      this.recordTypesForProduct.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.LIST.FILTER_OPTION_TEXT_RECORDTYPE') });
      this.recordTypesForProduct.sort((a, b) => a.value - b.value);
    }
  }
 
  checkAddRelatedToEntityPermission() {
    if (this.relatedEntityTypeId == Entity.Accounts) {
     this.isAddRelatedTo = this._commonHelper.havePermission(enumPermissions.AddAccount);
    } else if (this.relatedEntityTypeId == Entity.Contacts) {
      this.isAddRelatedTo = this._commonHelper.havePermission(enumPermissions.AddContact);
    } else if (this.relatedEntityTypeId == Entity.Products) {
     this.isAddRelatedTo = this._commonHelper.havePermission(enumPermissions.AddProduct);
    }
  }

  private prepareParamsForWorkflows(entityTypeId: number) { return [{ name: 'EntityTypeID', type: 'int', value: entityTypeId }]; }

}
