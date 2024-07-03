//ANGULAR
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, UntypedFormArray, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
//COMMON
import { SettingsService } from '../../settings/settings.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { DataSources, Entity, FieldNames, LayoutTypes, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, RefType, SectionCodes, TabLayoutType } from '../../../@core/enum';
import { DynamicTableParameter } from '../../../@core/sharedModels/dynamic-table.model';
import { OpportunityItemsPagingParams } from '../../../@core/sharedModels/paging-params.model';
import { timeFrameValidator } from '../../../@core/sharedValidators/time-frame.validator';
//PIPES
import { TimeFramePipe } from '../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { TimeFrameToMinutesPipe } from '../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
//SERVICES
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { OpportunitiesService } from '../opportunities.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
//COMPONENTS
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { OpportunityitemsAddComponent } from '../opportunityitems-add/opportunityitems-add.component';
//OTHER
import * as moment from 'moment';
import { Table } from 'primeng/table';
import { Dropdown } from 'primeng/dropdown';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { WorktaskAddComponent } from '../../worktasks/worktask-add/worktask-add.component';
import { WorkTasksService } from '../../worktasks/worktasks.service';
import { param } from 'jquery';

@Component({
  selector: 'ngx-opportunity-detail',
  templateUrl: './opportunity-detail.component.html',
  styleUrls: ['./opportunity-detail.component.scss']
})
export class OpportunityDetailComponent implements OnInit, OnDestroy {
  private opportunityTxtNameRef: ElementRef;
  @ViewChild('opportunityTxtName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.opportunityTxtNameRef = content;
    }
  }

  @ViewChild('opportunityItemsDrp', { static: false }) opportunityItemsDrpRef: Dropdown;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild("drpContact", { static: false }) drpContact: Dropdown;
  @ViewChild("drpAccount", { static: false }) drpAccount: Dropdown;

  // subcriptions
  private searchValueChanged: Subject<string> = new Subject<string>();
  private searchBoxSubscription: Subscription;

  entityId: number;
  entityTypeId: number = Entity.Opportunities;
  entityWorkflowId: any = null;
  entityRecordTypeId: number;
  isEntityWorkflow: boolean = false;

  // opportunity Model
  opportunityStages: Array<any> = [];
  currentStage: any;
  isCompleted: boolean = false;
  isClosed: boolean = false;
  selectedStage: any;
  opportunity: any;
  copyOfopportunity: any;
  opportunityDetails: any = {};

  opportunityId: number = 0;
  opportunityName: string;

  formMode: string;

  isListViewLayout: boolean = true;

  opportunityCustomFields: any[] = [];
  formDataJSON: any[] = [];
  selectedTab: string = '';
  // create form
  opportunityDetailForm: FormGroup;
  copyOfopportunityDetailFormValues: any;
  opportunityAssignedTo: any;
  // submitted
  submitted: boolean = false;
  // loader
  isLoaded: boolean = false;

  // permissions
  isEditOpportunity: boolean = false;
  isViewOpportunity: boolean = false;
  isAddSubOpportunity: boolean = false;
  isDeleteSubOpportunity: boolean = false;
  changeOpportunityStage: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  hasPermission: boolean = false;
  isInitialLoading: boolean = true;
  isViewProduct: boolean = false;
  isViewProductSku: boolean = false;
  isViewUser: boolean = false;
  isAddWorkTask: boolean = false;
  isListWorkTask: boolean = false;
  isAllowToReopen: boolean = false;
  isAssignOpportunities: boolean = false;
  isDeleteOpportunity: boolean = false;

  selectedPriceBookId: number;
  priceBooks: any;

  // opportunity items pagination
  opportunityItemsPagingParams: OpportunityItemsPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;
  opportunityItems: any[] = [];

  //opportunity Items edit variables
  opportunityItemsEditable: boolean = false;
  editedRows: any = [];

  onceOpportunityItemsClicked: boolean = false;

  //Opportunity Items
  tblOpportunityItemsParameters: Array<DynamicTableParameter> = [];

  //user detail
  _loggedInUser: any;

  activeTab = '';

  onceLinkedopportunityClicked: boolean = false;
  refreshLinkedopportunitys: boolean = false;
  tblLinkedopportunityParameters: Array<DynamicTableParameter> = [];

  onceSubopportunityClicked: boolean = false;
  onceStageHistoryClicked: boolean = false;
  onceDocumentClicked: boolean = false;

  refreshSubopportunitys: boolean = false;
  tblSubopportunityParameters: Array<DynamicTableParameter> = [];

  tbWorktaskParameters: Array<DynamicTableParameter> = [];


  // flag for details readonly
  isReadOnly: boolean = true;

  refreshCustomFieldJSONGrid: boolean = false;

  fromEntityStageId: any;

  opportunity_validation_messages = {
    'name': [
      { type: 'required', message: 'OPPORTUNITIES.DETAIL.DETAILS_TAB.NAME_REQUIRED' },
      { type: 'maxlength', message: 'OPPORTUNITIES.DETAIL.DETAILS_TAB.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'OPPORTUNITIES.DETAIL.DETAILS_TAB.MESSAGE_NAME_MIN' }
    ],
    'description': [
      { type: 'minlength', message: 'OPPORTUNITIES.DETAIL.DETAILS_TAB.MESSAGE_DESCRIPTION_MIN' },
      { type: 'maxlength', message: 'OPPORTUNITIES.DETAIL.DETAILS_TAB.MESSAGE_DESCRIPTION_MAX' },
    ],
    'entityID': [
      { type: 'required', message: 'OPPORTUNITIES.DETAIL.DETAILS_TAB.RELATED_TO_REQUIRED' }
    ],
    'ownerID': [
      { type: 'required', message: 'OPPORTUNITIES.DETAIL.DETAILS_TAB.OWNER_REQUIRED' }
    ],
    "confidenceLevel": [
      { type: 'min', message: 'OPPORTUNITIES.DETAIL.DETAILS_TAB.MESSAGE_CONFIDENCELEVEL_MIN' },
      { type: 'max', message: 'OPPORTUNITIES.DETAIL.DETAILS_TAB.MESSAGE_CONFIDENCELEVEL_MAX' }
    ],
    "totalAmount": [
      { type: "maxlength", message: "OPPORTUNITIES.DETAIL.DETAILS_TAB.MESSAGE_AMOUNT_MAX" }
    ],
    'entityStageId': [{ type: 'required', message: 'OPPORTUNITIES.DETAIL.DETAILS_TAB.STATUS_REQUIRED' }]
  };

  opportunityItemCols = [
    { field: 'productName', header: 'OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.TABLE_HEADER_PRODUCTNAME', sort: true },
    { field: 'productSkuName', header: 'OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.TABLE_HEADER_PRODUCTSKUNAME', sort: true },
    { field: 'productSku', header: 'OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.TABLE_HEADER_PRODUCTSKU', sort: true },
    { field: 'quantity', header: 'OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.TABLE_HEADER_QUANTITY', sort: true, class: "text-right pr-5" },
    { field: 'uomName', header: 'OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.TABLE_HEADER_UOM', sort: true },
    { field: 'price', header: 'OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.TABLE_HEADER_PRICE', sort: true, class: "text-right pr-5" },
    { field: 'status', header: 'OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.TABLE_HEADER_STATUS', sort: true, class: "status" },
    { field: 'id', header: '', sort: false, class: "icon--dropdown action" }
  ];


  //Total Time
  totalSpentTime: any = null;
  totalEffectiveTime: any = null;
  totalPauseTime: any;

  estimatedMins: any;
  estimatedPoints: any;
  currentStageTask: any;
  oldStageId: number;
  oldStageTask: any;

  // assigned users
  assignedToUsers: any;
  priorityList: any;
  severityList: any;
  owners: any;
  approvers: any;
  completedByUsers: any;

  //Related to
  relatedToList: any = null; //related to entity records
  isShowRelatedTo: boolean = true;
  possibleEntityTypeIdsForRelatedTo: any = null;
  isRelatedToGroupDropDown: boolean = true;
  selectedRelatedToEntityTypeID = null;

  recordTypes: any;

  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  refreshCustomFieldDatasource: boolean = false;

  tinyMceApiKey: string = '';
  currentDate = new Date();
  public getCurrentDate() {
    return this.currentDate;
  }
  currentYearRange: string = this.currentDate.getFullYear().toString() + ":" + this._commonHelper.globalMaxDate.getFullYear().toString();

  entityStagesWithTasksStorageKey: string = LocalStorageKey.OpportunityEntityStageWithTasksKey;

  //datasource
  currencySymbol: any = null;
  leadSources: any;
  hoursInDay: number = null;

  //For Model Ref
  modalRef: NgbModalRef | null;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //navTabs
  navTabs: any[] = [];
  navTabsAll: any = [];
  navTabsMore: any = [];
  nativeTabDetails: any = [];
  isAdditionalTab: boolean = false;
  nativeTabCount: number = 0;
  isNativeTab: boolean = true;
  tabLayout: string = 'Default';
  currentActiveTabIndex: number = 0;
  previousActiveTabIndex: number = 0;
  forceRedirectionTabName: string = '';

  //Assigned To Loader
  showAssignedToLoader: boolean;
  isForceReloadAssignedTo: boolean = true;

  //Priority Loader
  showPriorityLoader: boolean;
  isForceReloadPriority: boolean = true;

  //Severity Loader
  showSeverityLoader: boolean;
  isForceReloadSeverity: boolean = true;

  //Owner Loader
  showOwnerLoader: boolean;
  isForceOwnerLoader: boolean = true;

  //Approver Loader
  showApproverLoader: boolean;
  isForceApproverLoader: boolean = true;

  //CompletedBy Loader
  showCompletedByLoader: boolean;
  isForceCompletedByLoader: boolean = true;

  //Related To Loader
  showRelatedToLoader: boolean = false;
  isForceReloadRelatedTo: boolean = true;

  //Contacts
  showContactLoader: boolean = false;
  isForceReloadContact: boolean = true;

  //Accounts
  showAccountLoader: boolean;
  isForceReloadAccount: boolean = true;

  isShowOpportunityItemsLoader: boolean;
  isShowLoaderForPriceBook: boolean;
  relatedToName: string;
  relatedToNamePlaceholder: string;
  relatedToNameForHeader: string;
  contactNameForHeader:string;
  accountNameForHeader: string;
  relatedToIcon: string;
  relatedToIconToolTip: string;
  accountIcon: string;
  contactIcon: string;

  // worktask tab
  refreshWorkTaskTab: boolean = false;
  onceWorkTaskClicked: boolean = false;
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  entitySubTypes: any = [];
  workTaskSubTypeDetails: any;
  availableSubWorkTaskTypeDetails: any;
  availableSubWorkTaskTypeNamesForWorkTaskDelete: any;

  entityHiddenFieldSettings: any;
  sectionCodeName = SectionCodes;
  fieldName = FieldNames;

  countries: any;
  refreshDocument: boolean = false;

  accountTypeList: any = null; 
  customerContactList: any[] = []; 
  
  accountTypePlaceholder = 'OPPORTUNITIES.ADD_DIALOG.ACCOUNT_PLACEHOLDER';
  ContactPlaceholder = 'ORDERS.ADD_DIALOG.CONTACT_PLACEHOLDER';

  constructor(private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _opportunitiesService: OpportunitiesService,
    private _formBuilder: FormBuilder,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _commonService: CommonService,
    private _location: Location,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _workTaskService: WorkTasksService) {
    // initiate Permissions
    this.isEditOpportunity = this._commonHelper.havePermission(enumPermissions.EditOpportunity);
    this.isViewOpportunity = this._commonHelper.havePermission(enumPermissions.ViewOpportunity);
    this.isAddSubOpportunity = this._commonHelper.havePermission(enumPermissions.AddOpportunity);
    this.isDeleteSubOpportunity = this._commonHelper.havePermission(enumPermissions.DeleteOpportunity);
    this.changeOpportunityStage = this._commonHelper.havePermission(enumPermissions.ChangeOpportunityStage);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadOpportunityDocument);
    this.isViewProduct = this._commonHelper.havePermission(enumPermissions.ViewProduct);
    this.isViewProductSku = this._commonHelper.havePermission(enumPermissions.ViewProductSku);
    this.isViewUser = this._commonHelper.havePermission(enumPermissions.ViewUser);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isListWorkTask = this._commonHelper.havePermission(enumPermissions.ListWorkTasks);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);
    this.isAssignOpportunities = this._commonHelper.havePermission(enumPermissions.AssignOpportunity);
    this.hasPermission = this.isEditOpportunity || this.isViewOpportunity;
    this.isDeleteOpportunity = this._commonHelper.havePermission(enumPermissions.DeleteOpportunity);

    this.tinyMceApiKey = this._commonHelper.globalTinymceApiKey;

    //Allows to reload same component while navigation
    this._router.routeReuseStrategy.shouldReuseRoute = function () { return false; };

    this.readRouteParameter();
    this.initializePagination();

    Promise.all([
      this.getTabLayoutTenantSetting(),
    ]).then(() => {
      this.setTabLayout();
    });
  }

  ngOnInit(): void {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    this.setLinkedopportunityTabParameters();
    this.setSubopportunityTabParameters();
    this.setOpportunityItemsTabParameters();
    this.setWorkTaskTabParameters();
    if (this.hasPermission) {
      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getWorktaskWorkflowList(),
        this.getEntityRecordTypes(),
        this.getEntitySubTypes(),
        this.getEntityHiddenField(),
        this.getCountries()
      ]).then(() => {
        this.getopportunityCustomFields();
        this.subscribeSearchBoxEvent();
      });

      // add or edit
      if (this.opportunityId > 0) {
        this.formMode = 'EDIT';
      } else {
        this.formMode = 'ADD';
        this.opportunity = {};
      }
    }
  }

  ngOnDestroy(): void {
    if (this.searchBoxSubscription) {
      this.searchBoxSubscription.unsubscribe();
    }
  }

  private readRouteParameter(): void {
    // If Record Edit then set record edit id
    this._activeRoute.params.subscribe(param => {
      if (param['id'] !== undefined) {
        if (param['id'] !== null) {
          this.opportunityId = param['id'];
          this.entityId = this.opportunityId;
        }
      }

      if (param['wf'] !== undefined) {
        if (param['wf'] != null) {
          this.entityWorkflowId = param['wf'];
          this.isEntityWorkflow = true;
        }
        else {
          this.isEntityWorkflow = false;
        }
      }
      else {
        this.isEntityWorkflow = false;
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

  // get assigned users
  getAssignedToUsers(includeAllUsers = 1, searchString = null) {
    this.showAssignedToLoader = true;
    // DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    let assignedToId = this.opportunityDetails.assignedTo; // owner 1 is assigned to
    let opportunityStageId = this.opportunityDetails.entityStageId;
    // get datasource details
    var params = this.prepareParamsForAssignedToUsers(opportunityStageId, assignedToId, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYASSIGNEDTO, params).then(response => {
      this.assignedToUsers = response;
      this.showAssignedToLoader = false;
      this.isForceReloadAssignedTo = !searchString ? false : true;
    },
      (error) => {
        this.showAssignedToLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  // get owners
  getOwners(includeAllUsers = 1, searchString = null) {
    this.showOwnerLoader = true;
    // prepare params
    let ownerId = this.opportunityDetails.ownerID;

    // get datasource details
    const params = this.prepareParamsForOwners(ownerId, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYOWNERS, params).then(response => {
      this.owners = response;
      this.showOwnerLoader = false;
      this.isForceOwnerLoader = !searchString ? false : true;
    },
      (error) => {
        this.showOwnerLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  // get approvers
  getApprovers(includeAllUsers = 1, searchString = null) {
    this.showApproverLoader = true;
    // prepare params
    let approverId = this.opportunityDetails.approvedBy;
    // get datasource details
    const params = this.prepareParamsForApprovers(approverId, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYAPPROVERS, params).then(response => {
      this.approvers = response;
      this.showApproverLoader = false;
      this.isForceApproverLoader = !searchString ? false : true;
    },
      (error) => {
        this.showApproverLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }
  // get completedbyUsers
  getCompletedByUsers(includeAllUsers = 1, searchString = null) {
    this.showCompletedByLoader = true;
    // prepare params
    let completedByUserId = this.opportunityDetails.completedBy;
    // get datasource details
    const params = this.prepareParamsForCompletedByUsers(completedByUserId, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYCOMPLETEDBYUSERS, params).then(response => {
      this.completedByUsers = response;
      this.showCompletedByLoader = false;
      this.isForceCompletedByLoader = !searchString ? false : true;
    },
      (error) => {
        this.showCompletedByLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
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
            this.isInitialLoading = true;
            this.leadSources = response;
            resolve(null);
          }, (error) => {
            this._commonHelper.hideLoader();
            this.isInitialLoading = false;
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


  // get priority
  getPriority() {
    this.showPriorityLoader = true;
    // get datasource details
    this._dataSourceService.getDataSourceDataByCode(DataSources.PRIORITY).then(response => {
      this.priorityList = response;
      this.showPriorityLoader = false;
      this.isForceReloadPriority = false;
    },
      (error) => {
        this.showPriorityLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  // get severity
  getSeverity() {
    this.showSeverityLoader = true;
    // get datasource details
    this._dataSourceService.getDataSourceDataByCode(DataSources.SEVERITY).then(response => {
      this.severityList = response;
      this.showSeverityLoader = false;
      this.isForceReloadSeverity = false;
    },
      (error) => {
        this.showSeverityLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  private getHoursInDay() {
    const hrsInDay = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY));
    if (hrsInDay == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.HOURS_IN_DAY).then((response: any) => {
          this.hoursInDay = (response != null && !isNaN(Number(response))) ? Number(response) : 24;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY, JSON.stringify(this.hoursInDay));
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
      this.hoursInDay = hrsInDay;
    }
  }

  private getNativeTabDetailsByEntityTypeId() {
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_Opportunities));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_Opportunities, JSON.stringify(response));
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
  ownerOnFilter(e) {
    this.getOwners(0, e.filter);
  }

  ownerOnChange(e) {
    if (!e.value) {
      this.getOwners(1, null);
    }
  }

  assignedToOnFilter(e) {
    this.getAssignedToUsers(0, e.filter);
  }

  assignedToOnChange(e) {
    if (!e.value) {
      this.getAssignedToUsers(1, null);
    }
  }
  approvedByOnFilter(e) {
    this.getApprovers(0, e.filter);
  }

  approvedByOnChange(e) {
    if (!e.value) {
      this.getApprovers(1, null);
    }
  }

  completedByOnFilter(e) {
    this.getCompletedByUsers(0, e.filter);
  }

  completedByOnChange(e) {
    if (!e.value) {
      this.getCompletedByUsers(1, null);
    }
  }

  //DD 20220330 SDC-188: datasources with workflow id and other information
  // prepare params for datasource with required fields
  private prepareParamsForAssignedToUsers(stageId, assignedTo, IncludeAllUsers = 1, searchString = '') {
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
      value: IncludeAllUsers
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

  prepareParamsForOwners(ownerId, includeAllUsers, searchString) {
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
      value: includeAllUsers,
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem2);

    return params;
  }
  prepareParamsForApprovers(approverId, includeAllUsers, searchString) {
    const params = [];
    const paramItem = {
      name: 'SelectedUserID',
      type: 'int',
      value: approverId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'IncludeAllUsers',
      type: 'bit',
      value: includeAllUsers,
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem2);

    return params;
  }
  prepareParamsForCompletedByUsers(completedByUserId, includeAllUsers, searchString) {
    const params = [];
    const paramItem = {
      name: 'SelectedUserID',
      type: 'int',
      value: completedByUserId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'IncludeAllUsers',
      type: 'bit',
      value: includeAllUsers,
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem2);

    return params;
  }

  // get custom fields
  getopportunityCustomFields() {
    this._commonHelper.showLoader();
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: this.entityId
    }
    this._opportunitiesService.getOpportunityCustomFields(params).then((res: any) => {
      if (res) {
        this.opportunityCustomFields = res || [];
        this.prepareFormDataInJSON();
        this.getopportunityDetails();
      }
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(error.message);
      });
  }

  // prepare form data in JSON format
  private prepareFormDataInJSON(): void {
    this.opportunityCustomFields.forEach((customField: any) => {
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

  // add custom field controls to the form
  prepareFormCustomFields() {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.opportunity.customFieldJSONData[control.fieldName] != null && this.opportunity.customFieldJSONData[control.fieldName] != '') {
              this.opportunity.customFieldJSONData[control.fieldName] = moment(new Date(this.opportunity.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.opportunityDetailForm.addControl(control.fieldName, new FormControl(this.opportunity.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.opportunityDetailForm.addControl(control.fieldName, new FormControl(this.opportunity.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.opportunity.customFieldJSONData[control.fieldName] != null && this.opportunity.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.opportunity.customFieldJSONData[control.fieldName] === 'string') {
                this.opportunity.customFieldJSONData[control.fieldName] = JSON.parse(this.opportunity.customFieldJSONData[control.fieldName]);
              }
            } else {
              this.opportunity.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.opportunity.customFieldJSONData[control.fieldName] != null && this.opportunity.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.opportunity.customFieldJSONData[control.fieldName];
              this.opportunity.customFieldJSONData[control.fieldName] = this.opportunity.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON['isRequired']) {
                this.opportunityDetailForm.addControl(control.fieldName, new FormControl(this.opportunity.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.opportunityDetailForm.addControl(control.fieldName, new FormControl(this.opportunity.customFieldJSONData[control.fieldName]));
              }
              this.opportunity.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.opportunityDetailForm.addControl(control.fieldName, new FormControl(this.opportunity.customFieldJSONData[control.fieldName]));
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
                  this.opportunityDetailForm.controls[control.fieldName].setValidators(validatorFn);
                  this.opportunityDetailForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.opportunity.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.opportunity.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.opportunityDetailForm.addControl(control.fieldName, new UntypedFormControl(this.opportunity.customFieldJSONData[control.fieldName]));
              this.opportunityDetailForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.opportunityDetailForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.opportunityDetailForm.addControl(control.fieldName, new UntypedFormControl(this.opportunity.customFieldJSONData[control.fieldName]));
              this.opportunityDetailForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.opportunityDetailForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.opportunityDetailForm.addControl(control.fieldName, new UntypedFormControl(this.opportunity.customFieldJSONData[control.fieldName], Validators.email));
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
              this.opportunityDetailForm.controls[control.fieldName].setValidators(validatorFn);
              this.opportunityDetailForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.opportunityDetailForm.addControl(control.fieldName, new UntypedFormControl(this.opportunity.customFieldJSONData[control.fieldName]));
            if (this.opportunity.customFieldJSONData[control.fieldName] != null && this.opportunity.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.opportunity.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.opportunityDetailForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") });
              }
            } else {
              this.opportunityDetailForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.opportunityDetailForm.addControl(control.fieldName, new FormControl(this.opportunity.customFieldJSONData[control.fieldName]));
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
                this.opportunityDetailForm.controls[control.fieldName].setValidators(validatorFn);
                this.opportunityDetailForm.controls[control.fieldName].updateValueAndValidity();
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
      { tabName: '', tabLink: 'navOpportunityItems', isFirst: false, condition: true, displayOrder: 201 },
      { tabName: '', tabLink: 'navHistory', isFirst: false, condition: true, displayOrder: 301 },
      { tabName: '', tabLink: 'navWorkTasks', isFirst: false, condition: this.isListWorkTask, displayOrder: 401 },
      { tabName: '', tabLink: 'navDocuments', isFirst: false, condition: true, displayOrder: 501 }
    ];

    this.setNativeTabDetails();

    this.navTabsAll.forEach((f) => {
      (f.isNativeTab = true), (f.isTabAlwaysVisible = false), (f.showCloseTabIconBtn = false), (f.showButtonActive = false)
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
        isNativeTab: false,
        isTabAlwaysVisible: tab.isTabAlwaysVisible,
        showCloseTabIconBtn: true,
        showButtonActive: false
      }

      this.navTabsAll.push(objNavTab);
    });

    this.navTabsAll = this.navTabsAll.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
    this.setTabLayout();
  }

  customfieldMultiSelectChange(event, fieldName) {
    const stringValue = event.value.toString()
    this.opportunity.customFieldJSONData[fieldName] = stringValue != '' ? stringValue : null;
  }

  //add action answers to form JSON
  addControlToFormJSON(name, dataObject) {
    this.addOrUpdateFormJSON(name, dataObject);
  }

  // add question answer to JSON which is global for form - question/answer in array
  addOrUpdateFormJSON(name, dataObject) {
    let obj = this.formDataJSON.find(item => item[name]);
    if (obj) {
      obj[name] = dataObject[name];
    } else {
      this.formDataJSON.push(dataObject);
    }
  }

  //get value from the JSON
  getValueFromJSON(name: string) {
    return this.formDataJSON.find(item => item.tabName == name);
  }

  getopportunityDetails() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this.isInitialLoading = true;

      this._opportunitiesService.getOpportunityById(this.opportunityId, this.entityWorkflowId).then((response: any) => {
        if (response) {
          this.opportunity = response;
          this.setOpportunityDetails(response || {});
          if (!this.isEntityWorkflow) {
            if (+this.opportunity?.entityWorkflowID > 0) {
              this.isEntityWorkflow = true;
              this.entityWorkflowId = +this.opportunity?.entityWorkflowID;
              this.entityStagesWithTasksStorageKey = `${this.entityStagesWithTasksStorageKey}_${this.entityWorkflowId}`;
            }
          }

          // const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.opportunity.entityTypeID);
          // if (foundRecord) {
          //   this.relatedToName = foundRecord?.['displayName'].toString().trim();
          //   this.relatedToNamePlaceholder = (this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.DETAILS_TAB.RELATED_TO_PLACEHOLDER', { entityName: foundRecord?.['displayName'].toString().trim() }));
          //   this.relatedToNameForHeader = foundRecord?.['displayName'].toString().trim();
          //   this.relatedToIcon = this._commonHelper.getEntityIconClass(this.opportunity.entityTypeID);
          //   this.relatedToIconToolTip = foundRecord?.['displayName'].toString().trim();

          // }
          // else {
          //   this.relatedToName = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.DETAILS_TAB.RELATED_TO');
          //   this.relatedToNamePlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.DETAILS_TAB.RELATED_TO_PLACEHOLDER', { entityName: this.relatedToName }).replace('(', '').replace(')', '').trim();
          //   this.relatedToNameForHeader = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.ENTITY_NAME_LABEL');
          // }
          this.accountIcon = this._commonHelper.getEntityIconClass(Entity.Accounts);
          this.contactIcon = this._commonHelper.getEntityIconClass(Entity.Contacts);
          this.accountNameForHeader = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.ACCOUNT_NAME_LABEL');
          this.contactNameForHeader = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.CONTACT_NAME_LABEL');

          //custom fields
          this.opportunity.customFieldJSONData = this._commonHelper.tryParseJson(this.opportunity.customFieldJSONData);
          // work task details
          this.opportunityDetails = this.opportunity;
          this.selectedPriceBookId = this.opportunity.priceBookID;
          this.opportunityDetails.totalAmount = this.opportunityDetails.totalAmount == null ? 0 : this.opportunityDetails.totalAmount;
          this.opportunityDetails.estimatedMins = new TimeFramePipe().transform(this.opportunityDetails.estimatedMins, this.hoursInDay);
          this.opportunityName = this.opportunity?.name;
          this.opportunityDetails.dueDate = this.opportunityDetails.dueDate != null ? moment(new Date(this.opportunityDetails.dueDate)).toDate() : this.opportunityDetails.dueDate;
          // record type
          this.entityRecordTypeId = this.opportunityDetails.entityRecordTypeID;
          // related entityType
          this.selectedRelatedToEntityTypeID = this.opportunityDetails.entityTypeID;
          this.getRelatedToEntityTypesOrHide();
          // copy detail
          this.copyOfopportunity = this._commonHelper.deepClone(this.opportunityDetails);
          this.fromEntityStageId = this.opportunity.entityStageId;

          this.workTaskSubTypeDetails = this.entitySubTypes.find(x => x.level == 1);

          this.getLeadSources();
          //opportunity form
          this.opportunityDetailForm = this.createopportunityDetailForm();

          if (this.isEntityWorkflow && this.entityWorkflowId > 0) {
            this.getWorkflowDetail(this.entityWorkflowId);
          }

          this.getEntityStagesWithTask()

          this.getEntityTotalReportingTime();
          this.prepareFormCustomFields();
          if (this.opportunity.entityWorkflowID) {
            this.opportunityDetailForm.addControl('entityStageId', new FormControl(this.opportunity.entityStageId ?? null, Validators.required));
          }
          this.setDefaultNavTabs();
          this.prepareTabsWithOrder();
          this.copyOfopportunityDetailFormValues = this.opportunityDetailForm.value;
          this.refreshCustomFieldJSONGrid = true;
          setTimeout(() => { this.refreshCustomFieldJSONGrid = false; }, 50);
        }
        this._commonHelper.hideLoader();
        this.isInitialLoading = false;
        this.isLoaded = true;
        resolve(null);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.isInitialLoading = false;
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  bindDropdown() {
    if (this.isForceReloadAssignedTo) this.getAssignedToUsers(1, '');
    if (this.isForceOwnerLoader) this.getOwners(1, '');
    if (this.isForceApproverLoader) this.getApprovers(1, '');
    if (this.isForceCompletedByLoader) this.getCompletedByUsers(1, '');
    if (this.isForceReloadPriority) this.getPriority();
    if (this.isForceReloadSeverity) this.getSeverity();
    if (this.isForceReloadAccount) this.getAccountList('');
    if (this.isForceReloadContact) this.getContactCustomerList('');
    if (this.isForceReloadRelatedTo && this.isShowRelatedTo) this.getRelatedTo('');
    this.possibleEntityTypeIdsForRelatedTo = null;
  }
  // get work tasks by stage
  getEntityStagesWithTask() {
    return new Promise((resolve, reject) => {
      const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
      if (entityStagesWithTasks != null) {
        this.opportunityStages = entityStagesWithTasks;
        this.getEntityStagesWithTaskAfterReset();
        resolve(null);
      } else {
        if ((+this.entityWorkflowId || 0) > 0) {
          this._commonHelper.showLoader();
          this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId)
            .then((response: any[]) => {
              this.opportunityStages = this._commonHelper.tryParseJson(JSON.stringify(response || []));
              // stage tasks
              this.opportunityStages.forEach(stageElement => {
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
              // store in local storage
              this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.opportunityStages));
              this.getEntityStagesWithTaskAfterReset();
              this._commonHelper.hideLoader();
              resolve(null);
            }, (error) => {
              this._commonHelper.hideLoader();
              this._commonHelper.showToastrError(error.message);
              reject(null);
            }
            );
        }
      }
    });
  }

  getEntityStagesWithTaskAfterReset() {
    // get current stage 
    this.currentStage = this.opportunityStages.find(f => this.opportunity && this.opportunity.entityStageId === f.id) || this.opportunityStages.find(f => f.isDefault);
    if (this.currentStage != undefined) {
      this.isCompleted = this.currentStage.isCompleted;
      this.isClosed = this.currentStage.isClosed;
      if (this.isCompleted || this.isClosed) {
        this.isReadOnly = true;
      }
    }
    //set selected stage for mobile view
    this.selectedStage = this.currentStage;

    // get current stage tasks
    this.currentStageTask = this.opportunityStages.length > 0 ? this.opportunityStages.find(s => s.id == this.opportunityDetails.entityStageId)?.stageTasks ?? null : '';
    if (this.opportunityDetails.selectedStageTaskIds != null && this.opportunityDetails.selectedStageTaskIds != "") {
      const taskIds: Array<number> = this.opportunityDetails.selectedStageTaskIds
        ? this.opportunityDetails.selectedStageTaskIds.split(",").map(m => Number(m))
        : [];
      // map and get only ID and Name
      this.opportunityDetails.selectedStageTaskIds = (this.currentStage.stageTasks || []).filter(f => taskIds.includes(f.id)) || [];
      this.oldStageTask = this._commonHelper.tryParseJson(JSON.stringify(this.opportunityDetails.selectedStageTaskIds));
    }
  }
  setOpportunityDetails(response: any): void {
    this.opportunity.totalAmount = (this.opportunity.totalAmount == null || this.opportunity.totalAmount == undefined) ? null : this.opportunity.totalAmount.toString();
  }
  // convenience getter for easy access to form fields
  get opportunityfrm() { return this.opportunityDetailForm.controls; }
  //create opportunity form
  createopportunityDetailForm(): FormGroup {
    return this._formBuilder.group({
      id: [this.opportunityId],
      name: [this.opportunityDetails.name, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(500)])],
      description: [this.opportunityDetails.description, Validators.compose([Validators.minLength(2), Validators.maxLength(5000)])],
      selectedStageTaskIds: [this.opportunityDetails.selectedStageTaskIds],
      assignedTo: [this.opportunityDetails.assignedTo],
      //entityID: [this.opportunityDetails.entityID, Validators.required],
      priority: [this.opportunityDetails.priority],
      severity: [this.opportunityDetails.severity],
      dueDate: [this.opportunityDetails.dueDate != null ? moment(new Date(this.opportunityDetails.dueDate)).toDate() : null],
      ownerID: [this.opportunityDetails.ownerID, Validators.required],
      approvedBy: [this.opportunityDetails.approvedBy],
      completedBy: [this.opportunityDetails.completedBy],
      totalAmount: [this.opportunityDetails.totalAmount, Validators.maxLength(18)],
      leadSourceId: [this.opportunityDetails.leadSourceID],
      confidenceLevel: [this.opportunityDetails.confidenceLevel, Validators.compose([Validators.max(100), Validators.min(0)])],
      isPrivate: [this.opportunityDetails.isPrivate],
      accountID: [this.opportunityDetails.accountID],
      contactID: [this.opportunityDetails.contactID]
    });
  }

  //show hide detail tab with save
  showHideDetailTab(frmMode) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.opportunityDetailForm.invalid) {
        this.validateAllFormFields(this.opportunityDetailForm);
        this.navigateToTabByValidation();
        return;
      }
      
      let dropEntityStageDetail = this.opportunityStages.find(s => s.id == this.opportunityDetails.entityStageId);
      if (dropEntityStageDetail != null && dropEntityStageDetail.isCompleted) {
        this.isOpportunityEligibleToDone(this.entityId).then((res) => {
          if (res) {
            this.refreshActivity = true;
            Promise.all([
              this.saveData()
            ]).then(() => {
              this.isReadOnly = true;
              this.submitted = false;
              this.isForceReloadRelatedTo = true;
            })
          } else {
            return false;
          }
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
      } else {
        this.refreshActivity = true;
        Promise.all([
          this.saveData()
        ]).then(() => {
          this.isReadOnly = true;
          this.submitted = false;
          this.isForceReloadRelatedTo = true;
        })
      }
      
    }
    else if (frmMode === 'CANCEL') {
      this.opportunityDetails = this._commonHelper.deepClone(this.copyOfopportunity);

      if (this.opportunityDetails.customFieldJSONData && this.opportunityDetails.customFieldJSONData !== null && this.opportunityDetails.customFieldJSONData !== '' && this.opportunityDetails.customFieldJSONData !== undefined) {
        this.opportunityCustomFields.forEach((field: any) => {
          if (field.fieldType == 'Date') {
            if (this.opportunityDetails.customFieldJSONData[field.fieldName] && this.opportunityDetails.customFieldJSONData[field.fieldName] != null && this.opportunityDetails.customFieldJSONData[field.fieldName] != '' && this.opportunityDetails.customFieldJSONData[field.fieldName] != undefined) {
              this.opportunityDetails.customFieldJSONData[field.fieldName] = moment(new Date(this.opportunityDetails.customFieldJSONData[field.fieldName])).toDate();
            }
          } else if (field.fieldType == 'JSON Grid') {
            if (this.opportunityDetails.customFieldJSONData[field.fieldName] && this.opportunityDetails.customFieldJSONData[field.fieldName] != null && this.opportunityDetails.customFieldJSONData[field.fieldName] != '' && this.opportunityDetails.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.opportunityDetails.customFieldJSONData[field.fieldName] === 'string') {
                this.opportunityDetails.customFieldJSONData[field.fieldName] = JSON.parse(this.opportunityDetails.customFieldJSONData[field.fieldName]);
              }
            } else {
              this.opportunityDetailForm.removeControl(field.fieldName)
            }
          } else if (String(field.fieldType).toLowerCase() === 'duration') {
            if (typeof this.opportunityDetails.customFieldJSONData[field.fieldName] === 'number' || this.opportunityDetails.customFieldJSONData[field.fieldName] == null) {
              this.opportunityDetails.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.opportunityDetails.customFieldJSONData[field.fieldName], this.hoursInDay);
            }
          }
        })
      }

      this.opportunityDetailForm.reset(this.copyOfopportunityDetailFormValues);
      this.refreshJSONGridData()
      this.getEntityStagesWithTaskAfterReset();
      this.isReadOnly = !this.isReadOnly;
      this.submitted = false
    }
    else if (frmMode === 'EDIT' && this.isReadOnly == true) {
      this.bindDropdown();
      setTimeout(() => { this.opportunityTxtNameRef.nativeElement.focus(); });
      this.isReadOnly = !this.isReadOnly;
      this.submitted = false
    }
  }

  refreshJSONGridData() {
    this.refreshCustomFieldJSONGrid = true;
    setTimeout(() => {
      this.refreshCustomFieldJSONGrid = false;
    }, 50);
  }

  //save data
  saveData() {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.opportunity.customFieldJSONData) {
        this.opportunityCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.opportunity.customFieldJSONData[field.fieldName] && this.opportunity.customFieldJSONData[field.fieldName] != null && this.opportunity.customFieldJSONData[field.fieldName] != '') {
              this.opportunity.customFieldJSONData[field.fieldName] = moment(this.opportunity.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.opportunityDetailForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.opportunity.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.opportunity.customFieldJSONData[field.fieldName] = null;
            }
          } else if (field.fieldType == 'Phone') {
            const phoneControlValue = this.opportunityDetailForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.opportunityDetails.customFieldJSONData[field.fieldName] = data;
            } else {
              this.opportunityDetails.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }
      this.opportunityDetails.dueDate = this.opportunityDetails.dueDate != null ? moment(this.opportunityDetails.dueDate).format('YYYY-MM-DD') : this.opportunityDetails.dueDate;
      this.opportunityDetails.entityTypeID = this.selectedRelatedToEntityTypeID;
      //copy of leads detail
      let params = this._commonHelper.deepClone(this.opportunityDetails);

      this.opportunityCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.opportunityDetailForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = new TimeFrameToMinutesPipe().transform(formArrayValues, this.hoursInDay);
        }
      });

      //set selectedStageTaskIDs
      if (params.selectedStageTaskIds != null) {
        if (Array.isArray(params.selectedStageTaskIds)) {
          params.selectedStageTaskIds = params.selectedStageTaskIds.map(task => task.id).toString()
        }
      } else {
        params.selectedStageTaskIds = '';
      }

      params.fromEntityStageId = this.fromEntityStageId;

      // set entity workflow
      params.entityWorkflowId = this.entityWorkflowId;
      // save
      this._opportunitiesService.saveOpportunity(params).then((response: any) => {
        // get details
        this.getopportunityDetails().then(() => {
          this.refreshCustomFieldDatasource = true;
          setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          resolve(null)
        });

        if (this.isEntityWorkflow) {
          this.setRefreshStageHistory();
        }

        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.MESSAGE_OPPORTUNITY_UPDATED'));
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error.messageCode.toLowerCase() !== 'staticmessage') {
          this.getopportunityDetails().then(() => {
            this.refreshCustomFieldDatasource = true;
            setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          });
          resolve(null)
        } else {
          reject(null)
        }
        reject(null)
      });
    })
  }

  // form validation
  validateAllFormFields(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      }
      else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      } else if (control instanceof UntypedFormArray) {
        control?.controls?.forEach((i: UntypedFormGroup) => {
          this.validateAllFormFields(i);
        })
      }
    });
  }

  private canUserChangeStage(currentStage, opportunity): boolean {
    if (currentStage == null || opportunity == null) {
      return true;
    }

    let canUserMoveTask: boolean = false;
    if (currentStage.transitionAssociates != null && currentStage.transitionAssociates != '') {
      const associates = currentStage.transitionAssociates.trim().split(',');
      associates.forEach(associate => {
        const associatePropertyName = this._commonHelper.convertToCamalize(associate);
        canUserMoveTask = canUserMoveTask || (opportunity.hasOwnProperty(associatePropertyName) ? (opportunity[associatePropertyName] == this._loggedInUser.userId) : false);
      });
    }
    else {
      canUserMoveTask = true;
    }
    return canUserMoveTask
  }

  onReopenStage() {
    if (!this.isAllowToReopen) {
      return;
    }

    if (this.isCompleted || this.isClosed) {
      //get default stage details
      const dropEntityStageDetail: any = this.opportunityStages?.find(s => s.isDefault);
      this.onMarkStageAsComplete(dropEntityStageDetail?.id, true);
    }
  }

  // stage transition
  onMarkStageAsComplete(dropEntityStageId, isReopenedStage: boolean = false) {

    this.optionsForPopupDialog.size = 'md';
    //check can user change stage
    const dropEntityStageDetail = this.opportunityStages.find(s => s.id == dropEntityStageId);
    if (dropEntityStageDetail != null && dropEntityStageId != this.opportunityDetails.entityStageId) {

      if (dropEntityStageDetail.isCompleted === true) {
        this.isOpportunityEligibleToDone(this.entityId).then((res) => {
          if (res) {
            this.userCanChangestage(dropEntityStageId, isReopenedStage);
          } else {
            return false;
          }
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
      } else {
        this.userCanChangestage(dropEntityStageId, isReopenedStage);
      }
    }
  }

  private isOpportunityEligibleToDone(opportunityId) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._opportunitiesService.getOpportunityById(opportunityId,null).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          if (response.hasAnyInactiveItem) {  //alert inactive product 
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.MESSAGE_OPPORTUNITY_COUNTAIN_INACTIVE_PRODUCT_OR_SKUS'));
            resolve(false);
          } else if (!(response.priceBookIsActive ?? true)) { //alert inactive price book 
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.MESSAGE_OPPORTUNITY_COUNTAIN_INACTIVE_PRICEBOOK'));
            resolve(false);
          } else {
            resolve(true);
          }
        }
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(true);
        });
    });
  }

  private userCanChangestage(dropEntityStageId, isReopenedStage) {
    var isShowStageChangeConfirmationBox: boolean = true;
    const prevEntityStageDetail = this.opportunityStages.find(s => s.id == this.opportunityDetails.entityStageId);
    const canUserChangeStage: boolean = this.canUserChangeStage(prevEntityStageDetail, this.opportunityDetails);
    if (!canUserChangeStage) {
      if (this.changeOpportunityStage) {
        isShowStageChangeConfirmationBox = false;
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
      }
    }
    else {
      this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
    }
  }

  afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage: boolean) {
    const dropEntityStageDetail = this.opportunityStages.find(s => s.id == dropEntityStageId);

    // if any one of the current stage task is required
    let anyTasksIsRequired: boolean = false;
    let requiredTasks: any[] = [];
    // find out the current stage
    let currentStage = this.opportunityStages.find(x => x.id == this.opportunityDetails.entityStageId);
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
      this._workflowmanagementService.isEntityStageTasksCompleted(this.entityId, this.entityTypeId, this.opportunityDetails.entityStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.MESSAGE_BEFORE_MOVE_OPPORTUNITY_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else if (isAllTasksRequired) {
      /**
        * Call API to validate worktask has completed all the stage tasks before moving on to other stage.
        * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (WorkTaskId)
        * */
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityStageTasksCompleted(this.entityId, this.entityTypeId, this.opportunityDetails.entityStageId, this.entityWorkflowId, null).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.MESSAGE_BEFORE_MOVE_OPPORTUNITY_STAGE_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    } else {
      this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage)
    }
  }

  changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage: boolean) {
    let noteSubjectName: any;
    if (!isReopenedStage) {
      noteSubjectName = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropEntityStageDetail.name }))}`
    } else {
      noteSubjectName = this._commonHelper.getInstanceTranlationData('COMMON.STAGE_REOPEN_TEXT');
    }
    if (dropEntityStageDetail.isNoteRequired || isReopenedStage) {
      isShowStageChangeConfirmationBox = false;
      this.refreshActivity = false;
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = this.entityId;
      this.modalRef.componentInstance.noteSubject = noteSubjectName;
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
            entityId: this.entityId,
            workflowId: this.entityWorkflowId,
            workflowStageId: dropEntityStageId,
            stageNoteID: response.id,
            processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.StageNote
          };

          Promise.all([
            this.updateEntityStage(dropEntityStageId, dropEntityStageDetail, isShowStageChangeConfirmationBox, isReopenedStage),
          ]).then(() => {
            Promise.all([
              this.saveEntityWorkflowStageValueNote(stageValueNoteParams)
            ]).then(() => {
              // get details
              this.getopportunityDetails();
              // get stage tasks history
              this.setRefreshStageHistory();
            });
          }).catch(() => {
            this.getopportunityDetails();
            // get stage tasks history
            this.setRefreshStageHistory();
          });
        }
        else {
          this.selectedStage = this.currentStage;
        }
      });
    }
    else {
      Promise.all([
        this.updateEntityStage(dropEntityStageId, dropEntityStageDetail, isShowStageChangeConfirmationBox, isReopenedStage),
      ]).then(() => {
        // get details
        this.getopportunityDetails();
        // get stage tasks history
        if (this.isEntityWorkflow) {
          this.setRefreshStageHistory();
        }
      }).catch(() => {
        this.getopportunityDetails();
        // get stage tasks history
        this.setRefreshStageHistory();
      });
    }
  }

  // update workflow entity stage values
  updateEntityStage(dropEntityStageId, dropEntityStageDetail, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean) {
    return new Promise((resolve, reject) => {
      if (isShowStageChangeConfirmationBox) {
        this._confirmationDialogService.confirm("OPPORTUNITIES.CHANGE_STAGE_CONFIRMATION", null, null, this.optionsForPopupDialog).then((confirmed: any) => {
          if (confirmed) {
            return this.afterUpdateEntityStage(dropEntityStageId, dropEntityStageDetail, isReopenedStage);
          }
        })
      } else {
        return this.afterUpdateEntityStage(dropEntityStageId, dropEntityStageDetail, isReopenedStage);
      }
    });
  }

  afterUpdateEntityStage(dropEntityStageId, dropEntityStageDetail, isReopenedStage: boolean) {
    return new Promise((resolve, reject) => {
      let assignedToForDto = this.copyOfopportunity.assignedTo;
      this._commonHelper.showLoader();
      let currentStageId = this.opportunityStages.find(x => x.id == this.opportunityDetails.entityStageId)?.id;
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: this.entityId, stageId: dropEntityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedToForDto, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.opportunityAssignedTo = response;
          if (assignedToForDto != this.opportunityAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._opportunitiesService.updateOpportunityAssignedTo({ entityId: this.entityId, assignedToId: this.opportunityAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.opportunityAssignedTo.isForcedAssignment, stageId: dropEntityStageId }).then((response: any) => {
              if (response) {
                assignedToForDto = this.opportunityAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.MESSAGE_OPPORTUNITY_MOVETO_STAGE',
                  { stageName: dropEntityStageDetail.name })
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
            if (isReopenedStage) {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.MESSAGE_OPPORTUNITY_STAGE_REOPEN', {
                  entityName: this.opportunityDetails?.name !== null ? this.opportunityDetails?.name : " "
                })
              )
            } else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.MESSAGE_OPPORTUNITY_MOVETO_STAGE',
                  { stageName: dropEntityStageDetail.name })
              );
            }
          }
        }
        this.getopportunityDetails();
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

  // event emitted from kanban
  onRelatedToClick(opportunity) {
    // check logged in user have permission to view related entity details
    if (!this._commonHelper.isUserHaveViewPermissionOfRelatedEntity(opportunity.entityTypeID)) {
      return;
    }

    // if not undefined then redirect
    if (opportunity.entityTypeName != undefined && opportunity.entityID != undefined) {
      this._router.navigateByUrl('/' + this._commonHelper.getRouteNameByEntityTypeId(opportunity.entityTypeID).toLowerCase() + '/details/' + opportunity.entityID);
    }
  }

  // to check logged in user have access
  userHavePermissionOfRelatedTo(opportunity) {
    let isViewRelatedToEntity = false;
    switch (opportunity.entityTypeName) {
      case "Accounts":
        isViewRelatedToEntity = this._commonHelper.havePermission(enumPermissions.ViewAccount);
        break;
      case "Contacts":
        isViewRelatedToEntity = this._commonHelper.havePermission(enumPermissions.ViewContact);
        break;
    }
    return isViewRelatedToEntity;
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'opportunities.closedorcompleted') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITITES_CLOSEDORCOMPLETED', { stageName: error.data.stageName }));
      } else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }

  onBack() {
    this._location.back();
  }

  closeForm() {
    this._router.navigate(['opportunitys/workflow/' + this.entityWorkflowId]);
  }

  createDynamicControlId(idPrefixValue, stageName) {
    return this._commonHelper.createDynamicControlId(idPrefixValue, stageName);
  }

  setRefreshEntityTag() {
    this.refreshEntityTag = !this.refreshEntityTag;
  }

  setRefreshActivityHistory() {
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

  //DD 20220329: SDC-145: Hide edit button on stage history tab
  // set current active tab
  setTab(activeInfo) {
    this.isAdditionalTab = activeInfo.isAdditionalTab;
    this.activeTab = activeInfo.tab.tabLink;
    this.selectedTab = activeInfo.tab.tabLink;
    if (!this.onceOpportunityItemsClicked && this.activeTab == 'navOpportunityItems') {
      this.getPriceBooksForOpportunities('');
      this.getOpportunityItems(this.opportunityItemsPagingParams);
      this.onceOpportunityItemsClicked = true;
    }
    if (!this.onceWorkTaskClicked && this.activeTab == 'navWorkTasks') {
      this.onceWorkTaskClicked = true;
    }
    if (!this.onceStageHistoryClicked && this.activeTab == 'navHistory') {
      this.onceStageHistoryClicked = true;
    }

    if (this.activeTab == 'navDocuments' && !this.onceDocumentClicked) {
      this.onceDocumentClicked = true;
    }
  }

  refreshChildComponent(componentName: string) {
    switch (componentName) {
      case "Linkedopportunitys": {
        this.refreshLinkedopportunitys = false;
        break;
      }
      case "Subopportunitys": {
        this.refreshSubopportunitys = false;
        break;
      }
      case "WorkTask": {
        this.refreshWorkTaskTab = false;
        break;
      }
    }
  }

  private setLinkedopportunityTabParameters(): void {
    this.tblLinkedopportunityParameters = [{
      name: 'opportunityID',
      type: 'int',
      value: this.opportunityId
    }]
  }

  private setSubopportunityTabParameters(): void {
    this.tblSubopportunityParameters = [{
      name: 'opportunityID',
      type: 'int',
      value: this.opportunityId
    }]
  }


  onParentopportunityClick() {
    // check logged in user have permission to view work task details
    if (!this.isViewOpportunity) {
      return;
    }

    // save work task
    this._workflowmanagementService.getEntityWorkflowStageValuesByEntityIdAndEntityTypeId(this.entityTypeId, this.opportunityDetails.parentID).then((response: any) => {
      var entityWorkflowStageValue = response;
      this._commonHelper.hideLoader();
      // if not undefined then redirect
      if (this.opportunityDetails.parentID != undefined) {
        //Allows to reload same component while navigation
        this._router.routeReuseStrategy.shouldReuseRoute = function () { return false; };

        // get guid and pass it to form renderer
        this._router.navigateByUrl('/opportunitys/details/' + entityWorkflowStageValue.entityWorkFlowId + '/' + this.opportunityDetails.parentID);
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private getEntityTotalReportingTime() {
    this._workflowmanagementService.getEntityTotalReportingTime(this.opportunityId, this.entityTypeId).then((response: any) => {
      if (response) {
        this.totalSpentTime = new TimeFramePipe().transform(+response?.totalSpentTime, this.hoursInDay);
        this.totalEffectiveTime = new TimeFramePipe().transform(+response?.totalEffectiveTime, this.hoursInDay);
        this.totalPauseTime = new TimeFramePipe().transform(+response?.totalPauseTime, this.hoursInDay);
      }
    }, (error) => {
      this.getTranslateErrorMessage(error);
    });
  }

  prepareParamsForRelatedTo(entityTypeIDs: string = null, selectedEntityID = null, includeAllEntities = 1, searchString: any = '') {
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

  getRelatedTo(searchString: any) {
    this.showRelatedToLoader = true;
    let entityTypeIDs: string = this.getRelatedToEntityTypesOrHide();

    // prepare params
    var params = this.prepareParamsForRelatedTo(entityTypeIDs, this.opportunityDetails?.entityID, 0, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALL_RELATED_ENTITIES, params).then((response: any) => {
      if (!searchString)
        this.isForceReloadRelatedTo = false;
      else
        this.isForceReloadRelatedTo = true;

      //response conversion
      if (response && response.length > 0) {
        let responseList: any = response as [];
        if (this.isRelatedToGroupDropDown) {
          this.relatedToList = this.prepareRelatedToTree(responseList);
        }
        else {
          this.relatedToList = responseList.map(x => ({ 'label': x.label, 'value': x.value }));
        }
      }
      else {
        this.isForceReloadRelatedTo = false;
      }

      this.showRelatedToLoader = false;
    }, (error) => {
      this.showRelatedToLoader = false;
    });
  }

  private getRelatedToEntityTypesOrHide() {
    let entityTypeIDs: string = null;
    if (this.possibleEntityTypeIdsForRelatedTo == null) {
      if (this.opportunityDetails?.entityTypeID != null && this.opportunityDetails?.entityTypeID > 0) {
        entityTypeIDs = this.opportunityDetails?.entityTypeID.toString();
        this.isRelatedToGroupDropDown = false;
        this.possibleEntityTypeIdsForRelatedTo = entityTypeIDs;
      }
      else if (this.opportunityDetails?.entityRecordTypeID != null && this.opportunityDetails?.entityRecordTypeID > 0) {
        let entityRecordTypeDetail = this.recordTypes.find(x => x.id == this.opportunityDetails?.entityRecordTypeID);
        if (entityRecordTypeDetail != null) {
          if (entityRecordTypeDetail.parentEntityTypeID != null && entityRecordTypeDetail.parentEntityTypeID > 0) {
            entityTypeIDs = entityRecordTypeDetail.parentEntityTypeID.toString();
            this.isRelatedToGroupDropDown = false;
            this.possibleEntityTypeIdsForRelatedTo = entityTypeIDs;
          }
          else {
            this.isShowRelatedTo = false;
            this.isForceReloadRelatedTo = false;
            return null;
          }
        }
      }
      else {
        let coreEntities = this._commonHelper.entityTypeList.filter(x => x.isCoreEntity && x.id != this.entityTypeId);
        if (coreEntities != null && coreEntities.length > 0) {
          entityTypeIDs = coreEntities.map(x => x.id).join(',');
          this.isRelatedToGroupDropDown = true;
          this.possibleEntityTypeIdsForRelatedTo = entityTypeIDs;
        }
        else {
          this.isShowRelatedTo = false;
          this.isForceReloadRelatedTo = false;
          return null;
        }
      }
    }
    else {
      entityTypeIDs = this.possibleEntityTypeIdsForRelatedTo;
    }

    return entityTypeIDs;
  }

  private prepareRelatedToTree(responseList: any): [] {
    let relatedToGroupList: any = [];
    let filteredGroups = Array.from(new Set(responseList.map((item: any = []) => item.entityTypeID)));
    filteredGroups.forEach(entityTypeID => {
      let items = responseList.filter((obj: any) => { return obj.entityTypeID === entityTypeID }).map((s: any) => { return { label: s.label, value: s.value, entityTypeID: s.entityTypeID, entityTypeName: s.entityTypeName } });
      let entityTypeId = items && items.length > 0 ? items[0].entityTypeID : null;
      let entityTypeName = items && items.length > 0 ? items[0].entityTypeName : null;
      const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == entityTypeID);
      relatedToGroupList.push({
        entityTypeName: entityTypeName,
        entityTypeId: entityTypeId,
        iconTooltip: foundRecord?.['displayName'].toString().trim(),
        items: items as []
      });
    });
    return relatedToGroupList;
  }

  relatedToOnFilter(e) {
    this.getRelatedTo(e.filter);
  }

  relatedToOnChange(e) {
    if (!e.value) {
      this.getRelatedTo('');
    }
    else {
      this.selectedRelatedToEntityTypeID = this.relatedToList.map((x) => x.items).flat().find((item) => item.value === e.value)?.entityTypeID;
    }
  }

  findInvalidControls() {
    const invalid = [];
    const controls = this.opportunityDetailForm.controls;
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

  priceBooksOnFilter(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getPriceBooksForOpportunities(e.filter.trim());
      }
    }
    else {
      this.getPriceBooksForOpportunities('');
    }
  }

  priceBooksOnChange(event) {
    if (this.opportunityDetails.priceBookID != null) {
      this.optionsForPopupDialog.size = "md";
      this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.CHANGE_OPPORTUNITYITEM_DIALOG_TEXT'), null, null, this.optionsForPopupDialog, true)
        .then((confirmed) => {
          if (confirmed) {
            this.changeOpportunityPriceBook(event);
          }
          else {
            this.selectedPriceBookId = this.opportunityDetails.priceBookID;
            this.opportunityItemsDrpRef?.resetFilter();
          }
        });
    }
    else {
      this.changeOpportunityPriceBook(event);
    }
  }

  private changeOpportunityPriceBook(event) {
    this._commonHelper.showLoader();
    let param = {
      PriceBookId: event.value,
      OpportunityId: this.opportunityId
    }
    this._opportunitiesService.changeOpportunityPriceBook(param).then(response => {
      this.opportunityItemsDrpRef?.resetFilter();
      Promise.all([
        this.getPriceBooksForOpportunities(''),
        this.fetchOpportunityItems()
      ]).then(() => {
        this.isReadOnly = true;
        this.getopportunityDetails();
      }).catch(() => {
        this.isReadOnly = true;
        this.getopportunityDetails();
      });
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.MESSAGE_OPPORTUNITY_UPDATED'));
    }, (error) => {
      this.opportunityItemsDrpRef?.resetFilter();
      Promise.all([
        this.getPriceBooksForOpportunities(''),
        this.fetchOpportunityItems()
      ]).then(() => {
        this.isReadOnly = true;
        this.getopportunityDetails();
      }).catch(() => {
        this.isReadOnly = true;
        this.getopportunityDetails();
      });
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  prepareParamsForPricebooksDropdown(searchString: any) {
    const params = [];
    const paramItem = {
      name: 'SelectedPriceBookID',
      type: 'int',
      value: this.selectedPriceBookId,
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

  private getPriceBooksForOpportunities(searchString: any) {
    return new Promise((resolve, reject) => {
      this.isShowLoaderForPriceBook = true;
      let params = this.prepareParamsForPricebooksDropdown(searchString);
      // get datasource details
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.PRICEBOOKS, params).then(response => {
        this.priceBooks = response;
        this.isShowLoaderForPriceBook = false;
        resolve(null)
      },
        (error) => {
          this.isShowLoaderForPriceBook = false;
          this._commonHelper.showToastrError(error.message);
          reject(null);
        });
    });
  }

  addOpportunityItems() {
    // avoid multiple popup open
    if (this._modalService.hasOpenModals()) {
      return;
    }

    this.optionsForPopupDialog.size = "xl";
    this.modalRef = this._modalService.open(OpportunityitemsAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.currencySymbol = this.currencySymbol;
    this.modalRef.componentInstance.priceBookId = this.selectedPriceBookId;
    this.modalRef.componentInstance.opportunityId = this.opportunityId;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.onceOpportunityItemsClicked = false;
        this.isReadOnly = true;
        this.getopportunityDetails();
        this.fetchOpportunityItems();
        setTimeout(() => {
          this.onceOpportunityItemsClicked = true;
        }, 50);
      }
    });
  }

  saveEditedItems() {
    let params: any = [];
    let editedRows = this.opportunityItems.filter(x => x.isEdited == true);

    //validations
    if (this.opportunityItems.find(x => x.price > 99999999999999)) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.TOSTER_MESSAGE_QUANTITY_MAX'));
      return;
    }

    if (this.opportunityItems.find(x => x.quantity == null || x.quantity <= 0)) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.TOSTER_MESSAGE_QUANTITY_MIN'));
      return;
    }

    if (this.opportunityItems.find(x => x.quantity > 99999999999999)) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.TOSTER_MESSAGE_QUANTITY_MAX'));
      return;
    }

    if (this.opportunityItems.map(x => x.quantity * x.price).reduce((prev, next) => prev + next) > 99999999999999) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.TOSTER_MESSAGE_AMOUNT_MAX'));
      return;
    }

    editedRows.forEach(selectedItem => {
      params.push({
        id: selectedItem.id,
        opportunityId: this.opportunityId,
        price: selectedItem.price,
        productId: selectedItem.productID,
        productSkuId: selectedItem.productSkuID,
        priceBookItemId: selectedItem.priceBookItemID,
        quantity: selectedItem.quantity,
      })
    });

    if (params.length > 0) {
      this._commonHelper.showLoader();
      this._opportunitiesService.saveOpportunityItems(params)
        .then(() => {
          this.editedRows = [];
          //Toggle Edit Mode
          this.opportunityItemsEditable = false;
          this.opportunityItemCols.find(x => x.field == 'quantity').sort = true;

          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.OPPORTUNITY_ITEMS_SUCCESS_MESSAGE'));
          this.isReadOnly = true;
          this.getopportunityDetails();
          this.fetchOpportunityItems();
          this._commonHelper.hideLoader();
        }, (error) => {
          this.editedRows = [];
          //Toggle Edit Mode
          this.opportunityItemsEditable = false;
          this.opportunityItemCols.find(x => x.field == 'quantity').sort = true;
          this.isReadOnly = true;
          this.getopportunityDetails();
          this.fetchOpportunityItems();
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
    else {
      this.editedRows = [];
      //Toggle Edit Mode
      this.opportunityItemsEditable = false;
      this.opportunityItemCols.find(x => x.field == 'quantity').sort = true;
    }
  }

  onOpportunityItemsEditToggle() {
    //Toggle Edit Mode
    this.opportunityItemsEditable = true;
    this.opportunityItemCols.find(x => x.field == 'quantity').sort = false;
  }

  onOpportunityItemsEditCancle() {
    this.editedRows = [];
    //Toggle Edit Mode
    this.opportunityItemsEditable = false;
    this.opportunityItemCols.find(x => x.field == 'quantity').sort = true;
    this.fetchOpportunityItems();
  }

  afterEditQuantity(rowData) {
    rowData.isEdited = true;

    if (this.editedRows.filter(x => x.id == rowData.id).length > 0) {
      this.editedRows.filter(x => x.id == rowData.id)[0] = this._commonHelper.cloningObject(rowData);
    }
    else {
      this.editedRows.push(this._commonHelper.cloningObject(rowData));
    }
  }

  deleteOpportunityItem(id: any) {
    this.optionsForPopupDialog.size = "md";
    this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.DELETE_OPPORTUNITYITEM_DIALOG_TEXT'), null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._opportunitiesService.deleteOpportunityItem(id).then(response => {
            this.editedRows = [];
            //Toggle Edit Mode
            this.opportunityItemsEditable = false;
            this.opportunityItemCols.find(x => x.field == 'quantity').sort = true;
            this.opportunityItemsPagingParams.pageNo = 1;

            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_ITEMS_TAB.MESSAGE_DELETE_OPPORTUNITYITEM_SUCCESS'));
            this.opportunityItemsDrpRef?.resetFilter();
            this.isReadOnly = true;
            this.getopportunityDetails();
            this.getPriceBooksForOpportunities('');
            this.fetchOpportunityItems();
          }, (error) => {
            this._commonHelper.hideLoader();
            this.editedRows = [];
            //Toggle Edit Mode
            this.opportunityItemsEditable = false;
            this.opportunityItemCols.find(x => x.field == 'quantity').sort = true;
            this.opportunityItemsPagingParams.pageNo = 1;
            this.isReadOnly = true;
            this.getopportunityDetails();
            this.fetchOpportunityItems();
            this.getTranslateErrorMessage(error);
          });
        }
      });
  }

  private setOpportunityItemsTabParameters(): void {
    this.tblOpportunityItemsParameters = [{
      name: 'OpportunityID',
      type: 'int',
      value: this.opportunityId
    }]
  }

  numberInputHandler(event) {
    if (event.key === "." || event.key === "-") {
      return false;
    }
  }

  private subscribeSearchBoxEvent(): void {
    this.searchBoxSubscription = this.searchValueChanged
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      ).subscribe((val) => {
        this.opportunityItemsPagingParams.pageNo = 1;
        this.opportunityItemsPagingParams.searchString = val;
        this.fetchOpportunityItems();
      });
  }

  private initializePagination(): void {
    this.opportunityItemsPagingParams = new OpportunityItemsPagingParams();
    this.opportunityItemsPagingParams.searchString = '';
    this.opportunityItemsPagingParams.sortColumn = 'productName';
    this.opportunityItemsPagingParams.sortOrder = 'ASC';
    this.opportunityItemsPagingParams.pageNo = 1;
    this.opportunityItemsPagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private fetchOpportunityItems(): void {
    if (this.pTable) {
      this.getOpportunityItems(this.opportunityItemsPagingParams);
    }
  }

  private getOpportunityItems(pagingParams: OpportunityItemsPagingParams): void {
    this.isShowOpportunityItemsLoader = true;
    this.opportunityItemsPagingParams.opportunityId = this.opportunityId;
    this._opportunitiesService.getOpportunityItems(pagingParams).then((response: any[]) => {
      if (response) {
        this.opportunityItems = response;
        this.isShowOpportunityItemsLoader = false;
        this.totalRecords = this.opportunityItems.length > 0 ? this.opportunityItems[0].totalRecords : 0;
        setTimeout(() => {
          this.pTable.rows = this.opportunityItemsPagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.opportunityItemsPagingParams.pageSize);
          this.end = this.opportunityItemsPagingParams.pageNo == this.totalPages ? this.totalRecords : this.opportunityItemsPagingParams.pageNo * this.opportunityItemsPagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.opportunityItems.length + 1) : (this.end - this.opportunityItemsPagingParams.pageSize) + 1;
        }, 50);

        //preserve edited values
        this.opportunityItems.filter(x => this.editedRows.filter(y => y.id == x.id).length > 0).map(x => { x.quantity = this.editedRows.filter(y => y.id == x.id)[0].quantity, x.isEdited = this.editedRows.filter(y => y.id == x.id)[0].isEdited });
      }
    }, (error) => {
      this.isShowOpportunityItemsLoader = false;
      this.getTranslateErrorMessage(error);
    });
  }

  search(val: string): void {
    this.searchValueChanged.next(val || '');
  }

  paginate(event: any): void {
    this.opportunityItemsPagingParams.pageNo = (event.first / event.rows) + 1;
    this.opportunityItemsPagingParams.pageSize = event.rows;
    this.fetchOpportunityItems();
  }

  changeOrder(column: any): void {
    if (column.sort) {
      if (this.pTable.sortOrder == 1) {
        this.opportunityItemsPagingParams.sortOrder = "ASC";
      }
      else {
        this.opportunityItemsPagingParams.sortOrder = "DESC";
      }
      this.opportunityItemsPagingParams.sortColumn = this.pTable.sortField;
      this.fetchOpportunityItems();
    }
  }

  changePage(): void {
    if (this.opportunityItemsPagingParams.pageNo <= this.totalPages && this.opportunityItemsPagingParams.pageNo > 0) {
      this.opportunityItemsPagingParams.pageNo = this.opportunityItemsPagingParams.pageNo > 0 ? this.opportunityItemsPagingParams.pageNo : 1;
      this.fetchOpportunityItems();
    }
    else if (this.opportunityItemsPagingParams.pageNo > this.totalPages) {
      this.opportunityItemsPagingParams.pageNo = this.totalPages;
    }
    else if (this.opportunityItemsPagingParams.pageNo <= 0) {
      this.opportunityItemsPagingParams.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  resetPaginator(): any {
    this.opportunityItemsPagingParams.pageNo = 1;
    if (this.end == this.opportunityItemsPagingParams.pageSize) {
      return false;
    }
    this.fetchOpportunityItems();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.opportunityItemsPagingParams.pageNo = this.opportunityItemsPagingParams.pageNo - 1 > 0 ? this.opportunityItemsPagingParams.pageNo - 1 : 1;
    if (this.end == this.opportunityItemsPagingParams.pageSize) {
      return false;
    }
    this.fetchOpportunityItems();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.opportunityItemsPagingParams.pageNo = (this.opportunityItemsPagingParams.pageNo + 1) <= this.totalPages ? this.opportunityItemsPagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchOpportunityItems();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  /**
  * START
  * Moksh Dhameliya 25 May 2023
  * Additional Tabs Code 
  */
  async setTabLayout() {
    //Only configure once time when both are 0 for edit/save resolved issue
    if (this.navTabsAll.length > 0 && (this.nativeTabCount == this.navTabs.length)) {
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
      } else {
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
      if (this.selectedTab == '') {
        this.setDefaultTab();
      }
    }
  }

  private setDefaultTab() {
    let defaultTab = this.navTabs[0];
    let isBypassAutoTabEvent: boolean = false;
    if (this.forceRedirectionTabName != null && this.forceRedirectionTabName != '') {
      if (this.navTabs?.some(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())) {
        defaultTab = this.navTabs.filter(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())[0];

        // Redirect to Native Tab
        let param: any = {};
        param.isAdditionalTab = defaultTab.tabLink === "additionalTabs";
        param.isNativeTab = true; // always true
        param.tab = defaultTab;
        this.checkTabCall(param, 1);
      }
      else if (this.navTabsMore?.some(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())) {
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
      if (this.navTabs.lastIndexOf(paramTab.tab)) {
        paramTab.tab.showButtonActive = true;
      }
      if (!tabExist) {
        this.navTabs.push(paramTab.tab);
      }
      this.currentActiveTabIndex = this.navTabs.findIndex(x => x.tabLink === paramTab.tab.tabLink)
      this.selectedTab = this.navTabs[this.currentActiveTabIndex].tabLink;
      this._commonHelper.autoTabEventEvent.next(paramTab.tab);
    }
    this.currentActiveTabIndex = this.navTabs.findIndex(x => x.tabLink === paramTab.tab.tabLink);
    this.setTab(paramTab);
  }

  //close specific additionalTabs
  closeNavTab(paramTab) {
    let index: any;
    let isSameTab;

    const removeNavtab = this.navTabs.findIndex(e => e.tabLink === paramTab.tab.tabLink);
    if (this.previousActiveTabIndex > removeNavtab)
      this.previousActiveTabIndex--;
    if (removeNavtab > -1) {
      if (removeNavtab === this.navTabs.findIndex(e => e.tabLink === this.activeTab)) {
        isSameTab = true;
        index = this.previousActiveTabIndex;
        this.currentActiveTabIndex = this.previousActiveTabIndex;
      } else {
        index = this.currentActiveTabIndex;
      }
      this.navTabs.splice(removeNavtab, 1);
      paramTab.tab.showButtonActive = false
      if (this.previousActiveTabIndex > this.navTabs.length - 1) {
        this.previousActiveTabIndex = this.navTabs.length - 1;
        if (isSameTab) {
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

  // get tenant setting for tab layout
  private getTabLayoutTenantSetting() {
    return new Promise((resolve, reject) => {
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.OPPORTUNITY_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.OPPORTUNITY_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.OPPORTUNITY_TAB_LAYOUT}`, JSON.stringify(response));
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

  private getWorkflowDetail(entityWorkflowId): Promise<any> {
    return new Promise((resolve, reject) => {

      //storage key
      let storageKey = `${LocalStorageKey.OpportunityWorkflowDetailKey}_${entityWorkflowId}`;

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
    });
  }

  //get Entity Record Type
  private getEntityRecordTypes() {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
    if (allEntityRecordTypes == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Opportunities);
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));

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
      this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Opportunities);
      this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
    }
  }
  /**
 * END
 * Additional Tabs Code 
 */

  // Worktask tab code
  private setWorkTaskTabParameters(): void {
    this.tbWorktaskParameters = [{
      name: 'EntityTypeID',
      type: 'int',
      value: this.entityTypeId
    }, {
      name: 'EntityID',
      type: 'int',
      value: this.opportunityId
    }]
  }

  addWorkTask(workTaskTypeName: any) {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.opportunityId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.worktaskRecordTypes.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.worktaskWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Opportunities || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_WORKTASK_TAB.ADD_WORKTASK_PREFIX') + " " + workTaskTypeName;
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityWorkTaskPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Opportunities;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
      }
    });
  }
  private prepareParamsWorkflows(entityTypeId: number) {
    const params = [];
    let paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: entityTypeId
    };
    params.push(paramItem);
    return params;
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
            this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_WORKTASK_TAB.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_WORKTASK_TAB.FILTER_OPTION_TEXT_WORKFLOW') });
        this.worktaskWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
  }
  //navigate to edit page
  editWorkTask(workTaskId) {
    this._router.navigate(['/worktasks/details/' + workTaskId]);
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
          this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_WORKTASK_TAB.WORKTASKS_SUBWORKTASKEXISTMESSAGEBEFOREPARENTTASKDELETE', { entitySubTypeName: this.availableSubWorkTaskTypeNamesForWorkTaskDelete })
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

        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_WORKTASK_TAB.MESSAGE_CONFIRM_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' }), null, null, optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._workTaskService.deleteWorkTask(workTask.id).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_WORKTASK_TAB.MESSAGE_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' })
                );
                this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                });
            }
          })
          .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_WORKTASK_TAB.WORKTASK_DISMISS_DIALOG')));
      }
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  setRefreshDocument() {
    this.refreshDocument = false;
    setTimeout(() => {
      this.refreshDocument = true;
    }, 500);
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
      } else {
        this.entityHiddenFieldSettings = hiddenFieldSettings;
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
            this.entitySubTypes = response.sort((a, b) => a.parentID - b.parentID);
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
        this.entitySubTypes = allEntitySubTypes.sort((a, b) => a.parentID - b.parentID);
        resolve(this.entitySubTypes);
      }
    });
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

  //delete opportunity - confirmation dialog
  onDeleteOpportunityClick(opporunityId) {
    //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('OPPORTUNITIES.DETAIL.MESSAGE_CONFIRM_OPPORTUNITY_DELETE', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._opportunitiesService.deleteOpportunity(opporunityId).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.MESSAGE_OPPORTUNITY_DELETE')
            );
            // Redirect Opportunity Listing Page.
            this._router.navigateByUrl('/opportunities/list');
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }
      })
      .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_DISMISS_DIALOG')));
  }

  getAccountList(searchString: any) {
    return new Promise((resolve, reject) => {
     
      var param = this.prepareParamsForRelatedTo(Entity.Accounts.toString(), this.opportunityDetails?.accountID, 0, searchString);
      this.showAccountLoader = true;
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALL_RELATED_ENTITIES,param).then((response: any) => {
        //account type
        if (response.length != 0) {
          this.accountTypeList = response as [];
          this.isForceReloadAccount = false;
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
   prepareParamsForGetCustomerContact(searchString: any) {
    const params = [];
    const selectedAccountID = this.opportunityDetailForm?.controls['accountID'].value|| null;
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

  getContactCustomerList(searchString: any) {
    return new Promise((resolve, reject) => {
      this.showContactLoader = true;
      
      let params;
      let dataSource;
      if(this.opportunityDetails?.accountID > 0)
      {
        params = this.prepareParamsForGetCustomerContact(searchString);
        dataSource = DataSources.RELATEDENTITYRELATIONS;
      }
      else
      {
        params = this.prepareParamsForRelatedTo(Entity.Contacts.toString(), this.opportunityDetails?.contactID, 0, searchString);
        dataSource = DataSources.ALL_RELATED_ENTITIES;
      }

      this._dataSourceService.getDataSourceDataByCodeAndParams(dataSource, params).then((response: any) => {
        //product category  
        this.customerContactList = response as [];
        this.showContactLoader = false;
        this.isForceReloadContact = false;
        resolve(null);
      },
        (error) => {
          this.showContactLoader = false;
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    });
  }

  onChangeAccount(event: any) {
    this.opportunityDetailForm.controls['accountID'].setValue(event.value);
    this.getContactCustomerList('');
    this.opportunityDetailForm.controls['contactID'].setValue(null);
    
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
}

