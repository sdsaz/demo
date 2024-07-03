import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, Output, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { DatasourceService } from '../../sharedServices/datasource.service';
import { UtilService } from '../../sharedServices/util.service';
import { PagingParams } from '../../sharedModels/paging-params.model';
import { CommonHelper } from '../../common-helper';
import { DataSources, FieldNames, SectionCodes, UserTypeID ,Entity} from '../../enum';
import { Table } from 'primeng/table';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { WorkTasksService } from '../../../pages/worktasks/worktasks.service';
import { ConfirmationDialogService } from '../../sharedModules/confirmation-dialog/confirmation-dialog.service';

@Component({
  selector: 'ngx-work-task-expandable-table',
  templateUrl: './work-task-expandable-table.component.html',
  styleUrls: ['./work-task-expandable-table.component.scss']
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkTaskExpandableTableComponent implements OnInit, OnDestroy, OnChanges {

  @ViewChildren(Table) table: QueryList<Table>

  @ViewChild('pTable') private pTable: Table;

  @Input() entityID: number;
  @Input() entityTypeID: number;
  @Input() isSubWorkTask: boolean = false;
  @Input() refresh: boolean = false;
  @Input() isEntityActive: boolean;

  currencySymbol: any = null;
  hoursInDay: number = null;

  pagingParams: PagingParams;

  workTasks: any = [];
  entity = Entity;

  userTypeID = UserTypeID;

  totalRecords: number = 0;
  start: number = 0;
  end: number = 0;
  totalPages: number = 0;

  isShowLoader: boolean = false;
  
  // subcriptions
  private searchValueChanged: Subject<string> = new Subject<string>();
  private searchBoxSubscription: Subscription;

  entitySubTypes: any = [];

  entityHiddenFieldSettings: any = [];
  sectionCodes = SectionCodes;
  fieldNames = FieldNames;
  
  showDeleteButtonForParentTask: boolean = false;
  showDeleteButtonForSubTask: boolean = false;

  constructor(private _dataSourceService: DatasourceService, private _utilService: UtilService,
    public _commonHelper: CommonHelper, private _workTaskService: WorkTasksService,
    private _confirmationDialogService: ConfirmationDialogService,
    private _cdr: ChangeDetectorRef
  ) {
    this.initializePagination();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.refresh?.firstChange && changes.refresh?.currentValue != changes.refresh?.previousValue) {
      this.getWorkTasks();
    }
  }

  ngOnDestroy(): void {
    if (this.searchBoxSubscription) {
      this.searchBoxSubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    Promise.all([
      this._utilService.getCurrencySymbol(),
      this._utilService.getHoursInDay(),
      this._utilService.getEntitySubTypes(),
      this._utilService.getEntityHiddenField()
    ]).then((value) => {

      this.currencySymbol = value[0];
      this.hoursInDay = Number(value[1]);
      this.entitySubTypes = value[2];

      this.entityHiddenFieldSettings = value[3];
      this.entityHiddenFieldSettings = this.entityHiddenFieldSettings.filter(x => x.entityTypeId == this.entityTypeID &&
        x.sectionCodes === SectionCodes.EntityWorkTasksColumn.toString());

      this.getWorkTasks();
      this.subscribeSearchBoxEvent();
    });
  }

  getSubTask(workTask: any) {
    if (workTask.subWorkTasks && workTask.subWorkTasks.length > 0) return;
    this.getSubWorkTasks(workTask);
  }

  deleteWorkTask(workTask: any, parentObj: any, isFromSubTask: boolean) {

    if (!this.isEntityActive) return;

    this.isShowLoader = true;
    this._workTaskService.isSubWorkTaskExist(workTask.id).then((res: any) => {
      this.isShowLoader = false;
      //this._cdr.markForCheck();
      const hasSubWorkTask: boolean = res?.isExist || false;

      if (hasSubWorkTask) {

        const level: number = this.entitySubTypes.find(x => x.id == workTask.typeID)?.level ?? 0;
        const subTaskByParent = this.entitySubTypes.filter(x => x.parentID == workTask.typeID && x.level == level + 1 && this._commonHelper.havePermission(x.listPermissionHash));
        const taskTypeNames = subTaskByParent?.map(x => x.name).join(" or ")?.trim() ?? null;
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('COMMON.WORKTASK_EXPANDABLE_TABLE.SUBTASK_EXISTS', { entitySubTypeName: taskTypeNames })
        );

      } else {

        //option for confirm dialog settings
        const optionsForConfirmDialog = {
          size: "md", centered: false, backdrop: 'static', keyboard: false
        };

        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('COMMON.WORKTASK_EXPANDABLE_TABLE.MESSAGE_CONFIRM_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' }), null, null, optionsForConfirmDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.isShowLoader = true;
            //this._cdr.markForCheck();
            this._workTaskService.deleteWorkTask((workTask.id)).then(response => {
              this.isShowLoader = false;
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('COMMON.WORKTASK_EXPANDABLE_TABLE.MESSAGE_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' })
              );
              if (isFromSubTask) {
                parentObj.subWorkTasks = parentObj.subWorkTasks.filter(x => x.id !== workTask.id);
                if (parentObj.subWorkTasks.length == 0) {
                  this.table?.forEach(p => {
                    if (Object.keys(p.expandedRowKeys).length > 0){
                      delete p.expandedRowKeys[parentObj.id];
                    }
                  });
                  parentObj.hasChild = false;
                }
              } else {
                this.getWorkTasks();
              }
              //this._cdr.markForCheck();
            },
            (error) => {
              this.isShowLoader = false;
              //this._cdr.markForCheck();
              this.getTranslateErrorMessage(error);
            });
          }
        });
      }
    },
    (error: any) => {
      this.isShowLoader = false;
      //this._cdr.markForCheck();
      this.getTranslateErrorMessage(error);
    });
  }

  trackByFunction = (index, item) => {
    return item.id // O index
  }

  //#region  Private Methods
  private prepareParamsForWorkTask(): any[] {
    let params: Array<any>
    params = [
      { name: 'EntityTypeID', type: 'int', value: this.entityTypeID },
      { name: 'EntityID', type: 'int', value: this.entityID },
      { name: 'SearchString', type: 'int', value: this.pagingParams.searchString }
    ];
    params = params.concat(...[
      { name: 'PageNo', type: 'int', value: this.pagingParams.pageNo },
      { name: 'PageSize', type: 'int', value: this.pagingParams.pageSize },
      { name: 'SortColumn', type: 'string', value: this.pagingParams.sortColumn },
      { name: 'SortOrder', type: 'string', value: this.pagingParams.sortOrder }
    ]);

    return params;
  }

  private getWorkTasks() {
    if (!this.isSubWorkTask) {
      this.isShowLoader = true;
      //this._cdr.markForCheck();
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITY_WORK_TASK, this.prepareParamsForWorkTask())
        .then((response: any[]) => {
          this.isShowLoader = false;
          this.workTasks = response || [];
          
          this.showDeleteButtonForParentTask = this.workTasks.filter(x => x.showDeleteButton).length > 0;

          this.pTable.expandedRowKeys = {};
          if (this.pagingParams.pageNo > 1 && this.workTasks.length == 0) {
            this.pagingParams.pageNo = 1;
            this.getWorkTasks();
          } else {
            this.setPaginator();
          }
          //this._cdr.markForCheck();
        }, (error) => {
          this.isShowLoader = false;
          //this._cdr.markForCheck();
          this._commonHelper.showToastrError(error.message);
        });
    } else {
      this.getSubWorkTasksAsParent();
    }
  }

  private prepareParamsForSubWorkTask(entityID: number): any[] {
    return [
      { name: 'WorkTaskID', type: 'int', value: entityID },
      { name: 'SearchString', type: 'int', value: null },
      { name: 'PageNo', type: 'int', value: 1 },
      { name: 'PageSize', type: 'int', value: 500 },
      { name: 'SortColumn', type: 'string', value: 'taskCreatedDate' },
      { name: 'SortOrder', type: 'string', value: 'DESC' }
    ];
  }

  private prepareParamsForSubWorkTaskAsParent(): any[] {
    return [
      { name: 'WorkTaskID', type: 'int', value: this.entityID },
      { name: 'SearchString', type: 'int', value: this.pagingParams.searchString },
      { name: 'PageNo', type: 'int', value: this.pagingParams.pageNo },
      { name: 'PageSize', type: 'int', value: this.pagingParams.pageSize },
      { name: 'SortColumn', type: 'string', value: this.pagingParams.sortColumn },
      { name: 'SortOrder', type: 'string', value: this.pagingParams.sortOrder }
    ];

  }

  private getSubWorkTasksAsParent() {
    this.isShowLoader = true;
    //this._cdr.markForCheck();
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITY_SUB_WORK_TASK, this.prepareParamsForSubWorkTaskAsParent())
      .then((response: any[]) => {
        this.isShowLoader = false;
        this.pTable.expandedRowKeys = {};
        this.showDeleteButtonForSubTask = this.workTasks.filter(x => x.showDeleteButton).length > 0;
        this.workTasks = response || [];      
        if (this.pagingParams.pageNo > 1 && this.workTasks.length == 0) {
          this.pagingParams.pageNo = 1;
          this.getWorkTasks();
        } else {
          this.setPaginator();
        }
        //this._cdr.markForCheck();
      }, (error) => {
        this.isShowLoader = false;
        //this._cdr.markForCheck();
        this._commonHelper.showToastrError(error.message);
      });
  }

  private getSubWorkTasks(workTask: any) {
    workTask['showLoader'] = true;
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITY_SUB_WORK_TASK, this.prepareParamsForSubWorkTask(workTask.id))
      .then((response: any[]) => {
        workTask['showLoader'] = false;
        if (response && response.length > 0) {
          workTask['subWorkTasks'] = response;
        }
        //this._cdr.markForCheck();
      }, (error) => {
        workTask['showLoader'] = false;
        this._commonHelper.showToastrError(error.message);
        //this._cdr.markForCheck();
      });
  }

  private subscribeSearchBoxEvent(): void {
    this.searchBoxSubscription = this.searchValueChanged
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      ).subscribe((val) => {
        this.pagingParams.pageNo = 1;
        this.pagingParams.searchString = val;
        this.getWorkTasks();
      });
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('COMMON.WORKTASK_EXPANDABLE_TABLE.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }
  //#endregion

  //#region  Pagination, filter and sorting
  private initializePagination(): void {
    this.pagingParams = new PagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'taskCreatedDate';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private setPaginator() {
    this.totalRecords = this.workTasks.length > 0 ? this.workTasks[0].totalRecords : 0;
    this.pTable.rows = this.pagingParams.pageSize;
    this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
    this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
    this.start = this.end == this.totalRecords ? (this.totalRecords - this.workTasks.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
  }

  search(val: string): void {
    this.searchValueChanged.next(val || '');
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.getWorkTasks();
  }

  changeOrder(): void {
    if (this.pTable.sortOrder == 1) {
      this.pagingParams.sortOrder = "ASC";
    }
    else {
      this.pagingParams.sortOrder = "DESC";
    }
    this.pagingParams.sortColumn = this.pTable.sortField;
    this.getWorkTasks();
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.getWorkTasks();
    }
    else if (this.pagingParams.pageNo > this.totalPages) {
      this.pagingParams.pageNo = this.totalPages;
    }
    else if (this.pagingParams.pageNo <= 0) {
      this.pagingParams.pageNo = 1;
    }
    this.pTable.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetPaginator(): any {
    this.pagingParams.pageNo = 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.getWorkTasks();
    this.pTable.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.getWorkTasks();
    this.pTable.scrollTo({ top: 0, behavior: 'smooth' });
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getWorkTasks();
    this.pTable.scrollTo({ top: 0, behavior: 'smooth' });
  }
  //#endregion
}
