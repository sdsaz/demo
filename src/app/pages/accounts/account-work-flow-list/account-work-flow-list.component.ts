//ANGULAR
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
//COMPONENTS
import { AccountImportDialogComponent } from '../account-import-dialog/account-import-dialog.component';
import { UserAssignDialogComponent } from '../../../@core/sharedComponents/user-assign/user-assign-dialog/user-assign-dialog.component';
import { AccountAddComponent } from '../account-add/account-add.component';
import { EntityStagesDialogComponent } from '../../../@core/sharedComponents/entity-stages/entity-stages-dialog/entity-stages-dialog.component';
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { StagesComponent } from '../../../@core/sharedComponents/kanban-board/stages/stages.component';
import { ActivitySectionComponent } from '../../../@core/sharedComponents/common-activity-section/activity-section/activity-section.component';
//SERVICES
import { AccountsService } from '../accounts.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { EntitytagsService } from '../../entitytags/entitytags.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { NoteService } from '../../../@core/sharedComponents/notes/notes.service';
import { WorkTasksService } from '../../worktasks/worktasks.service';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { ActivityTimespan, DataSources, DownloadFileMimeType, Entity, ExportType, FileExtension, KanbanBoardTokenTypes, LayoutTypes, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, RefType, SectionCodes, UserTypeID } from '../../../@core/enum';
import { KanbanStage, KanbanStageCard, KanbanStagePauseEvent, KanbanStageTaskEvent } from '../../../@core/sharedModels/kanban-board.model';
import { IdValuePair } from '../../../@core/sharedModels/pair.model';
import { Note } from '../../../@core/sharedComponents/notes/note.model';
//OTHER
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Table } from 'primeng/table';
import { debounceTime, filter, forkJoin, fromEvent, map } from 'rxjs';
import { LocalStorageKey } from '../../../@core/enum';
import * as moment from 'moment';
import { SettingsService } from '../../settings/settings.service';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';
import { WorktaskAddComponent } from '../../worktasks/worktask-add/worktask-add.component';
import { OpportunityAddComponent } from '../../opportunities/opportunity-add/opportunity-add.component';
import { CaseAddComponent } from '../../cases/case-add/case-add.component';

@Component({
  selector: 'ngx-account-work-flow-list',
  templateUrl: './account-work-flow-list.component.html',
  styleUrls: ['./account-work-flow-list.component.scss']
})
export class AccountWorkFlowListComponent implements OnInit {
  
  entityRecordTypeId: number;

  showEntityRecordTypeLoader: boolean = false;
  showWorkflowLoader: boolean = false
  isDefaultGenaricWorkflowDetails: boolean;
  
  @ViewChild('searchTextInput', { static: false }) searchTextInput: ElementRef;
  @ViewChild('dt') private dt: Table;
  @ViewChild('kanbanStage') kanbanStage: StagesComponent;
  @ViewChild('activitySection') activitySection: ActivitySectionComponent;

  userTypeID = UserTypeID;

  pageTitle = 'CRM.ACCOUNT.LIST.TITLE';
  workflowName = '';

  entityTypeId: number = Entity.Accounts;
  rating: number = null;
  entityWorkflowId: number = 0;
  
  relatedEntityTypeId: number = 0;

  accountList: any[] = [];
  accountListByStages: any[] = [];
  accountAssignedTo: any;

  isBulkAssignAccounts: boolean;
  isAssignAccount: boolean = false;
  isExportAccounts: boolean = false;
  isImportAccounts: boolean = false;
  isDeleteAccount: boolean = false;
  isEditAccount: boolean = false;
  isAddAccount: boolean = false;
  isViewAccount: boolean = false;
  isListAccounts: boolean = false;
  isResumeTask: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  changeAccountStage: boolean = false;
  currencySymbol: any = null;
  hoursInDay:number = null;
  isAddWorkTask: boolean = false;
  isAddOpportunity: boolean = false
  isAddCase: boolean = false;

  customFilterConfig: any[] = [
  ];
  workflows: any;
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
      "sortColumn": "Name",
      "sortOrder": "asc",
      "entityIDs": "",
      "tagIDs": "",
      "assignedToIDs": "",
      "entityWorkflowId": this.entityWorkflowId,
      "entityTimespan": "LAST7DAYS",
      "entityTypeID": this.entityTypeId,
      "stageIDs":"",
      "rating": this.rating,
      "IsActive": false,
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
      "stageId": 42,
      "assignedToIDs": "",
      "entityIDs": "",
      "entityTimespan": "LAST7DAYS",
      "stageIDs":"",
      "rating": this.rating,
      "IsActive": false,
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

  observableStageAccountsList: any[] = [];

  // dynamic kanban
  isfilterLoaded = false;
  stages: Array<KanbanStage> = [];
  owner1List: Array<IdValuePair> = [];

  users: any = null; //assignable users
  relatedToEntityTypes: any = null; //related to entity records
  relatedTo: any = null; //related to entity records
  filterStage: any = null;

  //user detail
  _loggedInUser: any;
  localStorageKeyPrefix: string = "";

  //action menu
  isShowActionColumn: boolean = false;
  //right side activity menu
  isShowActivityCenter: boolean = false;
  refreshActivityCenter: boolean = false;
  selectedAccountForActivityCenter: any;
  selectedAccountIdForActivityCenter: number = 0;
  selectedAccountIsPausedForActivityCenter: boolean = false;
  selectedAccountIsActive: boolean = true;
  selectedRowId: number = 0;
  selectedCardExists: boolean = false;

  entityStagesWithTasksStorageKey: string = LocalStorageKey.AccountEntityStagesWithTasks;

  isAllCheckBoxSelected: boolean;
  entityDetails: any;

  keyfieldResponseData: any;
  showInActiveRecords: boolean = false;

  quickViewConfig: any;

  //Record Type Filter
  recordTypes: any;
  isRecordTypesFilterVisible: boolean;
  entityRecordType: any[];
  ratingOptions: any[] = [];


  rowActionButtonMouseHoverFlag: boolean = false;

  //WorkflowLayout based on layoutTypeID
  showBothKanbanAndListView: boolean = false;

  //status filter for listview.
  showLayout: any;
  StatusFilterLabel: any;
  StatusFilterPlaceholder: any;
  StatusColumnName: any;

  //Export Account
  dynamicColumnNameSetting: any = {};

  accountCreatedBy: number;

  opportunityRecordTypes: any;
  opportunityWorkflowList: any;
  refreshOpporunityTab: boolean = false;

  // worktask tab
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  refreshWorkTaskTab;
  entitySubTypes: any = [];
  workTaskSubTypeDetails: any;
  availableSubWorkTaskTypeNamesForAccountDelete: any;

  casesRecordTypes: any;
  casesWorkflowList: any;

  entityHiddenFieldSettings: any;

  countries: any;
  countryReadOnlyMask: any;
  
  constructor(private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _accountService: AccountsService,
    private _dataSourceService: DatasourceService,
    private _entitytagsService: EntitytagsService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _workTasksService: WorkTasksService,
    private _modalService: NgbModal,
    private _settingsService: SettingsService,
    private _confirmationDialogService: ConfirmationDialogService,
    private _noteService: NoteService,
    private _fileSignedUrlService: FileSignedUrlService) {
    //re use route
    this._router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };

    //initiate Permissions
    this.isAddAccount = this._commonHelper.havePermission(enumPermissions.AddAccount);
    this.isDeleteAccount = this._commonHelper.havePermission(enumPermissions.DeleteAccount);
    this.isEditAccount = this._commonHelper.havePermission(enumPermissions.EditAccount);
    this.isImportAccounts = this._commonHelper.havePermission(enumPermissions.ImportAccount);
    this.isListAccounts = this._commonHelper.havePermission(enumPermissions.ListAccounts);
    this.isViewAccount = this._commonHelper.havePermission(enumPermissions.ViewAccount);
    this.isResumeTask = this._commonHelper.havePermission(enumPermissions.ResumeTask);
    this.changeAccountStage = this._commonHelper.havePermission(enumPermissions.ChangeAccountStage);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadAccountDocument);
    this.isBulkAssignAccounts = this._commonHelper.havePermission(enumPermissions.BulkAssignAccounts);
    this.isExportAccounts = this._commonHelper.havePermission(enumPermissions.ExportAccount);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAddOpportunity = this._commonHelper.havePermission(enumPermissions.AddOpportunity);
    this.isAddCase = this._commonHelper.havePermission(enumPermissions.AddCase);
    this.isShowActionColumn = (this.isViewAccount && this.isEditAccount) || (this.isViewAccount && this.isDeleteAccount);
 
    //if list page record type wise
    this._activeRoute.params.subscribe(param => {
      if (param && param['id']) {
        this.entityWorkflowId = param['id'];
        this.dataSearch.isPageTabularView = false;
      }
    });

    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'name', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_NAME', visible: true, sort: true },
      { field: 'phone', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_PHONE', visible: true, sort: true },
      { field: 'email', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_EMAIL', visible: true, sort: true },
      { field: 'stageName', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_STAGE_NAME', visible: true, sort: true },
      { field: 'isActive', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_IS_ACTIVE', visible: false, sort: true },
      { field: 'assignedToName', header: 'CRM.ACCOUNT.LIST.TABLE_HEADER_ASSIGNEDTO', visible: true, sort: true },
      { field: 'id', header: '', visible: true, sort: false, class: "action ", display: 'td-display' }
    ];


    //set Action column show/hide dynamically
    if(!this.isEditAccount && !this.isDeleteAccount)
      {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = false;
      }

    // set storage key
    this.entityStagesWithTasksStorageKey = this.entityStagesWithTasksStorageKey + "_" + this.entityTypeId + (this.entityWorkflowId ? ("_" + this.entityWorkflowId) : '');
  }

  ngOnInit(): void {
    // get logged in user information
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();
    //set local storage key
    this.localStorageKeyPrefix = `${this._loggedInUser?.tenantId}_${this._loggedInUser?.userId}_${this.entityWorkflowId}`

    //get local storage for search
    let localPageLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_AccountWorkflowListKey, this.localStorageKeyPrefix));
    if (localPageLayout != null) {
      this.dataSearch = localPageLayout;
      // set default assigned to as logged in user
      if (this.dataSearch.params.assignedToIDs == "")
        this.dataSearch.params.assignedToIDs = this._loggedInUser.userId.toString();

      if (this.dataSearch.paramsByStage.assignedToIDs == "")
        this.dataSearch.paramsByStage.assignedToIDs = this._loggedInUser.userId.toString();
    }
    else {
      // set default assigned to as logged in user
      this.dataSearch.params.assignedToIDs = this._loggedInUser.userId.toString();
      this.dataSearch.paramsByStage.assignedToIDs = this._loggedInUser.userId.toString();

      this.dataSearch.isPageTabularView = localPageLayout?.isPageTabularView || false;
    }
    // set workflow id
    this.dataSearch.paramsByStage.entityWorkflowId = this.entityWorkflowId;
    this.dataSearch.params.entityWorkflowId = this.entityWorkflowId;

    // set page size
    this.dataSearch.paramsByStage.pageNo = 1;
    this.dataSearch.paramsByStage.pageSize = this._commonHelper.DefaultPageSizeForKanban;
    this.dataSearch.params.pageSize = this._commonHelper.DefaultPageSize;

    this.dataSearch.params.IsActive = !this.dataSearch.params.IsActive;
    this.dataSearch.paramsByStage.IsActive = !this.dataSearch.paramsByStage.IsActive;

    // get workflow details
    Promise.all([
      this.getWorkflowDetail(),
      this.getEntityStagesWithTask(),
      this.getCurrencySymbol(),
      this.getHoursInDay(),
      this.getEntityRecordTypes(),
      this.getWorkflowList(),
      this.getWorktaskWorkflowList(),
      this.getWorktaskWorkflowListForOpportunity(),
      this.getWorkflowListForCase(),
      this.getEntityHiddenField(),
      this.getEntitySubTypes(),
      this.getCountries()
    ]).then((results: any) => {
      if (results) {
        var workflow = results[0];
        this.workflowName = workflow.name;
        this.entityRecordTypeId = workflow.entityRecordTypeId;
        this.relatedEntityTypeId = workflow.parentEntityTypeId;
        this.getHeaderFilters();
        
        let StageColumn = this.cols.find(c => c.field == 'stageName');
        this.workTaskSubTypeDetails = this.entitySubTypes?.find(x => x.level == 1);

        if (workflow.layoutTypeID == LayoutTypes.ListView) {
          this.dataSearch.isPageTabularView = true;
          StageColumn.header = 'CRM.ACCOUNT.LIST.TABLE_HEADER_STATUS_NAME';
          this.StatusColumnName = (this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.EXPORT_STATUS_LABEL'));
        } else if (workflow.layoutTypeID == LayoutTypes.KanbanView) {
          this.dataSearch.isPageTabularView = false;
        } else if (workflow.layoutTypeID == LayoutTypes.KanbanAndListView) {
          this.showBothKanbanAndListView = true;
        }

        this.dynamicColumnNameSetting = {};
        this.dynamicColumnNameSetting["StageName"] = this.StatusColumnName;
        this.subscribeSearchboxEvent();
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
      this.selectedAccountIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
    }

    
    // get set quickview local storage config end
  }

  getWorkflowDetail(): Promise<any> {
    return new Promise((resolve, reject) => {

      //storage key
      let storageKey = `${LocalStorageKey.AccountWorkflowDetailsKey}_${this.entityWorkflowId}`;

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
            this.entityRecordTypeId = response?.entityRecordTypeId;
            this.isDefaultGenaricWorkflowDetails = response?.isDefault;
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
        this.entityRecordTypeId = workflowDetail?.entityRecordTypeId;
        //Show/Hide Record Type Filter.
        if (workflowDetail.isDefault) {
          this.isRecordTypesFilterVisible = false;
        } else {
          this.isRecordTypesFilterVisible = true;
        }
        this.isDefaultGenaricWorkflowDetails = workflowDetail?.isDefault;
        resolve(workflowDetail);
      }
    });
  }

  getHeaderFilters() {
    // other fileter master data
    const requestArray = [];

    const entityTimeSpans = this.getEntityTimespans();
    const requestAssignedToUsers = this.getAssigedToUsers(null, 1, '');
    const recordTypeList=this.getEntityRecordTypes();
    const requestTags = this.getAccountTags();
    const stageList=this.getStage();
    const rationList = this._commonHelper.setRatingOptions();

    requestArray.push(entityTimeSpans);
    requestArray.push(requestAssignedToUsers);
    requestArray.push(recordTypeList);
    requestArray.push(requestTags);
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
            label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_LABEL_ENTITYTIMESPAN'),
            name: 'entityTimespan',
            placeHolder: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_PLACEHOLDER_ENTITYTIMESPAN'),
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
            panelStyleClass : 'maxWidthOverride-sm',
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
          this.users = response;
          //set owner 1 list
          this.owner1List = response.map((i: any) =>
            ({ id: i.value, name: i.label }));
          this.users.push({ label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_OPTION_TEXT_ASSIGNEDTO'), value: 0 })
          this.users.sort((a, b) => a.value - b.value);
          //set selected user in dropdown
          let selectedUserIds: any[] = [];
          if (this.users.length > 0) {
            var selectedIdSString = this.dataSearch.isPageTabularView ? this.dataSearch.params.assignedToIDs : this.dataSearch.paramsByStage.assignedToIDs;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString.split(',');

              if (selectedIds.length > 0) {
                selectedIds.forEach((element: any) => {
                  const obj = this.users.find(x => x.value === parseInt(element))
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
            label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_LABEL_ASSIGNTO'),
            name: 'assignedToIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_PLACEHOLDER_ASSIGNTO'),
            ngModel: selectedUserIds.length == 0 ? '' : selectedUserIds,
            ngModelDefaultValue: this.users.filter(x => x.value == this._loggedInUser.userId).length > 0 ? [this._loggedInUser.userId] : null,
            ngModelDefaultObject: this.users.filter(x => x.value == this._loggedInUser.userId),
            optionLabel: 'label',
            optionValue: 'value',
            options: this.users,
            isHidden: false,
            defaultClass: 'basic-filter',
            panelStyleClass : 'maxWidthOverride-lg',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(assignedToFilter);

          //set in params
          this.dataSearch.paramsByStage.assignedToIDs = selectedUserIds.length == 0 ? '' : this.dataSearch.paramsByStage.assignedToIDs;
          this.dataSearch.params.assignedToIDs = selectedUserIds.length == 0 ? '' : this.dataSearch.params.assignedToIDs;
        }

        //Record Types
        if (results[2] != undefined) {
          let response = results[2] as any[];
          //record type list in dropdown
          this.entityRecordType = response;
          this.entityRecordType.push({ label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_OPTION_TEXT_RECORDTYPE'), value: 0 })
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
            label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_LABEL_RECORDTYPE'),
            name: 'entityRecordTypeIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_PLACEHOLDER_RECORDTYPE'),
            ngModel: selectedRecordTypeIds.length == 0 ? '' : selectedRecordTypeIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.entityRecordType,
            isHidden: this.isRecordTypesFilterVisible,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-lg',
            isCountableFilter: 1
          }

          // add to filter
          this.customFilterConfig.push(recordTypeFilter)
        }
        //tags
        if (results[3]) {
          const tags = (results[3] as []).map(this.getTags);
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
            label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_LABEL_TAGS'),
            name: 'tagIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_PLACEHOLDER_TAGS'),
            ngModel: selectedTagIds.length == 0 ? '' : selectedTagIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: tags,
            isHidden: false,
            group: true,
            defaultClass: 'basic-filter',
            panelStyleClass : 'maxWidthOverride-lg',
            isCountableFilter: 1
          }
          this.customFilterConfig.push(tagsFilter);
        }

        //Stage
        if(results[4] != undefined) {
          let Liststages = results[4] as any[];
         this.filterStage=Liststages;

          if (this.showLayout == LayoutTypes.ListView) {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_LABEL_STATUS');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_PLACEHOLDER_STATUS');
          }
          else {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_LABEL_STAGE');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_PLACEHOLDER_STAGE');
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
          defaultClass: 'basic-filter',
          panelStyleClass : 'maxWidthOverride-lg',
          isCountableFilter: 1
        }
        // add to filter
         this.customFilterConfig.push(stageFilter);
        }       
        
        //Rating
        if (results[5]) {
          let ratingOptions = results[5] as any[];
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

        //Show Inactive records
        let isShowInActiveRecords = this.dataSearch.isPageTabularView ? this.dataSearch.params.IsActive : this.dataSearch.paramsByStage.IsActive;
        let ShowInActiveFilter =
        {
          inputType: 'Checkbox',
          label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_ACTIVE_RECORDS'),
          name: 'IsActive',
          ngModel: !isShowInActiveRecords,
          ngModelDefaultValue: false,
          isHidden: false,
          isCountableFilter: 1
        }
        this.customFilterConfig.push(ShowInActiveFilter);
        if(ShowInActiveFilter.ngModel == true){
          this.filterCount ++;
        }

        //Insert "BookMark" filter
        let isStarred = this.dataSearch.isPageTabularView ? this.dataSearch.params.showStarred : this.dataSearch.paramsByStage.showStarred;
        let showStarredFilter =
        {
          inputType: 'Checkbox',
          label: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_STARRED')),
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

  multiSelectFilterEvent(event) {
    if (event && event.controlName == 'assignedToIDs') {
      this.getAssigedToUsers(event.selectedIds, 0, event.filter).then(results => {
        this.users = results;
        this.users.push({ label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_OPTION_TEXT_ASSIGNEDTO'), value: 0 })
        this.users.sort((a, b) => a.value - b.value);
        this.customFilterConfig[2].options = this.users;
      });
    }
  }

  isFilterVisibleChange(value:boolean){
    this.isFilterVisible = value;
  }

  showhideFilter(){
    this.isFilterVisible = !this.isFilterVisible;
  }

  getAssigedToUsers(selectedUserId, includeAllUsers, searchString: any): Promise<any> {
    // prepare params
    var params = this.prepareParamsForAssignedToUsers('', selectedUserId, includeAllUsers, searchString);
    // call datasource service with params
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ACCOUNTASSIGNEDTO, params);
  }

  getAccountTags(): Promise<any> {
    return this._entitytagsService.getActiveEntityTagsByEntityTypeId(this.entityTypeId, this.entityRecordTypeId);
  }

  getStage(): Promise<any> {
    const params= this.prepareParamsForEntityStagesByWorkflowId();
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITYSTAGESBYWORKFLOWID,params);
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

  // prepare params for datasource with required fields
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
  prepareParamsForRelatedTo() {
    const params = [];
    const paramItem0 = {
      name: 'SearchString',
      type: 'string',
      value: '',
    };
    params.push(paramItem0);
    const paramItem = {
      name: 'EntityWorkflowID',
      type: 'int',
      value: this.entityWorkflowId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'EntityTypeID',
      type: 'int',
      value: this.relatedEntityTypeId
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SearchString',
      type: 'string',
      value: ''
    };
    params.push(paramItem2);

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

  // when filter is changed
  getFilterValues(event) {
    let changefiltercount = 0;
    event.forEach(item => {
      let key = Object.keys(item)[0];

      if (this.dataSearch.params.hasOwnProperty(key))
        this.dataSearch.params[key] = item[key];

      if (this.dataSearch.paramsByStage.hasOwnProperty(key))
        this.dataSearch.paramsByStage[key] = item[key];

      if(item[Object.keys(item)[0]] != '' && item[Object.keys(item)[0]] && item[Object.keys(item)[0]] != ActivityTimespan.ALLTIME && item.isCountableFilter == 1){
        changefiltercount++;
      }
    });

    this.filterCount = changefiltercount;
    this.dataSearch.params.pageNo = 1;
    this.dataSearch.paramsByStage.pageNo = 1;

    //set account search filter
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AccountWorkflowListKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);
    
    this.dataSearch.params.IsActive =  !this.dataSearch.params.IsActive;
    this.dataSearch.paramsByStage.IsActive = !this.dataSearch.paramsByStage.IsActive;

    if (this.dataSearch.isPageTabularView) {
      this.getAccounts();
    }
    else {
      this.stages = [];
      this.accountList = [];
      this.prepareStages();
    }

    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedAccountIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  // get work accounts for list
  getAccounts() {
    this._commonHelper.showLoader();
    this._accountService.getWorkFlowAccounts(this.dataSearch.params).then((response: any) => {
      this.accountList = response;
      this.isAllCheckBoxSelected = false;
      // prepare short name for assignedTo
      this.accountList.forEach(account => {
        account['isSelected'] = false;
        if (account.phone) {
          const phoneDetail = String(account.phone).split('|');
          if (phoneDetail.length == 2) {
            account['countryCode'] = phoneDetail[0];
            account['phoneNumber'] = phoneDetail[1];
            account['phoneMask'] = String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0");
          } 
        }
        //find countryCode 
        // const phoneDetail = String(account.phone).split('|');
        //  if(phoneDetail.length == 2) {
        //   this.countryReadOnlyMask = String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0");
        // }else {
        //   this.countryReadOnlyMask = '0000000000'
        // }
      });

      // total
      this.totalRecords = this.accountList.length;
      this.totalRecords = this.accountList.length > 0 ? response[0].totalRecords : 0;
      this.dt.rows = this.dataSearch.params.pageSize;
      this.totalPages = Math.ceil(this.totalRecords / this.dataSearch.params.pageSize);
      this.end = this.dataSearch.params.pageNo == this.totalPages ? this.totalRecords : this.dataSearch.params.pageNo * this.dataSearch.params.pageSize;
      this.start = this.end == this.totalRecords ? (this.totalRecords - this.accountList.length + 1) : (this.end - this.dataSearch.params.pageSize) + 1;

      if (this.selectedAccountIdForActivityCenter != null && this.selectedAccountIdForActivityCenter > 0 && this.accountList.some(x=>x.id == this.selectedAccountIdForActivityCenter)) {
        this.updateEntityDetails(true, this.accountList.find(x=>x.id == this.selectedAccountIdForActivityCenter));
      }
      else{
        this.resetSelectedEntity();
      }
      this._commonHelper.hideLoader();
      this._fileSignedUrlService.getFileSingedUrl(this.accountList, 'assignedToImagePath', 'assignedToSignedUrl', Entity.Users);
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

  // get work accounts by stage
  getEntityStagesWithTask() {
    const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
    if (entityStagesWithTasks == null) {
      return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId).then(
        (response: any[]) => {
          this.accountListByStages = JSON.parse(JSON.stringify(response));
          this.accountListByStages.forEach((stage: any) => {
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
          this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.accountListByStages));
          this._commonHelper.hideLoader();
          resolve(null);
        }, 
          (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error.message);
          reject(null);
        });
      });
    }
    else {
      this.accountListByStages = entityStagesWithTasks;
    }
  }

  // prepare stages with accounts
  async prepareStages() {
    this.accountListByStages.forEach((stage: any) => {
      // stage view
      let kanbanStage: KanbanStage = {
        id: stage.id,
        name: stage.name,
        stage: "",
        totalItems: 0,
        totalOpportunityValue: 0,
        isCompleted: null,
        isClosed: null,
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

    // for each stage get data- wait for all the iteration promise values received
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

      this._accountService.getAccountsByStage(this.getParamObj(stageId)).then(
        (accounts: any) => {
          this.accountList.push(...accounts);
          // for each account prepare card
          let kanbanStageCards: KanbanStageCard[] = [];
          accounts.forEach((account: any) => {
            // set total
            this.stages[index].totalItems = account.totalRecords;

            const taskIds: Array<number> = account.selectedStageTaskIDs
              ? account.selectedStageTaskIDs.split(",").map(m => Number(m))
              : [];


            // check if the current assigned to and logged in user is same
            var isSelectedAccountsDisabled: boolean = true;
            var showPauseResumeButtons: boolean = false;
            let canUserMoveAccount: boolean = this.canUserChangeStage(this.stages[index], account);

            // check hidden
            if ((account.assignedTo == this._loggedInUser.userId || this.isResumeTask) && this.isEditAccount) {
              isSelectedAccountsDisabled = false;
              showPauseResumeButtons = true;
            }
            let settingsJson = JSON.parse(account.settingsJson);

            // prepare card data
            let kanbanStageCard: KanbanStageCard = {
              id: account.id,
              stageId: account.stageId,
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
              parentTokenType: KanbanBoardTokenTypes[settingsJson.ParentTokenType as keyof typeof KanbanBoardTokenTypes],
              parentLabel: settingsJson.TokenText,
              parentLabelTooltip1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.ParentTokenTooltip)),
              parentLabelRedirectUrl: settingsJson.ParentTokenUrl,
              entityId: account.entityId,
              entityTypeId: account.entityTypeId,
              entityTypeName: account.entityTypeName,
              relatedToLabel: account.entityName,
              relatedToTooltip: "Related To",
              relatedToRedirectURL: this.onRelatedToClick(account),
              selectedTasks: (this.stages[index].tasks || []).filter(f => taskIds.includes(f.id)) || [],
              selectedTasksDisabled: isSelectedAccountsDisabled,
              isActive: account.isActive,
              isPaused: account.isPaused,
              isPausedTooltip: account.isPaused != null && account.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LABEL_SWITCH_PAUSE'),
              pausedLabel: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LABEL_SWITCH_PAUSE'),
              resumeLabel: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LABEL_SWITCH_RESUME'),
              resumeNotAccess: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_RESUME_NOT_ACCESS'),
              showPauseResumeButtons: showPauseResumeButtons,
              canUserChangeStage: canUserMoveAccount,
              owner1Id: account.assignedTo,
              owner1Name: account.assignedToName,
              owner1ShortName: account.assignedToShortName,
              owner1Image: account.assignedToImagePath,
              owner1Tooltip: account.assignedToName,
              owner1BGColor: account.assignedToAvatarBGColor,
              owner1userTypeId: this.userTypeID.AssignedTo,
              disabled: ((account.isPaused ?? false) || !account.isActive),
              stageName: account.stageName,
              entityIcon: 'fas fa-building',
              entityRecordTypeId: account?.entityRecordTypeID,
              entityRecordTypeName: account.entityRecordTypeName,
              entityName: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TITLE'),
              createdBy: account?.createdBy,
              stagesTasks: this.stages[index]?.tasks,
              rating: account.rating,
              review: account.totalReviews,
              created: account?.created,
              entityReviewID: account.entityReviewID,
              isEntityReviewEditable: !(account.isPaused ?? false),
              workTaskTypeName: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_WORKTASKS.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
              workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
              userLabel1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('COMMON.COMMON_USER_PROFILE.LABEL_ASSIGNEDTO')),
              isStarred: account?.isStarred,
              isResumeRecord: this.isResumeTask,
              loggedInUser: this._loggedInUser.userId,
              isShowPauseOrResume: true
            }

            if (!isAppend && this.selectedAccountIdForActivityCenter != null && this.selectedAccountIdForActivityCenter > 0 && kanbanStageCard.id == this.selectedAccountIdForActivityCenter) {
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
          if (accounts.length == 0 || accounts == undefined) {
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

  private canUserChangeStage(currentStage, account): boolean {
    if (currentStage == null || account == null) {
      return true;
    }

    let canUserMoveAccount: boolean = false;
    if (currentStage.transitionAssociates != null && currentStage.transitionAssociates != '') {
      const associates = currentStage.transitionAssociates.trim().split(',');
      associates.forEach(associate => {
        const associatePropertyName = this._commonHelper.convertToCamalize(associate);
        canUserMoveAccount = canUserMoveAccount || (account.hasOwnProperty(associatePropertyName) ? (account[associatePropertyName] == this._loggedInUser.userId) : false);
      });
    }
    else {
      canUserMoveAccount = true;
    }
    return canUserMoveAccount
  }

  //get entity stage wise data
  getEntityStageData(stageId, isAppend) {
    let index: number = this.stages.findIndex(el => el.id == stageId);
    //remove from list view
    this.accountList = this.accountList.filter((item) => item.stageId !== stageId);
    //get data
    this.getStageItems(index, isAppend).then(() => {
      this._fileSignedUrlService.getFileSingedUrl(this.stages[index].cards, 'owner1Image', 'owner1SignedUrl', Entity.Users);
    });
  }

  //page layout toggle table or grid(kanbar)
  onTogglePageLayout(pageLayout: string) {
    if (pageLayout === 'CARD') {
      // reset
      this.dataSearch.paramsByStage.pageNo = 1;
      this.stages = [];
      this.accountList = [];
      // prepare stages
      this.prepareStages();
      this.dataSearch.isPageTabularView = false;
    } else {
      this.dataSearch.isPageTabularView = true;
      this.dataSearch.params.pageNo = 1;
      this.accountList = [];
      this.getAccounts();
    }
      
    //set hidden for stage filter
      let stageFilter =  this.customFilterConfig.find(x => x.name === 'stageIDs');
      if (stageFilter) {
        stageFilter['isHidden'] = pageLayout === 'CARD';
      }

    this.resetSelectedEntity();

    //set account search filter
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AccountWorkflowListKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);

    //set quickview config
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedAccountIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  //account card drag-drop to other card
  onDropSuccess(event: CdkDragDrop<{}[]>) {
    //check can user change stage
    if (!event.item.data.canUserChangeStage) {
      if (this.changeAccountStage) {
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterDropSuccess(event);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
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
      const accountId = event.item.data.id;
      const accountStageId = +event.item.data.stageId;

      //Check Is All Stage Tasks Required for current Entity Stage before move onto the next Entity Stage.
      const isAllTasksRequired = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageIsAllTasksRequired').innerHTML;
      const previousStageId = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;

      // if any one of the current stage task is required
      let anyTasksIsRequired: boolean = false;
      let requiredTasks: any[] = [];
      // find out the current stage
      let currentStage = this.accountListByStages.find(x => x.id == previousStageId);
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
          * Call API to validate account has completed the stage tasks (which are required) before moving on to other stage.
          * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (AccountId)
          * */
        let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
        this._commonHelper.showLoader();
        this._workflowmanagementService.isEntityStageTasksCompleted(accountId, this.entityTypeId, accountStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response === true) {
            this.moveEntity(event);
          } else {
            //Stage Tasks are not completed..
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_BEFORE_MOVE_ACCOUNT_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
            return false;
          }
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
      else if (isAllTasksRequired && isAllTasksRequired.toLowerCase() == "true") {
        /**
         * Call API to validate account has completed all the stage tasks before moving on to other stage.
         * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (AccountId)
         * */
        this._commonHelper.showLoader();
        this._workflowmanagementService.isEntityStageTasksCompleted(accountId, this.entityTypeId, accountStageId, this.entityWorkflowId, null).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response === true) {
            
            this.dataSearch.paramsByStage.pageNo = 1;
            let oldStage = this.stages.find(x => x.id == event.item.data.stageId);
            oldStage.pagination.pageNo = oldStage ? this.dataSearch.paramsByStage.pageNo : 1;

            this.moveEntity(event);
          } else {
            //Stage Tasks are not completed..
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_BEFORE_MOVE_ACCOUNT_STAGE_TASK_SHOULD_BE_COMPLETED'));
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
  }

  moveEntity(event: CdkDragDrop<{}[]>) {
    const accountId = event.item.data.id;
    const accountStageId = +event.item.data.stageId;
    const dropAccountStageId = +event.container.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;
    const dropAccountStageName = event.container.element.nativeElement.querySelector('div .cards-header #stageName').innerHTML;
    const isNoteRequired = event.container.element.nativeElement.querySelector('div .cards-header #stageNoteRequired').innerHTML;
    const assignedTo = event.item.data.owner1Id;
    const stageName = event.item.data.stageName;
    let currentStage = this.stages.find(x => x.id == accountStageId);
    let dropStage = this.stages.find(x => x.id == dropAccountStageId);

    // check if note is required
    if (isNoteRequired == 'true') {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = accountId;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropAccountStageName }))}`;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(noteDate => {
        if (noteDate != undefined) {
          // save to transition
          Promise.all([
            this.saveAccountStage(accountId, accountStageId, dropAccountStageId, dropAccountStageName, assignedTo, stageName)
          ]).then(() => {
            const param = {
              entityTypeId: this.entityTypeId,
              entityId: accountId,
              workflowId: this.entityWorkflowId,
              workflowStageId: dropAccountStageId,
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

              this.getEntityStageData(accountStageId, false); // refresh current stage
              this.getEntityStageData(dropAccountStageId, false); // refresh drop stage
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
        this.saveAccountStage(accountId, accountStageId, dropAccountStageId, dropAccountStageName, assignedTo, stageName)
      ]).then(() => {

        currentStage.pagination.pageNo = 1; //reset current pagination stats of source stage
        dropStage.pagination.pageNo = 1; //reset current pagination stats of target stage
        this.dataSearch.paramsByStage.pageNo = 1 //rest global stage params pagination stage

        this.getEntityStageData(accountStageId, false); // refresh current stage
        this.getEntityStageData(dropAccountStageId, false); // refresh drop stage
      }).catch(() => {
        //this.refreshData();
      });
    }
  }

  saveAccountStage(accountId, accountStageId, dropAccountStageId, dropAccountStageName, assignedTo, stageName) {
    return new Promise((resolve, reject) => {
      let assignedToForDto = assignedTo;
      this._commonHelper.showLoader();
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: accountId, stageId: dropAccountStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedTo, oldStageId: accountStageId }).then((response: any) => {
        if (response) {

          this.accountAssignedTo = response;
          if (assignedToForDto != this.accountAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._accountService.updateAccountAssignedTo({ entityId: accountId, assignedToId: this.accountAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.accountAssignedTo.isForcedAssignment, stageId: dropAccountStageId }).then((response: any) => {
              if (response) {
                assignedToForDto = this.accountAssignedTo.assignedToId;
                // success message
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_ACCOUNT_MOVETO_STAGE',
                    { stageName: dropAccountStageName })
                );
              }
              resolve(null);
              this._commonHelper.hideLoader();
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
              this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_ACCOUNT_MOVETO_STAGE', { stageName: dropAccountStageName })
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
    });
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

  onEntityStageClick(account) {
    // check logged in user have permission to view user details
    if (!this.isEditAccount || !this.isViewAccount || account.isPaused) {
      return;
    }

    //check can user change stage
    const currentStageDetail = this.accountListByStages.find(s => s.id == account.stageID);
    const canUserChangeStage: boolean = this.canUserChangeStage(currentStageDetail, account);

    if (!canUserChangeStage) {
      if (this.changeAccountStage) {
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterEntityStageClick(account);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
      }
    }
    else {
      this.afterEntityStageClick(account);
    }
  }

  private afterEntityStageClick(account) {
    // get data from event
    let accountId = account.id;
    let accountStageId = account.stageID;
    let assignedTo = account.assignedTo;
    let stageName = account.stageName;
    // prepare params
    var params = this.prepareParamsForEntityStages();

    let entityStageDialogTitle: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ENTITY_STAGE_DIALOG.DIALOG_TITLE_STATUS') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ENTITY_STAGE_DIALOG.DIALOG_TITLE');
    let entityStageDialogFieldLabel: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_LABEL') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_LABEL');
    let entityStageDialogFieldPlaceholder: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_PLACEHOLDER') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_PLACEHOLDER');

    // call datasource service with params
    this._commonHelper.showLoader();
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
        this.modalRef.componentInstance.entityStageId = accountStageId;
        this.modalRef.componentInstance.dialogTitle = entityStageDialogTitle;
        this.modalRef.componentInstance.entityStageSelectLabel = entityStageDialogFieldLabel;
        this.modalRef.componentInstance.entityStageChangeSelectReasonLabel = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_REASON_LABEL');
        this.modalRef.componentInstance.entityStageSelectPlaceholder = entityStageDialogFieldPlaceholder;
        this.modalRef.componentInstance.entityStageChangeReasonLabel = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_LABEL');
        this.modalRef.componentInstance.entityStageChangeReasonPlaceholder = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_PLACEHOLDER');
        this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
        this.modalRef.componentInstance.OnChangeEntityStage.subscribe((selectedEntityStageInfo) => {
          // get changed stage and reason if it is there
          let selectedEntityStageChangeReason = null;
          let selectedEntityStageId = selectedEntityStageInfo.entityStageId;
          if (selectedEntityStageInfo.stageReason != null) {
            selectedEntityStageChangeReason = selectedEntityStageInfo.stageReason.label;
          }
          let stageChangeReasonDescription = selectedEntityStageInfo.entityStageChangeReason;
          // if selected stage and current stage are same - don't do anything
          if (selectedEntityStageId != undefined && selectedEntityStageId != null && selectedEntityStageId != accountStageId) {
            // prepare object to send to backend to save
            const selectedEntityStageDetail = this.accountListByStages.find(s => s.id == selectedEntityStageId);
            const prevEntityStageDetail = this.accountListByStages.find(s => s.id == accountStageId);

            let dropAccountStagename = selectedEntityStageDetail.name;

            let isAllTasksRequired = prevEntityStageDetail?.isAllTasksRequired;

            // if any one of the current stage task is required
            let anyTasksIsRequired: boolean = false;
            let requiredTasks: any[] = [];
            // find out the current stage
            let currentStage = this.accountListByStages.find(x => x.id == accountStageId);
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
                * Call API to validate account has completed the stage tasks (which are required) before moving on to other stage.
                * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (AccountId)
                * */
              let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
              this._commonHelper.showLoader();
              this._workflowmanagementService.isEntityStageTasksCompleted(accountId, this.entityTypeId, accountStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
                this._commonHelper.hideLoader();
                if (response === true) {
                  this.moveEntityFromList(accountId, accountStageId, selectedEntityStageId, dropAccountStagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, stageName, this.modalRef);
                } else {
                  //Stage Tasks are not completed..
                  this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_BEFORE_MOVE_ACCOUNT_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
                  return false;
                }
              }, (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
            }
            else if (isAllTasksRequired) {
              /**
               * Call API to validate account has completed all the stage tasks before moving on to other stage.
               * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (AccountId)
               * */
              this._commonHelper.showLoader();
              this._workflowmanagementService.isEntityStageTasksCompleted(accountId, this.entityTypeId, accountStageId, this.entityWorkflowId, null).then((response: any) => {
                this._commonHelper.hideLoader();
                if (response === true) {
                  this.moveEntityFromList(accountId, accountStageId, selectedEntityStageId, dropAccountStagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, stageName, this.modalRef);
                } else {
                  //Stage Tasks are not completed..
                  this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_BEFORE_MOVE_ACCOUNT_STAGE_TASK_SHOULD_BE_COMPLETED'));
                  return false;
                }
              }, (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
            } else {
              this.moveEntityFromList(accountId, accountStageId, selectedEntityStageId, dropAccountStagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, stageName, this.modalRef);
            }
          }
          else {
            this.modalRef.close();
          }
        });
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  moveEntityFromList(accountId, accountStageId, selectedEntityStageId, stagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, stageName, modalRef: NgbModalRef) {
    if (selectedEntityStageChangeReason != null || stageChangeReasonDescription != null) {
      // prepare reason as a note
      let note = new Note({});
      note.id = 0;
      note.tenantId = this._loggedInUser.tenantId;
      note.entityTypeId = this.entityTypeId;
      note.entityId = accountId;
      note.entityRecordTypeID = null;
      note.subject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: stagename }))}`;
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
          this.saveAccountStage(accountId, accountStageId, selectedEntityStageId, stagename, assignedTo, stageName)
        ]).then(() => {
          const param = {
            entityTypeId: this.entityTypeId,
            entityId: accountId,
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
      const selectedEntityStageDetail = this.accountListByStages.find(s => s.id == selectedEntityStageId);
      let stagename = selectedEntityStageDetail.name;
      Promise.all([
        this.saveAccountStage(accountId, accountStageId, selectedEntityStageId, stagename, assignedTo, stageName)
      ]).then(() => {
        modalRef.close();
        this.refreshData();
      }).catch(() => {
        modalRef.close();
        this.refreshData();
      });
    }
  }

  //card click navigate to detail page
  onClickAccountCard(ev, account) {
    if (!account.isConvertedToProspect) {
      if ((ev.tagName.toLowerCase() === 'p') || (ev.tagName.toLowerCase() === 'section')) {
        this._router.navigateByUrl('/accounts/details/' + account.id + "/" + this.entityWorkflowId);
      }
    }
  }

  // event emitted from kanban
  onAccountClick(account) {
    // check logged in user have permission to view work account details
    if (!this.isViewAccount) {
      return;
    }

    // if not undefined then redirect
    if (account.id != undefined) {
      this._router.navigateByUrl('/accounts/details/' + account.id);
    }
  }

  // event emitted from kanban
  onRelatedToClick(account) {
    // check logged in user have permission to view related entity details
    if (!this.userHavePermissionOfRelatedTo(account)) {
      return this._router.url;
    }

    // if not undefined then redirect
    if (account.entityTypeName != undefined && account.entityId != undefined) {
      return '/' + account.entityTypeName.toLowerCase() + '/details/' + account.entityId;
    }
    return this._router.url;
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
    this._commonHelper.changeEntityReviewDataCallback();
    const taskIds: Array<number> = rowData.selectedStageTaskIDs ? rowData.selectedStageTaskIDs.split(",").map(m => Number(m)) : [];

    const stageTasks = this.accountListByStages?.find(x => x.id == rowData?.stageID)?.stageTasks;
    const settingsJson = JSON.parse(rowData.settingsJson);

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
      entityRecordTypeId: rowData?.entityRecordTypeID,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      stagesTasks: stageTasks,
      selectedTasks: (stageTasks || []).filter(f => taskIds.includes(f.id)) || [],
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      isActive: rowData?.isActive,
      isPaused: rowData?.isPaused,
      createdBy: rowData?.createdBy,
      workTaskTypeName: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_WORKTASKS.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
      workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
      relatedToRedirectURL: this.onRelatedToClick(rowData),
      isStarred: rowData?.isStarred,
      isResumeRecord: this.isResumeTask,
      loggedInUser: this._loggedInUser.userId,
      isShowPauseOrResume: true
    };

    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id; 
    this.accountCreatedBy = rowData?.createdBy;

    this.selectedAccountForActivityCenter = rowData;
    this.selectedAccountIdForActivityCenter = rowData.id;
    this.selectedAccountIsPausedForActivityCenter = (rowData?.isPaused ?? false);
    this.selectedAccountIsActive = rowData.isActive;
    
    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedCardEntityId: this.selectedRowId,
      selectedRowEntityId: this.selectedRowId
    }

    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewAccount);
  }

  // event emitted from kanban
  onCardClick(account, isShowActivityCenter:boolean = null) {
    account.entityWorkflowId = this.entityWorkflowId;
    this.accountCreatedBy = account?.createdBy;
    this.entityDetails = this._commonHelper.cloningObject(account);
    this.selectedAccountForActivityCenter = account;
    this.selectedAccountIdForActivityCenter = account.id;
    this.selectedAccountIsPausedForActivityCenter = (account.isPaused ?? false);
    this.selectedAccountIsActive = account.isActive;
    
   
    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedCardEntityId: account.id,
      selectedRowEntityId: account.id
    };

    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewAccount);
  }

  onEntityStageTasksSelect(event) {
    if (!this.dataSearch.isPageTabularView) {
      const currentStage = this.stages?.find(s => s.id == event.stageId);
      const currentCard = currentStage?.cards?.find((k: any) => k.id == event.id)
      currentCard.selectedTasks = event?.selectedTasks;
    } else {
      const temp = this.accountList.find(x => x.id == event.id);
      temp.selectedStageTaskIDs = event.selectedTasks.map(x => x.id).toString();
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
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewAccount;
        this.selectedAccountIdForActivityCenter = details.id;
        this.selectedAccountForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedAccountIsPausedForActivityCenter = (details?.isPaused ?? false);
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

  private getWorktaskWorkflowListForOpportunity() {
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
            this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_OPTION_TEXT_WORKFLOW') });
        this.opportunityWorkflowList.sort((a, b) => a.value - b.value);
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
    if (this.kanbanStage) {
      this.kanbanStage.selectedCard = 0;
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

  // stage account changed event
  onAccountStageTaskChanged(event: KanbanStageTaskEvent) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: event.card.id,
      entityStageId: event.stage.id,
      entityTaskIds: event.tasks ? event.tasks.map(t => t.id).toString() : '',
      entityWorkflowId: this.entityWorkflowId
    }
    this._commonHelper.showLoader();
    this._workflowmanagementService.saveEntityStageTaskTransition(params)
      .then(() => this._commonHelper.hideLoader(),
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
  }

  onAccountStagePauseChanged(account: any, isPaused: boolean) {
    if(!this.isEditAccount){ return; }

    if (account.owner1Id !== this._loggedInUser.userId) {
      let message = "";
      if (account.owner1Id == null || account.owner1Id == "" || account.owner1Id == undefined) {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.accountStagePauseChangeList(account, isPaused);
          }
        });
    }
    else if (account.owner1Id == this._loggedInUser.userId) {
      this.accountStagePauseChangeList(account, isPaused);
    }
  }

  accountStagePauseChangeList(account, isPaused: boolean) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: account.id,
      entityStageId: account.stageId,
      isPaused: isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: account.owner1Id,
      noteID: null
    };

    if (params.isPaused) {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = account.id;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.PAUSE_REASON_NOTE_SUBJECT', { stageName: account.stageName }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = account.stageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(noteDate => {
        if (noteDate) {
          params.noteID = noteDate.id;
          this.saveEntityStagePauseTransitionFromList(params, account);
        }
      });
    }
    else {
      const noteParam = {
        entityTypeId: this.entityTypeId,
        entityId: account.id,
        entityRecordTypeID: null,
        subject: null,
        isPrivate: false,
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.RESUME_NOTE_DESCRIPTION', { stageName: account.stageName }))}`,
        createdBy: this._loggedInUser.userId
      };

      this._commonHelper.showLoader();
      this._noteService.addNewNote(noteParam).then((response: any) => {
        if (response) {
          params.noteID = response.id;
          this.saveEntityStagePauseTransitionFromList(params, account);
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

  saveEntityStagePauseTransitionFromList(params, account) {
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
          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_RESUME_SUCCESS'));
          account.isPaused = params.isPaused;

          //record update for List view.
          let updateEntityPauseStatusForList = this.accountList.find(x => x.id == account.id);
          updateEntityPauseStatusForList.isPaused = account.isPaused;

          //record update for Card view.
          if (this.kanbanStage) {
            let card: any = {};
            card.id = account.id;
            card.stageId = account.stageId;
            card.isPaused = params.isPaused;
            card.disabled = params.isPaused ? true : false;
            this.kanbanStage.updateEntityPauseStatus(card);
          }

          //update Activity Center
          if (account.id == this.selectedAccountIdForActivityCenter) {
            this.updateEntityDetails(false, account);
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
  onAccountStagePauseChangedFromCard(event: KanbanStagePauseEvent) {
    if (event.card.owner1Id !== this._loggedInUser.userId) {
      let message = "";
      if (event.card.owner1Id == null || event.card.owner1Id == undefined) {
        message = event.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = event.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.accountStagePauseChange(event);
          }
        });
    }
    else if (event.card.owner1Id == this._loggedInUser.userId) {
      this.accountStagePauseChange(event);
    }
  }

  accountStagePauseChange(event: KanbanStagePauseEvent) {
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
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = event.card.id;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.PAUSE_REASON_NOTE_SUBJECT', { stageName: event.stage.name }))}`;
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
    }
    else {
      const noteParam = {
        entityTypeId: this.entityTypeId,
        entityId: event.card.id,
        entityRecordTypeID: null,
        subject: null,
        isPrivate: false,
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.RESUME_NOTE_DESCRIPTION', { stageName: event.stage.name }))}`,
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
          const accountInfo = this.accountList.find(x => x.id == params.entityId);
          if (accountInfo) {
            event.card.disabled = !accountInfo.isActive || params.isPaused;
          }

          event.card.isPaused = params.isPaused;
          event.card.isPausedTooltip = params.isPaused != null && params.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LABEL_SWITCH_PAUSE');

          //update Activity Center
          if (event.card.id == this.selectedAccountIdForActivityCenter) {
            this.updateEntityDetails(false, event.card);
          }
          event.card.isEntityReviewEditable = !(event.card?.isPaused ?? false);
          this.kanbanStage.updateEntityPauseStatus(event.card);

          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.MESSAGE_RESUME_SUCCESS'));
          this._commonHelper.hideLoader();
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
      },
        (error) => {
          this._commonHelper.hideLoader();
          event.card.isPausedTooltip = event.card.isPaused != null && event.card.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LABEL_SWITCH_PAUSE');
          this.kanbanStage.updateEntityPauseStatus(event.card);

          this.getTranslateErrorMessage(error);
        });
  }

  // assigned to user what to do
  onAssignedToClick(event, account) {
    if (!this.isEditAccount || (account != null ? (!account.isActive || (account.isPaused ?? false)) : event.card.disabled))
    {
      return;
    }
    // get data from event
    let assignedToId = account != null ? account.assignedTo : event.card.owner1Id; //owner 1 is assigned to
    let accountId = account != null ? account.id : event.card.id;
    let accountStageId = account != null ? account.stageID : event.card.stageId;

    //DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    var params = this.prepareParamsForAssignedToUsers(accountStageId, assignedToId);
    // call datasource service with params
    this._commonHelper.showLoader();
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ACCOUNTASSIGNEDTO, params).then((response: any) => {
      //set owner 1 list
      let assignedToUsers = response;
      this._commonHelper.hideLoader();

      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      // open dialo
      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(UserAssignDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.users = assignedToUsers;
      this.modalRef.componentInstance.assignedUserId = assignedToId;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ASSIGNED_TO_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        let obj = {
          entityId: accountId,
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: accountStageId
        };

        this._commonHelper.showLoader();
        this._accountService.updateAccountAssignedTo(obj).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response) {
            this.accountAssignedTo = response;
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: this.entityTypeId, entityId: accountId, entityWorkflowId: this.entityWorkflowId, stageId: accountStageId, assignedTo: selectedUserId }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_ACCOUNT_ASSIGNEDTO'));
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
            this.getEntityStageData(accountStageId, false);
          } else {
            this.dataSearch.params.pageNo = 1;
            this.accountList = [];
            this.getAccounts();
          }
          // closes
          this.modalRef.close();
        },
          (error) => {
            this.handlePausedOrDeleteTaskError(error, accountStageId);
            this._commonHelper.hideLoader();
            this.modalRef.close();
            if (error != null && String(error.messageCode).toLowerCase() === 'accounts.closedorcompleted') {
              this._commonHelper.showToastrError(error.message);
            } else {
              this.getTranslateErrorMessage(error);
            }
          });
      });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  // refresh all data
  refreshData() {
    if (!this.dataSearch.isPageTabularView) {
      // reset
      this.dataSearch.paramsByStage.pageNo = 1;
      this.stages = [];
      this.accountList = [];
      // prepare stages
      this.prepareStages();
    } else {
      this.dataSearch.params.pageNo = 1;
      this.accountList = [];
      this.getAccounts();
    }
  }

  //transferArrayItem kanban card layout
  transferArrayItem(event) {
    if (event != null) {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  openAccountImport() {
    this.modalRef = this._modalService.open(AccountImportDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.refreshData();
      }
    });
  }

  // open add popup
  addAccount() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(AccountAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
    this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.entityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.workflows = this.workflows?.filter(x => x.value != 0);
    this.modalRef.componentInstance.recordTypes = this.recordTypes?.filter(s => s.value != 0);
    this.modalRef.componentInstance.isShowAssignedTo = true;
    this.modalRef.componentInstance.isShowWorkflow = this.isDefaultGenaricWorkflowDetails;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.refreshData();
      }
    });
  }

  //delete work account - confirmation dialog
  onDeleteAccountClick(accountId) {
    let params = {
      "entityId": accountId,
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
              this.deleteAccountWithRelatedWorkTasks(accountId);
            }
            else {
              this.deleteAccount(accountId);
            }
          }
        });
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      })
      .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ACCOUNT_DISMISS_DIALOG')));
  }

  private deleteAccount(accountId) {
    this._commonHelper.showLoader();
    this._accountService.deleteAccount(accountId).then(response => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_ACCOUNT_DELETED')
      );
      this.totalRecords = this.totalRecords - 1;
      this.dataSearch.params.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.dataSearch.params.pageSize) : 1;
      // get work accounts
      this.refreshData();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private deleteAccountWithRelatedWorkTasks(accountID) {
    this._commonHelper.showLoader();
    this._accountService.deleteAccountWithRelatedWorkTasks(accountID).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_ACCOUNT_DELETED')
      );
      this.totalRecords = this.totalRecords - 1;
      this.dataSearch.params.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.dataSearch.params.pageSize) : 1;
      this.refreshData();
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
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

  getTranslateErrorMessage(error) {
    if (error && error.messageCode) {
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

  paginate(event) {
    this.dataSearch.params.pageNo = (event.first / event.rows) + 1;
    this.dataSearch.params.pageSize = event.rows;
    this.getAccounts();
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
      this.getAccounts();
    }
  }

  changePage() {
    if (this.dataSearch.params.pageNo <= this.totalPages && this.dataSearch.params.pageNo > 0) {
      this.dataSearch.params.pageNo = this.dataSearch.params.pageNo > 0 ? this.dataSearch.params.pageNo : 1;
      this.getAccounts();
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
    this.getAccounts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to previous page
  prev() {
    this.dataSearch.params.pageNo = this.dataSearch.params.pageNo - 1 > 0 ? this.dataSearch.params.pageNo - 1 : 1;
    if (this.end == this.dataSearch.params.pageSize) {
      return false;
    }
    this.getAccounts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to next page
  next() {
    this.dataSearch.params.pageNo = (this.dataSearch.params.pageNo + 1) <= this.totalPages ? this.dataSearch.params.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getAccounts();
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
      this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedAccountIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
    }
    // get set quickview local storage config end

  }

  /* multi-select */
  isAllSelected() {
    const selectedAccountListCount = this.accountList.filter(x => x.isSelected).length;
    if (this.accountList.length == selectedAccountListCount) {
      this.isAllCheckBoxSelected = true;
    } else {
      this.isAllCheckBoxSelected = false;
    }
  }

  checkUncheckAll() {
    this.accountList.forEach(account => {
      if (!account.isPaused && account.isActive) {
        account.isSelected = this.isAllCheckBoxSelected;
      }
    });
  }

  // assign bulk tasks to user
  assignBulkUsersToAccounts() {

    if (this.accountList.filter(f => f.isSelected).length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_SELECT_ONE_USER'));
      return;
    }

    const distinctStages = [...new Set(this.accountList.filter(f => f.isSelected).map(item => item.stageID))];

    if (distinctStages.length > 1) {
      this.showLayout == LayoutTypes.ListView ? this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_SELECT_SAME_STATUS')) :
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_SELECT_SAME_STAGE'));
      return;
    }

    const params = this.prepareParamsForAssignedToUsers(distinctStages[0], '');
    this._commonHelper.showLoader();
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ACCOUNTASSIGNEDTO, params).then((response: any) => {
      //set owner 1 list
      const assignedToUsers = response;
      this._commonHelper.hideLoader();
      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(UserAssignDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.users = assignedToUsers;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ASSIGNED_TO_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // get selected
        const selectedAccount = [...new Set(this.accountList.filter(f => f.isSelected).map(item => item.id))];

        // prepare object to send to backend to save
        const obj = {
          selectedAccountIds: selectedAccount.toString(),
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: distinctStages[0]
        };

        this._commonHelper.showLoader();
        this._accountService.updateBulkAssignedToUsers(obj).then((response: any) => {
          this._commonHelper.hideLoader();
          this.modalRef.close();
          this.refreshData();
          if (response) {
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.MESSAGE_ACCOUNT_BULKASSIGNEDTO'));
          }
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            this.modalRef.close();
            if (error != null && String(error.messageCode).toLowerCase() === 'accounts.norunningtaskfound') {
              this.refreshData();
            }
          });
      });
    });
  }

  private handlePausedOrDeleteTaskError(error: any, workTaskStageId: number) {
    if (error != null && (String(error.messageCode).toLowerCase() === 'accounts.pausedordeleteerror' || String(error.messageCode).toLowerCase() === 'entitystage.pausedordeleteerror')) {
      if (!this.dataSearch.isPageTabularView) {
        // refresh current stage
        this.getEntityStageData(workTaskStageId, false);
      } else {
        this.dataSearch.params.pageNo = 1;
        this.accountList = [];
        this.getAccounts();
     }
    }
  }
  
  exportExcel() {
    this.exportAccount(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportAccount(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();

    let excelExportPayload = this._commonHelper.cloningObject(this.dataSearch.params);
    excelExportPayload.exportType = exportType;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    let fileName = this._commonHelper.getConfiguredEntityName('{{Accounts_plural_p}}') + `_${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;

    if (!this.dataSearch.isPageTabularView) {
      excelExportPayload.stageIds = null;
    }

    this._accountService.exportAccount(excelExportPayload).then((base64String: any) => {
      this._commonHelper.hideLoader();
      if (base64String && base64String != '') {
        this._commonHelper.downloadFile(`${fileName}${fileExtension}`, fileMimeType, base64String);
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('LIST.MESSAGE_NO_DATA_EXPORT'));
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }
  
  // Set card/row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Accounts_Workflow_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get card/row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Accounts_Workflow_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
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

  private getEntityRecordTypes(): Promise<any> {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    return new Promise((resolve, reject) => {
      const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntityRecordTypes == null) {
        this.showEntityRecordTypeLoader = true;
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Accounts).map(x => ({ 'label': x.name, 'value': x.id }));
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
            this.casesRecordTypes = response?.filter(x => x.entityTypeID == Entity.Cases && x.parentEntityTypeID == this.entityTypeId);
            this.opportunityRecordTypes = response?.filter((s: any) => s.entityTypeID == Entity.Opportunities && (s.parentEntityTypeID == this.entityTypeId));
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
          }
          this.showEntityRecordTypeLoader = false;
          resolve(this.recordTypes);
        },
          (error) => {
            this.showEntityRecordTypeLoader = false;
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Accounts).map(x => ({ 'label': x.name, 'value': x.id }));
        this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
        this.casesRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases && x.parentEntityTypeID == this.entityTypeId);
        this.opportunityRecordTypes = allEntityRecordTypes?.filter((s: any) => s.entityTypeID == Entity.Opportunities && (s.parentEntityTypeID == this.entityTypeId));
        resolve(this.recordTypes);
      }
    });
  }

  private prepareParamsForWorkflows() {
    return [ { name: 'EntityTypeID', type: 'int', value: Entity.Accounts }];
  }

  private getWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Accounts}`;
      this.showWorkflowLoader = true;
      this.workflows = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.workflows == null) {
        const params = this.prepareParamsForWorkflows();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflows = response;
            this.workflows.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflows));
          }
          this.showWorkflowLoader = false;
          this._commonHelper.hideLoader();
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

  addCase() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CaseAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.entityDetails.id;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.casesRecordTypes.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.casesWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityCasePopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Accounts;
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
            this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.LIST.FILTER_OPTION_TEXT_WORKFLOW') });
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
              this.getAccounts();
              this._commonHelper.hideLoader();
              this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData(successMessage));
            }
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
              this.getAccounts();
            });
        }
      })

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
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_AccountWorkflowListKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);
        this.refreshData();
      });
  }
}
