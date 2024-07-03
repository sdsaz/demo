//ANGULAR
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
//COMPONENTS
import { WorkTaskImportDialogComponent } from '../work-task-import-dialog/work-task-import-dialog.component';
import { UserAssignDialogComponent } from '../../../@core/sharedComponents/user-assign/user-assign-dialog/user-assign-dialog.component';
import { WorktaskAddComponent } from '../worktask-add/worktask-add.component';
import { EntityStagesDialogComponent } from '../../../@core/sharedComponents/entity-stages/entity-stages-dialog/entity-stages-dialog.component';
import { PriorityDialogComponent } from '../../../@core/sharedComponents/priority-dialog/priority-dialog.component';
import { SeverityDialogComponent } from '../../../@core/sharedComponents/severity-dialog/severity-dialog.component';
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { WorktaskAddSubTaskComponent } from '../worktask-add-subtask/worktask-add-subtask.component';
import { StagesComponent } from '../../../@core/sharedComponents/kanban-board/stages/stages.component';
import { ActivitySectionComponent } from '../../../@core/sharedComponents/common-activity-section/activity-section/activity-section.component';
//SERVICES
import { WorkTasksService } from '../worktasks.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { EntitytagsService } from '../../entitytags/entitytags.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { NoteService } from '../../../@core/sharedComponents/notes/notes.service';
import { SettingsService } from '../../settings/settings.service';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { DataSources, DownloadFileMimeType, Entity, ExportType, FieldNames, UserTypeID, FileExtension, KanbanBoardTokenTypes, LayoutTypes, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, RefType, ReferenceType, SectionCodes, ActivityTimespan } from '../../../@core/enum';
import { KanbanStage, KanbanStageCard, KanbanStagePauseEvent, KanbanStageRaiseHandEvent, KanbanStageTaskEvent } from '../../../@core/sharedModels/kanban-board.model';
import { IdValuePair } from '../../../@core/sharedModels/pair.model';
import { Note } from '../../../@core/sharedComponents/notes/note.model';
//OTHER
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { Table } from 'primeng/table';
import { fromEvent, interval, Subscription } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { LinkWorkTaskDialogComponent } from '../link-work-task-dialog/link-work-task-dialog.component';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';
import { GoogleAnalyticsService,GoogleAnalyticsRouterInitializer } from 'ngx-google-analytics';

@Component({
  selector: 'ngx-data-list',
  templateUrl: './worktask-list.component.html',
  styleUrls: ['./worktask-list.component.scss']
})
export class WorkTaskListComponent implements OnInit {

  @ViewChild('searchTextInput', { static: false }) searchTextInput: ElementRef;
  @ViewChild('dt') private dt: Table;
  @ViewChild('kanbanStage') kanbanStage: StagesComponent;
  @ViewChild('activitySection') activitySection: ActivitySectionComponent;

  private updateSubscription: Subscription;
  
  pageTitle = 'WORKTASK.LIST.TITLE';
  workflowName = '';
  ratingOptions: any [] = [];

  entityTypeId: number = Entity.WorkTasks;
  entityWorkflowId: number = 0;
  entityRecordTypeId: number;
  relatedEntityTypeId: number = 0;
  relatedEntityRecordTypeId: number = 0;

  workTaskList: any[] = [];
  workTaskListByStages: any[] = [];
  worktaskAssignedTo: any;
  relatedToIconClass: string;
  relatedToIconToolTip: string;

  isBulkAssignWorkTasks: boolean = false;
  isAssignWorkTask: boolean = false;
  isExportWorkTasks: boolean = false;
  isImportWorkTasks: boolean = false;
  isDeleteWorkTask: boolean = false;
  isEditWorkTask: boolean = false;
  isAddWorkTask: boolean = false;
  isViewWorkTask: boolean = false;
  isListWorkTasks: boolean = false;
  isShowRelatedTo: boolean = false;
  isShowAssignTo: boolean = true;
  isResumeTask: boolean = false;
  changeWorkTaskStage: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAllowToReopen: boolean = false;
  isFromKanbanOrListView:boolean = false;

  localStorageKeyPrefix: string = '';
  
  customFilterConfig: any[] = [
  ];

  isFilterVisible: boolean = false;
  filterCount:number = 0;
  cols: any[];
  tableData: any[];

  dataSearch = {
    isPageTabularView: true,
    params: {
      "tenantId": 0,
      "pageNo": 1,
      "pageSize": this._commonHelper.DefaultPageSize,
      "searchString": "",
      "sortColumn": "Created",
      "sortOrder": "DESC",
      "entityIDs": "",
      "tagIDs": "",
      "assignedToIDs": "",
      "entityWorkflowId": this.entityWorkflowId,
      "entityTimespan": "LAST7DAYS",
      "priorityIDs": "",
      "severityIDs": "",
      "stageIDs":"",
      "typeIds": "",
      "rating":null,
      "dueStartDate": null,
      "dueEndDate": null,
      "taskCreatedFromDate": null,
      "taskCreatedToDate": null,
      "verifiedByIDs": "",
      "showMyTasks": true,
      "entityRecordTypeIDs":"",
      "showStarred": false
    },
    paramsByStage: {
      "tenantId": 0,
      "pageNo": 1,
      "pageSize": this._commonHelper.DefaultPageSizeForKanban,
      "searchString": "",
      "tagIDs": "",
      "entityWorkflowId": this.entityWorkflowId,
      "stageId": 0,
      "assignedToIDs": "",
      "entityIDs": "",
      "entityTimespan": "LAST7DAYS",
      "priorityIDs": "",
      "severityIDs": "",
      "stageIDs":"",
      "typeIds": "",
      "rating":null,
      "dueStartDate": null,
      "dueEndDate": null,
      "taskCreatedFromDate": null,
      "taskCreatedToDate": null,
      "verifiedByIDs": "",
      "showMyTasks": true,
      "entityRecordTypeIDs":"",
      "showStarred":false
    }
  }
  //paginator
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;

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

  observableStageTasksList: any[] = [];

  // dynamic kanban
  isfilterLoaded = false;
  stages: Array<KanbanStage> = [];
  owner1List: Array<IdValuePair> = [];
  verifiedByList: Array<IdValuePair> = [];

  // multi assign tasks to user
  showMultiselectOption = false;

  users: any = null; //assignable users
  filterUsers: any = null;
  filterVerifiedByUsers: any = null;
  relatedToEntityTypes: any = null; //related to entity records
  filterStage: any = null;
  relatedTo: any = null; //related to entity records
  priority: any = null;
  severity: any = null;
  priorityDetails: any = null;
  severityDetails: any = null;
  filterTypes: any = null;
  entityPrivacyDetails: any = [];

  //user detail
  _loggedInUser: any;

  //action menu
  isShowActionColumn: boolean = false;
  //right side activity menu
  isShowActivityCenter: boolean = false;
  refreshActivityCenter: boolean = false;
  selectedWorkTaskForActivityCenter: any;
  selectedWorkTaskIdForActivityCenter: number = 0;
  selectedWorkTaskIsPausedForActivityCenter: boolean = false;
  selectedWorkTaskIsClosedForActivityCenter: boolean = false;
  selectedWorkTaskIsCompletedForActivityCenter: boolean = false;
  selectedRowId:number = 0;
  selectedCardExists: boolean = false;
  entityDetails: any;

  workflows: any = null;

  //tenant setting
  workTaskStageTaskChange: any = "no";

  isBulkAssignedDialogOpen: boolean;
  isAllCheckBoxSelected: boolean;
  keyfieldResponseData: any;
  quickViewConfig: any;

  entityStagesWithTasksStorageKey : string = LocalStorageKey.WorkTaskEntityStageWithTasksKey;
  rowActionButtonMouseHoverFlag: boolean = false;
  currencySymbol: any = null;
  hoursInDay:number = null;
  relatedToEntityColumnName: any;

  //Export Worktask
  dynamicColumnNameSetting: any = {};

  //WorkflowLayout based on layoutTypeID
  showBothKanbanAndListView: boolean = false;

  //status filter for listview.
  showLayout: any;
  StatusFilterLabel: any;
  StatusFilterPlaceholder: any;
  StatusColumnName: string;
  TaskNumberColumnName: string;

  workTaskCreatedBy: number;
  workTaskPrivacyLevel: number;

  //Record Type Filter
  recordTypes: any;
  recordTypesDetail: any;
  recordTypesforSubWorkTask: any;
  isRecordTypesFilterVisible: boolean;
  entityRecordType: any[];

  //Entity Sub TypeFilter
  entitySubTypes:any = [];
  availableSubWorkTaskTypeNamesForWorkTaskDelete: any;

  entityHiddenFieldSettings: any;
  sectionCodeName = SectionCodes;
  fieldNames = FieldNames;
  userTypeID = UserTypeID;
  isAssignedToFieldKanbanListColumn: boolean;
  isVerifiedByFieldKanbanListColumn: boolean;

  isStageClosedOrCompleted: number;

  constructor(private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _workTaskService: WorkTasksService,
    private _dataSourceService: DatasourceService,
    private _entitytagsService: EntitytagsService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _noteService: NoteService,
    private _settingsService: SettingsService,
    private _fileSignedUrlService: FileSignedUrlService,
    protected _gaService: GoogleAnalyticsService) {
    //re use route
    this._router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };

    //initiate Permissions
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAssignWorkTask = this._commonHelper.havePermission(enumPermissions.AssignWorkTask);
    this.isBulkAssignWorkTasks = this._commonHelper.havePermission(enumPermissions.BulkAssignWorkTasks);
    this.isDeleteWorkTask = this._commonHelper.havePermission(enumPermissions.DeleteWorkTask);
    this.isEditWorkTask = this._commonHelper.havePermission(enumPermissions.EditWorkTask);
    this.isExportWorkTasks = this._commonHelper.havePermission(enumPermissions.ExportWorkTasks);
    this.isImportWorkTasks = this._commonHelper.havePermission(enumPermissions.ImportWorkTasks);
    this.isListWorkTasks = this._commonHelper.havePermission(enumPermissions.ListWorkTasks);
    this.isViewWorkTask = this._commonHelper.havePermission(enumPermissions.ViewWorkTask);
    this.isResumeTask = this._commonHelper.havePermission(enumPermissions.ResumeTask);
    this.changeWorkTaskStage = this._commonHelper.havePermission(enumPermissions.ChangeWorkTaskStage);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadWorkTaskDocument);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);

    //if list page record type wise
    this._activeRoute.params.subscribe(param => {
      if (param && param['wf']) {
        this.entityWorkflowId = param['wf'];
        this.dataSearch.isPageTabularView = false;
      }
    });
     // set storage key
     this.entityStagesWithTasksStorageKey = this.entityStagesWithTasksStorageKey + "_" + this.entityTypeId + (this.entityWorkflowId ? ("_" + this.entityWorkflowId) : '');
  }

  ngOnInit(): void {

    // get logged in user information
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    //Set Local Storage Prefix
    this.localStorageKeyPrefix = `${this._loggedInUser.tenantId}_${this._loggedInUser.userId}_${this.entityWorkflowId}`;

    //get local storage for search
    let localPageLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_WorkTasksKey, this.localStorageKeyPrefix));
    if (localPageLayout != null) {
      this.dataSearch = localPageLayout;
    }

    this.dataSearch.isPageTabularView = localPageLayout?.isPageTabularView || false;

    // set workflow id
    this.dataSearch.paramsByStage.entityWorkflowId = this.entityWorkflowId;
    this.dataSearch.params.entityWorkflowId = this.entityWorkflowId;

    // set page size
    this.dataSearch.paramsByStage.pageNo = 1;
    this.dataSearch.paramsByStage.pageSize = this._commonHelper.DefaultPageSizeForKanban;
    this.dataSearch.params.pageSize = this._commonHelper.DefaultPageSize;

    //Due Date Range
    this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null && this.dataSearch.params.dueStartDate != '' ? moment(new Date(this.dataSearch.params.dueStartDate)).toDate() : null;
    this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null && this.dataSearch.params.dueEndDate != '' ? moment(new Date(this.dataSearch.params.dueEndDate)).toDate() : null;
    this.dataSearch.paramsByStage.dueStartDate = this.dataSearch.paramsByStage.dueStartDate != null && this.dataSearch.paramsByStage.dueStartDate != '' ? moment(new Date(this.dataSearch.paramsByStage.dueStartDate)).toDate() : null;
    this.dataSearch.paramsByStage.dueEndDate = this.dataSearch.paramsByStage.dueEndDate != null && this.dataSearch.paramsByStage.dueEndDate != '' ? moment(new Date(this.dataSearch.paramsByStage.dueEndDate)).toDate() : null;

    //Task Created Date Range
    this.dataSearch.params.taskCreatedFromDate = this.dataSearch.params.taskCreatedFromDate != null && this.dataSearch.params.taskCreatedFromDate != '' ? moment(new Date(this.dataSearch.params.taskCreatedFromDate)).toDate() : null;
    this.dataSearch.params.taskCreatedToDate = this.dataSearch.params.taskCreatedToDate != null && this.dataSearch.params.taskCreatedToDate != '' ? moment(new Date(this.dataSearch.params.taskCreatedToDate)).toDate() : null;
    this.dataSearch.paramsByStage.taskCreatedFromDate = this.dataSearch.paramsByStage.taskCreatedFromDate != null && this.dataSearch.paramsByStage.taskCreatedFromDate != '' ? moment(new Date(this.dataSearch.paramsByStage.taskCreatedFromDate)).toDate() : null;
    this.dataSearch.paramsByStage.taskCreatedToDate = this.dataSearch.paramsByStage.taskCreatedToDate != null && this.dataSearch.paramsByStage.taskCreatedToDate != '' ? moment(new Date(this.dataSearch.paramsByStage.taskCreatedToDate)).toDate() : null;


    // DD 20220425: SDC-426: Entity workflow have the parent entity type related information so removing dynamic dropdown
    // get workflow details
    Promise.all([
      this.getWorkflowList(),
      this.getWorkflowDetail(),
      this.getEntityStagesWithTask(),
      this.getCurrencySymbol(),
      this.getHoursInDay(),
      this.getEntityRecordTypes(),
      this.getEntitySubTypes(),
      this.getPriorityFromReferenceType(),
      this.getSeverityFromReferenceType(),
      this.getPrivacyLevelRefererence(),
      this.getEntityHiddenField()
    ]).then((results: any) => {
      if (results) {
       
        var workflow = results[1];
        this.workflowName = workflow.name;
        this.entityRecordTypeId = workflow.entityRecordTypeId;
        this.relatedEntityTypeId = workflow.parentEntityTypeId;
        this.relatedEntityRecordTypeId = workflow.parentEntityRecordTypeId;

        let StageColumn = this.cols.find(c => c.field == 'stageName');


        if (workflow.layoutTypeID == LayoutTypes.ListView) {
          this.dataSearch.isPageTabularView = true;
          StageColumn.header = 'WORKTASK.LIST.TABLE_HEADER_STATUS_NAME';
          this.StatusColumnName = (this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.EXPORT_STATUS_LABEL'));
        } else if (workflow.layoutTypeID == LayoutTypes.KanbanView) {
          this.dataSearch.isPageTabularView = false;
        } else if (workflow.layoutTypeID == LayoutTypes.KanbanAndListView) {
          this.showBothKanbanAndListView = true;
        }

        if (this.relatedEntityTypeId != null) {
          this.isShowRelatedTo = true;
        }
        else {
          this.isShowRelatedTo = false;
        }
        this.getHeaderFilters();
        
        //get tenant setting
        this.getTabLayoutTenantSetting();
        //set related to column show/hide dynamically
        let entityNameColumn = this.cols.find(c => c.field == 'entityName');
        entityNameColumn.visible = this.isShowRelatedTo;
        this.TaskNumberColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.EXPORT_TASK_NUMBER_LABEL'));

        //Header of related to 
        const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.relatedEntityTypeId);

        if (foundRecord) {
          this.relatedToEntityColumnName =foundRecord?.['displayName'].toString().trim();
          entityNameColumn.header = this.relatedToEntityColumnName;
        }

        this.dynamicColumnNameSetting = {};
        this.dynamicColumnNameSetting["EntityName"] = this.relatedToEntityColumnName;
        this.dynamicColumnNameSetting["StageName"] = this.StatusColumnName;
        this.dynamicColumnNameSetting["TaskNumber"] = this.TaskNumberColumnName;

        this.subscribeSearchboxEvent();

        //Auto Refresh data
        if (workflow.refreshMins != null && workflow.refreshMins > 0) {
          this.updateSubscription = interval(workflow.refreshMins * 60000).subscribe((val) => this.refreshDataOnInterval());
        }
        else {
          if (this.updateSubscription) {
            this.updateSubscription.unsubscribe();
          }
        }
      }
      else {
        this.isInitialLoading = false;
      }
    }, (error) => {
      this.getTranslateErrorMessage(error);
      this._router.navigate(['/']);
    });

    // get set quickview local storage config start
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedWorkTaskIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
    }
    // get set quickview local storage config end

    //hide assignedTo field Column;
    if(this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.KanbanListColumn, FieldNames.AssignedTo)) {
      this.isAssignedToFieldKanbanListColumn = true;
    }else {
      this.isAssignedToFieldKanbanListColumn = false;
    }

    //hide verifiedBy field Column;
    if(this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.KanbanListColumn, FieldNames.AssignedTo)) {
      this.isVerifiedByFieldKanbanListColumn = true;
    }else {
      this.isVerifiedByFieldKanbanListColumn = false;
    }
    
    this.setColumns();
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  setColumns(): void {
    //table layout fields set
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'taskNumber', header: 'WORKTASK.LIST.TABLE_HEADER_TASK_NUMBER', visible: true, sort: true },
      { field: 'name', header: 'WORKTASK.LIST.TABLE_HEADER_NAME', visible: true, sort: true },
      { field: 'entityName', header: 'WORKTASK.LIST.TABLE_HEADER_RELATED_TO', visible: true, sort: true },
      { field: 'stageName', header: 'WORKTASK.LIST.TABLE_HEADER_STAGE_NAME', visible: true, sort: true },
      { field: 'assignedToName', header: 'WORKTASK.LIST.TABLE_HEADER_ASSIGNEDTO', visible: !this.isAssignedToFieldKanbanListColumn, sort: true },
      { field: 'verifiedByName', header: 'WORKTASK.LIST.TABLE_HEADER_VERIFIED_BY', visible: !this.isVerifiedByFieldKanbanListColumn, sort: true },
      { field: 'createdByName', header: 'WORKTASK.LIST.TABLE_HEADER_CREATED_BY', visible: true, sort: true },
      { field: 'created', header: 'WORKTASK.LIST.TABLE_HEADER_CREATED', visible: true, sort: true },
      { field: 'isPaused', header: '', visible: true, sort: false, class: "action ", display: 'td-display' },
      { field: 'id', header: '', visible: true, sort: false, class: "action ", display: 'td-display' }
    ];
  }

  getWorkflowDetail(): Promise<any> {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.WorkTaskWorkflowDetailsKey}_${this.entityWorkflowId}`;

      // get data
      const workflowDetail = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (workflowDetail == null) {
        this._commonHelper.showLoader();
        this.isInitialLoading = true;
        this._workflowmanagementService.getWorkflowDetail(this.entityWorkflowId)
          .then((response: any) => {
            this.showLayout = response?.layoutTypeID;
            //Show/Hide Record Type Filter.
            if (response.isDefault) {
              this.isRecordTypesFilterVisible = false;
            } else {
              this.isRecordTypesFilterVisible = true;
            }
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
        this.showLayout = workflowDetail?.layoutTypeID;
        //Show/Hide Record Type Filter.
        if (workflowDetail.isDefault) {
          this.isRecordTypesFilterVisible = false;
        } else {
          this.isRecordTypesFilterVisible = true;
        }
        resolve(workflowDetail);
      }
    });
  }

  private prepareParamsForWorkflows() {
    const params = [];
    let paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.WorkTasks
    };
    params.push(paramItem);
    return params;
  }

  private getWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.WorkTasks}`;

      this.workflows = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.workflows == null) {
        const params = this.prepareParamsForWorkflows();
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflows = response;
            this.workflows.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_OPTION_TEXT_WORKFLOW') });
            this.workflows.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflows));
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
        resolve(null);
      }
    });
  }

  getHeaderFilters() {
    // other filter master data
    const requestArray = [];

    const entityTimeSpans = this.getEntityTimespans();
    const requestAssignedToUsers = this.getAssigedToUsers(null, 1, '');
    const recordTypeList = this.getEntityRecordTypes();
    const requestRelatedTo = this.getRelatedTo(null, 1, '');
    const requestTags = this.getWorkTaskTags();
    const priorityList = this.getPriority();
    const severityList = this.getSeverity();
    const requestVerifiedBy = this.getVerifiedByUsers(null, 1, '');
    const stageList = this.getStage();
    const entitySubTypesList = this.getEntitySubTypes();
    const rationList = this._commonHelper.setRatingOptions();

    requestArray.push(entityTimeSpans);
    requestArray.push(requestAssignedToUsers);
    requestArray.push(recordTypeList);
    requestArray.push(requestRelatedTo);
    requestArray.push(requestTags);
    requestArray.push(priorityList);
    requestArray.push(severityList);
    requestArray.push(requestVerifiedBy);
    requestArray.push(stageList);
    requestArray.push(entitySubTypesList);
    requestArray.push(rationList);

    this._commonHelper.showLoader();
    forkJoin(requestArray).subscribe((results: any[]) => {
      if (results) {
        //Entity Timespan
        if (results[0]) {
          let entityTimespans = null;
          let response = results[0] as [];
          // related to dropdown
          entityTimespans = response.map((i: any) =>
            ({ label: i.name, value: i.strValue1 })
          );

          //set selected entity timespan in dropdown
          let selectedEntityTimespan: any = this.dataSearch.isPageTabularView ? this.dataSearch.params.entityTimespan : this.dataSearch.paramsByStage.entityTimespan;
          if (selectedEntityTimespan == null || selectedEntityTimespan == '') {
            selectedEntityTimespan = ActivityTimespan.LAST7DAYS;
          }

          let entityTimespanFilter = {
            inputType: 'Dropdown',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_ENTITYTIMESPAN'),
            name: 'entityTimespan',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_ENTITYTIMESPAN'),
            ngModel: selectedEntityTimespan == null || selectedEntityTimespan.length == 0 ? ActivityTimespan.LAST7DAYS : selectedEntityTimespan,
            ngModelDefaultValue: ActivityTimespan.LAST7DAYS,
            optionLabel: 'label',
            optionValue: 'value',
            options: entityTimespans,
            isHidden: false,
            filter: false,
            showHeader: false,
            resetFilterOnHide: false,
            defaultClass: 'basic-filter small-filter',
            panelStyleClass: 'maxWidthOverride-xs',
            isCountableFilter: 1
          }

          this.customFilterConfig.push(entityTimespanFilter);
          if(entityTimespanFilter.ngModel != ActivityTimespan.ALLTIME){
            this.filterCount ++;
          }
          
          //set in params
          this.dataSearch.paramsByStage.entityTimespan = selectedEntityTimespan == null || selectedEntityTimespan.length == 0 ? ActivityTimespan.LAST7DAYS : selectedEntityTimespan;
          this.dataSearch.params.entityTimespan = selectedEntityTimespan == null || selectedEntityTimespan.length == 0 ? ActivityTimespan.LAST7DAYS : selectedEntityTimespan;
        }
        //assigned to users
        if (results[1] != undefined) {
          let response = results[1] as [];
          // users to assign to dropdwon
          this.users = response.map((i: any) =>
            ({ value: i.value, label: i.label }));;
          this.filterUsers = response;
          //set owner 1 list
          this.owner1List = response.map((i: any) =>
            ({ id: i.value, name: i.label }));

          this.filterUsers.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_OPTION_TEXT_ASSIGNEDTO') });
          this.filterUsers.sort((a, b) => a.value - b.value);
          let selectedUserIds: any[] = [];
          if (this.filterUsers.length > 0) {
            var selectedIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.assignedToIDs : this.dataSearch.paramsByStage.assignedToIDs;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString.split(',');

              if (selectedIds.length > 0) {
                selectedIds.forEach((element: any) => {
                  const obj = this.filterUsers.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    selectedUserIds.push(obj.value);
                    this.filterCount ++;
                });
              }
            }
          }
          //setup search dropdown
          let assignedToFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_ASSIGNTO'),
            name: 'assignedToIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_ASSIGNTO'),
            ngModel: selectedUserIds.length == 0 ? '' : selectedUserIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.filterUsers,
            isHidden: false,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-md'  ,
            isCountableFilter: 1
          }
          

          //hide AssignedTo field in filter
          if(!this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.KanbanListFilter, FieldNames.AssignedTo, this.entityWorkflowId)) {
            // add to filter
            this.customFilterConfig.push(assignedToFilter);
          }
          
        }

        //Record Types
        if (results[2] != undefined) {
          let response = results[2] as any[];
          //record type list in dropdown
          this.entityRecordType = response;
          this.entityRecordType.push({ label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_OPTION_TEXT_RECORDTYPE'), value: 0 })
          this.entityRecordType.sort((a, b) => a.value - b.value);

          //Show/Hide Record Type Filter.
          let hideRecordTypeFilter = this.entityRecordType.filter(x => x.value != 0);
          if (hideRecordTypeFilter && hideRecordTypeFilter.length > 0) {
            this.isRecordTypesFilterVisible = false;
          } else {
            this.isRecordTypesFilterVisible = true;
          }
          
          //set selected stage in dropdown
          let selectedRecordTypeIds: any[] = [];

          if (this.entityRecordType.length > 0) {
            var selectedIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.entityRecordTypeIDs : this.dataSearch.paramsByStage.entityRecordTypeIDs;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString?.split(',');

              if (selectedIds?.length > 0) {
                selectedIds.forEach((element: any) => {
                  const obj = this.entityRecordType.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    selectedRecordTypeIds.push(obj.value);
                    this.filterCount ++;
                });
              }
            }
          }
          //setup search dropdown
          let recordTypeFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_RECORDTYPE'),
            name: 'entityRecordTypeIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_RECORDTYPE'),
            ngModel: selectedRecordTypeIds.length == 0 ? '' : selectedRecordTypeIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.entityRecordType,
            isHidden: this.isRecordTypesFilterVisible,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-md',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(recordTypeFilter);
        }

        //related to
        if (results[3] != undefined) {
          let response = results[3] as [];
          // related to to dropdwon
          this.relatedTo = response;

          //set selected related to in dropdown
          let selectedRelatedToIds: any[] = [];

          if (this.relatedTo.length > 0) {
            var selectedIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.entityIDs : this.dataSearch.paramsByStage.entityIDs;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString.split(',');

              if (selectedIds.length > 0) {
                selectedIds.forEach((element: any) => {
                  const obj = this.relatedTo.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    selectedRelatedToIds.push(obj.value);
                    this.filterCount ++;
                });
              }
            }
          }
          if (this.relatedEntityTypeId != null) {
            const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.relatedEntityTypeId);
            //setup search dropdown
            let relatedToFilter = {
              inputType: 'MultiSelect',
              label: foundRecord?.['displayName'].toString().trim(),
              name: 'entityIDs',
              placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_RELATEDTO', { entityName: foundRecord?.['displayName'].toString().trim() }),
              ngModel: selectedRelatedToIds.length == 0 ? '' : selectedRelatedToIds,
              optionLabel: 'label',
              optionValue: 'value',
              options: this.relatedTo,
              isHidden: false,
              defaultClass: 'basic-filter',
              resetFilterOnHide: false,
              panelStyleClass: 'maxWidthOverride-md',
              isCountableFilter: 1
            }
            // add to filter
            this.customFilterConfig.push(relatedToFilter);
          }
        }

        //tags
        if (results[4]) {
          const tags = (results[4] as []).map(this.getTags);

          //set selected tags in dropdown
          let selectedTagIds: any[] = [];

          // if tags available
          if (tags.length > 0) {
            var selectedIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.tagIDs : this.dataSearch.paramsByStage.tagIDs;
            if (selectedIdSString != "") {
              selectedIds = selectedIdSString.split(',');

              if (selectedIds.length > 0) {
                selectedIds.forEach((element: any) => {
                  tags.forEach((tag) => {
                    const obj = tag.items.find(x => x.value === parseInt(element))
                    if (obj != null && obj != undefined)
                      selectedTagIds.push(obj.value);
                      this.filterCount ++;
                  });
                });
              }
            }
          }

          let tagsFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_TAGS'),
            name: 'tagIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_TAGS'),
            ngModel: selectedTagIds.length == 0 ? '' : selectedTagIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: tags,
            isHidden: false,
            group: true,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-md',
            isCountableFilter: 1
          }
          this.customFilterConfig.push(tagsFilter);
        }

        //priority
        if (results[5] != undefined) {
          let response = results[5] as [];
          // priority dropdwon
          this.priority = response;

          //set selected priority in dropdown
          let selectePriorityIds: any[] = [];

          if (this.priority.length > 0) {
            var selectedPriorityIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.priorityIDs : this.dataSearch.paramsByStage.priorityIDs;
            if (selectedPriorityIdSString != "") {
              selectedIds = selectedPriorityIdSString.split(',');

              if (selectedIds.length > 0) {
                selectedIds.forEach((element: any) => {
                  const obj = this.priority.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    selectePriorityIds.push(obj.value);
                    this.filterCount ++;
                });
              }
            }
          }

          //setup search dropdown
          let priorityFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_PRIORITY'),
            name: 'priorityIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_PRIORITY'),
            ngModel: selectePriorityIds.length == 0 ? '' : selectePriorityIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.priority,
            isHidden: false,
            defaultClass: 'small-filter',
            panelStyleClass: 'maxWidthOverride-xs',
            isCountableFilter: 1
          }
          
          // add to filter
          this.customFilterConfig.push(priorityFilter);
        }

        //severity
        if (results[6] != undefined) {
          let response = results[6] as [];
          // priority dropdwon
          this.severity = response;

          //set selected priority in dropdown
          let selecteSeverityIds: any[] = [];

          if (this.severity.length > 0) {
            var selectedSeverityIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.severityIDs : this.dataSearch.paramsByStage.severityIDs;
            if (selectedSeverityIdSString != "") {
              selectedIds = selectedSeverityIdSString.split(',');

              if (selectedIds.length > 0) {
                selectedIds.forEach((element: any) => {
                  const obj = this.severity.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    selecteSeverityIds.push(obj.value);
                    this.filterCount ++;
                });
              }
            }
          }

          //setup search dropdown
          let priorityFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_SEVERITY'),
            name: 'severityIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_SEVERITY'),
            ngModel: selecteSeverityIds.length == 0 ? '' : selecteSeverityIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.severity,
            isHidden: false,
            defaultClass: 'small-filter',
            panelStyleClass: 'maxWidthOverride-xs',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(priorityFilter);
          // add last 2 filters for due start and end date
          var selectedDueStartDate = this.dataSearch.isPageTabularView ? this.dataSearch.params.dueStartDate : this.dataSearch.paramsByStage.dueStartDate;
          let dueStartFilter = {
            inputType: 'DateFrom',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_DUE_FROM'),
            name: 'dueStartDate',
            ngModel: selectedDueStartDate,
            isHidden: false,
            defaultClass: 'small-filter',
            isCountableFilter: 0
          };
          // add to filter
          this.customFilterConfig.push(dueStartFilter);

          // due end
          var selectedDueEndDate = this.dataSearch.isPageTabularView ? this.dataSearch.params.dueEndDate : this.dataSearch.paramsByStage.dueEndDate;
          let dueEndFilter = {
            inputType: 'DateTo',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_DUE_TO'),
            name: 'dueEndDate',
            ngModel: selectedDueEndDate,
            isHidden: false,
            defaultClass: 'small-filter',
            isCountableFilter: 0
          };
          // add to filter 

          this.customFilterConfig.push(dueEndFilter);

          //daterange picker
          let rangeDates = [];
          if (selectedDueStartDate != undefined && selectedDueStartDate != null) {
            rangeDates.push(selectedDueStartDate);
          }
          if (selectedDueEndDate != undefined && selectedDueEndDate != null) {
            rangeDates.push(selectedDueEndDate);
          }
          let dateRangeFilter = {
            inputType: 'DateRangePicker',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_DUE_DATE'),
            ngModelDefaultValue: [],
            name: 'dueDates',
            ngModel: rangeDates,
            isHidden: false,
            defaultClass: 'small-filter',
            fromDateControlName: 'dueStartDate',
            toDateControlName: 'dueEndDate',
            isCountableFilter: 1
          };
          this.customFilterConfig.push(dateRangeFilter);
          if(dateRangeFilter.ngModel.length >0){
            this.filterCount ++;
          }
        }

        //Verified By
        if (results[7] != undefined) {

          const verifiedByUserList = results[7] as any[];

          this.verifiedByList = (verifiedByUserList).map((i: any) =>
            ({ id: i.value, name: i.label }));
          this.filterVerifiedByUsers = verifiedByUserList;
          this.filterVerifiedByUsers.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_OPTION_TEXT_VERIFIEDBY') });
          this.filterVerifiedByUsers.sort((a, b) => a.value - b.value);
          let selectedUserIds: any[] = [];
          if (this.filterVerifiedByUsers.length > 0) {
            var selectedIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.verifiedByIDs : this.dataSearch.paramsByStage.verifiedByIDs;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString.split(',');

              if (selectedIds.length > 0) {
                selectedIds.forEach((element: any) => {
                  const obj = this.filterVerifiedByUsers.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    selectedUserIds.push(obj.value);
                    this.filterCount ++;
                });
              }
            }
          }
          //setup search dropdown
          const verifiedByFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_VERIFIED_BY'),
            name: 'verifiedByIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_VERIFIED_BY'),
            ngModel: selectedUserIds.length == 0 ? '' : selectedUserIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.filterVerifiedByUsers,
            isHidden: false,
            defaultClass: 'small-filter',
            panelStyleClass: 'maxWidthOverride-sm',
            isCountableFilter: 1
          }

          //hide verifiedBy field in filter
          if (!this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.KanbanListFilter, FieldNames.VerifiedBy, this.entityWorkflowId)) {
            // add to filter
            this.customFilterConfig.push(verifiedByFilter);
          }
        }

        //Add Task Created Date Range Filter
        this.addTaskCreatedDateRangeFilter();

        if (results[8] != undefined) {
          let Liststages = results[8] as any[];
          this.filterStage = Liststages;

          if (this.showLayout == LayoutTypes.ListView) {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_STATUS');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_STATUS');
          }
          else {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_STAGE');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_STAGE');
          }

          //set selected stage in dropdown
          let selectedStageIds: any[] = [];

          if (this.filterStage.length > 0) {
            var selectedIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.stageIDs : this.dataSearch.paramsByStage.stageIDs;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString?.split(',');

              if (selectedIds?.length > 0) {
                selectedIds.forEach((element: any) => {
                  const obj = this.filterStage.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    selectedStageIds.push(obj.value);
                    this.filterCount ++;
                });
              }
            }
          }

          //setup search dropdown
          let stageFilter = {
            inputType: 'MultiSelect',
            label: this.StatusFilterLabel,
            name: 'stageIDs',
            placeHolder: this.StatusFilterPlaceholder,
            ngModel: selectedStageIds.length == 0 ? '' : selectedStageIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.filterStage,
            isHidden: !this.dataSearch.isPageTabularView,
            defaultClass: 'small-filter',
            panelStyleClass: 'maxWidthOverride-sm',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(stageFilter);
        }

        if (results[9] != undefined) {
          let ListEntitySubTypes = results[9] as any[];
          this.filterTypes = ListEntitySubTypes.filter(x=>x.listPermissionID == null || this._commonHelper.havePermission(x.listPermissionHash));
          
          //set selected types in dropdown
          let selectedTypeIds: any[] = [];
          let defaultValue: any[] = [];

          if (this.filterTypes.length > 0) {
            let defaultObject = this.filterTypes.find(x=>x.parentID == null);
            if(defaultObject != null && defaultObject != undefined){
              defaultValue.push(defaultObject.id);
            }

            let selectedTypeIdsString = this.dataSearch.isPageTabularView ? this.dataSearch.params.typeIds : this.dataSearch.paramsByStage.typeIds;
            if (selectedTypeIdsString != "") {
              let selectedIds = selectedTypeIdsString?.split(',');

              if (selectedIds?.length > 0) {
                selectedIds.forEach((element: any) => {
                  const obj = this.filterTypes.find(x => x.id === parseInt(element))
                  if (obj != null && obj != undefined)
                    selectedTypeIds.push(obj.id);
                });
              }
            }
          }

          //setup search dropdown
          let stageFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_TYPE'),
            name: 'typeIds',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_TYPE'),
            ngModel: selectedTypeIds.length == 0 ? defaultValue : selectedTypeIds,
            ngModelDefaultValue: defaultValue,
            optionLabel: 'name',
            optionValue: 'id',
            options: this.filterTypes,
            isHidden: false,
            defaultClass: 'small-filter',
            panelStyleClass: 'maxWidthOverride-sm',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(stageFilter);

          if(selectedTypeIds.length > 0){
            this.filterCount ++;
          } else if(selectedTypeIds.length == 0 && defaultValue.length > 0){
            this.filterCount ++;
          }
        }

        if (results[10]) {
          let ratingOptions = results[10] as any[];
          let selectedRatingIds: any = this.dataSearch.isPageTabularView ? this.dataSearch.params.rating : this.dataSearch.paramsByStage.rating;
          if (selectedRatingIds == null || selectedRatingIds == '') {
            selectedRatingIds = null;
          } else {
            this.filterCount ++;
          }
          let ratingFilter = {
            inputType: 'Dropdown',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_RATING'),
            name: 'rating',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_RATING'),
            ngModel: (selectedRatingIds == null || selectedRatingIds == '') ? null : selectedRatingIds,
            ngModelDefaultValue: null,
            optionLabel: 'label',
            optionValue: 'value',
            options: ratingOptions,
            isHidden: false,
            defaultClass: 'small-filter',
            panelStyleClass: 'maxWidthOverride-sm',
            isCountableFilter: 1
          }

          //add to filter
          this.customFilterConfig.push(ratingFilter)
          this.dataSearch.paramsByStage.rating = selectedRatingIds == null ? null : selectedRatingIds;
          this.dataSearch.params.rating = selectedRatingIds == null ? null : selectedRatingIds;
        }

       //"Only My Tasks" filter
        let isShowMyTasks = this.dataSearch.isPageTabularView ? this.dataSearch.params.showMyTasks : this.dataSearch.paramsByStage.showMyTasks;
        let showMyTasksFilter = 
        {
          inputType: 'Checkbox',
          label: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_MY_TASKS')),
          name: 'showMyTasks',
          ngModel: isShowMyTasks,
          ngModelDefaultValue: true,
          isHidden: false,
          isCountableFilter: 1
        }
        this.customFilterConfig.push(showMyTasksFilter);
        if(showMyTasksFilter.ngModel == true){
          this.filterCount ++;
        }

        //Insert "BookMark" filter
        let isStarred = this.dataSearch.isPageTabularView ? this.dataSearch.params.showStarred : this.dataSearch.paramsByStage.showStarred;
        let showStarredFilter = 
        {
          inputType: 'Checkbox',
          label: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_STARRED')),
          name: 'showStarred',
          ngModel: isStarred,
          ngModelDefaultValue: false,
          isHidden: false,
          isCountableFilter: 1
        }
        this.customFilterConfig.push(showStarredFilter);
        if(showStarredFilter.ngModel == true){
          this.filterCount ++;
        }

        this.isfilterLoaded = true;

        // get data
        this.refreshData();
      }
      this._commonHelper.hideLoader();
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  addTaskCreatedDateRangeFilter() {

    // Task Created From Date Filter
    let selectedFromDate = this.dataSearch.isPageTabularView ? this.dataSearch.params.taskCreatedFromDate : this.dataSearch.paramsByStage.taskCreatedFromDate;
    let taskCreatedFromDateFilter = {
      inputType: 'DateFrom',
      label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_CREATED_FROM'),
      name: 'taskCreatedFromDate',
      ngModel: selectedFromDate,
      isHidden: false,
      defaultClass: 'small-filter',
      isCountableFilter: 0
    };
    this.customFilterConfig.push(taskCreatedFromDateFilter);

    // Task Created To Date Filter
    let selectedToDate = this.dataSearch.isPageTabularView ? this.dataSearch.params.taskCreatedToDate : this.dataSearch.paramsByStage.taskCreatedToDate;
    let taskCreatedToDateFilter = {
      inputType: 'DateTo',
      label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_CREATED_TO'),
      name: 'taskCreatedToDate',
      ngModel: selectedToDate,
      isHidden: false,
      defaultClass: 'small-filter',
      isCountableFilter: 0
    };
    this.customFilterConfig.push(taskCreatedToDateFilter);

    //daterange picker
    let dateRange = [];
    if (selectedFromDate != undefined && selectedFromDate != null) {
      dateRange.push(selectedFromDate);
    }
    if (selectedToDate != undefined && selectedToDate != null) {
      dateRange.push(selectedToDate);
    }

    let taskCreatedDateRangeFilter = {
      inputType: 'DateRangePicker',
      label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_CREATED_DATE'),
      ngModelDefaultValue: [],
      name: 'createdDates',
      ngModel: dateRange,
      isHidden: false,
      defaultClass: 'small-filter',
      fromDateControlName: 'taskCreatedFromDate',
      toDateControlName: 'taskCreatedToDate',
      isCountableFilter: 1
    };
    this.customFilterConfig.push(taskCreatedDateRangeFilter);
    if(taskCreatedDateRangeFilter.ngModel.length >0){
      this.filterCount ++;
    }
  }

  multiSelectFilterEvent(event) {
    if (event && event.controlName == 'entityIDs') {
      this.getRelatedTo(event.selectedIds,0, event.filter).then(results => {
        this.relatedTo = results;
        this.customFilterConfig[3].options = this.relatedTo;
      });
      
    }
    if (event && event.controlName == 'assignedToIDs') {
      this.getAssigedToUsers(event.selectedIds, 0, event.filter).then(results => {
        this.users = results;
        this.users.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_OPTION_TEXT_ASSIGNEDTO') });
        this.users.sort((a, b) => a.value - b.value);
        this.customFilterConfig[2].options = this.users;
      });
    }
    if (event && event.controlName == 'verifiedByIDs') {
      this.getVerifiedByUsers(event.selectedIds, 0, event.filter).then(results => {
        this.filterVerifiedByUsers = results;
        this.filterVerifiedByUsers.push({value: 0,label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_OPTION_TEXT_VERIFIEDBY')});
        this.filterVerifiedByUsers.sort((a, b) => a.value - b.value);
        this.customFilterConfig[11].options = this.filterVerifiedByUsers;
      });
    }
    if (event && event.controlName == 'stageIDs') {
      this.getStage().then(results => {
        this.filterStage = results;
        this.customFilterConfig[15].options = this.filterStage;
      });
    }
}

  getAssigedToUsers(selectedUserId: any, includeAllUsers, searchString: any): Promise<any> {
    //DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    const params = this.prepareParamsForAssignedToUsers('', selectedUserId, includeAllUsers, searchString);
    // call datasource service with params
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKASSIGNEDTO, params);
  }

  getVerifiedByUsers(selectedUserId: any, includeAllUsers, searchString: any): Promise<any> {
    // prepare params
    const params = this.prepareParamsForVerifiedByUser('', selectedUserId, includeAllUsers, searchString);
    // call datasource service with params
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKVERIFIEDBY, params);
  }

  getRelatedTo(selectedEntity: any, includeAllEntities, searchString: any): Promise<any> {
    // DD20220331 SDC-220: Entity Types dropdown and then based on that related to dropdown
    // prepare params
    const params = this.prepareParamsForRelatedTo(selectedEntity, includeAllEntities, searchString);
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKRELATEDENTITIES, params);
  }

  getWorkTaskTags(): Promise<any> {
    return this._entitytagsService.getActiveEntityTagsByEntityTypeId(this.entityTypeId, this.entityRecordTypeId);
  }

  getEntityTimespans(): Promise<any> {
    const params = { refType: RefType.EntityTimespan };
    //return this._commonService.getActiveReferenceTypeByRefType(params);
    return new Promise((resolve, reject) => {
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.EntityTimespan}`;
      // get data
      const refTypeEntityTimespan = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey, this.localStorageKeyPrefix));
      if (refTypeEntityTimespan == null) {
        this._commonHelper.showLoader();
        this.isInitialLoading = true;
        this._commonService.getActiveReferenceTypeByRefType(params)
          .then((response: any) => {
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
        resolve(refTypeEntityTimespan);
      }
    });
  }

  getPriority(): Promise<any> {
    return this._dataSourceService.getDataSourceDataByCode(DataSources.PRIORITY);
  }

  getSeverity(): Promise<any> {
    return this._dataSourceService.getDataSourceDataByCode(DataSources.SEVERITY);
  }

  getStage(): Promise<any> {
    const params= this.prepareParamsForEntityStagesByWorkflowId();
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITYSTAGESBYWORKFLOWID,params);
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

  prepareParamsForVerifiedByUser(stageId, verifiedBy, includeAllUsers = 1, searchString = '') {
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
      value: stageId,
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SelectedUserID',
      type: 'int',
      value: verifiedBy,
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

  //DD 20220331 SDC-220: datasources for entity types and related entities
  // prepare params for datasource with required fields
  prepareParamsRelatedToEntityTypes() {
    const params = [];
    const paramItem = {
      name: 'EntityWorkflowID',
      type: 'int',
      value: this.entityWorkflowId,
    };
    params.push(paramItem);

    return params;
  }

  //DD 20220331 SDC-220: datasources for entity types and related entities
  // prepare params for datasource with required fields
  prepareParamsForRelatedTo(selectedEntityID = null, includeAllEntities = 1, searchString: any = '') {
    const params = [];
    
    let paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: this.relatedEntityTypeId
    };
    params.push(paramItem);

    paramItem = {
      name: 'EntityRecordTypeID',
      type: 'int',
      value: this.relatedEntityRecordTypeId
    };
    params.push(paramItem);

    paramItem = {
      name: 'SelectedEntityID',
      type: 'int',
      value: selectedEntityID
    };
    params.push(paramItem);

    paramItem = {
      name: 'IncludeAllEntities',
      type: 'bit',
      value: includeAllEntities
    };
    params.push(paramItem);

    paramItem = {
      name: 'SearchString',
      type: 'string',
      value: searchString
    };
    params.push(paramItem);


    return params;
  }
  prepareParamsForEntityStagesByWorkflowId() {
    const params = [];
    let paramItem = {
      name: 'EntityWorkflowID',
      type: 'int',
      value: this.entityWorkflowId,
    };
    params.push(paramItem);
    return params;
  }

  prepareParamsForEntityStages() {
    const params = [];
    const paramItem = {
      name: 'EntityWorkflowID',
      type: 'int',
      value: this.entityWorkflowId,
    };
    params.push(paramItem);

    return params;
  }

  // when filter is changed
  getFilterValues(event) {
    let changefiltercount = 0;
    event.forEach(item => {
      this.dataSearch.params[Object.keys(item)[0]] = item[Object.keys(item)[0]];
      this.dataSearch.paramsByStage[Object.keys(item)[0]] = item[Object.keys(item)[0]];
      if(item[Object.keys(item)[0]] != '' && item[Object.keys(item)[0]] && item[Object.keys(item)[0]] != ActivityTimespan.ALLTIME && item.isCountableFilter == 1){
        changefiltercount++;
      }
    });
   
    this.filterCount = changefiltercount;

    this.dataSearch.params.pageNo = 1;
    this.dataSearch.paramsByStage.pageNo = 1;

    //set workTask search filter
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_WorkTasksKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);

    // check if table or kanban
    if (this.dataSearch.isPageTabularView) {
      this.getWorkTasks();
    }
    else {
      this.stages = [];
      this.workTaskList = [];
      // prepare stages
      this.prepareStages();
    }

    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedWorkTaskIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  // get work tasks for list
  getWorkTasks() {
    this._commonHelper.showLoader();
    this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null;

    this.dataSearch.params.taskCreatedFromDate = this.dataSearch.params.taskCreatedFromDate != null ? moment(this.dataSearch.params.taskCreatedFromDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.taskCreatedToDate = this.dataSearch.params.taskCreatedToDate != null ? moment(this.dataSearch.params.taskCreatedToDate).format('YYYY-MM-DD') : null;

    this._workTaskService.getWorkTasks(this.dataSearch.params).then((response: any) => {
    this.workTaskList = response;

      // prepare short name for assignedTo
      this.workTaskList.forEach(workTask => {
        let settingsJson = JSON.parse(workTask.settingsJson);
        const parentSubTypeDetails = this.entitySubTypes?.find(x => workTask.parentTypeID == x.id);
        workTask.isParentSubTypeViewWorkTask = parentSubTypeDetails?.viewPermissionHash != null ? this._commonHelper.havePermission(parentSubTypeDetails.viewPermissionHash) : this.isViewWorkTask;
        workTask.isParentSubTypeEditWorkTask = parentSubTypeDetails?.editPermissionHash != null ? this._commonHelper.havePermission(parentSubTypeDetails.editPermissionHash) : this.isEditWorkTask;
        workTask.isParentSubTypeDeleteWorkTask = parentSubTypeDetails?.deletePermissionHash != null ? this._commonHelper.havePermission(parentSubTypeDetails.deletePermissionHash) : this.isDeleteWorkTask;
        

        const subTypeDetails = this.entitySubTypes?.find(x => workTask.typeID == x.id);
        workTask.isViewWorkTask = subTypeDetails?.viewPermissionHash != null ? this._commonHelper.havePermission(subTypeDetails.viewPermissionHash) : this.isViewWorkTask;
        workTask.isEditWorkTask = subTypeDetails?.editPermissionHash != null ? this._commonHelper.havePermission(subTypeDetails.editPermissionHash) : this.isEditWorkTask;
        workTask.isDeleteWorkTask = subTypeDetails?.deletePermissionHash != null ? this._commonHelper.havePermission(subTypeDetails.deletePermissionHash) : this.isDeleteWorkTask;
        
        //Privacy Icon
        let privacyDetails = this.entityPrivacyDetails?.find((x: any) => x.intValue1 == workTask?.privacyLevel);
        workTask.privacyIcon = privacyDetails?.strValue1;
        workTask.privacyToolTip = privacyDetails?.name;

        workTask.description = this._commonHelper.htmlToPlainText(workTask.description);
        workTask.labelTooltip1 = settingsJson.Token1Tooltip;
        workTask.parentLabelTooltip1 = settingsJson.ParentTokenTooltip;
        if ((workTask.assignedTo == this._loggedInUser.userId || workTask.isHandRaised) && workTask.isEditWorkTask) {
          workTask.showRaiseHandButtons = true;
        } else {
          workTask.showRaiseHandButtons = false;
        }
      });
      //reset selected
      this.isAllCheckBoxSelected =false;
      this.workTaskList.forEach(f=>f.isSelected = false);
      // total
      this.totalRecords = this.workTaskList.length > 0 ? response[0].totalRecords : 0;
      this.dt.rows = this.dataSearch.params.pageSize;
      this.totalPages = Math.ceil(this.totalRecords / this.dataSearch.params.pageSize);
      this.end = this.dataSearch.params.pageNo == this.totalPages ? this.totalRecords : this.dataSearch.params.pageNo * this.dataSearch.params.pageSize;
      this.start = this.end == this.totalRecords ? (this.totalRecords - this.workTaskList.length + 1) : (this.end - this.dataSearch.params.pageSize) + 1;
      
      //set Action column show/hide dynamically
        this.isStageClosedOrCompleted = this.workTaskList.filter(x => x.isCompletedStage || x.isClosedStage).length;
        if ((!this.isAllowToReopen && !this.isDeleteWorkTask) || (this.isStageClosedOrCompleted < 0 && this.isAllowToReopen)) {
          let entityNameColumn = this.cols.find(c => c.field == 'id');
          entityNameColumn.visible = false;
        }
        else {
          let entityNameColumn = this.cols.find(c => c.field == 'id');
          entityNameColumn.visible = true;
        }

      if (this.selectedWorkTaskIdForActivityCenter != null && this.selectedWorkTaskIdForActivityCenter > 0 && this.workTaskList.some(x=>x.id == this.selectedWorkTaskIdForActivityCenter)) {
        this.updateEntityDetails(true, this.workTaskList.find(x=>x.id == this.selectedWorkTaskIdForActivityCenter));
      }
      else{
        this.resetSelectedEntity();
      }

      this._commonHelper.hideLoader();
    }, (error) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(error.message);
    });
  }

  // get stage wise data params
  getParamObj(stageId: number) {
    this.dataSearch.paramsByStage.stageId = stageId;
    return this.dataSearch.paramsByStage;
  }

  // get work tasks by stage
  getEntityStagesWithTask() {
    const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
    if (entityStagesWithTasks == null) {
      return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId).then(
        (response: any[]) => {
          this.workTaskListByStages = JSON.parse(JSON.stringify(response));
          this.workTaskListByStages.forEach((stage: any) => {
            // stage tasks
            if (stage.stageTasks != null) {
              stage.stageTasks = JSON.parse(stage.stageTasks);
              // all stage tasks - change label if task is required
              stage.stageTasks.forEach(stageTask => {
                if (stageTask.isRequired) {
                  stageTask.name = stageTask.name + ' *';
                }
              });
            }
          });
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.workTaskListByStages));
          this._commonHelper.hideLoader();
          resolve(null);
        }, (error) => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrError(error.message);
          reject(null);
        }
      );
     });
    }
    else {
      this.workTaskListByStages = entityStagesWithTasks;
    }
  }

  // prepare stages with tasks
  private async prepareStages() {
    this.workTaskListByStages.forEach((stage: any) => {
      // stage view
      let kanbanStage: KanbanStage = {
        id: stage.id,
        name: stage.name,
        stage: "",
        totalItems: 0,
        totalOpportunityValue:0,
        isCompleted: stage.isCompleted,
        isClosed: stage.isClosed,
        isFrozen: stage.isFrozen,
        isNoteRequired: stage.isNoteRequired,
        created: stage.created,
        tasks: stage.stageTasks,
        pagination: { pageNo: 1, totalPages: 1 },
        displayOrder: stage.displayOrder,
        isAllTasksRequired: stage.isAllTasksRequired,
        transitionAssociates: stage.transitionAssociates,
        showLoader : true,
      }

      // add to list
      this.stages.push(kanbanStage);
    });

     // for each stage get data - wait for all the iteration promise values received
     await Promise.all(
      this.stages.map(async (stage, index) => {
        await this.getStageItems(index, false);
    }));

    if (!this.selectedCardExists) {
      this.resetSelectedEntity();
    }

    this.selectedCardExists = false;
  }

  private getTags(element: any) {
    let tagDropDownElement: any = {};
    tagDropDownElement.label = element.tagCategoryName;
    let tagList = [];
    element.entityTagList.forEach(tag => {
      tagList.push({ label: tag.name, value: tag.id });
    });
    tagDropDownElement.items = tagList;
    return tagDropDownElement;
  }

  private async getStageItems(index: number, isAppend: boolean) {
    return new Promise((resolve, reject) => {
      //Show Activity Section Loader
      if (this.activitySection) {
        this.activitySection.showLoader();
      }
      let stageId = this.stages[index].id;
      this.stages[index].showLoader = true;

      let params = this.getParamObj(stageId);
      params.dueStartDate = params.dueStartDate != null ? moment(params.dueStartDate).format('YYYY-MM-DD') : null;
      params.dueEndDate = params.dueEndDate != null ? moment(params.dueEndDate).format('YYYY-MM-DD') : null;

      params.taskCreatedFromDate = params.taskCreatedFromDate != null ? moment(params.taskCreatedFromDate).format('YYYY-MM-DD') : null;
      params.taskCreatedToDate = params.taskCreatedToDate != null ? moment(params.taskCreatedToDate).format('YYYY-MM-DD') : null;
      this._workTaskService.getWorkTasksByStage(params).then(
        (tasks: any) => {
          this.workTaskList.push(...tasks);
          // for each task prepare card
          let kanbanStageCards: KanbanStageCard[] = [];
          tasks.forEach((task: any) => {
            // set total
            this.stages[index].totalItems = task.totalRecords;

            const taskIds: Array<number> = task.selectedStageTaskIds
              ? task.selectedStageTaskIds.split(",").map(m => Number(m))
              : [];

            // check if the current assigned to and logged in user is same
            var isSelectedTasksDisabled: boolean = true;
            var showPauseResumeButtons: boolean = false;
            var showAddSubWorkTaskButton: boolean = false;
            let showRaiseHandButtons: boolean = false;
            let canUserMoveTask: boolean = this.canUserChangeStage(this.stages[index], task);
            var isShowMoreDetailButton: boolean = false;
              
            // check subtype Permission
            const parentSubTypeDetails = this.entitySubTypes?.find(x => task.parentTypeID == x.id);
            task.isParentSubTypeViewWorkTask = parentSubTypeDetails?.viewPermissionHash != null ? this._commonHelper.havePermission(parentSubTypeDetails.viewPermissionHash) : this.isViewWorkTask;
            task.isParentSubTypeEditWorkTask = parentSubTypeDetails?.editPermissionHash != null ? this._commonHelper.havePermission(parentSubTypeDetails.editPermissionHash) : this.isEditWorkTask;
            task.isParentSubTypeDeleteWorkTask = parentSubTypeDetails?.deletePermissionHash != null ? this._commonHelper.havePermission(parentSubTypeDetails.deletePermissionHash) : this.isDeleteWorkTask;

            const subTypeDetails = this.entitySubTypes?.find(x => task.typeID == x.id);
            task.isViewWorkTask = subTypeDetails?.viewPermissionHash != null ? this._commonHelper.havePermission(subTypeDetails.viewPermissionHash) : this.isViewWorkTask;
            task.isEditWorkTask = subTypeDetails?.editPermissionHash != null ? this._commonHelper.havePermission(subTypeDetails.editPermissionHash) : this.isEditWorkTask;
            task.isDeleteWorkTask = subTypeDetails?.deletePermissionHash != null ? this._commonHelper.havePermission(subTypeDetails.deletePermissionHash) : this.isDeleteWorkTask;
          

            // check hidden
            var checkAnyoneCanSelectStageTasks: boolean = false;
            // if tenant setting is true no need to check current logged in user 
            if (this.workTaskStageTaskChange.toLowerCase() == "yes") {
              checkAnyoneCanSelectStageTasks = true;
            }
            else if (task.assignedTo == this._loggedInUser.userId) {
              checkAnyoneCanSelectStageTasks = true;
            }
            else {
              checkAnyoneCanSelectStageTasks = false;
            }

            if ((checkAnyoneCanSelectStageTasks || this.isResumeTask) && task.isEditWorkTask) {
              isSelectedTasksDisabled = false;
              showPauseResumeButtons = true;
            }

            //Raise Hand Task condition
            if ((task.assignedTo == this._loggedInUser.userId || task.isHandRaised) && task.isEditWorkTask) {
              showRaiseHandButtons = true;
            }

            // show/hide add sub work task button
            let entitySubTypeLevel = this.entitySubTypes.find(x=> x.id == task.typeID)?.level;
            let availableSubWorktaskTypeDetails = this.entitySubTypes.filter(x=> x.parentID == task.typeID && x.level == entitySubTypeLevel + 1);
            if (availableSubWorktaskTypeDetails.length > 0) {
              showAddSubWorkTaskButton = true;
            }
            
            if(task.isViewWorkTask)
            {
              isShowMoreDetailButton = true;
            }

            let privacyDetails = this.entityPrivacyDetails?.find((x: any) => x.intValue1 == task?.privacyLevel);
            let privacyIcon = privacyDetails?.strValue1;
            let privacyToolTip = privacyDetails?.name;

            let settingsJson = JSON.parse(task.settingsJson);
            const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.relatedEntityTypeId);

            // prepare card data
            let kanbanStageCard: KanbanStageCard = {
              id: task.id,
              stageId: task.stageId,
              labelType1: KanbanBoardTokenTypes[settingsJson.Token1Type as keyof typeof KanbanBoardTokenTypes],
              label1: settingsJson.Token1Text,
              label1RedirectURL: settingsJson.Token1Url,
              labelTooltip1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.Token1Tooltip)),
              label1IconClass: settingsJson?.Token1IconClass,
              labelType2: KanbanBoardTokenTypes[settingsJson.Token2Type as keyof typeof KanbanBoardTokenTypes],
              label2: settingsJson.Token2Text,
              labelTooltip2: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.Token2Tooltip)),
              label2RedirectURL: settingsJson.Token2Url,
              labelType3: KanbanBoardTokenTypes[settingsJson.Token3Type as keyof typeof KanbanBoardTokenTypes],
              label3: settingsJson.Token3Text,
              labelTooltip3: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.Token3Tooltip)),
              label3RedirectURL: settingsJson.Token3Url,
              entityId: task.entityId,
              entityTypeId: task.entityTypeId,
              entityTypeName: task.entityTypeName,
              relatedToLabel: task.entityName,
              relatedToIconClass: this._commonHelper.getEntityIconClass(task.entityTypeId),
              relatedToIconToolTip: foundRecord?.['displayName'].toString().trim(),
              relatedToTooltip: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.TOOLTIP_RELATED_TO') + ': '+ task.entityName,
              relatedToRedirectURL: this.onRelatedToClick(task),
              selectedTasks: (this.stages[index].tasks || []).filter(f => taskIds.includes(f.id)) || [],
              selectedTasksDisabled: isSelectedTasksDisabled,
              isPaused: task.isPaused,
              isPausedTooltip: task.isPaused != null && task.isPaused ? this._commonHelper.getInstanceTranlationData('WORKTASK.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('WORKTASK.LABEL_SWITCH_PAUSE'),
              pausedLabel: this._commonHelper.getInstanceTranlationData('WORKTASK.LABEL_SWITCH_PAUSE'),
              resumeLabel: this._commonHelper.getInstanceTranlationData('WORKTASK.LABEL_SWITCH_RESUME'),
              resumeNotAccess: this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_RESUME_NOT_ACCESS'),
              showPauseResumeButtons: showPauseResumeButtons,
              availableSubWorkTaskTypeDetails: availableSubWorktaskTypeDetails,
              entitySubTypeId: task.typeID,
              showAddSubWorkTaskButton: showAddSubWorkTaskButton,
              subWorkTaskToolTipPrefix: this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.SUB_WORK_TASKS_TAB.ADD_SUBTASK_PREFIX'),
              canUserChangeStage: canUserMoveTask,
              owner1Id: task.assignedTo,
              owner1Name: task.assignedToName,
              owner1Tooltip: task.assignedToName ? `${this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.TOOLTIP_ASSIGN_TO')}: ${task.assignedToName}` : this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.TOOLTP_ASSIGN_TO_ACTION')),
              owner1userTypeId: this.userTypeID.AssignedTo,
              priority: task.priority,
              priorityName: task.priorityName,
              priorityTooltip: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.TOOLTIP_PRIORITY'),
              priorityDefaultTooltip: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.TOOLTIP_PRIORITY_DEFAULT'),
              severity: task.severity,
              severityName: task.severityName,
              severityTooltip: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.TOOLTIP_SEVERITY'),
              severityDefaultTooltip: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.TOOLTIP_SEVERITY_DEFAULT'),
              disabled: task.isPaused != null ? task.isPaused : false,
              parentID: task.parentID,
              parentTokenType: KanbanBoardTokenTypes[settingsJson.ParentTokenType as keyof typeof KanbanBoardTokenTypes],
              parentLabel: settingsJson.TokenText,
              parentLabelTooltip1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.ParentTokenTooltip)),
              parentLabelRedirectUrl: settingsJson.ParentTokenUrl,
              parentLabelIconClass: settingsJson?.ParentTokenIconClass,
              parentName:task?.parentName,
              parentNameToolTip:this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.PARENT_TOOLTIP_NAME'),
              isSubTask: task.isSubTask,
              isHandRaised: task.isHandRaised,
              showRaiseHandButtons: showRaiseHandButtons,
              handRaisedTooltipText: task.isHandRaised != null && task.isHandRaised ? this._commonHelper.getInstanceTranlationData('WORKTASK.LABEL_HAND_UNRAISED') : this._commonHelper.getInstanceTranlationData('WORKTASK.LABEL_HAND_RAISED'),
              owner2Id: task.verifiedBy,
              owner2Name: task.verifiedByName,
              owner2Tooltip: task.verifiedByName ? `${this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.TOOLTIP_VERIFIED_BY')}: ${task.verifiedByName}` : this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.TOOLTP_VERIFIED_BY_ACTION'),
              owner2userTypeId: this.userTypeID.VerifiedBy,
              owner3Id: task.createdBy,
              owner3Name: task.createdByName,
              owner3Tooltip: task.createdByName ? `${this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.TOOLTIP_VERIFIED_BY')}: ${task.createdByName}` : this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.KANBAN.TOOLTP_VERIFIED_BY_ACTION'),
              owner3userTypeId: this.userTypeID.CreatedBy,
              cardColorClass: task.cardColorClass,
              isClosedStage: task.isClosedStage,
              isCompletedStage: task.isCompletedStage,
              stageName: task.stageName,
              entityIcon: settingsJson?.Token1IconClass,
              entityRecordTypeId: task?.entityRecordTypeId,
              entityRecordTypeName: task.entityRecordTypeName,
              entityName: this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.WORK_TASK_NAME_LABEL'),
              createdBy: task?.createdBy,
              stagesTasks: this.stages[index]?.tasks,
              rating: task?.rating,
              privacyLevel: task?.privacyLevel,
              review: task?.totalReviews,
              privacyIcon: privacyIcon,
              privacyToolTip: privacyToolTip,
              created: task?.created,
              isEditParentSubTypePermission:task?.isParentSubTypeEditWorkTask,
              isViewParentSubTypePermission:task?.isParentSubTypeViewWorkTask,
              isEditSubTypePermission: task?.isEditWorkTask,
              isViewSubTypePermission: task?.isViewWorkTask,
              isShowMoreDetailButton: isShowMoreDetailButton,
              entityReviewID: task.entityReviewID,
              isStarred: task?.isStarred,
              isEntityReviewEditable: !(task?.isPaused ?? false), 
              userLabel1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('COMMON.COMMON_USER_PROFILE.LABEL_ASSIGNEDTO')),
              userLabel2: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('COMMON.COMMON_USER_PROFILE.LABEL_VERIFIEDBY')),
              userLabel3: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('COMMON.COMMON_USER_PROFILE.LABEL_CREATEDBY')),
              isResumeRecord: this.isResumeTask,
              loggedInUser: this._loggedInUser.userId,
              isShowPauseOrResume: (!task.isCompletedStage && !task.isClosedStage) ? true : false
            }
            // new Date(moment(task?.created).utc().format('YYYY-MM-DD')),
            if (!isAppend && this.selectedWorkTaskIdForActivityCenter != null && this.selectedWorkTaskIdForActivityCenter > 0 && kanbanStageCard.id == this.selectedWorkTaskIdForActivityCenter) {
              this.updateEntityDetails(false, kanbanStageCard);
              this.selectedCardExists = true;
            }

            // push to list
            kanbanStageCards.push(kanbanStageCard);
          });

          if (isAppend) {
            // append cards
            this.stages[index].cards.push(...kanbanStageCards);
          }
          else {
            // assign to cards variable
            this.stages[index].cards = kanbanStageCards;
          }

          //reset pagination
          this.stages[index].pagination.totalPages = this.stages[index].totalItems > this._commonHelper.DefaultPageSizeForKanban ? Math.ceil(this.stages[index].totalItems / this._commonHelper.DefaultPageSizeForKanban) : 1;

          // total items
          if (tasks.length == 0 || tasks == undefined) {
            this.stages[index].totalItems = 0;
          }

          // data loaded
          this.stages[index].showLoader = false;

          //Hide Activity Section Loader
          if (this.activitySection) {
            this.activitySection.hideLoader();
          }

          resolve(null);
        }
      );
    });
  }

  private canUserChangeStage(currentStage, worktask): boolean {
    if (currentStage == null || worktask == null) {
      return true;
    }

    let canUserMoveTask: boolean = false;
    if (currentStage.transitionAssociates != null && currentStage.transitionAssociates != '') {
      const associates = currentStage.transitionAssociates.trim().split(',');
      associates.forEach(associate => {
        const associatePropertyName = this._commonHelper.convertToCamalize(associate);
        canUserMoveTask = canUserMoveTask || (worktask.hasOwnProperty(associatePropertyName) ? (worktask[associatePropertyName] == this._loggedInUser.userId) : false);
      });
    }
    else {
      canUserMoveTask = true;
    }
    return canUserMoveTask
  }

  //get entity stage wise data
  getEntityStageData(stageId, isAppend) {
    // get current stage index
    let index: number = this.stages.findIndex(el => el.id == stageId);
    // get cards for this stage only
    this.workTaskList = this.workTaskList.filter((item) => item.stageId !== stageId);
    //get data
    this.getStageItems(index, isAppend).then(() => {
      this._fileSignedUrlService.getFileSingedUrl(this.stages[index].cards, 'owner1Image', 'owner1SignedUrl', Entity.Users)
        .then(() => {
          this._fileSignedUrlService.getFileSingedUrl(this.stages[index].cards, 'owner2Image', 'owner2SignedUrl', Entity.Users);
        });
    });
  }

  showhideFilter(){
    this.isFilterVisible = !this.isFilterVisible;
  }

  isFilterVisibleChange(value:boolean){
    this.isFilterVisible = value;
  }

  //page layout toggle table or grid(kanbar)
  onTogglePageLayout(pageLayout: string) {
    if (pageLayout === 'CARD') {
      this._gaService.event('Worktask_Switch_Layout','Worktask_Workflow_Layout','Kanban',1,true,
      {
        'LoggedUserId':this._loggedInUser.userId,
        'TenantId':this._loggedInUser.tenantId
      });
      // reset
      this.dataSearch.paramsByStage.pageNo = 1;
      this.stages = [];
      this.workTaskList = [];
      // prepare stages
      this.prepareStages();
      this.dataSearch.isPageTabularView = false;
    } else {
      this._gaService.event('Worktask_Switch_Layout','Worktask_Workflow_Layout','List',1,true,
      {
        'LoggedUserId':this._loggedInUser.userId,
        'TenantId':this._loggedInUser.tenantId
      });
      this.dataSearch.isPageTabularView = true;
      this.dataSearch.params.pageNo = 1;

      this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null
      this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null

      this.dataSearch.params.taskCreatedFromDate = this.dataSearch.params.taskCreatedFromDate != null ? moment(this.dataSearch.params.taskCreatedFromDate).format('YYYY-MM-DD') : null
      this.dataSearch.params.taskCreatedToDate = this.dataSearch.params.taskCreatedToDate != null ? moment(this.dataSearch.params.taskCreatedToDate).format('YYYY-MM-DD') : null
      this.workTaskList = [];
      this.getWorkTasks();
    }

   //set hidden for stage filter
   let stageFilter =  this.customFilterConfig.find(x => x.name === 'stageIDs');
   if (stageFilter) {
    stageFilter['isHidden'] = pageLayout === 'CARD';
   }

      this.resetSelectedEntity();

    //set workTask search filter
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_WorkTasksKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);

    //set quickview config
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedWorkTaskIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  //workTask card drag-drop to other card
  onDropSuccess(event: CdkDragDrop<{}[]>) {
    if(!event.item.data.isEditSubTypePermission){
      this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
      return;
    }

    //check can user change stage
    if (!event.item.data.canUserChangeStage) {
      if (this.changeWorkTaskStage) {
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterDropSuccess(event);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
      }
    }
    else {
      this.afterDropSuccess(event);
    }
  }

  private afterDropSuccess(event: CdkDragDrop<{}[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    else {
      const workTaskId = event.item.data.id;
      const workTaskStageId = +event.item.data.stageId;

      //Check Is All Tasks Required for current Entity Stage before move onto the next Entity Stage.
      const isAllTasksRequired = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageIsAllTasksRequired').innerHTML;
      const previousStageId = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;

      // if any one of the current stage task is required
      let anyTasksIsRequired: boolean = false;
      let requiredTasks: any[] = [];
      // find out the current stage
      let currentStage = this.workTaskListByStages.find(x => x.id == previousStageId);
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
        this._workflowmanagementService.isEntityStageTasksCompleted(workTaskId, this.entityTypeId, workTaskStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response === true) {
            this.checkHandRaised(event);
          } else {
            //Stage Tasks are not completed..
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_BEFORE_MOVE_WORK_TASK_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
            return false;
          }
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
      else if (isAllTasksRequired && isAllTasksRequired.toLowerCase() == "true") {
        /**
          * Call API to validate worktask has completed all the stage tasks before moving on to other stage.
          * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (WorkTaskId)
          * */
        this._commonHelper.showLoader();
        this._workflowmanagementService.isEntityStageTasksCompleted(workTaskId, this.entityTypeId, workTaskStageId, this.entityWorkflowId, null).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response === true) {
            this.checkHandRaised(event);
          } else {
            //Stage Tasks are not completed..
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_BEFORE_MOVE_WORK_TASK_STAGE_TASK_SHOULD_BE_COMPLETED'));
            return false;
          }
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      } else {
        this.checkHandRaised(event);
      }
    }
  }

  checkHandRaised(event: CdkDragDrop<{}[]>) {

    const workTaskId = event.item.data.id;
    const workTaskStageId = +event.item.data.stageId;

    this._commonHelper.showLoader();

    this._workflowmanagementService.isEntityStageRaiseHandTransitionExist(workTaskId, this.entityTypeId, this.entityWorkflowId, workTaskStageId).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response === true) {
        //Hand Raised - Not allowe to move the stage
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_BEFORE_MOVE_WORK_TASK_FOR_RAISED_HAND_TASK'));
        return false;
      } else {
        this.moveEntity(event);
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  moveEntity(event: CdkDragDrop<{}[]>) {

    const workTaskId = event.item.data.id;
    const workTaskStageId = +event.item.data.stageId;
    const dropWorkTaskStageId = +event.container.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;
    const dropWorkTaskStageName = event.container.element.nativeElement.querySelector('div .cards-header #stageName').innerHTML;
    const isNoteRequired = event.container.element.nativeElement.querySelector('div .cards-header #stageNoteRequired').innerHTML;
    const assignedTo = event.item.data.owner1Id;
    const verifiedBy = event.item.data.owner2Id;
    const isCompletedStage = event.item.data.isCompletedStage;
    const isClosedStage = event.item.data.isClosedStage;
    const stageName = event.item.data.stageName;

    let currentStage = this.stages.find(x => x.id == workTaskStageId);
    let dropStage = this.stages.find(x => x.id == dropWorkTaskStageId);

    if(isCompletedStage || isClosedStage)
    {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }

    // check if note is required
    if (isNoteRequired == 'true') {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = workTaskId;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropWorkTaskStageName }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = dropWorkTaskStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(noteDate => {
        if (noteDate != undefined) {
          // save to transition
          Promise.all([
            this.saveWorkTaskStage(workTaskId, workTaskStageId, dropWorkTaskStageId, dropWorkTaskStageName, assignedTo, verifiedBy, isCompletedStage, isClosedStage, stageName)
          ]).then(() => {
            const param = {
              entityTypeId: this.entityTypeId,
              entityId: workTaskId,
              workflowId: this.entityWorkflowId,
              workflowStageId: dropWorkTaskStageId,
              stageNoteID: noteDate.id,
              pauseNoteID: null,
              processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.StageNote
            };

            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityWorkflowStageValueNote(param).then(() => {
              this._commonHelper.hideLoader();

              currentStage.pagination.pageNo = 1; //reset current pagination stats of source stage
              dropStage.pagination.pageNo = 1; //reset current pagination stats of target stage
              this.dataSearch.paramsByStage.pageNo = 1 //rest global stage params pagination stage

              this.getEntityStageData(workTaskStageId, false); // refresh current stage
              this.getEntityStageData(dropWorkTaskStageId, false); // refresh drop stage 
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
          }).catch(() => {
            //this.refreshData();
          });
        }
      });
    }
    else {
      // save to transition
      Promise.all([
        this.saveWorkTaskStage(workTaskId, workTaskStageId, dropWorkTaskStageId, dropWorkTaskStageName, assignedTo, verifiedBy, isCompletedStage, isClosedStage, stageName)
      ]).then(() => {

        currentStage.pagination.pageNo = 1; //reset current pagination stats of source stage
        dropStage.pagination.pageNo = 1; //reset current pagination stats of target stage
        this.dataSearch.paramsByStage.pageNo = 1 //rest global stage params pagination stage

        this.getEntityStageData(workTaskStageId, false); // refresh current stage
        this.getEntityStageData(dropWorkTaskStageId, false); // refresh drop stage 
      }).catch(() => {
        //this.refreshData();
      });
    }
  }

  //work task stage change save
  saveWorkTaskStage(workTaskId, workTaskStageId, dropWorkTaskStageId, dropWorkTaskStageName, assignedTo, verifiedBy, isCompletedStage, isClosedStage, stageName) {
    return new Promise((resolve, reject) => {
      let assignedToForDto = assignedTo;
      this._commonHelper.showLoader();
      if(isCompletedStage || isClosedStage)
      {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
        return;
      }
      else
      {
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: workTaskId, stageId: dropWorkTaskStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedTo, verifiedBy: verifiedBy, oldStageId: workTaskStageId }).then((response: any) => {
        if (response) {

          this.worktaskAssignedTo = response;
          if (assignedToForDto != this.worktaskAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._workTaskService.updateWorkTaskAssignedTo({ entityId: workTaskId, assignedToId: this.worktaskAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.worktaskAssignedTo.isForcedAssignment }).then((response: any) => {
              if (response) {
                assignedToForDto = this.worktaskAssignedTo.assignedToId;
                // success message
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_WORK_TASK_MOVETO_STAGE',
                    { stageName: dropWorkTaskStageName })
                );
              }
              this._commonHelper.hideLoader();
              resolve(null);
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
                reject(null);
              }
            );
          }
          else {
            // success message
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_WORK_TASK_MOVETO_STAGE',
                { stageName: dropWorkTaskStageName })
            );
            resolve(null);
          }
        }
        this._commonHelper.hideLoader();
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
      }
    });
  }
  

  //card click navigate to detail page
  onClickWorkTaskCard(ev, workTask) {
    if (!workTask.isConvertedToProspect) {
      if ((ev.tagName.toLowerCase() === 'p') || (ev.tagName.toLowerCase() === 'section')) {
        this._router.navigateByUrl('/worktasks/details/' + this.entityWorkflowId + "/" + workTask.id);
      }
    }
  }

  // event emitted from kanban
  onWorkTaskClick(workTask) {
    // check logged in user have permission to view work task details
    if (!workTask.isViewWorkTask) {
      return;
    }

    // if not undefined then redirect
    if (workTask.id != undefined) {
      this._router.navigate(['worktasks', 'details', this.entityWorkflowId ,workTask.id]);
    }
  }

  // event emitted from kanban
  onRelatedToClick(workTask) {
    // check logged in user have permission to view related entity details
    if (!this._commonHelper.isUserHaveViewPermissionOfRelatedEntity(workTask.entityTypeId)) {
      return this._router.url;
    }

    // if not undefined then redirect
    if (workTask.entityTypeName != undefined && workTask.entityId != undefined) {
      return '/' + this._commonHelper.getRouteNameByEntityTypeId(workTask.entityTypeId).toLowerCase() + '/details/' + workTask.entityId;
    }
    return this._router.url;
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
  
  onRowClick(rowData: any, isShowActivityCenter:boolean = null) {

    if (this.rowActionButtonMouseHoverFlag) {
      return;
    }

    const taskIds: Array<number> = rowData.selectedStageTaskIDs ? rowData.selectedStageTaskIDs.split(",").map(m => Number(m)) : [];

    const stageTasks = this.workTaskListByStages?.find(x => x.id == rowData?.stageId)?.stageTasks;
    const settingsJson = JSON.parse(rowData.settingsJson);

    let showAddSubWorkTaskButton: boolean = false;
    var isShowMoreDetailButton: boolean = false;
    // show/hide add sub work task button
    let entitySubTypeLevel = this.entitySubTypes.find(x => x.id == rowData.typeID)?.level;
    let availableSubWorktaskTypeDetails = this.entitySubTypes.filter(x => x.parentID == rowData.typeID && x.level == entitySubTypeLevel + 1);
    this.availableSubWorkTaskTypeNamesForWorkTaskDelete = availableSubWorktaskTypeDetails?.map(x => x.name).join(" or ")?.trim() ?? null;
    if (availableSubWorktaskTypeDetails.length > 0) {
      showAddSubWorkTaskButton = true;
    }

    if(rowData.isViewWorkTask)
    {
      isShowMoreDetailButton = true;
    }
    
    let privacyDetails = this.entityPrivacyDetails?.find((x: any) => x.intValue1 == rowData?.privacyLevel);
    let privacyIcon = privacyDetails?.strValue1;
    let privacyToolTip = privacyDetails?.name;

    const obj = {
      id: rowData.id,
      entityIcon: settingsJson?.Token1IconClass,
      entityName: rowData?.typeName,
      label1: settingsJson.Token1Text,
      label1RedirectURL: settingsJson.Token1Url,
      label1IconClass: settingsJson?.Token1IconClass,
      labelTooltip1: settingsJson.Token1Tooltip,
      label2: settingsJson.Token2Text,
      label2RedirectURL: settingsJson.Token2Url,
      label3: settingsJson.Token3Text,
      label3RedirectURL: settingsJson.Token3Url,
      relatedToId: rowData?.entityId,
      relatedToLabel: rowData?.entityName,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      entityRecordTypeId: rowData?.entityRecordTypeId,
      stagesTasks: stageTasks,
      selectedTasks: (stageTasks || []).filter(f => taskIds.includes(f.id)) || [],
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo ? rowData?.assignedTo : rowData?.owner1Id ? rowData?.owner1Id : '',
      stageId: rowData?.stageId,
      stageName: rowData?.stageName,
      relatedToRedirectURL: this.onRelatedToClick(rowData),
      relatedToIconToolTip: this._commonHelper.entityTypeList.find(entityType => entityType['id'] == rowData?.entityTypeId)?.displayName.toString().trim(),
      isClosedStage: rowData?.isClosedStage,
      isCompletedStage: rowData?.isCompletedStage,
      isPaused: rowData?.isPaused,
      isHandRaised: rowData.isHandRaised,
      entityTypeId: rowData?.entityTypeId,
      entityId: rowData?.entityId,
      availableSubWorkTaskTypeDetails: availableSubWorktaskTypeDetails,
      entitySubTypeId: rowData?.typeID,
      showAddSubWorkTaskButton : showAddSubWorkTaskButton,
      privacyLevel: rowData?.privacyLevel,
      createdBy: rowData?.createdBy,
      subWorkTaskToolTipPrefix: this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.SUB_WORK_TASKS_TAB.ADD_SUBTASK_PREFIX'),
      privacyIcon: privacyIcon,
      privacyToolTip: privacyToolTip,
      isStarred: rowData?.isStarred,
      isShowMoreDetailButton: isShowMoreDetailButton,
      showRaiseHandButtons: rowData.showRaiseHandButtons,
      isResumeRecord: this.isResumeTask,
      loggedInUser: this._loggedInUser.userId,
      isShowPauseOrResume: (!rowData.isCompletedStage && !rowData.isClosedStage) ? true : false,
      isViewSubTypePermission: this.isViewWorkTask
    }
    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id;
    this.workTaskCreatedBy = rowData?.createdBy;
    this.workTaskPrivacyLevel = rowData?.privacyLevel;

    this.selectedWorkTaskForActivityCenter = rowData;
    this.selectedWorkTaskIdForActivityCenter = rowData.id;
    this.selectedWorkTaskIsPausedForActivityCenter = (rowData?.isPaused ?? false);
    this.selectedWorkTaskIsClosedForActivityCenter = rowData?.isClosedStage;
    this.selectedWorkTaskIsCompletedForActivityCenter = rowData?.isCompletedStage;

    this.isFromKanbanOrListView =false;
    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedCardEntityId: this.selectedRowId,
      selectedRowEntityId: this.selectedRowId
    }

    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && rowData.isViewWorkTask);
  }

  // event emitted from kanban
  onCardClick(workTask, isShowActivityCenter:boolean = null) {
    this.workTaskCreatedBy = workTask?.createdBy;
    this.workTaskPrivacyLevel = workTask?.privacyLevel;
    workTask.entityWorkflowId = this.entityWorkflowId;
    workTask.entityTypeId = workTask?.entityTypeId;
    workTask.relatedToIconToolTip = this._commonHelper.entityTypeList.find(entityType => entityType['id'] == workTask?.entityTypeId)?.displayName.toString().trim();
    this.entityDetails = this._commonHelper.cloningObject(workTask);
    this.selectedWorkTaskForActivityCenter = workTask;
    this.selectedWorkTaskIdForActivityCenter = workTask.id;
    this.selectedWorkTaskIsPausedForActivityCenter = (workTask?.isPaused ?? false);
    this.selectedWorkTaskIsClosedForActivityCenter = workTask?.isClosedStage;
    this.selectedWorkTaskIsCompletedForActivityCenter = workTask?.isCompletedStage;
    this.isFromKanbanOrListView =false;
    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedCardEntityId: workTask.id,
      selectedRowEntityId: workTask.id
    };

    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && workTask.isViewSubTypePermission);
  }

  onEntityStageTasksSelect(event) {
    if(!this.dataSearch.isPageTabularView) {
      const currentStage = this.stages?.find(s => s.id == event.stageId); 
      const currentCard = currentStage?.cards?.find((k: any) => k.id  == event.id)
      currentCard.selectedTasks = event?.selectedTasks;
    }else{
      const temp = this.workTaskList.find(x => x.id == event.id);
      temp.selectedStageTaskIDs = event.selectedTasks.map(x=>x.id).toString();
    }
  }

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

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && details.isViewSubTypePermission;
        this.selectedWorkTaskIdForActivityCenter = details.id;
        this.selectedWorkTaskForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedWorkTaskIsPausedForActivityCenter = (details?.isPaused ?? false);
        this.selectedWorkTaskIsClosedForActivityCenter = details?.isClosedStage;
        this.selectedWorkTaskIsCompletedForActivityCenter = details?.isCompletedStage;
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

  // open add popup
  onSubTaskCreateForWorkTask(workTask) {
    
    if (workTask != null && workTask.isPaused) {
      return;
    }

    if ((workTask != null && (workTask.isClosedStage || workTask.isCompletedStage))) {
      let stageName = '';
      stageName = workTask.stageName;
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }
    
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddSubTaskComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.parentId = workTask.id;
    this.modalRef.componentInstance.entityTypeId = workTask?.entityTypeId;
    this.modalRef.componentInstance.entityId = workTask?.entityId;
    this.modalRef.componentInstance.entityRecordTypeId = workTask.entityRecordTypeId;
    this.modalRef.componentInstance.parentEntityTypeId = workTask.entityTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.recordTypesforSubWorkTask.filter(x => x.parentEntityTypeID == workTask?.entityTypeId).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);;
    this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.typeId = workTask?.subTaskTypeId;
    this.modalRef.componentInstance.parentTypeId = workTask?.entitySubTypeId;
    this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.SUB_WORK_TASKS_TAB.ADD_SUBTASK_PREFIX') + " " + workTask?.subTaskTypeName;
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.SubWorkTaskPopup;
    this.modalRef.componentInstance.parentPrivacyLevel = workTask.privacyLevel;
    
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.refreshData();
      }
    });
  }

  linkWorktask(workTask: any) {
    this.modalRef = this._modalService.open(LinkWorkTaskDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.LINK_WORKTASK_TITLE'));
    this.modalRef.componentInstance.workTaskId = workTask.id;
    this.modalRef.componentInstance.entityWorkFlowId = this.entityWorkflowId;

    this.modalRef.result.then((response: boolean) => {
      if (response) { }
    });
  }

  private resetSelectedEntity() {
    this.isShowActivityCenter = false;
    this.selectedWorkTaskForActivityCenter = null;
    this.selectedWorkTaskIsPausedForActivityCenter = null;
    this.selectedWorkTaskIsClosedForActivityCenter = null;
    this.selectedWorkTaskIsCompletedForActivityCenter = null;
    this.selectedWorkTaskIdForActivityCenter = 0;
    this.selectedRowId = 0;
    if (this.kanbanStage) {
      this.kanbanStage.selectedCard = 0;
    }
  }

  onWorkTaskStagePauseChanged(workTask: any, isPaused: boolean) {
    if(!this.isEditWorkTask){ return; }

    if (workTask.owner1Id !== this._loggedInUser.userId) {
      let message = "";
      if (workTask.owner1Id == null || workTask.owner1Id == "" || workTask.owner1Id == undefined) {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.workTaskStagePauseChangeList(workTask, isPaused);
          }
        });
    }
    else if (workTask.owner1Id == this._loggedInUser.userId) {
      this.workTaskStagePauseChangeList(workTask, isPaused);
    }
  }

  workTaskStagePauseChangeList(workTask, isPaused: boolean) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: workTask.id,
      entityStageId: workTask.stageId,
      isPaused: isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: workTask.owner1Id,
      noteID: null
    };

    if (params.isPaused) {
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityStageIsPaused(workTask.id, this.entityTypeId, this.entityWorkflowId).then(res => {
        this._commonHelper.hideLoader();
        if (!res) {
          this.optionsForPopupDialog.size = 'md';
          this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
          this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
          this.modalRef.componentInstance.entityId = workTask.id;
          this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.PAUSE_REASON_NOTE_SUBJECT', { stageName: workTask.stageName }))}`;
          this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
          this.modalRef.componentInstance.stageId = workTask.stageId;
          this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
          this.modalRef.componentInstance.isSaveNote = true;

          this.modalRef.result.then(noteDate => {
            if (noteDate) {
              params.noteID = noteDate.id;
              this.saveEntityStagePauseTransitionFromList(params, workTask);
            }
          });
        } else {
          this.dataSearch.params.pageNo = 1;
          this.workTaskList = [];
          this.getWorkTasks();
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('WORKTASK.WORKTASKS_PAUSEDORDELETEERROR')
          );
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else {
      const noteParam = {
        entityTypeId: this.entityTypeId,
        entityId: workTask.id,
        entityRecordTypeID: null,
        subject: null,
        isPrivate: false,
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.RESUME_NOTE_DESCRIPTION', { stageName: workTask.stageName }))}`,
        createdBy: this._loggedInUser.userId
      };

      this._commonHelper.showLoader();
      this._noteService.addNewNote(noteParam).then((response: any) => {
        if (response) {
          params.noteID = response.id;
          this.saveEntityStagePauseTransitionFromList(params, workTask);
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

  saveEntityStagePauseTransitionFromList(params, workTask) {
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
          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_RESUME_SUCCESS'));
          workTask.isPaused = params.isPaused;

          //record update for List view.
          let updateEntityPauseStatusForList = this.workTaskList.find(x=>x.id == workTask.id);
          updateEntityPauseStatusForList.isPaused = workTask.isPaused;

          //record update for Card view.
          if (this.kanbanStage) {
            let card: any = {};
            card.id = workTask.id;
            card.stageId = workTask.stageId;
            card.isPaused = params.isPaused;
            card.disabled = params.isPaused ? true : false;
            this.kanbanStage.updateEntityPauseStatus(card);
          }
          
          //update Activity Center
          if (workTask.id == this.selectedWorkTaskIdForActivityCenter) {
            this.updateEntityDetails(false, workTask);
          }
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

  // stage paue changed event
  onWorkTaskStagePauseChangedFromCard(event: KanbanStagePauseEvent) {
    if (event.card.owner1Id !== this._loggedInUser.userId) {
      let message = "";
      if (event.card.owner1Id == null || event.card.owner1Id == undefined) {
        message = event.isPaused ? this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = event.isPaused ? this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.workTaskStagePauseChange(event);
          }
        });
    }
    else if (event.card.owner1Id == this._loggedInUser.userId) {
      this.workTaskStagePauseChange(event);
    }
  }

  workTaskStagePauseChange(event: KanbanStagePauseEvent) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: event.card.id,
      entityStageId: event.stage.id,
      isPaused: event.isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: event.card.owner1Id,
      noteID: null
    };

    if (params.isPaused) {
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityStageIsPaused(event.card.id, this.entityTypeId, this.entityWorkflowId).then(res => {
        this._commonHelper.hideLoader();
        if (!res) {
          this.optionsForPopupDialog.size = 'md';
          this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
          this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
          this.modalRef.componentInstance.entityId = event.card.id;
          this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.PAUSE_REASON_NOTE_SUBJECT', { stageName: event.stage.name }))}`;
          this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
          this.modalRef.componentInstance.stageId = event.stage.id;
          this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
          this.modalRef.componentInstance.isSaveNote = true;

          this.modalRef.result.then(noteDate => {
            if (noteDate) {
              params.noteID = noteDate.id;
              this.saveEntityStagePauseTransition(params, event);
            }
          });
        } else {
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('WORKTASK.WORKTASKS_PAUSEDORDELETEERROR')
          );
          this.getEntityStageData(event.stage.id, false);
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else {
      const noteParam = {
        entityTypeId: this.entityTypeId,
        entityId: event.card.id,
        entityRecordTypeID: null,
        subject: null,
        isPrivate: false,
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.RESUME_NOTE_DESCRIPTION', { stageName: event.stage.name }))}`,
        createdBy: this._loggedInUser.userId
      };

      this._commonHelper.showLoader();
      this._noteService.addNewNote(noteParam).then((response: any) => {
        if (response) {
          params.noteID = response.id;
          this.saveEntityStagePauseTransition(params, event);
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

  saveEntityStagePauseTransition(params, event: KanbanStagePauseEvent) {
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
          event.card.disabled = params.isPaused;
          event.card.isPaused = params.isPaused;
          event.card.isPausedTooltip = params.isPaused != null && params.isPaused ? this._commonHelper.getInstanceTranlationData('WORKTASK.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('WORKTASK.LABEL_SWITCH_PAUSE');
          //update Activity Center
          if (event.card.id == this.selectedWorkTaskIdForActivityCenter) {
            this.updateEntityDetails(false, event.card);
          }
          event.card.isEntityReviewEditable = !(event.card?.isPaused ?? false);
          this.kanbanStage.updateEntityPauseStatus(event.card);

          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_RESUME_SUCCESS'));
          this._commonHelper.hideLoader();
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
      },
        (error) => {
          this._commonHelper.hideLoader();
          event.card.isPausedTooltip = event.card.isPaused != null && event.card.isPaused ? this._commonHelper.getInstanceTranlationData('WORKTASK.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('WORKTASK.LABEL_SWITCH_PAUSE');
          this.kanbanStage.updateEntityPauseStatus(event.card);
          this.getTranslateErrorMessage(error);
        });
  }

  // assigned to user what to do
  onAssignedToClick(event, worktask = null) {

    if (!this.isAssignWorkTask || (worktask != null && worktask.isPaused) || (event.card != null && event.card.isPaused)) {
      return;
    }

    if ((worktask != null && (worktask.isClosedStage || worktask.isCompletedStage))
      || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (worktask != null) {
        stageName = worktask.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }

    this._commonHelper.showLoader();
    // get data from event
    let assignedToId = worktask != null ? worktask.assignedTo : event.card.owner1Id; //owner 1 is assigned to
    let workTaskId = worktask != null ? worktask.id : event.card.id;
    let workTaskStageId = worktask != null ? worktask.stageId : event.card.stageId;
    const verifiedBy = worktask != null ? worktask.verifiedBy : event.card.owner2Id; //Verified By

    //DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    var params = this.prepareParamsForAssignedToUsers(workTaskStageId, assignedToId);
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKASSIGNEDTO, params).then((response: any) => {
      //set owner 1 list
      let assignedToUsers = response;
      this._commonHelper.hideLoader();
      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      // open dialog
      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(UserAssignDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.users = assignedToUsers;
      this.modalRef.componentInstance.assignedUserId = assignedToId;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ASSIGNED_TO_DIALOG.DIALOG_TITLE'));
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        let obj = {
          entityid: workTaskId,
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: workTaskStageId
        };

        this._commonHelper.showLoader();
        this._workTaskService.updateWorkTaskAssignedTo(obj).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response) {
            this.worktaskAssignedTo = response;
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: this.entityTypeId, entityId: workTaskId, entityWorkflowId: this.entityWorkflowId, stageId: workTaskStageId, assignedTo: selectedUserId, verifiedBy: verifiedBy }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_WORK_TASK_ASSIGNEDTO'));
              }
              this._commonHelper.hideLoader();
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              }
            );
          }
          if (!this.dataSearch.isPageTabularView) {
            // refresh current stage
            this.getEntityStageData(workTaskStageId, false);
          } else {
            this.dataSearch.params.pageNo = 1;
            this.workTaskList = [];
            this.getWorkTasks();
          }
          // close
          this.modalRef.close();
        }, (err) => {
          this.handlePausedOrDeleteTaskError(err, workTaskStageId);
          this.modalRef.close();
          this._commonHelper.hideLoader();
          if (err != null && String(err.messageCode).toLowerCase() === 'worktasks.closedorcompleted') {
            this._commonHelper.showToastrError(err.message);
          } else {
            this.getTranslateErrorMessage(err);
          }
        });
      });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
      
  }

  // Verified By
  onVerifiedByClick(event, worktask = null) {

    if (!this.isAssignWorkTask || (worktask != null && worktask.isPaused) || (event.card != null && event.card.isPaused)) {
      return;
    }

    if ((worktask != null && (worktask.isClosedStage || worktask.isCompletedStage))
      || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (worktask != null) {
        stageName = worktask.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }


    this._commonHelper.showLoader();
    // get data from event
    let assignedToId = worktask != null ? worktask.assignedTo : event.card.owner1Id;
    let verifiedById = worktask != null ? worktask.verifiedBy : event.card.owner2Id;
    let workTaskId = worktask != null ? worktask.id : event.card.id;
    let workTaskStageId = worktask != null ? worktask.stageId : event.card.stageId;

    // prepare params
    const params = this.prepareParamsForVerifiedByUser(workTaskStageId, verifiedById, 1, '');
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKVERIFIEDBY, params).then((response: any) => {
      //set owner 2 list
      const verifiedByUsers = response;
      this._commonHelper.hideLoader();
      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      // open dialog
      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(UserAssignDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.users = verifiedByUsers;
      this.modalRef.componentInstance.assignedUserId = verifiedById;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.VERIFIED_BY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.VERIFIED_BY_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.VERIFIED_BY_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        let obj = {
          entityid: workTaskId,
          verifiedById: selectedUserId,
          entityWorkflowId: this.entityWorkflowId
        };

        this._commonHelper.showLoader();
        this._workTaskService.updateWorkTaskVerifiedBy(obj).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response) {
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: this.entityTypeId, entityId: workTaskId, entityWorkflowId: this.entityWorkflowId, stageId: workTaskStageId, assignedTo: assignedToId, verifiedBy: selectedUserId }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_WORK_TASK_VERIFIED_BY'));
              }
              this._commonHelper.hideLoader();
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              }
            );
          }
          if (!this.dataSearch.isPageTabularView) {
            // refresh current stage
            this.getEntityStageData(workTaskStageId, false);
          } else {
            this.dataSearch.params.pageNo = 1;
            this.workTaskList = [];
            this.getWorkTasks();
          }
          // close
          this.modalRef.close();
        }, (err) => {
          this.handlePausedOrDeleteTaskError(err, workTaskStageId);
          this.modalRef.close();
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(err);
        });
      });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  onCardPriorityClick(event, worktask = null) {
    if ((worktask != null && (worktask.isPaused || !worktask.isEditWorkTask)) || (event.card != null && (event.card.isPaused || !event.card.isEditSubTypePermission))) {
      return;
    }

    if ((worktask != null && (worktask.isClosedStage || worktask.isCompletedStage))
    || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (worktask != null) {
        stageName = worktask.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }

    // get data from event
    let priority = worktask != null ? worktask.priority : event.card.priority;
    let workTaskStageId = worktask != null ? worktask.stageId : event.card.stageId;

    this._commonHelper.showLoader();
    // call datasource service with code
    this._dataSourceService.getDataSourceDataByCode(DataSources.PRIORITY).then((response: any) => {
      //set priority list
      let priorityList = response;
      this._commonHelper.hideLoader();
      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      // open dialo
      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(PriorityDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.priorities = priorityList;
      this.modalRef.componentInstance.priorityId = priority;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.PRIORITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.prioritySelectLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.PRIORITY_DIALOG.PRIORITY_SELECT_LABEL');
      this.modalRef.componentInstance.prioritySelectPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.PRIORITY_DIALOG.PRIORITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangePriority.subscribe((selectedPriorityId) => {
        // prepare object to send to backend to save
        let obj = {
          workTaskId: worktask != null ? worktask.id : event.card.id,
          priority: selectedPriorityId,
          EntityWorkflowId: this.entityWorkflowId
        };

        this._commonHelper.showLoader();
        this._workTaskService.updateWorkTaskPriority(obj).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            if (!this.dataSearch.isPageTabularView) {
              // refresh current stage
              this.getEntityStageData(workTaskStageId, false);
            } else {
              this.dataSearch.params.pageNo = 1;
              this.workTaskList = [];
              this.getWorkTasks();
            }
          }
          // success message
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_WORK_TASK_PRIORITY')
          );
        },
          (error) => {
            this.handlePausedOrDeleteTaskError(error, workTaskStageId);
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });

        // close
        this.modalRef.close();
      });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  onCardSeverityClick(event, worktask = null) {
    if ((worktask != null && (worktask.isPaused || !worktask.isEditWorkTask)) || (event.card != null && (event.card.isPaused || !event.card.isEditSubTypePermission))) {
      return;
    }

    if ((worktask != null && (worktask.isClosedStage || worktask.isCompletedStage))
    || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (worktask != null) {
        stageName = worktask.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }

    // get data from event
    let severity = worktask != null ? worktask.severity : event.card.severity;
    let workTaskStageId = worktask != null ? worktask.stageId : event.card.stageId;
    this._commonHelper.showLoader();
    // call datasource service with code
    this._dataSourceService.getDataSourceDataByCode(DataSources.SEVERITY).then((response: any) => {
      //set severity list
      let severityList = response;
      this._commonHelper.hideLoader();
      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      // open dialo
      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(SeverityDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.severities = severityList;
      this.modalRef.componentInstance.severityId = severity;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.SEVERITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.severitySelectLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.SEVERITY_DIALOG.SEVERITY_SELECT_LABEL');
      this.modalRef.componentInstance.severitySelectPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.SEVERITY_DIALOG.SEVERITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangeSeverity.subscribe((selectedseverityId) => {
        // prepare object to send to backend to save
        let obj = {
          workTaskId: worktask != null ? worktask.id : event.card.id,
          severity: selectedseverityId,
          entityWorkflowId: this.entityWorkflowId
        };

        this._commonHelper.showLoader();
        this._workTaskService.updateWorkTaskSeverity(obj).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            if (!this.dataSearch.isPageTabularView) {
              // refresh current stage
              this.getEntityStageData(workTaskStageId, false);
            } else {
              this.dataSearch.params.pageNo = 1;
              this.workTaskList = [];
              this.getWorkTasks();
            }
          }
          // success message
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_WORK_TASK_SEVERITY')
          );
        },
          (error) => {
            this.handlePausedOrDeleteTaskError(error, workTaskStageId);
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });

        // close
        this.modalRef.close();
      });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  // open add popup
  onEntityStageClick(workTask) {
    // check logged in user have permission to view user details
    if (!workTask.isEditWorkTask || !workTask.isViewWorkTask || workTask.isPaused) {
      return;
    }

    if ((workTask != null && (workTask.isClosedStage || workTask.isCompletedStage))
    ) {
      let stageName = '';
      if (workTask != null) {
        stageName = workTask.stageName;
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }
    }

    //check can user change stage
    const currentStageDetail = this.workTaskListByStages.find(s => s.id == workTask.stageId);
    const canUserChangeStage: boolean = this.canUserChangeStage(currentStageDetail, workTask);

    if (!canUserChangeStage) {
      if (this.changeWorkTaskStage) {
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterEntityStageClick(workTask);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
      }
    }
    else {
      this.afterEntityStageClick(workTask);
    }
  }

  private afterEntityStageClick(workTask) {
    this._commonHelper.showLoader();
    // get data from event
    let workTaskId = workTask.id;
    let workTaskStageId = workTask.stageId;
    let assignedTo = workTask.assignedTo;

    // prepare params
    var params = this.prepareParamsForEntityStages();

    let entityStageDialogTitle: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ENTITY_STAGE_DIALOG.DIALOG_TITLE_STATUS') : this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ENTITY_STAGE_DIALOG.DIALOG_TITLE');
    let entityStageDialogFieldLabel: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_LABEL') : this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_LABEL');
    let entityStageDialogFieldPlaceholder: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_PLACEHOLDER') : this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_PLACEHOLDER');

    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITYSTAGES, params).then((response: any) => {
      this._commonHelper.hideLoader();

      if (response) {
        let entityStages = response;
        // open dialog
        this.optionsForPopupDialog.size = "md";
        if (this._modalService.hasOpenModals()) {
          return;
        }
        this.modalRef = this._modalService.open(EntityStagesDialogComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.entityStages = entityStages;
        this.modalRef.componentInstance.entityStageId = workTaskStageId;
        this.modalRef.componentInstance.dialogTitle = entityStageDialogTitle;
        this.modalRef.componentInstance.entityStageSelectLabel = entityStageDialogFieldLabel;
        this.modalRef.componentInstance.entityStageChangeSelectReasonLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_REASON_LABEL');
        this.modalRef.componentInstance.entityStageSelectPlaceholder = entityStageDialogFieldPlaceholder;
        this.modalRef.componentInstance.entityStageChangeReasonLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_LABEL');
        this.modalRef.componentInstance.entityStageChangeReasonPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_PLACEHOLDER');
        this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
        this.modalRef.componentInstance.OnChangeEntityStage.subscribe((selectedEntityStageInfo) => {
          let selectedEntityStageChangeReason = null;
          // get changed stage and reason if it is there
          let selectedEntityStageId = selectedEntityStageInfo.entityStageId;
          if (selectedEntityStageInfo.stageReason != null) {
            selectedEntityStageChangeReason = selectedEntityStageInfo.stageReason.label
          }
          let stageChangeReasonDescription = selectedEntityStageInfo.entityStageChangeReason
          // if selected stage and current stage are same - don't do anything
          if (selectedEntityStageId != undefined && selectedEntityStageId != null && selectedEntityStageId != workTaskStageId) {

            const selectedEntityStageDetail = this.workTaskListByStages.find(s => s.id == selectedEntityStageId);
            const prevEntityStageDetail = this.workTaskListByStages.find(s => s.id == workTaskStageId);

            let stagename = selectedEntityStageDetail.name;

            let isAllTasksRequired = prevEntityStageDetail?.isAllTasksRequired;

            let moveEntityParams = {
              workTaskId: workTaskId,
              entityTypeId: this.entityTypeId,
              entityWorkflowId: this.entityWorkflowId,
              workTaskStageId: workTaskStageId,
              selectedEntityStageId: selectedEntityStageId,
              stagename: stagename,
              assignedTo: assignedTo,
              selectedEntityStageChangeReason: selectedEntityStageChangeReason,
              stageChangeReasonDescription: stageChangeReasonDescription,
              verifiedBy: workTask.verifiedBy,
              isCompletedStage: workTask.isCompletedStage,
              isClosedStage: workTask.isClosedStage,
              stageName: workTask.stageName
            }

            // if any one of the current stage task is required
            let anyTasksIsRequired: boolean = false;
            let requiredTasks: any[] = [];
            // find out the current stage
            let currentStage = this.workTaskListByStages.find(x => x.id == workTaskStageId);
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
              this._workflowmanagementService.isEntityStageTasksCompleted(workTaskId, this.entityTypeId, workTaskStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
                this._commonHelper.hideLoader();
                if (response === true) {
                  this.checkHandRaisedFromList(moveEntityParams, this.modalRef);
                } else {
                  //Stage Tasks are not completed..
                  this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_BEFORE_MOVE_WORK_TASK_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
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
              this._workflowmanagementService.isEntityStageTasksCompleted(workTaskId, this.entityTypeId, workTaskStageId, this.entityWorkflowId, null).then((response: any) => {
                this._commonHelper.hideLoader();
                if (response === true) {
                  this.checkHandRaisedFromList(moveEntityParams, this.modalRef);
                } else {
                  //Stage Tasks are not completed..
                  this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_BEFORE_MOVE_WORK_TASK_STAGE_TASK_SHOULD_BE_COMPLETED'));
                  return false;
                }
              }, (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
            } else {
              this.checkHandRaisedFromList(moveEntityParams, this.modalRef);
            }
          }
          else {
            this.modalRef.close();
          }
        });
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  checkHandRaisedFromList(moveEntityParams: any, modalRef: NgbModalRef) {

    const workTaskId = moveEntityParams.workTaskId;
    const workTaskStageId = moveEntityParams.workTaskStageId;
    const entityTypeId = moveEntityParams.entityTypeId;
    const entityWorkflowId = moveEntityParams.entityWorkflowId;

    this._commonHelper.showLoader();

    this._workflowmanagementService.isEntityStageRaiseHandTransitionExist(workTaskId, entityTypeId, entityWorkflowId, workTaskStageId).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response === true) {
        //Hand Raised - Not allow to move the stage
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_BEFORE_MOVE_WORK_TASK_FOR_RAISED_HAND_TASK'));
        return false;
      } else {
        this.moveEntityFromList(moveEntityParams, modalRef);
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  moveEntityFromList(moveEntityParams: any, modalRef: NgbModalRef) {
    let workTaskId = moveEntityParams.workTaskId,
      workTaskStageId = moveEntityParams.workTaskStageId,
      selectedEntityStageId = moveEntityParams.selectedEntityStageId,
      stagename = moveEntityParams.stagename,
      assignedTo = moveEntityParams.assignedTo,
      selectedEntityStageChangeReason = moveEntityParams.selectedEntityStageChangeReason,
      stageChangeReasonDescription = moveEntityParams.stageChangeReasonDescription,
      isCompletedStage = moveEntityParams.isCompletedStage,
      isClosedStage = moveEntityParams.isClosedStage,
      stageName = moveEntityParams.stageName


    if (selectedEntityStageChangeReason != null || stageChangeReasonDescription != null) {
      // prepare reason as a note
      let note = new Note({});
      note.id = 0;
      note.tenantId = this._loggedInUser.tenantId;
      note.entityTypeId = this.entityTypeId;
      note.entityId = workTaskId;
      note.entityRecordTypeID = null;
      note.subject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: stagename }))}`;
      note.isPrivate = false;
      note.createdBy = this._loggedInUser.userId;

      let other = this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.OTHER_REASON');
      if (selectedEntityStageChangeReason && selectedEntityStageChangeReason !== other) {
        note.description = this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.NOTE_REASON_PRETEXT') + ': ' + selectedEntityStageChangeReason;
      }
      else {
        note.description = this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.NOTE_REASON_PRETEXT') + ': ' + stageChangeReasonDescription;
      }

      this._commonHelper.showLoader();
      this._noteService.addNewNote(note).then((response: any) => {
        Promise.all([
          this.saveWorkTaskStage(workTaskId, workTaskStageId, selectedEntityStageId, stagename, assignedTo, moveEntityParams.verifiedBy, isCompletedStage, isClosedStage, stageName)
        ]).then(() => {
          const param = {
            entityTypeId: this.entityTypeId,
            entityId: workTaskId,
            workflowId: this.entityWorkflowId,
            workflowStageId: selectedEntityStageId,
            stageNoteID: response.id,
            pauseNoteID: null,
            processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.StageNote
          };

          this._commonHelper.showLoader();
          this._workflowmanagementService.saveEntityWorkflowStageValueNote(param).then(() => {
            modalRef.close();
            this.refreshData();
            this._commonHelper.hideLoader();
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }).catch(() => {
          modalRef.close();
          this.refreshData();
        });
        this._commonHelper.hideLoader();
      },
        (error) => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('ACTIVITY.' + error.messageCode.replace('.', '_').toUpperCase())
          );
        });
    }
    else {
      // prepare object to send to backend to save
      const selectedEntityStageDetail = this.workTaskListByStages.find(s => s.id == selectedEntityStageId);
      let stagename = selectedEntityStageDetail.name;
      Promise.all([
        this.saveWorkTaskStage(workTaskId, workTaskStageId, selectedEntityStageId, stagename, assignedTo, moveEntityParams.verifiedBy, isCompletedStage, isClosedStage, stageName)
      ]).then(() => {
        modalRef.close();
        this.refreshData();
      }).catch(() => {
        modalRef.close();
        this.refreshData();
      });
    }
  }

  refreshDataOnInterval() {
    if (this.modalRef && this.isBulkAssignedDialogOpen) {
      this.modalRef.close();
      this.isBulkAssignedDialogOpen = false;
    }
    this.refreshData();
  }

  // refresh all data
  refreshData() {
    if (!this.dataSearch.isPageTabularView) {
      // reset
      this.dataSearch.paramsByStage.pageNo = 1;
      this.stages = [];
      this.workTaskList = [];
      // prepare stages
      this.prepareStages();
    } else {
      this.dataSearch.params.pageNo = 1;
      this.workTaskList = [];
      this.getWorkTasks();
    }
  }

  /* multi-select */
  isAllSelected() {
    const selectedWorkListCount = this.workTaskList.filter(x => x.isSelected).length;
    if (this.workTaskList.length == selectedWorkListCount) {
      this.isAllCheckBoxSelected = true;
    } else {
      this.isAllCheckBoxSelected = false;
    }
  }

  checkUncheckAll() {
    this.workTaskList.forEach(worktask => {
      if (!worktask.isPaused && !worktask.isClosedStage && !worktask.isCompletedStage) {
        worktask.isSelected = this.isAllCheckBoxSelected;
      }
    });
  }

  // assign bulk tasks to user
  assignSelectedTasksToUser() {
    
    if (this.workTaskList.filter(f=>f.isSelected).length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MEESAGE_SELECT_ONE_USER'));
      return;
    }

    const distinctStages = [...new Set(this.workTaskList.filter(f=>f.isSelected).map(item => item.stageId))];

    if (distinctStages.length > 1) {
      this.showLayout == LayoutTypes.ListView ? this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_SELECT_SAME_STATUS')) :
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_SELECT_SAME_STAGE'));
      return;
    }

    const params = this.prepareParamsForAssignedToUsers(distinctStages[0], '');
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKASSIGNEDTO, params).then((response: any) => {
      //set owner 1 list
      const assignedToUsers = response;
      this._commonHelper.hideLoader();
      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      this.isBulkAssignedDialogOpen = true;
      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(UserAssignDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.users = assignedToUsers;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ASSIGNED_TO_DIALOG.DIALOG_TITLE'));
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.closed.subscribe(() => {
        this.isBulkAssignedDialogOpen = false;
      });

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // get selected
        const selectedTasks = [...new Set(this.workTaskList.filter(f=>f.isSelected).map(item => item.id))];
        // prepare comma separated string using selected tasks
        let strSelectedTaskIds = selectedTasks.toString();
        // prepare object to send to backend to save
        let obj = {
          selectedTaskIds: strSelectedTaskIds,
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: distinctStages[0]
        };

        this._commonHelper.showLoader();
        this._workTaskService.updateWorkTaskAssignedToUsers(obj).then((response: any) => {
          //reload
          this.refreshData();
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_WORK_TASK_BULKASSIGNEDTO'));
          this._commonHelper.hideLoader();
          this.modalRef.close();
          this.isBulkAssignedDialogOpen = false;
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            this.modalRef.close();
            this.isBulkAssignedDialogOpen = false;
            if (error != null && (String(error.messageCode).toLowerCase() === 'worktasks.noactivetaskfound' ||
              String(error.messageCode).toLowerCase() === 'worktasks.norunningtaskfound')) {
              this.refreshData();
            }
          });
      });
    });
  }

  exportExcel() {
    this.exportWorkTasks(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  private exportWorkTasks(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();
    this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null;

    this.dataSearch.params.taskCreatedFromDate = this.dataSearch.params.taskCreatedFromDate != null ? moment(this.dataSearch.params.taskCreatedFromDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.taskCreatedToDate = this.dataSearch.params.taskCreatedToDate != null ? moment(this.dataSearch.params.taskCreatedToDate).format('YYYY-MM-DD') : null;

    let excelExportPayload = this._commonHelper.cloningObject(this.dataSearch.params);
    excelExportPayload.exportType = exportType;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";
    let fileName = this._commonHelper.getConfiguredEntityName('{{WorkTasks_plural_p}}') + `_${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;

    if (!this.dataSearch.isPageTabularView) {
      excelExportPayload.stageIds = null;
    }

    this._workTaskService.exportWorkTasks(excelExportPayload).then((base64String: any) => {
      this._commonHelper.hideLoader();
      if (base64String && base64String != '') {
        this._commonHelper.downloadFile(`${fileName}${fileExtension}`, fileMimeType, base64String);
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_NO_DATA_EXPORT'));
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  //transferArrayItem kanban card layout
  transferArrayItem(event) {
    if (event != null) {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }


  openWorktaskImport() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorkTaskImportDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.isShowParentEntityDropdown = this.workflows.find(x => x.value != 0 && x.value == this.entityWorkflowId)?.isDefault ?? false;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.refreshData();
      }
    });
  }

  // open add popup
  addWorkTask() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.relatedEntityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.recordTypesDetail;
    this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.AddPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.WorkTasks;
    this.modalRef.componentInstance.isShowAddButton = true;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.refreshData();
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
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('WORKTASK.WORKTASKS_SUBWORKTASKEXISTMESSAGEBEFOREPARENTTASKDELETE', { entitySubTypeName: this.availableSubWorkTaskTypeNamesForWorkTaskDelete })
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

        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_CONFIRM_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? ''}), null, null, optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._workTaskService.deleteWorkTask(workTask.id).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? ''})
                );
                // get work tasks
                this.refreshData();
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                  this.refreshData();
                });
            }
          })
          .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.WORKTASK_DISMISS_DIALOG')));
      }
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      }
      else{
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('WORKTASK.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }

  paginate(event) {
    this.dataSearch.params.pageNo = (event.first / event.rows) + 1;
    this.dataSearch.params.pageSize = event.rows;
    this.getWorkTasks();
  }

  ChangeOrder(column) {
    if (column.sort) {
      if (this.dt.sortOrder == 1) {
        this.dataSearch.params.sortOrder = "ASC";
      }
      else {
        this.dataSearch.params.sortOrder = "DESC";
      }
      this.dataSearch.params.sortColumn = this.dt.sortField;
      this.getWorkTasks();
    }
  }

  changePage() {
    if (this.dataSearch.params.pageNo <= this.totalPages && this.dataSearch.params.pageNo > 0) {
      this.dataSearch.params.pageNo = this.dataSearch.params.pageNo > 0 ? this.dataSearch.params.pageNo : 1;
      this.getWorkTasks();
    }
    else if (this.dataSearch.params.pageNo > this.totalPages) {
      this.dataSearch.params.pageNo = this.totalPages;
    }
    else if (this.dataSearch.params.pageNo <= 0) {
      this.dataSearch.params.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  resetPaginator() {
    this.dataSearch.params.pageNo = 1;
    if (this.end == this.dataSearch.params.pageSize) {
      return false;
    }
    this.getWorkTasks();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to previous page
  prev() {
    this.dataSearch.params.pageNo = this.dataSearch.params.pageNo - 1 > 0 ? this.dataSearch.params.pageNo - 1 : 1;
    if (this.end == this.dataSearch.params.pageSize) {
      return false;
    }
    this.getWorkTasks();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to next page
  next() {
    this.dataSearch.params.pageNo = (this.dataSearch.params.pageNo + 1) <= this.totalPages ? this.dataSearch.params.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getWorkTasks();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // load more from kanban view
  loadMore(event) {
    // set page number
    this.dataSearch.paramsByStage.pageNo = event.nextPage;
    // get this stage data only and append it
    this.getEntityStageData(event.id, true);

    // get set quickview local storage config start
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedWorkTaskIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
    }
    // get set quickview local storage config end
  }

  onWorkTaskRaiseHandChanged(event: any, isHandRaised: boolean) {
    if (event != null && (event.isPaused || !this.isEditWorkTask)) {
      return;
    }

    if (event.owner1Id == this._loggedInUser.userId) {
      const params = {
        entityTypeId: this.entityTypeId,
        entityId: event.id,
        entityStageId: event.stageId,
        isHandRaised: isHandRaised,
        entityWorkflowId: this.entityWorkflowId,
        assignedTo: event.owner1Id
      }

      this._commonHelper.showLoader();
      this._workflowmanagementService.saveEntityStageRaiseHandTransition(params)
        .then(() => {
          event.isHandRaised = isHandRaised;

           //record update for List view.
           let updateEntityRaiseHandStatusForList = this.workTaskList.find(x=>x.id == event.id);
           updateEntityRaiseHandStatusForList.isHandRaised = event.isHandRaised;
 
           //record update for Card view.
           if (this.kanbanStage) {
             let card: any = {};
             card.id = event.id;
             card.stageId = event.stageId;
             card.isHandRaised = params.isHandRaised;
             this.kanbanStage.updateRaiseHandStatus(card);
           }

          this._commonHelper.hideLoader();
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          this.handlePausedOrDeleteTaskError(error, event.stageId);
        });
    } else {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.RAISEHAND_WORKTASKASSIGNUSERMISMATCH'))
    }
  }

  // get tenant setting for tab layout
  private getTabLayoutTenantSetting() {
    const workTaskStageTaskChange = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.ALLOW_TASK_COMPLETE}`));
    if (workTaskStageTaskChange == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.ALLOW_TASK_COMPLETE).then((response: any) => {
          if (response) {
            this.workTaskStageTaskChange = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.ALLOW_TASK_COMPLETE}`, JSON.stringify(this.workTaskStageTaskChange));
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
      this.workTaskStageTaskChange = workTaskStageTaskChange;
    }
  }

 

  private handlePausedOrDeleteTaskError(error: any, workTaskStageId: number) {
    if (error != null && (String(error.messageCode).toLowerCase() === 'worktasks.pausedordeleteerror' || String(error.messageCode).toLowerCase() === 'entitystage.pausedordeleteerror')
    || String(error.messageCode).toLowerCase() === 'worktasks.closedorcompleted') {
      if (!this.dataSearch.isPageTabularView) {
        // refresh current stage
        this.getEntityStageData(workTaskStageId, false);
        if (String(error.messageCode).toLowerCase() === 'worktasks.closedorcompleted') {
          const closedCompletedStages = this.workTaskListByStages.filter(x => x.isClosed || x.isCompleted);
          if (closedCompletedStages) {
            closedCompletedStages.forEach(x => {
              this.getEntityStageData(x.id, false);
            });
          }
        }
      } else {
        this.dataSearch.params.pageNo = 1;
        this.workTaskList = [];
        this.getWorkTasks();
      }
    }
  }

  // Set card/row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Worktasks_Workflow_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get card/row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Worktasks_Workflow_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
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

    this._workTaskService.updateWorktaskField(params).then((response) => {
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

  clickAssignedTo(event: any, workTask: any) {
    
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

  //get Entity Record Type
  private getEntityRecordTypes(): Promise<any> {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    return new Promise((resolve, reject) => {
      const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntityRecordTypes == null) {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypesDetail = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == Entity.Products || x.parentEntityTypeID == Entity.Cases || x.parentEntityTypeID == Entity.Opportunities || x.parentEntityTypeID == null)).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }));
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS').map(x => ({ 'label': x.name, 'value': x.id }));
            this.recordTypesforSubWorkTask = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS');
            
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
          }
          this._commonHelper.hideLoader();
          resolve(this.recordTypes);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.recordTypesDetail = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == Entity.Products || x.parentEntityTypeID == Entity.Cases || x.parentEntityTypeID == Entity.Opportunities || x.parentEntityTypeID == null)).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }));
        this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS').map(x => ({ 'label': x.name, 'value': x.id }));
        this.recordTypesforSubWorkTask = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS');
        resolve(this.recordTypes);
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

  private getPriorityFromReferenceType() {
    return new Promise((resolve, reject) => {
      let params = { refType: RefType.Priority };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.Priority}`;
      // get data
      const refTypePriority = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypePriority == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.priorityDetails = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
            this.priorityDetails.forEach(element => {
              element.strValue1 = JSON.parse(element.strValue1);
            });
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
        this.priorityDetails = refTypePriority as ReferenceType[];
        this.priorityDetails.forEach(element => {
          element.strValue1 = JSON.parse(element.strValue1);
        });
        resolve(null);
      }
    });
  }

  private getSeverityFromReferenceType() {
    return new Promise((resolve, reject) => {
      let params = { refType: RefType.Severity };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.Severity}`;
      // get data
      const refTypeSeverity = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeSeverity == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.severityDetails = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
            this.severityDetails.forEach(element => {
              element.strValue1 = JSON.parse(element.strValue1);
            });
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
        this.severityDetails = refTypeSeverity as ReferenceType[];
        this.severityDetails.forEach(element => {
          element.strValue1 = JSON.parse(element.strValue1);
        });
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

  private getPrivacyLevelRefererence() {
    return new Promise((resolve, reject) => {
      let params = { refType: RefType.PrivacyLevels };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.PrivacyLevels}`;
      // get data
      const refPrivacyLevels = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refPrivacyLevels == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.entityPrivacyDetails = response as [];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.entityPrivacyDetails));
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
        this.entityPrivacyDetails = refPrivacyLevels;
        resolve(null);
      }
    });
  }

  onReopenStage(workTask: any) {
    if (!this.isAllowToReopen) {
      return;
    }

    if (workTask.isClosedStage || workTask.isCompletedStage) {
      //get default stage details
      const getDefaultStage: any = this.workTaskListByStages?.find(s => s.isDefault);
      var isShowStageChangeConfirmationBox: boolean = true;
      this.changeEntityStage(getDefaultStage, getDefaultStage.id, isShowStageChangeConfirmationBox, true, workTask);
    }
  }

  changeEntityStage(toEntityStageDetail, toEntityStageId, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean, workTask: any) {
    let noteSubjectName: any;
    if (!isReopenedStage) {
      noteSubjectName = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: toEntityStageDetail.name }))}`
    } else {
      noteSubjectName = this._commonHelper.getInstanceTranlationData('COMMON.STAGE_REOPEN_TEXT');
    }
    if (toEntityStageDetail.isNoteRequired || isReopenedStage) {
      isShowStageChangeConfirmationBox = false;
      //this.refreshActivity = false;
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = workTask.id;
      this.modalRef.componentInstance.noteSubject = noteSubjectName;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = toEntityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;
      this.modalRef.result.then(response => {
        if (response != undefined) {
          const stageValueNoteParams = {
            entityTypeId: this.entityTypeId,
            entityId: workTask.id,
            workflowId: this.entityWorkflowId,
            workflowStageId: toEntityStageId,
            stageNoteID: response.id,
            pauseNoteID: null,
            processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.StageNote
          };

          Promise.all([
            this.updateEntityStage(toEntityStageId, toEntityStageDetail, isShowStageChangeConfirmationBox, isReopenedStage, workTask),
          ]).then(() => {
            Promise.all([
              this.saveEntityWorkflowStageValueNote(stageValueNoteParams)
            ]).then(() => {
              // get details
              this.getWorkTasks();
            });
          }).catch(() => {
            this.getWorkTasks();
          });
        }
      });
    }
    else {
      Promise.all([
        this.updateEntityStage(toEntityStageId, toEntityStageDetail, isShowStageChangeConfirmationBox, isReopenedStage, workTask),
      ]).then(() => {
        // get list
        this.getWorkTasks();
      }).catch(() => {
        this.getWorkTasks();
      });
    }
  }

  // update workflow entity stage values
  updateEntityStage(toEntityStageId, toEntityStageDetail, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean, workTask: any) {
    this.optionsForPopupDialog.size = 'md';
    return new Promise((resolve, reject) => {
      if (isShowStageChangeConfirmationBox) {
        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('WORKTASK.CHANGE_STAGE_CONFIRMATION'), null, null, this.optionsForPopupDialog).then((confirmed) => {
          if (confirmed) {
            return this.afterUpdateEntityStage(toEntityStageId, toEntityStageDetail, isReopenedStage, workTask);
          }
        });
      }
      else {
        return this.afterUpdateEntityStage(toEntityStageId, toEntityStageDetail, isReopenedStage, workTask);
      }
    });
  }

  afterUpdateEntityStage(toEntityStageId, toEntityStageDetail, isReopenedStage: boolean, workTask: any) {
    return new Promise((resolve, reject) => {
      let assignedToForDto = workTask.assignedTo;
      this._commonHelper.showLoader();
      let currentStageId = this.workTaskListByStages.find(x => x.id == workTask.stageID)?.id;
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: workTask?.entityRecordTypeId, entityId: workTask.id, stageId: toEntityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedToForDto, verifiedBy: workTask.verifiedBy, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.worktaskAssignedTo = response;
          if (assignedToForDto != this.worktaskAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._workTaskService.updateWorkTaskAssignedTo({ entityId: workTask.id, assignedToId: this.worktaskAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.worktaskAssignedTo.isForcedAssignment }).then((response: any) => {
              if (response) {
                assignedToForDto = this.worktaskAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_WORK_TASK_MOVETO_STAGE',
                  { stageName: toEntityStageDetail.name })
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
                this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_WORK_TASK_STAGE_REOPEN', {
                  entityName: workTask?.name !== null ? workTask?.name : " "
                })
              )
            } else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_WORK_TASK_MOVETO_STAGE',
                  { stageName: toEntityStageDetail.name })
              );
            }
          }
        }
        // get list
        this.getWorkTasks();
        resolve(null);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    });
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

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.dataSearch.params.searchString = val;
        this.dataSearch.paramsByStage.searchString = val;
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_WorkTasksKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);
        this.refreshData();
      });
  }

}
