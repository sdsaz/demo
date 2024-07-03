//ANGULAR
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { Actions, DataSources, Entity, LocalStorageKey, PublicTenantSettings, RefType } from '../../../@core/enum';
//SERVICES
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { OpportunitiesService } from '../opportunities.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
//OTHER
import { NgbActiveModal, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { SettingsService } from '../../settings/settings.service';
import { AccountAddComponent } from '../../accounts/account-add/account-add.component';
//PRIMENG
import { Dropdown } from 'primeng/dropdown';
import { ContactAddComponent } from '../../contacts/contact-add/contact-add.component';
import { EntityRelationComponentsModel, FormLayout } from '../../../@core/sharedModels/entity-relation.model';
import { EntityRelationService } from '../../../@core/sharedServices/entity-relation.service';
import { AddEntityRelationComponent } from '../../../@core/sharedComponents/entity-relation/add-entity-relation/add-entity-relation.component';

@Component({
  selector: 'ngx-opportunity-add',
  templateUrl: './opportunity-add.component.html',
  styleUrls: ['./opportunity-add.component.scss']
})
export class OpportunityAddComponent implements OnInit {

  @Input() entityRecordTypes: any;
  @Input() entityRecordTypeId: number;
  @Input() showEntityRecordTypeLoader: boolean = false;
  @Input() workflows: any;
  @Input() entityWorkflowId: number;
  @Input() showWorkflowLoader: boolean = false;
  @Input() relatedEntityTypeId: number;
  @Input() relatedEntityRecordTypeId: number;
  @Input() relatedEntityId: number;
  @Input() entityType:number=null;

  @ViewChild("drpRelatedTo", { static: false }) drpRelatedTo: Dropdown;
  @ViewChild("drpContact", { static: false }) drpContact: Dropdown;
  @ViewChild("drpAccount", { static: false }) drpAccount: Dropdown;

  copyOfRecordTypes: any;
  isShowRecordTypes : boolean = true;
  recordTypeList: any;
  
  copyOfWorkflows: any;
  isShowWorkFlow: boolean = true;
  
  
  relatedToEntityTypes: any = null;
  relatedToList: any = null;
  copyOfRelatedToList: any = null;
  relatedToPlaceholder: string = null;
  relatedToEntiyName: string = null;
  isAddRelatedTo: boolean;
  isShowRelatedTo: boolean = true;
  isRelatedToGroupDropDown: boolean;
  showRelatedToLoader: boolean = false;
  relatedToIconToolTip: string;
  showCompanyDropDown:boolean = true;
  showMemberDropDown:boolean=true;

  ownerUsers: any = null;
  assignedToUsers: any = null;
  isShowAssignTo: boolean   = true;
  ownerPlaceholder = '';
  showAssignedToLoader: boolean   = false;

  leadSources: any = null;
  currencySymbol: any = null;

  currentDate = new Date();
  public getCurrentDate() {
    return this.currentDate;
  }

  //Account
  showAccountLoader: boolean;
  //Contact
  showContactLoader:boolean;

  //save Flag
  submitted = false;

  //user detail
  _loggedInUser: any;

  opportunityForm: FormGroup;
  opportunityModel: any = {
    id: 0,
    tenantId: 0,
    entityWorkflowId: null,
    entityRecordTypeId: null,
    entityTypeId: null,
    entityId: null,
    name: '',
    description: '',
    //relatedTo: null,
    contactID:null,
    accountID:null,
    assignedTo: null,
    ownerId: null,
    amount: null,
    dueDate: null,
    leadSource: null,
    confidenceLevel: null,
    isPrivate: false,
  };

  validation_messages = {
    'name': [
      { type: 'required', message: 'OPPORTUNITIES.ADD_DIALOG.NAME_REQUIRED' },
      { type: 'maxlength', message: 'OPPORTUNITIES.ADD_DIALOG.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'OPPORTUNITIES.ADD_DIALOG.MESSAGE_NAME_MIN' }
    ],
    'description': [
      { type: 'minlength', message: 'OPPORTUNITIES.ADD_DIALOG.MESSAGE_DESCRIPTION_MIN' }
    ],
    // "relatedTo": [
    //   { type: 'required', message: 'OPPORTUNITIES.ADD_DIALOG.RELATED_TO_REQUIRED' },
    // ],
    "ownerId": [
      { type: "required", message: "OPPORTUNITIES.ADD_DIALOG.OWNER_REQUIRED" }
    ],
    "amount": [
      { type: "maxlength", message: "OPPORTUNITIES.ADD_DIALOG.MESSAGE_AMOUNT_MAX" }
    ],
    "dueDate": [],
    "leadSource": [],
    "confidenceLevel": [
      { type: 'min', message: 'OPPORTUNITIES.ADD_DIALOG.MESSAGE_CONFIDENCELEVEL_MIN' },
      { type: 'max', message: 'OPPORTUNITIES.ADD_DIALOG.MESSAGE_CONFIDENCELEVEL_MAX' }
    ],
    'entityWorkflowId': [
      { type: 'required', message: 'OPPORTUNITIES.ADD_DIALOG.WORKFLOW_REQUIRED' }
    ],
    "isPrivate": [],
    "assignedTo": []
  }

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //For Model Ref
  modalRef: NgbModalRef | null;
  isSpecificWorkflowPage: boolean = true;

  //All workflow list for parent 
  workflowsListAccount: any;
  workflowListContact: any;
  
  isAssignOpportunity: boolean = false;

  recordTypesForAccount: any;
  recordTypesForContact: any;
  hasAddAccountPermission: boolean = false;
  hasAddContactPermission: boolean = false;

  accountTypeList: any = null; //related to entity records
  customerContactList: any[] = []; //related to data source 

  accountTypePlaceholder = 'ORDERS.ADD_DIALOG.ACCOUNT_TYPE_PLACEHOLDER';
  contactPlaceholder  = 'ORDERS.ADD_DIALOG.CONTACT_PLACEHOLDER';

  entityRelationComponent: EntityRelationComponentsModel;
  entityRelationTypes: any[] = [];
  customFields: any[] = [];
  
  constructor(private _ngbActiveModal: NgbActiveModal,
    public _commonHelper: CommonHelper,
    private _formBuilder: FormBuilder,
    private _opportunitiesService: OpportunitiesService,
    private _commonService: CommonService,
    private _settingsService: SettingsService,
    private _dataSourceService: DatasourceService,
    private _modalService: NgbModal,
    private _entityRelationService: EntityRelationService) {
  }

  ngOnInit(): void {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    this.isAssignOpportunity = this._commonHelper.havePermission(enumPermissions.AssignOpportunity);

    this.checkAddEntityPermission();

    this.opportunityForm = this.createOpportunityForm();
    
    if(this.entityType == Entity.Contacts){
      this.showMemberDropDown = false;
    }else if(this.entityType == Entity.Accounts){
      this.showCompanyDropDown = false;
    }

    if(this.relatedEntityTypeId == Entity.Accounts) {
      this.getEntityRecordTypes();
    }else if(this.relatedEntityTypeId == Entity.Contacts) {
      this.getEntityRecordTypes();
    }

    this.getEntityRelationComponents().then(() => {
      if (this.entityRelationComponent) {
        this.getEntityRelationTypes();
        this.getCustomFields();
      }
    });

    Promise.all([
      this.getWorkflowListForAccount(), 
      this.getWorkflowListForContact(),
      this.getAccountList(''),
      this.getContactCustomerList(''),
    ]).then((result) => { });
    
    this.setInitialValues();

    this.checkHasPermissionForAddRelatedTo();
    this.getOwnerUsers(null, 1, null);
    this.getLeadSources();
    this.getCurrencySymbol();

  }

  private setInitialValues()
  {
    if ((!this.entityWorkflowId && !this.entityRecordTypeId) || (this.entityWorkflowId && !this.entityRecordTypeId)) {
      this.isSpecificWorkflowPage = false;
      this.showHideRelatedToBasedOnRecordType();

      this.showHideWorkflowAndAssignedTo();

      this.getRelatedToInitially();

      // Get Assigned To users
      if (this.isAssignOpportunity) {
        this.getAssignedToUsers(null, 1, null);
      }
      this.entityWorkflowId = null;
    }
    else {
       this.setDataForSpecificWorkflow();
    }
  }
  private showHideRelatedToBasedOnRecordType()
  {
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
      this.opportunityForm.controls['entityRecordTypeId'].patchValue(this.entityRecordTypeId);
      this.opportunityForm.controls['entityRecordTypeId'].updateValueAndValidity();
    }
    else if (this.entityRecordTypes && this.entityRecordTypes.length > 0) {
      this.copyOfRecordTypes = this._commonHelper.deepClone(this.entityRecordTypes)
    }
    else {
      this.isShowRecordTypes = false;
    }
  }

  private showHideWorkflowAndAssignedTo()
  {
      // Workflows
      if (this.workflows && this.workflows?.length == 1) {
        this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
        this.isShowWorkFlow = false;
        this.entityWorkflowId = this.workflows[0].value;
        this.opportunityForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
        this.opportunityForm.controls['entityWorkflowId'].clearValidators();
        this.opportunityForm.controls['entityWorkflowId'].updateValueAndValidity();
      }
      else if (this.workflows && this.workflows?.length > 0) {
        this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
        if (this.copyOfRecordTypes?.length == 1) {
          this.workflows = this.workflows?.filter(x => x.isDefault || x.parentEntityTypeID == this.relatedEntityTypeId);
        }
        else {
          this.workflows = this.copyOfWorkflows?.filter(s => s.isDefault);
        }
      }
      else {
        this.isShowWorkFlow = false;
        this.isShowAssignTo = false;
        if (this.workflows?.length <= 0) {
          this.opportunityForm.controls['entityWorkflowId'].clearValidators();
          this.opportunityForm.controls['entityWorkflowId'].updateValueAndValidity();
        }
      }
  }

  private getRelatedToInitially()
  {
    if (this.isShowRelatedTo) {
      if (this.relatedEntityTypeId == null) {
        // Load all related to initially
        let coreEntities = this._commonHelper.entityTypeList?.filter(x => x.isCoreEntity && x.id != Entity.Opportunities && x.id != Entity.Cases && x.id != Entity.Products);
        let entityTypeIDs = null;
        if (coreEntities != null && coreEntities?.length > 0)
          entityTypeIDs = coreEntities.map(x => x.id).join(',');
        this.getRelatedTo(entityTypeIDs, 0, null)
      }
      else {
        this.getRelatedTo([this.relatedEntityTypeId], 0, null)
      }
    }
  }

  private setDataForSpecificWorkflow() 
  {
    this.isSpecificWorkflowPage = true;
    const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.relatedEntityTypeId);
    if (foundRecord) {
      this.relatedToEntiyName = foundRecord?.['displayName'].toString().trim()
      this.relatedToPlaceholder = (this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ADD_DIALOG.RELATED_TO_PLACEHOLDER', { entityName: foundRecord?.['displayName'].toString().trim() }));
    }
    // Load all related to initially
    this.getRelatedTo([this.relatedEntityTypeId], 0, null)

    // Get Assigned To users
    if (this.isAssignOpportunity) {
      this.getAssignedToUsers(null, 1, null);
    }
    
    this.isShowRecordTypes = false;
    this.isShowWorkFlow = false;

    this.opportunityForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
    this.opportunityForm.controls['entityWorkflowId'].clearValidators();
    this.opportunityForm.controls['entityWorkflowId'].updateValueAndValidity();

    this.isShowRelatedTo = !(this.relatedEntityTypeId == null)
    this.isShowAssignTo = true;

    this.setRelateToEntityDisplay(this.relatedEntityTypeId);
  }

  private createOpportunityForm(): FormGroup {
    return this._formBuilder.group({
      id: 0,
      tenantId: 0,
      entityWorkflowId: [this.opportunityModel.entityWorkflowId, Validators.compose([Validators.required])],
      entityTypeId: null,
      entityRecordTypeId: null,
      entityId: null,
      name: [this.opportunityModel.name, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(500)])],
      description: [this.opportunityModel.description, Validators.compose([Validators.minLength(2)])],
      assignedTo: [this.opportunityModel.assignedTo],
      //relatedTo: [this.opportunityModel.relatedTo],
      contactID: [this.entityType == Entity.Contacts ? this.relatedEntityId : this.opportunityModel.contactID],
      accountID: [this.entityType == Entity.Accounts ? this.relatedEntityId : this.opportunityModel.accountID],
      ownerId: [this.opportunityModel.ownerId, Validators.compose([Validators.required])],
      amount: [this.opportunityModel.amount, Validators.compose([Validators.maxLength(14)])],
      dueDate: [this.opportunityModel.dueDate],
      leadSource: [this.opportunityModel.leadSource],
      confidenceLevel: [this.opportunityModel.confidenceLevel, Validators.compose([Validators.max(100), Validators.min(0)])],
      isPrivate: [this.opportunityModel.isPrivate]
    });
  }

  setRelateToEntityDisplay(relatedEntityTypeId) {
    const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == relatedEntityTypeId);
    if (foundRecord) {
      this.relatedToEntiyName = foundRecord?.['displayName'].toString().trim();
      this.relatedToPlaceholder = (this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ADD_DIALOG.DYNAMIC_RELATED_TO_PLACEHOLDER', { entityName: foundRecord?.['displayName'].toString().trim() }));
      this.relatedToIconToolTip = foundRecord?.['displayName'].toString().trim();
    }
    else {
      this.relatedToEntiyName = '';
      this.relatedToPlaceholder = '';
    }
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

  // get assigned to users
  private getAssignedToUsers(assignedTo, includeAllUsers = 1, searchString = null) {
    // prepare params
    this.showAssignedToLoader = true;
    let defaultStageID = this.workflows?.find(x => x.value == this.entityWorkflowId)?.defaultStageID;
    
    const params = this.prepareParamsForAssignedToUsers(defaultStageID, assignedTo, includeAllUsers, searchString);
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYASSIGNEDTO, params).then((response: any) => {
      //assigned to users
      if (response != undefined) {
        // users to assign to dropdwon
        this.assignedToUsers = response as [];
      }
    }, (error) => {
      this.showAssignedToLoader = false;
    });
  }

  // get related to entities based on entity type
  private getRelatedTo(selectedEntities: any, includeAllEntities, searchString: any = '', selectedEntityID = null) {
    return new Promise((resolve, reject) => {
      this.showRelatedToLoader = true;
      this.relatedToList = [];
      let params = [{
        name: 'EntityTypeIDs',
        type: 'string',
        value: selectedEntities && selectedEntities.length > 0 ? selectedEntities.toString() : null
      },
      {
        name: 'SelectedEntityID',
        type: 'int',
        value: selectedEntityID
      },
      {
        name: 'IncludeAllEntities',
        type: 'bit',
        value: includeAllEntities
      },
      {
        name: 'SearchString',
        type: 'string',
        value: searchString
      }];

      // Set tree structure or normal drop down
      this.isRelatedToGroupDropDown = (this.entityRecordTypeId && this.entityRecordTypeId > 0) ? false : true;

      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALL_RELATED_ENTITIES, params).then((response: any) => {
        if (response && response.length > 0) {
          let responseList: any = response as [];
          if (this.isRelatedToGroupDropDown) {
            this.relatedToList = this.prepareRelatedToTree(responseList);
            if (this.relatedToList.length == 1) {
              this.relatedToEntiyName = this.relatedToList[0].relatedToIconToolTip;
              this.relatedToPlaceholder = (this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ADD_DIALOG.DYNAMIC_RELATED_TO_PLACEHOLDER', { entityName: this.relatedToList[0].relatedToIconToolTip }));
            }
            else {
              this.relatedToEntiyName = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ADD_DIALOG.RELATED_TO');
              this.relatedToPlaceholder = (this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ADD_DIALOG.RELATED_TO_PLACEHOLDER'));
            }
          }
          else {
            this.relatedToList = responseList.map(x => ({ 'label': x.label, 'value': x.value }));
          }
          this.copyOfRelatedToList = this._commonHelper.deepClone(this.relatedToList);
        }
        else{
          if (!this.isSpecificWorkflowPage && !this.entityRecordTypeId) {
            this.relatedEntityTypeId = null;
            this.isAddRelatedTo = (this.relatedEntityTypeId && this.relatedEntityTypeId > 0);
            this.setRelateToEntityDisplay(this.relatedEntityTypeId);
        }
      }

        this.showRelatedToLoader = false;
        resolve(null);
      }, (error) => {
        this._commonHelper.showToastrError(error.message);
        this.showRelatedToLoader = false;
        reject(null);
      });
    }).catch();
  }

  private prepareRelatedToTree(responseList: any): [] {
    let relatedToGroupList: any = [];
    let filteredGroups = Array.from(new Set(responseList.map((item: any = []) =>  (item.entityTypeID))));
    filteredGroups.forEach(entityTypeID => {
      let items = responseList.filter((obj: any) => { return obj.entityTypeID === entityTypeID }).map((s: any) => { return { label: s.label, value: s.value, relatedToEntityTypeId: s.entityTypeID, relatedToEntityTypeName: s.entityTypeName } });
      let relatedToEntityTypeId = items && items.length > 0 ? items[0].relatedToEntityTypeId : null;
      let relatedToEntityTypeName = items && items.length > 0 ? items[0].relatedToEntityTypeName : null;
      const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == entityTypeID); 
      relatedToGroupList.push({
        relatedToIconToolTip: foundRecord?.['displayName'].toString().trim(),
        relatedToEntityTypeName: relatedToEntityTypeName,
        relatedToEntityTypeId: relatedToEntityTypeId,
        items: items as []
      });
    });
    return relatedToGroupList;
  }

  private prepareParamsForAllUsers(ownerId, includeAllUsers = 1, searchString = null) {
    const params = [];
    const paramItem = {
      name: 'SelectedUserID',
      type: 'int',
      value: ownerId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'IncludeAllUsers',
      type: 'bit',
      value: includeAllUsers
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SearchString',
      type: 'string',
      value: searchString
    };
    params.push(paramItem2);

    return params;
  }

  // get assigned to users
  private getOwnerUsers(ownerId, includeAllUsers = 1, searchString = null) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      var params = this.prepareParamsForAllUsers(ownerId, includeAllUsers, searchString);
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYOWNERS, params).then((response: any) => {
        //assigned to users
        if (response != undefined) {
          // users to assign to dropdwon
          this.ownerUsers = response as [];
        }
        this._commonHelper.hideLoader();
        resolve(null);
      }, (error) => {
        this._commonHelper.showToastrError(error.message);
        this._commonHelper.hideLoader();
        reject(null);
      });
    }).catch();
  }

  private getLeadSources(): Promise<any> {
    return new Promise((resolve, reject) => {
      const params = { refType: RefType.LeadSource };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.LeadSource}`;

      const leadSources = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (leadSources == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params)
          .then((response: any) => {
            this._commonHelper.hideLoader();
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
            this.leadSources = response;
            resolve(null);
          }, (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      }
      else {
        this.leadSources = leadSources;
        resolve(null);
      }
    }).catch();
  }

  private getCurrencySymbol() {
    return new Promise((resolve, reject) => {
      const currencySymbol = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL));
      if (currencySymbol == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CURRENCY_SYMBOL).then((response: any) => {
          this.currencySymbol = response.currencySymbol;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL, JSON.stringify(this.currencySymbol));
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
        this.currencySymbol = currencySymbol;
        resolve(null);
      }
    }).catch();
  }

  //For Form Validate
  private validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      }
      else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  //save work task
  saveOpportunity(formData) {
    this.submitted = true;
    if (this.opportunityForm.invalid) {
      this.validateAllFormFields(this.opportunityForm);
      return;
    }

    //prepare params
    let params = {
      id: 0,
      tenantId: 0,
      entityWorkflowId: formData.entityWorkflowId,
      entityRecordTypeId: this.entityRecordTypeId,
      // entityTypeId: this.relatedEntityTypeId,
      // entityId: formData.relatedTo && formData.relatedTo.value ? formData.relatedTo.value : this.relatedEntityId,
      name: formData.name,
      description: formData.description,
      assignedTo: formData.assignedTo,
      ownerId: formData.ownerId,
      totalAmount: formData.amount,
      dueDate: formData.dueDate != null ? moment(formData?.dueDate).format('YYYY-MM-DD') : formData?.dueDate,
      leadSourceId: formData.leadSource,
      confidenceLevel: formData.confidenceLevel,
      isPrivate: formData.isPrivate,
      contactID: this.entityType  == Entity.Contacts? this.relatedEntityId : (formData.contactID || null),
      accountID: this.entityType == Entity.Accounts ? this.relatedEntityId : (formData.accountID || null),
    }

    this._commonHelper.showLoader();
    // save work task
    this._opportunitiesService.saveOpportunity(params).then(response => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ADD_DIALOG.SUCCESS_MESSAGE'));
      this._ngbActiveModal.close(response);
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }
 

  assignedToOnFilter(e) {
    this.getAssignedToUsers(e.value, 0, e.filter);
  }

  assignedToOnChange(e) {
    if (!e.value) {
      this.getAssignedToUsers(e.value, 1, null);
    }
  }

  ownerOnFilter(e) {
    this.getOwnerUsers(e.value, 0, e.filter);
  }

  ownerOnChange(e) {
    if (!e.value) {
      this.getOwnerUsers(e.value, 1, null);
    }
  }

  //for close form
  onCloseForm(status: boolean) {
    this._ngbActiveModal.close(status);
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'opportunities.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }

  onWorkflowChange(e) {
    if (e.value) {
      this.entityWorkflowId = e.value;

      if (this.isAssignOpportunity) {
        this.getAssignedToUsers(null, 0, null);
      }
      
      // set record type from selected workflow
      if (this.workflows != null && this.workflows.length > 0) {
        this.checkHasPermissionForAddRelatedTo();
      }
    } else {
      this.isAddRelatedTo = !this.entityWorkflowId && !this.entityRecordTypeId ? false : true;
    }
  }

  onWorkflowClear(e) {
    this.entityWorkflowId = null;
    this.assignedToUsers = [];
    this.isAddRelatedTo = !this.entityWorkflowId && !this.entityRecordTypeId ? false : true;
  }

  addRelatedTo() {

    if (!this.relatedEntityTypeId) return;

    this.optionsForPopupDialog.size = "md";

    if (this.relatedEntityTypeId == Entity.Accounts) {
      this.modalRef = this._modalService.open(AccountAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
      this.modalRef.componentInstance.entityTypeId = Entity.Accounts;
      this.modalRef.componentInstance.recordTypes = this.recordTypeList?.filter(x => x.value != 0);
      this.modalRef.componentInstance.entityRecordTypeId = null;
      this.modalRef.componentInstance.workflows = this.workflowsListAccount?.filter((x: any) => x.value != 0);
      this.modalRef.componentInstance.isShowAssignedTo = true;
      this.modalRef.componentInstance.isShowWorkflow = true;
    } else if (this.relatedEntityTypeId == Entity.Contacts) {
      this.modalRef = this._modalService.open(ContactAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
      this.modalRef.componentInstance.entityTypeId = Entity.Contacts;
      this.modalRef.componentInstance.entityRecordTypeId = null;
      this.modalRef.componentInstance.workflows = this.workflowListContact?.filter((x: any) => x.value != 0);
      this.modalRef.componentInstance.recordTypes = this.recordTypeList?.filter(x => x.value != 0);
      this.modalRef.componentInstance.isShowAssignTo = true;
      this.modalRef.componentInstance.isShowWorkflow = true;
    }

    this.modalRef.componentInstance.entityRecordTypeId = this.relatedEntityRecordTypeId;
    this.modalRef.componentInstance.isFromSameEntity = false;

    this.modalRef.result.then((response: any) => {
      if (response) {
        if (this.drpRelatedTo.filterValue) {
          this.drpRelatedTo.resetFilter();
          if(this.isRelatedToGroupDropDown)
          {
          this.getRelatedTo([Entity.Accounts, Entity.Contacts], 1, ' ', response['id']);
           }
          else {
            this.getRelatedTo([this.relatedEntityTypeId], 1, '', response['id']);
          }
        }
        if (this.relatedToList && this.relatedToList.length > 0) {
          if (this.isRelatedToGroupDropDown) {
            let items = this.relatedToList.find((obj: any) => obj.relatedToEntityTypeId === this.relatedEntityTypeId);
            const relatedTo = { value: response['id'], label: response['name'], relatedToEntityTypeId: this.relatedEntityTypeId, relatedToEntityTypeName: items.relatedToEntityTypeName };
            items.items.unshift(relatedTo);
            this.opportunityForm.controls['relatedTo'].patchValue(relatedTo);
            this.opportunityForm.controls['relatedTo'].updateValueAndValidity();
          }
          else {
            const relatedTo = { value: response['id'], label: response['name'] };
            this.relatedToList.unshift(relatedTo);
            this.opportunityForm.controls['relatedTo'].patchValue({ value: response['id'], label: response['name'] });
            this.opportunityForm.controls['relatedTo'].updateValueAndValidity();
          }
        } else {
          this.relatedToList = [];
          const relatedTo = { value: response['id'], label: response['name'] };
          this.relatedToList.push(relatedTo);

          if (this.isRelatedToGroupDropDown) {
            let items = this.relatedToList.find((obj: any) => obj.relatedToEntityTypeId === this.relatedEntityTypeId);
            const relatedTo = { value: response['id'], label: response['name'], relatedToEntityTypeId: this.relatedEntityTypeId, relatedToEntityTypeName: items.relatedToEntityTypeName };
            items.items.unshift(relatedTo);
            this.opportunityForm.controls['relatedTo'].patchValue(relatedTo);
            this.opportunityForm.controls['relatedTo'].updateValueAndValidity();
          }
          else {
            const relatedTo = { value: response['id'], label: response['name'] };
            this.relatedToList.unshift(relatedTo);
            this.opportunityForm.controls['relatedTo'].patchValue({ value: response['id'], label: response['name'] });
            this.opportunityForm.controls['relatedTo'].updateValueAndValidity();
          }
        }
      }
    });
  }

  checkHasPermissionForAddRelatedTo() {
    if (this.relatedEntityTypeId == Entity.Accounts) {
      this.isAddRelatedTo = this._commonHelper.havePermission(enumPermissions.AddAccount);
    } else if (this.relatedEntityTypeId == Entity.Contacts) {
      this.isAddRelatedTo = this._commonHelper.havePermission(enumPermissions.AddContact);
    }
  }

  onRecordTypeChange(e) {
    if (e.value) {

      this.entityRecordTypeId = e.value.value; 
      this.relatedEntityTypeId = e.value.relatedToEntityTypeId; 
      this.getEntityRecordTypes();
      if (this.relatedEntityTypeId && this.relatedEntityTypeId > 0) {
        this.getRelatedTo([this.relatedEntityTypeId], 0, null);
        this.setRelateToEntityDisplay(this.relatedEntityTypeId);
        this.isAddRelatedTo = true;
        this.checkHasPermissionForAddRelatedTo();
      } else {
        this.relatedToList = null;
        this.copyOfRelatedToList = null;
        this.setRelateToEntityDisplay(null);
        this.isAddRelatedTo = false;
        this.checkHasPermissionForAddRelatedTo();
      }

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
    this.opportunityForm.controls['entityWorkflowId'].patchValue(null);
    this.opportunityForm.controls['entityWorkflowId'].updateValueAndValidity();
    this.getRelatedTo([Entity.Accounts, Entity.Contacts], 0, e.filter);
    this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
    this.assignedToUsers = [];
    this.setRelateToEntityDisplay(null);
    this.setRelateToEntityDisplay(null);
    this.isAddRelatedTo = false;
    this.checkHasPermissionForAddRelatedTo();
  }

  onRelatedToChange(e) {
    if (e.value) {
      this.isAddRelatedTo = true;
      if (!this.isSpecificWorkflowPage) {
        if (this.isRelatedToGroupDropDown) {
          this.entityWorkflowId = this.relatedEntityTypeId != e.value.relatedToEntityTypeId ? null : this.entityWorkflowId;
          this.relatedEntityTypeId = e.value.relatedToEntityTypeId;
        }
        if (this.relatedEntityTypeId && this.entityRecordTypeId) {
          this.workflows = this.copyOfWorkflows.filter(s => (s.entityRecordTypeID == this.entityRecordTypeId) || s.isDefault);
        }
        else if (this.relatedEntityTypeId && !this.entityRecordTypeId) {
          this.workflows = this.copyOfWorkflows.filter(s => (s.parentEntityTypeID == this.relatedEntityTypeId) || s.isDefault);
        }
        else{
          this.workflows = this.copyOfWorkflows;
        }
        this.setRelateToEntityDisplay(this.relatedEntityTypeId);
      }
      this.checkHasPermissionForAddRelatedTo();
    }
  }

  onRelatedToFilter(e) {
    if (e) {
      if (this.isSpecificWorkflowPage && this.relatedEntityTypeId) {
        this.getRelatedTo([this.relatedEntityTypeId], 0, e.filter);
      }
      else {
        if (!this.isSpecificWorkflowPage && this.relatedEntityTypeId && this.relatedEntityTypeId > 0) {
          this.getRelatedTo([this.relatedEntityTypeId], 0, e.filter);
        }
        else {
          this.getRelatedTo([Entity.Accounts, Entity.Contacts], 0, e.filter);
        }
      }
    }
  }

  onRelatedToClear(e) {
      if (this.isSpecificWorkflowPage) {
        if (this.relatedEntityTypeId && this.relatedEntityTypeId > 0) {
          this.getRelatedTo([this.relatedEntityTypeId], 0, null);
          this.setRelateToEntityDisplay(this.relatedEntityTypeId);
        }
      }
      else {
        if (this.entityRecordTypeId && this.relatedEntityTypeId) {
          this.workflows = this.copyOfWorkflows.filter(s => (s.entityRecordTypeID == this.entityRecordTypeId) || s.isDefault);
          this.getRelatedTo([this.relatedEntityTypeId], 0, null);
          this.setRelateToEntityDisplay(this.relatedEntityTypeId);
        }
        else if (this.entityRecordTypeId && !this.relatedEntityTypeId) {
          this.workflows = this.copyOfWorkflows.filter(s => (s.entityRecordTypeID == this.entityRecordTypeId) || s.isDefault);
          this.relatedToList = null;
          this.copyOfRelatedToList = this._commonHelper.deepClone(this.relatedToList);
          this.assignedToUsers = [];
          this.setRelateToEntityDisplay(null);
        }
        else {
          this.entityWorkflowId = null;
          this.opportunityForm.controls['entityWorkflowId'].patchValue(null);
          this.opportunityForm.controls['entityWorkflowId'].updateValueAndValidity();
          this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
          this.getRelatedTo([Entity.Accounts, Entity.Contacts], 0, null);
          this.assignedToUsers = [];
          this.relatedEntityTypeId = null;
          this.setRelateToEntityDisplay(null);
        }
    }
    this.isAddRelatedTo = (this.relatedEntityTypeId && this.relatedEntityTypeId > 0);
    this.checkHasPermissionForAddRelatedTo();
  }

  private prepareParamsForWorkflows(entityTypeId: number) {
    return [{ name: 'EntityTypeID', type: 'int', value: entityTypeId }];
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

  private getEntityRecordTypes() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._commonService.getEntityRecordTypes().then((response: any) => {
        if (response) {
          if (this.relatedEntityTypeId == Entity.Accounts) {
            this.recordTypeList = response?.filter(x => x.entityTypeID == Entity.Accounts).map(x => ({ 'label': x.name, 'value': x.id }));
          } else if (this.relatedEntityTypeId == Entity.Contacts) {
            this.recordTypeList = response?.filter(x => x.entityTypeID == Entity.Contacts).map(x => ({ 'label': x.name, 'value': x.id }));
          }else {
            this.recordTypeList = this.recordTypeList?.filter(x => (x.entityRecordTypeId == this.entityRecordTypeId)).map(x => ({'label':x.name,'value':x.id }));
          }
          this.recordTypeList?.sort((a, b) => a.value - b.value);
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

  checkAddEntityPermission() {
    this.hasAddAccountPermission  = this._commonHelper.havePermission(enumPermissions.AddAccount);
    this.hasAddContactPermission = this._commonHelper.havePermission(enumPermissions.AddContact);
  }

  getContactCustomerList(searchString: any) {
    return new Promise((resolve, reject) => {
      this.showContactLoader  = true;
      let dataSource;
      let params ;
      if(this.opportunityForm?.controls['accountID'].value > 0)
        {
           dataSource = DataSources.RELATEDENTITYRELATIONS;
           params = this.prepareParamsForGetCustomerContact(searchString);
        }
        else
        {
          dataSource = DataSources.ALL_RELATED_ENTITIES;
          params = this.prepareParamsForGetAllEntities(Entity.Contacts.toString(),null, 0, searchString);
        }
      
      this._dataSourceService.getDataSourceDataByCodeAndParams(dataSource, params).then((response: any) => {
        //product category  
        this.customerContactList = response as [];
        this.showContactLoader  = false;
        resolve(null);
      },
        (error) => {
          this.showContactLoader  = false;
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    });
  }

  onChangeAccount(event: any) {
    this.getContactCustomerList('');
  }

  onFilterAccount(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getAccountList(e.filter.trim());
      }
    }
    else {
      this.getAccountList('');
    }
  }

  getAccountList(searchString: any) {
    return new Promise((resolve, reject) => {
      let params;
      let dataSource;
      if(this.opportunityForm?.controls['contactID'].value > 0)
      {
        params = this.prepareParamsForGetAccount(searchString);
        dataSource = DataSources.RELATEDENTITYRELATIONS;
      }
      else
      {
        params = this.prepareParamsForGetAllEntities(Entity.Accounts.toString(),null, 0, searchString);
        dataSource = DataSources.ALL_RELATED_ENTITIES;
      }
      
      this.showAccountLoader = true;
      this._dataSourceService.getDataSourceDataByCodeAndParams(dataSource, params).then((response: any) => {
        //account type
        if (response.length != 0) {
          this.accountTypeList = response as [];
        }
        this.showAccountLoader = false;
        resolve(null);
      },
        (error) => {
          this.showAccountLoader = false;
          this.getTranslateErrorMessage(error);
          resolve(null);
        });
    });
  }

  prepareParamsForGetCustomerContact(searchString: any) {
    const params = [];
    const selectedAccountID = this.opportunityForm?.controls['accountID'].value|| null; //this.opportunityForm?.controls['AccountID'].value || null;
    let paramItem1 = {
      name: 'SearchString',
      type: 'string',
      value: searchString
    };
    params.push(paramItem1);

    let paramItem2 = {
      name: 'FromEntityID',
      type: 'int',
      value: selectedAccountID
    };
    params.push(paramItem2);

    let paramItem3 = {
      name: 'FromEntityTypeID',
      type: 'int',
      value: Entity.Accounts
    };
    params.push(paramItem3);

    let paramItem4 = {
      name: 'FromTenantID',
      type: 'int',
      value: this._loggedInUser.tenantId
    };
    params.push(paramItem4);

    let paramItem5 = {
      name: 'ToTenantID',
      type: 'int',
      value: this._loggedInUser.tenantId
    };
    params.push(paramItem5);

    let paramItem6 = {
      name: 'ToEntityTypeID',
      type: 'int',
      value: Entity.Contacts
    };
    params.push(paramItem6);

    let paramItem7 = {
      name: 'ToEntityID',
      type: 'int',
      value: null
    };
    params.push(paramItem7);

    let paramItem8 = {
      name: 'SelectedEntityID',
      type: 'int',
      value: null
    };
    params.push(paramItem8);

    return params;
  }

  prepareParamsForGetAllEntities(entityTypeIDs: string = null, selectedEntityID = null, includeAllEntities = 1, searchString: any = '') {
    const params: any = [];

    params.push({
      name: 'EntityTypeIDs',
      type: 'string',
      value: entityTypeIDs
    });

    params.push({
      name: 'SelectedEntityID',
      type: 'int',
      value: selectedEntityID
    });

    params.push({
      name: 'IncludeAllEntities',
      type: 'bit',
      value: includeAllEntities
    });

    params.push({
      name: 'SearchString',
      type: 'string',
      value: searchString
    });

    return params;
  }

  prepareParamsForAccountType(searchString: any) {
    const params = [];
    let paramItem = {
      name: 'SearchString',
      type: 'string',
      value: searchString
    };
    params.push(paramItem);
    return params;
  }

  prepareParamsForGetAccount(searchString: any) {
    const params = [];
    const selectedContactID = this.opportunityForm?.controls['contactID'].value|| null; //this.opportunityForm?.controls['AccountID'].value || null;
    let paramItem1 = {
      name: 'SearchString',
      type: 'string',
      value: searchString
    };
    params.push(paramItem1);

    let paramItem2 = {
      name: 'FromEntityID',
      type: 'int',
      value: null
    };
    params.push(paramItem2);

    let paramItem3 = {
      name: 'FromEntityTypeID',
      type: 'int',
      value: Entity.Accounts
    };
    params.push(paramItem3);

    let paramItem4 = {
      name: 'FromTenantID',
      type: 'int',
      value: this._loggedInUser.tenantId
    };
    params.push(paramItem4);

    let paramItem5 = {
      name: 'ToTenantID',
      type: 'int',
      value: this._loggedInUser.tenantId
    };
    params.push(paramItem5);

    let paramItem6 = {
      name: 'ToEntityTypeID',
      type: 'int',
      value: Entity.Contacts
    };
    params.push(paramItem6);

    let paramItem7 = {
      name: 'ToEntityID',
      type: 'int',
      value: selectedContactID
    };
    params.push(paramItem7);

    let paramItem8 = {
      name: 'SelectedEntityID',
      type: 'int',
      value: null
    };
    params.push(paramItem8);

    return params;
  }

  addNewAccount() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(AccountAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
    this.modalRef.componentInstance.entityTypeId = Entity.Accounts;
    this.modalRef.componentInstance.recordTypes = this.recordTypesForAccount?.filter(x => x.value != 0);
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.workflows = this.workflowsListAccount?.filter((x: any) => x.value != 0);
    this.modalRef.componentInstance.isShowAssignedTo = true;
    this.modalRef.componentInstance.isShowWorkflow = true;
    this.modalRef.componentInstance.isFromSameEntity = false;

    this.modalRef.result.then((response: any) => {
      if (response) {
        if (this.entityType == Entity.Contacts && this.entityRelationComponent &&  this.opportunityForm.get('contactID').value) {
          this.processWithMapRelation(response).then(() => {
            if (this.drpAccount.filterValue) {
              this.drpAccount.resetFilter();
              this.getAccountList('').then(() => {
                this.mappedAccountDropDown(response);
              });
            } else {
              this.mappedAccountDropDown(response);
            }
          });
        } else {
          this.mappedAccountDropDown(response);
        }
      }
    });
  }

  private mappedAccountDropDown(response: any) {
    const account = { value: response['id'], label: response['name'] };
    if (this.accountTypeList && this.accountTypeList.length > 0) {
      this.accountTypeList.unshift(account);

      this.opportunityForm.controls['accountID'].patchValue(response['id']);
      this.opportunityForm.controls['accountID'].updateValueAndValidity();
    } else {
      this.accountTypeList = [];
      this.accountTypeList.push(account);
      this.opportunityForm.controls['contactID'].patchValue(response['id']);
      this.opportunityForm.controls['accountID'].updateValueAndValidity();
    }
  }

  addNewContact(){
  
    this.modalRef = this._modalService.open(ContactAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
    this.modalRef.componentInstance.entityTypeId = Entity.Contacts;
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.workflows = this.workflowListContact?.filter((x: any) => x.value != 0);
    this.modalRef.componentInstance.recordTypes = this.recordTypesForContact?.filter(x => x.value != 0);
    this.modalRef.componentInstance.isShowAssignTo = true;
    this.modalRef.componentInstance.isShowWorkflow = true;

    this.modalRef.componentInstance.isFromSameEntity = false;

    this.modalRef.result.then((response: any) => {
      if (response) {
        if ((!this.entityType || this.entityType == Entity.Accounts) && this.entityRelationComponent &&  this.opportunityForm.get('accountID').value) {
          this.processWithMapRelation(response).then(() => {
            if (this.drpContact.filterValue) {
              this.drpContact.resetFilter();
              this.getContactCustomerList('').then(() => {
                this.mappedContactDropDown(response);
              });
            } else {
              this.mappedContactDropDown(response);
            }
          });
        } else {
          this.mappedContactDropDown(response);
        }
      }
    });
  }

  private mappedContactDropDown(response: any) {
    const contact = { value: response['id'], label: response['name'] };
    if (this.customerContactList && this.customerContactList.length > 0) {
      this.customerContactList.unshift(contact);

      this.opportunityForm.controls['contactID'].patchValue(response['id']);
      this.opportunityForm.controls['contactID'].updateValueAndValidity();
    } else {
      this.customerContactList = [];
      this.customerContactList.push(contact);
      this.opportunityForm.controls['contactID'].patchValue(response['id']);
      this.opportunityForm.controls['contactID'].updateValueAndValidity();
    }
  }

  //#region  Entity Relation
  private getEntityRelationComponents() {
    return new Promise((resolve, reject) => {

      this._entityRelationService.getEntityRelationComponents(this.entityType ?? Entity.Accounts).then((res : EntityRelationComponentsModel[]) => {
        if (res) {
          this.entityRelationComponent = res.find(x => x.toEntityTypeID === Entity.Contacts);
          if (this.entityRelationComponent) {
            this.entityRelationComponent.columnSettings = this._commonHelper.tryParseJson(this.entityRelationComponent.listColumnSettings);
            this.entityRelationComponent.formLayoutSettings = this._commonHelper.tryParseJson(this.entityRelationComponent.formColumnSettings) as FormLayout;
          }
          resolve(this.entityRelationComponent);
        }
      }, (error) => {
        resolve(error);
      });
    });
  }

  private getEntityRelationTypes() {

    const payload = {
      'fromEntityTypeId': this.entityRelationComponent.fromEntityTypeID,
      'toEntityTypeId': this.entityRelationComponent.toEntityTypeID,
      'isReverseRelation': this.entityRelationComponent.isReverseRelation
    };

    this._entityRelationService.getEntityRelationTypes(payload)
      .then((response: Array<any>) => {
        this.entityRelationTypes = response || [];
        if (this.entityRelationTypes.length > 0) {
          this.entityRelationTypes = this.entityRelationTypes.map((x: any) => { return { 'label': x.name, 'value': x.id } });
        }
      });
  }

  private getCustomFields(): void {
    const param = { 'entityTypeId': Entity.EntityRelation };
    this._entityRelationService.getEntityRelationCustomField(param).then((response: any) => {
      if (response) {
        this.customFields = response as any[] || [];
      }
    });
  }

  private getOptionForPopupOptions(): NgbModalOptions {
    const popupOptions: NgbModalOptions = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false,
      animation: true
    };

    return popupOptions;
  }

  private processWithMapRelation(response: any) {
    return new Promise((resolve, reject) => {
      let optionsForPopupDialog: NgbModalOptions = this.getOptionForPopupOptions();

      if (this.entityRelationTypes.length > 1 || (this.customFields && this.customFields.length > 0)) {
        this.openEntityRelation(optionsForPopupDialog, Number(response['id'])).then((res) => {
          resolve(res);
        }, err => {
          reject(err)
        });
      } else if (this.entityRelationComponent.formLayoutSettings.panelGroup && this.entityRelationComponent.formLayoutSettings.panelGroup.length > 0) {
        this.openEntityRelation(optionsForPopupDialog, Number(response['id'])).then((res) => {
          resolve(res);
        }, err => {
          reject(err);
        });
      } else {
        this.saveEntityRelation(Number(response['id'])).then((res) => {
          resolve(res);
        }, (error) => {
          this.getTranslateErrorMessage(error);
          reject(error);
        });
      }
    });
  }

  private openEntityRelation(optionsForPopupDialog: NgbModalOptions, toEntityId: number) {

    return new Promise((resolve, reject) => {

      if (this.entityRelationComponent.formLayoutSettings) {
        if (this.entityRelationComponent.formLayoutSettings.optionsForFormDialog) {
          optionsForPopupDialog.size = this.entityRelationComponent.formLayoutSettings.optionsForFormDialog.size ?? 'md';
        }
      }

      this.modalRef = this._modalService.open(AddEntityRelationComponent, optionsForPopupDialog);
      this.modalRef.componentInstance.entityRelationComponent = this.entityRelationComponent;
      this.modalRef.componentInstance.fromEntityId = !this.entityRelationComponent.isReverseRelation ? this.opportunityForm.get('accountID').value : toEntityId;
      this.modalRef.componentInstance.toEntityId = !this.entityRelationComponent.isReverseRelation ? toEntityId : this.opportunityForm.get('contactID').value;
      this.modalRef.componentInstance.entityRelationTypes = this.entityRelationTypes;
      this.modalRef.componentInstance.customFields = this.customFields;
      this.modalRef.componentInstance.action = Actions.Add;

      this.modalRef.componentInstance.OnSubmitForm.subscribe((payload: any) => {
        if (payload) {
          this.saveEntityRelation(toEntityId, payload).then(res => {
            //this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ENTITY_RELATION_COMPONENTS.ADD_RELATION_DIALOG.MESSAGE_ADD_SUCCESS', { entityName :  this.relatedEntityConfigureName}));
            this.modalRef.close();
            resolve(payload);
          }, (error) => {
            this.getTranslateErrorMessage(error);
            if (error?.messageCode?.toLowerCase() !== 'staticmessage' && error?.messageCode?.toLowerCase() !== 'entityrelation.alreadyexists') {
              this.modalRef.close();
            }
            reject(error);
          });
        }
      });
    });
  }


  private saveEntityRelation(toEntityId: number, payload?: any) {

    return new Promise((resolve, reject) => {
      let fields = {};

      if (!payload?.fields) {
        fields = {
          id: 0,
          fromTenantID: this.entityRelationComponent.tenantID,
          toTenantID: this.entityRelationComponent.toTenantID,
          entityRelationTypeID: this.entityRelationTypes[0].value,
          fromEntityID: !this.entityRelationComponent.isReverseRelation ? this.opportunityForm.get('accountID').value : toEntityId,
          toEntityID:  !this.entityRelationComponent.isReverseRelation ? toEntityId : this.opportunityForm.get('contactID').value,
          fromEntityTypeID: this.entityRelationComponent.fromEntityTypeID,
          toEntityTypeID: this.entityRelationComponent.toEntityTypeID,
          isReverseRelation: this.entityRelationComponent.isReverseRelation
        };
      } else {
        payload.fields.isReverseRelation = this.entityRelationComponent.isReverseRelation;
        fields = payload?.fields;
      }

      fields = {
        Fields: fields,
        CustomFieldsJson: payload?.customFields
      };

      this._commonHelper.showLoader();
      this._entityRelationService.saveEntityRelation(fields).then((res) => {
        if (res) {
          this._commonHelper.hideLoader();
          resolve(res);
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        reject(error);
      });

    });
  }

  prepareParamsForAccountContactRelation(searchString: any): any[] {
    return [
      { name: 'SearchString', type: 'string', value: searchString },
      { name: 'FromEntityID', type: 'int', value: this.opportunityForm.controls['accountID'].value },
      { name: 'FromEntityTypeID', type: 'int', value: Entity.Accounts },
      { name: 'FromTenantID', type: 'int', value: this._commonHelper.getLoggedUserDetail().tenantId },
      { name: 'ToTenantID', type: 'int', value: this._commonHelper.getLoggedUserDetail().tenantId },
      { name: 'ToEntityTypeID', type: 'int', value: Entity.Contacts },
      { name: 'ToEntityID', type: 'int', value: null },
      { name: 'SelectedEntityID', type: 'int', value: null }
    ];
  }
  //#endregion
}
