import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { AppointmentPagingParams } from '../../../@core/sharedModels/paging-params.model';
import * as moment from 'moment';
import { AppointmentStatus, DataSources, DownloadFileMimeType, Entity, ExportType, FileExtension, LocalStorageKey, PublicTenantSettings, RefType, UserTypeID } from '../../../@core/enum';
import { AppointmentService } from '../../../@core/sharedServices/appointment.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { ActivityDialogComponent } from '../../../@core/sharedComponents/common-activity-section/activity-dialog/activity-dialog.component';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { SettingsService } from '../../settings/settings.service';

@Component({
  selector: 'ngx-appointments-list',
  templateUrl: './appointments-list.component.html',
  styleUrls: ['./appointments-list.component.scss']
})
export class AppointmentsListComponent implements OnInit {

  // search and table element
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  userTypeID = UserTypeID;
  appointments: any[] = [];
  entityTypeId: number = Entity.Events;

  // pagination
  pagingParams: AppointmentPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;
  startDate: Date;
  endDate: Date;

  // search filter
  lastAppointmentSearchFilter: any;
  appointmentSearchFilter = {
    searchText: '',
    entityTimespan: null,
    statusIds: '',
    ownerIDs: '',
    attendeeIDs:'',
    isShowOnlyMyEvents: false,
    isStarred:false,
    activityStartDate:null,
    activityEndDate:null
  }
  IsShowOnlyMyEvents: boolean = false;
  IsStarred:boolean = false;

  // permission variable
  isViewAppointment: boolean = false;
  isAddAppointment: boolean = false;
  isEditAppointment: boolean = false;
  isDeleteAppointment: boolean = false;
  isExportAppointment: boolean = false;

  // table Column
  cols: any[];
  isShowActionColumn: boolean = false;
  private modalRef: NgbModalRef | null;
  private optionsForPopupDialog: any = {
    size: 'md',
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  loggedInUserDetails: any;
  localStorageKeyPrefix: string = "";
  rowActionButtonMouseHoverFlag: boolean = false;
  appointmentOptions: any;
  recordTypeId: number;

  userList: any = [];
  attendeesList: any = [];
  entityTimespansoptions: any = [];
  selectedUser = null;
  selectedAttendees = null;
  selectedStatus = null;
  eventStatusOptions: any;

  //right side activity menu
  isShowActivityCenter: boolean = false;
  selectedRowId: number = 0;
  entityWorkflowId: number = 0;
  entityDetails: any;
  selectedAppointmentForActivityCenter: any;
  selectedAppointmentIdForActivityCenter: number = 0;
  selectedAppointmentIsCanceledForActivityCenter: boolean = false;
  selectedAppointmentIsCompletedForActivityCenter: boolean = false;
  selectedAppointmentIsActive: boolean = true;
  isAdvanceFilterVisible: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  entityRecordTypeId: number;
  refreshActivityCenter: boolean = false;
  ratingOptions: any [] = [];
  quickViewConfig: any;
  keyfieldResponseData: any;
  currencySymbol: any = null;
  hoursInDay: number = null;
  rangeDates: any[] = [];
  dateSelectOptionsButtonBar = ['today', 'yesterday', 'last7days'];

  constructor(
    private _router: Router,
    public _commonHelper: CommonHelper,
    private _modalService: NgbModal,
    private _appointmentsService: AppointmentService,
    private _dataSourceService: DatasourceService,
    private _commonService: CommonService,
    private _confirmationDialogService: ConfirmationDialogService,
    private _settingsService: SettingsService) {

    this.setPermissions();
    this.setColumnDefinations();
    this.initializePagination();
    this.getOwnerToUsers(null, 1, '');
    this.getAttendees(null, 1, '');
    this.getEntityTimespans();
    this.getEventStatusRef();
    this.getEventOptionsRef();
  }

  ngOnInit(): void {
    //get user details
    this.loggedInUserDetails = this._commonHelper.getLoggedUserDetail();
    //set local storage prefix
    this.localStorageKeyPrefix = `${this.loggedInUserDetails.tenantId}_${this.loggedInUserDetails.userId}`;

    this.setLastSearchFilterFromStorage();
    this.getAppointments(this.pagingParams);
    this.subscribeSearchboxEvent();
    this.getCurrencySymbol()
    this.getHoursInDay();

     // get set quickview local storage config start
     this.quickViewConfig = this.getQuickViewConfig();
     if (this.quickViewConfig) {
       this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
       this.selectedAppointmentIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
     }
     // get set quickview local storage config end
  }

  fetchAppointments(): void {
    if (this.pTable) {
      this.getAppointments(this.pagingParams);
    }
  }

  appointmentDetail(id: number): void {
    this._router.navigate(['detail/' + id]);
  }

  onFilterRecentActivity(event) {
    this.appointmentSearchFilter.entityTimespan = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AppointmentsKey, JSON.stringify(this.appointmentSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getAppointments(this.pagingParams);
  }

  public onFilterStatus(event) {
    this.selectedStatus = event.value;
    this.appointmentSearchFilter.statusIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AppointmentsKey, JSON.stringify(this.appointmentSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getAppointments(this.pagingParams);
  }

  onFilterCreated(event) {
    if (event == null) {
      this.rangeDates = [];
      this.appointmentSearchFilter.activityStartDate = null;
      this.appointmentSearchFilter.activityEndDate = null;
      this.pagingParams.pageNo = 1;
      this.getAppointments(this.pagingParams);
    }
    else {
      if (event[0] < this._commonHelper.globalMinDate || event[0] > this._commonHelper.globalMaxDate || event[1] > this._commonHelper.globalMaxDate || event[1] < this._commonHelper.globalMinDate) {
        this.rangeDates = [];
        this.appointmentSearchFilter.activityStartDate = null;
        this.appointmentSearchFilter.activityEndDate = null;
        this.pagingParams.pageNo = 1;
        this.getAppointments(this.pagingParams);
      }
      else
      {
      this.startDate = event[0];
      this.endDate = event[1];
      this.appointmentSearchFilter.activityStartDate = event[0] != null ? moment(event[0]).format('YYYY-MM-DD') : null;
      this.appointmentSearchFilter.activityEndDate = event[1] != null ? moment(event[1]).format('YYYY-MM-DD') : null;
      this.pagingParams.pageNo = 1;
      this.getAppointments(this.pagingParams);
    }
  }
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AppointmentsKey, JSON.stringify(this.appointmentSearchFilter), this.localStorageKeyPrefix);
  }

  onResetAllFilters() {
    this.appointmentSearchFilter.searchText = '';
    this.appointmentSearchFilter.entityTimespan = null;
    this.appointmentSearchFilter.statusIds = null;
    this.selectedStatus = [];
    this.appointmentSearchFilter.ownerIDs = null;
    this.appointmentSearchFilter.attendeeIDs = null;
    this.selectedUser = [];
    this.selectedAttendees = [];
    this.appointmentSearchFilter.isShowOnlyMyEvents = false;
    this.IsShowOnlyMyEvents = false;
    this.appointmentSearchFilter.isStarred = false;
    this.IsStarred = false;
    this.appointmentSearchFilter.activityStartDate = null;
    this.appointmentSearchFilter.activityEndDate = null;
    this.rangeDates = [];

    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'created';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.entityTimespan = null;
    this.pagingParams.statusIds = null;
    this.pagingParams.ownerIDs = null;
    this.pagingParams.attendeeIDs = null;
    this.pagingParams.isShowOnlyMyEvents = false;
    this.pagingParams.isStarred = false;
    this.pagingParams.activityStartDate = null;
    this.pagingParams.activityEndDate = null;
    this.getAppointments(this.pagingParams);
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchAppointments();
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
      this.fetchAppointments();
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchAppointments();
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
    this.fetchAppointments();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchAppointments();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchAppointments();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  onChangeIsStarred() {
    this.appointmentSearchFilter.isStarred = this.IsStarred;
    this.pagingParams.pageNo = 1;
    this.getAppointments(this.pagingParams);
  }

  onFilterShowonlymyEventsRecords() {
    this.appointmentSearchFilter.isShowOnlyMyEvents = this.IsShowOnlyMyEvents;
    this.pagingParams.pageNo = 1;
    this.getAppointments(this.pagingParams);
  }
  
  public OnFilterownere(e?: any, selectedUser?: any) {
    this.getOwnerToUsers(selectedUser?.toString(), 0, e.filter);
  }

  public OnChangeowner(event) {
    this.appointmentSearchFilter.ownerIDs = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AppointmentsKey, JSON.stringify(this.appointmentSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getAppointments(this.pagingParams);
  }

  public OnFilterattendee(e?: any, selectedAttendees?: any) {
    this.getOwnerToUsers(selectedAttendees?.toString(), 0, e.filter);
  }

  public OnChangeattendee(event) {
    this.appointmentSearchFilter.attendeeIDs = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AppointmentsKey, JSON.stringify(this.appointmentSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getAppointments(this.pagingParams);
  }

  addAppointment() {
    this.optionsForPopupDialog.size = "xl";
    // avoid multiple popup open
    if (this._modalService.hasOpenModals()) {
      return;
    }
    this.modalRef = this._modalService.open(ActivityDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.entityRecordTypeID = this.recordTypeId;
    this.modalRef.componentInstance.fromAppointment = true;
    this.modalRef.componentInstance.taskType = 'MEETING';
    this.modalRef.componentInstance.title = this._commonHelper.getInstanceTranlationData('ACTIVITY.APPOINTMENTS_DIALOG.TITLE');
    this.modalRef.componentInstance.isActivityDropdownReadOnly = false;
    this.modalRef.result.then(response => {
      if (response != undefined) {
        this.fetchAppointments();
      }
    });
  }

  EditAppointment(rowdata) {
     let title = this._commonHelper.getInstanceTranlationData('ACTIVITY.APPOINTMENTS_DIALOG.TITLE');
    this.optionsForPopupDialog.size = "xl";
     // avoid multiple popup open
     if (this._modalService.hasOpenModals()) {
       return;
     }
     let appointmentId = rowdata.id;
     this.modalRef = this._modalService.open(ActivityDialogComponent, this.optionsForPopupDialog);
     this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
     this.modalRef.componentInstance.fromAppointment = true;
     this.modalRef.componentInstance.taskType = 'MEETING';
     this.modalRef.componentInstance.title = title;
     this.modalRef.componentInstance.activityID = appointmentId;
     this.modalRef.componentInstance.taskMode = "EDIT";
     this.modalRef.result.then(response => {
       if (response != undefined) {
          this.fetchAppointments();
       }
     });
   }

  //#region private methods
  private setPermissions(): void {
    this.isViewAppointment = this._commonHelper.havePermission(enumPermissions.ViewAppointment);
    this.isAddAppointment = this._commonHelper.havePermission(enumPermissions.AddAppointment);
    this.isEditAppointment = this._commonHelper.havePermission(enumPermissions.EditAppointment);
    this.isDeleteAppointment = this._commonHelper.havePermission(enumPermissions.DeleteAppointment);
    this.isExportAppointment=this._commonHelper.havePermission(enumPermissions.ExportAppointment)
    this.isShowActionColumn = this.isDeleteAppointment || this.isEditAppointment;
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadAppointmentDocument);
    
  }

  private setColumnDefinations(): void {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display'},
      { field: 'subject', header: 'CRM.APPOINTMENT.LIST.TABLE_HEADER_SUBJECT', sort: true, visible: true },
      { field: 'activityDate', header: 'CRM.APPOINTMENT.LIST.TABLE_HEADER_DATE', sort: true, visible: true },
      { field: 'activityStartDate', header: 'CRM.APPOINTMENT.LIST.TABLE_HEADER_START_TIME', sort: false, visible: true },
      { field: 'activityEndDate', header: 'CRM.APPOINTMENT.LIST.TABLE_HEADER_END_TIME', sort: false, visible: true },
      { field: 'entityName', header: 'CRM.APPOINTMENT.LIST.TABLE_HEADER_RELATEDTO', sort: true, visible: true },
      { field: 'location', header: 'CRM.APPOINTMENT.LIST.TABLE_HEADER_LOCATION', sort: true, visible: true },
      { field: 'statusName', header: 'CRM.APPOINTMENT.LIST.TABLE_HEADER_STATUS', sort: true, visible: true },
      { field: 'ownerUserName', header: 'CRM.APPOINTMENT.LIST.TABLE_HEADER_OWNER', sort: true, visible: true },
      { field: 'attendees', header: 'CRM.APPOINTMENT.LIST.TABLE_HEADER_ATTENDEE', sort: false, visible: true },
      { field: 'id', header: '', sort: false, class: "icon--dropdown action", visible: true }
    ];

    //set Action column show/hide dynamically
    if(!this.isDeleteAppointment)
      {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = false;
      }

    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.cols.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private initializePagination(): void {
    this.pagingParams = new AppointmentPagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'created';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
    this.pagingParams.isShowOnlyMyEvents = this.IsShowOnlyMyEvents;
    this.pagingParams.isStarred = this.IsStarred;
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_AppointmentsKey, this.localStorageKeyPrefix));
    if (searchFilter != null) {
      this.appointmentSearchFilter = searchFilter;
      if((this.rangeDates.length == 0) && (this.appointmentSearchFilter.activityStartDate!=null || this.appointmentSearchFilter.activityEndDate!=null))
      {
          this.startDate = moment(new Date(this.appointmentSearchFilter.activityStartDate)).toDate();
          if(this.appointmentSearchFilter.activityEndDate!=null){
            this.endDate = moment(new Date(this.appointmentSearchFilter.activityEndDate)).toDate();
          }
          this.rangeDates.push(this.startDate);
          this.rangeDates.push(this.endDate);
      }
      if (this.appointmentSearchFilter.statusIds != null && this.appointmentSearchFilter.statusIds != '') {
        this.selectedStatus = this.appointmentSearchFilter.statusIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedStatus = null;
      }
      if (this.appointmentSearchFilter.ownerIDs != null && this.appointmentSearchFilter.ownerIDs != '') {
        this.selectedUser = this.appointmentSearchFilter.ownerIDs.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedUser = null;
      }
      if (this.appointmentSearchFilter.attendeeIDs != null && this.appointmentSearchFilter.attendeeIDs != '') {
        this.selectedAttendees = this.appointmentSearchFilter.attendeeIDs.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedAttendees = null;
      }
      this.IsShowOnlyMyEvents = this.appointmentSearchFilter.isShowOnlyMyEvents;
      this.IsStarred = this.appointmentSearchFilter.isStarred;
    }
    this.lastAppointmentSearchFilter = JSON.parse(JSON.stringify(this.appointmentSearchFilter));
  }

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.appointmentSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this.fetchAppointments();
      });
  }

  private getAppointments(pagingParams: AppointmentPagingParams): void {
    this._commonHelper.showLoader();
    this.pagingParams.searchString = this.appointmentSearchFilter.searchText;
    this.pagingParams.entityTimespan = this.appointmentSearchFilter.entityTimespan;
    this.pagingParams.activityStartDate = this.appointmentSearchFilter.activityStartDate;
    this.pagingParams.activityEndDate = this.appointmentSearchFilter.activityEndDate;
    this.pagingParams.statusIds = this.appointmentSearchFilter.statusIds;
    this.pagingParams.ownerIDs = this.appointmentSearchFilter.ownerIDs;
    this.pagingParams.attendeeIDs = this.appointmentSearchFilter.attendeeIDs;
    this.pagingParams.isStarred = this.appointmentSearchFilter.isStarred;
    this.pagingParams.isShowOnlyMyEvents = this.appointmentSearchFilter.isShowOnlyMyEvents;

    this._appointmentsService.getAllAppointments(pagingParams).then((response: any[]) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.appointments = response;
          this.appointments.forEach(data => {
            data.relatedToIconToolTip = this._commonHelper.entityTypeList.find(entityType => entityType['id'] == data['entityTypeID'])?.displayName.toString().trim();
            if(data.statusID == AppointmentStatus.Completed)
            {
              data['isCompleted'] = true;
            }
            if(data.statusID == AppointmentStatus.Canceled)
            {
                data['isCanceled'] = true;
            }
            let attendeeIDsArrayValues = data?.attendeeIDs?.split(',');
            data.isShowMoreButton = false;
            if(attendeeIDsArrayValues){
              if(attendeeIDsArrayValues.length > 3){
                data.attendeeIDsArray = attendeeIDsArrayValues.slice(0,3);
                data.attendeeIDsArrayMoreButton = attendeeIDsArrayValues.slice(3,attendeeIDsArrayValues.length);
                data.isShowMoreButton = true;
              } else{
                data.attendeeIDsArray = attendeeIDsArrayValues
              }
            }
            data.isShowBellIcon = data?.reminderDataJson == null ? false : true;
          });
          this.totalRecords = this.appointments.length > 0 ? this.appointments[0].totalRecords : 0;
          this.pTable.rows = this.pagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
          this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.appointments.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
         
          if (this.selectedAppointmentIdForActivityCenter != null && this.selectedAppointmentIdForActivityCenter > 0 && this.appointments.some(x => x.id == this.selectedAppointmentIdForActivityCenter)) {
            this.updateEntityDetails(true, this.appointments.find(x => x.id == this.selectedAppointmentIdForActivityCenter));
          }
          else {
            this.resetSelectedEntity();
          }
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AppointmentsKey, JSON.stringify(this.appointmentSearchFilter), this.localStorageKeyPrefix);
    }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('CRM.APPOINTMENT.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }
  
  private getOwnerToUsers(selectedUserId, includeAllUsers, searchString: any) {
    return new Promise((resolve, reject) => {
      // prepare params
      let params = this.prepareParamsForOwnerToUsersAllCase(selectedUserId, includeAllUsers, searchString);
      // call datasource service with params
      this._commonHelper.showLoader();
      return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALLAPPOINTMENTOWNER, params).then((responce: any) => {
        if (responce) {
          this.userList = responce;
          this.userList.sort((a, b) => a.value - b.value);
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

  private prepareParamsForOwnerToUsersAllCase(ownerTo, includeAllUsers=1, searchString=null) {
    const params = [];
    const paramItem = {
      name: 'SelectedUserID',
      type: 'int',
      value: ownerTo
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
  
  private getAttendees(selectedUserId, includeAllUsers , searchString): void {
    this._commonHelper.showLoader();
    if(selectedUserId==null)
    {
      this._commonHelper.hideLoader();
    }
    const params = this.prepareParamsForEventsAttendees(selectedUserId, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.EVENTATTENDEES, params).then(
      (response: any) => {
        if (response) {
          this.attendeesList = response as [];
        }
          this._commonHelper.hideLoader();
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private prepareParamsForEventsAttendees(attendeesId, includeAllUsers= 1, searchString = null) {
    const params = [];
    const paramItem = {
      name: 'SelectedUserID',
      type: 'int',
      value: attendeesId,
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

  //Export Appointments Listing
  exportExcel(){
    this.exportAppointments(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportAppointments(exportType: string, fileExtension: string, fileMimeType: string){
    this._commonHelper.showLoader();

    const excelExportPayload = {
      searchString: this.pagingParams.searchString,
      entityTimespan:this.pagingParams.entityTimespan,
      statusIds:this.pagingParams.statusIds,
      ownerIDs:this.pagingParams.ownerIDs,
      attendeeIDs:this.pagingParams.attendeeIDs,
      isShowOnlyMyEvents:this.pagingParams.isShowOnlyMyEvents,
      isStarred:this.pagingParams.isStarred,
      sortColumn: this.pagingParams.sortColumn,
      sortOrder: this.pagingParams.sortOrder,
      exportType: exportType,
      pageNo: 1,
      pageSize: this._commonHelper.DefaultPageSize
    }
  
    let fileName = this._commonHelper.getConfiguredEntityName('{{Events_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('CRM.APPOINTMENT.LIST.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    
    this._appointmentsService.exportAppointments(excelExportPayload).then((base64String: any) => {
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

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  onRowActionButtonMouseEnter() {
    this.rowActionButtonMouseHoverFlag = true;
  }

  onRowActionButtonMouseLeave() {
    this.rowActionButtonMouseHoverFlag = false;
  }

  onDeleteAppointmentClick(appointmentId) {
    this._confirmationDialogService.confirm('CRM.APPOINTMENT.DETAIL.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._appointmentsService.deleteAppointment(appointmentId).then(() => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('CRM.APPOINTMENT.DETAIL.MESSAGE_APPOINTMENT_DELETED')
          ); // Redirect Appointment Listing Page.
          this._router.navigateByUrl('/appointments/list');
        },
          (error: any) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          }
        );
      }
    });
  }

  getEntityTimespans(): Promise<any> {
    const params = { refType: RefType.EntityTimespan };
    return new Promise((resolve, reject) => {
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.EntityTimespan}`;
      // get data
      const refTypeEntityTimespan = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey, this.localStorageKeyPrefix));
      if (refTypeEntityTimespan == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params)
          .then((response: any) => {
            this._commonHelper.hideLoader();
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
            this.entityTimespansoptions = response
            resolve(true);
          }, (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      }
      else {
        this.entityTimespansoptions = refTypeEntityTimespan;
        resolve(true);
      }
    });
  }
  
  getEventStatusRef() {
    return new Promise((resolve, reject) => {
      let params = { refType: RefType.EventStatus };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.EventStatus}`;
      // get data
      const refTypeEventStatus = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeEventStatus == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {

            this.eventStatusOptions = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.eventStatusOptions));
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
        this.eventStatusOptions = refTypeEventStatus;
        resolve(null);
      }
    });
  }
  //#endregion

  // Setup Quick View
  onMoreDetailsClick(isShowActivityCenter: boolean) {
    this.isShowActivityCenter = isShowActivityCenter;
    if (!this.quickViewConfig) {
      this.quickViewConfig = { isQuickViewOpen: this.isShowActivityCenter }
    }
    else {
      this.quickViewConfig.isQuickViewOpen = this.isShowActivityCenter;
    }
    this.setQuickViewConfig();
  }

  onRowClick(rowData: any, isShowActivityCenter:boolean = null) {
    
    if (this.rowActionButtonMouseHoverFlag) {
      return;
    }
    const settingsJson = JSON.parse(rowData.settingsJson);
    const obj = {
      id: rowData.id,
      entityIcon: 'fas fa-calendar-alt',
      entityName: this._commonHelper.getInstanceTranlationData('CRM.APPOINTMENT.DETAIL.TITLE'),
      label1: settingsJson.Token1Text,
      label1RedirectURL: settingsJson.Token1Url,
      label2: settingsJson.Token2Text,
      label2RedirectURL: settingsJson.Token2Url,
      label3: settingsJson.Token3Text,
      label3RedirectURL: settingsJson.Token3Url,
      relatedToLabel: rowData?.entityName,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      entityRecordTypeId: rowData?.entityRecordTypeID,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      relatedToRedirectURL: this.onRelatedToClick(rowData)
    };

    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id;

    this.selectedAppointmentForActivityCenter = rowData;
    this.selectedAppointmentIdForActivityCenter = rowData.id;
    this.selectedAppointmentIsCompletedForActivityCenter = rowData?.isCompleted;
    this.selectedAppointmentIsCanceledForActivityCenter = rowData?.isCanceled;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedRowEntityId: this.selectedRowId
    }
    
    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewAppointment);
  }

  onRelatedToClick(appointment) {
    // check logged in user have permission to view related entity details
    if (!this._commonHelper.isUserHaveViewPermissionOfRelatedEntity(appointment.entityTypeID)) {
      return this._router.url;
    }

    // if not undefined then redirect
    if (appointment.entityID != undefined) {
      return '/' + this._commonHelper.getRouteNameByEntityTypeId(appointment.entityTypeID).toLowerCase() + '/details/' + appointment.entityID;
    }
    return this._router.url;
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

    this._appointmentsService.updateAppointmentField(params).then((response) => {
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

   // Set row item selection and quick view status 
   setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Appointments_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Appointments_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
  }

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewAppointment;
        this.selectedAppointmentIdForActivityCenter = details.id;
        this.selectedAppointmentIsCompletedForActivityCenter = details?.isCompleted;
        this.selectedAppointmentIsCanceledForActivityCenter = details?.isCanceled;
        this.selectedAppointmentForActivityCenter = this._commonHelper.cloningObject(details);
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

  private resetSelectedEntity() {
    this.isShowActivityCenter = false;
    this.selectedAppointmentForActivityCenter = null;
    this.selectedAppointmentIdForActivityCenter = 0;
    this.selectedAppointmentIsCompletedForActivityCenter = null;
    this.selectedAppointmentIsCanceledForActivityCenter = null;
    this.selectedRowId = 0;
  }

  getEventOptionsRef(): any {
    return new Promise((resolve, reject) => {
      let params = { entityTypeId: this.entityTypeId };
      // get data
      const entityRecordTypeForEvents = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.EventRecordTypeKey));
      if (entityRecordTypeForEvents == null) {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypesByEntityTypeId(params).then((response: any) => {
          if (response) {
            this.appointmentOptions = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.EventRecordTypeKey, JSON.stringify(this.appointmentOptions));
            this.recordTypeId = this.appointmentOptions.find(item => item.code == 'APPOINTMENT').id;
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
        this.appointmentOptions = entityRecordTypeForEvents;
        this.recordTypeId = this.appointmentOptions.find(item => item.code == 'APPOINTMENT').id;
        resolve(null);
      }
    });
  }
  
}

