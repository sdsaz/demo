//ANGULAR
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { ActivityTimespan, DataSources, DownloadFileMimeType, Entity, ExportType, FileExtension, KanbanBoardTokenTypes, LayoutTypes, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, ReferenceType, RefType, SectionCodes, UserTypeID } from '../../../@core/enum';
import { KanbanStage, KanbanStageCard, KanbanStageTaskEvent } from '../../../@core/sharedModels/kanban-board.model';
import { IdValuePair } from '../../../@core/sharedModels/pair.model';
import { Note } from '../../../@core/sharedComponents/notes/note.model';
//COMPONENTS
import { EntityStagesDialogComponent } from '../../../@core/sharedComponents/entity-stages/entity-stages-dialog/entity-stages-dialog.component';
import { PriorityDialogComponent } from '../../../@core/sharedComponents/priority-dialog/priority-dialog.component';
import { SeverityDialogComponent } from '../../../@core/sharedComponents/severity-dialog/severity-dialog.component';
import { DueDateDialogComponent } from '../../../@core/sharedComponents/due-date-dialog/due-date-dialog.component';
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { StagesComponent } from '../../../@core/sharedComponents/kanban-board/stages/stages.component';
import { OpportunityAddComponent } from '../opportunity-add/opportunity-add.component';
import { OpportunityImportDialogComponent } from '../opportunity-import-dialog/opportunity-import-dialog.component';
import { ActivitySectionComponent } from '../../../@core/sharedComponents/common-activity-section/activity-section/activity-section.component';
//SERVICES
import { OpportunitiesService } from '../opportunities.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { UserAssignDialogComponent } from '../../../@core/sharedComponents/user-assign/user-assign-dialog/user-assign-dialog.component';
import { EntitytagsService } from '../../entitytags/entitytags.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { SettingsService } from '../../settings/settings.service';
import { NoteService } from '../../../@core/sharedComponents/notes/notes.service';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';
//OTHER
import { Table } from 'primeng/table';
import { debounceTime, filter, fromEvent, interval, map, Subscription } from 'rxjs';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import * as moment from 'moment';
import { WorktaskAddComponent } from '../../worktasks/worktask-add/worktask-add.component';


@Component({
  selector: 'ngx-opportunity-list',
  templateUrl: './opportunity-list.component.html',
  styleUrls: ['./opportunity-list.component.scss']
})
export class OpportunityListComponent implements OnInit {

  @ViewChild('searchTextInput', { static: false }) searchTextInput: ElementRef;
  @ViewChild('dt') private dt: Table;
  @ViewChild('kanbanStage') kanbanStage: StagesComponent;
  @ViewChild('activitySection') activitySection: ActivitySectionComponent;

  private updateSubscription: Subscription;

  pageTitle = 'OPPORTUNITIES.LIST.TITLE';
  workflowName = '';

  entityTypeId: number = Entity.Opportunities;
  entityWorkflowId: number = 0;
  entityRecordTypeId: number;
  relatedEntityTypeId: number = 0;
  relatedEntityRecordTypeId: number = 0;
  ownerEntityTypeId: number = 0;

  //Export Opportunity
  dynamicColumnNameSetting: any = {};
  AccountColumnName:string;

  opportunitiesList: any[] = [];
  opportunitiesListByStages: any[] = [];
  opportunitiesAssignedTo: any;
  owner: any;
  users: any = null; //assignable users
  filterUsers: any = null;
  filterOwners: any = null;
  filterAccounts:any = null;
  relatedToEntityTypes: any = null; //related to entity records
  relatedTo: any = null; //related to entity records
  accounts:any=null;
  priority: any = null;
  severity: any = null;
  filterStage: any = null;
  workflows: any = null;
  priorityDetails: any = null;
  severityDetails: any = null;
  ratingOptions: any[] = [];
  rating: number = null;

  //permissions
  isListOpportunities: boolean = false;
  isViewOpportunities: boolean = false;
  isViewAccounts: boolean = false;
  isAddOpportunities: boolean = false;
  isEditOpportunities: boolean = false;
  isDeleteOpportunities: boolean = false;
  isImportOpportunities: boolean = false;
  isExportOpportunities: boolean = false;
  isBulkAssignOpportunities: boolean = false;
  isAssignOpportunities: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAddWorkTask: boolean = false;
  isAllowToReopen: boolean = false;

  customFilterConfig: any[] = [
  ];

  isFilterVisible: boolean = false;
  filterCount:number = 0;
  cols: any[];
  tableData: any[];

  //status filter for listview.
  showLayout: any;
  StatusFilterLabel: any;
  StatusFilterPlaceholder: any;
  StatusColumnName: string;

  CodeColumnName: string;
  opportunityCreatedBy: number;

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
      "accountIDs": "",
      "entityWorkflowId": this.entityWorkflowId,
      "entityTimespan": "LAST7DAYS",
      "priorityIDs": "",
      "severityIDs": "",
      "dueStartDate": null,
      "dueEndDate": null,
      "createdFromDate": null,
      "createdToDate": null,
      "ownerIDs": "",
      "showMyOpportunities": true,
      "stageIDs": "",
      "rating": this.rating,
      "entityRecordTypeIDs": "",
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
      "accountIDs": "",
      "entityIDs": "",
      "entityTimespan": "LAST7DAYS",
      "priorityIDs": "",
      "severityIDs": "",
      "dueStartDate": null,
      "dueEndDate": null,
      "createdFromDate": null,
      "createdToDate": null,
      "ownerIDs": "",
      "showMyOpportunities": true,
      "stageIDs": "",
      "rating": this.rating,
      "entityRecordTypeIDs": "",
      "showStarred": false
    }
  }

  //paginator
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;

  modalRef: NgbModalRef | null;
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  observableStageTasksList: any[] = [];

  // dynamic kanban
  isInitialLoading: boolean = true;
  isfilterLoaded = false;
  stages: Array<KanbanStage> = [];
  owner1List: Array<IdValuePair> = [];
  ownerList: Array<IdValuePair> = [];

  //right side activity menu
  isShowActivityCenter: boolean = false;
  refreshActivityCenter: boolean = false;

  //isShowRelatedTo: boolean = false;
  isShowAssignTo: boolean = true;
  changeOpportunitiesStage: boolean = false;

  selectedOpportunityForActivityCenter: any
  selectedOpportunityIsClosedForActivityCenter: boolean = false;
  selectedOpportunityIsCompletedForActivityCenter: boolean = false;

  selectedOpportunityIdForActivityCenter: number = 0;
  selectedContactIsActive: boolean = true;
  selectedRowId: number = 0;
  selectedCardExists: boolean = false;
  entityDetails: any;

  isShowActionColumn: boolean = false;
  relatedToEntityColumnName: string;
  currentStage: any;
  selectedStage: any;
  opportunityAssignedTo: any;

  //other
  _loggedInUser: any;
  localStorageKeyPrefix: string = '';
  currencySymbol: any = null;
  hoursInDay: number = null;

  //tenant setting
  opportunitiesStageTaskChange: any = "no";
  entityStagesWithTasksStorageKey: string = LocalStorageKey.OpportunityEntityStageWithTasksKey;
  keyfieldResponseData: any;
  isAllCheckBoxSelected: boolean;
  quickViewConfig: any;

  rowActionButtonMouseHoverFlag: boolean = false;

  //WorkflowLayout based on layoutTypeID
  showBothKanbanAndListView: boolean = false;

  //Record Type Filter
  recordTypes: any;
  recordTypesDetail: any;
  isRecordTypesFilterVisible: boolean;
  entityRecordType: any[];
  relatedToIconToolTip: string;

  // add worktask 
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  refreshWorkTaskTab;

  entityHiddenFieldSettings: any;
  entitySubTypes: any = [];
  workTaskSubTypeDetails: any;
  userTypeID = UserTypeID;

  isStageClosedOrCompleted: number;

  constructor(private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _opportunitiesService: OpportunitiesService,
    private _dataSourceService: DatasourceService,
    private _entitytagsService: EntitytagsService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _noteService: NoteService,
    private _settingsService: SettingsService,
    private _fileSignedUrlService: FileSignedUrlService) {
    //re use route
    this._router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };

    //initiate Permissions
    this.isAddOpportunities = this._commonHelper.havePermission(enumPermissions.AddOpportunity);
    this.isAssignOpportunities = this._commonHelper.havePermission(enumPermissions.AssignOpportunity);
    this.isBulkAssignOpportunities = this._commonHelper.havePermission(enumPermissions.BulkAssignOpportunity);
    this.isDeleteOpportunities = this._commonHelper.havePermission(enumPermissions.DeleteOpportunity);
    this.isEditOpportunities = this._commonHelper.havePermission(enumPermissions.EditOpportunity);
    this.isExportOpportunities = this._commonHelper.havePermission(enumPermissions.ExportOpportunities);
    this.isImportOpportunities = this._commonHelper.havePermission(enumPermissions.ImportOpportunities);
    this.isListOpportunities = this._commonHelper.havePermission(enumPermissions.ListOpportunities);
    this.isViewOpportunities = this._commonHelper.havePermission(enumPermissions.ViewOpportunity);
    this.isViewAccounts = this._commonHelper.havePermission(enumPermissions.ViewAccount);
    this.changeOpportunitiesStage = this._commonHelper.havePermission(enumPermissions.ChangeOpportunityStage);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadOpportunityDocument);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);

    this.isShowActionColumn = (this.isViewOpportunities && this.isEditOpportunities) || (this.isViewOpportunities && this.isDeleteOpportunities);

    //if list page record type wise
    this._activeRoute.params.subscribe(param => {
      if (param && param['wf']) {
        this.entityWorkflowId = param['wf'];
        this.dataSearch.isPageTabularView = false;
      }
    });

    //table layout fields set
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'code', header: 'OPPORTUNITIES.LIST.TABLE_HEADER_CODE', visible: true, sort: true },
      { field: 'name', header: 'OPPORTUNITIES.LIST.TABLE_HEADER_NAME', visible: true, sort: true },
      //{ field: 'entityName', header: 'OPPORTUNITIES.LIST.TABLE_HEADER_RELATED_TO', visible: true, sort: true },
      { field: 'accountName', header: 'OPPORTUNITIES.LIST.TABLE_HEADER_ACCOUNT', visible: true, sort: true },
      { field: 'totalAmount', header: 'OPPORTUNITIES.LIST.TABLE_HEADER_TOTAL_AMOUNT', visible: true, sort: true, class: "text-right pr-5" },
      { field: 'stageName', header: 'OPPORTUNITIES.LIST.TABLE_HEADER_STAGE_NAME', visible: true, sort: true },
      { field: 'assignedToName', header: 'OPPORTUNITIES.LIST.TABLE_HEADER_ASSIGNEDTO', visible: true, sort: true },
      { field: 'ownerName', header: 'OPPORTUNITIES.LIST.TABLE_HEADER_OWNER', visible: true, sort: true },
      { field: 'created', header: 'OPPORTUNITIES.LIST.TABLE_HEADER_CREATED', visible: true, sort: true },
      { field: 'id', header: '', visible: true, sort: false, class: "action ", display: 'td-display' }
    ];

    // set storage key
    this.entityStagesWithTasksStorageKey = this.entityStagesWithTasksStorageKey + "_" + this.entityTypeId + (this.entityWorkflowId ? ("_" + this.entityWorkflowId) : '');
  }

  ngOnInit(): void {
    // get logged in user information
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    //Set Local Storage Prefix
    this.localStorageKeyPrefix = `${this._loggedInUser.tenantId}_${this._loggedInUser.userId}_${this.entityWorkflowId}`;

    //get local storage for search
    let localPageLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_OpportunityListKey, this.localStorageKeyPrefix));
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
    this.dataSearch.params.createdFromDate = this.dataSearch.params.createdFromDate != null && this.dataSearch.params.createdFromDate != '' ? moment(new Date(this.dataSearch.params.createdFromDate)).toDate() : null;
    this.dataSearch.params.createdToDate = this.dataSearch.params.createdToDate != null && this.dataSearch.params.createdToDate != '' ? moment(new Date(this.dataSearch.params.createdToDate)).toDate() : null;
    this.dataSearch.paramsByStage.createdFromDate = this.dataSearch.paramsByStage.createdFromDate != null && this.dataSearch.paramsByStage.createdFromDate != '' ? moment(new Date(this.dataSearch.paramsByStage.createdFromDate)).toDate() : null;
    this.dataSearch.paramsByStage.createdToDate = this.dataSearch.paramsByStage.createdToDate != null && this.dataSearch.paramsByStage.createdToDate != '' ? moment(new Date(this.dataSearch.paramsByStage.createdToDate)).toDate() : null;


    // DD 20220425: SDC-426: Entity workflow have the parent entity type related information so removing dynamic dropdown
    // get workflow details
    Promise.all([
      this.getWorkflowDetail(),
      this.getEntityStagesWithTask(),
      this.getCurrencySymbol(),
      this.getHoursInDay(),
      this.getEntityRecordTypes(),
      this.getWorkflowList(),
      this.getWorktaskWorkflowList(),
      this.getPriorityFromReferenceType(),
      this.getSeverityFromReferenceType(),
      this.getEntityHiddenField(),
      this.getEntitySubTypes()
    ]).then((results: any) => {
      if (results) {
        var workflow = results[0];
        this.workflowName = workflow.name;
        this.entityRecordTypeId = workflow.entityRecordTypeId;
        this.relatedEntityTypeId = workflow.parentEntityTypeId;
        this.relatedEntityRecordTypeId = workflow.parentEntityRecordTypeId;

        let StageColumn = this.cols.find(c => c.field == 'stageName');
        this.workTaskSubTypeDetails = this.entitySubTypes?.find(x => x.level == 1);
        this.CodeColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.EXPORT_CODE_LABEL'));

        if (workflow.layoutTypeID == LayoutTypes.ListView) {
          this.dataSearch.isPageTabularView = true;
          StageColumn.header = 'OPPORTUNITIES.LIST.TABLE_HEADER_STATUS_NAME';
          this.StatusColumnName = (this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.EXPORT_STATUS_LABEL'));
        } else if (workflow.layoutTypeID == LayoutTypes.KanbanView) {
          this.dataSearch.isPageTabularView = false;
        } else if (workflow.layoutTypeID == LayoutTypes.KanbanAndListView) {
          this.showBothKanbanAndListView = true;
        }

        // if (this.relatedEntityTypeId != null) {
        //   this.isShowRelatedTo = true;
        // }
        // else {
        //   this.isShowRelatedTo = false;
        // }
        this.getHeaderFilters();
        //get tenant setting
        this.getTabLayoutTenantSetting();
        //set related to column show/hide dynamically
        let entityNameColumn = this.cols.find(c => c.field == 'entityName');
       // entityNameColumn.visible = this.isShowRelatedTo;

        //Header of related to 
        // const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.relatedEntityTypeId);
        // if (foundRecord) {
        //   this.relatedToEntityColumnName = foundRecord?.['displayName'].toString().trim();
        //   entityNameColumn.header = this.relatedToEntityColumnName;
        // }
        this.AccountColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.TABLE_HEADER_ACCOUNT'));

        this.dynamicColumnNameSetting = {};
        this.dynamicColumnNameSetting["EntityName"] = this.relatedToEntityColumnName;
        this.dynamicColumnNameSetting["StageName"] = this.StatusColumnName;
        this.dynamicColumnNameSetting["Code"] = this.CodeColumnName;
        this.dynamicColumnNameSetting["AccountName"] = this.AccountColumnName;

        this.subscribeSearchboxEvent();
        //Auto Refresh data
        if (workflow.refreshMins != null && workflow.refreshMins > 0) {
          this.updateSubscription = interval(workflow.refreshMins * 60000).subscribe((val) => this.refreshData());
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
      this.selectedOpportunityIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
    }
    // get set quickview local storage config end
  }

  ngOnDestroy(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  //#region public methods
  multiSelectFilterEvent(event) {
    if (event && event.controlName == 'entityIDs') {
      this.getRelatedTo(event.selectedIds, 0, event.filter).then(results => {
        this.relatedTo = results;
        this.customFilterConfig[3].options = this.relatedTo;
      });
    }
    if (event && event.controlName == 'assignedToIDs') {
      this.getAssigedToUsers(event.selectedIds, 0, event.filter).then(results => {
        this.filterUsers = results;
        this.filterUsers.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_OPTION_TEXT_ASSIGNEDTO') });
        this.filterUsers.sort((a, b) => a.value - b.value);
        this.customFilterConfig[10].options = this.filterUsers;
      });
    }
    if (event && event.controlName == 'ownerIDs') {
      this.getOwnerUsers(event.selectedIds, 0, event.filter).then(results => {
        this.filterOwners = results;
        this.filterOwners.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_OPTION_TEXT_OWNER') });
        this.filterOwners.sort((a, b) => a.value - b.value);
        this.customFilterConfig[2].options = this.filterOwners;
      });
    }
    if (event && event.controlName == 'accountIDs') {
      this.getAccounts(event.selectedIds, 0, event.filter).then(results => {
        this.filterAccounts = results;
        this.filterAccounts.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_OPTION_TEXT_ACCOUNT') });
        this.filterAccounts.sort((a, b) => a.value - b.value);
        this.customFilterConfig[4].options = this.filterAccounts;
      });
    }
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

    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OpportunityListKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);

    if (this.dataSearch.isPageTabularView) {
      this.getOpportunitiesList();
    }
    else {
      this.stages = [];
      this.opportunitiesList = [];
      this.prepareStages();
    }

    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedOpportunityIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  //get entity stage wise data
  getEntityStageData(stageId, isAppend) {
    // get current stage index
    let index: number = this.stages.findIndex(el => el.id == stageId);
    // get cards for this stage only
    this.opportunitiesList = this.opportunitiesList.filter((item) => item.stageId !== stageId);
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
      // reset
      this.dataSearch.paramsByStage.pageNo = 1;
      this.stages = [];
      this.opportunitiesList = [];
      // prepare stages
      this.prepareStages();
      this.dataSearch.isPageTabularView = false;
    } else {
      this.dataSearch.isPageTabularView = true;
      this.dataSearch.params.pageNo = 1;

      this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null
      this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null

      this.dataSearch.params.createdFromDate = this.dataSearch.params.createdFromDate != null ? moment(this.dataSearch.params.createdFromDate).format('YYYY-MM-DD') : null
      this.dataSearch.params.createdToDate = this.dataSearch.params.createdToDate != null ? moment(this.dataSearch.params.createdToDate).format('YYYY-MM-DD') : null
      this.opportunitiesList = [];
      this.getOpportunitiesList();
    }

    //set hidden for stage filter
    let stageFilter = this.customFilterConfig.find(x => x.name === 'stageIDs');
    if (stageFilter) {
      stageFilter['isHidden'] = pageLayout === 'CARD';
    }

    this.resetSelectedEntity();

    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OpportunityListKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);

    //set quickview config
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedOpportunityIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  onDropSuccess(event: CdkDragDrop<{}[]>) {
    //check can user change stage
    if (!event.item.data.canUserChangeStage) {
      if (this.changeOpportunitiesStage) {
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterDropSuccess(event);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
      }
    }
    else {
      this.afterDropSuccess(event);
    }
  }

  // event emitted from kanban
  onRelatedToClick(opportunity) {
    // check logged in user have permission to view related entity details
    if (!this._commonHelper.isUserHaveViewPermissionOfRelatedEntity(opportunity.entityTypeId)) {
      return this._router.url;
    }

    // if not undefined then redirect
    if (opportunity.entityTypeName != undefined && opportunity.entityId != undefined) {
      return '/' + this._commonHelper.getRouteNameByEntityTypeId(opportunity.entityTypeId).toLowerCase() + '/details/' + opportunity.entityId;
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

  onRowClick(rowData: any, isShowActivityCenter: boolean = null) {

    if (this.rowActionButtonMouseHoverFlag) {
      return;
    }

    const taskIds: Array<number> = rowData.selectedStageTaskIDs ? rowData.selectedStageTaskIDs.split(",").map(m => Number(m)) : [];
    const stageTasks = this.opportunitiesListByStages?.find(x => x.id == rowData?.stageID)?.stageTasks;
    const settingsJson = JSON.parse(rowData.settingsJson);

    const obj = {
      id: rowData.id,
      entityIcon: 'fas fa-hand-holding-usd',
      entityName: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_NAME_LABEL'),
      label1: settingsJson.Token1Text,
      label1RedirectURL: settingsJson.Token1Url,
      label2: settingsJson.Token2Text,
      label2RedirectURL: settingsJson.Token2Url,
      label3: settingsJson.Token3Text,
      label3RedirectURL: settingsJson.Token3Url,
      //relatedToLabel: rowData?.entityName,
      entityTypeId: rowData?.entityTypeId,
      relatedToIconToolTip: this._commonHelper.entityTypeList.find(entityType => entityType['id'] == rowData?.entityTypeId)?.displayName.toString().trim(),
      entityRecordTypeId: rowData?.entityRecordTypeId,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      stagesTasks: stageTasks,
      selectedTasks: (stageTasks || []).filter(f => taskIds.includes(f.id)) || [],
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      createdBy: rowData?.createdBy,
      relatedToRedirectURL: this.onRelatedToClick(rowData),
      workTaskTypeName: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_WORKTASK_TAB.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
      workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
      isStarred: rowData?.isStarred
    };

    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id;
    this.opportunityCreatedBy = rowData?.createdBy;

    this.selectedOpportunityForActivityCenter = rowData;
    this.selectedOpportunityIdForActivityCenter = rowData.id;
    this.selectedOpportunityIsClosedForActivityCenter = rowData?.isClosedStage;
    this.selectedOpportunityIsCompletedForActivityCenter = rowData?.isCompletedStage;
    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedCardEntityId: this.selectedRowId,
      selectedRowEntityId: this.selectedRowId
    }

    if (isShowActivityCenter != null) {
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewOpportunities);
  }

  // event emitted from kanban
  onCardClick(opportunity, isShowActivityCenter: boolean = null) {
    this.opportunityCreatedBy = opportunity?.createdBy;
    opportunity.entityWorkflowId = this.entityWorkflowId;
    opportunity.relatedToIconToolTip = this._commonHelper.entityTypeList.find(entityType => entityType['id'] == opportunity?.entityTypeId)?.displayName.toString().trim();
    this.entityDetails = this._commonHelper.cloningObject(opportunity);
    this.selectedOpportunityForActivityCenter = opportunity;
    this.selectedOpportunityIdForActivityCenter = opportunity.id;
    this.selectedOpportunityIsClosedForActivityCenter = opportunity.isClosedStage;
    this.selectedOpportunityIsCompletedForActivityCenter = opportunity.isCompletedStage;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedCardEntityId: opportunity.id,
      selectedRowEntityId: opportunity.id
    };

    if (isShowActivityCenter != null) {
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewOpportunities);
  }


  onEntityStageTasksSelect(event) {
    if (!this.dataSearch.isPageTabularView) {
      const currentStage = this.stages?.find(s => s.id == event.stageId);
      const currentCard = currentStage?.cards?.find((k: any) => k.id == event.id)
      currentCard.selectedTasks = event?.selectedTasks;
    } else {
      const temp = this.opportunitiesList.find(x => x.id == event.id);
      temp.selectedStageTaskIDs = event.selectedTasks.map(x => x.id).toString();
    }

  }

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

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewOpportunities;
        this.selectedOpportunityIdForActivityCenter = details.id;
        this.selectedOpportunityForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedOpportunityIsClosedForActivityCenter = details.isClosedStage;
        this.selectedOpportunityIsCompletedForActivityCenter = details.isCompletedStage;
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
    this.selectedOpportunityForActivityCenter = null;
    this.selectedOpportunityIdForActivityCenter = 0;
    this.selectedOpportunityIsClosedForActivityCenter = null;
    this.selectedOpportunityIsCompletedForActivityCenter = null;
    this.selectedRowId = 0;
    if (this.kanbanStage) {
      this.kanbanStage.selectedCard = 0;
    }
  }

  // assigned to user what to do
  onAssignedToClick(event, opportunity = null) {
    if (!this.isAssignOpportunities) {
      return;
    }

    if ((opportunity != null && (opportunity.isClosedStage || opportunity.isCompletedStage))
      || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (opportunity != null) {
        stageName = opportunity.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }

    this._commonHelper.showLoader();
    // get data from event
    let assignedToId = opportunity != null ? opportunity.assignedTo : event.card.owner2Id; //owner 1 is assigned to
    let opportunityId = opportunity != null ? opportunity.id : event.card.id;
    let opportunityStageId = opportunity != null ? opportunity.stageID : event.card.stageId;
    const verifiedBy = null; //Verified By

    //DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    var params = this.prepareParamsForAssignedToUsers(opportunityStageId, assignedToId, 1, '');
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYASSIGNEDTO, params).then((response: any) => {
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ASSIGNED_TO_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        let obj = {
          entityid: opportunityId,
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: opportunityStageId
        };

        this._commonHelper.showLoader();
        this._opportunitiesService.updateOpportunityAssignedTo(obj).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response) {
            this.opportunitiesAssignedTo = response;
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: this.entityTypeId, entityId: opportunityId, entityWorkflowId: this.entityWorkflowId, stageId: opportunityStageId, assignedTo: selectedUserId, verifiedBy: verifiedBy }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_ASSIGNEDTO'));
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
            this.getEntityStageData(opportunityStageId, false);
          } else {
            this.dataSearch.params.pageNo = 1;
            this.opportunitiesList = [];
            this.getOpportunitiesList();
          }
          // close
          this.modalRef.close();
        }, (err) => {
          this.handleOpportunityChangesError(err, opportunityStageId);
          this._commonHelper.hideLoader();
          this.modalRef.close();
          if (err != null && String(err.messageCode).toLowerCase() === 'opportunities.closedorcompleted') {
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

  onOwnerClick(event, opportunity = null) {
    if (!this.isEditOpportunities || !this.isViewOpportunities) {
      return;
    }

    if ((opportunity != null && (opportunity.isClosedStage || opportunity.isCompletedStage))
      || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (opportunity != null) {
        stageName = opportunity.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }

    let ownerID = opportunity != null ? opportunity.ownerID : event.card.owner1Id;
    let opportunityStageId = opportunity != null ? opportunity.stageID : event.card.stageId;

    this._commonHelper.showLoader();
    var params = this.prepareParamsForAllUsers(ownerID, 1, '');
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYOWNERS, params).then((response: any) => {
      let ownerList = response;
      this._commonHelper.hideLoader();
      if (this._modalService.hasOpenModals()) {
        return;
      }

      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(UserAssignDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.users = ownerList;
      this.modalRef.componentInstance.assignedUserId = ownerID;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.OWNER_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.OWNER_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.OWNER_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedOwnerId) => {
        let obj = {
          entityId: opportunity != null ? opportunity.id : event.card.id,
          ownerID: selectedOwnerId,
          entityWorkflowId: this.entityWorkflowId
        };

        this._commonHelper.showLoader();
        this._opportunitiesService.updateOpportunityOwner(obj).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            if (!this.dataSearch.isPageTabularView) {
              // refresh current stage
              this.getEntityStageData(opportunityStageId, false);
            } else {
              this.dataSearch.params.pageNo = 1;
              this.opportunitiesList = [];
              this.getOpportunitiesList();
            }
          }
          // success message
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_OWNER')
          );
        },
          (error) => {
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

  onCardPriorityClick(event, opportunity = null) {
    if (!this.isEditOpportunities) {
      return;
    }

    if ((opportunity != null && (opportunity.isClosedStage || opportunity.isCompletedStage))
      || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (opportunity != null) {
        stageName = opportunity.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }

    // get data from event
    let priority = opportunity != null ? opportunity.priority : event.card.priority;
    let opportunityStageId = opportunity != null ? opportunity.stageID : event.card.stageId;

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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.PRIORITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.prioritySelectLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.PRIORITY_DIALOG.PRIORITY_SELECT_LABEL');
      this.modalRef.componentInstance.prioritySelectPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.PRIORITY_DIALOG.PRIORITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangePriority.subscribe((selectedPriorityId) => {
        // prepare object to send to backend to save
        let obj = {
          entityId: opportunity != null ? opportunity.id : event.card.id,
          priority: selectedPriorityId,
          EntityWorkflowId: this.entityWorkflowId
        };

        this._commonHelper.showLoader();
        this._opportunitiesService.updateOpportunityPriority(obj).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            if (!this.dataSearch.isPageTabularView) {
              // refresh current stage
              this.getEntityStageData(opportunityStageId, false);
            } else {
              this.dataSearch.params.pageNo = 1;
              this.opportunitiesList = [];
              this.getOpportunitiesList();
            }
          }
          // success message
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_PRIORITY')
          );
        },
          (error) => {
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

  onCardSeverityClick(event, opportunity = null) {
    if (!this.isEditOpportunities) {
      return;
    }

    if ((opportunity != null && (opportunity.isClosedStage || opportunity.isCompletedStage))
      || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (opportunity != null) {
        stageName = opportunity.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }

    // get data from event
    let severity = opportunity != null ? opportunity.severity : event.card.severity;
    let opportunityStageId = opportunity != null ? opportunity.stageID : event.card.stageId;
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.SEVERITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.severitySelectLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.SEVERITY_DIALOG.SEVERITY_SELECT_LABEL');
      this.modalRef.componentInstance.severitySelectPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.SEVERITY_DIALOG.SEVERITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangeSeverity.subscribe((selectedseverityId) => {
        // prepare object to send to backend to save
        let obj = {
          entityId: opportunity != null ? opportunity.id : event.card.id,
          severity: selectedseverityId,
          entityWorkflowId: this.entityWorkflowId
        };

        this._commonHelper.showLoader();
        this._opportunitiesService.updateOpportunitySeverity(obj).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            if (!this.dataSearch.isPageTabularView) {
              // refresh current stage
              this.getEntityStageData(opportunityStageId, false);
            } else {
              this.dataSearch.params.pageNo = 1;
              this.opportunitiesList = [];
              this.getOpportunitiesList();
            }
          }
          // success message
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_SEVERITY')
          );
        },
          (error) => {
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

  onEntityStageClick(opportunity) {
    // check logged in user have permission to view user details
    if (!this.isEditOpportunities || !this.isViewOpportunities) {
      return;
    }

    if ((opportunity != null && (opportunity.isClosedStage || opportunity.isCompletedStage))
    ) {
      let stageName = '';
      if (opportunity != null) {
        stageName = opportunity.stageName;
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
        return;
      }
    }

    //check can user change stage
    const currentStageDetail = this.opportunitiesListByStages.find(s => s.id == opportunity.stageID);
    const canUserChangeStage: boolean = this.canUserChangeStage(currentStageDetail, opportunity);

    if (!canUserChangeStage) {
      if (this.changeOpportunitiesStage) {
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterEntityStageClick(opportunity);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
      }
    }
    else {
      this.afterEntityStageClick(opportunity);
    }
  }


  // assign bulk tasks to user
  assignBulkUsersToOpportunities() {

    if (this.opportunitiesList.filter(f => f.isSelected).length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MEESAGE_SELECT_ONE_USER'));
      return;
    }

    const distinctStages = [...new Set(this.opportunitiesList.filter(f => f.isSelected).map(item => item.stageID))];

    if (distinctStages.length > 1) {
      this.showLayout == LayoutTypes.ListView ? this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_SELECT_SAME_STATUS')) :
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_SELECT_SAME_STAGE'));
      return;
    }

    this._commonHelper.showLoader();
    const params = this.prepareParamsForAssignedToUsers(distinctStages[0], '');

    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYASSIGNEDTO, params).then((response: any) => {
      const assignedToUsers = response;
      this._commonHelper.hideLoader();
      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(UserAssignDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.users = assignedToUsers;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ASSIGNED_TO_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // get selected
        const selectedOpportunity = [...new Set(this.opportunitiesList.filter(f => f.isSelected).map(item => item.id))];

        // prepare object to send to backend to save
        const obj = {
          selectedOpportunityIds: selectedOpportunity.toString(),
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: distinctStages[0]
        };

        this._commonHelper.showLoader();
        this._opportunitiesService.updateOpportunityAssignedToUsers(obj).then((response: any) => {
          //reload
          this.refreshData();
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_BULKASSIGNEDTO'));
          this._commonHelper.hideLoader();
          this.modalRef.close();
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            this.modalRef.close();
            if (error != null && String(error.messageCode).toLowerCase() === 'opportunities.opportunitydatamismatched') {
              this.refreshData();
            }
          });
      });
    });
  }

  exportExcel() {
    this.exportOpportunities(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  private exportOpportunities(exportType: string, fileExtension: string, fileMimeType: string) {
    this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null;

    this.dataSearch.params.createdFromDate = this.dataSearch.params.createdFromDate != null ? moment(this.dataSearch.params.createdFromDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.createdToDate = this.dataSearch.params.createdToDate != null ? moment(this.dataSearch.params.createdToDate).format('YYYY-MM-DD') : null;

    let payload = this._commonHelper.cloningObject(this.dataSearch.params);
    payload.exportType = exportType;
    payload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    let fileName = this._commonHelper.getConfiguredEntityName('{{Opportunities_plural_p}}') + `_${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;

    if (!this.dataSearch.isPageTabularView) {
      payload.stageIds = null;
    }

    this._commonHelper.showLoader();
    this._opportunitiesService.exportOpportunities(payload).then((base64String: any) => {
      this._commonHelper.hideLoader();
      if (base64String && base64String != '') {
        this._commonHelper.downloadFile(`${fileName}${fileExtension}`, fileMimeType, base64String);
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_NO_DATA_EXPORT'));
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  openOpportunityImport() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(OpportunityImportDialogComponent, this.optionsForPopupDialog);
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
  addOpportunity() {
    this.optionsForPopupDialog.size = "lg";
    this.modalRef = this._modalService.open(OpportunityAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.relatedEntityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.recordTypesDetail;
    this.modalRef.componentInstance.workflows = this.workflows?.filter(x => x.value != 0);
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.refreshData();
      }
    });
  }

  //delete opportunity - confirmation dialog
  deleteOpportunity(opporunityId) {
    //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('OPPORTUNITIES.LIST.MESSAGE_CONFIRM_OPPORTUNITY_DELETE', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._opportunitiesService.deleteOpportunity(opporunityId).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_DELETE')
            );
            this.refreshData();
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }
      })
      .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.OPPORTUNITY_DISMISS_DIALOG')));
  }

  paginate(event) {
    this.dataSearch.params.pageNo = (event.first / event.rows) + 1;
    this.dataSearch.params.pageSize = event.rows;
    this.getOpportunitiesList();
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
      this.getOpportunitiesList();
    }
  }

  changePage() {
    if (this.dataSearch.params.pageNo <= this.totalPages && this.dataSearch.params.pageNo > 0) {
      this.dataSearch.params.pageNo = this.dataSearch.params.pageNo > 0 ? this.dataSearch.params.pageNo : 1;
      this.getOpportunitiesList();
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
    this.getOpportunitiesList();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to previous page
  prev() {
    this.dataSearch.params.pageNo = this.dataSearch.params.pageNo - 1 > 0 ? this.dataSearch.params.pageNo - 1 : 1;
    if (this.end == this.dataSearch.params.pageSize) {
      return false;
    }
    this.getOpportunitiesList();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to next page
  next() {
    this.dataSearch.params.pageNo = (this.dataSearch.params.pageNo + 1) <= this.totalPages ? this.dataSearch.params.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getOpportunitiesList();
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
      this.selectedOpportunityIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
    }
    // get set quickview local storage config end
  }

  /* multi-select */
  isAllSelected() {
    const selectedOppListCount = this.opportunitiesList.filter(x => x.isSelected).length;
    if (this.opportunitiesList.length == selectedOppListCount) {
      this.isAllCheckBoxSelected = true;
    } else {
      this.isAllCheckBoxSelected = false;
    }
  }

  checkUncheckAll() {
    this.opportunitiesList.forEach(opportunity => {
      if (!opportunity.isClosedStage && !opportunity.isCompletedStage) {
        opportunity.isSelected = this.isAllCheckBoxSelected;
      }
    });
  }

  //region private methods
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

  private prepareParamsForAllUsers(ownerId, includeAllUsers = 1, searchString = '') {
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

  private prepareParamsForRelatedTo(selectedEntityID = null, includeAllEntities = 1, searchString: any = '') {
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

  prepareParamsForAccounts(entityTypeIDs: string = null, selectedEntityID = null, includeAllEntities = 1, searchString: any = '') {
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

  private prepareParamsForEntityStages() {
    const params = [];
    const paramItem = {
      name: 'EntityWorkflowID',
      type: 'int',
      value: this.entityWorkflowId,
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

      this._opportunitiesService.getOpportunitiesByWorkFlowIDAndStageID(params).then(
        (tasks: any) => {
          this.opportunitiesList.push(...tasks);
          // for each opportunity prepare card
          let kanbanStageCards: KanbanStageCard[] = [];
          tasks.forEach((opportunity: any) => {
            // set total
            this.stages[index].totalItems = opportunity.totalRecords;
            this.stages[index].totalOpportunityValue = opportunity.totalOpportunityValue;

            const taskIds: Array<number> = opportunity.selectedStageTaskIDs
              ? opportunity.selectedStageTaskIDs.split(",").map(m => Number(m))
              : [];

            // check if the current assigned to and logged in user is same
            var isSelectedTasksDisabled: boolean = true;

            let canUserMoveTask: boolean = this.canUserChangeStage(this.stages[index], opportunity);

            // check hidden
            var checkAnyoneCanSelectStageTasks: boolean = false;
            // if tenant setting is true no need to check current logged in user 
            if (this.opportunitiesStageTaskChange.toLowerCase() == "yes") {
              checkAnyoneCanSelectStageTasks = true;
            }
            else if (opportunity.assignedTo == this._loggedInUser.userId) {
              checkAnyoneCanSelectStageTasks = true;
            }
            else {
              checkAnyoneCanSelectStageTasks = false;
            }

            if (checkAnyoneCanSelectStageTasks && this.isEditOpportunities) {
              isSelectedTasksDisabled = false;
            }
            let settingsJson = JSON.parse(opportunity.settingsJson);
            const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.relatedEntityTypeId);

            // prepare card data
            let kanbanStageCard: KanbanStageCard = {
              id: opportunity.id,
              stageId: opportunity.stageId,
              labelType1: KanbanBoardTokenTypes[settingsJson.Token1Type as keyof typeof KanbanBoardTokenTypes],
              label1: settingsJson.Token1Text,
              labelTooltip1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.Token1Tooltip)),
              label1RedirectURL: settingsJson.Token1Url,
              labelType2: KanbanBoardTokenTypes[settingsJson.Token2Type as keyof typeof KanbanBoardTokenTypes],
              label2: settingsJson.Token2Text,
              labelTooltip2: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.Token2Tooltip)),
              label2RedirectURL: settingsJson.Token2Url,
              labelType3: KanbanBoardTokenTypes[settingsJson.Token3Type as keyof typeof KanbanBoardTokenTypes],
              label3: settingsJson.Token3Text,
              labelTooltip3: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.Token3Tooltip)),
              label3RedirectURL: settingsJson.Token3Url,
              parentID: opportunity.parentID,
              parentTokenType: KanbanBoardTokenTypes[settingsJson.ParentTokenType as keyof typeof KanbanBoardTokenTypes],
              parentLabel: settingsJson.TokenText,
              parentLabelTooltip1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.ParentTokenTooltip)),
              parentLabelRedirectUrl: settingsJson.ParentTokenUrl,
              entityId: opportunity.entityId,
              entityTypeId: opportunity.entityTypeId,
              entityTypeName: opportunity.entityTypeName,
              //relatedToLabel: opportunity.entityName,
              relatedToIconClass: this._commonHelper.getEntityIconClass(opportunity.entityTypeId),
              relatedToIconToolTip: foundRecord?.['displayName'].toString().trim(),
              relatedToTooltip: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.TOOLTIP_RELATED_TO') + ': ' + opportunity.entityName,
              relatedToRedirectURL: this.onRelatedToClick(opportunity),
              selectedTasks: (this.stages[index].tasks || []).filter(f => taskIds.includes(f.id)) || [],
              selectedTasksDisabled: isSelectedTasksDisabled,
              showPauseResumeButtons: false,
              showAddSubWorkTaskButton: false,
              canUserChangeStage: canUserMoveTask,
              owner1Id: opportunity.ownerID,
              owner1Name: opportunity.ownerName,
              owner1ShortName: opportunity.ownerShortName,
              owner1Image: opportunity.ownerImagePath,
              owner1Tooltip: opportunity.ownerName ? `${this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.TOOLTIP_OWNER')}: ${opportunity.ownerName}` : this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.TOOLTP_OWNER_ACTION'),
              owner1BGColor: opportunity.ownerAvatarBGColor,
              owner1userTypeId: this.userTypeID.Owner,
              priority: opportunity.priority,
              priorityName: opportunity.priorityName,
              priorityTooltip: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.TOOLTIP_PRIORITY'),
              priorityDefaultTooltip: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.TOOLTIP_PRIORITY_DEFAULT'),
              severity: opportunity.severity,
              severityName: opportunity.severityName,
              severityTooltip: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.TOOLTIP_SEVERITY'),
              severityDefaultTooltip: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.TOOLTIP_SEVERITY_DEFAULT'),
              disabled: false,
              isSubTask: false,
              owner2Id: opportunity.assignedTo,
              owner2Name: opportunity.assignedToName,
              owner2ShortName: opportunity.assignedToShortName,
              owner2Image: opportunity.assignedToImagePath,
              owner2Tooltip: opportunity.assignedToName ? `${this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.TOOLTIP_ASSIGN_TO')}: ${opportunity.assignedToName}` : this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.TOOLTP_ASSIGN_TO_ACTION')),
              owner2BGColor: opportunity.assignedToAvatarBGColor,
              owner2userTypeId: this.userTypeID.AssignedTo,
              cardColorClass: opportunity.cardColorClass,
              stageName: opportunity.stageName,
              isClosedStage: opportunity.isClosedStage,
              isCompletedStage: opportunity.isCompletedStage,
              entityIcon: 'fas fa-hand-holding-usd',
              entityRecordTypeId: opportunity?.entityRecordTypeId,
              entityRecordTypeName: opportunity.entityRecordTypeName,
              entityName: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_NAME_LABEL'),
              createdBy: opportunity?.createdBy,
              stagesTasks: this.stages[index]?.tasks,
              rating: opportunity?.rating,
              review: opportunity?.totalReviews,
              created: opportunity?.created,
              entityReviewID: opportunity.entityReviewID,
              isEntityReviewEditable: true,
              workTaskTypeName: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_WORKTASK_TAB.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
              workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
              userLabel1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('COMMON.COMMON_USER_PROFILE.LABEL_OWNERBY')),
              userLabel2: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('COMMON.COMMON_USER_PROFILE.LABEL_ASSIGNEDTO')),
              isStarred: opportunity?.isStarred
            }

            if (!isAppend && this.selectedOpportunityIdForActivityCenter != null && this.selectedOpportunityIdForActivityCenter > 0 && kanbanStageCard.id == this.selectedOpportunityIdForActivityCenter) {
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

  private getWorkflowDetail(): Promise<any> {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.OpportunityWorkflowDetailKey}_${this.entityWorkflowId}`;

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
    return [{ name: 'EntityTypeID', type: 'int', value: Entity.Opportunities }];
  }

  private getWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      const storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Opportunities}`;

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

  private getHeaderFilters() {
    // other fileter master data
    const requestArray = [];

    const entityTimeSpans = this.getEntityTimespans();
    const requestOwnerUsers = this.getOwnerUsers(null, 1, '');
    const recordTypeList = this.getEntityRecordTypes();
    //const requestRelatedTo = this.getRelatedTo(null, 1, '');
    const requestAccounts = this.getAccounts(null, 0, '');
    const requestTags = this.getOpportunityTags();
    const priorityList = this.getPriority();
    const severityList = this.getSeverity();
    const requestAssignedToUsers = this.getAssigedToUsers(null, 1, '');
    const stageList = this.getStage();
    const rationList = this._commonHelper.setRatingOptions();

    requestArray.push(entityTimeSpans);
    requestArray.push(requestOwnerUsers);
    requestArray.push(recordTypeList);
    //requestArray.push(requestRelatedTo);
    requestArray.push(requestAccounts);
    requestArray.push(requestTags);
    requestArray.push(priorityList);
    requestArray.push(severityList);
    requestArray.push(requestAssignedToUsers);
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
            label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_ENTITYTIMESPAN'),
            name: 'entityTimespan',
            placeHolder: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_ENTITYTIMESPAN'),
            ngModel: selectedEntityTimespan == null || selectedEntityTimespan.length == 0 ? ActivityTimespan.LAST7DAYS : selectedEntityTimespan,
            ngModelDefaultValue: ActivityTimespan.LAST7DAYS,
            optionLabel: 'label',
            optionValue: 'value',
            options: entityTimespans,
            isHidden: false,
            filter: false,
            showHeader: false,
            resetFilterOnHide: false,
            defaultClass: 'small-filter basic-filter',
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

        //owner filter
        if (results[1] != undefined) {
          let response = results[1] as [];
          this.filterOwners = response;
          this.ownerList = response.map((i: any) =>
            ({ id: i.value, name: i.label }));

          this.filterOwners.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_OPTION_TEXT_OWNER') });
          this.filterOwners.sort((a, b) => a.value - b.value);
          let selectedOwnerIds: any[] = [];
          if (this.filterOwners.length > 0) {
            var selectedIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.ownerIDs : this.dataSearch.paramsByStage.ownerIDs;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString.split(',');

              if (selectedIds.length > 0) {
                selectedIds.forEach((element: any) => {
                  const obj = this.filterOwners.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    selectedOwnerIds.push(obj.value);
                    this.filterCount ++;
                });
              }
            }
          }
          //setup search dropdown
          const ownerFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_OWNER'),
            name: 'ownerIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_OWNER'),
            ngModel: selectedOwnerIds.length == 0 ? '' : selectedOwnerIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.filterOwners,
            isHidden: false,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-md',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(ownerFilter);
        }

        //Record Types
        if (results[2] != undefined) {
          let response = results[2] as any[];
          //record type list in dropdown
          this.entityRecordType = response;
          this.entityRecordType.push({ label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_OPTION_TEXT_RECORDTYPE'), value: 0 })
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
            label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_RECORDTYPE'),
            name: 'entityRecordTypeIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_RECORDTYPE'),
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
        /*if (results[3] != undefined) {
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
              placeHolder: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_RELATEDTO', { entityName: foundRecord?.['displayName'].toString().trim() }),
              ngModel: selectedRelatedToIds.length == 0 ? '' : selectedRelatedToIds,
              optionLabel: 'label',
              optionValue: 'value',
              options: this.relatedTo,
              isHidden: false,
              defaultClass: 'basic-filter',
              resetFilterOnHide: false,
              panelStyleClass: 'maxWidthOverride-md'
            }
            // add to filter
            this.customFilterConfig.push(relatedToFilter);
          }
        }*/

               //Accountd
               if (results[3] != undefined) {
                let response = results[3] as [];
                // related to to dropdwon
                this.filterAccounts = response;
                this.accounts = response;
      
                this.filterAccounts.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_OPTION_TEXT_ACCOUNT') });
                this.filterAccounts.sort((a, b) => a.value - b.value);
      
                //set selected related to in dropdown
                let selectedAccountIds: any[] = [];
      
                if (this.filterAccounts.length > 0) {
                  var selectedIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.accountIDs : this.dataSearch.paramsByStage.accountIDs;
                  if (selectedIdSString != "") {
                    var selectedIds = selectedIdSString.split(',');
      
                    if (selectedIds.length > 0) {
                      selectedIds.forEach((element: any) => {
                        const obj = this.filterAccounts.find(x => x.value === parseInt(element))
                        if (obj != null && obj != undefined)
                          selectedAccountIds.push(obj.value);
                          this.filterCount ++;
                      });
                    }
                  }
                }
                  const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.relatedEntityTypeId);
                  //setup search dropdown
                  let accountFilter = {
                    inputType: 'MultiSelect',
                    label:this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_ACCOUNT')),
                    accountIconClass: this._commonHelper.getEntityIconClass(this.relatedEntityTypeId),
                    accountIconToolTip: foundRecord?.['displayName'].toString().trim(),
                    name: 'accountIDs',
                    placeHolder: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_ACCOUNT')),
                    ngModel: selectedAccountIds.length == 0 ? '' : selectedAccountIds,
                    optionLabel: 'label',
                    optionValue: 'value',
                    options: this.filterAccounts,
                    isHidden: false,
                    defaultClass: 'basic-filter',
                    resetFilterOnHide: false,
                    panelStyleClass: 'maxWidthOverride-md',
                    isCountableFilter: 1
                  }
                  // add to filter
                  this.customFilterConfig.push(accountFilter);
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
            label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_TAGS'),
            name: 'tagIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_TAGS'),
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
            label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_PRIORITY'),
            name: 'priorityIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_PRIORITY'),
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
            label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_SEVERITY'),
            name: 'severityIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_SEVERITY'),
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
            label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_DUE_FROM'),
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
            label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_DUE_TO'),
            name: 'dueEndDate',
            ngModel: selectedDueEndDate,
            isHidden: false,
            defaultClass: 'small-filter',
            isCountableFilter: 0
          };
          // add to filter 

          this.customFilterConfig.push(dueEndFilter);

          //assigned to filter
          if (results[7] != undefined) {
            let response = results[7] as [];
            // users to assign to dropdwon
            this.users = response.map((i: any) =>
              ({ value: i.value, label: i.label }));
            this.filterUsers = response;
            //set owner 1 list
            this.owner1List = response.map((i: any) =>
              ({ id: i.value, name: i.label }));

            this.filterUsers.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_OPTION_TEXT_ASSIGNEDTO') });
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
              label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_ASSIGNTO'),
              name: 'assignedToIDs',
              placeHolder: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_ASSIGNTO'),
              ngModel: selectedUserIds.length == 0 ? '' : selectedUserIds,
              optionLabel: 'label',
              optionValue: 'value',
              options: this.filterUsers,
              isHidden: false,
              defaultClass: 'small-filter',
              panelStyleClass: 'maxWidthOverride-md',
              isCountableFilter: 1
            }
            // add to filter
            this.customFilterConfig.push(assignedToFilter);
          }

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
            label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_DUE_DATE'),
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

        //Add Task Created Date Range Filter
        this.addTaskCreatedDateRangeFilter();

        if (results[8] != undefined) {
          let Liststages = results[8] as any[];
          this.filterStage = Liststages;

          if (this.showLayout == LayoutTypes.ListView) {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_STATUS');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_STATUS');
          }
          else {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_STAGE');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_STAGE');
          }

          //set selected stage in dropdown
          let selectedStageIds: any[] = [];

          if (this.filterStage.length > 0) {
            var selectedIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.stageIDs : this.dataSearch.paramsByStage.stageIDs;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString?.split(",");

              if (selectedIds?.length > 0) {
                selectedIds.forEach((element: any) => {
                  const obj = this.filterStage.find(
                    (x) => x.value === parseInt(element)
                  );
                  if (obj != null && obj != undefined)
                    selectedStageIds.push(obj.value);
                    this.filterCount ++;
                });
              }
            }
          }
          //setup search dropdown
          let stageFilter = {
            inputType: "MultiSelect",
            label: this.StatusFilterLabel,
            name: "stageIDs",
            placeHolder: this.StatusFilterPlaceholder,
            ngModel: selectedStageIds.length == 0 ? "" : selectedStageIds,
            optionLabel: "label",
            optionValue: "value",
            options: this.filterStage,
            isHidden: !this.dataSearch.isPageTabularView,
            defaultClass: 'small-filter',
            panelStyleClass: "maxWidthOverride-md",
            isCountableFilter: 1
          };
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
            label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_RATING'),
            name: 'rating',
            placeHolder: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_PLACEHOLDER_RATING'),
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

        //Insert "Only My Tasks" after Tag Category filter
        const tagIDsIndex = this.customFilterConfig.findIndex(x => x.name === 'tagIDs')
        
        this.customFilterConfig.splice((tagIDsIndex + 1), 0, {
          
        });

        //Insert "Only My Tasks" filter
        let isShowMyOpportunities = this.dataSearch.isPageTabularView ? this.dataSearch.params.showMyOpportunities : this.dataSearch.paramsByStage.showMyOpportunities;
        let showMyOpportunitiesFilter = 
        {
          inputType: 'Checkbox',
          label: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_MY_OPPORTUNITIES')),
          name: 'showMyOpportunities',
          ngModel: isShowMyOpportunities,
          ngModelDefaultValue: true,
          isHidden: false,
          isCountableFilter: 1
        }
        this.customFilterConfig.push(showMyOpportunitiesFilter);
        if(showMyOpportunitiesFilter.ngModel == true){
          this.filterCount ++;
        }

        //Insert "BookMark" filter
        let isStarred = this.dataSearch.isPageTabularView ? this.dataSearch.params.showStarred : this.dataSearch.paramsByStage.showStarred;
        let showStarredFilter = 
        {
          inputType: 'Checkbox',
          label: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_STARRED')),
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

  private addTaskCreatedDateRangeFilter() {

    // Task Created From Date Filter
    let selectedFromDate = this.dataSearch.isPageTabularView ? this.dataSearch.params.createdFromDate : this.dataSearch.paramsByStage.createdFromDate;
    let createdFromDateFilter = {
      inputType: 'DateFrom',
      label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_CREATED_FROM'),
      name: 'createdFromDate',
      ngModel: selectedFromDate,
      isHidden: false,
      defaultClass: 'small-filter',
      isCountableFilter: 0
    };
    this.customFilterConfig.push(createdFromDateFilter);

    // Task Created To Date Filter
    let selectedToDate = this.dataSearch.isPageTabularView ? this.dataSearch.params.createdToDate : this.dataSearch.paramsByStage.createdToDate;
    let createdToDateFilter = {
      inputType: 'DateTo',
      label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_CREATED_TO'),
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
      label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.FILTER_LABEL_CREATED_DATE'),
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

  private afterDropSuccess(event: CdkDragDrop<{}[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    else {
      const opportunityId = event.item.data.id;
      const dropOpportunityStageId = +event.container.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;
      let dropStage = this.stages.find(x => x.id == dropOpportunityStageId);
      if (dropStage.isCompleted === true) {
        this.isOpportunityEligibleToDone(opportunityId).then((res) => {
          if (res) {
            this.afterDropIsAlltaskRequiredConditionCheck(event, opportunityId);
          } else {
            return false;
          }
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
      } else {
        this.afterDropIsAlltaskRequiredConditionCheck(event, opportunityId);
      }
    }
  }

  private afterDropIsAlltaskRequiredConditionCheck(event, opportunityId) {
    const opportunityStageId = +event.item.data.stageId;
    //Check Is All Tasks Required for current Entity Stage before move onto the next Entity Stage.
    const isAllTasksRequired = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageIsAllTasksRequired').innerHTML;
    const previousStageId = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;

    // if any one of the current stage task is required
    let anyTasksIsRequired: boolean = false;
    let requiredTasks: any[] = [];
    // find out the current stage
    let currentStage = this.opportunitiesListByStages.find(x => x.id == previousStageId);
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
        * Call API to validate opportunity has completed the stage tasks (which are required) before moving on to other stage.
        * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (OpportunityId)
        * */
      let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityStageTasksCompleted(opportunityId, this.entityTypeId, opportunityStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {

          this.dataSearch.paramsByStage.pageNo = 1;
          let searchStage = this.stages.find(x => x.id == event.item.data.stageId);
          searchStage.pagination.pageNo = this.dataSearch.paramsByStage.pageNo;

          this.moveEntity(event);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_BEFORE_MOVE_OPPORTUNITY_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else if (isAllTasksRequired && isAllTasksRequired.toLowerCase() == "true") {
      /**
        * Call API to validate opportunity has completed all the stage tasks before moving on to other stage.
        * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (OpportunityId)
        * */
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityStageTasksCompleted(opportunityId, this.entityTypeId, opportunityStageId, this.entityWorkflowId, null).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.moveEntity(event);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_BEFORE_MOVE_OPPORTUNITY_STAGE_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    } else {
      this.moveEntity(event);
    }
  }

  private isOpportunityEligibleToDone(opportunityId) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._opportunitiesService.getOpportunityById(opportunityId,null).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          if (response.hasAnyInactiveItem) {  //alert inactive product 
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_COUNTAIN_INACTIVE_PRODUCT_OR_SKUS'));
            resolve(false);
          } else if (!(response.priceBookIsActive ?? true)) { //alert inactive price book 
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_COUNTAIN_INACTIVE_PRICEBOOK'));
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

  private afterEntityStageClick(opportunity) {
    this._commonHelper.showLoader();
    // get data from event
    let opportunityId = opportunity.id;
    let opportunityStageId = opportunity.stageID;

    // prepare params
    var params = this.prepareParamsForEntityStages();

    let entityStageDialogTitle: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ENTITY_STAGE_DIALOG.DIALOG_TITLE_STATUS') : this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ENTITY_STAGE_DIALOG.DIALOG_TITLE');
    let entityStageDialogFieldLabel: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_LABEL') : this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_LABEL');
    let entityStageDialogFieldPlaceholder: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_PLACEHOLDER') : this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_PLACEHOLDER');

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
        this.modalRef.componentInstance.entityStageId = opportunityStageId;
        this.modalRef.componentInstance.dialogTitle = entityStageDialogTitle;
        this.modalRef.componentInstance.entityStageSelectLabel = entityStageDialogFieldLabel;
        this.modalRef.componentInstance.entityStageChangeSelectReasonLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_REASON_LABEL');
        this.modalRef.componentInstance.entityStageSelectPlaceholder = entityStageDialogFieldPlaceholder;
        this.modalRef.componentInstance.entityStageChangeReasonLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_LABEL');
        this.modalRef.componentInstance.entityStageChangeReasonPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_PLACEHOLDER');
        this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
        this.modalRef.componentInstance.OnChangeEntityStage.subscribe((selectedEntityStageInfo) => {

          let selectedEntityStageId = selectedEntityStageInfo.entityStageId;
          // if selected stage and current stage are same - don't do anything
          if (selectedEntityStageId != undefined && selectedEntityStageId != null && selectedEntityStageId != opportunityStageId) {
            const selectedEntityStageDetail = this.opportunitiesListByStages.find(s => s.id == selectedEntityStageId);
            if (selectedEntityStageDetail.isCompleted === true) {
              this.isOpportunityEligibleToDone(opportunityId).then((res) => {
                if (res) {
                  this.afterEntityStageClickIsAllTaskRequiredCheck(opportunity, selectedEntityStageInfo, selectedEntityStageDetail);
                } else {
                  return false;
                }
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                });
            } else {
              this.afterEntityStageClickIsAllTaskRequiredCheck(opportunity, selectedEntityStageInfo, selectedEntityStageDetail);
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

  private afterEntityStageClickIsAllTaskRequiredCheck(opportunity, selectedEntityStageInfo, selectedEntityStageDetail) {
    let opportunityStageId = opportunity.stageID;
    const prevEntityStageDetail = this.opportunitiesListByStages.find(s => s.id == opportunityStageId);
    let stagename = selectedEntityStageDetail.name;
    let isAllTasksRequired = prevEntityStageDetail?.isAllTasksRequired;
    let stageChangeReasonDescription = selectedEntityStageInfo.entityStageChangeReason
    let assignedTo = opportunity.assignedTo;
    let opportunityId = opportunity.id;

    let selectedEntityStageChangeReason = null;
    // get changed stage and reason if it is there
    let selectedEntityStageId = selectedEntityStageInfo.entityStageId;
    if (selectedEntityStageInfo.stageReason != null) {
      selectedEntityStageChangeReason = selectedEntityStageInfo.stageReason.label
    }

    let moveEntityParams = {
      opportunityId: opportunityId,
      entityTypeId: this.entityTypeId,
      entityWorkflowId: this.entityWorkflowId,
      opportunityStageId: opportunityStageId,
      selectedEntityStageId: selectedEntityStageId,
      stagename: stagename,
      assignedTo: assignedTo,
      selectedEntityStageChangeReason: selectedEntityStageChangeReason,
      stageChangeReasonDescription: stageChangeReasonDescription,
      verifiedBy: null,
      isCompletedStage: opportunity.isCompletedStage,
      isClosedStage: opportunity.isClosedStage,
    }

    // if any one of the current stage task is required
    let anyTasksIsRequired: boolean = false;
    let requiredTasks: any[] = [];
    // find out the current stage
    let currentStage = this.opportunitiesListByStages.find(x => x.id == opportunityStageId);
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
        * Call API to validate opportunity has completed the stage tasks (which are required) before moving on to other stage.
        * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (OpportunityId)
        * */
      let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityStageTasksCompleted(opportunityId, this.entityTypeId, opportunityStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.moveEntityFromList(moveEntityParams, this.modalRef);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_BEFORE_MOVE_OPPORTUNITY_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else if (isAllTasksRequired) {
      /**
       * Call API to validate opportunity has completed all the stage tasks before moving on to other stage.
       * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (OpportunityId)
       * */
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityStageTasksCompleted(opportunityId, this.entityTypeId, opportunityStageId, this.entityWorkflowId, null).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.moveEntityFromList(moveEntityParams, this.modalRef);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_BEFORE_MOVE_OPPORTUNITY_STAGE_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else {
      this.moveEntityFromList(moveEntityParams, this.modalRef);
    }
  }

  private moveEntityFromList(moveEntityParams: any, modalRef: NgbModalRef) {
    let opportunityId = moveEntityParams.opportunityId,
      opportunityStageId = moveEntityParams.opportunityStageId,
      selectedEntityStageId = moveEntityParams.selectedEntityStageId,
      stagename = moveEntityParams.stagename,
      assignedTo = moveEntityParams.assignedTo,
      selectedEntityStageChangeReason = moveEntityParams.selectedEntityStageChangeReason,
      stageChangeReasonDescription = moveEntityParams.stageChangeReasonDescription,
      isCompletedStage = moveEntityParams.isCompletedStage,
      isClosedStage = moveEntityParams.isClosedStage,
      stageName = moveEntityParams.stageName;

    if (selectedEntityStageChangeReason != null || stageChangeReasonDescription != null) {
      // prepare reason as a note
      let note = new Note({});
      note.id = 0;
      note.tenantId = this._loggedInUser.tenantId;
      note.entityTypeId = this.entityTypeId;
      note.entityId = opportunityId;
      note.entityRecordTypeID = null;
      note.subject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: stagename }))}`;
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
          this.saveOpportunityStage(opportunityId, opportunityStageId, selectedEntityStageId, stagename, assignedTo, moveEntityParams.verifiedBy, isCompletedStage, isClosedStage, stageName)
        ]).then(() => {
          const param = {
            entityTypeId: this.entityTypeId,
            entityId: opportunityId,
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
      const selectedEntityStageDetail = this.opportunitiesListByStages.find(s => s.id == selectedEntityStageId);
      let stagename = selectedEntityStageDetail.name;
      Promise.all([
        this.saveOpportunityStage(opportunityId, opportunityStageId, selectedEntityStageId, stagename, assignedTo, moveEntityParams.verifiedBy, isCompletedStage, isClosedStage, stageName)
      ]).then(() => {
        modalRef.close();
        this.refreshData();
      }).catch(() => {
        modalRef.close();
        this.refreshData();
      });
    }
  }

  // get tenant setting for tab layout
  private getTabLayoutTenantSetting() {
    const opportunitiesStageTaskChange = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.ALLOW_TASK_COMPLETE));
    if (opportunitiesStageTaskChange == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.ALLOW_TASK_COMPLETE).then((response: any) => {
          if (response) {
            this.opportunitiesStageTaskChange = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.ALLOW_TASK_COMPLETE, JSON.stringify(this.opportunitiesStageTaskChange));
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
      this.opportunitiesStageTaskChange = opportunitiesStageTaskChange;
    }
  }

  private getAssigedToUsers(selectedUserId: any, includeAllUsers, searchString: any): Promise<any> {
    //DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    const params = this.prepareParamsForAssignedToUsers('', selectedUserId, includeAllUsers, searchString);
    // call datasource service with params
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYASSIGNEDTO, params);
  }

  private getOwnerUsers(selectedUserId: any, includeAllUsers, searchString: any): Promise<any> {
    const params = this.prepareParamsForAllUsers(selectedUserId, includeAllUsers, searchString);
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYOWNERS, params);
  }

  private getRelatedTo(selectedEntity: any, includeAllEntities, searchString: any): Promise<any> {
    // DD20220331 SDC-220: Entity Types dropdown and then based on that related to dropdown
    // prepare params
    const params = this.prepareParamsForRelatedTo(selectedEntity, includeAllEntities, searchString);
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYRELATEDENTITIES, params);
  }

  private getAccounts(selectedEntity: any, includeAllEntities, searchString: any): Promise<any> {
    const params = this.prepareParamsForAccounts(Entity.Accounts.toString(),selectedEntity, includeAllEntities, searchString);
    //const params = this.prepareParamsForAccountType(selectedEntity, includeAllEntities, searchString);
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALL_RELATED_ENTITIES, params);
  }

  private getOpportunityTags(): Promise<any> {
    return this._entitytagsService.getActiveEntityTagsByEntityTypeId(this.entityTypeId, this.entityRecordTypeId);
  }

  private getEntityTimespans(): Promise<any> {
    const params = { refType: RefType.EntityTimespan };
    //return this._commonService.getActiveReferenceTypeByRefType(params);
    return new Promise((resolve, reject) => {
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.EntityTimespan}`;
      // get data
      const refTypeEntityTimespan = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
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

  private getPriority(): Promise<any> {
    return this._dataSourceService.getDataSourceDataByCode(DataSources.PRIORITY);
  }

  private getSeverity(): Promise<any> {
    return this._dataSourceService.getDataSourceDataByCode(DataSources.SEVERITY);
  }

  private getStage(): Promise<any> {
    const params = this.prepareParamsForEntityStagesByWorkflowId();
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITYSTAGESBYWORKFLOWID, params);
  }

  private getOpportunitiesList() {
    this._commonHelper.showLoader();
    this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null;

    this.dataSearch.params.createdFromDate = this.dataSearch.params.createdFromDate != null ? moment(this.dataSearch.params.createdFromDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.createdToDate = this.dataSearch.params.createdToDate != null ? moment(this.dataSearch.params.createdToDate).format('YYYY-MM-DD') : null;

    this._opportunitiesService.getOpportunitiesByWorkFlowIDWithPagination(this.dataSearch.params).then((response: any) => {
      this.opportunitiesList = response;
      this.isAllCheckBoxSelected = false;
      this.opportunitiesList.forEach(opportunity => {
        opportunity.description = this._commonHelper.htmlToPlainText(opportunity.description);
        opportunity['isSelected'] = false;
      });

      // total
      this.totalRecords = this.opportunitiesList.length > 0 ? response[0].totalRecords : 0;
      this.dt.rows = this.dataSearch.params.pageSize;
      this.totalPages = Math.ceil(this.totalRecords / this.dataSearch.params.pageSize);
      this.end = this.dataSearch.params.pageNo == this.totalPages ? this.totalRecords : this.dataSearch.params.pageNo * this.dataSearch.params.pageSize;
      this.start = this.end == this.totalRecords ? (this.totalRecords - this.opportunitiesList.length + 1) : (this.end - this.dataSearch.params.pageSize) + 1;
      
      //set Action column show/hide dynamically
      this.isStageClosedOrCompleted = this.opportunitiesList.filter(x => x.isCompletedStage || x.isClosedStage).length;
      if ((!this.isAllowToReopen && !this.isDeleteOpportunities) || (this.isStageClosedOrCompleted < 0 && this.isAllowToReopen)) {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = false;
      }
      else {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = true;
      }

      this._commonHelper.hideLoader();

      if (this.selectedOpportunityIdForActivityCenter != null && this.selectedOpportunityIdForActivityCenter > 0 && this.opportunitiesList.some(x => x.id == this.selectedOpportunityIdForActivityCenter)) {
        this.updateEntityDetails(true, this.opportunitiesList.find(x => x.id == this.selectedOpportunityIdForActivityCenter));
      }
      else {
        this.resetSelectedEntity();
      }

      this._fileSignedUrlService.getFileSingedUrl(this.opportunitiesList, 'assignedToImagePath', 'assignedToSignedUrl', Entity.Users)
        .then(() => {
          this._fileSignedUrlService.getFileSingedUrl(this.opportunitiesList, 'ownerImagePath', 'ownerSignedUrl', Entity.Users);
        });

    }, (error) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(error.message);
    });
  }

  // get stage wise data params
  private getParamObj(stageId: number) {
    this.dataSearch.paramsByStage.stageId = stageId;
    return this.dataSearch.paramsByStage;
  }

  private getEntityStagesWithTask() {
    const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
    if (entityStagesWithTasks == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId).then(
          (response: any[]) => {
            this.opportunitiesListByStages = JSON.parse(JSON.stringify(response));
            this.opportunitiesListByStages.forEach((stage: any) => {
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
            this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.opportunitiesListByStages));
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
      this.opportunitiesListByStages = entityStagesWithTasks;
    }
  }

  // prepare stages with tasks
  private async prepareStages() {
    this.opportunitiesListByStages.forEach((stage: any) => {
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

  private moveEntity(event: CdkDragDrop<{}[]>) {
    const opportunityId = event.item.data.id;
    const opportunityStageId = +event.item.data.stageId;
    const dropOpportunityStageId = +event.container.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;
    const dropOpportunityStageName = event.container.element.nativeElement.querySelector('div .cards-header #stageName').innerHTML;
    const isNoteRequired = event.container.element.nativeElement.querySelector('div .cards-header #stageNoteRequired').innerHTML;
    const assignedTo = event.item.data.owner2Id;
    const verifiedBy = null;
    const isCompletedStage = event.item.data.isCompletedStage;
    const isClosedStage = event.item.data.isClosedStage;
    const stageName = event.item.data.stageName;

    let currentStage = this.stages.find(x => x.id == opportunityStageId);
    let dropStage = this.stages.find(x => x.id == dropOpportunityStageId);

    if (isCompletedStage || isClosedStage) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }
    // check if note is required
    if (isNoteRequired == 'true') {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = opportunityId;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropOpportunityStageName }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = dropOpportunityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(noteDate => {
        if (noteDate != undefined) {
          // save to transition
          Promise.all([
            this.saveOpportunityStage(opportunityId, opportunityStageId, dropOpportunityStageId, dropOpportunityStageName, assignedTo, verifiedBy, isCompletedStage, isClosedStage, stageName)
          ]).then(() => {
            const param = {
              entityTypeId: this.entityTypeId,
              entityId: opportunityId,
              workflowId: this.entityWorkflowId,
              workflowStageId: opportunityStageId,
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

              this.getEntityStageData(opportunityStageId, false); // refresh current stage
              this.getEntityStageData(dropOpportunityStageId, false); // refresh drop stage 
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
        this.saveOpportunityStage(opportunityId, opportunityStageId, dropOpportunityStageId, dropOpportunityStageName, assignedTo, verifiedBy, isCompletedStage, isClosedStage, stageName)
      ]).then(() => {

        currentStage.pagination.pageNo = 1; //reset current pagination stats of source stage
        dropStage.pagination.pageNo = 1; //reset current pagination stats of target stage
        this.dataSearch.paramsByStage.pageNo = 1 //rest global stage params pagination stage

        this.getEntityStageData(opportunityStageId, false); // refresh current stage
        this.getEntityStageData(dropOpportunityStageId, false); // refresh drop stage 
      }).catch(() => {
        //this.refreshData();
      });
    }
  }

  //opportunity stage change save
  private saveOpportunityStage(opportunityId, opportunityStageId, dropOpportunityStageId, dropOpportunityStageName, assignedTo, verifiedBy, isCompletedStage, isClosedStage, stageName) {
    return new Promise((resolve, reject) => {
      let assignedToForDto = assignedTo;
      if (isCompletedStage || isClosedStage) {
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
        return;
      }
      else {
        this._commonHelper.showLoader();
        this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: opportunityId, stageId: dropOpportunityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedTo, verifiedBy: verifiedBy, oldStageId: opportunityStageId }).then((response: any) => {
          if (response) {

            this.opportunitiesAssignedTo = response;
            if (assignedToForDto != this.opportunitiesAssignedTo.assignedToId) {
              this._commonHelper.showLoader();
              this._opportunitiesService.updateOpportunityAssignedTo({ entityId: opportunityId, assignedToId: this.opportunitiesAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.opportunitiesAssignedTo.isForcedAssignment, stageId: dropOpportunityStageId }).then((response: any) => {
                if (response) {
                  assignedToForDto = this.opportunitiesAssignedTo.assignedToId;
                  // success message
                  this._commonHelper.showToastrSuccess(
                    this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_MOVETO_STAGE', { stageName: dropOpportunityStageName })
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
                this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_MOVETO_STAGE', { stageName: dropOpportunityStageName })
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

  // refresh all data
  private refreshData() {
    if (!this.dataSearch.isPageTabularView) {
      // reset
      this.dataSearch.paramsByStage.pageNo = 1;
      this.stages = [];
      this.opportunitiesList = [];
      // prepare stages
      this.prepareStages();
    } else {
      this.dataSearch.params.pageNo = 1;
      this.opportunitiesList = [];
      this.getOpportunitiesList();
    }
  }

  //transferArrayItem kanban card layout
  private transferArrayItem(event) {
    if (event != null) {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'opportunities.closedorcompleted') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITITES_CLOSEDORCOMPLETED', { stageName: error.data.stageName }));
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }

  private handleOpportunityChangesError(error: any, opportunityTaskStageId: number) {
    if (error != null && (String(error.messageCode).toLowerCase() === 'opportunities.deletederror' || String(error.messageCode).toLowerCase() === 'entitystage.pausedordeleteerror')
      || String(error.messageCode).toLowerCase() === 'opportunities.closedorcompleted') {
      if (!this.dataSearch.isPageTabularView) {
        // refresh current stage
        this.getEntityStageData(opportunityTaskStageId, false);
        if (String(error.messageCode).toLowerCase() === 'opportunities.closedorcompleted') {
          const closedCompletedStages = this.opportunitiesListByStages.filter(x => x.isClosed || x.isCompleted);
          if (closedCompletedStages) {
            closedCompletedStages.forEach(x => {
              this.getEntityStageData(x.id, false);
            });
          }
        }
      } else {
        this.dataSearch.params.pageNo = 1;
        this.opportunitiesList = [];
        this.getOpportunitiesList();
      }
    }
  }

  // Set card/row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Opportunities_Workflow_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get card/row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Opportunities_Workflow_SelectedItem);
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

    this._opportunitiesService.updateOpportunityField(params).then((response) => {
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
            this.recordTypesDetail = response?.filter(x => x.entityTypeID == Entity.Opportunities && (x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == null)).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }));
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Opportunities).map(x => ({ 'label': x.name, 'value': x.id }));
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
        this.recordTypesDetail = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Opportunities && (x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == null)).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }));
        this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Opportunities).map(x => ({ 'label': x.name, 'value': x.id }));
        this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
        resolve(this.recordTypes);
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

  addWorkTask() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.entityDetails.id;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.worktaskRecordTypes.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.worktaskWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Opportunities || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityWorkTaskPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Opportunities;
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

  onReopenStage(opportunities) {
    if (!this.isAllowToReopen) {
      return;
    }
    if (opportunities.isCompletedStage || opportunities.isClosedStage) {
      //get default stage details
      const getDefaultStage: any = this.opportunitiesListByStages?.find(s => s.isDefault);
      var isShowStageChangeConfirmationBox: boolean = true;
      this.changeEntityStage(getDefaultStage, getDefaultStage.id, isShowStageChangeConfirmationBox, true, opportunities);
    }
  }

  changeEntityStage(toEntityStageDetail, toEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage: boolean, opportunities) {
    let noteSubjectName: any;
    if (!isReopenedStage) {
      noteSubjectName = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: toEntityStageDetail.name }))}`
    } else {
      noteSubjectName = this._commonHelper.getInstanceTranlationData('COMMON.STAGE_REOPEN_TEXT');
    }
    if (toEntityStageDetail.isNoteRequired || isReopenedStage) {
      isShowStageChangeConfirmationBox = false;
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = opportunities.id;
      this.modalRef.componentInstance.noteSubject = noteSubjectName;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = toEntityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;
      this.modalRef.result.then(response => {
        if (response != undefined) {
          const stageValueNoteParams = {
            entityTypeId: this.entityTypeId,
            entityId: opportunities.id,
            workflowId: this.entityWorkflowId,
            workflowStageId: toEntityStageId,
            stageNoteID: response.id,
            processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.StageNote
          };

          Promise.all([
            this.updateEntityStage(toEntityStageId, toEntityStageDetail, isShowStageChangeConfirmationBox, isReopenedStage, opportunities),
          ]).then(() => {
            Promise.all([
              this.saveEntityWorkflowStageValueNote(stageValueNoteParams)
            ]).then(() => {
              // get list
              this.getOpportunitiesList();
            });
          }).catch(() => {
            // get list
            this.getOpportunitiesList();
          });
        }
        else {
          this.selectedStage = this.currentStage;
        }
      });
    }
    else {
      Promise.all([
        this.updateEntityStage(toEntityStageId, toEntityStageDetail, isShowStageChangeConfirmationBox, isReopenedStage, opportunities),
      ]).then(() => {
        // get list
        this.getOpportunitiesList();
      }).catch(() => {
        // get list
        this.getOpportunitiesList();
      });
    }
  }

  // update workflow entity stage values
  updateEntityStage(toEntityStageId, toEntityStageDetail, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean, opportunities) {
    return new Promise((resolve, reject) => {
      if (isShowStageChangeConfirmationBox) {
        this._confirmationDialogService.confirm("OPPORTUNITIES.CHANGE_STAGE_CONFIRMATION", null, null, this.optionsForPopupDialog).then((confirmed: any) => {
          if (confirmed) {
            return this.afterUpdateEntityStage(toEntityStageId, toEntityStageDetail, isReopenedStage, opportunities);
          }
        })
      } else {
        return this.afterUpdateEntityStage(toEntityStageId, toEntityStageDetail, isReopenedStage, opportunities);
      }
    });
  }

  afterUpdateEntityStage(toEntityStageId, toEntityStageDetail, isReopenedStage: boolean, opportunities) {
    return new Promise((resolve, reject) => {
      let assignedToForDto = opportunities.assignedTo;
      this._commonHelper.showLoader();
      let currentStageId = this.opportunitiesListByStages.find(x => x.id == opportunities.stageId)?.id;
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: opportunities.id, stageId: toEntityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedToForDto, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.opportunityAssignedTo = response;
          if (assignedToForDto != this.opportunityAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._opportunitiesService.updateOpportunityAssignedTo({ entityId: opportunities.id, assignedToId: this.opportunityAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.opportunityAssignedTo.isForcedAssignment, stageId: toEntityStageId }).then((response: any) => {
              if (response) {
                assignedToForDto = this.opportunityAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_MOVETO_STAGE',
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
                this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_STAGE_REOPEN', {
                  entityName: opportunities?.name !== null ? opportunities?.name : " "
                })
              )
            } else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.LIST.MESSAGE_OPPORTUNITY_MOVETO_STAGE',
                  { stageName: toEntityStageDetail.name })
              );
            }
          }
        }
        // get list
        this.getOpportunitiesList();
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

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.dataSearch.params.searchString = val;
        this.dataSearch.paramsByStage.searchString = val;
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OpportunityListKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);
        this.refreshData();
      });
  }

}
