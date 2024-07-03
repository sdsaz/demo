import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Table } from 'primeng/table';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { WorkflowmanagementService } from '../workflowmanagement.service';
import { LocalStorageKey } from '../../../@core/enum';

@Component({
  selector: 'ngx-entityworkflow-list',
  templateUrl: './entityworkflow-list.component.html',
  styleUrls: ['./entityworkflow-list.component.scss']
})
export class EntityworkflowListComponent implements OnInit, AfterViewInit {

  // search and table element
  @ViewChild('searchTextInput', { static: false }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;

  // models
  entityWorkflows: any[] = [];
  entities: any = null;

  //search filter
  lastWorkflowSearchFilter: any;
  workflowSearchFilter = {
    searchString: '',
    selectedEntity: null
  }

  // pagination
  pagingParams = {
    searchString: '',
    sortColumn: 'name',
    sortOrder: 'DESC',
    pageNo: 1,
    pageSize: this._commonHelper.DefaultPageSize,
    EntityTypeId: null,
    EntityRecordTypeId: null,
  };

  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;

  // permission variable
  isListEntityWorkflow: boolean = false;
  isViewEntityWorkflow: boolean = false;
  isAddEntityWorkflow: boolean = false;
  isEditEntityWorkflow: boolean = false;
  isDeleteEntityWorkflow: boolean = false;
  hasPermission: boolean = false;

  // table Column
  cols: any[];

  //Logged User Detail
  _loggedInUser: any;
  localStorageKeyPrefix: string = '';

  constructor(private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _workflowmanagementService: WorkflowmanagementService,
    private _commonService: CommonService,
    public _commonHelper: CommonHelper,
  ) {
    this.setPermissions();
    this.setColumnDefinations();
    this.initializePagination();
  }

  ngOnInit(): void {
    // get logged in user information
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    //Set Local Storage Prefix
    this.localStorageKeyPrefix = `${this._loggedInUser.tenantId}_${this._loggedInUser.userId}`;

    this.setLastSearchFilterFromStorage();
    this.getEntities();
    this.fetchEntityWorkflows();
  }

  ngAfterViewInit(): void {
    this.subscribeSearchboxEvent();
  }

  fetchEntityWorkflows(): void {
    if (this.workflowSearchFilter.selectedEntity != null ) {
      this.pagingParams.EntityRecordTypeId =  this.workflowSearchFilter.selectedEntity.entityRecordTypeID;
      this.pagingParams.EntityTypeId = this.workflowSearchFilter.selectedEntity.entityTypeID;
    } else {
      this.pagingParams.EntityRecordTypeId =  null;
      this.pagingParams.EntityTypeId = null;
    }

    this.workflowSearchFilter.searchString = this.workflowSearchFilter.searchString != null ? this.workflowSearchFilter.searchString.trim() : '';
    this.pagingParams.searchString = this.workflowSearchFilter.searchString;

    this.getEntityWorkflows(this.pagingParams);
  }

  onResetAllFilters() {
    this.workflowSearchFilter = {
      searchString: '',
      selectedEntity: null
  }
    
    this.pagingParams.searchString = '';
    this.pagingParams.EntityTypeId = null;
    this.pagingParams.EntityRecordTypeId = null;
    
    this.pagingParams.pageNo = 1;
    this.getEntityWorkflows(this.pagingParams);
  }

  onEntitySelectionChange(event: any) {
    this.pagingParams.EntityTypeId = event ? event.entityTypeID : null;
    this.pagingParams.EntityRecordTypeId = event ? event.entityRecordTypeID : null;
    this.pagingParams.pageNo = 1;
    this.fetchEntityWorkflows();
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchEntityWorkflows();
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
      this.fetchEntityWorkflows();
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchEntityWorkflows();
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
    this.fetchEntityWorkflows();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchEntityWorkflows();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchEntityWorkflows();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  //#region private methods
  private setPermissions(): void {
    this.isListEntityWorkflow = this._commonHelper.havePermission(enumPermissions.ListEntityWorkflows);
    this.isViewEntityWorkflow = this._commonHelper.havePermission(enumPermissions.ViewEntityWorkflows);
    this.isEditEntityWorkflow = this._commonHelper.havePermission(enumPermissions.EditEntityWorkflow);
    this.isAddEntityWorkflow = this._commonHelper.havePermission(enumPermissions.AddEntityWorkflow);
    this.isDeleteEntityWorkflow = this._commonHelper.havePermission(enumPermissions.DeleteEntityWorkflow);
  }

  private setLastSearchFilterFromStorage(): void {
    //get local storage for search        
    let filterWorkflowSearch = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_EntityWorkflowManagementKey, this.localStorageKeyPrefix));
    if (filterWorkflowSearch != null) {
        this.workflowSearchFilter = filterWorkflowSearch;
    }
    this.lastWorkflowSearchFilter = JSON.parse(JSON.stringify(this.workflowSearchFilter));
  }

  private setColumnDefinations(): void {
    this.cols = [
      { field: 'name', header: 'ENTITYWORKFLOW.LIST.TABLE_HEADER_NAME', sort: true },
      { field: 'entityTypeName', header: 'ENTITYWORKFLOW.LIST.TABLE_HEADER_ENTITYNAME', sort: true },
      { field: 'entityRecordTypeName', header: 'ENTITYWORKFLOW.LIST.TABLE_HEADER_ENTITYRECORDTYPE', sort: true },
    ];

    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.cols.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private initializePagination(): void {
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.pagingParams.pageNo = 1;
        this.pTable.reset();
        this.fetchEntityWorkflows();
      });
  }

  private getEntityWorkflows(pagingParams): void {
    this._commonHelper.showLoader();
    this._workflowmanagementService.getEntityWorkflows(pagingParams)
      .then((response: any[]) => {
        if (response) {
          this.entityWorkflows = response;
          this.totalRecords = this.entityWorkflows.length > 0 ? this.entityWorkflows[0].totalRecords : 0;
          this.pTable.rows = this.pagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
          this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.entityWorkflows.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
        }
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_EntityWorkflowManagementKey, JSON.stringify(this.workflowSearchFilter), this.localStorageKeyPrefix);
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('ENTITYWORKFLOW.LIST.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

  getEntities(): void {
    const entityWithRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.VisibleEntityWithRecordTypes));
    if (entityWithRecordTypes == null) {
        this._commonHelper.showLoader();
        this._commonService.getDisplayEntityWithRecordType().then((entitylist: any) => {
          if (entitylist) {
            this.entities = entitylist.map(this.processEntities);
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.VisibleEntityWithRecordTypes, JSON.stringify(this.entities));
          }
          this._commonHelper.hideLoader();
        },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
    else {
      this.entities = entityWithRecordTypes;
    }
  }

  private processEntities(element: any) {
    let entityDropDownElement: any = {};
    entityDropDownElement.label = element.displayName;
    let entityList = [];
    if (element.entityRecordTypes) {
      element.entityRecordTypes.forEach(recordType => {
        entityList.push({ label: recordType.name, value: { entityRecordTypeID: recordType.id, entityTypeID: element.id } });
      });
    }
    else {
      entityList.push({ label: element.displayName, value: { entityRecordTypeID: null, entityTypeID: element.id } });
    }

    entityDropDownElement.items = entityList;
    return entityDropDownElement;
  }
  //#endregion
}
