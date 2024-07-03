import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AddMiscTaskComponent } from '../add-misc-task/add-misc-task.component';
import { MiscTaskPagingParams } from '../../../@core/sharedModels/paging-params.model';
import { WorkTasksService } from '../../worktasks/worktasks.service';
import { Table } from 'primeng/table';
import { Paginator } from 'primeng/paginator';
import { Router } from '@angular/router';
import { DataSources, DownloadFileMimeType, Entity, ExportType, FileExtension, LocalStorageKey, PublicTenantSettings, RefType, UserTypeID } from '../../../@core/enum';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { debounceTime, filter, fromEvent, map } from 'rxjs';
import * as moment from 'moment';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';
import { SettingsService } from '../../settings/settings.service';

@Component({
  selector: 'ngx-misc-task-list',
  templateUrl: './misc-task-list.component.html',
  styleUrls: ['./misc-task-list.component.scss']
})
export class MiscTaskListComponent implements OnInit {

  @ViewChild('searchTextInput') searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  isListWorkTasks: boolean;
  isAddWorkTask: boolean;
  isViewWorkTask: boolean;
  isDeleteWorkTask: boolean;
  isEditWorkTask: boolean;
  isViewAllMiscTasks: boolean;
  isExportWorkTasks: boolean;

  isInitialLoading: boolean = true;

  //For Model Ref
  modalRef: NgbModalRef | null;
  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  pagingParams: MiscTaskPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;

   // search filter
   workTaskSearchFilter = {
     searchText: '',
     reasonIds: null,
     startDate: null,
     endDate: null,
     assignToUserIds: null,
   };
   
  workTasks: any[] = [];

  // table Column
  cols: any[];
  isShowActionColumn: boolean = false;

  workTaskReasons: any[] = [];
  selectedReasons : any[] = [];

  userList: any[] = [];
  selectedUser = null;

  storageKey: string = LocalStorageKey.Filters_MiscTasksKey;

  minEndDate: Date;
  maxEndDate: Date;
  privacyLevel: number;
  localStoragePrefix: string = "";
  userTypeID = UserTypeID;

  constructor(public _commonHelper: CommonHelper,
    private _modalService: NgbModal, private _workTasksService: WorkTasksService,
    private _router: Router,
    private _commonService: CommonService,
    private _dataSourceService: DatasourceService,
    private _confirmationDialogService: ConfirmationDialogService,
    private _fileSignedUrlService: FileSignedUrlService,
    private _settingsService: SettingsService) {
    this.checkPermission();
    this.initializePagination();
    this.setColumnDefinitions();
    this.minEndDate = this._commonHelper.globalMinDate;
    this.maxEndDate = this._commonHelper.globalMaxDate;
  }

  ngOnInit(): void {

    const _loggedInUser = this._commonHelper.getLoggedUserDetail();

    //set local storage prefix
    this.localStoragePrefix = `${_loggedInUser?.tenantId}_${_loggedInUser?.userId}`;

    Promise.all([
      this.getWorkTaskReason(),
      this.getAssignedToUsers(''),
      this.getTenantSettingsForPrivacyLevel()
    ]).then((results: any) => {
      this.setLastSearchFilterFromStorage();
      this.getAllMiscTask(this.pagingParams);
      this.subscribeSearchBoxEvent();
      this.privacyLevel = +results[8];
    });
  }

  private getWorkTaskReason(): Promise<any> {
    return new Promise((resolve, reject) => {
      const params = { refType: RefType.WorkTaskReason };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.WorkTaskReason}`;

      const workTaskReasons = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (workTaskReasons == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params)
          .then((response: any) => {
            this._commonHelper.hideLoader();
            this.workTaskReasons = response as [];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
            this.isInitialLoading = true;
            resolve(null);
          }, (error) => {
            this._commonHelper.hideLoader();
            this.isInitialLoading = false;
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      }
      else {
        this.workTaskReasons = workTaskReasons;
        resolve(null);
      }
    });
  }

  private getAssignedToUsers(searchString: string) {
    return new Promise((resolve, reject) => {

      if (!this.isViewAllMiscTasks) {
        return resolve(null);
      }
      
      const params = this.prepareParamsForAssignedToUsers(searchString);
      
      this._commonHelper.showLoader();
      return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALLWORKTASKASSIGNEDTO, params).then((response: any) => {
        if (response) {
          this.userList = response;
          this.userList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('WORKTASK.MISCELINIOUSTASK.LIST.FILTER_OPTION_TEXT_ASSIGNEDTO')});
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

  private getAllMiscTask(pagingParams: MiscTaskPagingParams) {
    this._commonHelper.showLoader();

    pagingParams.searchString = this.workTaskSearchFilter.searchText;
    pagingParams.reasonIds = this.workTaskSearchFilter.reasonIds;

    if (this.workTaskSearchFilter.startDate) {
      pagingParams.startDate = new Date(moment(this.workTaskSearchFilter.startDate).format("YYYY-MM-DD"));
    }

    if(this.workTaskSearchFilter.endDate) {
      pagingParams.endDate = new Date(moment(this.workTaskSearchFilter.endDate).format("YYYY-MM-DD"));
    }
  
    if (this.isViewAllMiscTasks) {
      pagingParams.assignToUserIds = this.workTaskSearchFilter.assignToUserIds;
      pagingParams.showAllTasks = true;
    } else {
      pagingParams.assignToUserIds = null;
      pagingParams.showAllTasks = false;
    }

    this._workTasksService.getAllMiscTasks(pagingParams).then((response: any) => {
      if (response) {
        this.workTasks = response;
        this.totalRecords = this.workTasks.length > 0 ? response[0].totalRecords : 0;
        this.pTable.rows = pagingParams.pageSize;
        this.totalPages = Math.ceil(this.totalRecords / pagingParams.pageSize);
        this.end = pagingParams.pageNo == this.totalPages ? this.totalRecords : pagingParams.pageNo * pagingParams.pageSize;
        this.start = this.end == this.totalRecords ? (this.totalRecords - this.workTasks.length + 1) : (this.end - pagingParams.pageSize) + 1;

        this._fileSignedUrlService.getFileSingedUrl(this.workTasks, 'assignedToImagePath', 'assignedToSignedUrl', Entity.Users);
      }
      this._commonHelper.hideLoader();
    }, (error) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(error.message);
    });
  }

  private checkPermission() {
    this.isListWorkTasks = this._commonHelper.havePermission(enumPermissions.ListWorkTasks);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isViewWorkTask = this._commonHelper.havePermission(enumPermissions.ViewWorkTask);
    this.isDeleteWorkTask = this._commonHelper.havePermission(enumPermissions.DeleteWorkTask);
    this.isEditWorkTask = this._commonHelper.havePermission(enumPermissions.EditWorkTask);
    this.isViewAllMiscTasks = this._commonHelper.havePermission(enumPermissions.ViewAllMiscTasks);
    this.isExportWorkTasks = this._commonHelper.havePermission(enumPermissions.ExportWorkTasks);
    this.isShowActionColumn = this.isEditWorkTask || this.isDeleteWorkTask;
  }

  private initializePagination(): void {
    this.pagingParams = new MiscTaskPagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'taskNumber';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private setColumnDefinitions(): void {
    this.cols = [
      { field: 'taskNumber', header: 'WORKTASK.MISCELINIOUSTASK.LIST.TABLE_HEADER_TASK_NUMBER', visible: true, sort: true },
      { field: 'reason', header: 'WORKTASK.MISCELINIOUSTASK.LIST.TABLE_HEADER_REASON', visible: true, sort: true },
      { field: 'description', header: 'WORKTASK.MISCELINIOUSTASK.LIST.TABLE_HEADER_DESCRIPTION', visible: true, sort: true },
      { field: 'assignedToName', header: 'WORKTASK.MISCELINIOUSTASK.LIST.TABLE_HEADER_ASSIGNEDTO', visible: true, sort: true },
      { field: 'startTime', header: 'WORKTASK.MISCELINIOUSTASK.LIST.TABLE_HEADER_STARTDATE', visible: true, sort: true },
      { field: 'endTime', header: 'WORKTASK.MISCELINIOUSTASK.LIST.TABLE_HEADER_ENDDATE', visible: true, sort: true },
      { field: 'duration', header: 'WORKTASK.MISCELINIOUSTASK.LIST.TABLE_HEADER_DURATION', visible: true, sort: true },
      { field: 'created', header: 'WORKTASK.MISCELINIOUSTASK.LIST.TABLE_HEADER_CREATED', visible: true, sort: true },
      { field: 'id', header: '', visible: true, sort: false, class: "action ", display: 'td-display' }
    ];

    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.cols.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private prepareParamsForAssignedToUsers(searchString) {
    const params = [];
    params.push({ name: 'SelectedUserID ', type: 'int', value: null });
    params.push({ name: 'IncludeAllUsers', type: 'bit', value: 1 });
    params.push({ name: 'SearchString', type: 'string', value: searchString }); 
    return params;
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('WORKTASK.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_MiscTasksKey, this.localStoragePrefix));
    if (searchFilter != null) {
      this.workTaskSearchFilter = searchFilter;
      
      if (this.workTaskSearchFilter.startDate) {
        this.workTaskSearchFilter.startDate = new Date(moment(this.workTaskSearchFilter.startDate).format('YYYY-MM-DD'));
        this.minEndDate = this.workTaskSearchFilter.startDate;
      }

      if (this.workTaskSearchFilter.endDate) {
        this.workTaskSearchFilter.endDate = new Date(moment(this.workTaskSearchFilter.endDate).format('YYYY-MM-DD'));
      }

      if (this.workTaskSearchFilter.reasonIds != null && this.workTaskSearchFilter.reasonIds != '') {
        this.selectedReasons = this.workTaskSearchFilter.reasonIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedReasons = null;
      }

      if (this.workTaskSearchFilter.assignToUserIds != null && this.workTaskSearchFilter.assignToUserIds != '') {
        this.selectedUser = this.workTaskSearchFilter.assignToUserIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedUser = null;
      }
    }
  }

  // open add popup
  addMiscTask() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(AddMiscTaskComponent, this.optionsForPopupDialog);
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        if (this.pTable) {
          this.getAllMiscTask(this.pagingParams);
        }
      }
    });
  }
  
  deleteWorkTask(workTaskId) {

    const optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('WORKTASK.MISCELINIOUSTASK.LIST.MESSAGE_CONFIRM_WORKTASK_DELETE', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._workTasksService.deleteWorkTask(workTaskId).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('WORKTASK.MISCELINIOUSTASK.LIST.MESSAGE_WORKTASK_DELETE')
            );
            this.totalRecords = this.totalRecords - 1;
            this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/this.pagingParams.pageSize) : 1;
            // get work tasks
            this.getAllMiscTask(this.pagingParams);
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }
      })
      .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.MISCELINIOUSTASK.LIST.WORKTASK_DISMISS_DIALOG')));
  }

  //#region Pagination Utility
  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.getAllMiscTask(this.pagingParams);
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
      this.getAllMiscTask(this.pagingParams);
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.getAllMiscTask(this.pagingParams);
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
    this.getAllMiscTask(this.pagingParams);
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.getAllMiscTask(this.pagingParams);
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getAllMiscTask(this.pagingParams);
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }
  //#endregion 

  //#region  Filter Utility
  onFilterAssignTo(event) {
    this.workTaskSearchFilter.assignToUserIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_MiscTasksKey, JSON.stringify(this.workTaskSearchFilter), this.localStoragePrefix);
    this.pagingParams.pageNo = 1;
    this.getAllMiscTask(this.pagingParams);
  }

  assignedToOnFilter(e) {
    this.getAssignedToUsers(e.filter); 
  }

  onFilterReasons(event) {
    this.workTaskSearchFilter.reasonIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_MiscTasksKey, JSON.stringify(this.workTaskSearchFilter), this.localStoragePrefix);
    this.pagingParams.pageNo = 1;
    this.getAllMiscTask(this.pagingParams);
  }

  private subscribeSearchBoxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.workTaskSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_MiscTasksKey, JSON.stringify(this.workTaskSearchFilter), this.localStoragePrefix);
        this.getAllMiscTask(this.pagingParams);
      });
  }

  onResetAllFilters() {
    this.workTaskSearchFilter.searchText = '';
    this.workTaskSearchFilter.reasonIds = null;
    this.workTaskSearchFilter.startDate = null;
    this.workTaskSearchFilter.endDate = null;
    this.workTaskSearchFilter.assignToUserIds = null;
    
    this.selectedReasons = null;
    this.selectedUser = null;
    this.minEndDate = this._commonHelper.globalMinDate;

    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'taskNumber';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.reasonIds = null;
    this.pagingParams.startDate = null;
    this.pagingParams.endDate = null;
    this.pagingParams.assignToUserIds = null;

    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_MiscTasksKey, JSON.stringify(this.workTaskSearchFilter), this.localStoragePrefix);
    this.getAllMiscTask(this.pagingParams);
  }

  onStartDateChanged(startDate: Date) {
    if (startDate) {
      this.minEndDate = startDate;
      if (this.workTaskSearchFilter.endDate) {
        if (new Date(moment(this.workTaskSearchFilter.endDate).format('YYYY-MM-DD')) < startDate) {
          this.workTaskSearchFilter.endDate = null;
        }
      } 
      
      this.pagingParams.pageNo = 1;
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_MiscTasksKey, JSON.stringify(this.workTaskSearchFilter), this.localStoragePrefix);
      this.getAllMiscTask(this.pagingParams);
    }
  }

  onEndDateChanged(event: any) {
    if (event) {
      this.pagingParams.pageNo = 1;
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_MiscTasksKey, JSON.stringify(this.workTaskSearchFilter), this.localStoragePrefix);
      this.getAllMiscTask(this.pagingParams);
    }
  }
  //#endregion

  //#region Export Data

  exportExcel() {
    this.exportMiscTasks(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  private exportMiscTasks(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();

    const excelExportPayload = {
      searchString: this.pagingParams.searchString,
      reasonIds: this.pagingParams.reasonIds,
      assignToUserIds: this.pagingParams.assignToUserIds,
      showAllTasks: this.pagingParams.showAllTasks,
      startDate: this.pagingParams.startDate,
      endDate: this.pagingParams.endDate,
      sortColumn: this.pagingParams.sortColumn, 
      sortOrder: this.pagingParams.sortOrder,
      exportType: exportType,
      pageNo : 1,
      pageSize : this._commonHelper.DefaultPageSize,
    }

    let fileName = `MiscTasks_${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;

    this._workTasksService.exportMiscTasks(excelExportPayload).then((base64String: any) => {
      this._commonHelper.hideLoader();      
      if (base64String && base64String != '') {
        this._commonHelper.downloadFile(`${fileName}${fileExtension}`, fileMimeType, base64String);
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.MISCELINIOUSTASK.LIST.MISCELINIOUSTASKS_NODATATOEXPORT'));
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  private getTenantSettingsForPrivacyLevel() {
    return new Promise((resolve, reject) => {
      this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.DEFAULT_WORKTASK_PRIVACY_LEVEL).then((response: any) => {
        
        resolve(response);
      },
        (error) => {
          this._commonHelper.showToastrError(error.message);
          reject(null);
        });
    });
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
  //#endregion
}
