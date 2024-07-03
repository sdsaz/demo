
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators, FormGroup } from '@angular/forms';
import { OrdersService } from '../orders.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { Actions, DataSources, Entity, LocalStorageKey, PublicTenantSettings } from '../../../@core/enum';
import { SettingsService } from '../../settings/settings.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { Order } from '../order.model';
import { AccountAddComponent } from '../../accounts/account-add/account-add.component';
import { ContactAddComponent } from '../../contacts/contact-add/contact-add.component';
import { Dropdown } from 'primeng/dropdown';
import { EntityRelationService } from '../../../@core/sharedServices/entity-relation.service';
import { EntityRelationComponentsModel, FormLayout } from '../../../@core/sharedModels/entity-relation.model';
import { AddEntityRelationComponent } from '../../../@core/sharedComponents/entity-relation/add-entity-relation/add-entity-relation.component';

@Component({
  selector: 'ngx-order-add',
  templateUrl: './order-add.component.html',
  styleUrls: ['./order-add.component.scss']
})
export class OrderAddComponent implements OnInit {

  @ViewChild("drpContact", { static: false }) drpContact: Dropdown;
  @ViewChild("drpAccount", { static: false }) drpAccount: Dropdown;

  //------------- Record Type ----------------
  @Input() entityRecordTypeId?: number;
  @Input() entityRecordTypes: any[] = [];
  copyOfRecordTypes: any;
  isShowOrderType?: boolean = true;
  //------------------------------------------

  //------------- Related To ----------------
  @Input() relatedEntityTypeId?: number;
  showRelatedToLoader: boolean;
  isRelatedToRequired: boolean;
  //------------------------------------------

  //------------- Work Flow ------------------
  @Input() workflows: any;
  @Input() entityWorkflowId?: number;
  copyOfWorkflows: any;
  isShowWorkFlow: boolean = true;
  //--------------------------------------------

  //------------- Account ------------------
  showAccountLoader: boolean;
  //----------------------------------------

  //------------- Assigned To ------------------
  @Input() oldAssignedTo?: number;
  isInitialLoaded = false;
  accountTypeList: any = null; //related to entity records
  assignedToUsers: any = null;
  isShowAssignTo: boolean = true;
  showAssignedToLoader: boolean;
  accountTypePlaceholder = 'ORDERS.ADD_DIALOG.ACCOUNT_TYPE_PLACEHOLDER';
  customerPlaceholder = 'ORDERS.ADD_DIALOG.CONTACT_PLACEHOLDER';
  assignedToPlaceholder = 'ORDERS.ADD_DIALOG.ASSIGNED_TO_PLACEHOLDER';
  //--------------------------------------------

  @Input() title: string;
  @Input() entityStageId?: string;
  @Input() selectedStageTaskIds?: string;

  @Input() isAdd?: boolean;
  @Input() entityType?: number;

  //For Order Form
  order: Order;
  orderForm: FormGroup;

  submitted = false;

  //datasource
  currencySymbol: any = null;

  formMode: string;
  customerContactList: any[] = []; //related to data source 

  validation_messages = {
    'name': [
      { type: 'maxlength', message: 'ORDERS.ADD_DIALOG.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'ORDERS.ADD_DIALOG.MESSAGE_NAME_MIN' }
    ],
    'orderNumber': [
      { type: 'required', message: 'ORDERS.ADD_DIALOG.ORDERNO_REQUIRED' },
      { type: 'minlength', message: 'ORDERS.ADD_DIALOG.MESSAGE_ORDERNO_MIN' },
      { type: 'maxlength', message: 'ORDERS.ADD_DIALOG.MESSAGE_ORDERNO_MAX' }
    ],
    'billToContactID': [
      { type: 'required', message: 'ORDERS.ADD_DIALOG.CONTACT_REQUIRED' }
    ],
    'description': [
      { type: 'maxlength', message: 'ORDERS.ADD_DIALOG.MESSAGE_DESCRIPTION_MAX' },
      { type: 'minlength', message: 'ORDERS.ADD_DIALOG.MESSAGE_DESCRIPTION_MIN' }
    ],
    'totalAmount': [
      { type: 'required', message: 'ORDERS.ADD_DIALOG.AMOUNT_REQUIRED' },
      { type: 'maxlength', message: 'ORDERS.ADD_DIALOG.MESSAGE_AMOUNT_MAX' }
    ],
    "entityWorkflowId": []
  }

  isSpecificiWorkflowPage: boolean = true;
  isAssignOrder: boolean = false;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };
  
  modalRef: NgbModalRef | null;

  workflowsListAccount: any;
  workflowListContact: any;

  recordTypesForAccount: any;
  recordTypesForContact: any;
  hasAddAccountPermission: boolean = false;
  hasAddContactPermission: boolean = false;
  
  entityRelationComponent: EntityRelationComponentsModel;
  entityRelationTypes: any[] = [];
  customFields: any[] = [];

  constructor(
    private _ngbActiveModal: NgbActiveModal,
    private _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _orderService: OrdersService,
    private _settingsService: SettingsService,
    private _commonService: CommonService,
    private _dataSourceService: DatasourceService,
    private _modalService: NgbModal,
    private _entityRelationService: EntityRelationService
  ) { }

  ngOnInit(): void {

    this.isAssignOrder = this._commonHelper.havePermission(enumPermissions.AssignOrders);
    this.checkAddEntityPermission();
    
    // All Listing and Default Page
    if ((!this.entityWorkflowId && !this.entityRecordTypeId) || (this.entityWorkflowId && !this.entityRecordTypeId)) {
      this.isSpecificiWorkflowPage = false;

      // Record Types
      if (this.entityRecordTypes && this.entityRecordTypes.length > 0) {
        this.copyOfRecordTypes = this._commonHelper.deepClone(this.entityRecordTypes)
      }
      else {
        this.isShowOrderType = false;
      }

      // Workflows
      if (this.workflows && this.workflows.length > 0) {
        this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
        this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
      }
      else {
        this.isShowWorkFlow = false;
        this.isShowAssignTo = false;
      }

      this.formMode = 'ADD';
      this.order = new Order({});
      this.entityWorkflowId = null;
      this.order.entityWorkflowId = this.entityWorkflowId;
      this.order.entityRecordTypeID = null;
    }
    else {
      this.isSpecificiWorkflowPage = true;

      // Get Assigned To users
      if (this.isAssignOrder) {
        this.getAssignedToUsers(null, 1, null);
      }
      
      this.isShowOrderType = false;
      this.isShowWorkFlow = false;
      this.isShowAssignTo = true;

      this.formMode = 'ADD';
      this.order = new Order({});
      this.order.entityWorkflowId = this.entityWorkflowId;
      this.order.entityRecordTypeID = this.entityRecordTypeId;
    }

    this.getEntityRelationComponents().then(() => {
      if (this.entityRelationComponent) {
        this.getEntityRelationTypes();
        this.getCustomFields();
      }
    });
    
    Promise.all([
      this.getCurrencySymbol(),
      this.getEntityTypeOptionsRef(),
      this.getAccountList(''),
      this.getContactCustomerList(''),
      this.getWorkflowListForAccount(),
      this.getWorkflowListForContact(),
      this.getEntityRecordTypes()
    ]).then(() => {
      this.orderForm = this.createOrderForm();
    });
  }

  createOrderForm(): FormGroup {
    if (this.formMode == 'ADD') {
      return this._formBuilder.group({
        id: 0,
        entityWorkflowId: null,
        assignedTo: null,
        name: [this.order.name, Validators.compose([Validators.maxLength(1000)])],
        orderNumber: [this.order.orderNumber, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
        totalAmount: [this.order.totalAmount, Validators.compose([Validators.required, Validators.minLength(1), Validators.maxLength(14)])],
        description: [this.order.description, Validators.compose([Validators.maxLength(2000), Validators.minLength(2)])],
        billToContactID: [this.order.billToContactID, Validators.compose([Validators.required])],
        billToAccountID: [this.order.billToAccountID],
        entityRecordTypeID: [this.order.entityRecordTypeID]
      });
    }
  }

  validateAllFormFields(formGroup: FormGroup) {
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

  private getEntityTypeOptionsRef(): any {
    let params = { entityTypeId: Entity.Orders };
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._commonService.getEntityRecordTypesByEntityTypeId(params).then(response => {
        if (response) {
          this.entityRecordTypes = response as [];
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

  private getCurrencySymbol() {
    const currencySymbol = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL));
    if (currencySymbol == null) {
      return new Promise((resolve, reject) => {
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
      });
    }
    else {
      this.currencySymbol = currencySymbol;
    }
  }

  //save order
  saveOrder(formData) {
    this.submitted = true;
    if (this.orderForm.invalid) {
      this.validateAllFormFields(this.orderForm);
      return;
    }

    // prepare params
    let params = {
      id: 0,
      tenantId: 0,
      name: formData.name,
      orderNumber: formData.orderNumber,
      totalAmount: formData.totalAmount,
      description: formData.description,
      billToContactID: formData.billToContactID || null,
      billToAccountID: formData.billToAccountID || null,
      entityRecordTypeID: formData.entityRecordTypeID || 0,
      entityWorkflowId: this.entityWorkflowId,
      entityTypeId: this.relatedEntityTypeId,
      entityId: formData.relatedTo,
      entityStageId: this.entityStageId,
      selectedStageTaskIds: this.selectedStageTaskIds,
      oldAssignedTo: this.oldAssignedTo,
      entityType: this.entityType,
      assignedTo: formData.assignedTo
    }
    this._commonHelper.showLoader();
    // save order
    this._orderService.saveOrder(params).then((response) => {
      this._commonHelper.hideLoader();
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
      if (error.messageCode.toLowerCase() == 'orders.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('ORDERS.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }

  getAccountList(searchString: any) {
    return new Promise((resolve, reject) => {
      const params = this.prepareParamsForAccountType(searchString);
      this.showAccountLoader = true;
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ADDORDERACCOUNT, params).then((response: any) => {
        //account type
        if (response.length != 0) {
          this.accountTypeList = response as [];
          this.isInitialLoaded = true;
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


  // prepare params for datasource with required fields
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


  // prepare params for datasource with required fields
  prepareParamsForGetCustomerContact(searchString: any) {
    const params = [];
    const selectedAccountID = this.orderForm?.controls['billToAccountID'].value || null;
    let paramItem1 = {
      name: 'SearchString',
      type: 'string',
      value: searchString
    };
    params.push(paramItem1);
    paramItem1 = {
      name: 'AccountID',
      type: 'int',
      value: selectedAccountID
    };
    params.push(paramItem1);
    return params;
  }

  getContactCustomerList(searchString: any) {
    return new Promise((resolve, reject) => {
      this.showRelatedToLoader = true;
      let params;
      let code;
      // prepare params
      if (this.orderForm?.get('billToAccountID')?.value > 0) {
        code = DataSources.RELATEDENTITYRELATIONS;
        params = this.prepareParamsForAccountContactRelation(searchString);
      } else {
        code = DataSources.ADDORDERCONTACT;
        params = this.prepareParamsForGetCustomerContact(searchString);
      }
      
      this._dataSourceService.getDataSourceDataByCodeAndParams(code, params).then((response: any) => {
        //product category  
        this.customerContactList = response as [];
        this.showRelatedToLoader = false;
        resolve(null);
      },
        (error) => {
          this.showRelatedToLoader = false;
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    });
  }

  onChangeAccount(event: any) {
    this.getContactCustomerList('');
    this.orderForm.controls['billToContactID'].setValue(null);
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

  onFilterContact(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getContactCustomerList(e.filter.trim());
      }
    }
    else {
      this.getContactCustomerList('');
    }
  }

  onWorkflowChange(e) {

    if (e.value) {
      this.entityWorkflowId = e.value;
      if (this.isAssignOrder) {
        this.getAssignedToUsers(null, 1, null);
      }
      // set record type from selected workflow
      if (this.workflows != null && this.workflows.length > 0) {
        var selectedWorkflow = this.workflows.filter(x => x.value == e.value)[0];
        this.relatedEntityTypeId = selectedWorkflow.parentEntityTypeID;
        this.entityRecordTypeId = selectedWorkflow.entityRecordTypeID;
      }
    } else {
      this.entityWorkflowId = undefined;
      this.entityRecordTypeId = undefined;
      this.assignedToUsers = [];
    }
  }

  onWorkflowClear(e) {
    this.entityWorkflowId = null;
    this.assignedToUsers = [];
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
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ORDERASSIGNEDTO, params).then((response: any) => {
      //assigned to users
      if (response != undefined) {
        // users to assign to dropdwon
        this.assignedToUsers = response as [];
      }
      this.showAssignedToLoader = false;
    }, (error) => {
      this.showAssignedToLoader = false;
      this.getTranslateErrorMessage(error);
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

  onOrderTypeChange(e) {
    if (e.value) {
      this.entityRecordTypeId = e.value;
      if (this.entityRecordTypeId && this.entityRecordTypeId > 0) {
        this.workflows = this.copyOfWorkflows.filter(s => (s.entityRecordTypeID == this.entityRecordTypeId) || s.isDefault);
        this.assignedToUsers = [];
      }
    }
  }

  onOrderTypeClear(e) {
    this.entityRecordTypeId = null;
    this.relatedEntityTypeId = null;
    this.orderForm.controls['entityWorkflowId'].patchValue(null);
    this.orderForm.controls['entityWorkflowId'].updateValueAndValidity();
    this.workflows = this.copyOfWorkflows.filter(s => s.isDefault);
    this.assignedToUsers = [];
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
        if (this.drpAccount.filterValue) {
          this.drpAccount.resetFilter();
          this.getAccountList('').then(() => {

            const account = { value: response['id'], label: response['name'] };
            if (this.accountTypeList && this.accountTypeList.length > 0) {
              this.accountTypeList.unshift(account);

              this.orderForm.controls['billToAccountID'].patchValue(response['id']);
              this.orderForm.controls['billToAccountID'].updateValueAndValidity();
            } else {
              this.accountTypeList = [];
              this.accountTypeList.push(account);
              this.orderForm.controls['billToContactID'].patchValue(response['id']);
              this.orderForm.controls['billToAccountID'].updateValueAndValidity();
            }
          });
        } else {
          const account = { value: response['id'], label: response['name'] };
          if (this.accountTypeList && this.accountTypeList.length > 0) {
            this.accountTypeList.unshift(account);

            this.orderForm.controls['billToAccountID'].patchValue(response['id']);
            this.orderForm.controls['billToAccountID'].updateValueAndValidity();
          } else {
            this.accountTypeList = [];
            this.accountTypeList.push(account);
            this.orderForm.controls['billToAccountID'].patchValue(response['id']);
            this.orderForm.controls['billToAccountID'].updateValueAndValidity();
          }
        }
      }
    });
  }

  addNewContact() {

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
        if (this.entityRelationComponent && this.orderForm.get('billToAccountID').value) {
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

      this.orderForm.controls['billToContactID'].patchValue(response['id']);
      this.orderForm.controls['billToContactID'].updateValueAndValidity();
    } else {
      this.customerContactList = [];
      this.customerContactList.push(contact);
      this.orderForm.controls['billToContactID'].patchValue(response['id']);
      this.orderForm.controls['billToContactID'].updateValueAndValidity();
    }
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
    }
  }

  checkAddEntityPermission() {
    this.hasAddAccountPermission  = this._commonHelper.havePermission(enumPermissions.AddAccount);
    this.hasAddContactPermission = this._commonHelper.havePermission(enumPermissions.AddContact);
  }

  private prepareParamsForWorkflows(entityTypeId: number) { return [{ name: 'EntityTypeID', type: 'int', value: entityTypeId }]; }

  //#region  Entity Relation
  private getEntityRelationComponents() {
    return new Promise((resolve, reject) => {
      this._entityRelationService.getEntityRelationComponents(Entity.Accounts).then((res : EntityRelationComponentsModel[]) => {
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
      this.modalRef.componentInstance.fromEntityId = this.orderForm.get('billToAccountID').value;
      this.modalRef.componentInstance.toEntityId = toEntityId;
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
          fromEntityID: this.orderForm.get('billToAccountID').value,
          toEntityID:  toEntityId,
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
      { name: 'FromEntityID', type: 'int', value: this.orderForm.controls['billToAccountID'].value },
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
