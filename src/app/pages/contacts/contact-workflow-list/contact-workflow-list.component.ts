//Angular
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
//common
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { ActivityTimespan, DataSources, DownloadFileMimeType, Entity, ExportType, FileExtension, KanbanBoardTokenTypes, LayoutTypes, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, RefType, SectionCodes, UserTypeID } from '../../../@core/enum';
import { Note } from '../../../@core/sharedComponents/notes/note.model';
import { KanbanStage, KanbanStageCard, KanbanStagePauseEvent, KanbanStageTaskEvent } from '../../../@core/sharedModels/kanban-board.model';
import { IdValuePair } from '../../../@core/sharedModels/pair.model';
import { TimeAgoPipe } from '../../../@core/pipes/timeAgo-pipe/time-ago-pipe';
//components
import { EntityStagesDialogComponent } from '../../../@core/sharedComponents/entity-stages/entity-stages-dialog/entity-stages-dialog.component';
import { StagesComponent } from '../../../@core/sharedComponents/kanban-board/stages/stages.component';
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { UserAssignDialogComponent } from '../../../@core/sharedComponents/user-assign/user-assign-dialog/user-assign-dialog.component';
import { ContactAddComponent } from '../contact-add/contact-add.component';
import { ContactImportDialogComponent } from '../contact-import-dialog/contact-import-dialog.component';
import { ActivitySectionComponent } from '../../../@core/sharedComponents/common-activity-section/activity-section/activity-section.component';
//services
import { ContactsService } from '../contacts.service';
import { NoteService } from '../../../@core/sharedComponents/notes/notes.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { EntitytagsService } from '../../entitytags/entitytags.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { SettingsService } from '../../settings/settings.service';
import { WorkTasksService } from '../../worktasks/worktasks.service';
//other
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Table } from 'primeng/table';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import * as moment from 'moment';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';
import { WorktaskAddComponent } from '../../worktasks/worktask-add/worktask-add.component';
import { OpportunityAddComponent } from '../../opportunities/opportunity-add/opportunity-add.component';
import { CaseAddComponent } from '../../cases/case-add/case-add.component';
import { debounceTime, filter, fromEvent, map } from 'rxjs';

@Component({
  selector: 'ngx-contact-workflow-list',
  templateUrl: './contact-workflow-list.component.html',
  styleUrls: ['./contact-workflow-list.component.scss']
})
export class ContactWorkflowListComponent implements OnInit {

  showEntityRecordTypeLoader: boolean = false;
  showWorkflowLoader: boolean = false
  workflows: any;
  isDefaultGenaricWorkflowDetails: boolean;

  @ViewChild('searchTextInput', { static: false }) searchTextInput: ElementRef;
  @ViewChild('dt') private dt: Table;
  @ViewChild('kanbanStage') kanbanStage: StagesComponent;
  @ViewChild('activitySection') activitySection: ActivitySectionComponent;

  workflowName = '';

  entityTypeId: number = Entity.Contacts;
  entityWorkflowId: number = 0;
  entityRecordTypeId: number;

  contactList: any[] = [];
  contactListByStages: any[] = [];
  contactAssignedTo: any;
  ratingOptions: any[] = [];
  rating: number = null;

  isBulkAssignContacts:boolean;
  isImportContacts: boolean = false;
  isDeleteContact: boolean = false;
  isEditContact: boolean = false;
  isAddContact: boolean = false;
  isViewContact: boolean = false;
  isListContacts: boolean = false;
  isResumeTask: boolean = false;
  changeContactStage: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isExportContact : boolean = false;
  isAddWorkTask: boolean = false;
  isAddOpportunity: boolean = false;
  isAddCase: boolean = false;

  customFilterConfig: any[] = [
  ];

  isFilterVisible: boolean = false;
  filterCount:number = 0;

  //status filter for listview.
  showLayout: any;
  StatusFilterLabel: any;
  StatusFilterPlaceholder: any;
  StatusColumnName: any;

  //export Contact  
  dynamicColumnNameSetting: any = {};

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
      "stageId": null,
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

  observableStageContactsList: any[] = [];

  // dynamic kanban
  isfilterLoaded = false;
  stages: Array<KanbanStage> = [];
  owner1List: Array<IdValuePair> = [];
  currencySymbol: any = null;
  hoursInDay:number = null;

  // multi assign contacts to user
  selectedRowIds: Set<number> = new Set<number>();
  showMultiselectOption = false;

  users: any = null; //assignable users
  filterStage: any = null;

  //user detail
  _loggedInUser: any;
  localStoragePrefix: string = "";

  //action menu
  isShowActionColumn: boolean = false;
  //right side activity menu
  isShowActivityCenter: boolean = false;
  refreshActivityCenter: boolean = false;
  selectedContactForActivityCenter: any;
  selectedContactIdForActivityCenter: number = 0;
  selectedContactIsPausedForActivityCenter: boolean = false;
  selectedContactIsActive: boolean = true;
  selectedRowId:number = 0;
  selectedCardExists: boolean = false;
  entityDetails: any;

  entityStagesWithTasksStorageKey: string = LocalStorageKey.ContactEntityStageWithTasksKey;
  isShowImportButton: boolean = true;
  isAllCheckBoxSelected: boolean;

  quickViewConfig: any;
  keyfieldResponseData: any;
  showInActiveRecords: boolean = false;

  rowActionButtonMouseHoverFlag: boolean = false;

  //Record Type Filter
  recordTypes: any;
  isRecordTypesFilterVisible: boolean;
  entityRecordType: any[];

  //WorkflowLayout based on layoutTypeID
  showBothKanbanAndListView: boolean = false;

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
  userTypeID = UserTypeID;

  countries: any;
  countryReadOnlyMask;

  constructor(private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _contactService: ContactsService,
    private _commonService: CommonService,
    private _dataSourceService: DatasourceService,
    private _entitytagsService: EntitytagsService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _workTasksService: WorkTasksService,
    private _settingsService: SettingsService,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _noteService: NoteService,
    private _fileSignedUrlService: FileSignedUrlService) {
    //re use route
    this._router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };

    //initiate Permissions
    this.isAddContact = this._commonHelper.havePermission(enumPermissions.AddContact);
    this.isDeleteContact = this._commonHelper.havePermission(enumPermissions.DeleteContact);
    this.isEditContact = this._commonHelper.havePermission(enumPermissions.EditContact);
    this.isImportContacts = this._commonHelper.havePermission(enumPermissions.ImportContact);
    this.isListContacts = this._commonHelper.havePermission(enumPermissions.ListContacts);
    this.isViewContact = this._commonHelper.havePermission(enumPermissions.ViewContact);
    this.isResumeTask = this._commonHelper.havePermission(enumPermissions.ResumeTask);
    this.changeContactStage = this._commonHelper.havePermission(enumPermissions.ChangeContactStage);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadContactDocument);
    this.isBulkAssignContacts = this._commonHelper.havePermission(enumPermissions.BulkAssignContacts);
    this.isExportContact = this._commonHelper.havePermission(enumPermissions.ExportConact);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAddOpportunity = this._commonHelper.havePermission(enumPermissions.AddOpportunity);
    this.isAddCase = this._commonHelper.havePermission(enumPermissions.AddCase);
    this.isShowActionColumn = (this.isViewContact && this.isEditContact) || (this.isViewContact && this.isDeleteContact);

    //if list page record type wise
    this._activeRoute.params.subscribe(param => {
      if (param && param['id']) {
        this.entityWorkflowId = param['id'];
        this.dataSearch.isPageTabularView = false;
      }
    });

    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'name', header: 'CRM.CONTACT.KANBAN.TABLE_HEADER_NAME', visible: true, sort: true },
      { field: 'email', header: 'CRM.CONTACT.KANBAN.TABLE_HEADER_EMAIL', visible: true, sort: true },
      { field: 'phone', header: 'CRM.CONTACT.KANBAN.TABLE_HEADER_PHONE', visible: true, sort: true },
      { field: 'stageName', header: 'CRM.CONTACT.KANBAN.TABLE_HEADER_STAGE', visible: true, sort: true },
      { field: 'assignedToName', header: 'CRM.CONTACT.KANBAN.TABLE_HEADER_ASSIGNTO', visible: true, sort: true },
      { field: 'id', header: '', visible: true, sort: false, class: "action ", display: 'td-display' }
    ];
    
     //set Action column show/hide dynamically
     if(!this.isEditContact && !this.isDeleteContact)
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
    //set local storage prefix
    this.localStoragePrefix = `${this._loggedInUser?.tenantId}_${this._loggedInUser?.userId}_${this.entityWorkflowId}`;

    //get local storage for search
    let localPageLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_ContactKanbanViewKey, this.localStoragePrefix));
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

    //set default Active Records 
    this.dataSearch.params.IsActive = !this.dataSearch.params.IsActive;
    this.dataSearch.paramsByStage.IsActive = !this.dataSearch.paramsByStage.IsActive;

    Promise.all([
      this.getWorkflowDetail(),
      this.getEntityStagesWithTask(),
      this.getCurrencySymbol(),
      this.getHoursInDay(),
      this.getWorktaskWorkflowList(),
      this.getWorkflowListForOpportunity(),
      this.getWorkflowListForCase(),
      this.getEntityHiddenField(),
      this.getEntitySubTypes(),
      this.getCountries()
    ]).then((results: any) => {
      // get workflow details
      if (results) {
        this.getEntityRecordTypes();
        this.getWorkflowList();
        var workflow = results[0];
        this.workflowName = workflow.name;
        this.entityRecordTypeId = workflow.entityRecordTypeId;
        this.getHeaderFilters();
        let StageColumn = this.cols.find(c => c.field == 'stageName');
        this.workTaskSubTypeDetails = this.entitySubTypes?.find(x => x.level == 1);

        if (workflow.layoutTypeID == LayoutTypes.ListView) {
          this.dataSearch.isPageTabularView = true;
          StageColumn.header = 'CRM.CONTACT.KANBAN.TABLE_HEADER_STATUS_NAME';
          this.StatusColumnName = (this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.EXPORT_STATUS_LABEL'));
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
      this.selectedContactIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
    }
    // get set quickview local storage config end
  }
  //#region Private Methods

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

  private getWorkflowDetail(): Promise<any> {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.ContactWorkflowDetailsKey}_${this.entityWorkflowId}`;

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
  
  private getHeaderFilters() {
    // other fileter master data
    const requestArray = [];

    const entityTimeSpans = this.getEntityTimespans();
    const requestAssignedToUsers = this.getAssigedToUsers(null, 1, '');
    const recordTypeList=this.getEntityRecordTypes();
    const requestTags = this.getContactTags();
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
            label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.FILTER_LABEL_ENTITYTIMESPAN'),
            name: 'entityTimespan',
            placeHolder: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.FILTER_PLACEHOLDER_ENTITYTIMESPAN'),
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
          this.users.push({ label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_OPTION_TEXT_ASSIGNEDTO'), value: 0 })
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
            label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.FILTER_LABEL_ASSIGNTO'),
            name: 'assignedToIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.FILTER_PLACEHOLDER_ASSIGNTO'),
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
          this.entityRecordType.push({ label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_OPTION_TEXT_RECORDTYPE'), value: 0 })
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
            label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_LABEL_RECORDTYPE'),
            name: 'entityRecordTypeIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_PLACEHOLDER_RECORDTYPE'),
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
          this.customFilterConfig.push(recordTypeFilter);
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
            label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.FILTER_LABEL_TAGS'),
            name: 'tagIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.FILTER_PLACEHOLDER_TAGS'),
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

        //stage
        if(results[4] != undefined) {
          let Liststages = results[4] as any[];
          this.filterStage = Liststages;

          if (this.showLayout == LayoutTypes.ListView) {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_LABEL_STATUS');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_PLACEHOLDER_STATUS');
          }
          else {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_LABEL_STAGE');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_PLACEHOLDER_STAGE');
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
          defaultClass: 'basic-filter',
          panelStyleClass: "maxWidthOverride-lg",
          isCountableFilter: 1
        };
        // add to filter
         this.customFilterConfig.push(stageFilter);
        }

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
            label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_LABEL_RATING'),
            name: 'rating',
            placeHolder: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_PLACEHOLDER_RATING'),
            ngModel: (selectedRatingIds == null || selectedRatingIds == '') ? null : selectedRatingIds,
            ngModelDefaultValue: null,
            optionLabel: 'label',
            optionValue: 'value',
            options: ratingOptions,
            isHidden: false,
            defaultClass: 'basic-filter small-filter',
            panelStyleClass: 'maxWidthOverride-sm',
            isCountableFilter: 1
          }

         // add to filter
         this.customFilterConfig.push(ratingFilter)
         this.dataSearch.paramsByStage.rating = selectedRatingIds == null ? null : selectedRatingIds;
         this.dataSearch.params.rating = selectedRatingIds == null ? null : selectedRatingIds;
        }

        //Show Inactive records
        let isShowInActiveRecords = this.dataSearch.isPageTabularView ? this.dataSearch.params.IsActive : this.dataSearch.paramsByStage.IsActive;
        let ShowInActiveFilter = 
        {
          inputType: 'Checkbox',
          label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_ACTIVE_RECORDS'),
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
          label: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_STARRED')),
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
        this.users.push({ label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_OPTION_TEXT_ASSIGNEDTO'), value: 0 })
        this.users.sort((a, b) => a.value - b.value);
        this.customFilterConfig[2].options = this.users;
      });
    }
  }

  showhideFilter(){
    this.isFilterVisible = !this.isFilterVisible;
  }

  isFilterVisibleChange(value:boolean){
    this.isFilterVisible = value;
  }
  
  private prepareParamsForAssignedToUsers(stageId, assignedTo, includeAllUsers=1, searchString=null) {
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

  private getAssigedToUsers(selectedUserId, includeAllUsers, searchString: any): Promise<any> {
    var params = this.prepareParamsForAssignedToUsers('', selectedUserId, includeAllUsers, searchString);
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CONTACTASSIGNEDTO, params);
  }

  private getContactTags(): Promise<any> {
    return this._entitytagsService.getActiveEntityTagsByEntityTypeId(this.entityTypeId, this.entityRecordTypeId);
  }

  private getStage(): Promise<any> {
    const params= this.prepareParamsForEntityStagesByWorkflowId();
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITYSTAGESBYWORKFLOWID,params);
  }

  private getEntityTimespans(): Promise<any> {
    const params = { refType: RefType.EntityTimespan };
    return new Promise((resolve, reject) => {
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.EntityTimespan}`;
      const refTypeEntityTimespan = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey, this.localStoragePrefix));
      if (refTypeEntityTimespan == null) {
        this._commonHelper.showLoader();
        this.isInitialLoading = true;
        this._commonService.getActiveReferenceTypeByRefType(params)
          .then((response: any) => {
            this._commonHelper.hideLoader();
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response), this.localStoragePrefix);
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

  private async prepareStages() {
    this.contactListByStages.forEach((stage: any) => {
      let kanbanStage: KanbanStage = {
        id: stage.id,
        name: stage.name,
        stage: "",
        totalItems: 0,
        totalOpportunityValue:0,
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
        showLoader : true
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

  private async getStageItems(index: number, isAppend: boolean) {
    return new Promise((resolve, reject) => {
      //Show Activity Section Loader
      if (this.activitySection) {
        this.activitySection.showLoader();
      }
      
      let stageId = this.stages[index].id;
      this.stages[index].showLoader = true;

      this._contactService.getContactsByStage(this.getParamObj(stageId)).then(
        (contacts: any) => {
          this.contactList.push(...contacts);
          // for each contact prepare card
          let kanbanStageCards: KanbanStageCard[] = [];
          contacts.forEach((contact: any) => {
            // set total
            this.stages[index].totalItems = contact.totalRecords;

            const taskIds: Array<number> = contact.selectedStageTaskIDs
              ? contact.selectedStageTaskIDs.split(",").map(m => Number(m))
              : [];

            // check if the current assigned to and logged in user is same
            var isSelectedContactsDisabled: boolean = true;
            var showPauseResumeButtons: boolean = false;
            let canUserMoveAccount: boolean = this.canUserChangeStage(this.stages[index], contact);

            // check hidden
            if ((contact.assignedTo == this._loggedInUser.userId || this.isResumeTask) && this.isEditContact) {
              isSelectedContactsDisabled = false;
              showPauseResumeButtons = true;
            }
            let settingsJson = JSON.parse(contact.settingsJson);

            // prepare card data
            let kanbanStageCard: KanbanStageCard = {
              id: contact.id,
              stageId: contact.stageId,
              stageName: contact.stageName,
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
              parentTokenType: KanbanBoardTokenTypes[settingsJson.ParentTokenType as keyof typeof KanbanBoardTokenTypes],
              parentLabel: settingsJson.TokenText,
              parentLabelTooltip1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.ParentTokenTooltip)),
              parentLabelRedirectUrl: settingsJson.ParentTokenUrl,
              entityId: contact.entityId,
              entityTypeId: contact.entityTypeId,
              entityTypeName: contact.entityTypeName,
              relatedToLabel: null,
              relatedToTooltip: null,
              selectedTasks: (this.stages[index].tasks || []).filter(f => taskIds.includes(f.id)) || [],
              selectedTasksDisabled: isSelectedContactsDisabled,
              isActive: contact.isActive,
              isPaused: contact.isPaused,
              isPausedTooltip: contact.isPaused != null && contact.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LABEL_SWITCH_PAUSE'),
              pausedLabel: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LABEL_SWITCH_PAUSE'),
              resumeLabel: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LABEL_SWITCH_RESUME'),
              resumeNotAccess: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_RESUME_NOT_ACCESS'),
              showPauseResumeButtons: showPauseResumeButtons,
              canUserChangeStage: canUserMoveAccount,
              owner1Id: contact.assignedTo,
              owner1Name: contact.assignedToName,
              owner1ShortName: contact.assignedToShortName,
              owner1Image: contact.assignedToImagePath,
              owner1Tooltip: contact.assignedToName,
              owner1BGColor: contact.assignedToAvatarBGColor,
              owner1userTypeId: this.userTypeID.AssignedTo,
              disabled: ((contact.isPaused ?? false) || !contact.isActive),
              entityIcon: 'fas fa-address-card',
              entityRecordTypeId: contact?.entityRecordTypeID,
              entityRecordTypeName: contact.entityRecordTypeName,
              entityName: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TITLE'),
              createdBy: contact?.createdBy,
              stagesTasks: this.stages[index]?.tasks,
              rating: contact.rating,
              review: contact.totalReviews,
              created: contact?.created,
              entityReviewID: contact.entityReviewID,
              isEntityReviewEditable: !(contact.isPaused ?? false),
              workTaskTypeName: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
              workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
              userLabel1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('COMMON.COMMON_USER_PROFILE.LABEL_ASSIGNEDTO')),
              isStarred: contact?.isStarred,
              isResumeRecord: this.isResumeTask,
              isShowPauseOrResume: true
            }

            if (!isAppend && this.selectedContactIdForActivityCenter != null && this.selectedContactIdForActivityCenter > 0 && kanbanStageCard.id == this.selectedContactIdForActivityCenter) {
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
          if (contacts.length == 0 || contacts == undefined) {
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

  private canUserChangeStage(currentStage, contact): boolean {
    if (currentStage == null || contact == null) {
      return true;
    }

    let canUserMoveContact: boolean = false;
    if (currentStage.transitionAssociates != null && currentStage.transitionAssociates != '') {
      const associates = currentStage.transitionAssociates.trim().split(',');
      associates.forEach(associate => {
        const associatePropertyName = this._commonHelper.convertToCamalize(associate);
        canUserMoveContact = canUserMoveContact || (contact.hasOwnProperty(associatePropertyName) ? (contact[associatePropertyName] == this._loggedInUser.userId) : false);
      });
    }
    else {
      canUserMoveContact = true;
    }
    return canUserMoveContact
  }

  // get stage wise data params
  private getParamObj(stageId: number) {
    this.dataSearch.paramsByStage.stageId = stageId;
    return this.dataSearch.paramsByStage;
  }

  private getContacts() {
    this._commonHelper.showLoader();
    this._contactService.getWorkFlowContacts(this.dataSearch.params).then((response: any) => {
      this.contactList = response;
      this.isAllCheckBoxSelected = false;
      //reset selected
      this.selectedRowIds = new Set<number>();
      // total
      this.totalRecords = this.contactList.length;
      this.totalRecords = this.contactList.length > 0 ? response[0].totalRecords : 0;
      this.dt.rows = this.dataSearch.params.pageSize;
      this.totalPages = Math.ceil(this.totalRecords / this.dataSearch.params.pageSize);
      this.end = this.dataSearch.params.pageNo == this.totalPages ? this.totalRecords : this.dataSearch.params.pageNo * this.dataSearch.params.pageSize;
      this.start = this.end == this.totalRecords ? (this.totalRecords - this.contactList.length + 1) : (this.end - this.dataSearch.params.pageSize) + 1;
      this._commonHelper.hideLoader();
      this._fileSignedUrlService.getFileSingedUrl(this.contactList, 'assignedToImagePath', 'assignedToSignedUrl', Entity.Users)
      if (this.selectedContactIdForActivityCenter != null && this.selectedContactIdForActivityCenter > 0 && this.contactList.some(x=>x.id == this.selectedContactIdForActivityCenter)) {
        this.updateEntityDetails(true, this.contactList.find(x=>x.id == this.selectedContactIdForActivityCenter));
      }
      else{
        this.resetSelectedEntity();
      }

      this.contactList.forEach((contact: any) => {
        if (contact.phone) {
          const phoneDetail = String(contact.phone).split('|');
          if (phoneDetail.length == 2) {
            contact['countryCode'] = phoneDetail[0];
            contact['phoneNumber'] = phoneDetail[1];
            contact['phoneMask'] = String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0");
          } 
        }
      })

    }, (error) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(error.message);
    });
  }

  // get work contacts by stage
  private getEntityStagesWithTask() {
    const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
    if (entityStagesWithTasks == null) {
      return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId).then(
        (response: any[]) => {
          this.contactListByStages = JSON.parse(JSON.stringify(response));
          this.contactListByStages.forEach((stage: any) => {
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
          this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.contactListByStages));
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
      this.contactListByStages = entityStagesWithTasks;
    }
  }

  private getEntityStageData(stageId, isAppend) {
    let index: number = this.stages.findIndex(el => el.id == stageId);
    this.contactList = this.contactList.filter((item) => item.stageId !== stageId);
    this.getStageItems(index, isAppend).then(() => {
      this._fileSignedUrlService.getFileSingedUrl(this.stages[index].cards, 'owner1Image', 'owner1SignedUrl', Entity.Users);
    });
  }

  private moveEntity(event: CdkDragDrop<{}[]>) {
    const contactId = event.item.data.id;
    const contactStageId = +event.item.data.stageId;
    const dropContactStageId = +event.container.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;
    const dropContactStageName = event.container.element.nativeElement.querySelector('div .cards-header #stageName').innerHTML;
    const isNoteRequired = event.container.element.nativeElement.querySelector('div .cards-header #stageNoteRequired').innerHTML;
    const assignedTo = event.item.data.owner1Id;
    const stageName = event.item.data.stageName;

    let currentStage = this.stages.find(x => x.id == contactStageId);
    let dropStage = this.stages.find(x => x.id == dropContactStageId);

    // check if note is required
    if (isNoteRequired == 'true') {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = contactId;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropContactStageName }))}`;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(noteDate => {
        if (noteDate != undefined) {
          // save to transition
          Promise.all([
            this.saveContactStage(contactId, contactStageId, dropContactStageId, dropContactStageName, assignedTo, stageName)
          ]).then(() => {
            const param = {
              entityTypeId: this.entityTypeId,
              entityId: contactId,
              workflowId: this.entityWorkflowId,
              workflowStageId: dropContactStageId,
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


              this.getEntityStageData(contactStageId, false); // refresh current stage
              this.getEntityStageData(dropContactStageId, false); // refresh drop stage
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
          }).catch(()=>{
            //this.refreshData();
          });
        }
      });
    }
    else {
      // save to transition
      Promise.all([
        this.saveContactStage(contactId, contactStageId, dropContactStageId, dropContactStageName, assignedTo, stageName)
      ]).then(() => {

        currentStage.pagination.pageNo = 1; //reset current pagination stats of source stage
        dropStage.pagination.pageNo = 1; //reset current pagination stats of target stage
        this.dataSearch.paramsByStage.pageNo = 1 //rest global stage params pagination stage

        this.getEntityStageData(contactStageId, false); // refresh current stage
        this.getEntityStageData(dropContactStageId, false); // refresh drop stage
      }).catch(()=>{
        //this.refreshData();
      });
    }
  }

  private saveContactStage(contactId, contactStageId, dropContactStageId, dropContactStageName, assignedTo, stageName) {
    return new Promise((resolve, reject) => {
      let assignedToForDto = assignedTo;
      this._commonHelper.showLoader();
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: contactId, stageId: dropContactStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedTo, oldStageId: contactStageId }).then((response: any) => {
        if (response) {

          this.contactAssignedTo = response;
          if (assignedToForDto != this.contactAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._contactService.saveContactAssignedTo({ entityId: contactId, assignedToId: this.contactAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.contactAssignedTo.isForcedAssignment,stageId: dropContactStageId }).then((response: any) => {
              if (response) {
                assignedToForDto = this.contactAssignedTo.assignedToId;
                // success message
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.MESSAGE_CONTACT_MOVETO_STAGE',
                    { stageName: dropContactStageName })
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
              this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.MESSAGE_CONTACT_MOVETO_STAGE',
                { stageName: dropContactStageName })
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

  private moveEntityFromList(contactId, contactStageId, selectedEntityStageId, dropContactStagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, stageName, modalRef: NgbModalRef) {
    
    if (selectedEntityStageChangeReason != null || stageChangeReasonDescription != null) {
      // prepare reason as a note
      let note = new Note({});
      note.id = 0;
      note.tenantId = this._loggedInUser.tenantId;
      note.entityTypeId = this.entityTypeId;
      note.entityId = contactId;
      note.entityRecordTypeID = null;
      note.subject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: stageName }))}`;
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
          this.saveContactStage(contactId, contactStageId, selectedEntityStageId, dropContactStagename, assignedTo, stageName)
        ]).then(() => {
          const param = {
            entityTypeId: this.entityTypeId,
            entityId: contactId,
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
      }, (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('ACTIVITY.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      });
    }
    else {
      // prepare object to send to backend to save
      const selectedEntityStageDetail = this.contactListByStages.find(s => s.id == selectedEntityStageId);
      let dropContactStagename = selectedEntityStageDetail.name;
      Promise.all([
        this.saveContactStage(contactId, contactStageId, selectedEntityStageId, dropContactStagename, assignedTo, stageName)
      ]).then(() => {
        modalRef.close();
        this.refreshData();
      }).catch(() => {
        modalRef.close();
        this.refreshData();
      });;
    }
  }

  private contactStagePauseChangeList(contact, isPaused: boolean) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: contact.id,
      entityStageId: contact.stageId,
      isPaused: isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: contact.owner1Id,
      noteID: null
    };

    if (params.isPaused) {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = contact.id;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.PAUSE_REASON_NOTE_SUBJECT', { stageName: contact.stageName }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = contact.stageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(noteDate => {
        if (noteDate) {
          params.noteID = noteDate.id;
          this.saveEntityStagePauseTransitionFromList(params, contact);
        }
      });
    }
    else {
      const noteParam = {
        entityTypeId: this.entityTypeId,
        entityId: contact.id,
        entityRecordTypeID: null,
        subject: null,
        isPrivate: false,
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.RESUME_NOTE_DESCRIPTION', { stageName: contact.stageName }))}`,
        createdBy: this._loggedInUser.userId
      };

      this._commonHelper.showLoader();
      this._noteService.addNewNote(noteParam).then((response: any) => {
        if (response) {
          params.noteID = response.id;
          this.saveEntityStagePauseTransitionFromList(params, contact);
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

  private saveEntityStagePauseTransitionFromList(params, contact) {
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
          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_RESUME_SUCCESS'));
          contact.isPaused = params.isPaused;

          //record update for List view.
          let updateEntityPauseStatusForList = this.contactList.find(x=>x.id == contact.id);
          updateEntityPauseStatusForList.isPaused = contact.isPaused;

          //record update for Card view.
          if (this.kanbanStage) {
            let card: any = {};
            card.id = contact.id;
            card.stageId = contact.stageId;
            card.isPaused = params.isPaused;
            card.disabled = params.isPaused ? true : false;
            this.kanbanStage.updateEntityPauseStatus(card);
          }

          //update Activity Center
          if (contact.id == this.selectedContactIdForActivityCenter) {
            this.updateEntityDetails(false, contact);
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

  private contactStagePauseChange(event: KanbanStagePauseEvent) {
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
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.PAUSE_REASON_NOTE_SUBJECT', { stageName: event.stage.name }))}`;
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
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.RESUME_NOTE_DESCRIPTION', { stageName: event.stage.name }))}`,
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

  private saveEntityStagePauseTransition(params, event: KanbanStagePauseEvent) {
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
          const contactInfo = this.contactList.find(x => x.id == params.entityId);
          if (contactInfo) {
            event.card.disabled = !contactInfo.isActive || params.isPaused;
          }

          event.card.isPaused = params.isPaused;
          event.card.isPausedTooltip = params.isPaused != null && params.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LABEL_SWITCH_PAUSE');

          //update Activity Center
          if (event.card.id == this.selectedContactIdForActivityCenter) {
            this.updateEntityDetails(false, event.card);
          }
          event.card.isEntityReviewEditable = !(event.card?.isPaused ?? false);
          this.kanbanStage.updateEntityPauseStatus(event.card);

          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_RESUME_SUCCESS'));
          this._commonHelper.hideLoader();
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
      },
        (error) => {
          this._commonHelper.hideLoader();
          event.card.isPausedTooltip = event.card.isPaused != null && event.card.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LABEL_SWITCH_PAUSE');
          this.kanbanStage.updateEntityPauseStatus(event.card);

          this.getTranslateErrorMessage(error);
        });
  }

  private getTranslateErrorMessage(error) {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'contacts.entitycannotbedeleteduetosubworktaskexist') {
        this.availableSubWorkTaskTypeNamesForContactDelete = this.entitySubTypes.find(x => x.level == 2).name;
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.CONTACTS_ENTITYCANNOTBEDELETEDUETOSUBWORKTASKEXIST', { entitySubTypeName: this.availableSubWorkTaskTypeNamesForContactDelete })
        );
      } else if (error.messageCode.toLowerCase() == 'contacts.closedorcompleted') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.CONTACTS_CLOSEDORCOMPLETED', { stageName: error.data.stageName }));
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.CONTACT.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }

  //#endregion Private Methods

  onTogglePageLayout(pageLayout: string) {
    if (pageLayout === 'CARD') {
      // reset
      this.dataSearch.paramsByStage.pageNo = 1;
      this.stages = [];
      this.contactList = [];
      // prepare stages
      this.prepareStages();
      this.dataSearch.isPageTabularView = false;
    } else {
      this.dataSearch.isPageTabularView = true;
      this.dataSearch.params.pageNo = 1;
      this.contactList = [];
      this.getContacts();
    }

    //set hidden for stage filter
    let stageFilter =  this.customFilterConfig.find(x => x.name === 'stageIDs');
    if (stageFilter) {
      stageFilter['isHidden'] = pageLayout === 'CARD';
    }

      this.resetSelectedEntity();

    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ContactKanbanViewKey, JSON.stringify(this.dataSearch), this.localStoragePrefix);

    //set quickview config
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedContactIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  //contact card drag-drop to other card
  onDropSuccess(event: CdkDragDrop<{}[]>) {
    //check can user change stage
    if (!event.item.data.canUserChangeStage) {
      if (this.changeContactStage) {
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterDropSuccess(event);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
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
      const contactId = event.item.data.id;
      const contactStageId = +event.item.data.stageId;

      //Check Is All Stage Tasks Required for current Entity Stage before move onto the next Entity Stage.
      const isAllTasksRequired = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageIsAllTasksRequired').innerHTML;
      const previousStageId = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;

      // if any one of the current stage task is required
      let anyTasksIsRequired: boolean = false;
      let requiredTasks: any[] = [];
      // find out the current stage
      let currentStage = this.contactListByStages.find(x => x.id == previousStageId);
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
          * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (ContactId)
          * */
        let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
        this._commonHelper.showLoader();
        this._workflowmanagementService.isEntityStageTasksCompleted(contactId, this.entityTypeId, contactStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response === true) {
            this.moveEntity(event);
          } else {
            //Stage Tasks are not completed..
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.MESSAGE_BEFORE_MOVE_CONTACT_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
            return false;
          }
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
      else if (isAllTasksRequired && isAllTasksRequired.toLowerCase() == "true") {
        /**
         * Call API to validate contact has completed all the stage tasks before moving on to other stage.
         * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (ContactId)
         * */
        this._commonHelper.showLoader();
        this._workflowmanagementService.isEntityStageTasksCompleted(contactId, this.entityTypeId, contactStageId, this.entityWorkflowId, null).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response === true) {

            this.dataSearch.paramsByStage.pageNo = 1;
            let searchStage = this.stages.find(x=> x.id == event.item.data.stageId);
            searchStage.pagination.pageNo = this.dataSearch.paramsByStage.pageNo;

            this.moveEntity(event);
          } else {
            //Stage Tasks are not completed..
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.MESSAGE_BEFORE_MOVE_CONTACT_STAGE_TASK_SHOULD_BE_COMPLETED'));
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

  onEntityStageClick(contact) {
    // check logged in user have permission to view user details
    if (!this.isEditContact || !this.isViewContact || contact.isPaused) {
      return;
    }
     //check can user change stage
     const currentStageDetail = this.contactListByStages.find(s => s.id == contact.stageID);
     const canUserChangeStage: boolean = this.canUserChangeStage(currentStageDetail, contact);
 
     if (!canUserChangeStage) {
       if (this.changeContactStage) {
         this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
           .then((confirmed) => {
             if (confirmed) {
               this.afterEntityStageClick(contact);
             }
           });
       }
       else {
         this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
       }
     }
     else {
       this.afterEntityStageClick(contact);
     }
  }

  private afterEntityStageClick(contact) {
    // get data from event
    let contactId = contact.id;
    let contactStageId = contact.stageID;
    let assignedTo = contact.assignedTo;
    let stageName = contact.stageName;
    // prepare params
    var params = this.prepareParamsForEntityStages();

    let entityStageDialogTitle: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ENTITY_STAGE_DIALOG.DIALOG_TITLE_STATUS') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ENTITY_STAGE_DIALOG.DIALOG_TITLE');
    let entityStageDialogFieldLabel: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_LABEL') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_LABEL');
    let entityStageDialogFieldPlaceholder: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_PLACEHOLDER') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_PLACEHOLDER');

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
        this.modalRef.componentInstance.entityStageId = contactStageId;
        this.modalRef.componentInstance.dialogTitle = entityStageDialogTitle;
        this.modalRef.componentInstance.entityStageSelectLabel = entityStageDialogFieldLabel;
        this.modalRef.componentInstance.entityStageChangeSelectReasonLabel = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_REASON_LABEL');
        this.modalRef.componentInstance.entityStageSelectPlaceholder = entityStageDialogFieldPlaceholder;
        this.modalRef.componentInstance.entityStageChangeReasonLabel = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_LABEL');
        this.modalRef.componentInstance.entityStageChangeReasonPlaceholder = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_PLACEHOLDER');
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
          if (selectedEntityStageId != undefined && selectedEntityStageId != null && selectedEntityStageId != contactStageId) {
            // prepare object to send to backend to save
            const selectedEntityStageDetail = this.contactListByStages.find(s => s.id == selectedEntityStageId);
            const prevEntityStageDetail = this.contactListByStages.find(s => s.id == contactStageId);

            let dropContactStagename = selectedEntityStageDetail.name;

            let isAllTasksRequired = prevEntityStageDetail?.isAllTasksRequired;

            // if any one of the current stage task is required
            let anyTasksIsRequired: boolean = false;
            let requiredTasks: any[] = [];
            // find out the current stage
            let currentStage = this.contactListByStages.find(x => x.id == contactStageId);
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
                * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (ContactId)
                * */
              let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
              this._commonHelper.showLoader();
              this._workflowmanagementService.isEntityStageTasksCompleted(contactId, this.entityTypeId, contactStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
                this._commonHelper.hideLoader();
                if (response === true) {
                  this.moveEntityFromList(contactId, contactStageId, selectedEntityStageId, dropContactStagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, stageName, this.modalRef);
                } else {
                  //Stage Tasks are not completed..
                  this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.MESSAGE_BEFORE_MOVE_CONTACT_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
                  return false;
                }
              }, (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
            }
            else if (isAllTasksRequired) {
              /**
               * Call API to validate contact has completed all the stage tasks before moving on to other stage.
               * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (contactId)
               * */
              this._commonHelper.showLoader();
              this._workflowmanagementService.isEntityStageTasksCompleted(contactId, this.entityTypeId, contactStageId, this.entityWorkflowId, null).then((response: any) => {
                this._commonHelper.hideLoader();
                if (response === true) {
                  this.moveEntityFromList(contactId, contactStageId, selectedEntityStageId, dropContactStagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, stageName, this.modalRef);
                } else {
                  //Stage Tasks are not completed..
                  this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.MESSAGE_BEFORE_MOVE_CONTACT_STAGE_TASK_SHOULD_BE_COMPLETED'));
                  return false;
                }
              }, (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
            } else {
              this.moveEntityFromList(contactId, contactStageId, selectedEntityStageId, dropContactStagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, stageName, this.modalRef);
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

    const stageTasks = this.contactListByStages?.find(x => x.id == rowData?.stageID)?.stageTasks;
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
      entityRecordTypeId: rowData?.entityRecordTypeID,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      stagesTasks: stageTasks,
      selectedTasks: (stageTasks || []).filter(f => taskIds.includes(f.id)) || [],
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      isActive: rowData?.isActive,
      createdBy: rowData?.createdBy,
      isPaused: rowData?.isPaused,
      workTaskTypeName: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.DETAIL.TAB_WORKTASKS.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
      workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
      isStarred: rowData?.isStarred,
      isResumeRecord: this.isResumeTask,
      isShowPauseOrResume: true
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
      selectedCardEntityId: this.selectedRowId,
      selectedRowEntityId: this.selectedRowId
    }
    
    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewContact);
  }

  onCardClick(contact, isShowActivityCenter:boolean = null) {
    this.contactCreatedBy = contact?.createdBy;
    contact.entityWorkflowId = this.entityWorkflowId;
    this.entityDetails = this._commonHelper.cloningObject(contact);
    this.selectedContactForActivityCenter = contact;
    this.selectedContactIdForActivityCenter = contact.id;
    this.selectedContactIsPausedForActivityCenter = (contact.isPaused ?? false);
    this.selectedContactIsActive = contact.isActive;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedCardEntityId: contact.id,
      selectedRowEntityId: contact.id
    };
    
    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewContact);
  }

  onEntityStageTasksSelect(event) {
    if(!this.dataSearch.isPageTabularView) {
      const currentStage = this.stages?.find(s => s.id == event.stageId); 
      const currentCard = currentStage?.cards?.find((k: any) => k.id  == event.id)
      currentCard.selectedTasks = event?.selectedTasks;
    }else{
      const temp = this.contactList.find(x => x.id == event.id);
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
            this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.opportunityWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_OPTION_TEXT_WORKFLOW') });
        this.opportunityWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
  }

  private resetSelectedEntity(){
    this.isShowActivityCenter = false;
    this.selectedContactForActivityCenter = null;
    this.selectedContactIdForActivityCenter = 0;
    this.selectedContactIsPausedForActivityCenter = null;
    this.selectedContactIsActive = null;
    this.selectedRowId = 0;
    if(this.kanbanStage){
      this.kanbanStage.selectedCard = 0;
    }
  }

  onContactStagePauseChanged(contact: any, isPaused: boolean) {
    if(!this.isEditContact){ return; }
    if (contact.owner1Id !== this._loggedInUser.userId) {
      let message = "";
      if (contact.owner1Id == null || contact.owner1Id == "" || contact.owner1Id == undefined) {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.contactStagePauseChangeList(contact, isPaused);
          }
        });
    }
    else if (contact.owner1Id == this._loggedInUser.userId) {
      this.contactStagePauseChangeList(contact, isPaused);
    }
  }

  onContactStagePauseChangedFromCard(event: KanbanStagePauseEvent) {
    if (event.card.owner1Id !== this._loggedInUser.userId) {
      let message = "";
      if (event.card.owner1Id == null || event.card.owner1Id == undefined) {
        message = event.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = event.isPaused ? this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.contactStagePauseChange(event);
          }
        });
    }
    else if (event.card.owner1Id == this._loggedInUser.userId) {
      this.contactStagePauseChange(event);
    }
  }

  onAssignedToClick(event, contact) {
    if (!this.isEditContact || (contact != null ? (!contact.isActive || (contact.isPaused ?? false)) : event.card.disabled))
    {
      return;
    }

    let assignedToId = contact != null ? contact.assignedTo : event.card.owner1Id; //owner 1 is assigned to
    let contactId = contact != null ? contact.id : event.card.id;
    let contactStageId = contact != null ? contact.stageID : event.card.stageId;

    var params = this.prepareParamsForAssignedToUsers(contactStageId, assignedToId);
    this._commonHelper.showLoader();
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CONTACTASSIGNEDTO, params).then((response: any) => {
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.USER_ASSIGN_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.USER_ASSIGN_DIALOG.SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.USER_ASSIGN_DIALOG.SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        let obj = {
          entityId: contactId,
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: contactStageId
        };

        this._commonHelper.showLoader();
        this._contactService.saveContactAssignedTo(obj).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response) {
            this.contactAssignedTo = response;
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: this.entityTypeId, entityId: contactId, entityWorkflowId: this.entityWorkflowId, stageId: contactStageId, assignedTo: selectedUserId }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.MESSAGE_CONTACT_ASSIGNEDTO'));
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
            this.getEntityStageData(contactStageId, false);
          } else {
            this.dataSearch.params.pageNo = 1;
            this.contactList = [];
            this.getContacts();
          }

          // close
          this.modalRef.close();
        },
          (error) => {
            this.handlePausedOrDeleteTaskError(error, contactStageId);
            this._commonHelper.hideLoader();
            this.modalRef.close();
            if (error != null && String(error.messageCode).toLowerCase() === 'contacts.closedorcompleted') {
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
      this.contactList = [];
      // prepare stages
      this.prepareStages();
    } else {
      this.dataSearch.params.pageNo = 1;
      this.contactList = [];
      this.getContacts();
    }
  }

  openContactImport() {
    this.modalRef = this._modalService.open(ContactImportDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.refreshData();
      }
    });
  }

  // open add popup
  addContact() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(ContactAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.entityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.workflows = this.workflows?.filter(x => x.value != 0);
    this.modalRef.componentInstance.recordTypes = this.recordTypes?.filter(s => s.value != 0);
    this.modalRef.componentInstance.isShowWorkflow = this.isDefaultGenaricWorkflowDetails;
    this.modalRef.componentInstance.isShowAssignTo = true;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.refreshData();
      }
    });
  }

  onDeleteContactClick(Id) {
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
    })
      .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.KANBAN.DISMISS_DIALOG')));
  }

  deleteContact(contactId) {
    this._commonHelper.showLoader();
    this._contactService.deleteContact(contactId).then(response => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.MESSAGE_CONTACT_DELETED')
      );
      this.totalRecords = this.totalRecords - 1;
      this.dataSearch.params.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.dataSearch.params.pageSize) : 1;
      this.refreshData();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private deleteContactWithRelatedWorkTasks(Id) {
    this._commonHelper.showLoader();
    this._contactService.deleteContactWithRelatedWorkTasks(Id).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.MESSAGE_CONTACT_DELETED')
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

  getFilterValues(event) {
  let changefiltercount = 0;
   event.forEach(item => {
      let key = Object.keys(item)[0];

      if (this.dataSearch.params.hasOwnProperty(key))
        this.dataSearch.params[key] = item[key];

      if (this.dataSearch.paramsByStage.hasOwnProperty(key))
        this.dataSearch.paramsByStage[key] = item[key];

      if(item[key] != '' && item[key] && item[key] != ActivityTimespan.ALLTIME && item.isCountableFilter == 1){
        changefiltercount++;
      }
    });
    this.filterCount = changefiltercount;

    this.dataSearch.params.pageNo = 1;
    this.dataSearch.paramsByStage.pageNo = 1;

    //set contact search filter
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ContactKanbanViewKey, JSON.stringify(this.dataSearch), this.localStoragePrefix);

    this.dataSearch.params.IsActive =  !this.dataSearch.params.IsActive;
    this.dataSearch.paramsByStage.IsActive = !this.dataSearch.paramsByStage.IsActive;
    
    // check if table or kanban
    if (this.dataSearch.isPageTabularView) {
      this.getContacts();
    }
    else {
      this.stages = [];
      this.contactList = [];
      // prepare stages
      this.prepareStages();
    }

    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedContactIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  paginate(event) {
    this.dataSearch.params.pageNo = (event.first / event.rows) + 1;
    this.dataSearch.params.pageSize = event.rows;
    this.getContacts();
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
      this.getContacts();
    }
  }

  changePage() {
    if (this.dataSearch.params.pageNo <= this.totalPages && this.dataSearch.params.pageNo > 0) {
      this.dataSearch.params.pageNo = this.dataSearch.params.pageNo > 0 ? this.dataSearch.params.pageNo : 1;
      this.getContacts();
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
    this.getContacts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev() {
    this.dataSearch.params.pageNo = this.dataSearch.params.pageNo - 1 > 0 ? this.dataSearch.params.pageNo - 1 : 1;
    if (this.end == this.dataSearch.params.pageSize) {
      return false;
    }
    this.getContacts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next() {
    this.dataSearch.params.pageNo = (this.dataSearch.params.pageNo + 1) <= this.totalPages ? this.dataSearch.params.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getContacts();
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
      this.selectedContactIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
    }
    // get set quickview local storage config end
  }

  /* multi-select */
  isAllSelected() {
    const selectedContactListCount = this.contactList.filter(x => x.isSelected).length;
    if (this.contactList.length == selectedContactListCount) {
      this.isAllCheckBoxSelected = true;
    } else {
      this.isAllCheckBoxSelected = false;
    }
  }

  checkUncheckAll() {
    this.contactList.forEach(contact => {
      if (!contact.isPaused && contact.isActive) {
        contact.isSelected = this.isAllCheckBoxSelected;
      }
    });
  }

  assignBulkUsersToContacts(){
    if (this.contactList.filter(f => f.isSelected).length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.MESSAGE_SELECT_ONE_CONTACT'));
      return;
    }

    const distinctStages = [...new Set(this.contactList.filter(f => f.isSelected).map(item => item.stageID))];

    if (distinctStages.length > 1) {
      this.showLayout == LayoutTypes.ListView ? this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.MESSAGE_SELECT_SAME_STATUS')) :
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.MESSAGE_SELECT_SAME_STAGE'));
      return;
    }

    const params = this.prepareParamsForAssignedToUsers(distinctStages[0], '');
    this._commonHelper.showLoader();
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CONTACTASSIGNEDTO, params).then((response: any) => {
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.ASSIGNED_TO_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // get selected
        const selectedContact = [...new Set(this.contactList.filter(f => f.isSelected).map(item => item.id))];
        // prepare object to send to backend to save
        const obj = {
          selectedContactIds: selectedContact.toString(),
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: distinctStages[0]
        };

        this._commonHelper.showLoader();
        this._contactService.UpdateContactBulkAssignedToUsers(obj).then((response: any) => {
          this._commonHelper.hideLoader();
          this.modalRef.close();
          this.refreshData();
          if (response) {
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.MESSAGE_CONTACT_BULKASSIGNEDTO'));
          }
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            this.modalRef.close();
            if (error != null && String(error.messageCode).toLowerCase() === 'contacts.contactdatamismatched') {
              this.refreshData();
            }
          });
      });
    });
  }

  private handlePausedOrDeleteTaskError(error: any, workTaskStageId: number) {
    if (error != null && (String(error.messageCode).toLowerCase() === 'contacts.pausedordeleteerror' || String(error.messageCode).toLowerCase() === 'entitystage.pausedordeleteerror')
      || String(error.messageCode).toLowerCase() === 'contacts.closedorcompleted') {
      if (!this.dataSearch.isPageTabularView) {
        // refresh current stage
        this.getEntityStageData(workTaskStageId, false);
      } else {
        this.dataSearch.params.pageNo = 1;
        this.contactList = [];
        this.getContacts();
      }
    }
  }

  //Export Contact

  exportExcel() {
    this.exportContact(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportContact(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();
    let excelExportPayload = this._commonHelper.cloningObject(this.dataSearch.params);
    excelExportPayload.exportType = exportType;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";
    let fileName = this._commonHelper.getConfiguredEntityName('{{Contacts_plural_p}}') + `_${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;

    if (!this.dataSearch.isPageTabularView) {
      excelExportPayload.stageIds = null;
    }
    
    this._contactService.exportContacts(excelExportPayload).then((base64String: any) => {
      this._commonHelper.hideLoader();
      if (base64String && base64String != '') {
        this._commonHelper.downloadFile(`${fileName}${fileExtension}`, fileMimeType, base64String);
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('KANBAN.MESSAGE_NO_DATA_EXPORT'));
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  // Set card/row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Contacts_Workflow_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get card/row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Contacts_Workflow_SelectedItem);
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

  private getEntityRecordTypes() {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    return new Promise((resolve, reject) => {
      const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntityRecordTypes == null) {
        this.showEntityRecordTypeLoader = true;
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Contacts).map(x => ({ 'label': x.name, 'value': x.id }));
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
            this.opportunityRecordTypes = response?.filter((s: any) => s.entityTypeID == Entity.Opportunities && (s.parentEntityTypeID == this.entityTypeId));
            this.casesRecordTypes = response?.filter(x => x.entityTypeID == Entity.Cases && x.parentEntityTypeID == this.entityTypeId);
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
        this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Contacts).map(x => ({ 'label': x.name, 'value': x.id }));
        this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
        this.opportunityRecordTypes = allEntityRecordTypes?.filter((s: any) => s.entityTypeID == Entity.Opportunities && (s.parentEntityTypeID == this.entityTypeId));
        this.casesRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases && x.parentEntityTypeID == this.entityTypeId);
        resolve(this.recordTypes);
      }
    });
  }

  private prepareParamsForWorkflows() {
    return [ { name: 'EntityTypeID', type: 'int', value: Entity.Contacts }];
  }

  private getWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Contacts}`;
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
    this.modalRef.componentInstance.workflows = this.worktaskWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityWorkTaskPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Contacts;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshWorkTaskTab = true;
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
            this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.CONTACT.LIST.FILTER_OPTION_TEXT_WORKFLOW') });
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

    let messageText = contact.isActive ? 'CRM.CONTACT.LIST.MESSAGE_CONFIRM_INACTIVE' : 'CRM.CONTACT.LIST.MESSAGE_CONFIRM_ACTIVE';
    let successText = contact.isActive ? 'CRM.CONTACT.LIST.MESSAGE_CONTACT_INACTIVATED' : 'CRM.CONTACT.LIST.MESSAGE_CONTACT_ACTIVATED';

    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._contactService.changeStatus(contact.id, !contact.isActive).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
          }
          this.getContacts();
          this._commonHelper.hideLoader();
        }, (error) => {
          this.getContacts();
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
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
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ContactKanbanViewKey, JSON.stringify(this.dataSearch), this.localStoragePrefix);
        this.refreshData();
      });
  }
}
