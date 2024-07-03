import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { AbstractControl, FormControl, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { Entity, DataSources, PublicTenantSettings, Tenants, ProcessEntityWorkflowStageValueNoteType, TabLayoutType, LocalStorageKey, RefType, ReferenceType, LayoutTypes, SectionCodes, FieldNames } from '../../../../@core/enum';
import { DynamicTableParameter } from '../../../../@core/sharedModels/dynamic-table.model';
import { CommonService } from '../../../../@core/sharedServices/common.service';
import { AccountsService } from '../../accounts.service';
import { WorkflowmanagementService } from '../../../workflowmanagement/workflowmanagement.service';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { Dropdown } from 'primeng/dropdown';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ReasonDialogComponent } from '../../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { ContactAddComponent } from '../../../contacts/contact-add/contact-add.component';
import { SettingsService } from '../../../settings/settings.service';
import { TimeFramePipe } from '../../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { ProductAddComponent } from '../../../products/product-add/product-add.component';
import { AccountProductEditDialogComponent } from '../../account-product-edit-dialog/account-product-edit-dialog.component';
import { ProductsService } from '../../../products/products.service';
import { EntityRelationService } from '../../../../@core/sharedServices/entity-relation.service';
import { EntityRelationComponentsModel } from '../../../../@core/sharedModels/entity-relation.model';
import { timeFrameValidator } from '../../../../@core/sharedValidators/time-frame.validator';
import { TimeFrameToMinutesPipe } from '../../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
import { WorkTasksService } from '../../../worktasks/worktasks.service';
import { WorktaskAddComponent } from '../../../worktasks/worktask-add/worktask-add.component';
import { OpportunityAddComponent } from '../../../opportunities/opportunity-add/opportunity-add.component';
import { OpportunitiesService } from '../../../opportunities/opportunities.service';
import { CaseAddComponent } from '../../../cases/case-add/case-add.component';
import { CasesService } from '../../../cases/cases.service';
import { NoteService } from '../../../../@core/sharedComponents/notes/notes.service';

@Component({
  selector: 'ngx-account-detail',
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.scss']
})
export class AccountDetailComponent implements OnInit {

  private accountTxtNameRef: ElementRef;
  navTabsAll: any = [];
  navTabsMore: any = [];
  nativeTabDetails: any = [];
  isAdditionalTab: boolean = false;
  nativeTabCount: number = 0;
  isNativeTab: boolean = true;
  tabLayout: string = 'Default';
  tabVisited: any =[];
  forceRedirectionTabName: string = '';

  @ViewChild('accountTxtName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.accountTxtNameRef = content;
    }
  }

   //option for confirm dialog settings
   optionsForConfirmDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  @ViewChild('relatedContactDrp', { static: false }) relatedContactDrpRef: Dropdown;
  @ViewChild('relatedProductDrp', { static: false }) relatedProductDrp: Dropdown;

  private modalRef: NgbModalRef | null;

  // account model
  entityTypeId: number = Entity.Accounts;
  accountId: number;
  entityRecordTypeId: number;
  shortCode: string;
  entityWorkflowId: any;

  account: any;
  entityWorkFlowStageValue: any;
  copyOfAccount: any;
  copyOfAccountFormValues: any;
  accountCustomFields: any[] = [];

  tbWorktaskParameters: Array<DynamicTableParameter> = [];
  tbRelatedOpportunitiesParameters: Array<DynamicTableParameter> = [];
  tbContactParameters: Array<DynamicTableParameter> = [];
  tblProductParameters: Array<DynamicTableParameter> = [];
  tbRelatedCasesParameters: Array<DynamicTableParameter> = [];

  refreshWorkTaskTab: boolean = false;
  
  formDataJSON: any[] = [];
  selectedTab: string = '';
  accountForm: UntypedFormGroup;
  accountAssignedTo: any;
  accountStages: Array<any> = [];
  // assigned users
  assignedToUsers: any;

  //user detail
  _loggedInUser: any;

  // extra variable
  submitted: boolean = false;
  isLoaded: boolean = false;
  isListWorkTask: boolean = false;
  isListOpportunities: boolean = false;
  isReadOnly: boolean = true;
  refreshActivity: boolean = false;
  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshEntityTag: boolean = false;
  refreshRelatedContacts: boolean = false;
  refreshRelatedProducts: boolean = false;
  refreshCustomFieldDatasource: boolean = false;
  refreshJsonGrid: boolean = false;
  refreshDocument: boolean = false;

  isHelpCode: boolean = false;
  activeTab = '';
  isEntityWorkflow: boolean = false;
  accountCurrentStageTaskIds: string;
  accountCurrentStage: number;

  //Total Time
  totalSpentTime: any = null;
  totalEffectiveTime: any = null;
  totalPauseTime: any;

  currentStageTask: any;
  currentStage: any;
  selectedStage: any;
  oldStageTask: any;

  //drop-down 
  countries: any;
  billingStates: any;
  shippingStates: any;
  isDefaultBillingCountryId:boolean = false;
  copyOfIsDefaultBillingCountryId:boolean = false;
  isDefaultShippingCountryId:boolean = false;
  copyOfIsDefaultShippingCountryId:boolean = false;
  accountTypes: any = null
  currencySymbol: any = null;
  hoursInDay:number = null;
  contactsForAccountContacts: any;
  selectedContact: any;
  isListViewLayout: boolean = true;
  productsForAccountProducts: any;
  selectedProduct: any;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: 'md',
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  // permissions
  hasPermission: boolean = false;
  isViewAccount: boolean = false;
  isAddAccount: boolean = false;
  isEditAccount: boolean = false;
  isDeleteAccount: boolean = false;
  isListContacts: boolean = false;
  isListProducts: boolean = false;
  isAddContacts: boolean = false;
  isAddProducts: boolean = false;
  isResumeRecord: boolean = false;
  isSendDocumentsForEsign: boolean = false;
  isPrepare941x: boolean = false;
  changeAccountStage: boolean = false;
  isCalculateERC: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAddWorkTask: boolean = false;
  isAddOpportunity: boolean = false;
  isAddCase: boolean = false;
  isListCases: boolean = false;

  isInitialLoading: boolean = true;
  accountName: String = '';

  showWorkflowLoader: boolean;
  contactRecordTypes: any;
  productRecordTypes: any;
  contactWorkflows: any;
  productWorkflows: any;

  // worktask tab
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  entitySubTypes: any = [];
  workTaskSubTypeDetails: any;
  availableSubWorkTaskTypeDetails:any;
  availableSubWorkTaskTypeNamesForWorkTaskDelete: any;

  casesRecordTypes: any;
  casesWorkflowList: any;

  isShowLoaderForCase: boolean = false;
  onceRelatedCasesClicked: boolean = false;
  refreshCaseTab: boolean = false;
  onceDocumentClicked: boolean = false;
  
  accountValidationMessages = {
    name: [
      { type: 'required', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.NAME_REQUIRED' },
      { type: 'maxlength', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.MESSAGE_NAME_MIN' }
    ],
    legalName: [
      { type: 'maxlength', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.MESSAGE_LEGALNAME_MAX' },
      { type: 'minlength', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.MESSAGE_LEGALNAME_MIN' }
    ],
    email: [
      { type: 'email', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.EMAIL_PATTERN' },
      { type: 'maxlength', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.MESSAGE_EMAIL_MAX' },
      { type: 'minlength', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.MESSAGE_EMAIL_MIN' }],
    email2: [
      { type: 'email', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.EMAIL2_PATTERN' },
      { type: 'maxlength', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.MESSAGE_EMAIL2_MAX' },
      { type: 'minlength', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.MESSAGE_EMAIL2_MIN' }],
    typeId: [{ type: 'required', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.TYPE_REQUIRED' }],
    entityStageId: [{ type: 'required', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.STATUS_REQUIRED' }],
    phone: [{ type: 'mask', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.PHONE_PATTERN' }],
    billingAddress: [{ type: 'required', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.BILLING_ADDRESS_INFO.ADDRESS_REQUIRED' }],
    billingPostalCode: [{ type: 'mask', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.BILLING_ADDRESS_INFO.POSTAL_CODE_PATTERN' }],
    shippingPostalCode: [{ type: 'mask', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.SHIPPING_ADDRESS_INFO.POSTAL_CODE_PATTERN' }],
    shippingAddress: [{ type: 'required', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.SHIPPING_ADDRESS_INFO.ADDRESS_REQUIRED' }],
    numberOfEmployees: [{ type: 'min', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.NUMBER_OF_EMPLOYEES_PATTERN' }, { type: 'max', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.NUMBER_OF_EMPLOYEES_PATTERN' }],
    ein: [{ type: 'mask', message: 'CRM.ACCOUNT.DETAIL.TAB_DETAILS.EIN_PATTERN' }]
  }

  // storage key
  entityStagesWithTasksStorageKey: string = LocalStorageKey.AccountEntityStagesWithTasks;

  onceWorkTaskClicked: boolean = false;
  onceRelatedOpportunitiesClicked: boolean = false;
  onceContactClicked: boolean = false;
  onceAttachmentClicked: boolean = false;
  onceProductClicked: boolean = false;
  onceStageHistoryClicked: boolean = false;
  
  documentTypeList: any[] = [];
  recordType941sId: number;
  recordTypePayrollId: number;
  recordTypeOthersId: number;
  recordType941xId: number;
  recordTypePPPId: number;
  recordTypeConvertedPayrollId: number;
  recordTypePLId: number;

  dynamicConvertedPayrollParamList: Array<DynamicTableParameter> = [];
  dynamicPayrollParamList: Array<DynamicTableParameter> = [];
  dynamic941sParamList: Array<DynamicTableParameter> = [];
  dynamicOtherParamList: Array<DynamicTableParameter> = [];
  dynamic941xParamList: Array<DynamicTableParameter> = [];
  dynamicPPPParamList: Array<DynamicTableParameter> = [];
  dynamicPLParamList: Array<DynamicTableParameter> = [];

  isShowAttachmentTab: boolean = false;
  isShowPrepare941x: boolean = false;
  isShowSendDocumentsForEsign: boolean = false;
  isShowCalculateERC: boolean = false;

  tenantId: number = 0;
  tenantEnums = Tenants;

  navTabs: any[] = []
  accountProductsData: any[] = [];
  tabsNameHideAction: string[] = [];

  //Assigned To Loader
  showAssignedToLoader: boolean = false;
  isForceReloadAssignedTo: boolean = true;

  //State Loaders
  showBillingStateLoader: boolean = false;
  showShippingStateLoader: boolean = false;

  isShowLoaderForAccountContact: boolean;
  isShowLoaderForProduct: boolean;
  
  //navTabs
  currentActiveTabIndex: number = 0;
  previousActiveTabIndex: number = 0;

  entityRelationComponents: EntityRelationComponentsModel[] = [];
  entityRelationTabs: any[] = [];

  //JSON Grid
  refreshCustomFieldJSONGrid: boolean = false;

  fromEntityStageId: any;

  isShowLoaderForOpportunity: boolean = false;
  refreshOpporunityTab: boolean = false;
  opportunityRecordTypes: any;
  opportunityWorkflowList: any;

  entityHiddenFieldSettings: any;
  fieldName = FieldNames;
  sectionCodeName = SectionCodes;

  constructor(
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _accountService: AccountsService,
    private _commonService: CommonService,
    private _formBuilder: UntypedFormBuilder,
    private _location: Location,
    private _workflowmanagementService: WorkflowmanagementService,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _productService: ProductsService,
    private _entityRelationService: EntityRelationService,
    private _workTaskService: WorkTasksService,
    private _opportunitiesService: OpportunitiesService,
    private _casesService: CasesService,
    private _noteService: NoteService) {
    this.isEditAccount = this._commonHelper.havePermission(enumPermissions.EditAccount);
    this.isDeleteAccount = this._commonHelper.havePermission(enumPermissions.DeleteAccount);
    this.isViewAccount = this._commonHelper.havePermission(enumPermissions.ViewAccount);
    this.isListWorkTask = this._commonHelper.havePermission(enumPermissions.ListWorkTasks);
    this.isListOpportunities = this._commonHelper.havePermission(enumPermissions.ListOpportunities);
    this.isListContacts = this._commonHelper.havePermission(enumPermissions.ListContacts);
    this.isAddContacts = this._commonHelper.havePermission(enumPermissions.AddContact);
    this.isAddProducts = this._commonHelper.havePermission(enumPermissions.AddProduct);
    this.isListProducts = this._commonHelper.havePermission(enumPermissions.ListProducts);
    this.isSendDocumentsForEsign = this._commonHelper.havePermission(enumPermissions.SendDocumentsForEsign);
    this.isPrepare941x = this._commonHelper.havePermission(enumPermissions.Prepare941x);
    this.changeAccountStage = this._commonHelper.havePermission(enumPermissions.ChangeAccountStage);
    this.isCalculateERC = this._commonHelper.havePermission(enumPermissions.CalculateERC);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadAccountDocument);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAddOpportunity = this._commonHelper.havePermission(enumPermissions.AddOpportunity);
    this.isAddCase = this._commonHelper.havePermission(enumPermissions.AddCase);
    this.isListCases = this._commonHelper.havePermission(enumPermissions.ListCases);
    this.isResumeRecord = this._commonHelper.havePermission(enumPermissions.ResumeTask);
    
    this.hasPermission = this.isViewAccount || this.isEditAccount;
    this.readRouteParameter();

    Promise.all([
      this.getTabLayoutTenantSetting(),
      this.getEntityRecordTypes(),
      this.getWorktaskWorkflowList(),
      this.getWorkflowListForContact(),
      this.getWorkflowListForProduct(),
      this.getWorkflowListForOpportunity(),
      this.getWorkflowListForCase(),
      this.getEntitySubTypes()
    ]).then(() => {
      this.setTabLayout();
    });
  }

  ngOnInit(): void {

    this.tenantId = this._commonHelper.getTenantId();
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    this.fillNavTabsNameHideAction();
    this.setWorkTaskTabParameters();
    this.setRelatedOpportunitiesTabParameters();
    this.setRelatedContactsTabParameters();
    this.setRelatedProductsTabParameters();
    this.setRelatedCasesTabParameters();

    (this._commonHelper.attachment_visibility_tenant ?? '').split(',').forEach(x => {
      if (Number(x) == this.tenantId) {
        this.isShowAttachmentTab = true;
        this.isShowPrepare941x = true;
        this.isShowSendDocumentsForEsign = true;
        this.isShowCalculateERC = true;
        return;
      }
    });
 
    if (this.isShowAttachmentTab) {
      this.getDocumentType();
    }

    if (this.isViewAccount) {
      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.getEntityRelationComponents(),
        this.getAccountTypesFromReferenceType(),
        this.getCountries(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getEntityHiddenField()
      ]).then(() => { this.getAccountCustomFields(); });
    }
  }

  //#region Events
  get accountfrm() { return this.accountForm.controls; }

  backToList(): void {
    this._location.back();
  }

  showHideDetailTab(frmMode: string) {

    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.accountForm.invalid) {
        this.validateAllFormFields(this.accountForm);
        this.navigateToTabByValidation();
        return;
      }

      this.refreshActivity = true,

      Promise.all([
        this.saveData()
      ]).then(() => {
        this.isReadOnly = true;
        this.submitted = false;
      })
      
    }
    else if (frmMode === 'CANCEL') {
      this.account = this._commonHelper.deepClone(this.copyOfAccount);
      
      if (this.account.customFieldJSONData && this.account.customFieldJSONData !== null && this.account.customFieldJSONData !== '' && this.account.customFieldJSONData !== undefined) {
        this.accountCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.account.customFieldJSONData[field.fieldName] && this.account.customFieldJSONData[field.fieldName] != null && this.account.customFieldJSONData[field.fieldName] != '' && this.account.customFieldJSONData[field.fieldName] != undefined) {
              this.account.customFieldJSONData[field.fieldName] = moment(new Date(this.account.customFieldJSONData[field.fieldName])).toDate();
            }
          } 
          else if (field.fieldType == 'JSON Grid') {
            if (this.account.customFieldJSONData[field.fieldName] && this.account.customFieldJSONData[field.fieldName] != null && this.account.customFieldJSONData[field.fieldName] != '' && this.account.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.account.customFieldJSONData[field.fieldName] === 'string') {
                this.account.customFieldJSONData[field.fieldName] = JSON.parse(this.account.customFieldJSONData[field.fieldName]);
              }
            }
            this.accountForm.removeControl(field.fieldName);
          } else if (String(field.fieldType).toLowerCase() === 'duration') {
            if (typeof this.account.customFieldJSONData[field.fieldName] === 'number' || this.account.customFieldJSONData[field.fieldName] == null) {
              this.account.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.account.customFieldJSONData[field.fieldName], this.hoursInDay);
            }
          }
        });
      }
      this.copyOfAccount.customFieldJSONData = this._commonHelper.deepClone(this.account.customFieldJSONData);
      this.isDefaultBillingCountryId = this.copyOfIsDefaultBillingCountryId;
      this.isDefaultShippingCountryId = this.copyOfIsDefaultShippingCountryId;

      this.accountForm.reset(this.copyOfAccountFormValues);
      
      this.refreshJSONGridData()

      this.account.selectedStageTaskIds = this.accountCurrentStageTaskIds;
      this.account.entityStageId = this.accountCurrentStage;
      
      //set address validators
      this.onAddressChangeValidation(this.accountfrm.billingAddress,1);
      this.onAddressChangeValidation(this.accountfrm.shippingAddress,2);

      
      if (this.billingStates.filter(x => x.value == this.account.billingAddress.stateId).length <= 0) {
        this.showBillingStateLoader = true;
        this.getStatesByCountryId(this.account.billingAddress.countryId, this.account.billingAddress.stateId).then((response) => {
          this.billingStates = response;
          this.showBillingStateLoader = false;
        }, (error) => {
          this.showBillingStateLoader = false;
        });
      }

      
      if (this.shippingStates.filter(x => x.value == this.account.shippingAddress.stateId).length <= 0) {
        this.showShippingStateLoader = true;
        this.getStatesByCountryId(this.account.shippingAddress.countryId, this.account.shippingAddress.stateId).then((response) => {
          this.shippingStates = response;
          this.showShippingStateLoader = false;
        }, (error) => {
          this.showShippingStateLoader = false;
        });
      }

      //find countryCode
      if(this.account.phone) {
        const phoneDetail = String(this.account.phone).split('|');
        if (phoneDetail.length == 2) {
          this.account['countryCode'] =  phoneDetail[0];
          this.accountForm.patchValue({'phone' : { countryCode : phoneDetail[0], phoneNumber : phoneDetail[1]}});
        }
      } else {
        this.accountForm.patchValue({ 'phone': { countryCode: null, phoneNumber: null } });
      }
      
      this.getEntityStagesWithTaskAfterReset();
      this.isReadOnly = !this.isReadOnly;
      this.submitted = false;
    }
    else if (frmMode === 'EDIT' && this.isReadOnly) {
      if (this.isForceReloadAssignedTo) this.getAssignedToUsers(1, '');
      setTimeout(() => { this.accountTxtNameRef.nativeElement.focus(); });

      this.isReadOnly = !this.isReadOnly;
      this.submitted = false;
    }
    
  }

  setRefreshDocument() {
    this.refreshDocument = false;
    setTimeout(() => {
      this.refreshDocument = true;
    }, 500);
  }
  
  //refresh CustomField JSON Grid Data;
  private refreshJSONGridData() {
    this.refreshCustomFieldJSONGrid = true;
     setTimeout(() => {
      this.refreshCustomFieldJSONGrid = false;
    }, 50);
  }

  assignedToOnFilter(e) {
    this.getAssignedToUsers(0, e.filter);
  }

  assignedToOnChange(e) {
    if (!e.value) {
      this.getAssignedToUsers(1, null);
    }
  }

  customfieldMultiSelectChange(event, fieldName) {
    const stringValue = event.value.toString()
    this.account.customFieldJSONData[fieldName] = stringValue != '' ? stringValue : null;
  }

  onBillingCountrySelectionChange(value, addressFormGroup: AbstractControl) {
    this.isDefaultBillingCountryId = false;
    this.onAddressChangeValidation(addressFormGroup, 1);

    this.showBillingStateLoader = true;
    this.getStatesByCountryId(value, null).then((response) => {
      this.billingStates = response;
      this.showBillingStateLoader = false;
    }, (error) => {
      this.showBillingStateLoader = false;
    });

    this.account.billingAddress.stateId = null;
  }

  onShippingCountrySelectionChange(value, addressFormGroup: AbstractControl) {
    this.isDefaultShippingCountryId = false;
    this.onAddressChangeValidation(addressFormGroup, 2);

    this.showShippingStateLoader = true;
    this.getStatesByCountryId(value, null).then((response) => {
      this.shippingStates = response;
      this.showShippingStateLoader = false;
    }, (error) => {
      this.showShippingStateLoader = false;
    });

    this.account.shippingAddress.stateId = null;
  }

  onAddressChangeValidation(addressFormGroup: AbstractControl, addressType: number) {
    let isDefaultCountryId: boolean = false;
    if (addressType != null && addressType == 1) {
      isDefaultCountryId = this.isDefaultBillingCountryId;
    }
    else {
      isDefaultCountryId = this.isDefaultShippingCountryId;
    }

    if ((addressFormGroup.get('city').value == null || addressFormGroup.get('city').value == '')
      && (addressFormGroup.get('stateId').value == null || addressFormGroup.get('stateId').value == '')
      && (addressFormGroup.get('postalCode').value == null || addressFormGroup.get('postalCode').value == '')
      && (isDefaultCountryId ? true : (addressFormGroup.get('countryId').value == null || addressFormGroup.get('countryId').value == ''))
    ) {
      addressFormGroup.get('address1').removeValidators([Validators.required]);
      addressFormGroup.get('address1').updateValueAndValidity();
    }
    else {
      addressFormGroup.get('address1').setValidators([Validators.required]);
      addressFormGroup.get('address1').updateValueAndValidity();
    }
  }

  
  //#endregion

  //#region Private methods

  private fillNavTabsNameHideAction() {
    this.tabsNameHideAction = ['navWorkTasks', 'navContacts', 'navRelatedOpportunities', 'navAttachment', 'navProducts', 'navHistory', 'additionalTabs', 'navRelatedCases', 'navDocuments'];
  }

  private readRouteParameter(): void {
    this._activeRoute.params.subscribe(param => {
      let id = param['id'];
      if (id && !isNaN(Number(id)) && Number(id) > 0) {
        this.accountId = Number(id);
      }
      if (param['wf'] !== undefined) {
        if (param['wf'] != null) {
            this.entityWorkflowId = param['wf'];
        }
        else {
          this.isEntityWorkflow = false;
        }
      }
    });

    this._activeRoute.queryParamMap.subscribe(params => {
      if (params != null && params.keys.length > 0) {
        params.keys.forEach(paramKey => {
          if (paramKey.toLocaleLowerCase() === 'tab') {
            this.forceRedirectionTabName = params.get(paramKey)?.trim() ?? '';
          }
        });
      }
    });

    // set storage key
    this.entityStagesWithTasksStorageKey = this.entityStagesWithTasksStorageKey + "_" + this.entityTypeId + (this.entityWorkflowId ? ("_" + this.entityWorkflowId) : '');
  }

  private getAccountTypesFromReferenceType() {
    return new Promise((resolve, reject) => {
      let params = { refType:  RefType.AccountType};
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.AccountType}`;
      const refTypeAccountTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeAccountTypes == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.accountTypes = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.accountTypes));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
      else {
        this.accountTypes = refTypeAccountTypes;
        resolve(null);
      }
    });
  }

  onDeleteAccountClick(AccountID) {
    let params = {
      "entityId": AccountID,
      "entityTypeId": Entity.Accounts
    }

    let message: string = "";
    this._commonHelper.showLoader();
    this._workTaskService.GetWorkTasksByEntity(params).then((res: any) => {
      this._commonHelper.hideLoader();

      let hasWorktask: boolean = res != null && res.length > 0;
      message = hasWorktask ? 'CRM.ACCOUNT.DETAIL.MESSAGE_ACCOUNT_RELATED_WORKTASK_DELETE' : 'CRM.ACCOUNT.DETAIL.MESSAGE_CONFIRM_DELETE';

      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            if (hasWorktask) {
              this.deleteAccountWithRelatedWorkTasks(AccountID);
            }
            else {
              this.deleteAccount(AccountID);
            }
          }
        });
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private deleteAccount(accountId) {
    this._commonHelper.showLoader();
    this._accountService.deleteAccount(accountId).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.MESSAGE_ACCOUNT_DELETED')
      );
      // Redirect Account Listing Page.
      this._router.navigateByUrl('/accounts/list');
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

  private deleteAccountWithRelatedWorkTasks(accountID) {
    this._commonHelper.showLoader();
    this._accountService.deleteAccountWithRelatedWorkTasks(accountID).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.MESSAGE_ACCOUNT_DELETED')
      );
     // Redirect Account Listing Page.
     this._router.navigateByUrl('/accounts/list');
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

  private getCountries() {
    const countries = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Countries));
    if (countries == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getCountries().then(response => {
          this.countries = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Countries, JSON.stringify(this.countries));
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
      this.countries = countries;
    }
  }

  private prepareParamsForStatesDropdown(countryId:number ,stateId:number) {
    const params = [];
    const paramItem = {
      name: 'CountryID',
      type: 'int',
      value: countryId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'SelectedStateID',
      type: 'int',
      value: stateId,
    };
    params.push(paramItem1);

    return params;
  }

  private getStatesByCountryId(countryId: number, stateId: number) {
    return new Promise((resolve, reject) => {
      let params = this.prepareParamsForStatesDropdown(countryId, stateId);
      // get datasource details
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.STATESBYCOUNTRY, params).then(response => {
        resolve(response);
      }, (error) => {
        this._commonHelper.showToastrError(error.message);
        reject(null);
      }).catch(() => {
        resolve(null);
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

  private getHoursInDay() {
    const hrsInDay = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY));
    if (hrsInDay == null) {
      return new Promise((resolve, reject) => {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.HOURS_IN_DAY).then((response: any) => {
          this.hoursInDay = (response != null && !isNaN(Number(response))) ? Number(response) : 24;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY, JSON.stringify(this.hoursInDay));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.hoursInDay = hrsInDay;
    }
  }

  private getEntityRelationComponents() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._entityRelationService.getEntityRelationComponents(this.entityTypeId).then((res : EntityRelationComponentsModel[]) => {
        this._commonHelper.hideLoader();
        if (res) {
          this.entityRelationComponents = res;
          this.entityRelationComponents.forEach(data => {
            const tabData = {
              tabName : data.customHeaderName ?? this._commonHelper.getConfiguredEntityName('{{' +  Entity[data.isReverseRelation ? data.fromEntityTypeID : data.toEntityTypeID] + '_plural_p}}'),
              tabLink : 'nav_er' + Entity[data.isReverseRelation ? data.fromEntityTypeID : data.toEntityTypeID],
              isFirst : true,
              condition : true,
              displayOrder : data.displayOrder,
              isTabLoaded: false
            };
            this.entityRelationTabs.push(tabData);
            this.tabsNameHideAction.push('nav_er' + Entity[data.isReverseRelation ? data.fromEntityTypeID : data.toEntityTypeID]);
          });
          resolve(null);
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        resolve(null);
      });
    });
  }

  private getNativeTabDetailsByEntityTypeId() {
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_Accounts));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_Accounts, JSON.stringify(response));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.nativeTabDetails = nativeTabDetails;
    }
  }

  //allow only 6 digits and '.'(dot)
  percentEventHandler(event) {
    if (event.keyCode === 46 && event.target.value.split('.').length === 2) {
      return false;
    }
    //don't allow more than 15 digit number
    return event.target.value.length <= 6;
  }

  //allow only 13 digits and ','(comma)
  currencyEventHandler(event) {
    //don't allow more than 13 digit number
    return event.target.value.length < 17;
  }

  //allow only 8000 characters in total
  textEventHandler(event) {
    return event.target.value.length < 4000;
  }

  relatedContactsOnFilter(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getContactsForAccountContacts(e.filter.trim());
      }
    }
    else {
      this.getContactsForAccountContacts('');
    }
  }

  relatedContactsOnChange(e) {
    this._commonHelper.showLoader();
    let param = {
      ContactId: e.value,
      AccountId: this.account.id
    }
    this._accountService.saveAccountContact(param).then(response => {
      this.refreshRelatedContacts = true;
      this.relatedContactDrpRef.resetFilter();
      this.getContactsForAccountContacts('');
      this.selectedContact = null;
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDCONTACT.MESSAGE_ADD_RELATEDCONTACT_SUCCESS'));
    }, (error) => {
      this.relatedContactDrpRef.resetFilter();
      this.getContactsForAccountContacts('');
      this.selectedContact = null;
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  prepareParamsForContactsDropdown(searchString: any) {
    const params = [];
    const paramItem = {
      name: 'AccountID',
      type: 'int',
      value: this.account.id,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem1);

    return params;
  }

  private getContactsForAccountContacts(searchString: any) {
    let params = this.prepareParamsForContactsDropdown(searchString);
    this.isShowLoaderForAccountContact = true;
    // get datasource details
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ADDACCOUNTCONTACTS, params).then(response => {
      this.contactsForAccountContacts = response;
      this.isShowLoaderForAccountContact = false;
    },
      (error) => {
        this.isShowLoaderForAccountContact = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  addRelatedContact() {
    this.optionsForPopupDialog.size = "lg";
    this.modalRef = this._modalService.open(ContactAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDCONTACT.ADD_DIALOG_TITLE'));
    this.modalRef.componentInstance.workflows = this.contactWorkflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.recordTypes = this.contactRecordTypes?.filter(s => s.value != 0);
    this.modalRef.componentInstance.isShowWorkflow = true;
    this.modalRef.componentInstance.isShowAssignTo = false;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        let param = { value: response }
        this.relatedContactsOnChange(param);
      }
    });
  }

  deleteRelatedContact(id: any) {
    this.optionsForPopupDialog.size = "md";
    this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDCONTACT.DELETE_RELATEDCONTACT_DIALOG_TEXT'), null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._accountService.deleteAccountContact(id).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDCONTACT.MESSAGE_DELETE_RELATEDCONTACT_SUCCESS'));
            this.refreshRelatedContacts = true;
            this.relatedContactDrpRef.resetFilter();
            this.getContactsForAccountContacts('');
          }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
        }
      });
  }


  private getAccountCustomFields(): void {
    this._commonHelper.showLoader();
    this._accountService.getAccountCustomFields(this.entityTypeId, this.accountId)
      .then((response: any) => {
        if (response) {
          this.accountCustomFields = response || [];
          this.prepareFormDataInJSON();
          this.getAccountDetail();
        }
        else {
          this.isInitialLoading = false;
        }
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.isInitialLoading = false;
        this.getTranslateErrorMessage(error);
      });
  }

  private prepareFormDataInJSON(): void {
    this.accountCustomFields.forEach((customField: any) => {
      if (customField.isVisible) {
        let isLabelView: boolean = false;
        let tabNameObject = this.getValueFromJSON(customField.tabDisplayName);
        if (!tabNameObject) {
          let dataObject = {
            tabName: customField.tabDisplayName,
            tabNumber: customField.tabDisplayOrder,
            isTabAlwaysVisible: customField.tabIsAlwaysVisible,
            sections: [
              {
                sectionName: customField.sectionName,
                isLabelView: isLabelView,
                controls: [
                  {
                    displayOrder: customField.displayOrder,
                    fieldName: customField.fieldName,
                    fieldType: customField.fieldType,
                    fieldClass: customField.fieldClass,
                    defaultValue: customField.defaultValue,
                    label: customField.label,
                    optionsJSON: customField.optionsJSON ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
                    settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
                    dataSourceId: customField.datasourceID,
                    dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
                  }
                ]
              }
            ]
          }
          this.addControlToFormJSON(customField.tabDisplayName, dataObject);
        } else {
          let existingSection = tabNameObject.sections.find(s => s.sectionName == customField.sectionName);
          if (existingSection) {
            existingSection.controls.push({
              displayOrder: customField.displayOrder,
              fieldName: customField.fieldName,
              fieldType: customField.fieldType,
              fieldClass: customField.fieldClass,
              defaultValue: customField.defaultValue,
              label: customField.label,
              optionsJSON: customField.optionsJSON != null ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
              settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
              dataSourceId: customField.datasourceID,
              dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
            });
          } else {
            tabNameObject.sections.push({
              sectionName: customField.sectionName,
              isLabelView: isLabelView,
              controls: [
                {
                  displayOrder: customField.displayOrder,
                  fieldName: customField.fieldName,
                  fieldType: customField.fieldType,
                  fieldClass: customField.fieldClass,
                  defaultValue: customField.defaultValue,
                  label: customField.label,
                  optionsJSON: customField.optionsJSON != null ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
                  settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
                  dataSourceId: customField.datasourceID,
                  dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
                }
              ]
            });
          }
        }
      }
    });
  }

  private getValueFromJSON(name: string): any {
    return this.formDataJSON.find(item => item.tabName == name);
  }

  private addControlToFormJSON(name: string, dataObject: any): void {
    let obj = this.formDataJSON.find(item => item[name]);
    if (obj) {
      obj[name] = dataObject[name];
    } else {
      this.formDataJSON.push(dataObject);
    }
  }

  private getAccountDetail() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._accountService.getAccountById(this.accountId)
        .then((response: any) => {
          if (response) {
            this.account = this._commonHelper.deepClone(response);
            this.account.customFieldJSONData = this._commonHelper.tryParseJson(this.account.customFieldJSONData);
            this.setDefaultCountry();

            Promise.all([
              this.isEntityExistsInWorkFlow(),
              this.getStatesByCountryId(this.account.billingAddress.countryId,this.account.billingAddress.stateId).then((response)=>{
                this.billingStates = response;
                this.showBillingStateLoader = false;
              }),
              this.getStatesByCountryId(this.account.shippingAddress.countryId,this.account.shippingAddress.stateId).then((response)=>{
                this.shippingStates = response;
                this.showShippingStateLoader = false;
              }),
            ]).then(() => {
              this.setAccountDetails(response || {});
              this.accountForm = this.createAccountDetailForm();
              if (this.account.entityWorkflowId) {
                this.accountForm.addControl('entityStageId', new FormControl(this.account.entityStageId ?? null, Validators.required));
              }
              //show/Hide Pause/Resume button
              this.account.isShowPauseOrResume =  (this.account?.entityWorkflowId  != null) ? true : false;
              this.prepareFormCustomFields();
              //set address validators
              this.onAddressChangeValidation(this.accountfrm.billingAddress,1);
              this.onAddressChangeValidation(this.accountfrm.shippingAddress,2);

              this.workTaskSubTypeDetails = this.entitySubTypes.find(x => x.level == 1);

              // prepare tab with order
              this.setDefaultNavTabs();
              this.prepareTabsWithOrder();
              this.copyOfAccountFormValues = this.accountForm.value;
              this.isLoaded = true;
              this.refreshCustomFieldJSONGrid = true;
              setTimeout(() => { this.refreshCustomFieldJSONGrid = false; }, 50);

               //find countryCode
              if(this.account.phone) {
                const phoneDetail = String(this.account.phone).split('|');
                if (phoneDetail.length == 2) {
                  this.accountForm.patchValue({'phone' : { countryCode : phoneDetail[0], phoneNumber : phoneDetail[1]}});
                  this.account['countryCode'] = phoneDetail[0];
                  this.account['phoneNumber'] = phoneDetail[1];
                  this.account['phoneMask'] = String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0");
                }
              } else {
                this.accountForm.patchValue({ 'phone': { countryCode: null, phoneNumber: null } });
              }
              resolve(null);
            });
          }
          else {
            this.isInitialLoading = false;
            resolve(null);
          }
          this._commonHelper.hideLoader();
        }, (error) => {
          this._commonHelper.hideLoader();
          this.isInitialLoading = false;
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    });
  }

  private isEntityExistsInWorkFlow() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityExistsInWorkFlow(this.accountId, this.entityTypeId).then((response: any) => {
        if (response) {
          this.entityWorkFlowStageValue = response;
          this.isEntityWorkflow = true;
          if (this.entityWorkflowId != null && this.entityWorkFlowStageValue.entityWorkFlowId != this.entityWorkflowId) {
            this.isInitialLoading = false;
          }
          else {
            this.account.entityWorkflowId = this.entityWorkflowId = this.entityWorkFlowStageValue.entityWorkFlowId;
            this.account.entityStageId = this.accountCurrentStage = this.entityWorkFlowStageValue.stageId;
            this.fromEntityStageId = this.account.entityStageId;
            this.account.isPaused = this.entityWorkFlowStageValue.isPaused;
            this.account.selectedStageTaskIds = this.accountCurrentStageTaskIds = this.entityWorkFlowStageValue.taskIds;
      
            if (this.account.entityWorkflowId != null) {
              Promise.all([
                this.getWorkflowDetail(this.entityWorkflowId),
                this.getEntityStagesWithTask()
              ]).then(() => {
                this.updateWorkFlowStageTaskDetail();
                if(this.isEntityWorkflow){
                  this.getEntityTotalReportingTime();
                }
              });
            }
          }
        }
        this._commonHelper.hideLoader();
        resolve(null);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.isInitialLoading = false;
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    });
  }

  // get assigned users
  getAssignedToUsers(includeAllUsers = 1, searchString = null) {
    this.showAssignedToLoader = true;
    // DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    let assignedToId = this.account.assignedTo; // owner 1 is assigned to
    let accountStageId = this.account.entityStageId;
    // get datasource details
    var params = this.prepareParamsForAssignedToUsers(accountStageId, assignedToId, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ACCOUNTASSIGNEDTO, params).then(response => {
      this.assignedToUsers = response;
      this.showAssignedToLoader = false;

      this.isForceReloadAssignedTo = !searchString ? false : true;
    },
      (error) => {
        this.showAssignedToLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  private prepareParamsForAssignedToUsers(stageId, assignedTo, includeAllUsers = 1, searchString = '') {
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

  // get work tasks by stage
  getEntityStagesWithTask() {
    return new Promise((resolve, reject) => {
      const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this.entityStagesWithTasksStorageKey}_${this.entityWorkflowId}`));
      if (entityStagesWithTasks == null) {
        this._commonHelper.showLoader();
        this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId).then(
          (response: any[]) => {
            this.accountStages = this._commonHelper.tryParseJson(JSON.stringify(response || []));
            // stage tasks
            this.accountStages.forEach(stageElement => {
              if (stageElement.stageTasks != null) {
                stageElement.stageTasks = this._commonHelper.tryParseJson(stageElement.stageTasks);
                // all stage tasks - change label if task is required
                stageElement.stageTasks.forEach(stageTask => {
                  if (stageTask.isRequired) {
                    stageTask.name = stageTask.name + ' *';
                  }
                });
              }
            });
            this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.accountStages));
            this.getEntityStagesWithTaskAfterReset();
            this._commonHelper.hideLoader();
            resolve(null);
          }, (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      }
      else {
        this.accountStages = entityStagesWithTasks;
        this.getEntityStagesWithTaskAfterReset();
        resolve(null);
      }
    });
  }

  getEntityStagesWithTaskAfterReset() {
    // get current stage 
    this.currentStage = this.accountStages.find(f => this.account && this.account.entityStageId === f.id) || this.accountStages.find(f => f.isDefault);
    
    //set selected stage for mobile view
    this.selectedStage = this.currentStage;

    // get current stage tasks
    this.currentStageTask = this.accountStages.length > 0 ? this.accountStages.find(s => s.id == this.account.entityStageId)?.stageTasks ?? null : '';
    if (this.account.selectedStageTaskIds != null && this.account.selectedStageTaskIds != "") {
      const taskIds: Array<number> = this.account.selectedStageTaskIds
        ? this.account.selectedStageTaskIds.split(",").map(m => Number(m))
        : [];
      // map and get only ID and Name
      this.account.selectedStageTaskIds = (this.currentStage.stageTasks || []).filter(f => taskIds.includes(f.id)) || [];
      this.oldStageTask = this._commonHelper.tryParseJson(JSON.stringify(this.account.selectedStageTaskIds));
    }
  }

  private createAccountDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.accountId],
      name: [this.account.name, Validators.compose([Validators.required, Validators.maxLength(500), Validators.minLength(2)])],
      legalName: [this.account.legalName, Validators.compose([Validators.maxLength(500), Validators.minLength(2)])],
      email: [this.account.email, Validators.compose([Validators.email, Validators.maxLength(200), Validators.minLength(2)])],
      email2: [this.account.email2, Validators.compose([Validators.email, Validators.maxLength(200), Validators.minLength(2)])],
      phone: [],
      numberOfEmployees: [this.account.numberOfEmployees, Validators.compose([Validators.min(0), Validators.max(9999)])],
      ein: [this.account.ein],
      assignedTo: [this.account.assignedTo],
      selectedStageTaskIds: [this.account.selectedStageTaskIds],
      entityWorkflowId: [this.account.entityWorkflowId],
      typeId: [this.account.typeId, Validators.compose([Validators.required])],
      billingAddress: this._formBuilder.group({
        address1: [this.account.billingAddress?.address1],
        address2: [this.account.billingAddress?.address2],
        city: [this.account.billingAddress?.city],
        // state: [''],
        stateId: [this.account.billingAddress?.stateId],
        postalCode: [this.account.billingAddress?.postalCode],
        countryId: [this.account.billingAddress.countryId]
      }),
      shippingAddress: this._formBuilder.group({
        address1: [this.account.shippingAddress?.address1],
        address2: [this.account.shippingAddress?.address2],
        city: [this.account.shippingAddress?.city],
        // state: [''],
        stateId: [this.account.shippingAddress?.stateId],
        postalCode: [this.account.shippingAddress?.postalCode],
        countryId: [this.account.shippingAddress.countryId],
      }),
    });
  }

  private prepareFormCustomFields(): void {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.account.customFieldJSONData[control.fieldName] != null && this.account.customFieldJSONData[control.fieldName] != '') {
              this.account.customFieldJSONData[control.fieldName] = moment(new Date(this.account.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.accountForm.addControl(control.fieldName, new UntypedFormControl(this.account.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.accountForm.addControl(control.fieldName, new UntypedFormControl(this.account.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.account.customFieldJSONData[control.fieldName] != null && this.account.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.account.customFieldJSONData[control.fieldName] === 'string') {
                this.account.customFieldJSONData[control.fieldName] = JSON.parse(this.account.customFieldJSONData[control.fieldName]);
              }
            } else {
              this.account.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.account.customFieldJSONData[control.fieldName] != null && this.account.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.account.customFieldJSONData[control.fieldName];
              this.account.customFieldJSONData[control.fieldName] = this.account.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON['isRequired']) {
                this.accountForm.addControl(control.fieldName, new UntypedFormControl(this.account.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.accountForm.addControl(control.fieldName, new UntypedFormControl(this.account.customFieldJSONData[control.fieldName]));
              }
              this.account.customFieldJSONData[control.fieldName] = stringValue;
            }
            else {
              this.accountForm.addControl(control.fieldName, new UntypedFormControl(this.account.customFieldJSONData[control.fieldName]));
              if (control.settingsJSON) {
                let validatorFn: ValidatorFn[] = [];
                if (control.settingsJSON['isRequired']) {
                  validatorFn.push(Validators.required);
                }
                if (control.settingsJSON['minLength']) {
                  validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
                }
                if (control.settingsJSON['maxLength']) {
                  validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
                }
                if (validatorFn.length > 0) {
                  this.accountForm.controls[control.fieldName].setValidators(validatorFn);
                  this.accountForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.account.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.account.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.accountForm.addControl(control.fieldName, new UntypedFormControl(this.account.customFieldJSONData[control.fieldName]));
              this.accountForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.accountForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.accountForm.addControl(control.fieldName, new UntypedFormControl(this.account.customFieldJSONData[control.fieldName]));
              this.accountForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.accountForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.accountForm.addControl(control.fieldName, new UntypedFormControl(this.account.customFieldJSONData[control.fieldName], Validators.email));
            let validatorFn: ValidatorFn[] = [];
            validatorFn.push(Validators.email);
            if (control.settingsJSON['isRequired']) {
              validatorFn.push(Validators.required);
            }
            if (control.settingsJSON['minLength']) {
              validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
            }
            if (control.settingsJSON['maxLength']) {
              validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
            }
            if (validatorFn.length > 0) {
              this.accountForm.controls[control.fieldName].setValidators(validatorFn);
              this.accountForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.accountForm.addControl(control.fieldName, new UntypedFormControl(this.account.customFieldJSONData[control.fieldName]));
            if (this.account.customFieldJSONData[control.fieldName] != null && this.account.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.account.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.accountForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") } );
              }
            } else {
              this.accountForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.accountForm.addControl(control.fieldName, new UntypedFormControl(this.account.customFieldJSONData[control.fieldName]));
            if (control.settingsJSON) {
              let validatorFn: ValidatorFn[] = [];
              if (control.settingsJSON['isRequired']) {
                validatorFn.push(Validators.required);
              }
              if (control.settingsJSON['minLength']) {
                validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
              }
              if (control.settingsJSON['maxLength']) {
                validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
              }
              if (validatorFn.length > 0) {
                this.accountForm.controls[control.fieldName].setValidators(validatorFn);
                this.accountForm.controls[control.fieldName].updateValueAndValidity();
              }
            }
          }
        });
      });
    });
  }

  private setDefaultNavTabs(): void {
    this.navTabsAll = [
      { tabName: 'Details', tabLink: 'navDetails', isFirst: true, condition: true, displayOrder: 101 },
      { tabName: '', tabLink: 'navContacts', isFirst: false, condition: this.isListContacts, displayOrder: 201 },
      { tabName: '', tabLink: 'navProducts', isFirst: false, condition: this.isListProducts, displayOrder: 301 },
      { tabName: '', tabLink: 'navAttachment', isFirst: false, condition: this.isShowAttachmentTab, displayOrder: 401 },
      { tabName: '', tabLink: 'navWorkTasks', isFirst: false, condition: this.isListWorkTask, displayOrder: 501 },
      { tabName: '', tabLink: 'navRelatedOpportunities', isFirst: false, condition: this.isListOpportunities, displayOrder: 601 },
      { tabName: '', tabLink: 'navHistory', isFirst: false, condition: true, displayOrder: 701 },
      { tabName: '', tabLink: 'navRelatedCases', isFirst: false, condition: this.isListCases, displayOrder: 801 },
      { tabName: '', tabLink: 'navDocuments', isFirst: false, condition: true, displayOrder: 901 }      
    ];

    this.setNativeTabDetails();

    this.navTabsAll = [...this.navTabsAll, ...this.entityRelationTabs];

    this.navTabsAll.forEach((f) => {
      (f.isNativeTab = true), (f.isTabAlwaysVisible = false),(f.showCloseTabIconBtn = false), (f.showButtonActive = false)
    });
  }

  private setNativeTabDetails() {
    this.navTabsAll.forEach(tab => {
      const nativeTabDetail = this.nativeTabDetails != null ? this.nativeTabDetails.find(x => x != null && x.code?.toLocaleLowerCase() === tab.tabLink.toLocaleLowerCase()) : null;
      if (nativeTabDetail != null) {
        tab.tabName = nativeTabDetail.displayName;
        tab.displayOrder = nativeTabDetail.displayOrder;
        tab.condition = tab.condition && nativeTabDetail.isActive;
      }
      else {
        tab.condition = false;
      }
    });

    if (!this.navTabsAll.some(x => x.condition)) {
      this.navTabsAll.find(x => x.isFirst).condition = true;
    }
  }

  private prepareTabsWithOrder(): void {
    this.formDataJSON.forEach(tab => {
      var objNavTab = {
        tabName: tab.tabName,
        tabLink: 'nav' + tab.tabName.replace(/\s/g, ""),
        isFirst: false,
        condition: true,
        displayOrder: tab.tabNumber,
        isNativeTab:false,
        isTabAlwaysVisible: tab.isTabAlwaysVisible,
        showCloseTabIconBtn : true,
        showButtonActive : false
      }
      this.navTabsAll.push(objNavTab);
    });
    this.navTabsAll = this.navTabsAll.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
    this.setTabLayout();
    
  }

  private setWorkTaskTabParameters(): void {
    this.tbWorktaskParameters = [{
      name: 'EntityTypeID',
      type: 'int',
      value: this.entityTypeId
    }, {
      name: 'EntityID',
      type: 'int',
      value: this.accountId
    }]
  }

  private setRelatedOpportunitiesTabParameters(): void {
    this.tbRelatedOpportunitiesParameters = [{
      name: 'EntityTypeID',
      type: 'int',
      value: this.entityTypeId
    }, {
      name: 'EntityID',
      type: 'int',
      value: this.accountId
    }]
  }

  private setRelatedContactsTabParameters(): void {
    this.tbContactParameters = [{
      name: 'AccountID',
      type: 'int',
      value: this.accountId
    }]
  }

  private setRelatedProductsTabParameters(): void {
    this.tblProductParameters = [{
      name: 'AccountID',
      type: 'int',
      value: this.accountId
    }]
  }

  private setRelatedCasesTabParameters(): void {
    this.tbRelatedCasesParameters = [{
      name: 'EntityTypeID',
      type: 'int',
      value: this.entityTypeId
    }, {
      name: 'EntityID',
      type: 'int',
      value: this.accountId
    }]
  }

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'accounts.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else if (error.messageCode.toLowerCase() == 'accounts.alreadyassignedforcase') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.ACCOUNTS_ALREADYASSIGNEDFORCASE'));
      }
      else if (error.messageCode.toLowerCase() == 'accounts.closedorcompleted') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.ACCOUNTS_CLOSEDORCOMPLETED', { stageName: error.data.stageName }));
      } else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      }
      else if (error.messageCode.toLowerCase() != 'accounts.recordfiltererror') {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }

  private getEntityTotalReportingTime() {
    this._workflowmanagementService.getEntityTotalReportingTime(this.accountId, this.entityTypeId).then((response: any) => {
      if (response) {
        this.totalSpentTime = new TimeFramePipe().transform(+response?.totalSpentTime, this.hoursInDay);
        this.totalEffectiveTime = new TimeFramePipe().transform(+response?.totalEffectiveTime, this.hoursInDay);
        this.totalPauseTime = new TimeFramePipe().transform(+response?.totalPauseTime, this.hoursInDay);
      }
    }, (error) => {
      this.getTranslateErrorMessage(error);
    });
  }  

  private validateAllFormFields(formGroup: UntypedFormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      } else if (control instanceof UntypedFormArray) {
        control?.controls?.forEach((i: UntypedFormGroup) => {
          this.validateAllFormFields(i);
        })
      }
    });
  }

  private canUserChangeStage(currentStage, account): boolean {
    if (currentStage == null || account == null) {
      return true;
    }

    let canUserMoveAccount: boolean = false;
    if (currentStage.transitionAssociates != null && currentStage.transitionAssociates != '') {
      const associates = currentStage.transitionAssociates.trim().split(',');
      associates.forEach(associate => {
        const associatePropertyName = this._commonHelper.convertToCamalize(associate);
        canUserMoveAccount = canUserMoveAccount || (account.hasOwnProperty(associatePropertyName) ? (account[associatePropertyName] == this._loggedInUser.userId) : false);
      });
    }
    else {
      canUserMoveAccount = true;
    }
    return canUserMoveAccount
  }

  // stage transition
  onMarkStageAsComplete(dropEntityStageId) {
    var isShowStageChangeConfirmationBox: boolean = true;
    this.optionsForPopupDialog.size = 'md';
    const dropEntityStageDetail = this.accountStages.find(s => s.id == dropEntityStageId);

    if (dropEntityStageDetail != null && dropEntityStageId != this.account.entityStageId) {
      const prevEntityStageDetail = this.accountStages.find(s => s.id == this.account.entityStageId);
      const canUserChangeStage: boolean = this.canUserChangeStage(prevEntityStageDetail, this.account);

      if (!canUserChangeStage) {
        if (this.changeAccountStage) {
          isShowStageChangeConfirmationBox = false;
          this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
            .then((confirmed) => {
              if (confirmed) {
                this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox);
              }
            });
        }
        else {
          this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
        }
      }
      else {
        this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox);
      }
    }
  
  }

  afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox: boolean) {
    const dropEntityStageDetail = this.accountStages.find(s => s.id == dropEntityStageId);

    // if any one of the current stage task is required
    let anyTasksIsRequired: boolean = false;
    let requiredTasks: any[] = [];
    // find out the current stage
    let currentStage = this.accountStages.find(x => x.id == this.account.entityStageId);
    let isAllTasksRequired = currentStage?.isAllTasksRequired;
    // see if current stage have stage tasks
    if (currentStage.stageTasks != null) {
      if (currentStage.stageTasks.length > 0) {
        currentStage.stageTasks.forEach(stageTask => {
          if (stageTask.isRequired) {
            anyTasksIsRequired = true;
            // add to list
            requiredTasks.push(stageTask.id);
          }
        })
      }
    }

    if (anyTasksIsRequired) {
      /**
        * Call API to validate worktask has completed the stage tasks (which are required) before moving on to other stage.
        * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (WorkTaskId)
        * */
      let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityStageTasksCompleted(this.accountId, this.entityTypeId, this.account.entityStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.MESSAGE_BEFORE_MOVE_ACCOUNT_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else if (isAllTasksRequired) {
      /**
        * Call API to validate account has completed all the stage tasks before moving on to other stage.
        * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (AccountId)
        * */
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityStageTasksCompleted(this.accountId, this.entityTypeId, this.account.entityStageId, this.entityWorkflowId, null).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.MESSAGE_BEFORE_MOVE_ACCOUNT_STAGE_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });

    } else {
      this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox);
    }
  }

  changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox: boolean) {
    if (dropEntityStageDetail.isNoteRequired) {
      isShowStageChangeConfirmationBox = false;
      this.refreshActivity = false;
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = this.accountId;
      this.modalRef.componentInstance.noteSubject = dropEntityStageDetail.name;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropEntityStageDetail.name }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = dropEntityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(response => {
        if (response != undefined) {
          this.refreshActivity = true;
          this.setRefreshActivityHistory();
          const stageValueNoteParams = {
            entityTypeId: this.entityTypeId,
            entityId: this.accountId,
            workflowId: this.entityWorkflowId,
            workflowStageId: dropEntityStageId,
            stageNoteID: response.id,
            pauseNoteID: null,
            processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.StageNote
          };

          Promise.all([
            this.updateEntityStage(dropEntityStageId, dropEntityStageDetail.name, isShowStageChangeConfirmationBox),
          ]).then(() => {
            Promise.all([
              this.saveEntityWorkflowStageValueNote(stageValueNoteParams)
            ]).then(() => {
              this.isEntityExistsInWorkFlow();
            });
          }).catch(() => {
            this.isEntityExistsInWorkFlow();
          });
        }
        else {
          this.selectedStage = this.currentStage;
        }
      });
    }
    else {
      Promise.all([
        this.updateEntityStage(dropEntityStageId, dropEntityStageDetail.name, isShowStageChangeConfirmationBox),
      ]).then(() => {
        this.isEntityExistsInWorkFlow();
      }).catch(() => {
        this.isEntityExistsInWorkFlow();
      });
    }
  }

  // update workflow entity stage values
  updateEntityStage(dropEntityStageId, dropEntityStageName, isShowStageChangeConfirmationBox: boolean) {
    this.optionsForPopupDialog.size = 'md';
    return new Promise((resolve, reject) => {
      if(isShowStageChangeConfirmationBox) {
        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.CHANGE_STAGE_CONFIRMATION'), null, null, this.optionsForPopupDialog).then((confirmed) => {
          if (confirmed) {
            return this.afterUpdateEntityStage(dropEntityStageId, dropEntityStageName);
          }
        })
      }else {
        return this.afterUpdateEntityStage(dropEntityStageId, dropEntityStageName);
      }
    });
  }

  afterUpdateEntityStage(dropEntityStageId, dropEntityStageName) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      let assignedToForDto = this.account.assignedTo;
      let currentStageId = this.accountStages.find(x => x.id == this.account.entityStageId)?.id;
      let dropStage = this.accountStages.find(x => x.id == dropEntityStageId);
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: this.accountId, stageId: dropEntityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedToForDto, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.accountAssignedTo = response;
          if (assignedToForDto != this.accountAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._accountService.updateAccountAssignedTo({ entityId: this.accountId, assignedToId: this.accountAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.accountAssignedTo.isForcedAssignment, stageId: dropEntityStageId }).then((response: any) => {
              if (response) {
                assignedToForDto = this.accountAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.MESSAGE_ACCOUNT_MOVETO_STAGE',
                  { stageName: dropEntityStageName })
              );
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
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.MESSAGE_ACCOUNT_MOVETO_STAGE',
                { stageName: dropEntityStageName })
            );
          }
        }
        //get account details
        this.getAccountDetail();
        this.setRefreshStageHistory();
        resolve(null);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    })
  }

  private saveEntityWorkflowStageValueNote(params) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._workflowmanagementService.saveEntityWorkflowStageValueNote(params).then(() => {
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

  private setAccountDetails(response: any): void {
    this.accountName = this.account?.name;
    if (this.account.shortCode != null) {
      this.isHelpCode = true;
    }
    else {
      this.isHelpCode = false;
    }

    if (!this.account.entityWorkflowId) {
      this.updateWorkFlowStageTaskDetail();
    }
    else {
      this.copyOfAccount = this._commonHelper.deepClone(this.account);

    }

    this.copyOfIsDefaultBillingCountryId = this.isDefaultBillingCountryId;
    this.copyOfIsDefaultShippingCountryId = this.isDefaultShippingCountryId;
    this.entityRecordTypeId = this.account.entityRecordTypeId;
    this.copyOfAccount.customFieldJSONData = this._commonHelper.deepClone(this.account.customFieldJSONData);
  }

  private setDefaultCountry() {
    if (this.account.billingAddress?.countryId == null || this.account.billingAddress?.countryId == '') {
      this.account.billingAddress.countryId = this._commonHelper.defaultCountryId;
      this.isDefaultBillingCountryId = true;
    }
    else {
      this.isDefaultBillingCountryId = false;
    }

    if (this.account.shippingAddress?.countryId == null || this.account.shippingAddress?.countryId == '') {
      this.account.shippingAddress.countryId = this._commonHelper.defaultCountryId;
      this.isDefaultShippingCountryId = true;
    }
    else {
      this.isDefaultShippingCountryId = false;
    }
  }

  private updateWorkFlowStageTaskDetail() {
    this.account.entityWorkflowId = this.entityWorkflowId;
    this.account.entityStageId = this.accountCurrentStage;
    this.copyOfAccount = this._commonHelper.deepClone(this.account);
  }

  private saveData(): any {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.account.customFieldJSONData) {
        this.accountCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.account.customFieldJSONData[field.fieldName] && this.account.customFieldJSONData[field.fieldName] != null && this.account.customFieldJSONData[field.fieldName] != '') {
              this.account.customFieldJSONData[field.fieldName] = moment(this.account.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.accountForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.account.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.account.customFieldJSONData[field.fieldName] = null
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.accountForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.account.customFieldJSONData[field.fieldName] = data;
            } else {
              this.account.customFieldJSONData[field.fieldName] = null
            }
          }
        })
      }

      //concat country code with phone number;
      const formValues = this.accountForm.getRawValue();
      if(formValues.phone) {
        if(formValues.phone.countryCode && formValues.phone.phoneNumber) {
          this.account.phone = formValues.phone.countryCode +  '|' +  String(formValues.phone.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
        } else {
          this.account.phone = null;
        }
      }

      let params = this._commonHelper.deepClone(this.account);

      this.accountCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.accountForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = new TimeFrameToMinutesPipe().transform(formArrayValues, this.hoursInDay);
        }
      });

      //set selectedStageTaskIds
      if (params.selectedStageTaskIds != null) {
        if (Array.isArray(params.selectedStageTaskIds)) {
          params.selectedStageTaskIds = params.selectedStageTaskIds.map(task => task.id).toString()
        }
      } else {
        params.selectedStageTaskIds = '';
      }

      let isLoadStageTransition = false;
      let isLoadEntityWorkFlow = false;
      if (this.copyOfAccount.assignedTo != this.account.assignedTo ||
        ((this.account.selectedStageTaskIds && this.account.selectedStageTaskIds.map(st => st.id).join(',')) !=
          (this.copyOfAccount.selectedStageTaskIds && this.copyOfAccount.selectedStageTaskIds))) {

        if ((this.account.selectedStageTaskIds && this.account.selectedStageTaskIds.map(st => st.id).join(',')) !=
          (this.copyOfAccount.selectedStageTaskIds && this.copyOfAccount.selectedStageTaskIds))
          isLoadEntityWorkFlow = true;
        else
          isLoadStageTransition = true;
      }

      params.fromEntityStageId = this.fromEntityStageId;
      
      this._accountService.updateAccount(params).then(() => {
        this.getAccountDetail().then(() => {
          if (isLoadStageTransition && this.isEntityWorkflow) {
            this.setRefreshStageHistory();
          }
          else if (isLoadEntityWorkFlow) {
            this.isEntityExistsInWorkFlow();
          }
          this.refreshCustomFieldDatasource = true;
          setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          resolve(null);
        });
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.SUCCESS_MESSAGE'));
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error.messageCode.toLowerCase() !== 'staticmessage') {
          this.getAccountDetail().then(() => {
            this.refreshCustomFieldDatasource = true;
            setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
            resolve(null)
          });
        } else {
          reject(null)
        }
        reject(null)
      });
    })
  }

  onStatusChange() {
    //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    let confirmMessage, successMessage;

    if (!this.account.isActive) {
      confirmMessage = 'CRM.ACCOUNT.MESSAGE_CONFIRM_ACTIVE';
      successMessage = 'CRM.ACCOUNT.MESSAGE_CONTACT_ACTIVATED';
    }
    else {
      confirmMessage = 'CRM.ACCOUNT.MESSAGE_CONFIRM_INACTIVE';
      successMessage = 'CRM.ACCOUNT.MESSAGE_CONTACT_INACTIVATED';
    }

    this._confirmationDialogService.confirm(confirmMessage, null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this.account.isActive = !this.account.isActive;
          this._commonHelper.showLoader();

          let params = { id: this.account.id, isActive: this.account.isActive };


          this._accountService.updateAccountIsActive(params).then((response) => {
            if (response) {
              this.getAccountDetail();
              this.isReadOnly = true;
              this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
              this.refreshOpporunityTab = true;
              this.refreshCaseTab = true;
              this.refreshRelatedContacts = true;
              this.refreshRelatedProducts = true;
              this._commonHelper.hideLoader();
              this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData(successMessage));
            }
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
              this.getAccountDetail();
              this.isReadOnly = true;
            });
        }
      })

  }

  onGenerate941xClick() {
    if (!this.isPrepare941x) {
      return;
    }

    //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    let confirmMessage = 'CRM.ACCOUNT.MESSAGE_CONFIRM_GENERATE_941X', successMessage = 'CRM.ACCOUNT.MESSAGE_CONFIRM_GENERATED_941X';

    this._confirmationDialogService.confirm(confirmMessage, null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();

          this._accountService.generate941xFiles(this.accountId).then((response) => {
            if (response) {
              this.getAccountDetail();
              this.isReadOnly = true;
              this._commonHelper.hideLoader();
              this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData(successMessage));
            }
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
              this.getAccountDetail();
              this.isReadOnly = true;
            });
        }
      });
  }

  onSend941xDocumentsForEsignClick() {
    if (!this.isSendDocumentsForEsign) {
      return;
    }

    this._commonHelper.showLoader();
    this._accountService.send941xDocumentsForSignature(this.accountId).then(response => {
      this._commonHelper.hideLoader();
      this.isReadOnly = true;
      // success message
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_CONFIRM_SEND_941x_DOCUMENT_FOR_ESIGN')
      );
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        this.isReadOnly = true;
      });
  }

  onCalculateErc() {
    if (!this.isCalculateERC) {
      return;
    }
    //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };
    this._confirmationDialogService.confirm('CRM.ACCOUNT.MESSAGE_CONFIRM_CALCULATE_ERC', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this.refreshActivity = false;
          this._accountService.calculateErc(this.accountId, this.entityRecordTypeId, this.recordTypeConvertedPayrollId).then(response => {
            if (this.onceAttachmentClicked) {
              this.onceAttachmentClicked = false;
              setTimeout(() => {
                this.onceAttachmentClicked = true;
              }, 50);
            }
            this.getAccountDetail();
            this.isReadOnly = true;
            this.refreshActivity = true;
            this.setRefreshActivityHistory();
            this.setRefreshEntityTag();
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_CONFIRM_CALCULATED_ERC'));
          }, (error: any) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            this.getAccountDetail();
            this.isReadOnly = true;
          })
        }
      });
  }

  // set current active tab
  setTab(activeInfo) {
    this.isAdditionalTab = activeInfo.isAdditionalTab;
    this.activeTab = activeInfo.tab.tabLink;
    this.selectedTab = activeInfo.tab.tabLink;
    if (!this.onceWorkTaskClicked && this.activeTab == 'navWorkTasks') {
      this.onceWorkTaskClicked = true;
    }

    if (!this.onceRelatedOpportunitiesClicked && this.activeTab == 'navRelatedOpportunities') {
      this.onceRelatedOpportunitiesClicked = true;
    }

    if (!this.onceContactClicked && this.activeTab == 'navContacts') {
      this.getContactsForAccountContacts('');
      this.onceContactClicked = true;
    }

    if (!this.onceAttachmentClicked && this.activeTab == 'navAttachment') {
      this.onceAttachmentClicked = true;
    }

    if (!this.onceProductClicked && this.activeTab == 'navProducts') {
      this.getAvailableProductsForAccount('');
      this.onceProductClicked = true;
    }

    if((!this.onceStageHistoryClicked && this.activeTab == 'navHistory')) {
      this.onceStageHistoryClicked = true;
    }

    if((!this.onceRelatedCasesClicked && this.activeTab == 'navRelatedCases')) {
      this.onceRelatedCasesClicked = true;
    }

    if (activeInfo.tab.hasOwnProperty("isTabLoaded") && !activeInfo.tab.isTabLoaded) {      
      activeInfo.tab.isTabLoaded = true;
      const selectedTab = this.entityRelationTabs.find(x => x.tabLink == activeInfo.tab.tabLink);
      if (selectedTab) {
        selectedTab['isTabLoaded'] = true;
      }
    }

    if (this.activeTab == 'navDocuments' && !this.onceDocumentClicked) {
      this.onceDocumentClicked = true;
    }
  }

  setRefreshEntityTag() {
    this.refreshEntityTag = !this.refreshEntityTag;
  }

  setRefreshActivityHistory(){
    this.refreshActivityHistory = false;
    setTimeout(() => {
      this.refreshActivityHistory = true;  
    }, 500);
  }

  setRefreshStageHistory() {
    this.refreshStageHistory = false;
    setTimeout(() => {
      this.refreshStageHistory = true;
    }, 500);
  }

  refreshChildComponent(componentName: string) {
    switch (componentName) {
      case "RelatedContacts": {
        this.refreshRelatedContacts = false;
        break;
      }

      case "RelatedProducts": {
        this.refreshRelatedProducts = false;
        break;
      }
      case "WorkTask": {
        this.refreshWorkTaskTab = false;
        break;
      }
      case "RelatedCases": {
        this.refreshCaseTab = false;
        break;
      }
    }
  }
  //#endregion

  findInvalidControls() {
    const invalid = [];
    const controls = this.accountForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }

  navigateToTabByValidation() {
    let findInCustomTab: boolean = false;
    let customTabLink: string = '';
    let original_customTabLink: string = '';
    let inValidControls: any[] = this.findInvalidControls();
    if (inValidControls.length > 0) {
      this.formDataJSON.forEach(tab => {
        tab.sections.forEach(section => {
          section.controls.forEach(control => {
            const controlExists = inValidControls.find(x => x === control.fieldName);
            if (controlExists) {
              original_customTabLink = tab.tabName;
              customTabLink = tab.tabName.replace(/\s/g, "");
              findInCustomTab = true;
              return;
            }
          })
        });
      });
      if (this.tabLayout?.toLowerCase() === TabLayoutType.ADDITIONAL_TAB.toLowerCase()) {
        //Auto Redirect to Tab which is depen
        if (findInCustomTab) {
          if (this.navTabs.find(f => f.tabName?.toLocaleLowerCase() == original_customTabLink?.toLocaleLowerCase())) {
            document.getElementById('btn_nav' + customTabLink).click();
          }
          else {
            let tab = this.navTabsAll.find(f => f.tabName?.toLocaleLowerCase() == original_customTabLink?.toLocaleLowerCase())
            if (tab) {
              this.selectedTab = tab.tabLink;
              let param: any = {};
              param.isAdditionalTab = tab.tabLink === "additionalTabs";
              param.isNativeTab = true; // always true
              param.tab = tab;
              this.checkTabCall(param, false)
            }
          }
        } else {
          document.getElementById('btn_navDetails').click();
        }
      }
      else {
        if (findInCustomTab) {
          document.getElementById('btn_nav' + customTabLink).click();
        } else {
          document.getElementById('btn_navDetails').click();
        }
      }
    }
  }

  // prepare params for datasource with required fields
  prepareParamsForDocumentType() {
    const params = [];
    const paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.Files,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'ParentEntityTypeID',
      type: 'int',
      value: this.entityTypeId
    };
    params.push(paramItem1);

    return params;
  }

  getDocumentType() {
    return new Promise((resolve, reject) => {
      // prepare params
      const params = this.prepareParamsForDocumentType();
      this._commonHelper.showLoader();
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.DOCUMENTTYPE, params).then((response: any) => {
        if (response) {
          this.documentTypeList = response;
          this.recordType941sId = this.documentTypeList.find(x => x.label === '941s').value;
          this.recordTypePayrollId = this.documentTypeList.find(x => x.label === 'Payroll').value;
          this.recordTypeOthersId = this.documentTypeList.find(x => x.label === 'Other').value;
          this.recordType941xId = this.documentTypeList.find(x => x.label === '941x').value;
          this.recordTypePPPId = this.documentTypeList.find(x => x.label === 'PPP').value;
          this.recordTypeConvertedPayrollId = this.documentTypeList.find(x => x.label === 'Converted Payroll').value;
          this.recordTypePLId = this.documentTypeList.find(x => x.label === 'P & L').value;

          // Generate Dynamic Parameter
          this.setPayrollParameters();
          this.set941sParameters();
          this.setOtherParameters();
          this.set941xParameters();
          this.setPPPParameters();
          this.setConvertedPayroll();
          this.setPLParameters();
        }
        this._commonHelper.hideLoader();
        resolve(null);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  refreshDocuments(event: boolean) {
    this.refreshActivity = false;
    if (event) {
      setTimeout(() => {
        this.refreshActivity = true;
      }, 50);
    }
    this.setRefreshActivityHistory();
  }

  private setPayrollParameters(): void {
    this.dynamicPayrollParamList = [
      {
        name: 'EntityTypeID',
        type: 'int',
        value: this.entityTypeId
      },
      {
        name: 'EntityID',
        type: 'int',
        value: this.accountId
      },
      {
        name: 'EntityRecordTypeID',
        type: 'int',
        value: this.recordTypePayrollId
      }]
  }

  private set941sParameters(): void {
    this.dynamic941sParamList = [
      {
        name: 'EntityTypeID',
        type: 'int',
        value: this.entityTypeId
      },
      {
        name: 'EntityID',
        type: 'int',
        value: this.accountId
      },
      {
        name: 'EntityRecordTypeID',
        type: 'int',
        value: this.recordType941sId
      }]
  }

  private setOtherParameters(): void {
    this.dynamicOtherParamList = [
      {
        name: 'EntityTypeID',
        type: 'int',
        value: this.entityTypeId
      },
      {
        name: 'EntityID',
        type: 'int',
        value: this.accountId
      },
      {
        name: 'EntityRecordTypeID',
        type: 'int',
        value: this.recordTypeOthersId
      }]
  }

  private set941xParameters(): void {
    this.dynamic941xParamList = [
      {
        name: 'EntityTypeID',
        type: 'int',
        value: this.entityTypeId
      },
      {
        name: 'EntityID',
        type: 'int',
        value: this.accountId
      },
      {
        name: 'EntityRecordTypeID',
        type: 'int',
        value: this.recordType941xId
      }]
  }

  private setPPPParameters(): void {
    this.dynamicPPPParamList = [
      {
        name: 'EntityTypeID',
        type: 'int',
        value: this.entityTypeId
      },
      {
        name: 'EntityID',
        type: 'int',
        value: this.accountId
      },
      {
        name: 'EntityRecordTypeID',
        type: 'int',
        value: this.recordTypePPPId
      }]
  }

  private setConvertedPayroll(): void {
    this.dynamicConvertedPayrollParamList = [
      {
        name: 'EntityTypeID',
        type: 'int',
        value: this.entityTypeId
      },
      {
        name: 'EntityID',
        type: 'int',
        value: this.accountId
      },
      {
        name: 'EntityRecordTypeID',
        type: 'int',
        value: this.recordTypeConvertedPayrollId
      }
    ]
  }

  private setPLParameters(): void {
    this.dynamicPLParamList = [
      { name: 'EntityTypeID', type: 'int', value: this.entityTypeId },
      { name: 'EntityID', type: 'int', value: this.accountId },
      { name: 'EntityRecordTypeID', type: 'int', value: this.recordTypePLId }
    ]
  }

  relatedProductsOnFilter(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getAvailableProductsForAccount(e.filter.trim());
      }
    }
    else {
      this.getAvailableProductsForAccount('');
    }
  }

  relatedProductsOnChange(e) {
    let productId = +e.value || 0
    if (productId > 0) {
      this._commonHelper.showLoader();
      //Get Account Product Detail
      this._productService.getProductById(productId).then((productResponse: any) => {
        this._commonHelper.hideLoader();

        this.openAccountProductEditPopup(0, this.account.id, productId, productResponse?.name, productResponse?.description, null, null);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
  }

  prepareParamsForProductsDropdown(searchString: any) {
    const params = [];
    const paramItem = {
      name: 'AccountID',
      type: 'int',
      value: this.account.id,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem1);

    return params;
  }

  private getAvailableProductsForAccount(searchString: any) {
    let params = this.prepareParamsForProductsDropdown(searchString);
    this.isShowLoaderForProduct = true;
    // get datasource details
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.AVAILABLEPRODUCTSFORACCOUNT, params).then(response => {
      this.productsForAccountProducts = response;
      this.isShowLoaderForProduct = false;
    },
      (error) => {
        this.isShowLoaderForProduct = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  addRelatedProduct() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(ProductAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowAccountProductControls = true;
    this.modalRef.componentInstance.accountId = this.account.id;
    this.modalRef.componentInstance.isShowAssignTo = false;
    this.modalRef.componentInstance.workflows = this.productWorkflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.recordTypes = this.productRecordTypes?.filter(s => s.value != 0);
    this.modalRef.componentInstance.isShowWorkflow = true;
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDPRODUCT.ADD_DIALOG_TITLE'));
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshRelatedProducts = true;
        this.relatedProductDrp.resetFilter();
        this.getAvailableProductsForAccount('');
        this.selectedProduct = null;
      }
    });
  }

  deleteRelatedProduct(id: any) {
    this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDPRODUCT.DELETE_RELATEDPRODUCT_DIALOG_TEXT'), null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._accountService.deleteAccountProducts(id).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDPRODUCT.MESSAGE_DELETE_RELATEDPRODUCT_SUCCESS'));
            this.refreshRelatedProducts = true;
            this.relatedProductDrp.resetFilter();
            this.getAvailableProductsForAccount('');
          }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
        }
      });
  }

  editRelatedProduct(id: any) {
    this.getAccountProductDetail(id);
  }

  getAccountProductDetail(id: number) {
    if (id > 0) {
      this._commonHelper.showLoader();
      this._accountService.getAccountProductById(id).then((response: any) => {
        if (response) {
          //Get Account Product Detail
          this._productService.getProductById(+response.productID).then((productResponse: any) => {
            this._commonHelper.hideLoader();

            this.openAccountProductEditPopup(id, this.account.id, response.productID, productResponse?.name, productResponse?.description, response.startDate, response.endDate);
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
  }

  openAccountProductEditPopup(accountProductId: number, accountId: number, productId: number, productName: string, description: string, accountProductStartDate?: Date, accountProductEndDate?: Date) {
    //Open Product Edit Popup
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(AccountProductEditDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.accountProductId = accountProductId;
    this.modalRef.componentInstance.productId = productId;
    this.modalRef.componentInstance.accountId = accountId;
    this.modalRef.componentInstance.productName = productName;
    this.modalRef.componentInstance.description = description;
    this.modalRef.componentInstance.accountProductStartDate = accountProductStartDate ? moment(new Date(accountProductStartDate)).toDate() : null;
    this.modalRef.componentInstance.accountProductEndDate = accountProductEndDate ? moment(new Date(accountProductEndDate)).toDate() : null;
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDPRODUCT.EDIT_DIALOG_TITLE'));
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshRelatedProducts = true;
        this.relatedProductDrp.resetFilter();
        this.getAvailableProductsForAccount('');
        this.selectedProduct = null;
      }
    });
  }

  accountProductsList(data: any) {
    if (data && data.length > 0) {
      this.accountProductsData = data || [];
    }
  }
  /**
   * START
   * Moksh Dhameliya 25 May 2023
   * Additional Tabs Code 
   */
  async setTabLayout() {
    //Only configure once time when both are 0 for edit/save resolved issue
    if (this.navTabsAll.length > 0 && (this.nativeTabCount == this.navTabs.length ) ) {
      let isAdditionalTabExist = false;
      if (this.tabLayout?.toLowerCase() === TabLayoutType.ADDITIONAL_TAB.toLowerCase()) {
        this.navTabs = this.navTabsAll.filter(f => f.isNativeTab || f.isTabAlwaysVisible); // nativeTab 
        this.navTabsMore = this.navTabsAll.filter(f => !f.isNativeTab && !f.isTabAlwaysVisible); // custom tab
        
        //checking more tab exist for additional tab
        if (this.navTabsMore.length > 0) {
          isAdditionalTabExist = true;
          let objNavTab = {
            tabName: TabLayoutType.LABEL_ADDITIONAL_TAB,
            tabLink: 'additionalTabs',
            isFirst: false,
            condition: true,
            displayOrder: this.navTabs[this.navTabs.length - 1].displayOrder + 1,
            isNativeTab: true
          }
          objNavTab.condition = true;
          this.navTabs.push(objNavTab);
          this.nativeTabCount = this.navTabs.length;
        }
        else {
          isAdditionalTabExist = false;
        }
      }else {
        this.navTabsAll.forEach((f) => {
          (f.showCloseTabIconBtn = false)
        });
      }
      if (!isAdditionalTabExist) {
        this.navTabs = this._commonHelper.deepClone(this.navTabsAll);
        this.isNativeTab = true;
        this.isAdditionalTab = false;
      }
      //Tab Order Sorting
      this.navTabs = this.navTabs?.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
      this.navTabsMore = this.navTabsMore?.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
      // set first as default
      if (this.selectedTab == ''){
        this.setDefaultTab();
      }
    }
  }

  private setDefaultTab() {
    let defaultTab = this.navTabs[0];
    let isBypassAutoTabEvent: boolean = false;
    if (this.forceRedirectionTabName != null && this.forceRedirectionTabName != '') {
      if (this.navTabs?.some(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase() && x.condition)) {
        defaultTab = this.navTabs.filter(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())[0];

        // Redirect to Native Tab
        let param: any = {};
        param.isAdditionalTab = defaultTab.tabLink === "additionalTabs";
        param.isNativeTab = true; // always true
        param.tab = defaultTab;
        this.checkTabCall(param, 1);
      }
      else if (this.navTabsMore?.some(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase() && x.condition)) {
        defaultTab = this.navTabsMore.filter(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())[0];

        // Generate Tab and Redirect to Custom Tab
        let param: any = {};
        param.isAdditionalTab = false;
        param.isNativeTab = true; // always true
        param.tab = defaultTab;
        this.checkTabCall(param, 0);

        //No need to initiate autoTabEventEvent event as it is already initiated in CheckTabCall Function
        isBypassAutoTabEvent = true;
      }
    }
    else {
      // Redirect to first tab in the array which was already sorted by display order
      let param: any = {};
      param.isAdditionalTab = defaultTab.tabLink === "additionalTabs";
      param.isNativeTab = true; // always true
      param.tab = defaultTab;
      this.checkTabCall(param, 1);
    }

    this.selectedTab = defaultTab.tabLink;
    if (!isBypassAutoTabEvent) {
      this._commonHelper.autoTabEventEvent.next(defaultTab);
    }
  }

  //Checking Tab Return call from globle tab
  checkTabCall(paramTab, isNativeTab) {
    this.previousActiveTabIndex = this.currentActiveTabIndex;
    this.isNativeTab = paramTab.isNativeTab;
    this.isAdditionalTab = paramTab.isAdditionalTab;
    if (!isNativeTab) {
      const tabExist = this.navTabs.find(x => x.tabLink === paramTab.tab.tabLink);
      if(this.navTabs.lastIndexOf(paramTab.tab)) {
        paramTab.tab.showButtonActive = true;
      }
      if (!tabExist) {
        this.navTabs.push(paramTab.tab);
      }
      this.currentActiveTabIndex = this.navTabs.findIndex(x => x.tabLink === paramTab.tab.tabLink)
      this.selectedTab = this.navTabs[this.currentActiveTabIndex].tabLink;
      this._commonHelper.autoTabEventEvent.next(paramTab.tab);
    }
    this.currentActiveTabIndex = this.navTabs.findIndex(x => x.tabLink === paramTab.tab.tabLink)
    this.setTab(paramTab);
  }

  //close specific additionalTabs
  closeNavTab(paramTab) {
    let index: any;
    let isSameTab;

    const removeNavtab = this.navTabs.findIndex(e => e.tabLink === paramTab.tab.tabLink);
    if(this.previousActiveTabIndex > removeNavtab)
      this.previousActiveTabIndex--;
    if(removeNavtab > -1) {
      if(removeNavtab === this.navTabs.findIndex(e => e.tabLink === this.activeTab)) {
        isSameTab = true;
        index = this.previousActiveTabIndex;
        this.currentActiveTabIndex = this.previousActiveTabIndex;
      }else {
        index = this.currentActiveTabIndex;
      }
      this.navTabs.splice(removeNavtab, 1);
      paramTab.tab.showButtonActive = false
      if (this.previousActiveTabIndex > this.navTabs.length - 1) {
        this.previousActiveTabIndex = this.navTabs.length - 1;
        if(isSameTab) {
          index = this.previousActiveTabIndex;
        }
      }
    }

    const paramTab1 = this.navTabs[index];
    paramTab1.isAdditionalTab = paramTab1.tabLink === "additionalTabs";
    paramTab1.tab = paramTab1;
    this._commonHelper.autoTabEventEvent.next(paramTab1.tab);
    this.setTab(paramTab1.tab);
  }

  // get tenant setting for tab layou
  private getTabLayoutTenantSetting() {
    return new Promise((resolve, reject) => {
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.ACCOUNT_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
      this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.ACCOUNT_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
        this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.ACCOUNT_TAB_LAYOUT}`, JSON.stringify(response));
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            resolve(this.tabLayout);
          });

      }
      else {
        this.tabLayout = tabLayout;
        resolve(null);
      }
    });
  }
  /**
 * END
 * Additional Tabs Code 
 */
  getWorkflowDetail(entityWorkflowId): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isEntityWorkflow && entityWorkflowId > 0) {
        //storage key
        let storageKey = `${LocalStorageKey.AccountWorkflowDetailsKey}_${entityWorkflowId}`;
        // get data
        const workflowDetail = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
        if (workflowDetail == null) {
          this._commonHelper.showLoader();
          this.isInitialLoading = true;
          this._workflowmanagementService.getWorkflowDetail(entityWorkflowId)
            .then((response: any) => {
              if (response.layoutTypeID == LayoutTypes.ListView) {
                this.isListViewLayout = true;
              } else { this.isListViewLayout = false; }

              this._commonHelper.hideLoader();
              // store in local storage
              this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
              resolve(response);
            }, (error) => {
              this._commonHelper.hideLoader();
              this.isInitialLoading = false;
              this._commonHelper.showToastrError(error.message);
              reject(null);
            });
        }
        else {
          if (workflowDetail && workflowDetail?.layoutTypeID == LayoutTypes.ListView) {
            this.isListViewLayout = true;
          } else { this.isListViewLayout = false; }

          resolve(workflowDetail);
        }
      }
      else {
        resolve(null);
      }
    });
  }

  addWorkTask() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.accountId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.worktaskRecordTypes.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.worktaskWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityWorkTaskPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Accounts;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
      }
    });
  }

  //delete work task - confirmation dialog
  deleteWorkTask(workTask) {
    
    this._commonHelper.showLoader();
    this._workTaskService.isSubWorkTaskExist(workTask.id).then((res: any) => {
      this._commonHelper.hideLoader();

      let hasSubWorkTask: boolean = res?.isExist || false;

      if (hasSubWorkTask) {
        //available Subtask Types
        let worktaskTypeLevel: number = this.entitySubTypes.find(x => x.id == workTask.typeID)?.level ?? 0;
        this.availableSubWorkTaskTypeDetails = this.entitySubTypes.filter(x => x.parentID == workTask.typeID && x.level == worktaskTypeLevel + 1 && this._commonHelper.havePermission(x.listPermissionHash));
        this.availableSubWorkTaskTypeNamesForWorkTaskDelete = this.availableSubWorkTaskTypeDetails?.map(x => x.name).join(" or ")?.trim() ?? null;
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_WORKTASKS.WORKTASKS_SUBWORKTASKEXISTMESSAGEBEFOREPARENTTASKDELETE', { entitySubTypeName: this.availableSubWorkTaskTypeNamesForWorkTaskDelete })
        );
        return false;
      } else {

        //option for confirm dialog settings
        let optionsForConfirmDialog = {
          size: "md",
          centered: false,
          backdrop: 'static',
          keyboard: false
        };

        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_WORKTASKS.MESSAGE_CONFIRM_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? ''}), null, null, optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._workTaskService.deleteWorkTask(workTask.id).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_WORKTASKS.MESSAGE_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' })
                );
                this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                });
            }
          })
          .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_WORKTASKS.WORKTASK_DISMISS_DIALOG')));
      }
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private getWorkflowListForContact() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Contacts}_DetailsPage`;
      this.contactWorkflows = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.contactWorkflows == null) {
        const params = this.prepareParamsWorkflows(Entity.Contacts);
        this.showWorkflowLoader = true;
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.contactWorkflows = response;
            this.contactWorkflows.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.contactWorkflows));
          }
          this.showWorkflowLoader = false;
          resolve(null);
        },
          (error) => {
            this.showWorkflowLoader = false;
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.contactWorkflows = this.contactWorkflows;
        this.showWorkflowLoader = false;
        resolve(null);
      }
    });
  }

  private getWorkflowListForProduct() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Products}_DetailsPage`;
      this.productWorkflows = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.productWorkflows == null) {
        const params = this.prepareParamsWorkflows(Entity.Products);
        this.showWorkflowLoader = true;
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.productWorkflows = response;
            this.productWorkflows.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.productWorkflows));
          }
          this.showWorkflowLoader = false;
          resolve(null);
        },
          (error) => {
            this.showWorkflowLoader = false;
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.productWorkflows = this.productWorkflows;
        this.showWorkflowLoader = false;
        resolve(null);
      }
    });
  }

  refreshChildComponentForOpportunity() {
    this.refreshOpporunityTab = false;
  }

  addOpportunity() {
    this.optionsForPopupDialog.size = "lg";
    this.modalRef = this._modalService.open(OpportunityAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.accountId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.opportunityRecordTypes?.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.opportunityWorkflowList?.filter(s => s.value != 0)?.filter(s => s.parentEntityTypeID == Entity.Accounts || s.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityType = Entity.Accounts;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshOpporunityTab = true;
      }
    });
  }
  
  deleteOpportunity(opporutnityId: number) {
    this.optionsForConfirmDialog.size = 'md'

    this._confirmationDialogService.confirm('OPPORTUNITIES.LIST.MESSAGE_CONFIRM_OPPORTUNITY_DELETE', null, null, this.optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._opportunitiesService.deleteOpportunity(opporutnityId).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_DELETE')
            );
            this.refreshOpporunityTab = true;
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }
      })
      .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.OPPORTUNITY_DISMISS_DIALOG')));
  }

  addCase() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CaseAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.accountId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.casesRecordTypes?.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.casesWorkflowList?.filter(x => x.value != 0)?.filter(x => x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityCasePopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Accounts;
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.refreshCaseTab = true;
      }
    });
  }

  deleteCase(caseId: number) {
    this._commonHelper.showLoader();
    this._casesService.isSubCaseExist(caseId).then((res: any) => {
      this._commonHelper.hideLoader();

      let hasSubCase: boolean = res?.isExist || false;

      if (hasSubCase) {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CASES.CASES_SUBCASEEXISTMESSAGEBEFOREPARENTTASKDELETE')
        );
        return false;
      } else {

        //option for confirm dialog settings
        this.optionsForConfirmDialog.size = 'md';

        this._confirmationDialogService.confirm('CASES.DETAIL.MESSAGE_CONFIRM_CASE_DELETE', null, null, this.optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._casesService.deleteCase(caseId).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('CASES.DETAIL.MESSAGE_CASE_DELETE')
                );
                this.refreshCaseTab = true;
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                });
            }
          })
      }
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  //get Entity Record Type
  private getEntityRecordTypes(): Promise<any> {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    return new Promise((resolve, reject) => {
      const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntityRecordTypes == null) {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
            this.casesRecordTypes = response?.filter(x => x.entityTypeID == Entity.Cases && x.parentEntityTypeID == this.entityTypeId);
            this.contactRecordTypes = response?.filter(x => x.entityTypeID == Entity.Contacts).map(x => ({ 'label': x.name, 'value': x.id }));
            this.productRecordTypes = response?.filter(x => x.entityTypeID == Entity.Products).map(x => ({ 'label': x.name, 'value': x.id }));
            this.opportunityRecordTypes = response?.filter(x => x.entityTypeID == Entity.Opportunities &&(x.parentEntityTypeID == this.entityTypeId));
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
      }
      else {
        this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
        this.casesRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases && x.parentEntityTypeID == this.entityTypeId);
        this.contactRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Contacts).map(x => ({ 'label': x.name, 'value': x.id }));
        this.productRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Products).map(x => ({ 'label': x.name, 'value': x.id }));
        this.opportunityRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Opportunities &&(x.parentEntityTypeID == this.entityTypeId));
        resolve(null);
      }
    });
  }

  private prepareParamsWorkflows(entityTypeId: number): any[] {
    return [
      { name: 'EntityTypeID', type: 'int', value:  entityTypeId}
    ]
  }

  private getWorkflowListForOpportunity() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Opportunities}`;

      this.opportunityWorkflowList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.opportunityWorkflowList == null) {
        const params = this.prepareParamsWorkflows(Entity.Opportunities);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.opportunityWorkflowList = response;
            this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_OPPORTUNITIES.FILTER_OPTION_TEXT_WORKFLOW') });
            this.opportunityWorkflowList.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.opportunityWorkflowList));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
      }
      else {
        this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_OPPORTUNITIES.FILTER_OPTION_TEXT_WORKFLOW') });
        this.opportunityWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
  }

  private getWorkflowListForCase() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Cases}`;

      this.casesWorkflowList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.casesWorkflowList == null) {
        const params = this.prepareParamsWorkflows(Entity.Cases);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.casesWorkflowList = response;
            this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_CASES.FILTER_OPTION_TEXT_WORKFLOW') });
            this.casesWorkflowList.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.casesWorkflowList));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
      }
      else {
        this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_CASES.FILTER_OPTION_TEXT_WORKFLOW') });
        this.casesWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
  }

  private getEntityHiddenField() {
    return new Promise((resolve, reject) => {
      // storage key
      let storageKey = LocalStorageKey.AllEntityHiddenFieldSettings;
      // get data
      let hiddenFieldSettings = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (hiddenFieldSettings == null) {
        this._commonHelper.showLoader();
        this._commonService.getEntityHiddenFields().then((response: any) => {
          if (response) {
            this.entityHiddenFieldSettings = response as [];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.entityHiddenFieldSettings));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          })
      }else {
        this.entityHiddenFieldSettings = hiddenFieldSettings;
        resolve(null);
      }
    });
  }

  private getWorktaskWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.WorkTasks}`;

      this.worktaskWorkflowList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.worktaskWorkflowList == null) {
        const params = this.prepareParamsWorkflows(Entity.WorkTasks);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.worktaskWorkflowList = response;
            this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
            this.worktaskWorkflowList.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.worktaskWorkflowList));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
      }
      else {
        this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
        this.worktaskWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
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

  onAccountStagePauseChanged(account: any, isPaused: boolean) {
    if (!this.isEditAccount) { return; }

    if (account.assignedTo !== this._loggedInUser.userId) {
      let message = "";
      if (account.assignedTo == null || account.assignedTo == "" || account.assignedTo == undefined) {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.accountStagePauseChange(account, isPaused);
          }
        });
    }
    else if (account.assignedTo == this._loggedInUser.userId) {
      this.accountStagePauseChange(account, isPaused);
    }
  }

  accountStagePauseChange(account, isPaused: boolean) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: account.id,
      entityStageId: account.entityStageId,
      isPaused: isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: account.assignedTo,
      noteID: null
    };

    if (params.isPaused) {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = account.id;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.PAUSE_REASON_NOTE_SUBJECT', { stageName: account.stageName }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = account.entityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(noteDate => {
        if (noteDate) {
          params.noteID = noteDate.id;
          this.saveEntityStagePauseTransition(params, account);
        }
      });
    }
    else {
      const noteParam = {
        entityTypeId: this.entityTypeId,
        entityId: account.id,
        entityRecordTypeID: null,
        subject: null,
        isPrivate: false,
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.RESUME_NOTE_DESCRIPTION', { stageName: account.stageName }))}`,
        createdBy: this._loggedInUser.userId
      };

      this._commonHelper.showLoader();
      this._noteService.addNewNote(noteParam).then((response: any) => {
        if (response) {
          params.noteID = response.id;
          this.saveEntityStagePauseTransition(params, account);
        }
        this._commonHelper.hideLoader();
      },
        (error) => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('ACTIVITY.' + error.messageCode.replace('.', '_').toUpperCase())
          );
        });
    }
  }

  saveEntityStagePauseTransition(params, account) {
    this._commonHelper.showLoader();
    this._workflowmanagementService.saveEntityStagePauseTransition(params)
      .then(() => {
        const param = {
          entityTypeId: params.entityTypeId,
          entityId: params.entityId,
          workflowId: params.entityWorkflowId,
          workflowStageId: params.entityStageId,
          stageNoteID: null,
          pauseNoteID: params.isPaused ? params.noteID : null,
          processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.PauseNote
        };

        this._workflowmanagementService.saveEntityWorkflowStageValueNote(param).then(() => {
          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_RESUME_SUCCESS'));
          account.isPaused = params.isPaused;
          this._commonHelper.hideLoader();
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
  }
}