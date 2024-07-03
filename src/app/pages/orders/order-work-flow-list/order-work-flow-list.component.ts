//ANGUlAR
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
//COMPONENTS
import { DueDateDialogComponent } from '../../../@core/sharedComponents/due-date-dialog/due-date-dialog.component';
import { EntityStagesDialogComponent } from '../../../@core/sharedComponents/entity-stages/entity-stages-dialog/entity-stages-dialog.component';
import { StagesComponent } from '../../../@core/sharedComponents/kanban-board/stages/stages.component';
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { PriorityDialogComponent } from '../../../@core/sharedComponents/priority-dialog/priority-dialog.component';
import { SeverityDialogComponent } from '../../../@core/sharedComponents/severity-dialog/severity-dialog.component';
import { UserAssignDialogComponent } from '../../../@core/sharedComponents/user-assign/user-assign-dialog/user-assign-dialog.component';
import { ActivitySectionComponent } from '../../../@core/sharedComponents/common-activity-section/activity-section/activity-section.component';
import { OrderAddComponent } from '../order-add/order-add.component';
//SERVICES
import { NoteService } from '../../../@core/sharedComponents/notes/notes.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { EntitytagsService } from '../../entitytags/entitytags.service';
import { SettingsService } from '../../settings/settings.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { OrdersService } from '../orders.service';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { ActivityTimespan, DataSources, DownloadFileMimeType, Entity, ExportType, FileExtension, KanbanBoardTokenTypes, LayoutTypes, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, RefType, ReferenceType, UserTypeID } from '../../../@core/enum';
import { Note } from '../../../@core/sharedComponents/notes/note.model';
import { KanbanStage, KanbanStageCard, KanbanStagePauseEvent, KanbanStageTaskEvent } from '../../../@core/sharedModels/kanban-board.model';
import { IdValuePair } from '../../../@core/sharedModels/pair.model';
//OTHER
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { Table } from 'primeng/table';
import { debounceTime, filter, forkJoin, fromEvent, map } from 'rxjs';

@Component({
  selector: 'ngx-order-work-flow-list',
  templateUrl: './order-work-flow-list.component.html',
  styleUrls: ['./order-work-flow-list.component.scss']
})
export class OrderWorkFlowListComponent implements OnInit {

  @ViewChild('searchTextInput', { static: false }) searchTextInput: ElementRef;
  @ViewChild('dt') private dt: Table;
  @ViewChild('kanbanStage') kanbanStage: StagesComponent;
  @ViewChild('activitySection') activitySection: ActivitySectionComponent;

  pageTitle = 'ORDERS.LIST.TITLE';
  workflowName = '';

  entityTypeId: number = Entity.Orders;
  entityWorkflowId: number = null;
  entityRecordTypeId: number;
  relatedEntityTypeId: number = 0;

  orderList: any[] = [];
  orderListByStages: any[] = [];
  orderAssignedTo: any;
  rating: number = null;

  // permission variables
  isListOrder: boolean = false;
  isViewOrder: boolean = false;
  isAddOrder: boolean = false;
  isEditOrder: boolean = false;
  isDeleteOrder: boolean = false;
  isImportOrders: boolean = false;
  isExportOrders: boolean = false;
  isAssignOrders: boolean = false;
  isBulkAssignOrders: boolean = false;
  isViewContact: boolean = false;
  isResumeTask: boolean = false;
  changeOrderStage: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAllowToReopen: boolean = false;

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
      "sortColumn": "Name",
      "sortOrder": "asc",
      "entityIDs": "",
      "tagIDs": "",
      "assignedToIDs": "",
      "entityWorkflowId": this.entityWorkflowId,
      "entityTimespan": "LAST7DAYS",
      "priorityIDs": "",
      "severityIDs": "",
      "dueStartDate": null,
      "dueEndDate": null,
      "orderDate": null,
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
      "orderDate": null,
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
  ratingOptions: any[] = [];

  isInitialLoading: boolean = true;
  currentStage: any;
  selectedStage: any;

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

  // multi assign tasks to user
  selectedRowIds: Set<number> = new Set<number>();
  showMultiselectOption = false;

  //status filter for listview.
  showLayout: any;
  StatusFilterLabel: any;
  StatusFilterPlaceholder: any;
  StatusColumnName: any;

  //Export Order
  dynamicColumnNameSetting: any = {};
  OrderNumberColumnName: string;
  ContactColumnName: string;
  OrderDateColumnName: string;

  users: any = null; //assignable users
  filterUsers: any = null;
  relatedToEntityTypes: any = null; //related to entity records
  relatedTo: any = null; //related to entity records
  priority: any = null;
  severity: any = null;
  currencySymbol:any = null;
  hoursInDay:number = null;
  filterStage: any = null;
  priorityDetails: any = null;
  severityDetails: any = null;
  
  //user detail
  _loggedInUser: any;
  loggedInUserTenantName: any;
  localStorageKeyPrefix: string = "";

  //action menu
  isShowActionColumn: boolean = false;
  //right side activity menu
  isShowActivityCenter: boolean = false;

  refreshActivityCenter: boolean = false;
  selectedOrderForActivityCenter: any;
  selectedOrderIdForActivityCenter: number = 0;
  selectedOrderIsPausedForActivityCenter: boolean = false;
  selectedOrderIsClosedForActivityCenter: boolean = false;
  selectedOrderIsCompletedForActivityCenter: boolean = false;

  selectedRowId:number = 0;
  selectedCardExists: boolean = false;
  entityDetails: any;

  entityStagesWithTasksStorageKey: string = LocalStorageKey.OrderEntityStageWithTasksKey;

  isBulkAssignedDialogOpen: boolean;
  isAllCheckBoxSelected: boolean;
  keyfieldResponseData: any;
  quickViewConfig: any;
  
  rowActionButtonMouseHoverFlag: boolean = false;

  //WorkflowLayout based on layoutTypeID
  showBothKanbanAndListView: boolean = false;

  orderCreatedBy: number;

  //Record Type Filter
  workflows: any = null;
  recordTypes: any;
  isRecordTypesFilterVisible: boolean;
  entityRecordType: any[];
  userTypeID = UserTypeID;

  isStageClosedOrCompleted: number;
  
  constructor(private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _orderService: OrdersService,
    private _dataSourceService: DatasourceService,
    private _entitytagsService: EntitytagsService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _confirmationDialogService: ConfirmationDialogService,
    private _modalService: NgbModal,
    private _settingsService: SettingsService,
    private _noteService: NoteService,
    private _decimalPipe: DecimalPipe,
    private _fileSignedUrlService: FileSignedUrlService) {
    //re use route
    this._router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };

    //initiate Permissions
    this.isListOrder = this._commonHelper.havePermission(enumPermissions.ListOrder);
    this.isViewOrder = this._commonHelper.havePermission(enumPermissions.ViewOrder);
    this.isAddOrder = this._commonHelper.havePermission(enumPermissions.AddOrder);
    this.isEditOrder = this._commonHelper.havePermission(enumPermissions.EditOrder);
    this.isDeleteOrder = this._commonHelper.havePermission(enumPermissions.DeleteOrder);
    this.isImportOrders = this._commonHelper.havePermission(enumPermissions.ImportOrders);
    this.isExportOrders = this._commonHelper.havePermission(enumPermissions.ExportOrders);
    this.isAssignOrders = this._commonHelper.havePermission(enumPermissions.AssignOrders);
    this.isBulkAssignOrders = this._commonHelper.havePermission(enumPermissions.BulkAssignOrders);
    this.isViewContact = this._commonHelper.havePermission(enumPermissions.ViewContact);
    this.isResumeTask = this._commonHelper.havePermission(enumPermissions.ResumeTask);
    this.changeOrderStage = this._commonHelper.havePermission(enumPermissions.ChangeOrderStage);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadOrderDocument);
    this.isShowActionColumn = (this.isViewOrder && this.isEditOrder) || (this.isViewOrder && this.isDeleteOrder);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);

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
      { field: 'orderNumber', header: 'ORDERS.LIST.TABLE_HEADER_TASK_NUMBER', visible: true, sort: true },
      { field: 'orderDate', header: 'ORDERS.LIST.TABLE_HEADER_ORDERDATE', visible: true, sort: true },
      { field: 'totalAmount', header: 'ORDERS.LIST.TABLE_HEADER_AMOUNT', visible: true, sort: true },
      { field: 'billToContactName', header: 'ORDERS.LIST.TABLE_HEADER_BILLTOCONTACTNAME', visible: true, sort: true },
      { field: 'stageName', header: 'ORDERS.LIST.TABLE_HEADER_STAGE_NAME', visible: true, sort: true },
      { field: 'assignedToName', header: 'ORDERS.LIST.TABLE_HEADER_ASSIGNEDTO', visible: true, sort: true },
      { field: 'action', header: '', visible: true, sort: false, class: "action " }
    ];
    // set storage key
    this.entityStagesWithTasksStorageKey = this.entityStagesWithTasksStorageKey + "_" + this.entityTypeId + (this.entityWorkflowId ? ("_" + this.entityWorkflowId) : '');
  }

  ngOnInit(): void {
    // get logged in user information
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();
    this.loggedInUserTenantName = this._commonHelper.getLoggedUserDetail().tenantName;

    //set local storage prefix
    this.localStorageKeyPrefix = `${this._loggedInUser.tenantId}_${this._loggedInUser.userId}_${this.entityWorkflowId}`

    //get local storage for search
    let localPageLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_OrderKanbanKey, this.localStorageKeyPrefix));
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
    this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null && this.dataSearch.params.dueStartDate != '' ? moment(new Date(this.dataSearch.params.dueStartDate)).toDate() : null;
    this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null && this.dataSearch.params.dueEndDate != '' ? moment(new Date(this.dataSearch.params.dueEndDate)).toDate() : null;
    this.dataSearch.paramsByStage.dueStartDate = this.dataSearch.paramsByStage.dueStartDate != null && this.dataSearch.paramsByStage.dueStartDate != '' ? moment(new Date(this.dataSearch.paramsByStage.dueStartDate)).toDate() : null;
    this.dataSearch.paramsByStage.dueEndDate = this.dataSearch.paramsByStage.dueEndDate != null && this.dataSearch.paramsByStage.dueEndDate != '' ? moment(new Date(this.dataSearch.paramsByStage.dueEndDate)).toDate() : null;

    this.dataSearch.params.orderDate = this.dataSearch.params.orderDate != null && this.dataSearch.params.orderDate != '' ? moment(new Date(this.dataSearch.params.orderDate)).toDate() : null;
    this.dataSearch.paramsByStage.orderDate = this.dataSearch.paramsByStage.orderDate != null && this.dataSearch.paramsByStage.orderDate != '' ? moment(new Date(this.dataSearch.paramsByStage.orderDate)).toDate() : null;

    // DD 20220425: SDC-426: Entity workflow have the parent entity type related information so removing dynamic dropdown
    // get workflow details
    Promise.all([
      this.getWorkflowDetail(),
      this.getEntityStagesWithTask(),
      this.getCurrencySymbol(),
      this.getHoursInDay(),
      this.getWorkflowList(),
      this.getPriorityFromReferenceType(),
      this.getSeverityFromReferenceType()
    ]).then((results: any) => {
      if (results) {
        var workflow = results[0];
        this.workflowName = workflow.name;
        this.entityRecordTypeId = workflow.entityRecordTypeId;
        this.relatedEntityTypeId = workflow.parentEntityTypeId;
        this.getHeaderFilters();

        let StageColumn = this.cols.find(c => c.field == 'stageName');

        if (workflow.layoutTypeID == LayoutTypes.ListView) {
          this.dataSearch.isPageTabularView = true;
          StageColumn.header = 'ORDERS.LIST.TABLE_HEADER_STATUS_NAME';
          this.StatusColumnName = (this._commonHelper.getInstanceTranlationData('ORDERS.LIST.EXPORT_STATUS_LABEL'));
        } else if (workflow.layoutTypeID == LayoutTypes.KanbanView) {
          this.dataSearch.isPageTabularView = false;
        } else if (workflow.layoutTypeID == LayoutTypes.KanbanAndListView) {
          this.showBothKanbanAndListView = true;
        }
        this.OrderNumberColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.EXPORT_ORDER_NUMBER_TABLE_HEADER'));
        this.OrderDateColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.EXPORT_ORDER_DATE_LABEL'));
        this.ContactColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.EXPORT_CONTACT_LABEL'));

        this.dynamicColumnNameSetting = {};
        this.dynamicColumnNameSetting["StageName"] = this.StatusColumnName;
        this.dynamicColumnNameSetting["OrderNumber"] = this.OrderNumberColumnName;
        this.dynamicColumnNameSetting["OrderDate"] = this.OrderDateColumnName;
        this.dynamicColumnNameSetting["BillToContactName"] = this.ContactColumnName;
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
      this.selectedOrderIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
    }
    // get set quickview local storage config end
  }

  getWorkflowDetail(): Promise<any> {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.OrderWorkflowDetailKey}_${this.entityWorkflowId}`;

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
    return [{ name: 'EntityTypeID', type: 'int', value: Entity.Orders }];
  }
  
  private getWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Orders}`;

      this.workflows = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.workflows == null) {
        const params = this.prepareParamsForWorkflows();
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflows = response;
            this.workflows.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.FILTER_OPTION_TEXT_WORKFLOW') });
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

  getHeaderFilters() {
    // other fileter master data
    const requestArray = [];

    const entityTimeSpans = this.getEntityTimespans();
    const requestAssignedToUsers = this.getAssigedToUsers(null, 1, '');
    const recordTypeList=this.getEntityRecordTypes();
    const requestTags = this.getOrderTags();
    const priorityList = this.getPriority();
    const severityList = this.getSeverity();
    const stageList=this.getStage();
    const rationList = this._commonHelper.setRatingOptions();

    requestArray.push(entityTimeSpans);
    requestArray.push(requestAssignedToUsers);
    requestArray.push(recordTypeList);
    requestArray.push(requestTags);
    requestArray.push(priorityList);
    requestArray.push(severityList);
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
            label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_ENTITYTIMESPAN'),
            name: 'entityTimespan',
            placeHolder: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_PLACEHOLDER_ENTITYTIMESPAN'),
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
          this.filterUsers = response.map((i: any) =>
          ({ value: i.value, label: i.label }));
          //set owner 1 list
          this.owner1List = response.map((i: any) =>
            ({ id: i.value, name: i.label }));
          this.filterUsers.push({ label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_OPTION_TEXT_ASSIGNEDTO'), value: 0 })
          this.filterUsers.sort((a, b) => a.value - b.value);
          //set selected user in dropdown
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
            label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_ASSIGNTO'),
            name: 'assignedToIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_PLACEHOLDER_ASSIGNTO'),
            ngModel: selectedUserIds.length == 0 ? '' : selectedUserIds,
            ngModelDefaultValue: this.filterUsers.filter(x => x.value == this._loggedInUser.userId).length > 0 ? [this._loggedInUser.userId] : null,
            ngModelDefaultObject: this.filterUsers.filter(x => x.value == this._loggedInUser.userId),
            optionLabel: 'label',
            optionValue: 'value',
            options: this.filterUsers,
            isHidden: false,
            defaultClass: 'basic-filter',
            panelStyleClass : 'maxWidthOverride-orders',
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
          this.entityRecordType.push({ label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_OPTION_TEXT_RECORDTYPE'), value: 0 })
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
            label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_RECORDTYPE'),
            name: 'entityRecordTypeIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_PLACEHOLDER_RECORDTYPE'),
            ngModel: selectedRecordTypeIds.length == 0 ? '' : selectedRecordTypeIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.entityRecordType,
            isHidden: this.isRecordTypesFilterVisible,
            defaultClass: 'basic-filter filter-recordType',
            panelStyleClass: 'maxWidthOverride-orders',
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
            label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_TAGS'),
            name: 'tagIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_PLACEHOLDER_TAGS'),
            ngModel: selectedTagIds.length == 0 ? '' : selectedTagIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: tags,
            isHidden: false,
            group: true,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-orders',
            isCountableFilter: 1
          }
          this.customFilterConfig.push(tagsFilter);
        }

        //priority
        if (results[4] != undefined) {
          let response = results[4] as [];
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
            label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_PRIORITY'),
            name: 'priorityIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_PLACEHOLDER_PRIORITY'),
            ngModel: selectePriorityIds.length == 0 ? '' : selectePriorityIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.priority,
            isHidden: false,
            defaultClass: 'small-filter',
            panelStyleClass : 'maxWidthOverride-xs',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(priorityFilter);
        }

        //severity
        if (results[5] != undefined) {
          let response = results[5] as [];
          // severity dropdwon
          this.severity = response;

          //set selected severity in dropdown
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
          let severityFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_SEVERITY'),
            name: 'severityIDs',
            placeHolder: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_PLACEHOLDER_SEVERITY'),
            ngModel: selecteSeverityIds.length == 0 ? '' : selecteSeverityIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: this.severity,
            isHidden: false,
            defaultClass: 'small-filter',
            panelStyleClass : 'maxWidthOverride-xs',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(severityFilter);
        }

        // add 2 filters for due start and end date
        let selectedDueStartDate = this.dataSearch.isPageTabularView ? this.dataSearch.params.dueStartDate : this.dataSearch.paramsByStage.dueStartDate;
        let dueStartFilter = {
          inputType: 'DateFrom',
          label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_DUE_FROM'),
          name: 'dueStartDate',
          ngModel: selectedDueStartDate,
          isHidden: false,
          defaultClass: 'small-filter',
          isCountableFilter: 0
        };
        this.customFilterConfig.push(dueStartFilter);

        // due end
        let selectedDueEndDate = this.dataSearch.isPageTabularView ? this.dataSearch.params.dueEndDate : this.dataSearch.paramsByStage.dueEndDate;
        let dueEndFilter = {
          inputType: 'DateTo',
          label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_DUE_TO'),
          name: 'dueEndDate',
          ngModel: selectedDueEndDate,
          isHidden: false,
          defaultClass: 'small-filter',
          isCountableFilter: 0
        };
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
          label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_DUE_DATE'),
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

        // Order Date
        let selectedOrderDate = this.dataSearch.isPageTabularView ? this.dataSearch.params.orderDate : this.dataSearch.paramsByStage.orderDate;
        let orderDateFilter = {
          inputType: 'Calendar',
          label: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_ORDER_DATE')),
          name: 'orderDate',
          ngModel: selectedOrderDate,
          isHidden: false,
          defaultClass: 'small-filter',
          isCountableFilter: 1
        };
        this.customFilterConfig.push(orderDateFilter);
        if(orderDateFilter.ngModel){
          this.filterCount ++;
        }

        if(results[6] != undefined) {
          let Liststages = results[6] as any[];
         this.filterStage=Liststages;

          if (this.showLayout == LayoutTypes.ListView) {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_STATUS');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_PLACEHOLDER_STATUS');
          }
          else {
            this.StatusFilterLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_STAGE');
            this.StatusFilterPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_PLACEHOLDER_STAGE');
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
          defaultClass: 'small-filter',
          panelStyleClass : 'maxWidthOverride-sm',
          isCountableFilter: 1
        }
        // add to filter
         this.customFilterConfig.push(stageFilter);
        }

        if (results[7]) {
          let ratingOptions = results[7] as any[];
          let selectedRatingIds: any = this.dataSearch.isPageTabularView ? this.dataSearch.params.rating : this.dataSearch.paramsByStage.rating;
          if (selectedRatingIds == null || selectedRatingIds == '') {
            selectedRatingIds = null;
          } else {
            this.filterCount ++;
          }
          let ratingFilter = {
            inputType: 'Dropdown',
            label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_LABEL_RATING'),
            name: 'rating',
            placeHolder: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_PLACEHOLDER_RATING'),
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

        //Insert "BookMark" filter
        let isStarred = this.dataSearch.isPageTabularView ? this.dataSearch.params.showStarred : this.dataSearch.paramsByStage.showStarred;
        let showStarredFilter = 
        {
          inputType: 'Checkbox',
          label: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_STARRED')),
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
        this.filterUsers = results;
        this.filterUsers.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.FILTER_OPTION_TEXT_ASSIGNEDTO') });
        this.filterUsers.sort((a, b) => a.value - b.value);
        this.customFilterConfig[2].options = this.filterUsers;
      });
    }
  }

  getAssigedToUsers(selectedUserId, includeAllUsers, searchString: any): Promise<any> {
    //DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    var params = this.prepareParamsForAssignedToUsers('', selectedUserId, includeAllUsers, searchString);
    // call datasource service with params
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKASSIGNEDTO, params);
  }

  getOrderTags(): Promise<any> {
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
  prepareParamsForRelatedTo(searchString: any) {
    const params = [];
    let paramItem = {
      name: 'EntityWorkflowID',
      type: 'int',
      value: this.entityWorkflowId,
    };
    params.push(paramItem);

    paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: this.relatedEntityTypeId
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
      this.dataSearch.params[Object.keys(item)[0]] = item[Object.keys(item)[0]];
      this.dataSearch.paramsByStage[Object.keys(item)[0]] = item[Object.keys(item)[0]];

      if(item[Object.keys(item)[0]] != '' && item[Object.keys(item)[0]] && item[Object.keys(item)[0]] != ActivityTimespan.ALLTIME && item.isCountableFilter == 1){
        changefiltercount++;
      }
    });
    this.filterCount = changefiltercount;

    this.dataSearch.params.pageNo = 1;
    this.dataSearch.paramsByStage.pageNo = 1;

    //set order search filter
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OrderKanbanKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);

    // check if table or kanban
    if (this.dataSearch.isPageTabularView) {
      this.getOrdersByWorkflowId();
    }
    else {
      this.stages = [];
      this.orderList = [];
      // prepare stages
      this.prepareStages();
    }

    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedOrderIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  // get work tasks for list
  getOrdersByWorkflowId() {
    this._commonHelper.showLoader();  
    this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null;
    this.dataSearch.params.orderDate = this.dataSearch.params.orderDate != null ? moment(this.dataSearch.params.orderDate).format('YYYY-MM-DD') : null;

    this._orderService.getOrdersByWorkFlowID(this.dataSearch.params).then((response: any) => {
      this.orderList = response;
      this.isAllCheckBoxSelected = false;
      
      //reset selected
      this.selectedRowIds = new Set<number>();
      // total
      this.totalRecords = this.orderList.length;
      this.totalRecords = this.orderList.length > 0 ? response[0].totalRecords : 0;
      this.dt.rows = this.dataSearch.params.pageSize;
      this.totalPages = Math.ceil(this.totalRecords / this.dataSearch.params.pageSize);
      this.end = this.dataSearch.params.pageNo == this.totalPages ? this.totalRecords : this.dataSearch.params.pageNo * this.dataSearch.params.pageSize;
      this.start = this.end == this.totalRecords ? (this.totalRecords - this.orderList.length + 1) : (this.end - this.dataSearch.params.pageSize) + 1;
      
       //set Action column show/hide dynamically
      this.isStageClosedOrCompleted = this.orderList.filter(x => x.isCompletedStage || x.isClosedStage).length;
      if ((!this.isAllowToReopen && !this.isDeleteOrder) || (this.isStageClosedOrCompleted < 0 && this.isAllowToReopen)) {
        let entityNameColumn = this.cols.find(c => c.field == 'action');
        entityNameColumn.visible = false;
      }
      else {
        let entityNameColumn = this.cols.find(c => c.field == 'action');
        entityNameColumn.visible = true;
      }

      if (this.selectedOrderIdForActivityCenter != null && this.selectedOrderIdForActivityCenter > 0 && this.orderList.some(x=>x.id == this.selectedOrderIdForActivityCenter)) {
        this.updateEntityDetails(true, this.orderList.find(x=>x.id == this.selectedOrderIdForActivityCenter));
      }
      else{
        this.resetSelectedEntity();
      }

      this._commonHelper.hideLoader();
      this._fileSignedUrlService.getFileSingedUrl(this.orderList, 'assignedToImagePath', 'assignedToSignedUrl', Entity.Users);

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
          this.orderListByStages = JSON.parse(JSON.stringify(response));
          this.orderListByStages.forEach((stage: any) => {
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
          this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.orderListByStages));
          this._commonHelper.hideLoader();
          resolve(null);
        }, (error) => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrError(error.message);
          resolve(null);
        }
      );
    });
    }
    else {
      this.orderListByStages = entityStagesWithTasks;
    }
  }

  // prepare stages with tasks
  private async prepareStages() {
    this.orderListByStages.forEach((stage: any) => {
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

  private getStage(): Promise<any> {
    const params= this.prepareParamsForEntityStagesByWorkflowId();
    return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITYSTAGESBYWORKFLOWID,params);
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
      params.orderDate = params.orderDate != null ? moment(params.orderDate).format('YYYY-MM-DD') : null;

      this._orderService.getOrdersByWorkFlowIDAndStageID(params).then(
        (tasks: any) => {
          this.orderList.push(...tasks);
          // for each task prepare card
          let kanbanStageCards: KanbanStageCard[] = [];
          tasks.forEach((task: any) => {
            // set total
            this.stages[index].totalItems = task.totalRecords;

            const taskIds: Array<number> = task.selectedStageTaskIDs
              ? task.selectedStageTaskIDs.split(",").map(m => Number(m))
              : [];

            // check if the current assigned to and logged in user is same
            var isSelectedTasksDisabled: boolean = true;
            var showPauseResumeButtons: boolean = false;
            let canUserMoveOrder: boolean = this.canUserChangeStage(this.stages[index], task);

            // check hidden
            if ((task.assignedTo == this._loggedInUser.userId || this.isResumeTask) && this.isEditOrder) {
              isSelectedTasksDisabled = false;
              showPauseResumeButtons = true;
            }
            let settingsJson = JSON.parse(task.settingsJson);
            // prepare card data
            let kanbanStageCard: KanbanStageCard = {
              id: task.id,
              stageId: task.stageId,
              stageName: task.stageName,
              // type
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
              entityId: task.billToContactID,
              entityTypeId: null,
              entityTypeName: 'contacts',
              selectedTasks: (this.stages[index].tasks || []).filter(f => taskIds.includes(f.id)) || [],
              selectedTasksDisabled: isSelectedTasksDisabled,
              isPaused: task.isPaused,
              isPausedTooltip: task.isPaused != null && task.isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('ORDERS.LABEL_SWITCH_PAUSE'),
              pausedLabel: this._commonHelper.getInstanceTranlationData('ORDERS.LABEL_SWITCH_PAUSE'),
              resumeLabel: this._commonHelper.getInstanceTranlationData('ORDERS.LABEL_SWITCH_RESUME'),
              resumeNotAccess: this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_RESUME_NOT_ACCESS'),
              showPauseResumeButtons: showPauseResumeButtons,
              canUserChangeStage: canUserMoveOrder,
              owner1Id: task.assignedTo,
              owner1Name: task.assignedToName,
              owner1ShortName: task.assignedToShortName,
              owner1Image: task.assignedToImagePath,
              owner1Tooltip: task.assignedToName,
              owner1BGColor: task.assignedToAvatarBGColor,
              owner1userTypeId: this.userTypeID.AssignedTo,
              priority: task.priority,
              priorityName: task.priorityName,
              priorityTooltip: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.KANBAN.TOOLTIP_PRIORITY'),
              priorityDefaultTooltip: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.KANBAN.TOOLTIP_PRIORITY_DEFAULT'),
              severity: task.severity,
              severityName: task.severityName,
              severityTooltip: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.KANBAN.TOOLTIP_SEVERITY'),
              severityDefaultTooltip: this._commonHelper.getInstanceTranlationData('ORDERS.LIST.KANBAN.TOOLTIP_SEVERITY_DEFAULT'),
              isClosedStage: task.isClosedStage,
              isCompletedStage: task.isCompletedStage,
              disabled: task.isPaused != null ? task.isPaused : false,
              entityIcon: 'fas fa-shopping-cart',
              entityRecordTypeId: task?.entityRecordTypeID,
              entityRecordTypeName: task.entityRecordTypeName,
              entityName: this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.TITLE'),
              createdBy: task?.createdBy,
              stagesTasks: this.stages[index]?.tasks,
              rating: task.rating,
              review: task.totalReviews,
              created: task?.created,
              entityReviewID: task.entityReviewID,
              isEntityReviewEditable: !(task?.isPaused ?? false),
              userLabel1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('COMMON.COMMON_USER_PROFILE.LABEL_ASSIGNEDTO')),
              isResumeRecord: this.isResumeTask,
              isShowPauseOrResume: (!task.isCompletedStage && !task.isClosedStage) ? true : false
            }

            if (!isAppend && this.selectedOrderIdForActivityCenter != null && this.selectedOrderIdForActivityCenter > 0 && kanbanStageCard.id == this.selectedOrderIdForActivityCenter) {
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

  private canUserChangeStage(currentStage, order): boolean {
    if (currentStage == null || order == null) {
      return true;
    }

    let canUserMoveOrder: boolean = false;
    if (currentStage.transitionAssociates != null && currentStage.transitionAssociates != '') {
      const associates = currentStage.transitionAssociates.trim().split(',');
      associates.forEach(associate => {
        const associatePropertyName = this._commonHelper.convertToCamalize(associate);
        canUserMoveOrder = canUserMoveOrder || (order.hasOwnProperty(associatePropertyName) ? (order[associatePropertyName] == this._loggedInUser.userId) : false);
      });
    }
    else {
      canUserMoveOrder = true;
    }
    return canUserMoveOrder
  }

  //get entity stage wise data
  getEntityStageData(stageId, isAppend) {
    // get current stage index
    let index: number = this.stages.findIndex(el => el.id == stageId);
    // get cards for this stage only
    this.orderList = this.orderList.filter((item) => item.stageId !== stageId);
    //get data
    this.getStageItems(index, isAppend).then(() => {
      this._fileSignedUrlService.getFileSingedUrl(this.stages[index].cards, 'owner1Image', 'owner1SignedUrl', Entity.Users);
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
      this.orderList = [];
      // prepare stages
      this.prepareStages();
      this.dataSearch.isPageTabularView = false;
    } else {
      this.dataSearch.isPageTabularView = true;
      this.dataSearch.params.pageNo = 1;
     
      this.dataSearch.params.dueStartDate =  this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null
      this.dataSearch.params.dueEndDate =  this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null
      this.dataSearch.params.orderDate =  this.dataSearch.params.orderDate != null ? moment(this.dataSearch.params.orderDate).format('YYYY-MM-DD') : null

      this.orderList = [];
      this.getOrdersByWorkflowId();
    }

    //set hidden for stage filter
    let stageFilter =  this.customFilterConfig.find(x => x.name === 'stageIDs');
    if (stageFilter) {
        stageFilter['isHidden'] = pageLayout === 'CARD';
    }

    this.resetSelectedEntity();

    //set order search filter
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OrderKanbanKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);

    //set quickview config
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedOrderIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  //order card drag-drop to other card
  onDropSuccess(event: CdkDragDrop<{}[]>) {
    //check can user change stage
    if (!event.item.data.canUserChangeStage) {
      if (this.changeOrderStage) {
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterDropSuccess(event);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
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
      const orderId = event.item.data.id;
      const orderStageId = +event.item.data.stageId;

      //Check Is All Stage Tasks Required for current Entity Stage before move onto the next Entity Stage.
      const isAllTasksRequired = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageIsAllTasksRequired').innerHTML;
      const previousStageId = event.previousContainer.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;

      // if any one of the current stage task is required
      let anyTasksIsRequired: boolean = false;
      let requiredTasks: any[] = [];
      // find out the current stage
      let currentStage = this.orderListByStages.find(x => x.id == previousStageId);
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
          * Call API to validate order has completed the stage tasks (which are required) before moving on to other stage.
          * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (OrderId)
          * */
        let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
        this._commonHelper.showLoader();
        this._workflowmanagementService.isEntityStageTasksCompleted(orderId, this.entityTypeId, orderStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response === true) {

            this.dataSearch.paramsByStage.pageNo = 1;
            let searchStage = this.stages.find(x=> x.id == event.item.data.stageId);
            searchStage.pagination.pageNo = this.dataSearch.paramsByStage.pageNo;

            this.moveEntity(event);
          } else {
            //Stage Tasks are not completed..
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_BEFORE_MOVE_ORDER_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
            return false;
          }
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
      else if (isAllTasksRequired && isAllTasksRequired.toLowerCase() == "true") {
        /**
         * Call API to validate order has completed all the stage tasks before moving on to other stage.
         * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (OrderId)
         * */
        this._commonHelper.showLoader();
        this._workflowmanagementService.isEntityStageTasksCompleted(orderId, this.entityTypeId, orderStageId, this.entityWorkflowId, null).then((response: any) => {
          this._commonHelper.hideLoader();
          if (response === true) {
            this.moveEntity(event);
          } else {
            //Stage Tasks are not completed..
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_BEFORE_MOVE_ORDER_STAGE_TASK_SHOULD_BE_COMPLETED'));
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
    const orderId = event.item.data.id;
    const orderStageId = +event.item.data.stageId;
    const dropOrderStageId = +event.container.element.nativeElement.querySelector('div .cards-header #stageId').innerHTML;
    const dropOrderStageName = event.container.element.nativeElement.querySelector('div .cards-header #stageName').innerHTML;
    const isNoteRequired = event.container.element.nativeElement.querySelector('div .cards-header #stageNoteRequired').innerHTML;
    const assignedTo = event.item.data.owner1Id;
    const isCompletedStage = event.item.data.isCompletedStage;
    const isClosedStage = event.item.data.isClosedStage;
    const stageName = event.item.data.stageName;

    let currentStage = this.stages.find(x => x.id == orderStageId);
    let dropStage = this.stages.find(x => x.id == dropOrderStageId);

    if(isCompletedStage || isClosedStage)
    {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_CANNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }

    // check if note is required
    if (isNoteRequired == 'true') {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = orderId;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropOrderStageName }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = dropOrderStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;
      
      this.modalRef.result.then(noteDate => {
        if (noteDate != undefined) {
          // save to transition
          Promise.all([
            this.saveOrderStage(orderId, orderStageId, dropOrderStageId, dropOrderStageName, assignedTo, isCompletedStage, isClosedStage, stageName)
          ]).then(() => {
            const param = {
              entityTypeId: this.entityTypeId,
              entityId: orderId,
              workflowId: this.entityWorkflowId,
              workflowStageId: dropOrderStageId,
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

              this.getEntityStageData(orderStageId, false); // refresh current stage
              this.getEntityStageData(dropOrderStageId, false); // refresh drop stage 
            },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
          }).catch(()=>{
            //this.refreshData();
          });;
        }
      });
    }
    else {
      // save to transition
      
      Promise.all([
        this.saveOrderStage(orderId, orderStageId, dropOrderStageId, dropOrderStageName, assignedTo, isCompletedStage, isClosedStage, stageName)
      ]).then(() => {

        currentStage.pagination.pageNo = 1; //reset current pagination stats of source stage
        dropStage.pagination.pageNo = 1; //reset current pagination stats of target stage
        this.dataSearch.paramsByStage.pageNo = 1 //rest global stage params pagination stage

        this.getEntityStageData(orderStageId, false); // refresh current stage
        this.getEntityStageData(dropOrderStageId, false); // refresh drop stage 
      }).catch(()=>{
        //this.refreshData();
      });
    }
  }

  //work task stage change save
  saveOrderStage(orderId, orderStageId, droporderStageId, dropOrderStageName, assignedTo, isCompletedStage, isClosedStage, stageName) {
    return new Promise((resolve, reject) => {
      let assignedToForDto = assignedTo;
      if(isCompletedStage || isClosedStage)
      {
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_CANNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
        return;
      }
      this._commonHelper.showLoader();
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: orderId, stageId: droporderStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedTo, oldStageId: orderStageId }).then((response: any) => {
        if (response) {
          this.orderAssignedTo = response;
          if (assignedToForDto != this.orderAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._orderService.updateOrderAssignedTo({ entityId: orderId, assignedToId: this.orderAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.orderAssignedTo.isForcedAssignment }).then((AtResponse: any) => {
              if (AtResponse) {
                assignedToForDto = this.orderAssignedTo.assignedToId;
                // success message
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_ORDER_MOVETO_STAGE',
                    { stageName: dropOrderStageName })
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
              this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_ORDER_MOVETO_STAGE',
                { stageName: dropOrderStageName })
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

  // event emitted from kanban
  onOrderClick(order) {
    
    // check logged in user have permission to view work task details
    if (!this.isViewOrder ) {
      return;
    }

    // if not undefined then redirect
    if (order.id != undefined) {
      this._router.navigateByUrl('/orders/details/' + this.entityWorkflowId + '/' + order.id);
    }
  }

  onclickBillToContactNameFromList(order) {
    if (!this.isViewContact) {
      return;
    }

    if (order.billToContactName != undefined && order.billToContactID != undefined) {
      this._router.navigateByUrl('/contacts/details/' + order.billToContactID);
    }
  }

  onclickBillToContactNameFromCard(order) {
    if (!this.isViewContact) {
      return this._router.url;
    }
    if (order.billToContactID != undefined) {
      return '/contacts/details/' + order.billToContactID;
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

    const taskIds: Array<number> = rowData.selectedStageTaskIDs ? rowData.selectedStageTaskIDs.split(",").map(m => Number(m)) : [];

    const stageTasks = this.orderListByStages?.find(x => x.id == rowData?.stageId)?.stageTasks;
    const settingsJson = JSON.parse(rowData.settingsJson);

    const obj = {
      id: rowData.id,
      entityIcon: 'fas fa-shopping-cart',
      entityName: this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.TITLE'),
      label1: settingsJson.Token1Text,
      label1RedirectURL: settingsJson.Token1Url,
      label2: settingsJson.Token2Text,
      label2RedirectURL: settingsJson.Token2Url,
      label3: settingsJson.Token3Text,
      label3RedirectURL: settingsJson.Token3Url,
      entityRecordTypeId: rowData?.entityRecordTypeID,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      stagesTasks: stageTasks,
      selectedTasks: (stageTasks || []).filter(f => taskIds.includes(f.id)) || [],
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageId,
      createdBy: rowData?.createdBy,
      isPaused: rowData?.isPaused,
      isStarred: rowData?.isStarred,
      isResumeRecord: this.isResumeTask,
      isShowPauseOrResume: (!rowData.isCompletedStage && !rowData.isClosedStage) ? true : false
    };

    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id; 
    this.orderCreatedBy = rowData?.createdBy;

    this.selectedOrderForActivityCenter = rowData;
    this.selectedOrderIdForActivityCenter = rowData.id;
    this.selectedOrderIsPausedForActivityCenter = (rowData?.isPaused ?? false);
    this.selectedOrderIsClosedForActivityCenter = rowData?.isClosedStage;
    this.selectedOrderIsCompletedForActivityCenter = rowData?.isCompletedStage;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedCardEntityId: this.selectedRowId,
      selectedRowEntityId: this.selectedRowId
    }

    if (isShowActivityCenter != null) {
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewOrder);
  }

  // event emitted from kanban
  onCardClick(order, isShowActivityCenter:boolean = null) {
    this.orderCreatedBy = order?.createdBy;
    order.entityWorkflowId = this.entityWorkflowId;
    this.entityDetails = this._commonHelper.cloningObject(order);
    this.selectedOrderForActivityCenter = order;
    this.selectedOrderIdForActivityCenter = order.id;
    this.selectedOrderIsPausedForActivityCenter = (order.isPaused ?? false);
    this.selectedOrderIsClosedForActivityCenter = order?.isClosedStage;
    this.selectedOrderIsCompletedForActivityCenter = order?.isCompletedStage; 
    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedCardEntityId: order.id,
      selectedRowEntityId: order.id
    };

    if (isShowActivityCenter != null) {
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewOrder);
  }

  onEntityStageTasksSelect(event) {
    if(!this.dataSearch.isPageTabularView) {
      const currentStage = this.stages?.find(s => s.id == event.stageId); 
      const currentCard = currentStage?.cards?.find((k: any) => k.id  == event.id)
      currentCard.selectedTasks = event?.selectedTasks;
    }else{
      const temp = this.orderList.find(x => x.id == event.id);
      temp.selectedStageTaskIDs = event.selectedTasks.map(x=>x.id).toString();
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
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewOrder;
        this.selectedOrderIdForActivityCenter = details.id;
        this.selectedOrderForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedOrderIsPausedForActivityCenter = (details?.isPaused ?? false) ;
        this.selectedOrderIsClosedForActivityCenter = details?.isClosedStage;
        this.selectedOrderIsCompletedForActivityCenter = details?.isCompletedStage;
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
    this.selectedOrderForActivityCenter = null;
    this.selectedOrderIdForActivityCenter = 0;
    this.selectedOrderIsPausedForActivityCenter = null;
    this.selectedOrderIsClosedForActivityCenter = null;
    this.selectedOrderIsCompletedForActivityCenter = null;
    this.selectedRowId = 0;
    if (this.kanbanStage) {
      this.kanbanStage.selectedCard = 0;
    }
  }

  onOrderStagePauseChanged(order: any, isPaused: boolean) {
    if (order.owner1Id !== this._loggedInUser.userId) {
      let message = "";
      if (order.owner1Id == null || order.owner1Id == "" || order.owner1Id == undefined) {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this.orderStagePauseChangeList(order, isPaused);
        }
      });
    }
    else if (order.owner1Id == this._loggedInUser.userId) {
      this.orderStagePauseChangeList(order, isPaused);
    }
  }

  orderStagePauseChangeList(order, isPaused: boolean) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: order.id,
      entityStageId: order.stageId,
      isPaused: isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: order.owner1Id,
      noteID: null
    };

    if (params.isPaused) {
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = order.id;
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.PAUSE_REASON_NOTE_SUBJECT', { stageName: order.stageName }))}`;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = order.stageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(noteDate => {
        if (noteDate) {
          params.noteID = noteDate.id;
          this.saveEntityStagePauseTransitionFromList(params, order);
        }
      });
    }
    else {
      const noteParam = {
        entityTypeId: this.entityTypeId,
        entityId: order.id,
        entityRecordTypeID: null,
        subject: null,
        isPrivate: false,
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.RESUME_NOTE_DESCRIPTION', { stageName: order.stageName }))}`,
        createdBy: this._loggedInUser.userId
      };

      this._commonHelper.showLoader();
      this._noteService.addNewNote(noteParam).then((response: any) => {
        if (response) {
          params.noteID = response.id;
          this.saveEntityStagePauseTransitionFromList(params, order);
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

  saveEntityStagePauseTransitionFromList(params, order) {
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
          this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_RESUME_SUCCESS'));
          order.isPaused = params.isPaused;

           //record update for List view.
           let updateEntityPauseStatusForList = this.orderList.find(x=>x.id == order.id);
           updateEntityPauseStatusForList.isPaused = order.isPaused;
 
           //record update for Card view.
           if (this.kanbanStage) {
             let card: any = {};
             card.id = order.id;
             card.stageId = order.stageId;
             card.isPaused = params.isPaused;
             card.disabled = params.isPaused ? true : false;
             this.kanbanStage.updateEntityPauseStatus(card);
           }

          //update Activity Center
          if (order.id == this.selectedOrderIdForActivityCenter) {
            this.updateEntityDetails(false, order);
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
  onOrderStagePauseChangedFromCard(event: KanbanStagePauseEvent) {
    if (event.card.owner1Id !== this._loggedInUser.userId) {
      let message = "";
      if (event.card.owner1Id == null || event.card.owner1Id == undefined) {
        message = event.isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = event.isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this.orderStagePauseChange(event);
        }
      });
    }
    else if (event.card.owner1Id == this._loggedInUser.userId) {
      this.orderStagePauseChange(event);
    }
  }

  orderStagePauseChange(event: KanbanStagePauseEvent) {
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
      this.modalRef.componentInstance.noteSubject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.PAUSE_REASON_NOTE_SUBJECT', { stageName: event.stage.name }))}`;
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
        description: `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.RESUME_NOTE_DESCRIPTION', { stageName: event.stage.name }))}`,
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
  
  saveEntityStagePauseTransition (params, event: KanbanStagePauseEvent) {
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
        event.card.isPausedTooltip = params.isPaused != null && params.isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('ORDERS.LABEL_SWITCH_PAUSE');

        //update Activity Center
        if (event.card.id == this.selectedOrderIdForActivityCenter) {
          this.updateEntityDetails(false, event.card);
        }
        event.card.isEntityReviewEditable = !(event.card?.isPaused ?? false);
        this.kanbanStage.updateEntityPauseStatus(event.card);
  
        this._commonHelper.showToastrSuccess(params.isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_PAUSE_SUCCESS') : this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_RESUME_SUCCESS'));       
        this._commonHelper.hideLoader();
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    },
    (error) => {
      this._commonHelper.hideLoader();
      event.card.isPausedTooltip = event.card.isPaused != null && event.card.isPaused ? this._commonHelper.getInstanceTranlationData('ORDERS.LABEL_SWITCH_RESUME') : this._commonHelper.getInstanceTranlationData('ORDERS.LABEL_SWITCH_PAUSE');
      this.kanbanStage.updateEntityPauseStatus(event.card);
      this.getTranslateErrorMessage(error);
    });
  }

  // assigned to user what to do
  onAssignedToClick(event, order = null) {
    if (!this.isAssignOrders || (order != null && order.isPaused) || (event.card != null && event.card.isPaused)) {
      return;
    }

    if ((order != null && (order.isClosedStage || order.isCompletedStage))
      || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (order != null) {
        stageName = order.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_CANNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }
    // get data from event
    let assignedToId = order != null ? order.assignedTo : event.card.owner1Id; //owner 1 is assigned to
    let orderId = order != null ? order.id : event.card.id;
    let orderStageId = order != null ? order.stageId : event.card.stageId;

    //DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    var params = this.prepareParamsForAssignedToUsers(orderStageId, assignedToId,1,'');
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKASSIGNEDTO, params).then((response: any) => {
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ASSIGNED_TO_DIALOG.DIALOG_TITLE'));
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        let obj = {
          entityid: orderId,
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: orderStageId
        };

        this._commonHelper.showLoader();
        this._orderService.updateOrderAssignedTo(obj).then((changeResponse: any) => {
          this._commonHelper.hideLoader();
          if (changeResponse) {
            this.orderAssignedTo = changeResponse;
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: this.entityTypeId, entityId: orderId, entityWorkflowId: this.entityWorkflowId, stageId: orderStageId, assignedTo: selectedUserId }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_ORDER_ASSIGNEDTO'));
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
            this.getEntityStageData(orderStageId, false);
          } else {
            this.dataSearch.params.pageNo = 1;
            this.orderList = [];
            this.getOrdersByWorkflowId();
          }

          // close
          this.modalRef.close();
        },(error) => {
          this.handlePausedOrDeleteTaskError(error, orderStageId);
          this._commonHelper.hideLoader();
          if (error != null && String(error.messageCode).toLowerCase() === 'orders.closedorcompleted') {
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

  onCardPriorityClick(event, order = null) {
    if (!this.isEditOrder || (order != null && order.isPaused) || (event.card != null && event.card.isPaused)) {
      return;
    }

    if ((order != null && (order.isClosedStage || order.isCompletedStage))
    || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (order != null) {
        stageName = order.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_CANNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }

    // get data from event
    let priority = order != null ? order.priority : event.card.priority;
    let orderStageId = order != null ? order.stageId : event.card.stageId;

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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.PRIORITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.prioritySelectLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.PRIORITY_DIALOG.PRIORITY_SELECT_LABEL');
      this.modalRef.componentInstance.prioritySelectPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.PRIORITY_DIALOG.PRIORITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangePriority.subscribe((selectedPriorityId) => {
        // prepare object to send to backend to save
        let obj = {
          orderId: order != null ? order.id : event.card.id,
          priority: selectedPriorityId,
        };

        this._commonHelper.showLoader();
        this._orderService.updateOrderPriority(obj).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            if (!this.dataSearch.isPageTabularView) {
              // refresh current stage
              this.getEntityStageData(orderStageId, false);
            } else {
              this.dataSearch.params.pageNo = 1;
              this.orderList = [];
              this.getOrdersByWorkflowId();
            }
          }
          // success message
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_ORDER_PRIORITY')
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

  onCardSeverityClick(event, order = null) {
    if (!this.isEditOrder || (order != null && order.isPaused) || (event.card != null && event.card.isPaused)) {
      return;
    }

    if ((order != null && (order.isClosedStage || order.isCompletedStage))
    || (event.card != null && (event.card.isClosedStage || event.card.isCompletedStage))
    ) {
      let stageName = '';
      if (order != null) {
        stageName = order.stageName;
      } else if (event.card != null) {
        stageName = event.card.stageName;
      }
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_CANNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }

    // get data from event
    let severity = order != null ? order.severity : event.card.severity;
    let orderStageId = order != null ? order.stageId : event.card.stageId;
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.SEVERITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.severitySelectLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.SEVERITY_DIALOG.SEVERITY_SELECT_LABEL');
      this.modalRef.componentInstance.severitySelectPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.SEVERITY_DIALOG.SEVERITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangeSeverity.subscribe((selectedseverityId) => {
        // prepare object to send to backend to save
        let obj = {
          orderId: order != null ? order.id : event.card.id,
          severity: selectedseverityId
        };

        this._commonHelper.showLoader();
        this._orderService.updateOrderSeverity(obj).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            if (!this.dataSearch.isPageTabularView) {
              // refresh current stage
              this.getEntityStageData(orderStageId, false);
            } else {
              this.dataSearch.params.pageNo = 1;
              this.orderList = [];
              this.getOrdersByWorkflowId();
            }
          }
          // success message
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_ORDER_SEVERITY')
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
  onEntityStageClick(order) {
    if (!this.isEditOrder || !this.isViewOrder || order.isPaused) {
      return;
    }

    if ((order != null && (order.isClosedStage || order.isCompletedStage))
    ) {
      let stageName = '';
      if (order != null) {
        stageName = order.stageName;
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_CANNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: stageName }));
      return;
    }
    }
    
    //check can user change stage
    const currentStageDetail = this.orderListByStages.find(s => s.id == order.stageId);
    const canUserChangeStage: boolean = this.canUserChangeStage(currentStageDetail, order);

    if (!canUserChangeStage) {
      if (this.changeOrderStage) {
        this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.afterEntityStageClick(order);
            }
          });
      }
      else {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
      }
    }
    else {
      this.afterEntityStageClick(order);
    }
  }

  private afterEntityStageClick(order) {
    this._commonHelper.showLoader();
    // get data from event
    let orderId = order.id;
    let orderStageId = order.stageId;
    let assignedTo = order.assignedTo;
    let isCompletedStage = order.isCompletedStage;
    let isClosedStage = order.isClosedStage;
    let stageName = order.stageName;
    // prepare params
    var params = this.prepareParamsForEntityStages();

    let entityStageDialogTitle: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ENTITY_STAGE_DIALOG.DIALOG_TITLE_STATUS') : this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ENTITY_STAGE_DIALOG.DIALOG_TITLE');
    let entityStageDialogFieldLabel: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_LABEL') : this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_LABEL');
    let entityStageDialogFieldPlaceholder: string = this.showLayout == LayoutTypes.ListView ? this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ENTITY_STAGE_DIALOG.ENTITY_STATUS_SELECT_PLACEHOLDER') : this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_PLACEHOLDER');

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
        this.modalRef.componentInstance.entityStageId = orderStageId;
        this.modalRef.componentInstance.dialogTitle = entityStageDialogTitle;
        this.modalRef.componentInstance.entityStageSelectLabel = entityStageDialogFieldLabel;
        this.modalRef.componentInstance.entityStageChangeSelectReasonLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_SELECT_REASON_LABEL');
        this.modalRef.componentInstance.entityStageSelectPlaceholder = entityStageDialogFieldPlaceholder;
        this.modalRef.componentInstance.entityStageChangeReasonLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_LABEL');
        this.modalRef.componentInstance.entityStageChangeReasonPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ENTITY_STAGE_DIALOG.ENTITY_STAGE_CHANGE_REASON_PLACEHOLDER');
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
          if (selectedEntityStageId != undefined && selectedEntityStageId != null && selectedEntityStageId != orderStageId) {
            // prepare object to send to backend to save
            const selectedEntityStageDetail = this.orderListByStages.find(s => s.id == selectedEntityStageId);
            const prevEntityStageDetail = this.orderListByStages.find(s => s.id == orderStageId);

            let dropOrderStagename = selectedEntityStageDetail.name;

            let isAllTasksRequired = prevEntityStageDetail?.isAllTasksRequired;
            
            // if any one of the current stage task is required
            let anyTasksIsRequired: boolean = false;
            let requiredTasks: any[] = [];
            // find out the current stage
            let currentStage = this.orderListByStages.find(x => x.id == orderStageId);
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
                * Call API to validate order has completed the stage tasks (which are required) before moving on to other stage.
                * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (OrderId)
                * */
              let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
              this._commonHelper.showLoader();
              this._workflowmanagementService.isEntityStageTasksCompleted(orderId, this.entityTypeId, orderStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
                this._commonHelper.hideLoader();
                if (response === true) {
                  this.moveEntityFromList(orderId, orderStageId, selectedEntityStageId, dropOrderStagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, isCompletedStage, isClosedStage, stageName, this.modalRef);
                } else {
                  //Stage Tasks are not completed..
                  this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_BEFORE_MOVE_ORDER_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
                  return false;
                }
              }, (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
            }
            else if (isAllTasksRequired) {
              /**
               * Call API to validate order has completed all the stage tasks before moving on to other stage.
               * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityId (OrderId)
               * */
              this._commonHelper.showLoader();
              this._workflowmanagementService.isEntityStageTasksCompleted(orderId, this.entityTypeId, orderStageId, this.entityWorkflowId, null).then((response: any) => {
                this._commonHelper.hideLoader();
                if (response === true) {
                  this.moveEntityFromList(orderId, orderStageId, selectedEntityStageId, dropOrderStagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, isCompletedStage, isClosedStage, stageName, this.modalRef);
                } else {
                  //Stage Tasks are not completed..
                  this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_BEFORE_MOVE_ORDER_STAGE_TASK_SHOULD_BE_COMPLETED'));
                  return false;
                }
              }, (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
            } else {
              this.moveEntityFromList(orderId, orderStageId, selectedEntityStageId, dropOrderStagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, isCompletedStage, isClosedStage, stageName, this.modalRef);
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

  moveEntityFromList(orderId, orderStageId, selectedEntityStageId, stagename, assignedTo, selectedEntityStageChangeReason, stageChangeReasonDescription, isCompletedStage, isClosedStage, stageName, modalRef: NgbModalRef) {
    if (selectedEntityStageChangeReason != null || stageChangeReasonDescription != null) {
      // prepare reason as a note
      let note = new Note({});
      note.id = 0;
      note.tenantId = this._loggedInUser.tenantId;
      note.entityTypeId = this.entityTypeId;
      note.entityId = orderId;
      note.entityRecordTypeID = null;
      note.subject = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: stagename }))}`;
      note.isPrivate = false;
      note.createdBy = this._loggedInUser.userId;

      let other = this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.OTHER_REASON');
      if (selectedEntityStageChangeReason && selectedEntityStageChangeReason !== other) {
        note.description = this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.NOTE_REASON_PRETEXT') + ': ' + selectedEntityStageChangeReason;
      }
      else{
        note.description = this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.NOTE_REASON_PRETEXT') + ': ' + stageChangeReasonDescription;
      }

      this._commonHelper.showLoader();
      this._noteService.addNewNote(note).then((response:any) => {
        Promise.all([
          this.saveOrderStage(orderId, orderStageId, selectedEntityStageId, stagename, assignedTo, isCompletedStage, isClosedStage, stageName)
        ]).then(() => {
          const param = {
            entityTypeId: this.entityTypeId,
            entityId: orderId,
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
        }).catch(()=>{
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
      const selectedEntityStageDetail = this.orderListByStages.find(s => s.id == selectedEntityStageId);
      let stagename = selectedEntityStageDetail.name;
      Promise.all([
        this.saveOrderStage(orderId, orderStageId, selectedEntityStageId, stagename, assignedTo, isCompletedStage, isClosedStage, stageName)
      ]).then(() => {
        modalRef.close();
        this.refreshData();
      }).catch(()=>{
        modalRef.close();
        this.refreshData();
      });
    }
  }

  // refresh all data
  refreshData() {
    if (!this.dataSearch.isPageTabularView) {
      // reset
      this.dataSearch.paramsByStage.pageNo = 1;
      this.stages = [];
      this.orderList = [];
      // prepare stages
      this.prepareStages();
    } else {
      this.dataSearch.params.pageNo = 1;
      this.orderList = [];
      this.getOrdersByWorkflowId();
    }
  }

  /* multi-select */
  // check selected one
  onChecked(obj: any, isChecked: boolean) {
    if (this.selectedRowIds.has(obj.id)) {
      this.selectedRowIds.delete(obj.id);
    }
    else {
      this.selectedRowIds.add(obj.id);
    }
  }

  /* multi-select */
  isAllSelected() {
    const selectedOrderListCount = this.orderList.filter(x => x.isSelected).length;
    if (this.orderList.length == selectedOrderListCount) {
      this.isAllCheckBoxSelected = true;
    } else {
      this.isAllCheckBoxSelected = false;
    }
  }

  checkUncheckAll() {
    this.orderList.forEach(order => {
      if (!order.isPaused && !order.isClosedStage && !order.isCompletedStage) {
        order.isSelected = this.isAllCheckBoxSelected;
  }
   });
  }

  // assign bulk tasks to user
  assignSelectedTasksToUser() {
    if(this.orderList.filter(f => f.isSelected).length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MEESAGE_SELECT_ONE_USER'));
      return;
    }

    const distinctStages = [...new Set(this.orderList.filter(f => f.isSelected).map(item => item.stageId))];  
      
    if (distinctStages.length > 1) {
      this.showLayout == LayoutTypes.ListView ? this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_SELECT_SAME_STATUS')) :
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_SELECT_SAME_STAGE'));
      return;
    }
    const params = this.prepareParamsForAssignedToUsers(distinctStages[0], '');
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ORDERASSIGNEDTO, params).then((response: any) => {
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ASSIGNED_TO_DIALOG.DIALOG_TITLE'));
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LIST.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.closed.subscribe(() => {
        this.isBulkAssignedDialogOpen = false;
      });

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // get selected
        const selectedOrder = [...new Set(this.orderList.filter(f => f.isSelected).map(item => item.id))];
        const strSelectedOrderIds = selectedOrder.toString();
        // prepare object to send to backend to save
        const obj = {
          selectedTaskIds: strSelectedOrderIds,
          assignedToId: selectedUserId,
          entityWorkflowId: this.entityWorkflowId,
          stageId: distinctStages[0]
        };

        this._commonHelper.showLoader();
        this._orderService.updateOrderBulkAssignedTo(obj).then((response: any) => {
          this._commonHelper.hideLoader();
          this.modalRef.close();
          //reload
        this.refreshData();
        if (response) {
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_ORDER_BULKASSIGNEDTO'));
        }    
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            this.modalRef.close();
            if (error != null && String(error.messageCode).toLowerCase() === 'orders.norunningtaskfound') {
              this.refreshData();
            }
          });
      });
    });
  }

  private handlePausedOrDeleteTaskError(error: any, workTaskStageId: number) {
    if (error != null && (String(error.messageCode).toLowerCase() === 'orders.pausedordeleteerror' || String(error.messageCode).toLowerCase() === 'entitystage.pausedordeleteerror')
      || String(error.messageCode).toLowerCase() === 'orders.closedorcompleted') {
      if (!this.dataSearch.isPageTabularView) {
        // refresh current stage
        this.getEntityStageData(workTaskStageId, false);
        if (String(error.messageCode).toLowerCase() === 'orders.closedorcompleted') {
          const closedCompletedStages = this.orderListByStages.filter(x => x.isClosed || x.isCompleted);
          if (closedCompletedStages) {
            closedCompletedStages.forEach(x => {
              this.getEntityStageData(x.id, false);
            });
          }
        }
      } else {
        this.dataSearch.params.pageNo = 1;
        this.orderList = [];
        this.getOrdersByWorkflowId();
      }
    }
  }

  //transferArrayItem kanban card layout
  transferArrayItem(event) {
    if (event != null) {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'orders.closedorcompleted') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.DETAIL.ORDERS_CLOSEDORCOMPLETED', { stageName: error.data.stageName }));
      }
      else
      {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('ORDERS.' + error.messageCode.replace('.', '_').toUpperCase())
      );}
    }
  }

  paginate(event) {
    this.dataSearch.params.pageNo = (event.first / event.rows) + 1;
    this.dataSearch.params.pageSize = event.rows;
    this.getOrdersByWorkflowId();
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
      this.getOrdersByWorkflowId();
    }
  }

  changePage() {
    if (this.dataSearch.params.pageNo <= this.totalPages && this.dataSearch.params.pageNo > 0) {
      this.dataSearch.params.pageNo = this.dataSearch.params.pageNo > 0 ? this.dataSearch.params.pageNo : 1;
      this.getOrdersByWorkflowId();
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
    this.getOrdersByWorkflowId();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to previous page
  prev() {
    this.dataSearch.params.pageNo = this.dataSearch.params.pageNo - 1 > 0 ? this.dataSearch.params.pageNo - 1 : 1;
    if (this.end == this.dataSearch.params.pageSize) {
      return false;
    }
    this.getOrdersByWorkflowId();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to next page
  next() {
    this.dataSearch.params.pageNo = (this.dataSearch.params.pageNo + 1) <= this.totalPages ? this.dataSearch.params.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getOrdersByWorkflowId();
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
      this.selectedOrderIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
    }
    // get set quickview local storage config end
  }

    // open add popup
    addOrder() {
      this.optionsForPopupDialog.size = "md";
      this.modalRef = this._modalService.open(OrderAddComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.ADD_DIALOG.TITLE'));
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.relatedEntityTypeId = this.relatedEntityTypeId;
      this.modalRef.componentInstance.entityRecordTypeId = this.entityRecordTypeId;
      this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
      this.modalRef.componentInstance.entityRecordTypes = this.recordTypes;
      this.modalRef.result.then((response: boolean) => {
        if (response) {
          // refresh data 
           this.refreshData();
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ORDERS.ADD_DIALOG.SUCCESS_MESSAGE'));
        }
      });
    }

    exportExcel() {
      this.exportOrder(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
    }
  
    exportOrder(exportType: string, fileExtension: string, fileMimeType: string) {
      this._commonHelper.showLoader();

      this.dataSearch.params.dueStartDate = this.dataSearch.params.dueStartDate != null ? moment(this.dataSearch.params.dueStartDate).format('YYYY-MM-DD') : null;
      this.dataSearch.params.dueEndDate = this.dataSearch.params.dueEndDate != null ? moment(this.dataSearch.params.dueEndDate).format('YYYY-MM-DD') : null;
      this.dataSearch.params.orderDate = this.dataSearch.params.orderDate != null ? moment(this.dataSearch.params.orderDate).format('YYYY-MM-DD') : null;
      let excelExportPayload = this._commonHelper.cloningObject(this.dataSearch.params);
      excelExportPayload.exportType = exportType;
      excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";
      let fileName = this._commonHelper.getConfiguredEntityName('{{Orders_plural_p}}') + `_${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
  
      if (!this.dataSearch.isPageTabularView) {
        excelExportPayload.stageIds = null;
      }

      this._orderService.exportOrder(excelExportPayload).then((base64String: any) => {
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
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Orders_Workflow_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get card/row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Orders_Workflow_SelectedItem);
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

    this._orderService.updateOrderField(params).then((response) => {
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
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Orders).map(x => ({ 'label': x.name, 'value': x.id }));
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
        this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Orders).map(x => ({ 'label': x.name, 'value': x.id }));
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

  onReopenStage(orders) {
    if (!this.isAllowToReopen) {
      return;
    }
    if (orders.isCompletedStage || orders.isClosedStage) {
      //get default stage details
      const getDefaultStage: any = this.orderListByStages?.find(s => s.isDefault);
      var isShowStageChangeConfirmationBox: boolean = true;
      this.changeEntityStage(getDefaultStage, getDefaultStage.id, isShowStageChangeConfirmationBox, true, orders);
    }
  }

  private changeEntityStage(toEntityStageDetail, toEntityStageId, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean, orders) {
    let noteSubjectName: any;
    if (!isReopenedStage) {
      noteSubjectName = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: toEntityStageDetail?.name }))}`
    } else {
      noteSubjectName = this._commonHelper.getInstanceTranlationData('COMMON.STAGE_REOPEN_TEXT');
    }
    if (toEntityStageDetail.isNoteRequired || isReopenedStage) {
      isShowStageChangeConfirmationBox = false;
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = orders.id;
      this.modalRef.componentInstance.noteSubject = noteSubjectName;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = toEntityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(response => {
        if (response != undefined) {
          const stageValueNoteParams = {
            entityTypeId: this.entityTypeId,
            entityId: orders.id,
            workflowId: this.entityWorkflowId,
            workflowStageId: toEntityStageId,
            stageNoteID: response.id,
            pauseNoteID: null,
            processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.StageNote
          };

          Promise.all([
            this.updateEntityStage(toEntityStageId, toEntityStageDetail.name, isShowStageChangeConfirmationBox, isReopenedStage, orders),
          ]).then(() => {
            Promise.all([
              this.saveEntityWorkflowStageValueNote(stageValueNoteParams)
            ]).then(() => {
              this.getOrdersByWorkflowId();
            });
          }).catch(() => {
            this.getOrdersByWorkflowId();
          });
        }
        else {
          this.selectedStage = this.currentStage;
        }
      });
    }
    else {
      Promise.all([
        this.updateEntityStage(toEntityStageId, toEntityStageDetail.name, isShowStageChangeConfirmationBox, isReopenedStage, orders),
      ]).then(() => {
        this.getOrdersByWorkflowId();
      }).catch(() => {
        this.getOrdersByWorkflowId();
      });
    }
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

  // update workflow entity stage values
  private updateEntityStage(toEntityStageId, toEntityStageName, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean, orders) {
    return new Promise((resolve, reject) => {
      if (isShowStageChangeConfirmationBox) {
        this._confirmationDialogService.confirm("ORDERS.CHANGE_STAGE_CONFIRMATION", null, null, this.optionsForPopupDialog).then((confirmed: any) => {
          if (confirmed) {
            return this.afterupdateEntityStage(toEntityStageId, toEntityStageName, isReopenedStage, orders)
          }
        })
      } else {
        return this.afterupdateEntityStage(toEntityStageId, toEntityStageName, isReopenedStage, orders)
      }
    });
  }

  afterupdateEntityStage(toEntityStageId, toEntityStageName, isReopenedStage: boolean, orders) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      let assignedToForDto = orders?.assignedTo;
      let currentStageId = this.orderListByStages.find(s => s.id == orders.stageId)?.id;
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: orders?.entityRecordTypeId, entityId: orders.id, stageId: toEntityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedToForDto, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.orderAssignedTo = response;
          if (assignedToForDto != this.orderAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._orderService.updateOrderAssignedTo({ entityId: orders.id, assignedToId: this.orderAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.orderAssignedTo.isForcedAssignment }).then((updateOrderResponse: any) => {

              if (updateOrderResponse) {
                assignedToForDto = this.orderAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_ORDER_MOVETO_STAGE',
                  { stageName: toEntityStageName })
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
                this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_ORDER_STAGE_REOPEN', {
                  entityName: orders?.name !== null ? orders?.name : " "
                })
              )
            } else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('ORDERS.LIST.MESSAGE_ORDER_MOVETO_STAGE',
                  { stageName: toEntityStageName })
              );
            }
          }
        }
        this.getOrdersByWorkflowId();
        resolve(null);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
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
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_WorkTasksKey, JSON.stringify(this.dataSearch), this.localStorageKeyPrefix);
        this.refreshData();
      });
  }
}
