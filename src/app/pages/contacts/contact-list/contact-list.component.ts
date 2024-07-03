//ANGUlAR
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { DataSources, DownloadFileMimeType, Entity, ExportType, FileExtension, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, SectionCodes } from '../../../@core/enum';
import { ContactsPagingParams } from '../../../@core/sharedModels/paging-params.model';
//SERVICES
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { WorkTasksService } from '../../worktasks/worktasks.service';
import { ContactsService } from '../contacts.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { SettingsService } from '../../settings/settings.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
//COMPONENTS
import { ContactAddComponent } from '../contact-add/contact-add.component';
//PRIMENG
import { MultiSelect } from 'primeng/multiselect';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
//OTHER
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import * as moment from 'moment';
import { WorktaskAddComponent } from '../../worktasks/worktask-add/worktask-add.component';
import { OpportunityAddComponent } from '../../opportunities/opportunity-add/opportunity-add.component';
import { CaseAddComponent } from '../../cases/case-add/case-add.component';

@Component({
  selector: 'ngx-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss']
})
export class ContactListComponent implements OnInit {
  // search and table element
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  // contacts list
  contacts: any[] = [];
  entityTypeId: number = Entity.Contacts;
  EntityTitle: any;
  
  //right side activity menu
  isShowActivityCenter: boolean = false;
  selectedRowId:number = 0;
  entityWorkflowId: number = 0;
  entityDetails: any;
  selectedContactForActivityCenter: any;
  selectedContactIdForActivityCenter: number = 0;
  selectedContactIsPausedForActivityCenter: boolean = false;
  selectedContactIsActive: boolean = true;
  isAdvanceFilterVisible: boolean = false;
  entityRecordTypeId: number;
  isDocumentDownloadPermission: boolean = false;
  refreshActivityCenter: boolean = false;

  showEntityRecordTypeLoader: boolean = false;
  showWorkflowLoader: boolean = false;

  // pagination
  pagingParams: ContactsPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;

  //Filters
  recordTypes = null;
  selectedRecordTypes: any = null;

  workflows: any;

  // search filter
  lastContactSearchFilter: any;
  contactSearchFilter = {
    searchText: '',
    recordTypeIds: null,
    // status: null
    IsActive: false,
    rating: null,
    showStarred: false
  }

  IsActive: boolean = false;
  ratingOptions: any[] = [];
  showStarred:boolean = false;

  // statusOptions: any = [{
  //   value: null, label: 'All'
  // }, { value: true, label: "Active" }, { value: false, label: "Inactive" }];


  // permission variable
  isViewContact: boolean = false;
  isAddContact: boolean = false;
  isEditContact: boolean = false;
  isDeleteContact: boolean = false;
  isViewAccount: boolean = false;
  isExportContact: boolean = false;
  isAddWorkTask: boolean = false;
  isAddOpportunity: boolean = false;
  isAddCase: boolean = false;

  // table Column
  cols: any[];

  private modalRef: NgbModalRef | null;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //user details
  loggedInUserDetails: any
  localStorageKeyPrefix: string = "";

  // flags
  isEntityTypeDefined: boolean = true;
  
  rowActionButtonMouseHoverFlag: boolean = false;

  keyfieldResponseData: any;
  currencySymbol: any = null;
  hoursInDay:number = null;
  contactCreatedBy: number;

  opportunityRecordTypes: any;
  opportunityWorkflowList: any;
  refreshOpporunityTab: boolean = false;

  // worktask tab
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  refreshWorkTaskTab;
  entitySubTypes: any = [];
  workTaskSubTypeDetails: any;
  availableSubWorkTaskTypeNamesForContactDelete: any;

  casesRecordTypes: any;
  casesWorkflowList: any;

  entityHiddenFieldSettings: any;

  countries: any;
  countryReadOnlyMask;

  //local storage
  quickViewConfig: any;

  //export Contact  
  dynamicColumnNameSetting: any = {};
  AccountColumnName: string;
  hideRecordTypeFilter = null;

  constructor(
    private _router: Router,
    public _commonHelper: CommonHelper,
    private _modalService: NgbModal,
    private _dataSourceService: DatasourceService,
    private _confirmationDialogService: ConfirmationDialogService,
    private _settingsService: SettingsService,
    private _contactService: ContactsService,
    private _commonService: CommonService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _workTasksService: WorkTasksService) {

    this.EntityTitle = this._commonHelper.getEntityTitleFromMenuItemByUrl(decodeURI(this._router.url));
    this.setPermissions();
    this.setColumnDefinations();
    this.initializePagination();
    this.setRatingOptions()
  }

  ngOnInit(): void {
    //get loggedInuser details
    this.loggedInUserDetails = this._commonHelper.getLoggedUserDetail();
    //set local storage key
    this.localStorageKeyPrefix = `${this.loggedInUserDetails?.tenantId}_${this.loggedInUserDetails?.userId}`
    
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
    this.setLastSearchFilterFromStorage();
    this.getContacts(this.pagingParams);
    this.subscribeSearchboxEvent();
    this.setIsEntityTypeDefinedFlag();
    this.workTaskSubTypeDetails = this.entitySubTypes?.find(x => x.level == 1);
    this.AccountColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ALLLISTING.EXPORT_ACCOUNT_LABEL'));
    this.dynamicColumnNameSetting = {};
    this.dynamicColumnNameSetting["AccountName"] = this.AccountColumnName;

    //set Action column show/hide dynamically
    if(!this.isEditContact && !this.isDeleteContact)
      {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = false;
      }
    });

     // get set quickview local storage config start
     this.quickViewConfig = this.getQuickViewConfig();
     if (this.quickViewConfig) {
       this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
       this.selectedContactIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
     }
     // get set quickview local storage config end
  }

  fetchContacts(): void {
    if (this.pTable) {
      this.getContacts(this.pagingParams);
    }
  }

  contactDetail(id: number): void {
    this._router.navigate(['detail/' + id]);
  }

  setRatingOptions(){
    this._commonHelper.setRatingOptions().then((response) => { this.ratingOptions = response as []; });
  }
 
  // open add popup
  addContact() {
    this.optionsForPopupDialog.size = "lg";
    this.modalRef = this._modalService.open(ContactAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.entityWorkflowId = null;
    this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.recordTypes = this.recordTypes?.filter(s => s.value != 0);
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.isShowAssignTo = true;
    this.modalRef.componentInstance.isShowWorkflow = true;
    this.modalRef.result.then((response: boolean) => {
     if (response) {
        // refresh data
        this.fetchContacts();
        }
     });
  } 

  onDeleteContact(Id) {
    let params = {
      "entityId": Id,
      "entityTypeId": this.entityTypeId
    }

    let messageText: string = "";
    this._commonHelper.showLoader();
    this._workTasksService.GetWorkTasksByEntity(params).then((res: any) => {
      this._commonHelper.hideLoader();

      let hasWorktask: boolean = res != null && res.length > 0;
      messageText = hasWorktask ? 'CRM.CONTACT.LIST.MESSAGE_CONFIRM_DELETE_WITHTASK' : 'CRM.CONTACT.LIST.MESSAGE_CONFIRM_DELETE';
      this.optionsForPopupDialog.size = "md";
      this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            if (hasWorktask) {
              this.deleteContactWithRelatedWorkTasks(Id);
            }
            else {
              this.deleteContact(Id);
            }
          }
        });
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  onChangeStatus(id, status) {
    if (!this.isEditContact) {
      return;
    }

    let messageText = status ? 'CRM.CONTACT.LIST.MESSAGE_CONFIRM_ACTIVE' : 'CRM.CONTACT.LIST.MESSAGE_CONFIRM_INACTIVE';
    let successText = status ? 'CRM.CONTACT.LIST.MESSAGE_CONTACT_ACTIVATED' : 'CRM.CONTACT.LIST.MESSAGE_CONTACT_INACTIVATED';

    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._contactService.changeStatus(id, status).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
          }
          this.getContacts(this.pagingParams);
          this._commonHelper.hideLoader();
        }, (error) => {
          this.getContacts(this.pagingParams);
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
      else {
        this.getContacts(this.pagingParams);
      }
    });
  }

  // onFilterStatus(event) {
  //   this.contactSearchFilter.status = event.value;
  //   this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ContactListKey, JSON.stringify(this.contactSearchFilter), this.localStorageKeyPrefix);
  //   this.getContacts(this.pagingParams);
  // }
  onFilterRating(event) {
    this.contactSearchFilter.rating = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ContactListKey, JSON.stringify(this.contactSearchFilter), this.localStorageKeyPrefix);
    this.getContacts(this.pagingParams);
  }

  onFilterShowStarred() {
    this.contactSearchFilter.showStarred = this.showStarred;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ContactListKey, JSON.stringify(this.contactSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getContacts(this.pagingParams);
  }

  trimFilterValue(e: any, multiSelect: MultiSelect) {
    multiSelect.filterValue = String(e.filter).trim();
    multiSelect.filterInputChild.nativeElement.value = String(e.filter).trimStart();
  }

  onFilterRecordType(event) {
    this.contactSearchFilter.recordTypeIds = event.value.toString();
    this.pagingParams.pageNo = 1;
    this.getContacts(this.pagingParams);
  }

  public onFilterShowActiveRecords() {
    this.contactSearchFilter.IsActive = this.IsActive;
    this.pagingParams.pageNo = 1;
    this.getContacts(this.pagingParams);
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchContacts();
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
      this.fetchContacts();
    }
  }

  onResetAllFilters() {
    this.contactSearchFilter.searchText = '';
    this.contactSearchFilter.recordTypeIds = null;
    // this.contactSearchFilter.status = null;
    this.contactSearchFilter.IsActive = false;
    this.contactSearchFilter.rating = null;
    this.contactSearchFilter.showStarred = false;

    this.selectedRecordTypes = null;
    this.IsActive = false;
    this.showStarred = false;

    this.pagingParams.searchString = '';
    this.pagingParams.entityRecordTypeIds = null;
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.rating = null;
    // this.pagingParams.status = null;
    this.pagingParams.IsActive = false;
    this.pagingParams.showStarred = false;
    this.getContacts(this.pagingParams);
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchContacts();
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
    this.fetchContacts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchContacts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchContacts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  //#region private methods
  private setPermissions(): void {
    this.isViewContact = this._commonHelper.havePermission(enumPermissions.ViewContact);
    this.isAddContact = this._commonHelper.havePermission(enumPermissions.AddContact);
    this.isEditContact = this._commonHelper.havePermission(enumPermissions.EditContact);
    this.isDeleteContact = this._commonHelper.havePermission(enumPermissions.DeleteContact);
    this.isViewAccount = this._commonHelper.havePermission(enumPermissions.ViewAccount);
    this.isExportContact = this._commonHelper.havePermission(enumPermissions.ExportConact);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadContactDocument);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAddOpportunity = this._commonHelper.havePermission(enumPermissions.AddOpportunity);
    this.isAddCase = this._commonHelper.havePermission(enumPermissions.AddCase);
  }

  private setColumnDefinations(): void {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'name', header: 'CRM.CONTACT.LIST.TABLE_HEADER_NAME', sort: true, visible: true },
      { field: 'phone', header: 'CRM.CONTACT.LIST.TABLE_HEADER_PHONE', sort: true, visible: true },
      { field: 'email', header: 'CRM.CONTACT.LIST.TABLE_HEADER_EMAIL', sort: true, visible: true },
      { field: 'type', header: 'CRM.CONTACT.LIST.TABLE_HEADER_TYPE', sort: true, visible: true },
      { field: 'entityrecordtypename', header: 'CRM.CONTACT.LIST.TABLE_HEADER_CONTACT_RECORDTYPE', sort: true, visible: true },
      { field: 'accountname', header: 'CRM.CONTACT.LIST.TABLE_HEADER_ACCOUNT', sort: true, visible: true },
      // { field: 'status', header: 'CRM.CONTACT.LIST.TABLE_HEADER_STATUS', sort: true },
      { field: 'id', header: '', sort: false, class: "icon--dropdown action", visible: true }
    ];

    // this._commonHelper.getTranlationData('dummyKey')
    //   .then(() => {
    //     this.cols.forEach(item => {
    //       item.header = this._commonHelper.getInstanceTranlationData(item.header);
    //     });
    //   });
  }

  private initializePagination(): void {
    this.pagingParams = new ContactsPagingParams();
    this.pagingParams.tenantId = 0;
    this.pagingParams.searchString = '';
    this.pagingParams.entityRecordTypeIds = null;
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
    // this.pagingParams.status = null;
    this.pagingParams.IsActive = this.IsActive;
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_ContactListKey, this.localStorageKeyPrefix));
    if (searchFilter != null) {
      this.contactSearchFilter = searchFilter;
      this.IsActive = this.contactSearchFilter.IsActive;
      this.showStarred = this.contactSearchFilter.showStarred;
    }

    if (this.contactSearchFilter.recordTypeIds != null && this.contactSearchFilter.recordTypeIds != '') {
      this.selectedRecordTypes = this.contactSearchFilter.recordTypeIds.split(',').map(x => Number(x)) as [];
    }
    else {
      this.selectedRecordTypes = null;
    }
    this.pagingParams.rating  = this.contactSearchFilter.rating;
    this.lastContactSearchFilter = JSON.parse(JSON.stringify(this.contactSearchFilter));
  }

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.contactSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this.fetchContacts();
      });
  }

  private getContacts(pagingParams: ContactsPagingParams): void {
    this._commonHelper.showLoader();
    this.pagingParams.searchString = this.contactSearchFilter.searchText;
    this.pagingParams.entityRecordTypeIds = this.contactSearchFilter.recordTypeIds;
    this.pagingParams.IsActive = !this.contactSearchFilter.IsActive;
    this.pagingParams.showStarred = this.contactSearchFilter.showStarred;
    this._contactService.getContacts(pagingParams)
      .then((response: any[]) => {
        if (response) {
          this.contacts = response;
          this.totalRecords = this.contacts.length > 0 ? this.contacts[0].totalRecords : 0;
          this.pTable.rows = this.pagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
          this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.contacts.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
        
          if (this.selectedContactIdForActivityCenter != null && this.selectedContactIdForActivityCenter > 0 && this.contacts.some(x=>x.id == this.selectedContactIdForActivityCenter)) {
            this.updateEntityDetails(true, this.contacts.find(x=>x.id == this.selectedContactIdForActivityCenter));
          }
          else{
            this.resetSelectedEntity();
          }
          
          this.contacts.forEach((contact: any) => {
            if (contact.phone) {
              const phoneDetail = String(contact.phone).split('|');
              if (phoneDetail.length == 2) {
                contact['countryCode'] = phoneDetail[0];
                contact['phoneNumber'] = phoneDetail[1];
                contact['phoneMask'] = String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0");
              } 
            }
          })
        }
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ContactListKey, JSON.stringify(this.contactSearchFilter), this.localStorageKeyPrefix);
  }

  private deleteContact(Id) {
    this._commonHelper.showLoader();
    this._contactService.deleteContact(Id).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.MESSAGE_CONTACT_DELETED')
      );
      this.totalRecords = this.totalRecords - 1;
      this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.pagingParams.pageSize) : 1;
      this.fetchContacts();
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

  private deleteContactWithRelatedWorkTasks(Id) {
    this._commonHelper.showLoader();
    this._contactService.deleteContactWithRelatedWorkTasks(Id).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.MESSAGE_CONTACT_DELETED')
      );
      this.totalRecords = this.totalRecords - 1;
      this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.pagingParams.pageSize) : 1;
      this.fetchContacts();
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == "contacts.entitycannotbedeleteduetosubworktaskexist") {
        this.availableSubWorkTaskTypeNamesForContactDelete = this.entitySubTypes.find(x => x.level == 2).name;
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.CONTACTS_ENTITYCANNOTBEDELETEDUETOSUBWORKTASKEXIST', { entitySubTypeName: this.availableSubWorkTaskTypeNamesForContactDelete })
        );
      } else if (error.messageCode.toLowerCase() == 'contacts.contactmodelrequired') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.CONTACTS_CONTACTMODELREQUIRED'));
      } else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.CONTACT.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }
  //#endregion 

  private setIsEntityTypeDefinedFlag() {
    const params = [{
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.Contacts
    }];

    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CONTACTTYPE, params).then((response: any) => {
      if (response.length != 0) {
        if (response.length == 1) {
          this.isEntityTypeDefined = false;
        }
        else {
          this.isEntityTypeDefined = true;
        }
      }
      else {
        this.isEntityTypeDefined = false;
      }
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }
  
  //Export Contacts listing

  exportExcel() {
    this.exportConatctList(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportConatctList(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();

    const excelExportPayload = {

      tenantId: this.pagingParams.tenantId,
      searchString: this.pagingParams.searchString,
      entityRecordTypeIds: this.pagingParams.entityRecordTypeIds,
      // status: this.pagingParams.status,
      IsActive:this.pagingParams.IsActive,
      sortColumn: this.pagingParams.sortColumn,
      sortOrder: this.pagingParams.sortOrder,
      exportType: exportType,
      rating: this.pagingParams.rating,
      pageNo: 1,
      pageSize: this._commonHelper.DefaultPageSize,
      dynamicColumnSettingJson: "",
      showStarred: this.pagingParams.showStarred

    }
    let fileName = this._commonHelper.getConfiguredEntityName('{{Contacts_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ALLLISTING.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    this._contactService.exportContactsList(excelExportPayload).then((base64String: any) => {
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

  onRowActionButtonMouseEnter() {
    this.rowActionButtonMouseHoverFlag = true;
  }

  onRowActionButtonMouseLeave() {
    this.rowActionButtonMouseHoverFlag = false;
  }


  onRowClick(rowData: any, isShowActivityCenter:boolean = null) {

    if (this.rowActionButtonMouseHoverFlag) {
      return;
    }
    const settingsJson = JSON.parse(rowData.settingsJson);
    const obj = {
      id: rowData.id,
      entityIcon: 'fas fa-address-card',
      entityName: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TITLE'),
      label1: settingsJson.Token1Text,
      label1RedirectURL: settingsJson.Token1Url,
      label2: settingsJson.Token2Text,
      label2RedirectURL: settingsJson.Token2Url,
      label3: settingsJson.Token3Text,
      label3RedirectURL: settingsJson.Token3Url,
      relatedToLabel: rowData?.entityName,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      entityRecordTypeId: rowData?.entityRecordTypeID,
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      phone: rowData?.phone,
      email: rowData?.email,
      type: rowData?.typeName,
      accountName: rowData?.accountName,
      isActive: rowData?.isActive,
      createdBy: rowData?.createdBy,
      isPaused: rowData?.isPaused,
      workTaskTypeName: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
      workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
    };

    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id;
    this.contactCreatedBy = rowData?.createdBy;

    this.selectedContactForActivityCenter = rowData;
    this.selectedContactIdForActivityCenter = rowData.id; 
    this.selectedContactIsPausedForActivityCenter = (rowData?.isPaused ?? false);
    this.selectedContactIsActive = rowData.isActive;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedRowEntityId: this.selectedRowId
    }

    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewContact);
  }

  advanceFilterVisibleChange(value: boolean) {
    this.isAdvanceFilterVisible = value;
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
  // Set card/row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Contacts_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get card/row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Contacts_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
  }

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewContact;
        this.selectedContactIdForActivityCenter = details.id;
        this.selectedContactForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedContactIsPausedForActivityCenter = (details.isPaused ?? false);
        this.selectedContactIsActive = details.isActive;
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

  private resetSelectedEntity(){
    this.isShowActivityCenter = false;
    this.selectedContactForActivityCenter = null;
    this.selectedContactIdForActivityCenter = 0;
    this.selectedContactIsPausedForActivityCenter = null;
    this.selectedContactIsActive = null;
    this.selectedRowId = 0;
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

    this._contactService.updateContactField(params).then((response) => {
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

  private prepareParamsForWorkflows() {
    return [ { name: 'EntityTypeID', type: 'int', value: Entity.Contacts } ];
  }

  private getWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Contacts}`;
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

  private getEntityRecordTypes() {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
    if (allEntityRecordTypes == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Contacts).map(x=> ({'label':x.name,'value':x.id }));
            this._commonHelper.getTranlationData('CRM.CONTACT.LIST.FILTER_OPTION_TEXT_RECORDTYPE').then((labelText)=>{
              this.recordTypes.push({ value: 0, label: labelText });
              this.recordTypes.sort((a, b) => a.value - b.value);
              this.hideRecordTypeFilter = response?.filter(x => x.entityTypeID == Entity.Contacts).map(x=> ({'label':x.name,'value':x.id }));
            });
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
            this.opportunityRecordTypes = response?.filter((s: any) => s.entityTypeID == Entity.Opportunities && (s.parentEntityTypeID == this.entityTypeId));
            this.casesRecordTypes = response?.filter(x => x.entityTypeID == Entity.Cases && x.parentEntityTypeID == this.entityTypeId);
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
      this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Contacts).map(x=> ({'label':x.name,'value':x.id }));
      this._commonHelper.getTranlationData('CRM.CONTACT.LIST.FILTER_OPTION_TEXT_RECORDTYPE').then((labelText)=>{
        this.recordTypes.push({ value: 0, label: labelText });
        this.recordTypes.sort((a, b) => a.value - b.value);
      });
      this.hideRecordTypeFilter = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Contacts).map(x=> ({'label':x.name,'value':x.id }));
      this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
      this.opportunityRecordTypes = allEntityRecordTypes?.filter((s: any) => s.entityTypeID == Entity.Opportunities && s.parentEntityTypeID == this.entityTypeId);
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
    this.modalRef.componentInstance.workflows = this.worktaskWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityWorkTaskPopup;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshWorkTaskTab = true;
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
    this.modalRef.componentInstance.relatedEntityId = this.entityDetails?.id;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.opportunityRecordTypes?.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.opportunityWorkflowList?.filter(s => s.value != 0).filter(s => s.parentEntityTypeID == Entity.Contacts || s.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityType = Entity.Contacts;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshOpporunityTab = true;
      }
    });
  }

  addCase() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CaseAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.entityDetails.id;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.casesRecordTypes.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.casesWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityCasePopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Contacts;
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
            this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
        this.opportunityWorkflowList.sort((a, b) => a.value - b.value);
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
            this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ALLLISTING.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ALLLISTING.FILTER_OPTION_TEXT_WORKFLOW') });
        this.casesWorkflowList.sort((a, b) => a.value - b.value);
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

  onStatusChange(contact) {
    if (!this.isEditContact) {
      return
    }

    let messageText = contact.isActive ? 'CRM.CONTACT.ALLLISTING.MESSAGE_CONFIRM_INACTIVE' : 'CRM.CONTACT.ALLLISTING.MESSAGE_CONFIRM_ACTIVE';
    let successText = contact.isActive ? 'CRM.CONTACT.ALLLISTING.MESSAGE_CONTACT_INACTIVATED' : 'CRM.CONTACT.ALLLISTING.MESSAGE_CONTACT_ACTIVATED';

    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._contactService.changeStatus(contact.id, !contact.isActive).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
          }
          this.getContacts(this.pagingParams);
          this._commonHelper.hideLoader();
        }, (error) => {
          this.getContacts(this.pagingParams);
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
    });
  }
}

