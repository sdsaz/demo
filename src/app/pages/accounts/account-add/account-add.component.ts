import { Component, OnInit, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../@core/common-helper';
import { AccountType, DataSources, Entity, LocalStorageKey, ReferenceType, RefType } from '../../../@core/enum';
import { Validators, UntypedFormBuilder, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { AccountsService } from '../accounts.service';
import { Account } from '../account.model';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { CommonService } from '../../../@core/sharedServices/common.service';

@Component({
  selector: 'ngx-account-add',
  templateUrl: './account-add.component.html',
  styleUrls: ['./account-add.component.scss']
})
export class AccountAddComponent implements OnInit {

  @Input() entityRecordTypeId: number;
  @Input() entityWorkflowId: number;
  @Input() workflows: any;
  @Input() entityTypeId: any;
  @Input() showEntityRecordTypeLoader: boolean = false;
  @Input() showAssginedToLoader: boolean = false;
  @Input() showWorkflowLoader: boolean = false;
  @Input() recordTypes: any;
  @Input() isShowWorkflow: boolean;
  @Input() isShowAssignedTo: boolean;

  /**
   * If it is belongs to Entity or not, If it used from other Entity then values must be false
   */
  @Input() isFromSameEntity: boolean = true;

  //For Account Form
  account: Account;
  accountForm: UntypedFormGroup;

  //For Validation
  isPhoneInvalid: boolean = false;

  accountTypeList: any = null; //related to entity records
  accountTypes: any = null;

  assignedToList: any = null;
  filteredWorkflows: any;
  copyOfAssignedTo: any; //copy of assignedTo users;
  
  //save Flag
  submitted = false;
  isInitialLoaded = false;
  isDisabled = true;
  hideTypeDropDown = false;

  selectedWorkflow: any;

  formMode: string;
  
  copyOfWorkflows: any;
  copyOfRecordTypes: any;
  isShowRecordTypes : boolean = true;
  isSpecificWorkflowPage: boolean = true;

  validation_messages = {
    'name': [
      { type: 'required', message: 'CRM.ACCOUNT.ADD_DIALOG.NAME_REQUIRED' },
      { type: 'maxlength', message: 'CRM.ACCOUNT.ADD_DIALOG.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'CRM.ACCOUNT.ADD_DIALOG.MESSAGE_NAME_MIN' }
    ],
    'email': [
      { type: 'email', message: 'CRM.ACCOUNT.ADD_DIALOG.MESSAGE_INVALID_EMAIL' },
      { type: 'maxlength', message: 'CRM.ACCOUNT.ADD_DIALOG.MESSAGE_EMAIL_MAX' },
      { type: 'minlength', message: 'CRM.ACCOUNT.ADD_DIALOG.MESSAGE_EMAIL_MIN' }
    ],
    'entityRecordTypeId': [
      { type: 'required', message: 'CRM.ACCOUNT.ADD_DIALOG.ENTITY_RECORD_TYPE_REQUIRED' }
    ],
    'typeId': [
      { type: 'required', message: 'CRM.ACCOUNT.ADD_DIALOG.TYPE_REQUIRED' }
    ],
    'phone': [{ type: 'mask', message: 'CRM.ACCOUNT.ADD_DIALOG.PHONE_PATTERN' }],
    'ein': [{ type: 'mask', message: 'CRM.ACCOUNT.ADD_DIALOG.MESSAGE_INVALID_EIN' }],
    'entityWorkflowId': [
      { type: 'required', message: 'CRM.ACCOUNT.ADD_DIALOG.WORKFLOW_REQUIRED' }
    ],
    'assignedTo': [
      { type: 'required', message: 'CRM.ACCOUNT.ADD_DIALOG.ASSGINED_TO_REQUIRED' }
    ]
  }

  constructor(private _ngbActiveModal: NgbActiveModal,
    public _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _dataSourceService: DatasourceService,
    private _accountService: AccountsService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _commonService: CommonService) { }

  ngOnInit(): void {
    this.formMode = 'ADD';
    this.account = new Account({});
    this.accountForm = this.createAccountForm();

    Promise.all([
      this.getAccountTypesFromReferenceType(),
    ]).then(() => {
      //fill workflow field dropdown only general 
      this.filteredWorkflows = this.workflows?.filter((x: any) => x.entityRecordTypeID == null);
      this.showHideType();
      this.setInitialValues();
         
    })
  }
 
  private setInitialValues() {
    if ((!this.entityWorkflowId && !this.entityRecordTypeId) || (this.entityWorkflowId && !this.entityRecordTypeId)) {
      this.isSpecificWorkflowPage = false;
      this.showHideRecordType();
      this.showHideWorkflowAndAssignedTo();

      // get assigned to users
      if (this.isShowAssignedTo && !this.isShowWorkflow) {
        this.getAssignedToUsers(null, 1, null);
      }
    }
    else {
      this.setDataForSpecificWorkflow();
    }
  }

  private showHideType() {
    if (this.entityWorkflowId != undefined && this.entityWorkflowId != 0) {
      // Account type dropdwon
      if (this.accountTypes.length > 0) {
        this.hideTypeDropDown = true;
        let accountType = this.accountTypes?.filter(x => x.intValue1 == AccountType.Prospect);
        if (accountType && accountType.length > 0) {
          this.accountForm.patchValue({ typeId: accountType[0].intValue1 });
          this.accountForm.controls['typeId'].removeValidators([Validators.required]);
          this.accountForm.controls['typeId'].updateValueAndValidity();
        }
      }
      else {
        this.hideTypeDropDown = false;
      }
    }
  } 

  private showHideRecordType() {
    // Record Types
    if (this.recordTypes && this.recordTypes.length == 1) {
      this.copyOfRecordTypes = this._commonHelper.deepClone(this.recordTypes)
      this.isShowRecordTypes = false;
      this.entityRecordTypeId = this.recordTypes[0].value;

      this.accountForm.controls['entityRecordTypeId'].patchValue(this.entityRecordTypeId);
      this.accountForm.controls['entityRecordTypeId'].updateValueAndValidity();
    }
    else if (this.recordTypes && this.recordTypes.length > 0) {
      this.copyOfRecordTypes = this._commonHelper.deepClone(this.recordTypes)
    }
    else {
      this.isShowRecordTypes = false;
    }
  }

  private showHideWorkflowAndAssignedTo() {
    // Workflows
    if (this.workflows && this.workflows?.length == 1) {
      this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
      this.isShowWorkflow = false;
      this.entityWorkflowId = this.workflows[0].value;
      this.accountForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
      this.accountForm.controls['entityWorkflowId'].clearValidators();
      this.accountForm.controls['entityWorkflowId'].updateValueAndValidity();
    }
    else if (this.workflows && this.workflows?.length > 0) {
      this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
      if (this.copyOfRecordTypes?.length == 1) {
        this.workflows = this.workflows?.filter(x => x.isDefault || x.entityRecordTypeID == this.entityRecordTypeId);
      }
      else {
        this.workflows = this.copyOfWorkflows?.filter(s => s.isDefault);
      }
    }
    else {
      this.isShowWorkflow = false;
      this.isShowAssignedTo = false;
      if (this.workflows?.length <= 0) {
        this.accountForm.controls['entityWorkflowId'].clearValidators();
        this.accountForm.controls['entityWorkflowId'].updateValueAndValidity();
      }
    }
  }

  private setDataForSpecificWorkflow() {
    this.isSpecificWorkflowPage = true;

    // Get Assigned To users
    this.getAssignedToUsers(null, 1, null);

    this.isShowRecordTypes = false;
    this.isShowWorkflow = false;

    this.accountForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
    this.accountForm.controls['entityWorkflowId'].clearValidators();
    this.accountForm.controls['entityWorkflowId'].updateValueAndValidity();
    this.isShowAssignedTo = true;
  }

  createAccountForm(): UntypedFormGroup {
    //empty custom fields
    var customFields: any = {};

    if (this.formMode == 'ADD') {
      return this._formBuilder.group({
        id: 0,
        tenantId: 0,
        name: [this.account.name, Validators.compose([Validators.required ,Validators.maxLength(500),Validators.minLength(2)])],
        email: [this.account.email, Validators.compose([Validators.email, Validators.maxLength(200),Validators.minLength(2)])],
        phone: [],
        ein: [this.account.ein],
        typeId: [this.account.typeId, Validators.compose([Validators.required])],
        customFieldJSONData: customFields,
        entityRecordTypeId: [this.account.entityRecordTypeId],
        entityWorkflowId: [this.account.entityWorkflowId],
        assignedTo: [this.account.assignedTo]
      });
    }
  }

  // prepare params for datasource with required fields
  prepareParamsForAccountType() {
    const params = [];
    const paramItem1 = {
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.Accounts
    };
    params.push(paramItem1);

    return params;
  }

  private getAccountTypesFromReferenceType() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      let params = { refType: RefType.AccountType };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.AccountType}`;
      // get data
      const refAccountTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refAccountTypes == null) {
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this._commonHelper.hideLoader();
            this.accountTypes = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.accountTypes));
          }
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
      }
      else {
        this._commonHelper.hideLoader();
        this.accountTypes  = refAccountTypes;
        resolve(null);
      }
    });
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

  //save account
  saveAccount(formData) {
    this.submitted = true;
    if (this.accountForm.invalid) {
      this.validateAllFormFields(this.accountForm);
      return;
    }
    //empty custom fields
    var customFields: any = {};

    if(this.isShowWorkflow) {
      this.entityWorkflowId = null;
    }

    let phoneControlValue; 
    if(formData?.phone?.countryCode && formData?.phone?.phoneNumber) {
      phoneControlValue = formData?.phone?.countryCode + '|' + String(formData?.phone?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
    }
    
    
    //prepare params
    let params = {
      id: 0,
      tenantId: 0,
      name: formData.name,
      email: formData.email,
      phone: phoneControlValue,
      ein: formData.ein,
      entityRecordTypeId: formData.entityRecordTypeId || this.entityRecordTypeId,
      typeId: formData.typeId,
      customFieldJSONData: customFields,
      entityWorkflowId: formData.entityWorkflowId || this.entityWorkflowId,
      assignedTo: formData.assignedTo
    }

    this._commonHelper.showLoader();
    // save account
    this._accountService.updateAccount(params).then((response: any) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.ADD_DIALOG.SUCCESS_MESSAGE'));
      if (this.isFromSameEntity) {
        this._ngbActiveModal.close(true);
      } else {
        this._ngbActiveModal.close(response);
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }
  
  workflowOnChange(e) {
    if (e.value) {
      this.entityWorkflowId = e.value;
      this.getAssignedToUsers(null, 1, null);
      if (this.workflows != null && this.workflows.length > 0) {
        this.selectedWorkflow = this.workflows?.filter(x => x.value == e.value)[0];
      }
      this.assignedToList = [];
     }
  }
  workflowOnClear(e) {
    this.entityWorkflowId = null;
    this.assignedToList = [];
  }

  recordTypeOnChange(e) {
    if(e.value) {
      this.entityRecordTypeId = e.value;
      if (this.entityRecordTypeId && this.entityRecordTypeId > 0) {
        this.filteredWorkflows = this.copyOfWorkflows.filter(s => (s.entityRecordTypeID == this.entityRecordTypeId) || s.isDefault);
        if(this.workflows.length == 1)
          {
            let value = this.workflows.find(x=>x.entityRecordTypeID == this.entityRecordTypeId).value;
             
            this.accountForm.controls['entityWorkflowId'].patchValue(value);
            this.accountForm.controls['entityWorkflowId'].updateValueAndValidity();
          }
      }
      this.assignedToList = [];
     }
  }

  recordTypeOnClear(e) {
    this.entityWorkflowId = null;
      this.entityRecordTypeId = null;
      this.filteredWorkflows = [];
      var data = this.workflows?.filter(z => z.entityRecordTypeID == null);
      this.filteredWorkflows.push(data[0]);
      if(!this.selectedWorkflow?.isDefault) {
        this.assignedToList = [];
      }
      this.assignedToList.concat(this.copyOfAssignedTo);
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

  assignedToOnFilter(e) {
    this.getAssignedToUsers(e.value, 1, e.filter);
  }

  assignedToOnChange(e) {
    if (!e.value) {
      this.getAssignedToUsers(e.value, 1, null);
    }
  }
  
  // get assigned to users
  getAssignedToUsers(assignedTo, includeAllUsers = 1, searchString = null) {
    this.showAssginedToLoader = true;
    let defaultStageID = this.workflows?.find(x => x.value == this.entityWorkflowId)?.defaultStageID;
    
    // prepare params
    var params = this.prepareParamsForAssignedToUsers(defaultStageID, assignedTo, includeAllUsers, searchString);
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ACCOUNTASSIGNEDTO, params).then((response: any) => {
      //assigned to users
      if (response != undefined) {
        // users to assign to dropdwon
        this.assignedToList = response as any[];
        this.copyOfAssignedTo = response as any[];
      }
      this.showAssginedToLoader = false;
    }, (error: any) => {
      this.showAssginedToLoader = false;
    });
  }

  //for close form
  onCloseForm(status: boolean) {
    if (this.isFromSameEntity) {
      this._ngbActiveModal.close(status);
    } else {
      this._ngbActiveModal.close();
    } 
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'accounts.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }
}
