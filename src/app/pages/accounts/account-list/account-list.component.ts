//ANGULAR
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { LocalStorageKey, SectionCodes } from '../../../@core/enum';
import { DataSources, DownloadFileMimeType, Entity, ExportType, FileExtension, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings } from '../../../@core/enum';
import { AccountPagingParams, PagingParams } from '../../../@core/sharedModels/paging-params.model';
//SERVICE
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { AccountsService } from '../accounts.service';
import { WorkTasksService } from '../../worktasks/worktasks.service';
import { SettingsService } from '../../settings/settings.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
//COMPONENTS
import { AccountImportDialogComponent } from '../account-import-dialog/account-import-dialog.component';
import { CustomFieldReadOnlyComponent } from '../../../@core/sharedModules/custom-field-render/custom-field-readonly/custom-field-readonly.component';
import { AccountAddComponent } from '../account-add/account-add.component';
//PRIMNG
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { MultiSelect } from 'primeng/multiselect';
//OTHER
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import * as moment from 'moment';
import { WorktaskAddComponent } from '../../worktasks/worktask-add/worktask-add.component';
import { OpportunityAddComponent } from '../../opportunities/opportunity-add/opportunity-add.component';
import { CaseAddComponent } from '../../cases/case-add/case-add.component';
@Component({
  selector: 'ngx-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss']
})
export class AccountListComponent implements OnInit {

  // search and table element
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  EntityTitle: any;

  // accounts list
  accounts: any[] = [];
  entityTypeId: number = Entity.Accounts;

  showEntityRecordTypeLoader: boolean = false;
  showWorkflowLoader: boolean = false;

  //right side activity menu
  selectedAccountIsActive: boolean = true;
  selectedAccountIsPausedForActivityCenter: boolean = false;
  selectedAccountIdForActivityCenter: number = 0;
  isDocumentDownloadPermission: boolean = false;
  entityRecordTypeId: number;
  entityDetails: any;
  selectedRowId: number = 0;
  selectedAccountForActivityCenter: any;
  isAdvanceFilterVisible: boolean = false;

  refreshActivityCenter: boolean = false;

  keyfieldResponseData: any;

  accountListByStages: any[] = [];

  entityWorkflowId: number = 0;
  isShowActivityCenter: boolean = false;

  //Filters
  recordTypes = null;
  selectedRecordTypes: any = null;
  showStarred: boolean = false;

  workflows: any;
  quickViewConfig: any;

  // pagination
  pagingParams: AccountPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;
  startDate: Date;
  endDate: Date;

  // search filter
  lastAccountSearchFilter: any;
  accountSearchFilter = {
    searchText: '',
    recordTypeIds: null,
    IsActive: false,
    createdStartDate: null,
    createdEndDate: null,
    rating: null,
    showStarred: false
  }

  IsActive: boolean = false;
  // statusOptions:any = [{value:null,label:"All"},{value:true,label:"Active"},{value:false,label:"Inactive"}]
  ratingOptions: any[] = [];

  // permission variable
  isViewAccount: boolean = false;
  isAddAccount: boolean = false;
  isEditAccount: boolean = false;
  isImportAccount: boolean = false;
  isDeleteAccount: boolean = false;
  isExportAccount: boolean = false;
  isAddWorkTask: boolean = false;
  isAddCase: boolean = false;
  isAddOpportunity: boolean = false;
  currencySymbol: any = null;

  // table Column
  cols: any[];
  isShowActionColumn: boolean = false;
  rangeDates: any[] = [];
  dateSelectOptionsButtonBar = ['today', 'yesterday', 'last7days'];

  accountCustomFields: any[] = [];

  private modalRef: NgbModalRef | null;
  private optionsForPopupDialog: any = {
    size: 'md',
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //datasource
  hoursInDay:number = null;

  //local Storage prefix 
  localStorageKeyPrefix: string = "";
  accountCreatedBy: number;

  rowActionButtonMouseHoverFlag: boolean = false;

  // worktask tab
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  refreshWorkTaskTab;
  entitySubTypes: any = [];
  workTaskSubTypeDetails: any;
  availableSubWorkTaskTypeNamesForAccountDelete: any;

  //export Account
  dynamicColumnNameSetting: any = {};

  opportunityRecordTypes: any;
  opportunityWorkflowList: any;
  refreshOpporunityTab: boolean = false;

  casesRecordTypes: any;
  casesWorkflowList: any;

  entityHiddenFieldSettings: any;
  
  countries: any;
  countryReadOnlyMask: any;
  
  hideRecordTypeFilter = null;

  constructor(
    private _router: Router,
    public _commonHelper: CommonHelper,
    private _accountService: AccountsService,
    private _modalService: NgbModal,
    private _workTasksService: WorkTasksService,
    private _settingsService: SettingsService,
    private _dataSourceService: DatasourceService,
    private _commonService: CommonService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _confirmationDialogService: ConfirmationDialogService) {

    this.EntityTitle = this._commonHelper.getEntityTitleFromMenuItemByUrl(decodeURI(this._router.url));

    this.setPermissions();
    this.setColumnDefinations();
    this.initializePagination();
    this.setRatingOptions();
  }

  ngOnInit(): void {
    // get logged in user information
    let loggedInUser = this._commonHelper.getLoggedUserDetail();   
    //set local storage prefix
    this.localStorageKeyPrefix = `${loggedInUser?.tenantId}_${loggedInUser?.userId}`
    this.setLastSearchFilterFromStorage();
    if((this.rangeDates.length == 0) && (this.accountSearchFilter.createdStartDate!=null || this.accountSearchFilter.createdEndDate!=null))
    {
      this.startDate = moment(new Date(this.accountSearchFilter.createdStartDate)).toDate();
      if(this.accountSearchFilter.createdEndDate!=null){
      this.endDate = moment(new Date(this.accountSearchFilter.createdEndDate)).toDate();
      }
      this.rangeDates.push(this.startDate);
      this.rangeDates.push(this.endDate);
    }

    Promise.all([
      this.getHoursInDay(),
      this.getCurrencySymbol(),
      this.getEntityRecordTypes(),
      this.getWorkflowList(),
      this.getWorktaskWorkflowList(),
      this.getWorkflowListForOpportunity(),
      this.getWorkflowListForCase(),
      this.getEntityHiddenField(),
      this.getEntitySubTypes(),
      this.getCountries()
    ]).then(() => {
      this.getAccounts(this.pagingParams);
      this.subscribeSearchboxEvent();
      this.workTaskSubTypeDetails = this.entitySubTypes.find(x => x.level == 1);
      
      //set Action column show/hide dynamically
      if(!this.isEditAccount && !this.isDeleteAccount)
        {
          let entityNameColumn = this.cols.find(c => c.field == 'id');
          entityNameColumn.visible = false;
        }
    });

    this.setColumnDefinations();
    // get set quickview local storage config start
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedAccountIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
    }
    // get set quickview local storage config end
  }

  fetchAccounts(): void {
    if (this.pTable) {
      this.getAccounts(this.pagingParams);
    }
  }

  setRatingOptions() {
    this._commonHelper.setRatingOptions().then((response) => {
      this.ratingOptions = response as [];
    });
  }

  accountDetail(id: number): void {
    this._router.navigate(['detail/' + id]);
  }

  onResetAllFilters() {
    this.accountSearchFilter.searchText = '';
    this.accountSearchFilter.recordTypeIds = null;
    this.accountSearchFilter.IsActive = false;
    this.accountSearchFilter.createdStartDate = null;
    this.accountSearchFilter.createdEndDate = null;
    this.accountSearchFilter.rating = null;
    this.accountSearchFilter.showStarred = false;

    this.selectedRecordTypes = null;
    this.rangeDates = null;
    this.IsActive = false;
    this.showStarred = false;

    this.pagingParams.searchString = '';
    this.pagingParams.entityRecordTypeIds = null;
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.createdStartDate = null;
    this.pagingParams.createdEndDate = null;
    this.pagingParams.IsActive = false;
    this.pagingParams.rating = null;
    this.pagingParams.showStarred = false;
    this.getAccounts(this.pagingParams);
  }

  openImportAccount(): void {
    this.modalRef = this._modalService.open(AccountImportDialogComponent, this.optionsForPopupDialog);
    this.modalRef.result
      .then((response: boolean) => {
        if (response) {
          this.onResetAllFilters();
        }
      });
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchAccounts();
  }

  changeOrder(column: any): void {
    if (column.sort) {
      if (this.pTable.sortOrder == 1) {
        this.pagingParams.sortOrder = "ASC";
      }
      else {
        this.pagingParams.sortOrder = "DESC";
      }
      this.pagingParams.sortColumn = this.pTable.sortField;
      this.fetchAccounts();
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchAccounts();
    }
    else if (this.pagingParams.pageNo > this.totalPages) {
      this.pagingParams.pageNo = this.totalPages;
    }
    else if (this.pagingParams.pageNo <= 0) {
      this.pagingParams.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  resetPaginator(): any {
    this.pagingParams.pageNo = 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchAccounts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchAccounts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchAccounts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  onStatusChange(rowData) {
    //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    let confirmMessage, successMessage;

    if (!rowData.isActive) {
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
          rowData.isActive = !rowData.isActive;
          this._commonHelper.showLoader();

          let params = { id: rowData.id, isActive: rowData.isActive };


          this._accountService.updateAccountIsActive(params).then((response) => {
            if (response) {
              this.fetchAccounts();
              this._commonHelper.hideLoader();
              this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData(successMessage));
            }
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
              this.fetchAccounts();
            });
        }
      })

  }
 
  // onFilterStatus(event) {
  //   this.accountSearchFilter.status = event.value;
  //   this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AccountListingKey, JSON.stringify(this.accountSearchFilter), this.localStorageKeyPrefix);
  //   this.getAccounts(this.pagingParams);
  // }

    onFilterRating(event) {
    this.accountSearchFilter.rating = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AccountListingKey, JSON.stringify(this.accountSearchFilter), this.localStorageKeyPrefix);
    this.getAccounts(this.pagingParams);
  }
  
  trimFilterValue(e: any, multiSelect: MultiSelect) {
    multiSelect.filterValue = String(e.filter).trim();
    multiSelect.filterInputChild.nativeElement.value = String(e.filter).trimStart();
  }

  onFilterRecordType(event) {
    this.accountSearchFilter.recordTypeIds = event.value.toString();
    this.pagingParams.pageNo = 1;
    this.getAccounts(this.pagingParams);
  }
 
  onFilterCreated(event) { 
    if (event == null) {
      this.rangeDates = [];
      this.accountSearchFilter.createdStartDate = null;
      this.accountSearchFilter.createdEndDate = null;
      this.getAccounts(this.pagingParams);
    }
    else {
      if (event[0] < this._commonHelper.globalMinDate || event[0] > this._commonHelper.globalMaxDate || event[1] > this._commonHelper.globalMaxDate || event[1] < this._commonHelper.globalMinDate) {
        this.rangeDates = [];
        this.accountSearchFilter.createdStartDate = null;
        this.accountSearchFilter.createdEndDate = null;
        this.getAccounts(this.pagingParams);
      }
      else {
        this.startDate = event[0];
        this.endDate = event[1];
        this.accountSearchFilter.createdStartDate = event[0] != null ? moment(event[0]).format('YYYY-MM-DD') : null;
        this.accountSearchFilter.createdEndDate = event[1] != null ? moment(event[1]).format('YYYY-MM-DD') : null;
        this.getAccounts(this.pagingParams);
      }
    }
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AccountListingKey, JSON.stringify(this.accountSearchFilter), this.localStorageKeyPrefix);
  }

  onFilterShowStarred() {
    this.accountSearchFilter.showStarred = this.showStarred;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AccountListingKey, JSON.stringify(this.accountSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getAccounts(this.pagingParams);
  }

  //#region private methods
  private setPermissions(): void {
    this.isViewAccount = this._commonHelper.havePermission(enumPermissions.ViewAccount);
    this.isAddAccount = this._commonHelper.havePermission(enumPermissions.AddAccount);
    this.isEditAccount = this._commonHelper.havePermission(enumPermissions.EditAccount);
    this.isDeleteAccount = this._commonHelper.havePermission(enumPermissions.DeleteAccount);
    this.isImportAccount = this._commonHelper.havePermission(enumPermissions.ImportAccount);
    this.isExportAccount = this._commonHelper.havePermission(enumPermissions.ExportAccount);
    this.isDocumentDownloadPermission=this._commonHelper.havePermission(enumPermissions.DownloadAccountDocument);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAddOpportunity = this._commonHelper.havePermission(enumPermissions.AddOpportunity);
    this.isAddCase = this._commonHelper.havePermission(enumPermissions.AddCase);
    this.isShowActionColumn = this.isDeleteAccount || this.isEditAccount;
  }

  private setColumnDefinations(): void {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display'},
      { field: 'name', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_NAME', sort: true, visible: true },
      { field: 'ein', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_EIN', sort: true, visible: true },
      { field: 'phone', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_PHONE', sort: true, visible: true },
      { field: 'email', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_EMAIL', sort: true , visible: true},
      { field: 'typeName', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_ACCOUNTTYPE', sort: true, visible: true },
      { field: 'created', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_CREATED', sort: true, visible: true },
      // { field: 'isActive', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_IS_ACTIVE', sort: true, class: "status" },
      { field: '', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_CUSTOMFIELDS', sort: false, class: "customfields", visible: true },
      { field: 'id', header: '', sort: false, class: "icon--dropdown action" , visible: true }
    ];

    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.cols.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private initializePagination(): void {
    this.pagingParams = new AccountPagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.entityRecordTypeIds = null;
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
    this.pagingParams.IsActive = this.IsActive;
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_AccountListingKey, this.localStorageKeyPrefix));
    if (searchFilter != null) {
      this.accountSearchFilter = searchFilter;
      this.IsActive = this.accountSearchFilter.IsActive;
      this.showStarred = this.accountSearchFilter.showStarred;
    }

    if (this.accountSearchFilter.recordTypeIds != null && this.accountSearchFilter.recordTypeIds != '') {
      this.selectedRecordTypes = this.accountSearchFilter.recordTypeIds.split(',').map(x => Number(x)) as [];
    }
    else {
      this.selectedRecordTypes = null;
    }

    this.lastAccountSearchFilter = JSON.parse(JSON.stringify(this.accountSearchFilter));
  }

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.accountSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this.fetchAccounts();
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

  public onFilterShowActiveRecords() {
    this.accountSearchFilter.IsActive = this.IsActive;
    this.pagingParams.pageNo = 1;
    this.getAccounts(this.pagingParams);
  }

  private prepareParamsForWorkflows() {
    return [
      { name: 'EntityTypeID', type: 'int', value: Entity.Accounts }
    ];
  }
  
  private getWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Accounts}`;
      this.workflows = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.workflows == null) {
        const params = this.prepareParamsForWorkflows();
        this.showWorkflowLoader = true;
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflows = response;
            this.workflows.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflows));
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
        this.workflows = this.workflows;
        this.showWorkflowLoader = false;
        resolve(null);
      }
    });
  }


  // open add popup
  addAccount() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(AccountAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.recordTypes = this.recordTypes?.filter(s => s.value != 0);
    this.modalRef.componentInstance.isShowWorkflow = true;
    this.modalRef.componentInstance.isShowAssignedTo = true;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.fetchAccounts();
      }
    });
  }

  // get custom fields
  getAccountCustomFields(workTask) {
    if(!this.isViewAccount)
    {
      return;
    }
    this.optionsForPopupDialog.size = 'md';
    this.modalRef = this._modalService.open(CustomFieldReadOnlyComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityTypeId = Entity.Accounts;
    this.modalRef.componentInstance.entityRecordTypeId = workTask.entityRecordTypeID;
    this.modalRef.componentInstance.entityId = workTask.id;
    //open dialog
    this.modalRef.result.then(response => {
      if (response != undefined) {
        //closed the dialog 
      }
    });
  }

  private getAccounts(pagingParams: AccountPagingParams): void {
    this._commonHelper.showLoader();
    this.pagingParams.searchString = this.accountSearchFilter.searchText;
    this.pagingParams.entityRecordTypeIds = this.accountSearchFilter.recordTypeIds;
    this.pagingParams.createdStartDate = this.accountSearchFilter.createdStartDate;
    this.pagingParams.createdEndDate = this.accountSearchFilter.createdEndDate;
    this.pagingParams.rating = this.accountSearchFilter.rating;
    this.pagingParams.IsActive = !this.accountSearchFilter.IsActive;
    this.pagingParams.showStarred = this.accountSearchFilter.showStarred;
    this._accountService.getAccounts(pagingParams)
      .then((response: any[]) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.accounts = response;
          this.totalRecords = this.accounts.length > 0 ? this.accounts[0].totalRecords : 0;
          this.pTable.rows = this.pagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
          this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.accounts.length + 1) : (this.end - this.pagingParams.pageSize) + 1;

          if (this.selectedAccountIdForActivityCenter != null && this.selectedAccountIdForActivityCenter > 0 && this.accounts.some(x=>x.id == this.selectedAccountIdForActivityCenter)) {
            this.updateEntityDetails(true, this.accounts.find(x=>x.id == this.selectedAccountIdForActivityCenter));
          }
          else{
            this.resetSelectedEntity();
          }
          this.accounts.forEach((account: any) => {
            if (account.phone) {
              const phoneDetail = String(account.phone).split('|');
              if (phoneDetail.length == 2) {
                account['countryCode'] = phoneDetail[0];
                account['phoneNumber'] = phoneDetail[1];
                account['phoneMask'] = String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0");
              } 
            }
          })
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AccountListingKey, JSON.stringify(this.accountSearchFilter), this.localStorageKeyPrefix);
  }


  ondeleteAccountclick(AccountID) {
    let params = {
      "entityId": AccountID,
      "entityTypeId": Entity.Accounts
    }

    let message: string = "";
    this._commonHelper.showLoader();
    this._workTasksService.GetWorkTasksByEntity(params).then((res: any) => {
      this._commonHelper.hideLoader();

      let hasWorktask: boolean = res != null && res.length > 0;
      message = hasWorktask ? 'CRM.ACCOUNT.LIST.MESSAGE_ACCOUNT_RELATED_WORKTASK_DELETE' : 'CRM.ACCOUNT.LIST.MESSAGE_CONFIRM_DELETE';

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
        this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_ACCOUNT_DELETED')
      );
      this.totalRecords = this.totalRecords - 1;
      this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/this.pagingParams.pageSize) : 1;
      this.fetchAccounts();
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
        this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_ACCOUNT_DELETED')
      );
      this.totalRecords = this.totalRecords - 1;
      this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/this.pagingParams.pageSize) : 1;
      this.fetchAccounts();
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode == "Accounts.EntityCanNotBeDeleteDueToSubWorkTaskExist") {
        this.availableSubWorkTaskTypeNamesForAccountDelete = this.entitySubTypes.find(x => x.level == 2).name;
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ACCOUNTS_ENTITYCANNOTBEDELETEDUETOSUBWORKTASKEXIST', { entitySubTypeName: this.availableSubWorkTaskTypeNamesForAccountDelete })
        );
      } else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }


  //Export Accounts Listing

  exportExcel() {
    this.exportAccountList(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportAccountList(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();

    const excelExportPayload = {

      tenantId: this.pagingParams.tenantId,
      searchString: this.pagingParams.searchString,
      entityRecordTypeIds: this.pagingParams.entityRecordTypeIds,
      // status: this.pagingParams.status,
      IsActive:this.pagingParams.IsActive,
      createdStartDate: this.pagingParams.createdStartDate,
      createdEndDate: this.pagingParams.createdEndDate,
      sortColumn: this.pagingParams.sortColumn,
      sortOrder: this.pagingParams.sortOrder,
      exportType: exportType,
      rating: this.pagingParams.rating,
      pageNo: 1,
      pageSize: this._commonHelper.DefaultPageSize,
      dynamicColumnSettingJson: "",
      showStarred: this.pagingParams.showStarred
    }

    let fileName = this._commonHelper.getConfiguredEntityName('{{Accounts_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.ALLLISTING.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    this._accountService.exportAccountList(excelExportPayload).then((base64String: any) => {
      this._commonHelper.hideLoader();
      if (base64String && base64String != '') {
        this._commonHelper.downloadFile(`${fileName}${fileExtension}`, fileMimeType, base64String);
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ALLLISTING.MESSAGE_NO_DATA_EXPORT'));
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  // Set row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Accounts_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Accounts_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
  }

  // Setup Quick View

  onMoreDetailsClick(isShowActivityCenter:boolean) {
    this.isShowActivityCenter = isShowActivityCenter;
    if (!this.quickViewConfig) {
      this.quickViewConfig = { isQuickViewOpen: this.isShowActivityCenter }
    }
    else {
      this.quickViewConfig.isQuickViewOpen = this.isShowActivityCenter;
    }
    this.setQuickViewConfig();
  }

  onSaveKeyFieldEvent(event) {

    let params = {
      entityTypeId: event.entityTypeId,
      entityId: event.entityId,
      isCustomField: event.isCustomField,
      type: event.type,
      field: event.field,
      fieldValue: event.fieldValue ? event.fieldValue.toString() : null
    };

    this._accountService.updateAccountField(params).then((response) => {
      this.keyfieldResponseData = {
        keyfieldNameToHideLoader: event.field,
        fieldValue: event.fieldValue,
        fieldOldValue: event.fieldValue
      }
    }, (error) => {
      this.keyfieldResponseData = {
        keyfieldNameToHideLoader: event.field,
        fieldValue: event.fieldValue,
        fieldOldValue: event.fieldOldValue
      }
      this._commonHelper.showToastrError(error.message);
    });
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  onRowActionButtonMouseEnter()
  {
    this.rowActionButtonMouseHoverFlag = true;
  }

  onRowActionButtonMouseLeave()
  {
    this.rowActionButtonMouseHoverFlag = false;
  }

  onRowClick(rowData: any, isShowActivityCenter:boolean = null) {

    if (this.rowActionButtonMouseHoverFlag) {
      return;
    }

    const settingsJson = JSON.parse(rowData?.settingsJson);
    const obj = {
      id: rowData.id,
      entityIcon: 'fas fa-building',
      entityName: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TITLE'),
      label1: settingsJson.Token1Text,
      label1RedirectURL: settingsJson.Token1Url,
      label2: settingsJson.Token2Text,
      label2RedirectURL: settingsJson.Token2Url,
      label3: settingsJson.Token3Text,
      label3RedirectURL: settingsJson.Token3Url,
      relatedToLabel: rowData?.entityName,
      phone: rowData?.phone,
      email: rowData?.email,
      type: rowData?.typeName,
      createdOn: rowData?.createdOn,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      entityRecordTypeId: rowData?.entityRecordTypeID,
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      isActive: rowData?.isActive,
      isPaused: rowData?.isPaused,
      createdBy: rowData?.createdBy,
      workTaskTypeName: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_WORKTASKS.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
      workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
      relatedToRedirectURL: this.onRelatedToClick(rowData)
    };

    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id;
    this.accountCreatedBy = obj?.createdBy;

    this.selectedAccountForActivityCenter = rowData;
    this.selectedAccountIdForActivityCenter = rowData.id;
    this.selectedAccountIsPausedForActivityCenter = (rowData?.isPaused ?? false);
    this.selectedAccountIsActive = rowData.isActive; 
   // get set quickview local storage config start
   this.quickViewConfig = {
    selectedRowEntityId: this.selectedRowId
  }

  if(isShowActivityCenter != null){
    this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
  }

  this.onMoreDetailsClick(isShowActivityCenter && this.isViewAccount);
  }

  // event emitted from kanban
  onRelatedToClick(account) {
    // check logged in user have permission to view related entity details
    if (!this.userHavePermissionOfRelatedTo(account)) {
      return this._router.url;
    }
  }
  // to check logged in user have access
  userHavePermissionOfRelatedTo(account) {
    let isViewRelatedToEntity = false;
    switch (account.entityTypeName) {
      case "Accounts":
        isViewRelatedToEntity = this._commonHelper.havePermission(enumPermissions.ViewAccount);
        break;
      case "Contacts":
        isViewRelatedToEntity = this._commonHelper.havePermission(enumPermissions.ViewContact);
        break;
    }
    return isViewRelatedToEntity;
  }
  
  advanceFilterVisibleChange(value: boolean) {
    this.isAdvanceFilterVisible = value;
  }

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewAccount;
        this.selectedAccountIdForActivityCenter = details.id;
        this.selectedAccountForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedAccountIsPausedForActivityCenter = (details.isPaused ?? false);
        this.selectedAccountIsActive = details.isActive;
        this.entityDetails = this._commonHelper.cloningObject(details);
      }
      else {
        this.onRowClick(details, this.quickViewConfig.isQuickViewOpen);
      }
    }
    else {
      this.resetSelectedEntity();
    }
  }

  refreshChildComponentForOpportunity() {
    this.refreshOpporunityTab = false;
  }

  addOpportunity() {
    this.optionsForPopupDialog.size = "lg";
    this.modalRef = this._modalService.open(OpportunityAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.entityDetails?.id;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.opportunityRecordTypes?.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.opportunityWorkflowList?.filter(s => s.value != 0).filter(s => s.parentEntityTypeID == Entity.Accounts || s.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityType = Entity.Accounts;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshOpporunityTab = true;
      }
    });
  }

  private prepareParamsWorkflows(entityTypeId: number): any[] {
    return [
      { name: 'EntityTypeID', type: 'int', value:  entityTypeId}
    ]
  }

  addCase() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CaseAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.entityDetails.id;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.casesRecordTypes?.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.casesWorkflowList?.filter(x => x.value != 0)?.filter(x => x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityCasePopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Accounts;
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
            this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.ALLLISTING.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.ALLLISTING.FILTER_OPTION_TEXT_WORKFLOW') });
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
            this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.ALLLISTING.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.ALLLISTING.FILTER_OPTION_TEXT_WORKFLOW') });
        this.casesWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
  }

  private resetSelectedEntity(){
    this.isShowActivityCenter = false;
    this.selectedAccountForActivityCenter = null;
    this.selectedAccountIsPausedForActivityCenter = null;
    this.selectedAccountIdForActivityCenter = 0;
    this.selectedAccountIsActive = null;
    this.selectedRowId = 0;
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

  private getEntityRecordTypes() {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
    if (allEntityRecordTypes == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Accounts).map(x=> ({'label':x.name,'value':x.id }));
            this._commonHelper.getTranlationData('CRM.ACCOUNT.LIST.FILTER_OPTION_TEXT_RECORDTYPE').then((labelText)=>{
              this.recordTypes.push({ value: 0, label: labelText });
              this.recordTypes.sort((a, b) => a.value - b.value);
              this.hideRecordTypeFilter = response?.filter(x => x.entityTypeID == Entity.Accounts).map(x=> ({'label':x.name,'value':x.id }));
            });
           
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
            this.opportunityRecordTypes = response?.filter((s: any) => s.entityTypeID == Entity.Opportunities && (s.parentEntityTypeID == this.entityTypeId));
            this.casesRecordTypes = response?.filter((s: any) => s.entityTypeID == Entity.Cases && s.parentEntityTypeID == this.entityTypeId);
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
      this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Accounts).map(x=> ({'label':x.name,'value':x.id }));
      this._commonHelper.getTranlationData('CRM.ACCOUNT.LIST.FILTER_OPTION_TEXT_RECORDTYPE').then((labelText)=>{
        this.recordTypes.push({ value: 0, label: labelText });
        this.recordTypes.sort((a, b) => a.value - b.value);
      });
      this.hideRecordTypeFilter = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Accounts).map(x=> ({'label':x.name,'value':x.id }));
      this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
      this.opportunityRecordTypes = allEntityRecordTypes?.filter((s: any) => s.entityTypeID == Entity.Opportunities && (s.parentEntityTypeID == this.entityTypeId));
      this.casesRecordTypes = allEntityRecordTypes?.filter((s: any) => s.entityTypeID == Entity.Cases && s.parentEntityTypeID == this.entityTypeId);
    }
  }

  addWorkTask() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.entityDetails.id;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.worktaskRecordTypes.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.worktaskWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityWorkTaskPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Accounts;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshWorkTaskTab = true;
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
  //#endregion 

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
 }
