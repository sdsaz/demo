//ANGULAR
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
//COMMON
import { DataSources, DownloadFileMimeType, Entity, ExportType, FileExtension, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, RefType, ReferenceType, SectionCodes, UserTypeID } from '../../../@core/enum';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { AllOpportunitiesListPagingParams } from '../../../@core/sharedModels/paging-params.model';
//SERVICES
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { SettingsService } from '../../settings/settings.service';
import { OpportunitiesService } from '../opportunities.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
//COMPONENTS
import { UserAssignDialogComponent } from '../../../@core/sharedComponents/user-assign/user-assign-dialog/user-assign-dialog.component';
import { OpportunityAddComponent } from '../opportunity-add/opportunity-add.component';
import { WorkflowAssignDialogComponent } from '../../../@core/sharedComponents/workflow-assign-dialog/workflow-assign-dialog/workflow-assign-dialog.component';
//PRIMNG
import { Table } from 'primeng/table';
import { MultiSelect } from 'primeng/multiselect';
//OTHER
import { fromEvent, map, filter, debounceTime } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { PriorityDialogComponent } from '../../../@core/sharedComponents/priority-dialog/priority-dialog.component';
import { SeverityDialogComponent } from '../../../@core/sharedComponents/severity-dialog/severity-dialog.component';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';
import { WorktaskAddComponent } from '../../worktasks/worktask-add/worktask-add.component';
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';

@Component({
  selector: 'ngx-opportunity-all-listing',
  templateUrl: './opportunity-all-listing.component.html',
  styleUrls: ['./opportunity-all-listing.component.scss']
})

export class OpportunityAllListingComponent implements OnInit {

  @ViewChild('searchTextInput') searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;

  //permissions
  isListOpportunities: boolean = false;
  isViewOpportunities: boolean = false;
  isAddOpportunities: boolean = false;
  isEditOpportunities: boolean = false;
  isDeleteOpportunities: boolean = false;
  isViewAccounts: boolean = false;
  isAssignWorkflow: boolean = false;
  isExportOpportunities:boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAddWorkTask: boolean = false;
  isAssignOpportunities: boolean = false;
  isAllowToReopen: boolean = false;

  pagingParams: AllOpportunitiesListPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;

  localStoragePrefix: string = "";
  ratingOptions: any [] = [];
  accountList: any [] = [];

  cols: any[];
  isShowActionColumn: boolean = false;
  entityTypeId: number = Entity.Opportunities;
  EntityTitle: any;
  isShowEntityTypeNameIcon: boolean = true;
  showStarred:boolean = false;

  //Export Opportunity
  dynamicColumnNameSetting: any = {};
  CodeColumnName: string;
  AccountColumnName:string;

  showEntityRecordTypeLoader: boolean = false;
  showWorkflowLoader: boolean = false;

  //right side activity menu
  isShowActivityCenter: boolean = false;
  refreshActivityCenter: boolean = false;
  selectedOpportunityForActivityCenter: any
  selectedOpportunityIsClosedForActivityCenter: boolean = false;
  selectedOpportunityIsCompletedForActivityCenter: boolean = false;
  selectedOpportunityIdForActivityCenter: number = 0;
  selectedRowId:number = 0;
  entityDetails: any;
  entityWorkflowId: number = null;
  entityRecordTypeId: number;
  isAdvanceFilterVisible: boolean = false;
  
  // search filter
  opportunitiesSearchFilter = {
    searchText: '',
    recordTypeIds: null,
    workflowIds: null,
    stageIds: null,
    assignedToIds: null,
    accountIds: null,
    ownerIds: null,
    showMyOpportunities: false,
    rating: null,
    showStarred: false
  };

  isInitialLoading: boolean = true;
  currentStage: any;
  selectedStage: any;
  opportunityAssignedTo: any;
  opportunitiesListByStages: any[] = [];
  entityStagesWithTasksStorageKey : string = LocalStorageKey.OpportunityEntityStageWithTasksKey;

  opportunitiesList: any[] = [];
  selectedWorkflows: any = null;
  stages: any = null;
  stagesForFilter: any = null;
  selectedStages: any = null;
  owners: any[] = [];
  selectedOwner: any;
  assignedToUsers: any[] = [];
  selectedUser: any;
  selectedAccount:any;
  recordTypes = null;
  recordTypesDetail= null;
  selectedRecordTypes: any = null;
  showMyOpportunities: boolean = false;
  workflows: any;
  priorityDetails: any = null;
  severityDetails: any = null;
  quickViewConfig: any;

  isAllCheckBoxSelected: boolean;

  private modalRef: NgbModalRef | null;
  private optionsForPopupDialog: any = {
    size: 'md',
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  rowActionButtonMouseHoverFlag: boolean = false;
  keyfieldResponseData: any;
  currencySymbol: any = null;
  hoursInDay:number = null;

  opportunityCreatedBy: number;

   // add worktask 
   worktaskRecordTypes: any;
   worktaskWorkflowList: any = null;
   refreshWorkTaskTab;

   entityHiddenFieldSettings: any;
   entitySubTypes: any = [];
   workTaskSubTypeDetails: any;
   userTypeID = UserTypeID;

   entityHasWorkflow: boolean;
   hideRecordTypeFilter = null;

   isStageClosedOrCompleted: number;
   
  constructor(private _opportunityService: OpportunitiesService, public _commonHelper: CommonHelper,
    private _dataSourceService: DatasourceService,
    private _router: Router,
    private _confirmationDialogService: ConfirmationDialogService,
    private _commonService: CommonService,
    private _settingsService: SettingsService,
    private _modalService: NgbModal,
    private _workflowManagementService: WorkflowmanagementService,
    private _fileSignedUrlService: FileSignedUrlService) {
    this.EntityTitle = this._commonHelper.getEntityTitleFromMenuItemByUrl(decodeURI(this._router.url));
    this.checkPermission();
    this.initializePagination();
    this.setColumnDefinitions();
    this.setRatingOptions();
  }

  ngOnInit(): void {

    const _loggedInUser = this._commonHelper.getLoggedUserDetail();

    //set local storage prefix
    this.localStoragePrefix = `${_loggedInUser?.tenantId}_${_loggedInUser?.userId}`;

    Promise.all([
      this.getCurrencySymbol(),
      this.getHoursInDay(),
      this.getEntityRecordTypes(),
      this.getWorkflowList(),
      this.getEntityStageList(),
      this.getAssignedToUsers(null, 0, ''),
      this.getAccountList(null,''),
      this.getOwnerUsers(null, 0, ''),
      this.getPriorityFromReferenceType(),
      this.getSeverityFromReferenceType(),
      this.getWorktaskWorkflowList(),
      this.getEntityHiddenField(),
      this.getEntitySubTypes()
    ]).then(() => {
      this.checkEntityHasAnyActiveWorkflow();
      this.setLastSearchFilterFromStorage();
      this.getAllOpportunities(this.pagingParams);
      this.subscribeSearchBoxEvent();
      this.workTaskSubTypeDetails = this.entitySubTypes?.find(x => x.level == 1);
      this.CodeColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.EXPORT_CODE_LABEL'));
      this.AccountColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.TABLE_HEADER_ACCOUNT'));
      
      //new function 'set header column'
      const distinctStages = [...new Set(this.workflows.filter(f => f.parentEntityTypeID != null).map(item => item.parentEntityTypeID))];
      let tabInfo = this.cols.find(x => x.field === 'accountName');
      if (distinctStages != null && distinctStages.length == 1) {
        if (tabInfo) {
          tabInfo.header = this._commonHelper.entityTypeList.find(de => de['id'] == distinctStages[0]).displayName;
        }
        this.isShowEntityTypeNameIcon = false;
      }
      this.dynamicColumnNameSetting = {};
      this.dynamicColumnNameSetting["Code"] = this.CodeColumnName;
      this.dynamicColumnNameSetting["AccountName"] = this.AccountColumnName;

    });

    // get set quickview local storage config start
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedOpportunityIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
    }
    // get set quickview local storage config end

  }

  private checkPermission() {
    this.isListOpportunities = this._commonHelper.havePermission(enumPermissions.ListOpportunities);
    this.isAddOpportunities = this._commonHelper.havePermission(enumPermissions.AddOpportunity);
    this.isViewOpportunities = this._commonHelper.havePermission(enumPermissions.ViewOpportunity);
    this.isDeleteOpportunities = this._commonHelper.havePermission(enumPermissions.DeleteOpportunity);
    this.isEditOpportunities = this._commonHelper.havePermission(enumPermissions.EditOpportunity);
    this.isAssignWorkflow = this._commonHelper.havePermission(enumPermissions.AssignWorkflow);
    this.isShowActionColumn = this.isEditOpportunities || this.isDeleteOpportunities;
    this.isExportOpportunities=this._commonHelper.havePermission(enumPermissions.ExportOpportunities);
    this.isAssignOpportunities =this._commonHelper.havePermission(enumPermissions.AssignOpportunity);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadOpportunityDocument);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);
    this.isViewAccounts = this._commonHelper.havePermission(enumPermissions.ViewAccount);
  }

  private initializePagination(): void {
    this.pagingParams = new AllOpportunitiesListPagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'created';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private setColumnDefinitions(): void {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'code', header: 'OPPORTUNITIES.ALLLISTING.TABLE_HEADER_CODE', visible: true, sort: true, exportFieldName: 'code'},
      { field: 'name', header: 'OPPORTUNITIES.ALLLISTING.TABLE_HEADER_NAME', visible: true, sort: true, exportFieldName: 'name'},
      //{ field: 'entityName', header: 'OPPORTUNITIES.ALLLISTING.TABLE_HEADER_RELATED_TO', visible: true, sort: true, exportFieldName: 'entityName'},
      { field: 'accountName', header: 'OPPORTUNITIES.ALLLISTING.TABLE_HEADER_ACCOUNT', visible: true, sort: true ,exportFieldName: 'accountName'},
      { field: 'entityWorkFlowName', header: 'OPPORTUNITIES.ALLLISTING.TABLE_HEADER_WORKFLOW_NAME', visible: true, sort: true, class: "entityWorkFlowName", exportFieldName: 'entityWorkFlowName'},
      { field: 'stageName', header: 'OPPORTUNITIES.ALLLISTING.TABLE_HEADER_STAGE_NAME', visible: true, sort: true, exportFieldName: 'stageName'},
      { field: 'assignedToName', header: 'OPPORTUNITIES.ALLLISTING.TABLE_HEADER_ASSIGNEDTO', visible: true, sort: true, exportFieldName: 'assignedToName'},
      { field: 'ownerName', header: 'OPPORTUNITIES.ALLLISTING.TABLE_HEADER_OWNER', visible: true, sort: true, exportFieldName: 'ownerName'},
      { field: 'created', header: 'OPPORTUNITIES.ALLLISTING.TABLE_HEADER_CREATED', visible: true, sort: true, exportFieldName: 'utcCreated'},
      { field: 'id', header: '', visible: true, sort: false, class: "action ", display: 'td-display' }
    ];

    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.cols.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private getAllOpportunities(pagingParams: AllOpportunitiesListPagingParams) {
    this._commonHelper.showLoader();
    pagingParams.entityRecordTypeIds = this.opportunitiesSearchFilter.recordTypeIds;
    pagingParams.entityWorkflowIds = this.opportunitiesSearchFilter.workflowIds;
    pagingParams.stageIds = this.opportunitiesSearchFilter.stageIds;
    pagingParams.searchString = this.opportunitiesSearchFilter.searchText;
    pagingParams.assignedToIds = this.opportunitiesSearchFilter.assignedToIds;
    pagingParams.accountIds = this.opportunitiesSearchFilter.accountIds;
    pagingParams.ownerIds = this.opportunitiesSearchFilter.ownerIds;
    pagingParams.showMyOpportunities = this.opportunitiesSearchFilter.showMyOpportunities;
    pagingParams.rating = this.opportunitiesSearchFilter.rating;
    pagingParams.showStarred = this.opportunitiesSearchFilter.showStarred;

    this._opportunityService.GetOpportunitiesListWithPagination(pagingParams).then((response: any) => {
      if (response) {
        this.opportunitiesList = response as any[];
        this.opportunitiesList.forEach(data => {
          data['isSelected'] = false;
          data.relatedToIconToolTip = this._commonHelper.entityTypeList.find(entityType => entityType['id'] == data['entityTypeId'])?.displayName.toString().trim();
        });
        this.isAllCheckBoxSelected = false;

        this.totalRecords = this.opportunitiesList.length > 0 ? response[0].totalRecords : 0;
        this.pTable.rows = pagingParams.pageSize;
        this.totalPages = Math.ceil(this.totalRecords / pagingParams.pageSize);
        this.end = pagingParams.pageNo == this.totalPages ? this.totalRecords : pagingParams.pageNo * pagingParams.pageSize;
        this.start = this.end == this.totalRecords ? (this.totalRecords - this.opportunitiesList.length + 1) : (this.end - pagingParams.pageSize) + 1;
       
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
      
        if (this.selectedOpportunityIdForActivityCenter != null && this.selectedOpportunityIdForActivityCenter > 0 && this.opportunitiesList.some(x=>x.id == this.selectedOpportunityIdForActivityCenter)) {
          this.updateEntityDetails(true, this.opportunitiesList.find(x=>x.id == this.selectedOpportunityIdForActivityCenter));
        }
        else{
          this.resetSelectedEntity();
        }
      }
      this._commonHelper.hideLoader();
      this._fileSignedUrlService.getFileSingedUrl(this.opportunitiesList, 'assignedToImagePath', 'assignedToSignedUrl', Entity.Users)
        .then(() => {
          this._fileSignedUrlService.getFileSingedUrl(this.opportunitiesList, 'ownerImagePath', 'ownerSignedUrl', Entity.Users);
        });
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  private subscribeSearchBoxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.opportunitiesSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, JSON.stringify(this.opportunitiesSearchFilter), this.localStoragePrefix);
        this.getAllOpportunities(this.pagingParams);
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
            this.workflows.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.FILTER_OPTION_TEXT_WORKFLOW') });
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

  private prepareParamsForOpportunitiesStages() {
    return [{ name: 'EntityTypeID', type: 'int', value: Entity.Opportunities }];
  }

  private getEntityStageList() {
    return new Promise((resolve, reject) => {
      this.stages = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.OpportunityWorkFlowStageList));
      if (this.stages == null) {
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITYWORKFLOWSTAGES, this.prepareParamsForOpportunitiesStages()).then((response: any) => {
          if (response) {
            let rawStages: any[] = response as any[];
            let groupedStages: any = [];
            const distinctWorkflowIds = [...new Set(rawStages.map(item => item.entityWorkflowID))];
            distinctWorkflowIds.forEach(x => {
              let groupWorkflows: any = {
                label: null,
                items: [],
                value: x
              };
              rawStages.forEach(element => {
                if (element.entityWorkflowID == x) {
                  groupWorkflows.label = element.entityWorkflowName;
                  groupWorkflows.items.push({ label: element.label, value: element.value, groupLabel: element.entityWorkflowName });
                }
              });
              groupedStages.push(groupWorkflows);
            });

            this.stages = groupedStages;
            this.stagesForFilter = this.stages;
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.OpportunityWorkFlowStageList, JSON.stringify(this.stages));
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
        this.stagesForFilter = this.stages;
        resolve(null);
      }
    });
  }

  private prepareParamsForAssignedToUsersAllOpportunities(assignedTo, includeAllUsers = 1, searchString = null) {
    return [
      { name: 'SelectedUserID', type: 'int', value: assignedTo },
      { name: 'IncludeAllUsers', type: 'bit', value: includeAllUsers },
      { name: 'SearchString', type: 'string', value: searchString }
    ];
  }

  private getAssignedToUsers(selectedUserId, includeAllUsers, searchString: any) {
    return new Promise((resolve, reject) => {

      // prepare params
      const params = this.prepareParamsForAssignedToUsersAllOpportunities(selectedUserId, includeAllUsers, searchString);
      // call datasource service with params
      this._commonHelper.showLoader();
      return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALLOPPORTUNITYASSIGNEDTO, params).then((response: any[]) => {
        if (response) {
          this.assignedToUsers = response;
          this.assignedToUsers.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.FILTER_OPTION_TEXT_ASSIGNEDTO') });
          this.assignedToUsers.sort((a, b) => a.value - b.value);
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

  getAccountList(selectedAccountId, searchString: any) {
    return new Promise((resolve, reject) => {
     
      var param = this.prepareParamsForAccounts(Entity.Accounts.toString(),selectedAccountId, 0, searchString);
      //this.showAccountLoader = true;
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALL_RELATED_ENTITIES,param).then((response: any) => {
        //account type
        if (response.length != 0) {
          this.accountList = response as [];
          this.accountList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.FILTER_OPTION_TEXT_ACCOUNT') });
          this.accountList.sort((a, b) => a.value - b.value);
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

  private prepareParamsForAllUsers(ownerId, includeAllUsers = 1, searchString = '') {
    return [{ name: 'SelectedUserID', type: 'int', value: ownerId },
    { name: 'IncludeAllUsers', type: 'bit', value: includeAllUsers },
    { name: 'SearchString', type: 'string', value: searchString }]
  }

  private getOwnerUsers(selectedUserId, includeAllUsers, searchString: any) {
    return new Promise((resolve, reject) => {

      
      // call datasource service with params
      this._commonHelper.showLoader();

      // prepare params
      const params = this.prepareParamsForAllUsers(selectedUserId, includeAllUsers, searchString);

      return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALLOPPORTUNITYASSIGNEDTO, params).then((response: any) => {
        if (response) {
          this.owners = response;
          this.owners.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.FILTER_OPTION_TEXT_ASSIGNEDTO') });
          this.owners.sort((a, b) => a.value - b.value);
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

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, this.localStoragePrefix));
    if (searchFilter != null) {
      this.opportunitiesSearchFilter = searchFilter;
      this.showStarred = this.opportunitiesSearchFilter.showStarred;
      if (this.opportunitiesSearchFilter.recordTypeIds != null && this.opportunitiesSearchFilter.recordTypeIds != '') {
        this.selectedRecordTypes = this.opportunitiesSearchFilter.recordTypeIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedRecordTypes = null;
      }

      if (this.opportunitiesSearchFilter.workflowIds != null && this.opportunitiesSearchFilter.workflowIds != '') {
        this.selectedWorkflows = this.opportunitiesSearchFilter.workflowIds.split(',').map(x => Number(x)) as [];
      } else {
        this.selectedWorkflows = null;
      }

      if (this.opportunitiesSearchFilter.stageIds != null && this.opportunitiesSearchFilter.stageIds != '') {
        this.selectedStages = this.opportunitiesSearchFilter.stageIds.split(',').map(x => Number(x)) as [];
      } else {
        this.selectedStages = null;
      }

      if (this.opportunitiesSearchFilter.assignedToIds != null && this.opportunitiesSearchFilter.assignedToIds != '') {
        this.selectedUser = this.opportunitiesSearchFilter.assignedToIds.split(',').map(x => Number(x)) as [];
      } else {
        this.selectedUser = null;
      }

      if (this.opportunitiesSearchFilter.accountIds != null && this.opportunitiesSearchFilter.accountIds != '') {
        this.selectedAccount = this.opportunitiesSearchFilter.accountIds.split(',').map(x => Number(x)) as [];
      } else {
        this.selectedAccount = null;
      }

      if (this.opportunitiesSearchFilter.ownerIds != null && this.opportunitiesSearchFilter.ownerIds != '') {
        this.selectedOwner = this.opportunitiesSearchFilter.ownerIds.split(',').map(x => Number(x)) as [];
      } else {
        this.selectedOwner = null;
      }
      this.pagingParams.rating = this.opportunitiesSearchFilter.rating;
      this.showMyOpportunities = this.opportunitiesSearchFilter.showMyOpportunities;
    }
  }

  private prepareParamsForAssignedToUsers(workFlowId, stageID, assignedTo, includeAllUsers = 0, searchString = null) {
    return [
      { name: 'EntityWorkFlowID', type: 'int', value: workFlowId },
      { name: 'StageID', type: 'int', value: stageID },
      { name: 'SelectedUserID', type: 'int', value: assignedTo },
      { name: 'IncludeAllUsers', type: 'bit', value: includeAllUsers },
      { name: 'SearchString', type: 'string', value: searchString }
    ]
  }

  trimFilterValue(e: any, multiSelect: MultiSelect) {
    multiSelect.filterValue = String(e.filter).trim();
    multiSelect.filterInputChild.nativeElement.value = String(e.filter).trimStart();
  }

  setRatingOptions(){
    this._commonHelper.setRatingOptions().then((response) => { this.ratingOptions = response as []; });
  }

  onFilterRating(event) {
    this.opportunitiesSearchFilter.rating = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, JSON.stringify(this.opportunitiesSearchFilter), this.localStoragePrefix);
    this.getAllOpportunities(this.pagingParams);
  }

  onFilterShowStarred() {
    this.opportunitiesSearchFilter.showStarred = this.showStarred;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, JSON.stringify(this.opportunitiesSearchFilter), this.localStoragePrefix);
    this.pagingParams.pageNo = 1;
    this.getAllOpportunities(this.pagingParams);
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

  public onFilterRecordType(event) {
    this.opportunitiesSearchFilter.recordTypeIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, JSON.stringify(this.opportunitiesSearchFilter), this.localStoragePrefix);
    this.pagingParams.pageNo = 1;
    this.getAllOpportunities(this.pagingParams);
  }

  onFilterWorkflow(event) {
    this.stagesForFilter = this.stages;
    if (event.value != null && event.value.toString() != '') {
      let filteredStages: any[] = [];
      event.value.toString().split(',').forEach(x => {
        this.stagesForFilter.filter(y => y.value == x).forEach(z => {
          filteredStages.push(z);
        });
      });
      this.stagesForFilter = filteredStages;
    }

    this.opportunitiesSearchFilter.workflowIds = event.value.toString();

    this.opportunitiesSearchFilter.stageIds = null;
    this.pagingParams.stageIds = null;
    this.pagingParams.pageNo = 1;
    this.selectedStages = null;

    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, JSON.stringify(this.opportunitiesSearchFilter), this.localStoragePrefix);
    this.getAllOpportunities(this.pagingParams);
  }

  onFilterStage(event) {
    this.opportunitiesSearchFilter.stageIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, JSON.stringify(this.opportunitiesSearchFilter), this.localStoragePrefix);
    this.pagingParams.pageNo = 1;
    this.getAllOpportunities(this.pagingParams);
  }

  onFilterAssignTo(event) {
    this.opportunitiesSearchFilter.assignedToIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, JSON.stringify(this.opportunitiesSearchFilter), this.localStoragePrefix);
    this.pagingParams.pageNo = 1;
    this.getAllOpportunities(this.pagingParams);
  }

  onFilterAccount(event) {
    this.opportunitiesSearchFilter.accountIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, JSON.stringify(this.opportunitiesSearchFilter), this.localStoragePrefix);
    this.pagingParams.pageNo = 1;
    this.getAllOpportunities(this.pagingParams);
  }

  onFilterOwner(event) {
    this.opportunitiesSearchFilter.ownerIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, JSON.stringify(this.opportunitiesSearchFilter), this.localStoragePrefix);
    this.pagingParams.pageNo = 1;
    this.getAllOpportunities(this.pagingParams);
  }

  ownerOnFilter(e, selectedUser) {
    this.getOwnerUsers(selectedUser?.toString(), 0, e.filter);
  }

  assignedToOnFilter(e, selectedUser) {
    this.getAssignedToUsers(selectedUser?.toString(), 0, e.filter);
  }

  accountOnFilter(e, selectedAccount) {
    this.getAccountList(selectedAccount?.toString(), e.filter);
  }

  onFilterShowMyOpportunity() {
    this.opportunitiesSearchFilter.showMyOpportunities = this.showMyOpportunities;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, JSON.stringify(this.opportunitiesSearchFilter), this.localStoragePrefix);
    this.pagingParams.pageNo = 1;
    this.getAllOpportunities(this.pagingParams);
  }

  onResetAllFilters() {
    this.opportunitiesSearchFilter.searchText = '';
    this.opportunitiesSearchFilter.recordTypeIds = null;
    this.opportunitiesSearchFilter.workflowIds = null;
    this.opportunitiesSearchFilter.stageIds = null;
    this.opportunitiesSearchFilter.assignedToIds = null;
    this.opportunitiesSearchFilter.accountIds = null;
    this.opportunitiesSearchFilter.ownerIds = null;
    this.opportunitiesSearchFilter.showMyOpportunities = false;
    this.opportunitiesSearchFilter.rating = null;
    this.opportunitiesSearchFilter.showStarred = false;

    this.selectedRecordTypes = null;
    this.selectedWorkflows = null;
    this.selectedStages = null;
    this.stagesForFilter = this.stages;
    this.selectedUser = null;
    this.selectedAccount = null;
    this.selectedOwner = null;
    this.showMyOpportunities = false;
    this.showStarred = false;

    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'created';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.entityRecordTypeIds = null;
    this.pagingParams.entityWorkflowIds = null;
    this.pagingParams.stageIds = null;
    this.pagingParams.assignedToIds = null;
    this.pagingParams.accountIds = null;
    this.pagingParams.ownerIds = null;
    this.pagingParams.showMyOpportunities = false;
    this.pagingParams.rating = null;
    this.pagingParams.showStarred = false;

    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ALLOpportunitiesListKey, JSON.stringify(this.opportunitiesSearchFilter), this.localStoragePrefix);
    this.getAllOpportunities(this.pagingParams);
  }

  isAllSelected() {
    const selectedOpportunitiesListCount = this.opportunitiesList.filter(x => x.isSelected).length;

    if (this.opportunitiesList.length == selectedOpportunitiesListCount) {
      this.isAllCheckBoxSelected = true;
    } else {
      this.isAllCheckBoxSelected = false;
    }
  }

  checkUncheckAll() {
    this.opportunitiesList.forEach(opportunity => {
      opportunity.isSelected = this.isAllCheckBoxSelected;
    });
  }

  //delete opportunity - confirmation dialog
  deleteOpportunity(opportunityId) {
    //option for confirm dialog settings
    const optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('OPPORTUNITIES.ALLLISTING.MESSAGE_CONFIRM_OPPORTUNITY_DELETE', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._opportunityService.deleteOpportunity(opportunityId).then(() => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_OPPORTUNITY_DELETE')
            );
            this.totalRecords = this.totalRecords - 1;
            this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.pagingParams.pageSize) : 1;
            this.getAllOpportunities(this.pagingParams);
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }
      })
      .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITY_DISMISS_DIALOG.OPPORTUNITY_DISMISS_DIALOG')));
  }

  public onPriorityClick(opportunity = null) {
    if (!this.isEditOpportunities) {
      return;
    }

    if (opportunity != null && opportunity.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.PRIORITY_DIALOG.MESSAGE_CANNOT_CHANGE_PRIORITY_PAUSED'));
      return;
    }

    if (opportunity != null && (opportunity.isClosedStage || opportunity.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.PRIORITY_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: opportunity?.stageName }));
      return;
    }

    this._commonHelper.showLoader();
    // call data source service with code
    this._dataSourceService.getDataSourceDataByCode(DataSources.PRIORITY).then((response: any) => {
      this._commonHelper.hideLoader();
      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      // open dialog
      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(PriorityDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.priorities = response;
      this.modalRef.componentInstance.priorityId = opportunity?.priority;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.PRIORITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.prioritySelectLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.PRIORITY_DIALOG.PRIORITY_SELECT_LABEL');
      this.modalRef.componentInstance.prioritySelectPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.PRIORITY_DIALOG.PRIORITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangePriority.subscribe((selectedPriorityId) => {
        // prepare object to send to backend to save
        let obj = {
          entityId: opportunity?.id,
          priority: selectedPriorityId,
          EntityWorkflowId: opportunity?.entityWorkFlowID
        };

        this._commonHelper.showLoader();
        this._opportunityService.updateOpportunityPriority(obj).then(response => {
          if (response) {
            this.getAllOpportunities(this.pagingParams);
            // success message
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_SUCCESS_PRIORITY')
            );
            this._commonHelper.hideLoader();
          }
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });

        // close
        this.modalRef.close();
      });
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  onSeverityClick(opportunity = null) {
    if (!this.isEditOpportunities) {
      return;
    }
    
    if (opportunity != null && opportunity.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.SEVERITY_DIALOG.MESSAGE_CANNOT_CHANGE_SEVERITY_PAUSED'));
      return;
    }

    if (opportunity != null && (opportunity.isClosedStage || opportunity.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.SEVERITY_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: opportunity?.stageName }));
      return;
    }
    
    this._commonHelper.showLoader();
    // call data source service with code
    this._dataSourceService.getDataSourceDataByCode(DataSources.SEVERITY).then((response: any) => {
      this._commonHelper.hideLoader();
      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      // open dialog
      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(SeverityDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.severities = response;
      this.modalRef.componentInstance.severityId = opportunity?.severity;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.SEVERITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.severitySelectLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.SEVERITY_DIALOG.SEVERITY_SELECT_LABEL');
      this.modalRef.componentInstance.severitySelectPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.SEVERITY_DIALOG.SEVERITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangeSeverity.subscribe((selectedSeverityId) => {
         // prepare object to send to backend to save
         let obj = {
          entityId: opportunity?.id,
          severity: selectedSeverityId,
          entityWorkflowId: opportunity?.entityWorkFlowID
        };

        this._commonHelper.showLoader();
        this._opportunityService.updateOpportunitySeverity(obj).then(response => {
          if (response) {
            this.getAllOpportunities(this.pagingParams);
            // success message
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_SUCCESS_SEVERITY')
            );
            this._commonHelper.hideLoader();
          }
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });

        // close
        this.modalRef.close();
      });
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  // assigned to user what to do
  onAssignedToClick(opportunity) {

    if (!this.isAssignOpportunities) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_NOT_HAVE_PERMISSION'));
      return;
    }

    if (opportunity != null && opportunity.entityWorkFlowID == null) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.ASSIGNED_TO_DIALOG.MESSAGE_CANNOT_ASSIGN_USER'));
      return;
    }
    
    if (opportunity != null && (opportunity.isClosedStage || opportunity.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.ASSIGNED_TO_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_OPPORTUNITY', { stageName: opportunity.stageName }));
      return;
    }

    this._commonHelper.showLoader();

    // prepare params
    const params = this.prepareParamsForAssignedToUsers(opportunity.entityWorkFlowID, opportunity.stageID, opportunity.assignedTo);
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYASSIGNEDTO, params).then((response: any) => {
      //set owner 1 list
      const assignedToUsers = response;
      this._commonHelper.hideLoader();
      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      // open dialog
      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(UserAssignDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.users = assignedToUsers;
      this.modalRef.componentInstance.assignedUserId = opportunity.assignedTo;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.ASSIGNED_TO_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        const obj = {
          entityId: opportunity.id,
          assignedToId: selectedUserId,
          entityWorkflowId: opportunity.entityWorkFlowID,
          stageId: opportunity.stageID
        };

        this._commonHelper.showLoader();
        this._opportunityService.updateOpportunityAssignedTo(obj).then((response: any) => {
          if (response) {
            this._commonHelper.showLoader();
            this._workflowManagementService.saveEntityStageTransition({ entityTypeId: Entity.Opportunities, entityId: opportunity.id, entityWorkflowId: opportunity.entityWorkFlowID, stageId: opportunity.stageID, assignedTo: selectedUserId }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_OPPORTUNITY_ASSIGNEDTO'));
              }
              this._commonHelper.hideLoader();
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              }
            );
          }
          this.getAllOpportunities(this.pagingParams);
          this._commonHelper.hideLoader();
          // close
          this.modalRef.close();
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  onOwnerClick(opportunity) {
    if (!this.isEditOpportunities || !this.isViewOpportunities) {
      return;
    }

    if ((opportunity != null && (opportunity.isClosedStage || opportunity.isCompletedStage))) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: opportunity.stageName }));
      return;
    }

    if (opportunity != null && opportunity.entityWorkFlowID == null) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.ASSIGNED_TO_DIALOG.MESSAGE_CANNOT_ASSIGN_USER'));
      return;
    }

    this._commonHelper.showLoader();
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.OPPORTUNITYOWNERS, this.prepareParamsForAllUsers(opportunity.ownerID, 0, '')).then((response: any) => {
      const ownerList = response;
      this._commonHelper.hideLoader();
      if (this._modalService.hasOpenModals()) {
        return;
      }

      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(UserAssignDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.users = ownerList;
      this.modalRef.componentInstance.assignedUserId = opportunity.ownerID;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.OWNER_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.OWNER_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.OWNER_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedOwnerId) => {
        const obj = {
          entityId: opportunity.id,
          ownerID: selectedOwnerId,
          entityWorkflowId: opportunity.entityWorkFlowID
        };

        this._commonHelper.showLoader();
        this._opportunityService.updateOpportunityOwner(obj).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            this.getAllOpportunities(this.pagingParams);
          }
          // success message
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_OPPORTUNITY_OWNER')
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

  // open add popup
  addOpportunity() {
    this.optionsForPopupDialog.size = "lg";
    this.modalRef = this._modalService.open(OpportunityAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityWorkflowId = null;
    this.modalRef.componentInstance.entityTypeId = null;
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.workflows = this.workflows?.filter(x => x.value != 0);
    this.modalRef.componentInstance.entityRecordTypes = this.recordTypesDetail;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.getAllOpportunities(this.pagingParams);
      }
    });
  }

  //#region  Assign WorkFlow Related Methods

  onAssignWorkflow(opportunity: any) {

    if (!this.isEditOpportunities || !this.isAssignWorkflow) {
      return;
    }

    if (opportunity != null && (opportunity.isClosedStage || opportunity.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.ASSIGNED_TO_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_OPPORTUNITY', { stageName: opportunity.stageName }));
      return;
    }

    // filter workflows based on Parent Entity Type ID
    let filteredWorkflows = this.workflows.filter(x => x.value != 0);
    let isWorkflowAssign: boolean = opportunity?.entityWorkFlowID != null;
    /*if (opportunity?.entityTypeId != null && opportunity?.entityTypeId > 0) {
      filteredWorkflows = filteredWorkflows.filter(x => (x.isDefault != null && x.isDefault == true) || x.parentEntityTypeID == opportunity?.entityTypeId);
    }*/

    if (filteredWorkflows?.length == 0) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }

    if (filteredWorkflows?.length <= 1 && isWorkflowAssign) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }

    this._commonHelper.showLoader();
    this._workflowManagementService.IsEntityEligibleToChangeWorkflow(Entity.Opportunities, opportunity.id, opportunity.entityWorkFlowID == null).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response) {
        //TO BE DELETED PN - 15-12-2023 - SDC-3362
        // else if (opportunity?.entityRecordTypeId != null && opportunity?.entityRecordTypeId > 0) {
        //   if (filteredWorkflows.some(x => x.entityRecordTypeId == opportunity?.entityRecordTypeId)) {
        //     let parentEntityTypeId = filteredWorkflows.filter(x => x.entityRecordTypeId == opportunity?.entityRecordTypeId)[0]?.parentEntityTypeID;
        //     filteredWorkflows = filteredWorkflows.filter(x => (x.parentEntityTypeID == null && x.entityRecordTypeId == null) || x.parentEntityTypeID == parentEntityTypeId);
        //   }
        // }

        this.optionsForPopupDialog.size = "md";
        this.modalRef = this._modalService.open(WorkflowAssignDialogComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.workflows = filteredWorkflows;
        this.modalRef.componentInstance.workflowId = opportunity.entityWorkFlowID;
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.WORK_ASSIGN_DIALOG.DIALOG_TITLE');
        this.modalRef.componentInstance.workflowSelectLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.WORK_ASSIGN_DIALOG.WORKFLOW_SELECT_LABEL');
        this.modalRef.componentInstance.workflowSelectPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.WORK_ASSIGN_DIALOG.WORKFLOW_STAGE_SELECT_PLACEHOLDER');

        this.modalRef.componentInstance.OnSubmitAssignWorkflow.subscribe((selectedWorkflowId) => {
          if (selectedWorkflowId != opportunity.entityWorkFlowID) {
            //option for confirm dialog settings
            const optionsForConfirmDialog = {
              size: "md",
              centered: false,
              backdrop: 'static',
              keyboard: false
            };
            this._confirmationDialogService.confirm('OPPORTUNITIES.ALLLISTING.MESSAGE_CONFIRM_ASSIGN_OPPORTUNITY', null, null, optionsForConfirmDialog, true).then((confirmed) => {
              if (confirmed) {
                this._commonHelper.showLoader();
                this._workflowManagementService.DeleteRelatedDataToChangeWorkflow(Entity.Opportunities, opportunity.id).then((response: any) => {
                  this._commonHelper.hideLoader();
                  //prepare object to send to backend to save
                  const params = {
                    EntityWorkflowId: selectedWorkflowId,
                    EntityType: Entity.Opportunities,
                    Id: opportunity.id,
                    AssignedTo: opportunity.assignedTo,
                    EntityWorkflowRecordKey: null,
                    SelectedStageTaskIds: null,
                    IsAdd: true
                  };

                  this._commonHelper.showLoader();
                  this._workflowManagementService.postSaveEntityProcess(params).then(() => {
                    this._opportunityService.changeEntityRecordType(opportunity.id, this.workflows.filter(x => x.value == selectedWorkflowId)[0].entityRecordTypeID).then(() => {
                      this._opportunityService.changeOpportunityEntityType(opportunity.id, selectedWorkflowId).then(() => {
                        // success message
                        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_WORKFLOW_ASSIGN_SUCCESS'));
                        this._commonHelper.hideLoader();
                        this.getAllOpportunities(this.pagingParams);
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

                // close
                this.modalRef.close();
              }
            });
          }
          else {
            // close
            this.modalRef.close();
          }
        });
      }
      else {
        //Opportunity is not eligible to assign workflow
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_WORKFLOW_ASSIGN_NOTELIGIBLE'));
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  /**
   * Assign Bulk Work Flow For Work Task
   * @returns
   */
  assignWorkflow() {

    const selectedWorkList = this.opportunitiesList.filter(x => x.isSelected);

    if (selectedWorkList.length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MEESAGE_SELECT_ONE_OPPORTUNTY'));
      return;
    }

    // filter workflows based on Parent Entity Type ID
    const distinctEntity = [...new Set(selectedWorkList.map(item => item.entityWorkFlowID))];
    let filteredWorkflows = this.workflows.filter(x => x.value != 0);
    let isWorkflowAssign: boolean = distinctEntity?.[0] != null;

    if (filteredWorkflows?.length == 0) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }

    if (filteredWorkflows?.length <= 1 && isWorkflowAssign) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }

    //TO BE DELETED PN - 15-12-2023 - SDC-3362
    // const distinctEntityRecordType = [...new Set(selectedWorkList.map(item => item.entityRecordTypeId))];
    // if (distinctEntityRecordType.length > 1) {
    //   this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
    //   return;
    // }

    /*if (distinctEntityType.length > 1) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
      return;
    }

    if (distinctEntity.length > 1) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
      return;
    }*/

    let eligibilityParams: any[] = [];
    selectedWorkList.forEach(x => {
      const param = {
        entityTypeId: Entity.Opportunities,
        entityId: x.id,
        bypassWokflowChecking: x.entityWorkFlowID == null
      }
      eligibilityParams.push(param);
    });

    this._commonHelper.showLoader();
    this._workflowManagementService.BulkCheckIsEntityEligibleToChangeWorkflow(eligibilityParams).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response) {
        //TO BE DELETED PN - 15-12-2023 - SDC-3362
        // else if (distinctEntityRecordType != null && distinctEntityRecordType.length > 0 && distinctEntityRecordType[0] > 0) {
        //   if (filteredWorkflows.some(x => x.entityRecordTypeId == distinctEntityRecordType[0])) {
        //     let parentEntityTypeId = filteredWorkflows.filter(x => x.entityRecordTypeId == distinctEntityRecordType[0])[0]?.parentEntityTypeID;
        //     filteredWorkflows = filteredWorkflows.filter(x => (x.parentEntityTypeID == null && x.entityRecordTypeId == null) || x.parentEntityTypeID == parentEntityTypeId);
        //   }
        // }

        this.optionsForPopupDialog.size = "md";
        this.modalRef = this._modalService.open(WorkflowAssignDialogComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.workflows = filteredWorkflows;
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.WORK_ASSIGN_DIALOG.DIALOG_TITLE');
        this.modalRef.componentInstance.workflowSelectLabel = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.WORK_ASSIGN_DIALOG.WORKFLOW_SELECT_LABEL');
        this.modalRef.componentInstance.workflowSelectPlaceholder = this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.WORK_ASSIGN_DIALOG.WORKFLOW_STAGE_SELECT_PLACEHOLDER');

        this.modalRef.componentInstance.OnSubmitAssignWorkflow.subscribe((selectedWorkflowId) => {
          //option for confirm dialog settings
          let optionsForConfirmDialog = {
            size: "md",
            centered: false,
            backdrop: 'static',
            keyboard: false
          };
          this._confirmationDialogService.confirm('OPPORTUNITIES.ALLLISTING.MESSAGE_CONFIRM_ASSIGN_OPPORTUNITY', null, null, optionsForConfirmDialog, true).then((confirmed) => {
            if (confirmed) {
              let DeleteRelatedDataParams: any[] = [];
              selectedWorkList.filter(x => x.entityWorkFlowID != selectedWorkflowId).forEach(x => {
                const param = {
                  entityTypeId: Entity.Opportunities,
                  entityId: x.id
                }
                DeleteRelatedDataParams.push(param);
              });

              this._commonHelper.showLoader();
              this._workflowManagementService.BulkDeleteRelatedDataToChangeWorkflow(DeleteRelatedDataParams).then((response: any) => {
                this._commonHelper.hideLoader();
                let arrOpportunities: any[] = [];
                let arrOpportunityIds: any[] = [];
                selectedWorkList.filter(x => x.entityWorkFlowID != selectedWorkflowId).forEach(x => {
                  const params = {
                    EntityWorkflowId: selectedWorkflowId,
                    EntityType: Entity.Opportunities,
                    Id: x.id,
                    AssignedTo: x.assignedTo,
                    EntityWorkflowRecordKey: null,
                    SelectedStageTaskIds: null,
                    IsAdd: true
                  };

                  arrOpportunities.push(params);
                  arrOpportunityIds.push(x.id);
                });

                this._commonHelper.showLoader();
                this._workflowManagementService.assignBulkWorkFlowForTask(arrOpportunities).then(res => {
                  this._opportunityService.changeEntityRecordType(arrOpportunityIds.toString(), this.workflows.filter(x => x.value == selectedWorkflowId)[0].entityRecordTypeID).then(res => {
                    this._opportunityService.changeOpportunityEntityType(arrOpportunityIds.toString(), selectedWorkflowId).then(() => {
                      // success message
                      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_WORKFLOW_ASSIGN_SUCCESS'));
                      this._commonHelper.hideLoader();
                      this.getAllOpportunities(this.pagingParams);
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
              // close
              this.modalRef.close();
            }
          });
        });
      }
      else {
        //one of the Opportunity is not eligible to assign workflow
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_WORKFLOW_BULKASSIGN_NOTELIGIBLE'));
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }
  //#endregion

  //#region Pagination Utility
  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.getAllOpportunities(this.pagingParams);
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
      this.getAllOpportunities(this.pagingParams);
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.getAllOpportunities(this.pagingParams);
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
    this.getAllOpportunities(this.pagingParams);
    this.pTable.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.getAllOpportunities(this.pagingParams);
    this.pTable.scrollTo({ top: 0, behavior: 'smooth' });
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getAllOpportunities(this.pagingParams);
    this.pTable.scrollTo({ top: 0, behavior: 'smooth' });
  }
  //#endregion

  //Export Opportunities Listing
  
  exportExcel()
  {
    this.exportOppotunity(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportOppotunity(exportType: string, fileExtension: string, fileMimeType: string){
    this._commonHelper.showLoader();

    const excelExportPayload = {
      entityRecordTypeIds: this.pagingParams.entityRecordTypeIds,
      entityWorkflowIds: this.pagingParams.entityWorkflowIds,
      stageIds: this.pagingParams.stageIds,
      searchString: this.pagingParams.searchString,
      assignedToIds: this.pagingParams.assignedToIds,
      accountIds: this.pagingParams.accountIds,
      ownerIds: this.pagingParams.ownerIds,
      showMyOpportunities: this.pagingParams.showMyOpportunities,
      sortColumn: this.pagingParams.sortColumn,
      sortOrder: this.pagingParams.sortOrder,
      exportType: exportType,
      pageNo: 1,
      pageSize: this._commonHelper.DefaultPageSize,
      rating: this.pagingParams.rating,
      dynamicColumnSettingJson: "",
      selectedExportColumns: null,
      showStarred: this.pagingParams.showStarred
    }
    
    const visibleColumns = this.cols.filter(i => i.visible && i.exportFieldName).map((i, index) => ({ field: i.exportFieldName, index: index }));

    if (visibleColumns)
      excelExportPayload['selectedExportColumns'] = visibleColumns;

    let fileName = this._commonHelper.getConfiguredEntityName('{{Opportunities_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    this._opportunityService.exportOpportunity(excelExportPayload).then((base64String: any) => {
      this._commonHelper.hideLoader();      
      if (base64String && base64String != '') {
        this._commonHelper.downloadFile(`${fileName}${fileExtension}`, fileMimeType, base64String);
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_NO_DATA_EXPORT'));
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  //Show quick view
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

  onRowClick(rowData: any, isShowActivityCenter:boolean = null) {
    
    if (this.rowActionButtonMouseHoverFlag) {
      return;
    }

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
      entityRecordTypeName: rowData?.entityRecordTypeName,
      entityRecordTypeId: rowData?.entityRecordTypeId,
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      workTaskTypeName: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.DETAIL.OPPORTUNITY_WORKTASK_TAB.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
      workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
      relatedToRedirectURL: this.onRelatedToClick(rowData)
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
      selectedRowEntityId: this.selectedRowId
    }
    
    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewOpportunities);
  }

  advanceFilterVisibleChange(value:boolean){
    this.isAdvanceFilterVisible = value;
  }

  // Set row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Opportunities_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Opportunities_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
  }

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewOpportunities;
        this.selectedOpportunityIdForActivityCenter = details.id;
        this.selectedOpportunityForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedOpportunityIsClosedForActivityCenter = details?.isClosedStage;
        this.selectedOpportunityIsCompletedForActivityCenter = details?.isCompletedStage;
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

    this._opportunityService.updateOpportunityField(params).then((response) => {
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

  private getEntityRecordTypes() {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
    if (allEntityRecordTypes == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypesDetail = response?.filter(x => x.entityTypeID == Entity.Opportunities && (x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == null)).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }));
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Opportunities).map(x=> ({'label':x.name,'value':x.id }));
            this.recordTypes.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.FILTER_OPTION_TEXT_RECORDTYPE') });
            this.recordTypes.sort((a, b) => a.value - b.value);
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
            this.hideRecordTypeFilter = response?.filter(x => x.entityTypeID == Entity.Opportunities).map(x=> ({'label':x.name,'value':x.id }));
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
      this.recordTypesDetail = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Opportunities && (x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == null)).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }));
      this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Opportunities).map(x=> ({'label':x.name,'value':x.id }));
      this.recordTypes.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.FILTER_OPTION_TEXT_RECORDTYPE') });
      this.recordTypes.sort((a, b) => a.value - b.value);
      this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
      this.hideRecordTypeFilter = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Opportunities).map(x=> ({'label':x.name,'value':x.id }));
    }
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
      }else {
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

  private checkEntityHasAnyActiveWorkflow() {
    this.workflows = this.workflows.filter(x => x.value != 0);
    if (this.workflows.length == 0) {
      this.entityHasWorkflow = false;
      if (this.cols && this.cols.length > 0) {
        this.checkColumnExist('entityWorkFlowName');
        this.checkColumnExist('stageName');
        this.checkColumnExist('assignedToName');
      }
    }
    else {
      this.entityHasWorkflow = true;
    }
  }

  private checkColumnExist(columnName) {
    let isColumnExist = this.cols.find(x => x.field == columnName);
    if (isColumnExist) {
      isColumnExist.visible = this.entityHasWorkflow;
    }
  }
  onReopenStage(opportunities) {
    if (!this.isAllowToReopen) {
      return;
    }
    this.getEntityStagesWithTask(opportunities.entityWorkFlowID).then(() => {
      if (opportunities.isCompletedStage || opportunities.isClosedStage) {
        //get default stage details
        const getDefaultStage: any = this.opportunitiesListByStages?.find(s => s.isDefault);
        var isShowStageChangeConfirmationBox: boolean = true;
        this.changeEntityStage(getDefaultStage, getDefaultStage.id, isShowStageChangeConfirmationBox, true, opportunities);
      }
    });
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
      this.modalRef.componentInstance.entityWorkflowId = opportunities.entityWorkFlowID;
      this.modalRef.componentInstance.stageId = toEntityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;
      this.modalRef.result.then(response => {
        if (response != undefined) {
          const stageValueNoteParams = {
            entityTypeId: this.entityTypeId,
            entityId: opportunities.id,
            workflowId: opportunities.entityWorkFlowID,
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
              this.getAllOpportunities(this.pagingParams);
            });
          }).catch(() => {
            // get list
            this.getAllOpportunities(this.pagingParams);
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
        this.getAllOpportunities(this.pagingParams);
      }).catch(() => {
        // get list
        this.getAllOpportunities(this.pagingParams);
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
      this._workflowManagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: opportunities.id, stageId: toEntityStageId, entityWorkflowId: opportunities.entityWorkFlowID, assignedTo: assignedToForDto, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.opportunityAssignedTo = response;
          if (assignedToForDto != this.opportunityAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._opportunityService.updateOpportunityAssignedTo({ entityId: opportunities.id, assignedToId: this.opportunityAssignedTo.assignedToId, entityWorkflowId: opportunities.entityWorkFlowID, isForcedAssignment: this.opportunityAssignedTo.isForcedAssignment, stageId: toEntityStageId }).then((response: any) => {
              if (response) {
                assignedToForDto = this.opportunityAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_OPPORTUNITY_MOVETO_STAGE',
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
                this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_OPPORTUNITY_STAGE_REOPEN', {
                  entityName: opportunities?.name !== null ? opportunities?.name : " "
                })
              )
            } else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('OPPORTUNITIES.ALLLISTING.MESSAGE_OPPORTUNITY_MOVETO_STAGE',
                  { stageName: toEntityStageDetail.name })
              );
            }
          }
        }
        // get list
        this.getAllOpportunities(this.pagingParams);
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
      this._workflowManagementService.saveEntityWorkflowStageValueNote(params).then(() => {
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

  // get work tasks by stage
  getEntityStagesWithTask(id) {
    return new Promise((resolve, reject) => {
      this.entityStagesWithTasksStorageKey = '';
      this.entityStagesWithTasksStorageKey = LocalStorageKey.OpportunityEntityStageWithTasksKey + "_" + this.entityTypeId + (id ? ("_" + id) : '');

      const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
      if (entityStagesWithTasks == null) {
        this._commonHelper.showLoader();
        this._workflowManagementService.getEntityStagesWithTask(this.entityTypeId, id).then(
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
      }
      else {
        this.opportunitiesListByStages = entityStagesWithTasks;
        resolve(null);
      }
    });
  }
}
