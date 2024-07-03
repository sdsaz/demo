//ANGULAR
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
//COMMON
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { ActivityTimespan, DataSources, DownloadFileMimeType, Entity, ExportType, FieldNames, FileExtension, KanbanBoardTokenTypes, LayoutTypes, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, ReferenceType, RefType, SectionCodes, UserTypeID} from '../../../@core/enum';
import { KanbanStage, KanbanStageCard, KanbanStagePauseEvent, KanbanStageRaiseHandEvent, KanbanStageTaskEvent } from '../../../@core/sharedModels/kanban-board.model';
import { IdValuePair } from '../../../@core/sharedModels/pair.model';
import { Note } from '../../../@core/sharedComponents/notes/note.model';
//COMPONENTS
import { CaseAddComponent } from '../case-add/case-add.component';
import { UserAssignDialogComponent } from '../../../@core/sharedComponents/user-assign/user-assign-dialog/user-assign-dialog.component';
import { EntityStagesDialogComponent } from '../../../@core/sharedComponents/entity-stages/entity-stages-dialog/entity-stages-dialog.component';
import { PriorityDialogComponent } from '../../../@core/sharedComponents/priority-dialog/priority-dialog.component';
import { SeverityDialogComponent } from '../../../@core/sharedComponents/severity-dialog/severity-dialog.component';
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { NoteService } from '../../../@core/sharedComponents/notes/notes.service';
import { StagesComponent } from '../../../@core/sharedComponents/kanban-board/stages/stages.component';
import { ActivitySectionComponent } from '../../../@core/sharedComponents/common-activity-section/activity-section/activity-section.component';
import { CaseImportDialogComponent } from '../case-import-dialog/case-import-dialog.component';
//SERVICES
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { EntitytagsService } from '../../entitytags/entitytags.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { SettingsService } from '../../settings/settings.service';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';
//OTHER
import * as moment from 'moment';
import { Table } from 'primeng/table';
import { debounceTime, filter, fromEvent, interval, map, Subscription } from 'rxjs';
import { forkJoin } from 'rxjs';
import { CasesService } from '../cases.service';
import { WorktaskAddComponent } from '../../worktasks/worktask-add/worktask-add.component';
import { GoogleAnalyticsService,GoogleAnalyticsRouterInitializer } from 'ngx-google-analytics';

@Component({
  selector: 'ngx-case-workflow-list',
  templateUrl: './case-workflow-list.component.html',
  styleUrls: ['./case-workflow-list.component.scss']
})
export class CaseWorkflowListComponent {

  @ViewChild('searchTextInput', { static: false }) searchTextInput: ElementRef;
  @ViewChild('dt') private dt: Table;
  @ViewChild('kanbanStage') kanbanStage: StagesComponent;
  @ViewChild('activitySection') activitySection: ActivitySectionComponent;

  private updateSubscription: Subscription;

  pageTitle = 'CASES.LIST.TITLE';
  workflowName = '';
  rating: number = null;

  entityTypeId: number = Entity.Cases;
  entityWorkflowId: number = 0;
  entityRecordTypeId: number;
  relatedEntityTypeId: number = 0;
  relatedEntityRecordTypeId: number = 0;

  caseList: any[] = [];
  caseListByStages: any[] = [];
  caseAssignedTo: any;

  isBulkAssignCases: boolean = false;
  isAssignCase: boolean = false;
  isExportCases: boolean = false;
  isImportCases: boolean = false;
  isDeleteCase: boolean = false;
  isEditCase: boolean = false;
  isAddCase: boolean = false;
  isViewCase: boolean = false;
  isListCases: boolean = false;
  isShowRelatedTo: boolean = false;
  isShowAssignTo: boolean = true;
  isResumeTask: boolean = false;
  changeCaseStage: boolean = false;
  isAddSubCase: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAddWorkTask: boolean = false;
  isAllowToReopen: boolean = false;
  
  localStorageKeyPrefix: string = '';

  customFilterConfig: any[] = [
  ];

  isFilterVisible: boolean = false;
  filterCount:number = 0;

  cols: any[];
  tableData: any[];
  userTypeID = UserTypeID;

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
      "dueStartDate": null,
      "dueEndDate": null,
      "createdFromDate": null,
      "createdToDate": null,
      "verifiedByIDs": "",
      "showMyCases": true,
      "stageIDs": "",
      "rating": this.rating,
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
      "dueStartDate": null,
      "dueEndDate": null,
      "createdFromDate": null,
      "createdToDate": null,
      "verifiedByIDs": "",
      "showMyCases": true,
      "stageIDs": "",
      "rating": this.rating,
      "entityRecordTypeIDs":"",
      "showStarred": false
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

  // multi assign cases to user
  showMultiselectOption = false;

  users: any = null; //assignable users
  filterUsers: any = null;
  filterVerifiedByUsers: any = null;
  relatedToEntityTypes: any = null; //related to entity records
  relatedTo: any = null; //related to entity records
  priority: any = null;
  severity: any = null;
  filterStage: any = null;
  priorityDetails: any = null;
  severityDetails: any = null;

  //user detail
  _loggedInUser: any;

  //action menu
  isShowActionColumn: boolean = false;
  //right side activity menu
  isShowActivityCenter: boolean = false;
  refreshActivityCenter: boolean = false;
  selectedCaseForActivityCenter: any;
  selectedCaseIdForActivityCenter: number = 0;
  selectedCaseIsPausedForActivityCenter: boolean = false;
  selectedCaseIsClosedForActivityCenter: boolean = false;
  selectedCaseIsCompletedForActivityCenter: boolean = false;

  selectedRowId:number = 0;
  selectedCardExists: boolean = false;
  entityDetails: any;

  workflows: any = null;
  entityRecordTypes: any = [];
  currentStage: any;
  selectedStage: any;

  //tenant setting
  caseStageTaskChange: any = "no";

  isBulkAssignedDialogOpen: boolean;
  isAllCheckBoxSelected: boolean;
  keyfieldResponseData: any;
  quickViewConfig: any;
  relatedToEntityColumnName: any;

  //Export Case
  dynamicColumnNameSetting: any = {};
  CaseNumberColumnName: string;

  entityStagesWithTasksStorageKey: string = LocalStorageKey.CaseEntityStageWithTasksKey;

  rowActionButtonMouseHoverFlag: boolean = false;

  //WorkflowLayout based on layoutTypeID
  showBothKanbanAndListView: boolean = false;
  currencySymbol: any = null;
  hoursInDay:number = null;

  //status filter for listview.
  showLayout: any;
  StatusFilterLabel: any;
  StatusFilterPlaceholder: any;
  StatusColumnName: any;

  ratingOptions: any [] = [];
  relatedToIconToolTip: string;

  caseCreatedBy: number;
  casePrivacyLevel: number;

  //Record Type Filter
  recordTypes: any;
  recordTypesDetail:any;
  isRecordTypesFilterVisible: boolean;
  entityRecordType: any[];
  workTaskSubTypeDetails: any;

  //Add WorkTask
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  refreshWorkTaskTab;

  entityHiddenFieldSettings: any;
  sectionCodeName = SectionCodes;
  fieldName = FieldNames;
  isAssignedToFieldKanbanListColumn: boolean;
  isVerifiedByFieldKanbanListColumn: boolean;

  entitySubTypes: any = [];

  isStageClosedOrCompleted: number;
  
  constructor(private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _casesService: CasesService,
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
    this.isAddCase = this._commonHelper.havePermission(enumPermissions.AddCase);
    this.isAssignCase = this._commonHelper.havePermission(enumPermissions.AssignCase);
    this.isBulkAssignCases = this._commonHelper.havePermission(enumPermissions.BulkAssignCases);
    this.isDeleteCase = this._commonHelper.havePermission(enumPermissions.DeleteCase);
    this.isEditCase = this._commonHelper.havePermission(enumPermissions.EditCase);
    this.isExportCases = this._commonHelper.havePermission(enumPermissions.ExportCases);
    this.isImportCases = this._commonHelper.havePermission(enumPermissions.ImportCases);
    this.isListCases = this._commonHelper.havePermission(enumPermissions.ListCases);
    this.isViewCase = this._commonHelper.havePermission(enumPermissions.ViewCase);
    this.isResumeTask = this._commonHelper.havePermission(enumPermissions.ResumeTask);
    this.changeCaseStage = this._commonHelper.havePermission(enumPermissions.ChangeCaseStage);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadCaseDocument);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);
    
    // sub case
    this.isAddSubCase = this._commonHelper.havePermission(enumPermissions.AddSubCase);

    this.isShowActionColumn = (this.isViewCase && this.isEditCase) || (this.isViewCase && this.isDeleteCase);

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
    let localPageLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_CasesKey, this.localStorageKeyPrefix));
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

    //Case Created Date Range
    this.dataSearch.params.createdFromDate = this.dataSearch.params.createdFromDate != null && this.dataSearch.params.createdFromDate != '' ? moment(new Date(this.dataSearch.params.createdFromDate)).toDate() : null;
    this.dataSearch.params.createdToDate = this.dataSearch.params.createdToDate != null && this.dataSearch.params.createdToDate != '' ? moment(new Date(this.dataSearch.params.createdToDate)).toDate() : null;
    this.dataSearch.paramsByStage.createdFromDate = this.dataSearch.paramsByStage.createdFromDate != null && this.dataSearch.paramsByStage.createdFromDate != '' ? moment(new Date(this.dataSearch.paramsByStage.createdFromDate)).toDate() : null;
    this.dataSearch.paramsByStage.createdToDate = this.dataSearch.paramsByStage.createdToDate != null && this.dataSearch.paramsByStage.createdToDate != '' ? moment(new Date(this.dataSearch.paramsByStage.createdToDate)).toDate() : null;

    Promise.all([
      this.getWorkflowList(),
      this.getWorkflowDetail(),
      this.getEntityStagesWithTask(),
      this.getCurrencySymbol(),
      this.getHoursInDay(),
      this.getEntityRecordTypes(),
      this.getWorktaskWorkflowList(),
      this.getPriorityFromReferenceType(),
      this.getSeverityFromReferenceType(),
      this.getEntityHiddenField(),
      this.getEntitySubTypes()
    ]).then((results: any) => {
      if (results) {
        var workflow = results[1];
        this.workflowName = workflow.name;
        this.entityRecordTypeId = workflow.entityRecordTypeId;
        this.relatedEntityTypeId = workflow.parentEntityTypeId;
        this.relatedEntityRecordTypeId = workflow.parentEntityRecordTypeId;

        let StageColumn = this.cols.find(c => c.field == 'stageName');
        this.workTaskSubTypeDetails = this.entitySubTypes?.find(x => x.level == 1);
        
        if (workflow.layoutTypeID == LayoutTypes.ListView) {
          this.dataSearch.isPageTabularView = true;
          StageColumn.header = 'CASES.LIST.TABLE_HEADER_STATUS_NAME';
          this.StatusColumnName = (this._commonHelper.getInstanceTranlationData('CASES.LIST.EXPORT_STATUS_LABEL'));
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
        
        //Header of related to 
        const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.relatedEntityTypeId);
        if (foundRecord) {
          this.relatedToEntityColumnName = foundRecord?.['displayName'].toString().trim();
          entityNameColumn.header = this.relatedToEntityColumnName;
        }
        this.CaseNumberColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.LIST.EXPORT_CASE_NUMBER_LABEL'));

        this.dynamicColumnNameSetting = {};
        this.dynamicColumnNameSetting["EntityName"] = this.relatedToEntityColumnName;
        this.dynamicColumnNameSetting["StageName"] = this.StatusColumnName;
        this.dynamicColumnNameSetting["CaseNumber"] = this.CaseNumberColumnName;

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
      this.selectedCaseIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
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

  setColumns() {
     //table layout fields set
     this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'caseNumber', header: 'CASES.LIST.TABLE_HEADER_CASE_NUMBER', visible: true, sort: true },
      { field: 'name', header: 'CASES.LIST.TABLE_HEADER_NAME', visible: true, sort: true },
      { field: 'entityName', header: 'CASES.LIST.TABLE_HEADER_RELATED_TO', visible: true, sort: true },
      { field: 'stageName', header: 'CASES.LIST.TABLE_HEADER_STAGE_NAME', visible: true, sort: true },
      { field: 'assignedToName', header: 'CASES.LIST.TABLE_HEADER_ASSIGNEDTO', visible: !this.isAssignedToFieldKanbanListColumn, sort: true },
      { field: 'verifiedByName', header: 'CASES.LIST.TABLE_HEADER_VERIFIED_BY', visible: !this.isVerifiedByFieldKanbanListColumn, sort: true },
      { field: 'createdByName', header: 'CASES.LIST.TABLE_HEADER_CREATED_BY', visible: true, sort: true },
      { field: 'created', header: 'CASES.LIST.TABLE_HEADER_CREATED', visible: true, sort: true },
      { field: 'id', header: '', visible: true, sort: false, class: "action ", display: 'td-display' }
    ];
  }

  getWorkflowDetail(): Promise<any> {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.CaseWorkflowDetailsKey}_${this.entityWorkflowId}`;
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
      value: Entity.Cases
    };
    params.push(paramItem);
    return params;
  }

  private getWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Cases}`;

      this.workflows = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.workflows == null) {
        const params = this.prepareParamsForWorkflows();
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflows = response;
            this.workflows.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_OPTION_TEXT_WORKFLOW') });
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
    // other fileter master data
    const requestArray = [];

    const entityTimeSpans = this.getEntityTimespans();
    const requestAssignedToUsers = this.getAssignedToUsers(null, 1, '');
    const recordTypeList=this.getEntityRecordTypes();
    const requestRelatedTo = this.getRelatedTo(null, 1, '');
    const requestTags = this.getCaseTags();
    const priorityList = this.getPriority();
    const severityList = this.getSeverity();
    const requestVerifiedBy = this.getVerifiedByUsers(null, 1, '');
    const stageList=this.getStage();
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
            label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_ENTITYTIMESPAN'),
            name: 'entityTimespan',
            placeHolder: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_PLACEHOLDER_ENTITYTIMESPAN'),
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

          this.filterUsers.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_OPTION_TEXT_ASSIGNEDTO') });
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
            label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_ASSIGNTO'),
            name: 'assignedToIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_PLACEHOLDER_ASSIGNTO'),
            ngModel: selectedUserIds.length == 0 ? '' : selectedUserIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.filterUsers,
            isHidden: false,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-md',
            isCountableFilter: 1
          }

          //hide AssignedTo field in filter
          if (!this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.KanbanListFilter, FieldNames.AssignedTo)) {
            // add to filter
            this.customFilterConfig.push(assignedToFilter);
          }
          
        }

        //Record Types
        if (results[2] != undefined) {
          let response = results[2] as any[];
          //record type list in dropdown
          this.entityRecordType = response;
          this.entityRecordType.push({ label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_OPTION_TEXT_RECORDTYPE'), value: 0 })
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
            label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_RECORDTYPE'),
            name: 'entityRecordTypeIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_PLACEHOLDER_RECORDTYPE'),
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
              relatedToIconClass: this._commonHelper.getEntityIconClass(this.relatedEntityTypeId),
              relatedToIconToolTip: foundRecord?.['displayName'].toString().trim(),
              name: 'entityIDs',
              placeHolder: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_PLACEHOLDER_RELATEDTO', { entityName: foundRecord?.['displayName'].toString().trim() }),
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
            label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_TAGS'),
            name: 'tagIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_PLACEHOLDER_TAGS'),
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
            label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_PRIORITY'),
            name: 'priorityIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_PLACEHOLDER_PRIORITY'),
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
            label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_SEVERITY'),
            name: 'severityIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_PLACEHOLDER_SEVERITY'),
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
            label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_DUE_FROM'),
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
            label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_DUE_TO'),
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
            label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_DUE_DATE'),
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
          this.filterVerifiedByUsers.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_OPTION_TEXT_VERIFIEDBY') });
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
            label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_VERIFIED_BY'),
            name: 'verifiedByIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_PLACEHOLDER_VERIFIED_BY'),
            ngModel: selectedUserIds.length == 0 ? '' : selectedUserIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.filterVerifiedByUsers,
            isHidden: false,
            defaultClass: 'small-filter',
            panelStyleClass: 'maxWidthOverride-md',
            isCountableFilter: 1
          }

          //hide verifiedBy field in filter
          if (!this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.KanbanListFilter, FieldNames.VerifiedBy, this.entityWorkflowId)) {
            // add to filter
            this.customFilterConfig.push(verifiedByFilter);
          }
          
        }

        //Add Case Created Date Range Filter
        this.addCaseCreatedDateRangeFilter();

        if(results[8] != undefined) {
          let Liststages = results[8] as any[];
          this.filterStage = Liststages;

          if (this.showLayout == LayoutTypes.ListView) {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_STATUS');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_PLACEHOLDER_STATUS');
          }
          else {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_STAGE');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_PLACEHOLDER_STAGE');
          }

         //set selected stage in dropdown
         let selectedStageIds: any[] = [];

         if(this.filterStage.length > 0) {
          var selectedIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.stageIDs : this.dataSearch.paramsByStage.stageIDs;
          if (selectedIdSString != "") {
          var selectedIds= selectedIdSString?.split(',');

          if(selectedIds?.length > 0){
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
        let stageFilter={
          inputType: 'MultiSelect',
          label: this.StatusFilterLabel,
          name: 'stageIDs',
          placeHolder: this.StatusFilterPlaceholder,
          ngModel: selectedStageIds.length == 0 ? '' : selectedStageIds,
          optionLabel: 'label',
          optionValue: 'value',
          options: this.filterStage,
          isHidden: !this.dataSearch.isPageTabularView,
          defaultClass: 'responsive-filter',
          panelStyleClass : 'maxWidthOverride-md',
          isCountableFilter: 1
        }
        // add to filter
         this.customFilterConfig.push(stageFilter);
        }

        if (results[9]) {
          let ratingOptions = results[9] as any[];
          let selectedRatingIds: any = this.dataSearch.isPageTabularView ? this.dataSearch.params.rating : this.dataSearch.paramsByStage.rating;
          if (selectedRatingIds == null || selectedRatingIds == '') {
            selectedRatingIds = null;
          } else {
            this.filterCount ++;
          }
          let ratingFilter = {
            inputType: 'Dropdown',
            label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_RATING'),
            name: 'rating',
            placeHolder: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_PLACEHOLDER_RATING'),
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

           // add to filter
           this.customFilterConfig.push(ratingFilter)
           this.dataSearch.paramsByStage.rating = selectedRatingIds == null ? null : selectedRatingIds;
           this.dataSearch.params.rating = selectedRatingIds == null ? null : selectedRatingIds;
        }

        //Insert "ShowMyCases" filter
        let isShowMyCases = this.dataSearch.isPageTabularView ? this.dataSearch.params.showMyCases : this.dataSearch.paramsByStage.showMyCases;
        let ShowMyCasesFilter = 
        {
          inputType: 'Checkbox',
          label: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_MY_CASES')),
          name: 'showMyCases',
          ngModel: isShowMyCases,
          ngModelDefaultValue: true,
          isHidden: false,
          isCountableFilter: 1
        }
        this.customFilterConfig.push(ShowMyCasesFilter);
        if(ShowMyCasesFilter.ngModel == true){
          this.filterCount ++;
        }

         //Insert "BookMark" filter
         let isStarred = this.dataSearch.isPageTabularView ? this.dataSearch.params.showStarred : this.dataSearch.paramsByStage.showStarred;
         let showStarredFilter = 
         {
          inputType: 'Checkbox',
          label: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_STARRED')),
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

  addCaseCreatedDateRangeFilter() {

    // Case Created From Date Filter
    let selectedFromDate = this.dataSearch.isPageTabularView ? this.dataSearch.params.createdFromDate : this.dataSearch.paramsByStage.createdFromDate;
    let createdFromDateFilter = {
      inputType: 'DateFrom',
      label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_CREATED_FROM'),
      name: 'createdFromDate',
      ngModel: selectedFromDate,
      isHidden: false,
      defaultClass: 'small-filter',
      isCountableFilter: 0
    };
    this.customFilterConfig.push(createdFromDateFilter);

    // Case Created To Date Filter
    let selectedToDate = this.dataSearch.isPageTabularView ? this.dataSearch.params.createdToDate : this.dataSearch.paramsByStage.createdToDate;
    let createdToDateFilter = {
      inputType: 'DateTo',
      label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_CREATED_TO'),
      name: 'createdToDate',
      ngModel: selectedToDate,
      isHidden: false,
      defaultClass: 'small-filter',
      isCountableFilter: 0
    };
    this.customFilterConfig.push(createdToDateFilter);

    //daterange picker
    let dateRange = [];
    if (selectedFromDate != undefined && selectedFromDate != null) {
      dateRange.push(selectedFromDate);
    }
    if (selectedToDate != undefined && selectedToDate != null) {
      dateRange.push(selectedToDate);
    }

    let createdDateRangeFilter = {
      inputType: 'DateRangePicker',
      label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_LABEL_CREATED_DATE'),
      ngModelDefaultValue: [],
      name: 'createdDates',
      ngModel: dateRange,
      isHidden: false,
      defaultClass: 'small-filter',
      fromDateControlName: 'createdFromDate',
      toDateControlName: 'createdToDate',
      isCountableFilter: 1
    };
    this.customFilterConfig.push(createdDateRangeFilter);
    if(createdDateRangeFilter.ngModel.length > 0){
      this.filterCount ++;
    }
  }

  multiSelectFilterEvent(event) {
    if (event && event.controlName == 'entityIDs') {
      this.getRelatedTo(event.selectedIds, 0, event.filter).then(results => {
        this.relatedTo = results;
        this.customFilterConfig[3].options = this.relatedTo;
      });

    }
    if (event && event.controlName == 'assignedToIDs') {
      this.getAssignedToUsers(event.selectedIds, 0, event.filter).then(results => {
        this.users = results;
        this.users.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_OPTION_TEXT_ASSIGNEDTO') });
        this.users.sort((a, b) => a.value - b.value);
        this.customFilterConfig[2].options = this.users;
      });
    }
    if (event && event.controlName == 'verifiedByIDs') {
      this.getVerifiedByUsers(event.selectedIds, 0, event.filter).then(results => {
        this.filterVerifiedByUsers = results;
        this.filterVerifiedByUsers.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.LIST.FILTER_OPTION_TEXT_VERIFIEDBY') });
        this.filterVerifiedByUsers.sort((a, b) => a.value - b.value);
        this.customFilterConfig[11].options = this.filterVerifiedByUsers;
      });
    }
  }


  getAssignedToUsers(selectedUserId: any, includeAllUsers, searchString: any): Promise<any> {
    const params = this.prepareParamsForAssignedToUsers('', selectedUserId, includeAllUsers, searchString);
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CASEASSIGNEDTO, params);
  }

  getVerifiedByUsers(selectedUserId: any, includeAllUsers, searchString: any): Promise<any> {
    const params = this.prepareParamsForVerifiedByUser('', selectedUserId, includeAllUsers, searchString);
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CASEVERIFIEDBY, params);
  }

  getRelatedTo(selectedEntity: any, includeAllEntities, searchString: any): Promise<any> {
    const params = this.prepareParamsForRelatedTo(selectedEntity, includeAllEntities, searchString);
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CASERELATEDENTITIES, params);
  }

  getCaseTags(): Promise<any> {
    return this._entitytagsService.getActiveEntityTagsByEntityTypeId(this.entityTypeId, this.entityRecordTypeId);
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

  private getStage(): Promise<any> {
    const params= this.prepareParamsForEntityStagesByWorkflowId();
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITYSTAGESBYWORKFLOWID,params);
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

    //set case search filter
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);

    // check if table or kanban
    if (this.dataSearch.isPageTabularView) {
      this.getCases();
    }
    else {
      this.stages = [];
      this.caseList = [];
      // prepare stages
      this.prepareStages();
    }

    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedCaseIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  // get work tasks for list
  getCases() {
    this._commonHelper.showLoader();
    this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null;

    this.dataSearch.params.createdFromDate = this.dataSearch.params.createdFromDate != null ? moment(this.dataSearch.params.createdFromDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.createdToDate = this.dataSearch.params.createdToDate != null ? moment(this.dataSearch.params.createdToDate).format('YYYY-MM-DD') : null;

    this._casesService.getCasesByWorkflowIDWithPagination(this.dataSearch.params).then((response: any) => {
      this.caseList = response;
      this.caseList.forEach(caseItem => {
        caseItem.description = this._commonHelper.htmlToPlainText(caseItem.description);
        if ((caseItem.assignedTo == this._loggedInUser.userId || caseItem.isHandRaised) && this.isEditCase) {
          caseItem.showRaiseHandButtons = true;
        } else {
          caseItem.showRaiseHandButtons = false;
        }
      });
      //reset selected
      this.isAllCheckBoxSelected = false;
      this.caseList.forEach(f => f.isSelected = false);
      // total
      this.totalRecords = this.caseList.length > 0 ? response[0].totalRecords : 0;
      this.dt.rows = this.dataSearch.params.pageSize;
      this.totalPages = Math.ceil(this.totalRecords / this.dataSearch.params.pageSize);
      this.end = this.dataSearch.params.pageNo == this.totalPages ? this.totalRecords : this.dataSearch.params.pageNo * this.dataSearch.params.pageSize;
      this.start = this.end == this.totalRecords ? (this.totalRecords - this.caseList.length + 1) : (this.end - this.dataSearch.params.pageSize) + 1;

      //set Action column show/hide dynamically
      this.isStageClosedOrCompleted = this.caseList.filter(x => x.isCompletedStage || x.isClosedStage).length;
      if ((!this.isAllowToReopen && !this.isDeleteCase) || (this.isStageClosedOrCompleted < 0 && this.isAllowToReopen)) {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = false;
      }
      else {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = true;
      }

      if (this.selectedCaseIdForActivityCenter != null && this.selectedCaseIdForActivityCenter > 0 && this.caseList.some(x=>x.id == this.selectedCaseIdForActivityCenter)) {
        this.updateEntityDetails(true, this.caseList.find(x=>x.id == this.selectedCaseIdForActivityCenter));
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

  // get cases by stage
  getEntityStagesWithTask() {
    const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
    if (entityStagesWithTasks == null) {
      return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId).then(
        (response: any[]) => {
          this.caseListByStages = JSON.parse(JSON.stringify(response));
          this.caseListByStages.forEach((stage: any) => {
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
          this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.caseListByStages));
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
      this.caseListByStages = entityStagesWithTasks;
    }
  }

  // prepare stages with tasks
  private async prepareStages() {
    this.caseListByStages.forEach((stage: any) => {
      // stage view
      let kanbanStage: KanbanStage = {
        id: stage.id,
        name: stage.name,
        stage: "",
        totalItems: 0,
        totalOpportunityValue: 0,
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
        showLoader: true
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

      params.createdFromDate = params.createdFromDate != null ? moment(params.createdFromDate).format('YYYY-MM-DD') : null;
      params.createdToDate = params.createdToDate != null ? moment(params.createdToDate).format('YYYY-MM-DD') : null;
      this._casesService.getCasesByWorkflowIDAndStageID(params).then(
        (cases: any) => {
          this.caseList.push(...cases);
          // for each task prepare card
          let kanbanStageCards: KanbanStageCard[] = [];
          cases.forEach((caseItem: any) => {
            // set total
            this.stages[index].totalItems = caseItem.totalRecords;

            const taskIds: Array<number> = caseItem.selectedStageTaskIDs
              ? caseItem.selectedStageTaskIDs.split(",").map(m => Number(m))
              : [];

            // check if the current assigned to and logged in user is same
            var isSelectedTasksDisabled: boolean = true;
            var showPauseResumeButtons: boolean = false;
            var showAddSubCaseButton: boolean = false;
            let showRaiseHandButtons: boolean = false;
            let canUserMoveTask: boolean = this.canUserChangeStage(this.stages[index], caseItem);

            // check hidden
            var checkAnyoneCanSelectStageTasks: boolean = false;
            // if tenant setting is true no need to check current logged in user 
            if (this.caseStageTaskChange.toLowerCase() == "yes") {
              checkAnyoneCanSelectStageTasks = true;
            }
            else if (caseItem.assignedTo == this._loggedInUser.userId) {
              checkAnyoneCanSelectStageTasks = true;
            }
            else {
              checkAnyoneCanSelectStageTasks = false;
            }

            if ((checkAnyoneCanSelectStageTasks || this.isResumeTask) && this.isEditCase) {
              isSelectedTasksDisabled = false;
              showPauseResumeButtons = true;
            }

            //Raise Hand Task condition
            if ((caseItem.assignedTo == this._loggedInUser.userId || caseItem.isHandRaised) && this.isEditCase) {
              showRaiseHandButtons = true;
            }

            // show/hide add sub case button
            if (this.isAddSubCase) {
              showAddSubCaseButton = true;
            }
            let settingsJson = JSON.parse(caseItem.settingsJson);
            const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.relatedEntityTypeId);

            // prepare card data
            let kanbanStageCard: KanbanStageCard = {
              id: caseItem.id,
              stageId: caseItem.stageID,
              labelType1: KanbanBoardTokenTypes[settingsJson.Token1Type as keyof typeof KanbanBoardTokenTypes],
              label1: settingsJson.Token1Text,
              label1RedirectURL: settingsJson.Token1Url,
              labelTooltip1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.Token1Tooltip)),
              labelType2: KanbanBoardTokenTypes[settingsJson.Token2Type as keyof typeof KanbanBoardTokenTypes],
              label2: settingsJson.Token2Text,
              labelTooltip2: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.Token2Tooltip)),
              label2RedirectURL: settingsJson.Token2Url,
              labelType3: KanbanBoardTokenTypes[settingsJson.Token3Type as keyof typeof KanbanBoardTokenTypes],
              label3: settingsJson.Token3Text,
              labelTooltip3: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.Token3Tooltip)),
              label3RedirectURL: settingsJson.Token3Url,
              entityId: caseItem.entityID,
              entityTypeId: caseItem.entityTypeID,
              entityTypeName: caseItem.entityTypeName,
              relatedToLabel: caseItem.entityName,
              relatedToIconClass: this._commonHelper.getEntityIconClass(caseItem.entityTypeID),
              relatedToIconToolTip: foundRecord?.['displayName'].toString().trim(),
              relatedToTooltip: this._commonHelper.getInstanceTranlationData('CASES.LIST.KANBAN.TOOLTIP_RELATED_TO') + ": " + caseItem.entityName,
              relatedToRedirectURL: this.onRelatedToClick(caseItem),
              selectedTasks: (this.stages[index].tasks || []).filter(f => taskIds.includes(f.id)) || [],
              selectedTasksDisabled: isSelectedTasksDisabled,
              isPaused: caseItem.isPaused,
              isPausedTooltip: caseItem.isPaused != null && caseItem.isPaused ? this._commonHelper.getInstanceTranlationData('CASES.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('CASES.LABEL_SWITCH_PAUSE'),
              pausedLabel: this._commonHelper.getInstanceTranlationData('CASES.LABEL_SWITCH_PAUSE'),
              resumeLabel: this._commonHelper.getInstanceTranlationData('CASES.LABEL_SWITCH_RESUME'),
              resumeNotAccess: this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_RESUME_NOT_ACCESS'),
              showPauseResumeButtons: showPauseResumeButtons,
              showAddSubWorkTaskButton: showAddSubCaseButton,
              canUserChangeStage: canUserMoveTask,
              owner1Id: caseItem.assignedTo,
              owner1Name: caseItem.assignedToName,
              owner1Tooltip: caseItem.assignedToName ? this._commonHelper.getConfiguredEntityName(`${this._commonHelper.getInstanceTranlationData('CASES.LIST.KANBAN.TOOLTIP_ASSIGN_TO')}: ${caseItem.assignedToName}`) : this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.LIST.KANBAN.TOOLTP_ASSIGN_TO_ACTION')),
              owner1userTypeId: this.userTypeID.AssignedTo,
              priority: caseItem.priority,
              priorityName: caseItem.priorityName,
              priorityTooltip: this._commonHelper.getInstanceTranlationData('CASES.LIST.KANBAN.TOOLTIP_PRIORITY'),
              priorityDefaultTooltip: this._commonHelper.getInstanceTranlationData('CASES.LIST.KANBAN.TOOLTIP_PRIORITY_DEFAULT'),
              severity: caseItem.severity,
              severityName: caseItem.severityName,
              severityTooltip: this._commonHelper.getInstanceTranlationData('CASES.LIST.KANBAN.TOOLTIP_SEVERITY'),
              severityDefaultTooltip: this._commonHelper.getInstanceTranlationData('CASES.LIST.KANBAN.TOOLTIP_SEVERITY_DEFAULT'),
              disabled: caseItem.isPaused != null ? caseItem.isPaused : false,
              parentID: caseItem.parentID,
              parentTokenType: KanbanBoardTokenTypes[settingsJson.ParentTokenType as keyof typeof KanbanBoardTokenTypes],
              parentLabel: settingsJson.TokenText,
              parentLabelTooltip1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.ParentTokenTooltip)),
              parentLabelRedirectUrl: settingsJson.ParentTokenUrl,
              isSubTask: caseItem.isSubCase,
              isHandRaised: caseItem.isHandRaised,
              showRaiseHandButtons: showRaiseHandButtons,
              handRaisedTooltipText: caseItem.isHandRaised != null && caseItem.isHandRaised ? this._commonHelper.getInstanceTranlationData('CASES.LABEL_HAND_UNRAISED') : this._commonHelper.getInstanceTranlationData('CASES.LABEL_HAND_RAISED'),
              owner2Id: caseItem.verifiedBy,
              owner2Name: caseItem.verifiedByName,
              owner2Tooltip: caseItem.verifiedByName ? `${this._commonHelper.getInstanceTranlationData('CASES.LIST.KANBAN.TOOLTIP_VERIFIED_BY')}: ${caseItem.verifiedByName}` : this._commonHelper.getInstanceTranlationData('CASES.LIST.KANBAN.TOOLTP_VERIFIED_BY_ACTION'),
              owner2userTypeId: this.userTypeID.VerifiedBy,
              cardColorClass: caseItem.cardColorClass,
              isClosedStage: caseItem.isClosedStage,
              isCompletedStage: caseItem.isCompletedStage,
              stageName: caseItem.stageName,
              entityIcon: 'fas fa-file-invoice',
              entityRecordTypeId: caseItem?.entityRecordTypeID,
              entityRecordTypeName: caseItem.entityRecordTypeName,
              entityName: this._commonHelper.getInstanceTranlationData('CASES.DETAIL.CASE_NAME_LABEL'),
              createdBy: caseItem?.createdBy,
              stagesTasks: this.stages[index]?.tasks,
              rating: caseItem.rating,
              privacyLevel: caseItem?.privacyLevel,
              review: caseItem.totalReviews,
              created: caseItem?.created,
              owner3Id: caseItem?.createdBy,
              owner3userTypeId: this.userTypeID.CreatedBy,
              workTaskTypeName: this._commonHelper.getInstanceTranlationData('CASES.DETAIL.TAB_WORKTASKS.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
              workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
              entityReviewID: caseItem.entityReviewID,
              isEntityReviewEditable: !(caseItem?.isPaused ?? false),
              userLabel1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('COMMON.COMMON_USER_PROFILE.LABEL_ASSIGNEDTO')),
              userLabel2: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('COMMON.COMMON_USER_PROFILE.LABEL_VERIFIEDBY')),
              userLabel3: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('COMMON.COMMON_USER_PROFILE.LABEL_CREATEDBY')),
              isStarred: caseItem?.isStarred,
              isResumeRecord: this.isResumeTask,
              loggedInUser: this._loggedInUser.userId,
              isShowPauseOrResume: (!caseItem.isCompletedStage && !caseItem.isClosedStage) ? true : false
            }

            if (!isAppend && this.selectedCaseIdForActivityCenter != null && this.selectedCaseIdForActivityCenter > 0 && kanbanStageCard.id == this.selectedCaseIdForActivityCenter) {
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
          if (cases.length == 0 || cases == undefined) {
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

  private canUserChangeStage(currentStage, caseItem): boolean {
    if (currentStage == null || caseItem == null) {
      return true;
    }

    let canUserMoveTask: boolean = false;
    if (currentStage.transitionAssociates != null && currentStage.transitionAssociates != '') {
      const associates = currentStage.transitionAssociates.trim().split(',');
      associates.forEach(associate => {
        const associatePropertyName = this._commonHelper.convertToCamalize(associate);
        canUserMoveTask = canUserMoveTask || (caseItem.hasOwnProperty(associatePropertyName) ? (caseItem[associatePropertyName] == this._loggedInUser.userId) : false);
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
    this.caseList = this.caseList.filter((item) => item.stageId !== stageId);
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
      this._gaService.event('Case_Switch_Layout','Case_Workflow_Layout','Kanban',1,true,
      {
        'LoggedUserId':this._loggedInUser.userId,
        'TenantId':this._loggedInUser.tenantId
      });
      // reset
      this.dataSearch.paramsByStage.pageNo = 1;
      this.stages = [];
      this.caseList = [];
      // prepare stages
      this.prepareStages();
      this.dataSearch.isPageTabularView = false;
    } else {
      this._gaService.event('Case_Switch_Layout','Case_Workflow_Layout','List',2,true,
      {
        'LoggedUserId':this._loggedInUser.userId,
        'TenantId':this._loggedInUser.tenantId
      });
      this.dataSearch.isPageTabularView = true;
      this.dataSearch.params.pageNo = 1;

      this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null
      this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null

      this.dataSearch.params.createdFromDate = this.dataSearch.params.createdFromDate != null ? moment(this.dataSearch.params.createdFromDate).format('YYYY-MM-DD') : null
      this.dataSearch.params.createdToDate = this.dataSearch.params.createdToDate != null ? moment(this.dataSearch.params.createdToDate).format('YYYY-MM-DD') : null
      this.caseList = [];
      this.getCases();
    }

    //set hidden for stage filter
    let stageFilter = this.customFilterConfig.find(x => x.name === 'stageIDs');
    if (stageFilter) {
        stageFilter['isHidden'] = pageLayout === 'CARD';
    }

    this.resetSelectedEntity();

    //set case search filter
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);

    //set quickview config
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedCaseIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  //Case card drag-drop to other card
  onDropSuccess(event: CdkDragDrop<{}[]>) {
    //check can user change stage
    if (!event.item.data.canUserChangeStage) {
      if (this.changeCaseStage) {
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterDropSuccess(event);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
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
      const caseId = event.item.data.id;
      const caseStageId = +event.item.data.stageId;

      //Check Is All Tasks Required for current Entity Stage before move onto the next Entity Stage.
      const isAllTasksRequired = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageIsAllTasksRequired').innerHTML;
      const previousStageId = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;

      // if any one of the current stage task is required
      let anyTasksIsRequired: boolean = false;
      let requiredTasks: any[] = [];
      // find out the current stage
      let currentStage = this.caseListByStages.find(x => x.id == previousStageId);
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
          * Call API to validate case has completed the stage tasks (which are required) before moving on to other stage.
          * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (caseId)
          * */
        let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
        this._commonHelper.showLoader();
        this._workflowmanagementService.isEntityStageTasksCompleted(caseId, this.entityTypeId, caseStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response === true) {
            this.checkHandRaised(event);
          } else {
            //Stage Tasks are not completed..
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_BEFORE_MOVE_CASE_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
            return false;
          }
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
      else if (isAllTasksRequired && isAllTasksRequired.toLowerCase() == "true") {
        /**
          * Call API to validate case has completed all the stage tasks before moving on to other stage.
          * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (CaseId)
          * */
        this._commonHelper.showLoader();
        this._workflowmanagementService.isEntityStageTasksCompleted(caseId, this.entityTypeId, caseStageId, this.entityWorkflowId, null).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response === true) {
            this.checkHandRaised(event);
          } else {
            //Stage Tasks are not completed..
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_BEFORE_MOVE_CASE_STAGE_TASK_SHOULD_BE_COMPLETED'));
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

    const caseId = event.item.data.id;
    const caseStageId = +event.item.data.stageId;

    this._commonHelper.showLoader();

    this._workflowmanagementService.isEntityStageRaiseHandTransitionExist(caseId, this.entityTypeId, this.entityWorkflowId, caseStageId).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response === true) {
        //Hand Raised - Not allowe to move the stage
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_BEFORE_MOVE_CASE_FOR_RAISED_HAND_TASK'));
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

    const caseId = event.item.data.id;
    const caseStageId = +event.item.data.stageId;
    const dropCaseStageId = +event.container.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;
    const dropCaseStageName = event.container.element.nativeElement.querySelector('div .cards-header #stageName').innerHTML;
    const isNoteRequired = event.container.element.nativeElement.querySelector('div .cards-header #stageNoteRequired').innerHTML;
    const assignedTo = event.item.data.owner1Id;
    const verifiedBy = event.item.data.owner2Id;
    const isCompletedStage = event.item.data.isCompletedStage;
    const isClosedStage = event.item.data.isClosedStage;
    const stageName = event.item.data.stageName;

    let currentStage = this.stages.find(x => x.id == caseStageId);
    let dropStage = this.stages.find(x => x.id == dropCaseStageId);

    if (isCompletedStage || isClosedStage) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_CASES', { stageName: stageName }));
      return;
    }

    // check if note is required
    if (isNoteRequired == 'true') {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = caseId;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropCaseStageName }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = dropCaseStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(noteDate => {
        if (noteDate != undefined) {
          // save to transition
          Promise.all([
            this.saveCaseStage(caseId, caseStageId, dropCaseStageId, dropCaseStageName, assignedTo, verifiedBy, isCompletedStage, isClosedStage, stageName)
          ]).then(() => {
            const param = {
              entityTypeId: this.entityTypeId,
              entityId: caseId,
              workflowId: this.entityWorkflowId,
              workflowStageId: dropCaseStageId,
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

              this.getEntityStageData(caseStageId, false); // refresh current stage
              this.getEntityStageData(dropCaseStageId, false); // refresh drop stage 
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
        this.saveCaseStage(caseId, caseStageId, dropCaseStageId, dropCaseStageName, assignedTo, verifiedBy, isCompletedStage, isClosedStage, stageName)
      ]).then(() => {

        currentStage.pagination.pageNo = 1; //reset current pagination stats of source stage
        dropStage.pagination.pageNo = 1; //reset current pagination stats of target stage
        this.dataSearch.paramsByStage.pageNo = 1 //rest global stage params pagination stage

        this.getEntityStageData(caseStageId, false); // refresh current stage
        this.getEntityStageData(dropCaseStageId, false); // refresh drop stage 
      }).catch(() => {
        //this.refreshData();
      });
    }
  }

  //case stage change save
  saveCaseStage(caseId, caseStageId, dropCaseStageId, dropCaseStageName, assignedTo, verifiedBy, isCompletedStage, isClosedStage, stageName) {
    return new Promise((resolve, reject) => {
      let assignedToForDto = assignedTo;
      this._commonHelper.showLoader();
      if (isCompletedStage || isClosedStage) {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_CASES', { stageName: stageName }));
        return;
      }
      else {
        this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: caseId, stageId: dropCaseStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedTo, verifiedBy: verifiedBy, oldStageId: caseStageId }).then((response: any) => {
          if (response) {
            this.caseAssignedTo = response;
            if (assignedToForDto != this.caseAssignedTo.assignedToId) {
              this._commonHelper.showLoader();
              this._casesService.updateCaseAssignedTo({ entityId: caseId, assignedToId: this.caseAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.caseAssignedTo.isForcedAssignment }).then((response: any) => {
                if (response) {
                  assignedToForDto = this.caseAssignedTo.assignedToId;
                  // success message
                  this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASE_MOVETO_STAGE', { stageName: dropCaseStageName }));
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
              this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASE_MOVETO_STAGE', { stageName: dropCaseStageName }));
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
  onClickCaseCard(ev, caseItem) {
    if (!caseItem.isConvertedToProspect) {
      if ((ev.tagName.toLowerCase() === 'p') || (ev.tagName.toLowerCase() === 'section')) {
        this._router.navigateByUrl('/cases/details/' + this.entityWorkflowId + "/" + caseItem.id);
      }
    }
  }

  // event emitted from kanban
  onCaseClick(caseItem) {
    // check logged in user have permission to view case details
    if (!this.isViewCase) {
      return;
    }

    // if not undefined then redirect
    if (caseItem.id != undefined) {
      this._router.navigate(['cases', 'details', this.entityWorkflowId, caseItem.id]);
    }
  }

  // event emitted from kanban
  onRelatedToClick(caseItem) {
    // check logged in user have permission to view related entity details
    if (!this._commonHelper.isUserHaveViewPermissionOfRelatedEntity(caseItem.entityTypeID)) {
      return this._router.url;
    }

    // if not undefined then redirect
    if (caseItem.entityTypeName != undefined && caseItem.entityID != undefined) {
      return '/' + this._commonHelper.getRouteNameByEntityTypeId(caseItem.entityTypeID).toLowerCase() + '/details/' + caseItem.entityID;
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
    const stageTasks = this.caseListByStages?.find(x => x.id == rowData?.stageID)?.stageTasks;
    const settingsJson = JSON.parse(rowData.settingsJson);
    
    const obj = {
      id: rowData.id,
      entityIcon: 'fas fa-file-invoice',
      entityName: this._commonHelper.getInstanceTranlationData('CASES.DETAIL.CASE_NAME_LABEL'),
      label1: settingsJson.Token1Text,
      label1RedirectURL: settingsJson.Token1Url,
      label2: settingsJson.Token2Text,
      label2RedirectURL: settingsJson.Token2Url,
      label3: settingsJson.Token3Text,
      label3RedirectURL: settingsJson.Token3Url,
      relatedToLabel: rowData?.entityName,
      relatedToIconToolTip: this._commonHelper.entityTypeList.find(entityType => entityType['id'] == rowData?.entityTypeID)?.displayName.toString().trim(),
      entityTypeId: rowData?.entityTypeID,
      entityRecordTypeId: rowData?.entityRecordTypeID,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      stagesTasks: stageTasks,
      selectedTasks: (stageTasks || []).filter(f => taskIds.includes(f.id)) || [],
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      stageName: rowData?.stageName,
      isPaused: rowData?.isPaused,
      createdBy: rowData?.createdBy,
      relatedToRedirectURL: this.onRelatedToClick(rowData),
      workTaskTypeName: this._commonHelper.getInstanceTranlationData('CASES.DETAIL.TAB_WORKTASKS.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
      workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
      isStarred: rowData?.isStarred,
      showRaiseHandButtons: rowData.showRaiseHandButtons,
      isHandRaised: rowData.isHandRaised,
      isResumeRecord: this.isResumeTask,
      loggedInUser: this._loggedInUser.userId,
      isShowPauseOrResume: (!rowData.isCompletedStage && !rowData.isClosedStage) ? true : false
    }
    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id;
    this.caseCreatedBy = rowData?.createdBy;
    this.casePrivacyLevel =  rowData?.privacyLevel;

    this.selectedCaseForActivityCenter = rowData;
    this.selectedCaseIdForActivityCenter = rowData.id;
    this.selectedCaseIsPausedForActivityCenter = (rowData?.isPaused ?? false);
    this.selectedCaseIsClosedForActivityCenter = rowData?.isClosedStage;
    this.selectedCaseIsCompletedForActivityCenter = rowData?.isCompletedStage;

     // get set quickview local storage config start
     this.quickViewConfig = {
      selectedCardEntityId: this.selectedRowId,
      selectedRowEntityId: this.selectedRowId,
    }
  
    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewCase);
  }

  // event emitted from kanban
  onCardClick(caseItem, isShowActivityCenter:boolean = null) {
    this.caseCreatedBy = caseItem?.createdBy;
    this.casePrivacyLevel = caseItem?.privacyLevel;
    caseItem.entityWorkflowId = this.entityWorkflowId; 
    caseItem.relatedToIconToolTip = this._commonHelper.entityTypeList.find(entityType => entityType['id'] == caseItem?.entityTypeId)?.displayName.toString().trim();
    this.entityDetails = this._commonHelper.cloningObject(caseItem);
    this.selectedCaseForActivityCenter = caseItem;
    this.selectedCaseIdForActivityCenter = caseItem.id;
    this.selectedCaseIsPausedForActivityCenter = (caseItem?.isPaused ?? false);
    this.selectedCaseIsClosedForActivityCenter = caseItem?.isClosedStage;
    this.selectedCaseIsCompletedForActivityCenter = caseItem?.isCompletedStage;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedCardEntityId: caseItem.id,
      selectedRowEntityId: caseItem.id,
    };

    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewCase);
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

  onEntityStageTasksSelect(event) {
    if (!this.dataSearch.isPageTabularView) {
      const currentStage = this.stages?.find(s => s.id == event.stageId);
      const currentCard = currentStage?.cards?.find((k: any) => k.id == event.id)
      if(currentCard){
        currentCard.selectedTasks = event?.selectedTasks;
      }
    } else {
      const selectedCase = this.caseList.find(x => x.id == event.id);
      if(selectedCase){
        selectedCase.selectedStageTaskIDs = event.selectedTasks.map(x => x.id).toString();
      }
    }
  }

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewCase;
        this.selectedCaseIdForActivityCenter = details.id;
        this.selectedCaseForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedCaseIsPausedForActivityCenter = (details?.isPaused ?? false);
        this.selectedCaseIsClosedForActivityCenter = details?.isClosedStage;
        this.selectedCaseIsCompletedForActivityCenter = details?.isCompletedStage;
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
    this.selectedCaseForActivityCenter = null;
    this.selectedCaseIdForActivityCenter = 0;
    this.selectedCaseIsPausedForActivityCenter = null;
    this.selectedCaseIsClosedForActivityCenter = null;
    this.selectedCaseIsCompletedForActivityCenter = null;
    this.selectedRowId = 0;
    if (this.kanbanStage) {
      this.kanbanStage.selectedCard = 0;
    }
  }

  // to check logged in user have access
  userHavePermissionOfRelatedTo(caseItem) {
    let isViewRelatedToEntity = false;
    switch (caseItem.entityTypeName) {
      case "Accounts":
        isViewRelatedToEntity = this._commonHelper.havePermission(enumPermissions.ViewAccount);
        break;
      case "Contacts":
        isViewRelatedToEntity = this._commonHelper.havePermission(enumPermissions.ViewContact);
        break;
      case "Products":
        isViewRelatedToEntity = this._commonHelper.havePermission(enumPermissions.ViewProduct);
        break;
    }
    return isViewRelatedToEntity;
  }

  onCaseStagePauseChanged(caseItem: any, isPaused: boolean) {
    if(!this.isEditCase){ return; }

    if (caseItem.owner1Id !== this._loggedInUser.userId) {
      let message = "";
      if (caseItem.owner1Id == null || caseItem.owner1Id == "" || caseItem.owner1Id == undefined) {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.caseStagePauseChangeList(caseItem, isPaused);
          }
        });
    }
    else if (caseItem.owner1Id == this._loggedInUser.userId) {
      this.caseStagePauseChangeList(caseItem, isPaused);
    }
  }

  caseStagePauseChangeList(caseItem, isPaused: boolean) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: caseItem.id,
      entityStageId: caseItem.stageId,
      isPaused: isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: caseItem.owner1Id,
      noteID: null
    };

    if (params.isPaused) {
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityStageIsPaused(caseItem.id, this.entityTypeId, this.entityWorkflowId).then(res => {
        this._commonHelper.hideLoader();
        if (!res) {
          this.optionsForPopupDialog.size = 'md';
          this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
          this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
          this.modalRef.componentInstance.entityId = caseItem.id;
          this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.PAUSE_REASON_NOTE_SUBJECT', { stageName: caseItem.stageName }))}`;
          this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
          this.modalRef.componentInstance.stageId = caseItem.stageId;
          this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
          this.modalRef.componentInstance.isSaveNote = true;

          this.modalRef.result.then(noteDate => {
            if (noteDate) {
              params.noteID = noteDate.id;
              this.saveEntityStagePauseTransitionFromList(params, caseItem);
            }
          });
        } else {
          this.dataSearch.params.pageNo = 1;
          this.caseList = [];
          this.getCases();
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('CASES.CASES_PAUSEDORDELETEERROR')
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
        entityId: caseItem.id,
        entityRecordTypeID: null,
        subject: null,
        isPrivate: false,
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.RESUME_NOTE_DESCRIPTION', { stageName: caseItem.stageName }))}`,
        createdBy: this._loggedInUser.userId
      };

      this._commonHelper.showLoader();
      this._noteService.addNewNote(noteParam).then((response: any) => {
        if (response) {
          params.noteID = response.id;
          this.saveEntityStagePauseTransitionFromList(params, caseItem);
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

  saveEntityStagePauseTransitionFromList(params, caseItem) {
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
          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_RESUME_SUCCESS'));
          caseItem.isPaused = params.isPaused;

          //record update for List view.
          let updateEntityPauseStatusForList = this.caseList.find(x=>x.id == caseItem.id);
          updateEntityPauseStatusForList.isPaused = caseItem.isPaused;

          //record update for Card view.
          if (this.kanbanStage) {
            let card: any = {};
            card.id = caseItem.id;
            card.stageId = caseItem.stageId;
            card.isPaused = params.isPaused;
            card.disabled = params.isPaused ? true : false;
            this.kanbanStage.updateEntityPauseStatus(card);
          }

          //update Activity Center
          if (caseItem.id == this.selectedCaseIdForActivityCenter) {
            this.updateEntityDetails(false, caseItem);
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

  // stage pause changed event
  onCaseStagePauseChangedFromCard(event: KanbanStagePauseEvent) {
    if (event.card.owner1Id !== this._loggedInUser.userId) {
      let message = "";
      if (event.card.owner1Id == null || event.card.owner1Id == undefined) {
        message = event.isPaused ? this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = event.isPaused ? this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.caseStagePauseChange(event);
          }
        });
    }
    else if (event.card.owner1Id == this._loggedInUser.userId) {
      this.caseStagePauseChange(event);
    }
  }

  caseStagePauseChange(event: KanbanStagePauseEvent) {
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
          this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.PAUSE_REASON_NOTE_SUBJECT', { stageName: event.stage.name }))}`;
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
            this._commonHelper.getInstanceTranlationData('CASES.CASES_PAUSEDORDELETEERROR')
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
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.RESUME_NOTE_DESCRIPTION', { stageName: event.stage.name }))}`,
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
          event.card.isPausedTooltip = params.isPaused != null && params.isPaused ? this._commonHelper.getInstanceTranlationData('CASES.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('CASES.LABEL_SWITCH_PAUSE');

          //update Activity Center
          if (event.card.id == this.selectedCaseIdForActivityCenter) {
            this.updateEntityDetails(false, event.card);
          }

          event.card.isEntityReviewEditable = !(event.card?.isPaused ?? false);
          this.kanbanStage.updateEntityPauseStatus(event.card);

          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_RESUME_SUCCESS'));
          this._commonHelper.hideLoader();
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
      },
        (error) => {
          this._commonHelper.hideLoader();
          event.card.isPausedTooltip = event.card.isPaused != null && event.card.isPaused ? this._commonHelper.getInstanceTranlationData('CASES.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('CASES.LABEL_SWITCH_PAUSE');
          this.kanbanStage.updateEntityPauseStatus(event.card);
          this.getTranslateErrorMessage(error);
        });
  }

  // assigned to user what to do
  onAssignedToClick(event, caseItem = null) {

    if (!this.isAssignCase || (caseItem != null && caseItem.isPaused) || (event.card != null && event.card.isPaused)) {
      return;
    }

    if ((caseItem != null && (caseItem.isClosedStage || caseItem.isCompletedStage))
      || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (caseItem != null) {
        stageName = caseItem.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_CASES', { stageName: stageName }));
      return;
    }

    this._commonHelper.showLoader();
    // get data from event
    let assignedToId = caseItem != null ? caseItem.assignedTo : event.card.owner1Id; //owner 1 is assigned to
    let caseId = caseItem != null ? caseItem.id : event.card.id;
    let caseStageId = caseItem != null ? caseItem.stageID : event.card.stageId;
    const verifiedBy = caseItem != null ? caseItem.verifiedBy : event.card.owner2Id; //Verified By

    //DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    var params = this.prepareParamsForAssignedToUsers(caseStageId, assignedToId);
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CASEASSIGNEDTO, params).then((response: any) => {
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CASES.LIST.ASSIGNED_TO_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('CASES.LIST.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LIST.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        let obj = {
          entityid: caseId,
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: caseStageId
        };

        this._commonHelper.showLoader();
        this._casesService.updateCaseAssignedTo(obj).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response) {
            this.caseAssignedTo = response;
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: this.entityTypeId, entityId: caseId, entityWorkflowId: this.entityWorkflowId, stageId: caseStageId, assignedTo: selectedUserId, verifiedBy: verifiedBy }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASE_ASSIGNEDTO'));
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
            this.getEntityStageData(caseStageId, false);
          } else {
            this.dataSearch.params.pageNo = 1;
            this.caseList = [];
            this.getCases();
          }
          // close
          this.modalRef.close();
        }, (err) => {
          this.handlePausedOrDeleteCaseError(err, caseStageId);
          this.modalRef.close();
          this._commonHelper.hideLoader();
          if (err != null && String(err.messageCode).toLowerCase() === 'cases.closedorcompleted') {
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
  onVerifiedByClick(event, caseItem = null) {

    if (!this.isAssignCase || !this.isViewCase || (caseItem != null && caseItem.isPaused) || (event.card != null && event.card.isPaused)) {
      return;
    }

    if ((caseItem != null && (caseItem.isClosedStage || caseItem.isCompletedStage))
      || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (caseItem != null) {
        stageName = caseItem.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_CASES', { stageName: stageName }));
      return;
    }


    this._commonHelper.showLoader();
    // get data from event
    let assignedToId = caseItem != null ? caseItem.assignedTo : event.card.owner1Id;
    let verifiedById = caseItem != null ? caseItem.verifiedBy : event.card.owner2Id;
    let caseId = caseItem != null ? caseItem.id : event.card.id;
    let caseStageId = caseItem != null ? caseItem.stageID : event.card.stageId;

    // prepare params
    const params = this.prepareParamsForVerifiedByUser(caseStageId, verifiedById, 1, '');
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CASEVERIFIEDBY, params).then((response: any) => {
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CASES.LIST.VERIFIED_BY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('CASES.LIST.VERIFIED_BY_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LIST.VERIFIED_BY_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        let obj = {
          entityid: caseId,
          verifiedById: selectedUserId,
          entityWorkflowId: this.entityWorkflowId
        };

        this._commonHelper.showLoader();
        this._casesService.updateCaseVerifiedBy(obj).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response) {
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: this.entityTypeId, entityId: caseId, entityWorkflowId: this.entityWorkflowId, stageId: caseStageId, assignedTo: assignedToId, verifiedBy: selectedUserId }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASE_VERIFIED_BY'));
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
            this.getEntityStageData(caseStageId, false);
          } else {
            this.dataSearch.params.pageNo = 1;
            this.caseList = [];
            this.getCases();
          }
          // close
          this.modalRef.close();
        }, (err) => {
          this.handlePausedOrDeleteCaseError(err, caseStageId);
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

  onCardPriorityClick(event, caseItem = null) {
    if (!this.isEditCase || !this.isViewCase || (caseItem != null && caseItem.isPaused) || (event.card != null && event.card.isPaused)) {
      return;
    }

    if ((caseItem != null && (caseItem.isClosedStage || caseItem.isCompletedStage))
      || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (caseItem != null) {
        stageName = caseItem.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_CASES', { stageName: stageName }));
      return;
    }

    // get data from event
    let priority = caseItem != null ? caseItem.priority : event.card.priority;
    let caseStageId = caseItem != null ? caseItem.stageID : event.card.stageId;

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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CASES.LIST.PRIORITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.prioritySelectLabel = this._commonHelper.getInstanceTranlationData('CASES.LIST.PRIORITY_DIALOG.PRIORITY_SELECT_LABEL');
      this.modalRef.componentInstance.prioritySelectPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LIST.PRIORITY_DIALOG.PRIORITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangePriority.subscribe((selectedPriorityId) => {
        // prepare object to send to backend to save
        let obj = {
          entityId: caseItem != null ? caseItem.id : event.card.id,
          priority: selectedPriorityId,
          EntityWorkflowId: this.entityWorkflowId
        };

        this._commonHelper.showLoader();
        this._casesService.updateCasePriority(obj).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            if (!this.dataSearch.isPageTabularView) {
              // refresh current stage
              this.getEntityStageData(caseStageId, false);
            } else {
              this.dataSearch.params.pageNo = 1;
              this.caseList = [];
              this.getCases();
            }
          }
          // success message
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASE_PRIORITY')
          );
        },
          (error) => {
            this.handlePausedOrDeleteCaseError(error, caseStageId);
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

  onCardSeverityClick(event, caseItem = null) {
    if (!this.isEditCase || !this.isViewCase || (caseItem != null && caseItem.isPaused) || (event.card != null && event.card.isPaused)) {
      return;
    }

    if ((caseItem != null && (caseItem.isClosedStage || caseItem.isCompletedStage))
      || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (caseItem != null) {
        stageName = caseItem.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_CASES', { stageName: stageName }));
      return;
    }

    // get data from event
    let severity = caseItem != null ? caseItem.severity : event.card.severity;
    let caseStageId = caseItem != null ? caseItem.stageID : event.card.stageId;
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CASES.LIST.SEVERITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.severitySelectLabel = this._commonHelper.getInstanceTranlationData('CASES.LIST.SEVERITY_DIALOG.SEVERITY_SELECT_LABEL');
      this.modalRef.componentInstance.severitySelectPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LIST.SEVERITY_DIALOG.SEVERITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangeSeverity.subscribe((selectedseverityId) => {
        // prepare object to send to backend to save
        let obj = {
          entityId: caseItem != null ? caseItem.id : event.card.id,
          severity: selectedseverityId,
          entityWorkflowId: this.entityWorkflowId
        };

        this._commonHelper.showLoader();
        this._casesService.updateCaseSeverity(obj).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            if (!this.dataSearch.isPageTabularView) {
              // refresh current stage
              this.getEntityStageData(caseStageId, false);
            } else {
              this.dataSearch.params.pageNo = 1;
              this.caseList = [];
              this.getCases();
            }
          }
          // success message
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASE_SEVERITY')
          );
        },
          (error) => {
            this.handlePausedOrDeleteCaseError(error, caseStageId);
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
  onEntityStageClick(caseItem) {
    // check logged in user have permission to view user details
    if (!this.isEditCase || !this.isViewCase || caseItem.isPaused) {
      return;
    }

    if ((caseItem != null && (caseItem.isClosedStage || caseItem.isCompletedStage))
    ) {
      let stageName = '';
      if (caseItem != null) {
        stageName = caseItem.stageName;
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_CASES', { stageName: stageName }));
        return;
      }
    }

    //check can user change stage
    const currentStageDetail = this.caseListByStages.find(s => s.id == caseItem.dropCaseStageId);
    const canUserChangeStage: boolean = this.canUserChangeStage(currentStageDetail, caseItem);

    if (!canUserChangeStage) {
      if (this.changeCaseStage) {
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterEntityStageClick(caseItem);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
      }
    }
    else {
      this.afterEntityStageClick(caseItem);
    }
  }

  private afterEntityStageClick(caseItem) {
    this._commonHelper.showLoader();
    // get data from event
    let caseId = caseItem.id;
    let caseStageId = caseItem.stageID;
    let assignedTo = caseItem.assignedTo;

    // prepare params
    var params = this.prepareParamsForEntityStages();

    let entityStageDialogTitle: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('CASES.LIST.ENTITY_STAGE_DIALOG.DIALOG_TITLE_STATUS') : this._commonHelper.getInstanceTranlationData('CASES.LIST.ENTITY_STAGE_DIALOG.DIALOG_TITLE');
    let entityStageDialogFieldLabel: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('CASES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_LABEL') : this._commonHelper.getInstanceTranlationData('CASES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_LABEL');
    let entityStageDialogFieldPlaceholder: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('CASES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_PLACEHOLDER') : this._commonHelper.getInstanceTranlationData('CASES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_PLACEHOLDER');

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
        this.modalRef.componentInstance.entityStageId = caseStageId;
        this.modalRef.componentInstance.dialogTitle = entityStageDialogTitle;
        this.modalRef.componentInstance.entityStageSelectLabel = entityStageDialogFieldLabel;
        this.modalRef.componentInstance.entityStageChangeSelectReasonLabel = this._commonHelper.getInstanceTranlationData('CASES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_REASON_LABEL');
        this.modalRef.componentInstance.entityStageSelectPlaceholder = entityStageDialogFieldPlaceholder;
        this.modalRef.componentInstance.entityStageChangeReasonLabel = this._commonHelper.getInstanceTranlationData('CASES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_LABEL');
        this.modalRef.componentInstance.entityStageChangeReasonPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_PLACEHOLDER');
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
          if (selectedEntityStageId != undefined && selectedEntityStageId != null && selectedEntityStageId != caseStageId) {

            const selectedEntityStageDetail = this.caseListByStages.find(s => s.id == selectedEntityStageId);
            const prevEntityStageDetail = this.caseListByStages.find(s => s.id == caseStageId);

            let stagename = selectedEntityStageDetail.name;

            let isAllTasksRequired = prevEntityStageDetail?.isAllTasksRequired;

            let moveEntityParams = {
              caseId: caseId,
              entityTypeId: this.entityTypeId,
              entityWorkflowId: this.entityWorkflowId,
              caseStageId: caseStageId,
              selectedEntityStageId: selectedEntityStageId,
              stagename: stagename,
              assignedTo: assignedTo,
              selectedEntityStageChangeReason: selectedEntityStageChangeReason,
              stageChangeReasonDescription: stageChangeReasonDescription,
              verifiedBy: caseItem.verifiedBy,
              isCompletedStage: caseItem.isCompletedStage,
              isClosedStage: caseItem.isClosedStage,
              stageName: caseItem.stageName
            }

            // if any one of the current stage task is required
            let anyTasksIsRequired: boolean = false;
            let requiredTasks: any[] = [];
            // find out the current stage
            let currentStage = this.caseListByStages.find(x => x.id == caseStageId);
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
                * Call API to validate case has completed the stage tasks (which are required) before moving on to other stage.
                * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (caseId)
                * */
              let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
              this._commonHelper.showLoader();
              this._workflowmanagementService.isEntityStageTasksCompleted(caseId, this.entityTypeId, caseStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
                this._commonHelper.hideLoader();
                if (response === true) {
                  this.checkHandRaisedFromList(moveEntityParams, this.modalRef);
                } else {
                  //Stage Tasks are not completed..
                  this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_BEFORE_MOVE_CASE_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
                  return false;
                }
              }, (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
            }
            else if (isAllTasksRequired) {
              /**
               * Call API to validate case has completed all the stage tasks before moving on to other stage.
               * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (caseId)
               * */
              this._commonHelper.showLoader();
              this._workflowmanagementService.isEntityStageTasksCompleted(caseId, this.entityTypeId, caseStageId, this.entityWorkflowId, null).then((response: any) => {
                this._commonHelper.hideLoader();
                if (response === true) {
                  this.checkHandRaisedFromList(moveEntityParams, this.modalRef);
                } else {
                  //Stage Tasks are not completed..
                  this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_BEFORE_MOVE_CASE_STAGE_TASK_SHOULD_BE_COMPLETED'));
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

    const caseId = moveEntityParams.caseId;
    const caseStageId = moveEntityParams.caseStageId;
    const entityTypeId = moveEntityParams.entityTypeId;
    const entityWorkflowId = moveEntityParams.entityWorkflowId;

    this._commonHelper.showLoader();

    this._workflowmanagementService.isEntityStageRaiseHandTransitionExist(caseId, entityTypeId, entityWorkflowId, caseStageId).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response === true) {
        //Hand Raised - Not allow to move the stage
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_BEFORE_MOVE_CASE_FOR_RAISED_HAND_TASK'));
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
    let caseId = moveEntityParams.caseId,
      caseStageId = moveEntityParams.caseStageId,
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
      note.entityId = caseId;
      note.entityRecordTypeID = null;
      note.subject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: stagename }))}`;
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
          this.saveCaseStage(caseId, caseStageId, selectedEntityStageId, stagename, assignedTo, moveEntityParams.verifiedBy, isCompletedStage, isClosedStage, stageName)
        ]).then(() => {
          const param = {
            entityTypeId: this.entityTypeId,
            entityId: caseId,
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
      const selectedEntityStageDetail = this.caseListByStages.find(s => s.id == selectedEntityStageId);
      let stagename = selectedEntityStageDetail.name;
      Promise.all([
        this.saveCaseStage(caseId, caseStageId, selectedEntityStageId, stagename, assignedTo, moveEntityParams.verifiedBy, isCompletedStage, isClosedStage, stageName)
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
      this.caseList = [];
      // prepare stages
      this.prepareStages();
    } else {
      this.dataSearch.params.pageNo = 1;
      this.caseList = [];
      this.getCases();
    }
  }

  /* multi-select */
  isAllSelected() {
    const selectedWorkListCount = this.caseList.filter(x => x.isSelected).length;
    if (this.caseList.length == selectedWorkListCount) {
      this.isAllCheckBoxSelected = true;
    } else {
      this.isAllCheckBoxSelected = false;
    }
  }

  checkUncheckAll() {
    this.caseList.forEach(caseItem => {
      if (!caseItem.isPaused && !caseItem.isClosedStage && !caseItem.isCompletedStage) {
        caseItem.isSelected = this.isAllCheckBoxSelected;
      }
    });
  }

  // assign bulk cases to user
  assignSelectedCasesToUser() {

    if (this.caseList.filter(f => f.isSelected).length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LIST.MEESAGE_SELECT_ONE_USER'));
      return;
    }

    const distinctStages = [...new Set(this.caseList.filter(f => f.isSelected).map(item => item.stageID))];

    if (distinctStages.length > 1) {
      this.showLayout == LayoutTypes.ListView ? this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_SELECT_SAME_STATUS')) :
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_SELECT_SAME_STAGE'));
      return;
    }

    const params = this.prepareParamsForAssignedToUsers(distinctStages[0], '');
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CASEASSIGNEDTO, params).then((response: any) => {
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CASES.LIST.ASSIGNED_TO_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('CASES.LIST.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LIST.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.closed.subscribe(() => {
        this.isBulkAssignedDialogOpen = false;
      });

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // get selected
        const selectedCases = [...new Set(this.caseList.filter(f => f.isSelected).map(item => item.id))];
        // prepare comma separated string using selected cases
        let strSelectedCaseIds = selectedCases.toString();
        // prepare object to send to backend to save
        let obj = {
          selectedCaseIds: strSelectedCaseIds,
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: distinctStages[0]
        };

        this._commonHelper.showLoader();
        this._casesService.updateCaseAssignedToUsers(obj).then((response: any) => {
          //reload
          this.refreshData();
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASE_BULKASSIGNEDTO'));
          this._commonHelper.hideLoader();
          this.modalRef.close();
          this.isBulkAssignedDialogOpen = false;
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            this.modalRef.close();
            this.isBulkAssignedDialogOpen = false;
            if (error != null && (String(error.messageCode).toLowerCase() === 'cases.noactivecasefound' ||
              String(error.messageCode).toLowerCase() === 'cases.norunningcasefound')) {
              this.refreshData();
            }
          });
      });
    });
  }

  exportExcel() {
    this.exportCases(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  private exportCases(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();
    this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null;

    this.dataSearch.params.createdFromDate = this.dataSearch.params.createdFromDate != null ? moment(this.dataSearch.params.createdFromDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.createdToDate = this.dataSearch.params.createdToDate != null ? moment(this.dataSearch.params.createdToDate).format('YYYY-MM-DD') : null;

    let excelExportPayload = this._commonHelper.cloningObject(this.dataSearch.params);
    excelExportPayload.exportType = exportType; 
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting): "";

    let fileName = this._commonHelper.getConfiguredEntityName('{{Cases_plural_p}}') + `_${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;

    if (!this.dataSearch.isPageTabularView) {
      excelExportPayload.stageIds = null;
    }

    this._casesService.exportCases(excelExportPayload).then((base64String: any) => {
      this._commonHelper.hideLoader();
      if (base64String && base64String != '') {
        this._commonHelper.downloadFile(`${fileName}${fileExtension}`, fileMimeType, base64String);
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_NO_DATA_EXPORT'));
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


  openCaseImport() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CaseImportDialogComponent, this.optionsForPopupDialog);
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
  addCase() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CaseAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.relatedEntityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.recordTypesDetail;
    this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.AddPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Cases;
    this.modalRef.componentInstance.isShowAddButton = true;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.refreshData();
      }
    });
  }

  //navigate to edit page
  editCase(caseId) {
    this._router.navigate(['/cases/details/' + this.entityWorkflowId + "/" + caseId]);
  }

  //delete case - confirmation dialog
  deleteCase(caseId) {
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
        let optionsForConfirmDialog = {
          size: "md",
          centered: false,
          backdrop: 'static',
          keyboard: false
        };

        this._confirmationDialogService.confirm('CASES.LIST.MESSAGE_CONFIRM_CASE_DELETE', null, null, optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._casesService.deleteCase(caseId).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASE_DELETE')
                );
                this.totalRecords = this.totalRecords - 1;
                this.dataSearch.params.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.dataSearch.params.pageSize) : 1;
                this.refreshData();
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                  this.refreshData();
                });
            }
          })
          .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LIST.CASE_DISMISS_DIALOG')));
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
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CASES.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }

  paginate(event) {
    this.dataSearch.params.pageNo = (event.first / event.rows) + 1;
    this.dataSearch.params.pageSize = event.rows;
    this.getCases();
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
      this.getCases();
    }
  }

  changePage() {
    if (this.dataSearch.params.pageNo <= this.totalPages && this.dataSearch.params.pageNo > 0) {
      this.dataSearch.params.pageNo = this.dataSearch.params.pageNo > 0 ? this.dataSearch.params.pageNo : 1;
      this.getCases();
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
    this.getCases();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to previous page
  prev() {
    this.dataSearch.params.pageNo = this.dataSearch.params.pageNo - 1 > 0 ? this.dataSearch.params.pageNo - 1 : 1;
    if (this.end == this.dataSearch.params.pageSize) {
      return false;
    }
    this.getCases();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to next page
  next() {
    this.dataSearch.params.pageNo = (this.dataSearch.params.pageNo + 1) <= this.totalPages ? this.dataSearch.params.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getCases();
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
      this.selectedCaseIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
    }
    // get set quickview local storage config end
  }

  onCaseRaiseHandChanged(event: any,isHandRaised: boolean ) {
    if (!this.isEditCase || !this.isViewCase || (event != null && event.isPaused)) {
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
           let updateEntityRaiseHandStatusForList = this.caseList.find(x=>x.id == event.id);
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
          this.handlePausedOrDeleteCaseError(error, event.stageID);
        });
    } else {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.RAISEHAND_CASEASSIGNUSERMISMATCH'))
    }
  }

  // get tenant setting for tab layout
  private getTabLayoutTenantSetting() {
    const caseStageTaskChange = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.ALLOW_TASK_COMPLETE}`));
    if (caseStageTaskChange == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.ALLOW_TASK_COMPLETE).then((response: any) => {
          if (response) {
            this.caseStageTaskChange = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.ALLOW_TASK_COMPLETE}`, JSON.stringify(this.caseStageTaskChange));
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
      this.caseStageTaskChange = caseStageTaskChange;
    }
  }

  private handlePausedOrDeleteCaseError(error: any, caseStageId: number) {
    if (error != null && (String(error.messageCode).toLowerCase() === 'cases.pausedordeleteerror' || String(error.messageCode).toLowerCase() === 'entitystage.pausedordeleteerror')
      || String(error.messageCode).toLowerCase() === 'cases.closedorcompleted') {
      if (!this.dataSearch.isPageTabularView) {
        // refresh current stage
        this.getEntityStageData(caseStageId, false);
        if (String(error.messageCode).toLowerCase() === 'cases.closedorcompleted') {
          const closedCompletedStages = this.caseListByStages.filter(x => x.isClosed || x.isCompleted);
          if (closedCompletedStages) {
            closedCompletedStages.forEach(x => {
              this.getEntityStageData(x.id, false);
            });
          }
        }
      } else {
        this.dataSearch.params.pageNo = 1;
        this.caseList = [];
        this.getCases();
      }
    }
  }

  // Set card/row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Cases_Workflow_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get card/row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Cases_Workflow_SelectedItem);
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

    this._casesService.updateCaseField(params).then((response) => {
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
            this.recordTypesDetail = response?.filter(x => x.entityTypeID == Entity.Cases && (x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == Entity.Products || x.parentEntityTypeID == null)).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }));
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Cases).map(x => ({ 'label': x.name, 'value': x.id }));
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
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
        this.recordTypesDetail = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases && (x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == Entity.Products || x.parentEntityTypeID == null)).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }));
        this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases).map(x => ({ 'label': x.name, 'value': x.id }));
        this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
        resolve(this.recordTypes);
      }
    });
  }

  addWorkTask() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.entityDetails.id;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.worktaskRecordTypes.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.worktaskWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Cases || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityWorkTaskPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Cases;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshWorkTaskTab = true;
      }
    });
  }

  private prepareParamsForWortaskWorkflows() {
    const params = [];
    let paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.WorkTasks
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
        const params = this.prepareParamsForWortaskWorkflows();
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
        this.priorityDetails = refTypePriority as ReferenceType[];;
        this.priorityDetails.forEach(element => {
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
        this.severityDetails = refTypeSeverity as ReferenceType[];;
        this.severityDetails.forEach(element => {
          element.strValue1 = JSON.parse(element.strValue1);
        });
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

  onReopenStage(cases) {
    if (!this.isAllowToReopen) {
      return;
    }
    if (cases.isCompletedStage || cases.isClosedStage) {
      //get default stage details
      const getDefaultStage: any = this.caseListByStages?.find(s => s.isDefault);
      var isShowStageChangeConfirmationBox: boolean = true;
      this.changeEntityStage(getDefaultStage, getDefaultStage.id, isShowStageChangeConfirmationBox, true, cases);
    }
  }

  changeEntityStage(toEntityStageDetail, toEntityStageId, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean, cases) {
    let noteSubjectName: any;
    if (!isReopenedStage) {
      noteSubjectName = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: toEntityStageDetail.name }))}`
    } else {
      noteSubjectName = this._commonHelper.getInstanceTranlationData('COMMON.STAGE_REOPEN_TEXT');
    }
    if (toEntityStageDetail.isNoteRequired || isReopenedStage) {
      isShowStageChangeConfirmationBox = false;
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = cases.id;
      this.modalRef.componentInstance.noteSubject = noteSubjectName;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = toEntityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;
      this.modalRef.result.then(response => {
        if (response != undefined) {
          const stageValueNoteParams = {
            entityTypeId: this.entityTypeId,
            entityId: cases.id,
            workflowId: this.entityWorkflowId,
            workflowStageId: toEntityStageId,
            stageNoteID: response.id,
            pauseNoteID: null,
            processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.StageNote
          };

          Promise.all([
            this.updateEntityStage(toEntityStageId, toEntityStageDetail, isShowStageChangeConfirmationBox, isReopenedStage, cases),
          ]).then(() => {
            Promise.all([
              this.saveEntityWorkflowStageValueNote(stageValueNoteParams)
            ]).then(() => {
              // get List
              this.getCases();
            });
          }).catch(() => {
            // get List
            this.getCases();
          });
        }
        else {
          this.selectedStage = this.currentStage;
        }
      });
    }
    else {
      Promise.all([
        this.updateEntityStage(toEntityStageId, toEntityStageDetail, isShowStageChangeConfirmationBox, isReopenedStage, cases),
      ]).then(() => {
        // get List
        this.getCases();
      }).catch(() => {
        // get List
        this.getCases();
      });
    }
  }

  // update workflow entity stage values
  updateEntityStage(toEntityStageId, toEntityStageDetail, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean, cases) {
    this.optionsForPopupDialog.size = 'md';
    return new Promise((resolve, reject) => {
      if (isShowStageChangeConfirmationBox) {
        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CASES.CHANGE_STAGE_CONFIRMATION'), null, null, this.optionsForPopupDialog).then((confirmed) => {
          if (confirmed) {
            return this.afterUpdateEntityStage(toEntityStageId, toEntityStageDetail, isReopenedStage, cases);
          }
        });
      }
      else {
        return this.afterUpdateEntityStage(toEntityStageId, toEntityStageDetail, isReopenedStage, cases);
      }
    });
  }

  afterUpdateEntityStage(toEntityStageId, toEntityStageDetail, isReopenedStage: boolean, cases) {
    return new Promise((resolve, reject) => {
      let assignedToForDto = cases.assignedTo;
      this._commonHelper.showLoader();
      let currentStageId = this.caseListByStages.find(x => x.id == cases.stageID)?.id;
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: cases?.entityRecordTypeId, entityId: cases.id, stageId: toEntityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedToForDto, verifiedBy: cases.verifiedBy, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.caseAssignedTo = response;
          if (assignedToForDto != this.caseAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._casesService.updateCaseAssignedToUsers({ entityId: cases.id, assignedToId: this.caseAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.caseAssignedTo.isForcedAssignment }).then((response: any) => {
              if (response) {
                assignedToForDto = this.caseAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASES_MOVETO_STAGE',
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
                this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASES_STAGE_REOPEN', {
                  entityName: cases?.name !== null ? cases?.name : " "
                })
              )
            } else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('CASES.LIST.MESSAGE_CASES_MOVETO_STAGE',
                  { stageName: toEntityStageDetail.name })
              );
            }

          }
        }
        // get List
        this.getCases();
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
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);
        this.refreshData();
      });
  }
  
}
