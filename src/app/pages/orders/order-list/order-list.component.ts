//ANGULAR
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
//COMMON
import { OrderPagingParams } from '../../../@core/sharedModels/paging-params.model';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { DataSources, DownloadFileMimeType, Entity, ExportType, FileExtension, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, RefType, ReferenceType, UserTypeID } from '../../../@core/enum';
//SERVICE
import { OrdersService } from '../orders.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { SettingsService } from '../../settings/settings.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';
//COMPONENTS
import { WorkflowAssignDialogComponent } from '../../../@core/sharedComponents/workflow-assign-dialog/workflow-assign-dialog/workflow-assign-dialog.component';
import { UserAssignDialogComponent } from '../../../@core/sharedComponents/user-assign/user-assign-dialog/user-assign-dialog.component';
import { OrderAddComponent } from '../order-add/order-add.component';
//PRIMENG
import { Table } from 'primeng/table';
import { Paginator } from 'primeng/paginator';
import { MultiSelect } from 'primeng/multiselect';
//OTHER
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, filter, fromEvent, map } from 'rxjs';
import * as moment from 'moment';
import { PriorityDialogComponent } from '../../../@core/sharedComponents/priority-dialog/priority-dialog.component';
import { SeverityDialogComponent } from '../../../@core/sharedComponents/severity-dialog/severity-dialog.component';
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';



@Component({
  selector: 'ngx-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss']
})
export class OrderListComponent implements OnInit {

  /*
  @ Angular Decorators 
  */
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  // order list
  orders: any[] = [];
  orderAssignedTo: any;
  entityTypeId: number = Entity.Orders;
  EntityTitle: any;

  entityHasWorkflow: boolean;

  //user detail
  loggedInUser: any;
  localStorageKeyPrefix: string = '';
 
  //right side activity menu
  isShowActivityCenter: boolean = false;
  entityWorkflowId: number = 0;
  refreshActivityCenter: boolean = false;
  selectedOrderForActivityCenter: any;
  selectedOrderIdForActivityCenter: number = 0;
  selectedOrderIsPausedForActivityCenter: boolean = false;
  selectedOrderIsClosedForActivityCenter: boolean = false;
  selectedOrderIsCompletedForActivityCenter: boolean = false;

  selectedRowId: number = 0;
  selectedCardExists: boolean = false;
  entityDetails: any;
  entityRecordTypeId: number;
  isAdvanceFilterVisible: boolean = false;
  
  // pagination
  pagingParams: OrderPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;
  startDate: Date;
  endDate: Date;
  ratingOptions: any [] = [];

  // search filter
  lastOrderSearchFilter: any;
  ordersSearchFilter = {
    searchText: '',
    recordTypeIds: null,
    workflowIds: null,
    stageIds: null,
    assignToUserIds: null,
    showMyOrders: false,
    rating: null,
    showStarred: false
  };

  currencySymbol:any = null;
  hoursInDay:number = null;
  entityStagesWithTasksStorageKey : string = LocalStorageKey.OrderEntityStageWithTasksKey;
  ordersListByStages: any[] = [];
  currentStage: any;
  selectedStage: any;
  showStarred:boolean = false;

  //Export Order
  dynamicColumnNameSetting: any = {};
  OrderNumberColumnName: string;
  ContactColumnName: string;
  OrderDateColumnName: string;

  //filter
  workflows: any = null;
  selectedWorkflows: any = null;
  stages: any = null;
  stagesForFilter: any = null;
  selectedstages: any = null;
  userList: any = [];
  verifiedByList: any = [];
  selectedUser = null;
  recordTypes = null;
  hideRecordTypeFilter = null;
  selectedRecordTypes: any = null;
  // verifiedByUser = null;
  showMyOrders: boolean = false;

  // permission variable
  isListOrder: boolean = false;
  isViewOrder: boolean = false;
  isAddOrder: boolean = false;
  isEditOrder: boolean = false;
  isDeleteOrder: boolean = false;
  isAssignWorkflow: boolean = false;
  isWorkflowPermission: boolean = true;
  isImportOrder: boolean = false;
  isExportOrders: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAssignOrder: boolean = false;
  isAllowToReopen: boolean = false;

  // table Column
  cols: any[];
  isShowActionColumn: boolean = false;

  isShowRelatedTo: boolean = false;
  isShowAssignTo: boolean = true;
  isShowWorkFlow: boolean = true;

  private modalRef: NgbModalRef | null;
  private optionsForPopupDialog: any = {
    size: 'md',
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  unassignedOrderCount: number;
  isAllCheckBoxSelected: boolean;
  priorityDetails: any = null;
  severityDetails: any = null;
  quickViewConfig: any;

  orderCreatedBy: number; 
  rowActionButtonMouseHoverFlag: boolean = false;
  keyfieldResponseData: any;
  userTypeID = UserTypeID;

  isStageClosedOrCompleted: number;

  constructor(private _router: Router,
    public _commonHelper: CommonHelper,
    private _ordersService: OrdersService,
    private _dataSourceService: DatasourceService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _commonService: CommonService,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _settingsService: SettingsService,
    private _fileSignedUrlService: FileSignedUrlService) {
      
    this.EntityTitle = this._commonHelper.getEntityTitleFromMenuItemByUrl(decodeURI(this._router.url));
    this.setPermissions();
    this.initializePagination();
    this.setRatingOptions();
    this.setColumnDefinations();
  }

  ngOnInit(): void {
    // get logged in user information
    this.loggedInUser = this._commonHelper.getLoggedUserDetail();

    //set local storage prefix
    this.localStorageKeyPrefix = `${this.loggedInUser.tenantId}_${this.loggedInUser.userId}`;

    Promise.all([
      this.getCurrencySymbol(),
      this.getHoursInDay(),
      this.getEntityRecordTypes(),
      this.getWorkflowList(),
      this.getEntityStageList(),
      this.getAssigedToUsers(null, 1, ''),
      this.getPriorityFromReferenceType(),
      this.getSeverityFromReferenceType()
    ]).then(() => {
      this.checkEntityHasAnyActiveWorkflow();
      this.setLastSearchFilterFromStorage();
      this.getOrdersList(this.pagingParams);
      this.subscribeSearchboxEvent();
      this.OrderNumberColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.EXPORT_ORDER_NUMBER_TABLE_HEADER'));
      this.OrderDateColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.EXPORT_ORDER_DATE_LABEL'));
      this.ContactColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.EXPORT_CONTACT_LABEL'));

      this.dynamicColumnNameSetting = {};
      this.dynamicColumnNameSetting["OrderNumber"] = this.OrderNumberColumnName;
      this.dynamicColumnNameSetting["OrderDate"] = this.OrderDateColumnName;
      this.dynamicColumnNameSetting["BillToContactName"] = this.ContactColumnName;
    });
    // get set quickview local storage config start
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedOrderIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
    }
    // get set quickview local storage config end
  }

  setRatingOptions(){
    this._commonHelper.setRatingOptions().then((response) => { this.ratingOptions = response as []; });
  }

  onFilterRating(event) {
    this.ordersSearchFilter.rating = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OrderListing, JSON.stringify(this.ordersSearchFilter), this.localStorageKeyPrefix);
    this.getOrdersList(this.pagingParams);
  }

  onFilterShowStarred() {
    this.ordersSearchFilter.showStarred = this.showStarred;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OrderListing, JSON.stringify(this.ordersSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getOrdersList(this.pagingParams);
  }

  //Bulk Assign Workflow For order
  public assignWorkflow() {
    const selectedWorkList = this.orders.filter(x => x.isSelected);
    
    if (selectedWorkList.length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MEESAGE_SELECT_ONE_ORDER'));
      return;
    }

    //TO BE DELETED PN - 15-12-2023 - SDC-3362
    // const distinctEntityRecordType = [...new Set(selectedWorkList.map(item => item.entityRecordTypeId))];
    // if (distinctEntityRecordType.length > 1) {
    //   this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
    //   return;
    // }

    const distinctEntityType = [...new Set(selectedWorkList.map(item => item.entityTypeId))];
    if (distinctEntityType.length > 1) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
      return;
    }

    const distinctEntity = [...new Set(selectedWorkList.map((item: any) => item.entityWorkFlowID))];
    if (distinctEntity.length > 1) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
      return;
    }

    if (selectedWorkList.filter(x => x.isPaused == true).length > 0) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MESSAGE_CANNOT_BULKASSIGN_WORKFLOW_PAUSED'));
      return;
    }

    let eligibilityParams: any[] = [];
    selectedWorkList.forEach(x => {
      let param = {
        entityTypeId: Entity.Orders,
        entityId: x.id,
        bypassWokflowChecking: x.entityWorkFlowID == null
      }
      eligibilityParams.push(param);
    });

    this._commonHelper.showLoader();
    this._workflowmanagementService.BulkCheckIsEntityEligibleToChangeWorkflow(eligibilityParams).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response) {
        let filteredWorkflows = this.workflows.filter(x => x.value != 0);
        // else if (distinctEntityRecordType != null && distinctEntityRecordType.length > 0 && distinctEntityRecordType[0] > 0) {
        //   if (filteredWorkflows.some(x => x.entityRecordTypeId == distinctEntityRecordType[0])) {
        //     let parentEntityTypeId = filteredWorkflows.filter(x => x.entityRecordTypeId == distinctEntityRecordType[0])[0]?.parentEntityTypeID;
        //     filteredWorkflows = filteredWorkflows.filter(x => (x.parentEntityTypeID == null && x.entityRecordTypeId == null) || x.parentEntityTypeID == parentEntityTypeId);
        //   }
        // }

        this.optionsForPopupDialog.size = "md";
        this.modalRef = this._modalService.open(WorkflowAssignDialogComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.workflows = filteredWorkflows;
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.WORK_ASSIGN_DIALOG.DIALOG_TITLE');
        this.modalRef.componentInstance.workflowSelectLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_SELECT_LABEL');
        this.modalRef.componentInstance.workflowSelectPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_STAGE_SELECT_PLACEHOLDER');

        this.modalRef.componentInstance.OnSubmitAssignWorkflow.subscribe((selectedWorkflowID) => {
          //option for confirm dialog settings
          let optionsForConfirmDialog = {
            size: "md",
            centered: false,
            backdrop: 'static',
            keyboard: false
          };
          this._confirmationDialogService.confirm('ORDERS.LISTING.MESSAGE_CONFIRM_ASSIGN_ORDER', null, null, optionsForConfirmDialog, true).then((confirmed) => {
            if (confirmed) {
              let DeleteRelatedDataParams: any[] = [];
              selectedWorkList?.filter(x => x?.entityWorkFlowID != selectedWorkflowID).forEach((x: any) => {
                let param = {
                  entityTypeId: Entity.Orders,
                  entityId: x?.id
                }
                DeleteRelatedDataParams.push(param);
              });

              this._commonHelper.showLoader();
              this._workflowmanagementService.BulkDeleteRelatedDataToChangeWorkflow(DeleteRelatedDataParams).then((response: any) => {
                this._commonHelper.hideLoader();
                let arrOrders: any[] = [];
                let arrOrdersIds: any[] = [];
                selectedWorkList.filter(x => x.entityWorkFlowID != selectedWorkflowID).forEach(x => {
                  let params = {
                    EntityWorkflowId: selectedWorkflowID,
                    EntityType: Entity.Orders,
                    Id: x.id,
                    AssignToUserIds: x.assignToUserIds,
                    EntityWorkflowRecordKey: null,
                    SelectedStageTaskIds: null,
                    IsAdd: true
                  };

                  arrOrders.push(params);
                  arrOrdersIds.push(x.id);
                });

                this._commonHelper.showLoader();
                this._workflowmanagementService.assignBulkWorkFlowForTask(arrOrders).then(res => {
                  
                  this._ordersService.changeEntityRecordType(arrOrdersIds.toString(), this.workflows.filter(x => x.value == selectedWorkflowID)[0].entityRecordTypeID).then(res => {
                    this._ordersService.changeOrderEntityType(arrOrdersIds.toString(), selectedWorkflowID).then(() => {
                      this.fetchOrder();
                      this._commonHelper.hideLoader();
                      // success message
                      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MESSAGE_WORKFLOW_ASSIGN_SUCCESS'));
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
        //one of the order is not eligible to assign workflow
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MESSAGE_WORKFLOW_BULKASSIGN_NOTELIGIBLE'));
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  public orderDetail(id: number): void {
    this._router.navigate(['detail/' + id]);
  }

  public onResetAllFilters() {
    this.ordersSearchFilter.searchText = '';
    this.ordersSearchFilter.recordTypeIds = null;
    this.ordersSearchFilter.workflowIds = null;
    this.ordersSearchFilter.stageIds = null;
    this.ordersSearchFilter.assignToUserIds = null;
    this.ordersSearchFilter.showMyOrders = false;
    this.ordersSearchFilter.rating = null;
    this.ordersSearchFilter.showStarred = false;

    this.selectedRecordTypes = null;
    this.selectedWorkflows = null;
    this.selectedstages = null;
    this.stagesForFilter = this.stages;
    this.selectedUser = null;
    this.showMyOrders = false;
    this.showStarred = false;

    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'created';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.entityRecordTypeIDs = null;
    this.pagingParams.entityWorkflowIDs = null;
    this.pagingParams.entityWorkflowStageIDs = null;
    this.pagingParams.assignToUserIds = null;
    this.pagingParams.showMyOrders = false;
    this.pagingParams.rating = null;
    this.pagingParams.showStarred = false;

    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OrderListing, JSON.stringify(this.ordersSearchFilter), this.localStorageKeyPrefix);
    this.getOrdersList(this.pagingParams);
  }

  public isAllSelected() {
    const selectedWorkListCount = this.orders.filter(x => x.isSelected).length;

    if (this.orders.length == selectedWorkListCount) {
      this.isAllCheckBoxSelected = true;
    } else {
      this.isAllCheckBoxSelected = false;
    }
  }

  public checkUncheckAll() {
    this.orders.forEach(orders => {
      orders.isSelected = this.isAllCheckBoxSelected;
    });
  }

  // open add order popup
  public addOrder() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(OrderAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.entityWorkflowId = null;
    this.modalRef.componentInstance.relatedEntityTypeId = null;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = null;
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.entityRecordTypes = this.recordTypes;
    

    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.fetchOrder();
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ORDERS.ADD_DIALOG.SUCCESS_MESSAGE'));
      }
    });
  }


  public onFilterAssignTo(event) {
    this.ordersSearchFilter.assignToUserIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OrderListing, JSON.stringify(this.ordersSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getOrdersList(this.pagingParams);
  }

  public assignedToOnFilter(e?: any, selectedUser?: any) {
    this.getAssigedToUsers(selectedUser?.toString(), 0, e.filter);
  }

  public onFilterShowMyOrders() {
    this.ordersSearchFilter.showMyOrders = this.showMyOrders;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OrderListing, JSON.stringify(this.ordersSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getOrdersList(this.pagingParams);
  }

  public onPriorityClick(order = null) {
    if (!this.isEditOrder) {
      return;
    }

    if (order != null && order?.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.PRIORITY_DIALOG.MESSAGE_CANNOT_CHANGE_PRIORITY_PAUSED'));
      return;
    }

    if (order != null && (order.isClosedStage || order.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.PRIORITY_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: order?.stageName }));
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
      this.modalRef.componentInstance.priorityId = order?.priority;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.PRIORITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.prioritySelectLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.PRIORITY_DIALOG.PRIORITY_SELECT_LABEL');
      this.modalRef.componentInstance.prioritySelectPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.PRIORITY_DIALOG.PRIORITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangePriority.subscribe((selectedPriorityId) => {
        // prepare object to send to backend to save
        let obj = {
          orderId: order?.id,
          priority: selectedPriorityId
        };

        this._commonHelper.showLoader();
        this._ordersService.updateOrderPriority(obj).then(response => {
          if (response) {
            this.getOrdersList(this.pagingParams);
            // success message
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MESSAGE_SUCCESS_PRIORITY')
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

  onSeverityClick(order = null) {
    if (!this.isEditOrder) {
      return;
    }
    
    if (order != null && order.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.SEVERITY_DIALOG.MESSAGE_CANNOT_CHANGE_SEVERITY_PAUSED'));
      return;
    }

    if (order != null && (order.isClosedStage || order.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.SEVERITY_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: order?.stageName }));
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
      this.modalRef.componentInstance.severityId = order?.severity;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.SEVERITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.severitySelectLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.SEVERITY_DIALOG.SEVERITY_SELECT_LABEL');
      this.modalRef.componentInstance.severitySelectPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.SEVERITY_DIALOG.SEVERITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangeSeverity.subscribe((selectedSeverityId) => {
         // prepare object to send to backend to save
         let obj = {
          orderId: order?.id,
          severity: selectedSeverityId
        };
        
        this._commonHelper.showLoader();
        this._ordersService.updateOrderSeverity(obj).then(response => {
          if (response) {
            this.getOrdersList(this.pagingParams);
            // success message
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MESSAGE_SUCCESS_SEVERITY')
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
  public onAssignedToClick(orders = null) {
    this.isWorkflowPermission = this._commonHelper.havePermission(orders.entityWorkFlowPermissionHash);

    if (!this.isAssignOrder || !this.isWorkflowPermission) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_NOT_HAVE_PERMISSION_ASSIGN_USER'));
      return;
    }

    if (orders != null && orders.entityWorkFlowID == null) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_CANNOT_ASSIGN_USER'));
      return;
    }
    
    if (orders != null && orders.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_CANNOT_ASSIGN_USER_PAUSED')));
      return;
    }

    if (orders != null && (orders.isClosedStage || orders.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_ORDERS', { stageName: orders?.stageName }));
      return;
    }

    this._commonHelper.showLoader();
    // get data from event
    let assignedToId = orders.assignedTo; //owner 1 is assigned to
    let orderId = orders.id;
    let orderStageId = orders.stageId;
    let workFlowId = orders.entityWorkFlowID;

    // prepare params
    let params = this.prepareParamsForAssignedToUsers(workFlowId, orderStageId, assignedToId);
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ORDERASSIGNEDTO, params).then((response: any) => {
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.ASSIGNED_TO_DIALOG.DIALOG_TITLE'));
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        let obj = {
          entityid: orderId,
          assignedToId: selectedUserId,
          entityWorkflowId: workFlowId,
          stageId: orderStageId
        };

        this._commonHelper.showLoader();
        this._ordersService.updateOrderAssignedTo(obj).then((response: any) => {
          if (response) {
            this.orderAssignedTo = response;
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: Entity.Orders, entityId: orderId, entityWorkflowId: workFlowId, stageId: orderStageId, assignedTo: selectedUserId, verifiedBy: orders.verifiedBy }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MESSAGE_ORDER_ASSIGNEDTO'));
              }
              this._commonHelper.hideLoader();
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              }
            );
          }
          this.getOrdersList(this.pagingParams);
          this._commonHelper.hideLoader();
          // close
          this.modalRef.close();
        }, (error) => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrError(error.message);
        }
        );
      });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  public onFilterRecordType(event) {
    this.ordersSearchFilter.recordTypeIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OrderListing, JSON.stringify(this.ordersSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getOrdersList(this.pagingParams);
  }

  public onFilterWorkflow(event) {
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

    this.ordersSearchFilter.workflowIds = event.value.toString();

    this.ordersSearchFilter.stageIds = null;
    this.pagingParams.entityWorkflowStageIDs = null;
    this.pagingParams.pageNo = 1;
    this.selectedstages = null;

    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OrderListing, JSON.stringify(this.ordersSearchFilter), this.localStorageKeyPrefix);
    this.getOrdersList(this.pagingParams);
  }

  public onFilterStage(event) {
    this.ordersSearchFilter.stageIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OrderListing, JSON.stringify(this.ordersSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getOrdersList(this.pagingParams);
  }

  public trimFilterValue(e: any, multiSelect: MultiSelect) {
    multiSelect.filterValue = String(e.filter).trim();
    multiSelect.filterInputChild.nativeElement.value = String(e.filter).trimStart();
  }

  public onAssignWorkflow(orders) {
    if (!this.isEditOrder || !this.isAssignWorkflow) {
      return;
    }

    if (orders != null && orders.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.WORK_ASSIGN_DIALOG.MESSAGE_CANNOT_ASSIGN_WORKFLOW_PAUSED'));
      return;
    }

    this._commonHelper.showLoader();
    this._workflowmanagementService.IsEntityEligibleToChangeWorkflow(Entity.Orders, orders.id, orders.entityWorkFlowID == null).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response) {
        let filteredWorkflows = this.workflows.filter(x => x.value != 0);
        // else if (orders?.entityRecordTypeId != null && orders?.entityRecordTypeId > 0) {
        //   if (filteredWorkflows.some(x => x.entityRecordTypeId == orders?.entityRecordTypeId)) {
        //     let parentEntityTypeId = filteredWorkflows.filter(x => x.entityRecordTypeId == orders?.entityRecordTypeId)[0]?.parentEntityTypeID;
        //     filteredWorkflows = filteredWorkflows.filter(x => (x.parentEntityTypeID == null && x.entityRecordTypeId == null) || x.parentEntityTypeID == parentEntityTypeId);
        //   }
        // }

        this.optionsForPopupDialog.size = "md";
        this.modalRef = this._modalService.open(WorkflowAssignDialogComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.workflows = filteredWorkflows;
        this.modalRef.componentInstance.workflowId = orders.entityWorkFlowID;
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.WORK_ASSIGN_DIALOG.DIALOG_TITLE');
        this.modalRef.componentInstance.workflowSelectLabel = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_SELECT_LABEL');
        this.modalRef.componentInstance.workflowSelectPlaceholder = this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_STAGE_SELECT_PLACEHOLDER');

        this.modalRef.componentInstance.OnSubmitAssignWorkflow.subscribe((selectedWorkflowId) => {
          if (selectedWorkflowId != orders.entityWorkFlowID) {
            //option for confirm dialog settings
            let optionsForConfirmDialog = {
              size: "md",
              centered: false,
              backdrop: 'static',
              keyboard: false
            };
            this._confirmationDialogService.confirm('ORDERS.LISTING.MESSAGE_CONFIRM_ASSIGN_ORDER', null, null, optionsForConfirmDialog, true).then((confirmed) => {
              if (confirmed) {
                this._commonHelper.showLoader();
                this._workflowmanagementService.DeleteRelatedDataToChangeWorkflow(Entity.Orders, orders.id).then((response: any) => {
                  this._commonHelper.hideLoader();
                  //prepare object to send to backend to save
                  let params = {
                    EntityWorkflowId: selectedWorkflowId,
                    EntityType: Entity.Orders,
                    Id: orders.id,
                    assignToUserIds: orders.assignToUserIds,
                    EntityWorkflowRecordKey: null,
                    SelectedStageTaskIds: null,
                    IsAdd: true
                  };

                  this._commonHelper.showLoader();
                  this._workflowmanagementService.postSaveEntityProcess(params).then(() => {
                    this._ordersService.changeEntityRecordType(orders.id, this.workflows.filter(x => x.value == selectedWorkflowId)[0].entityRecordTypeID).then(() => {
                      this._ordersService.changeOrderEntityType(orders.id, selectedWorkflowId).then(() => {
                        this.fetchOrder();
                        this._commonHelper.hideLoader();
                        // success message
                        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MESSAGE_WORKFLOW_ASSIGN_SUCCESS'));
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
        //order is not eligible to assign workflow
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MESSAGE_WORKFLOW_ASSIGN_NOTELIGIBLE'));
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  public paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchOrder();
  }

  public changeOrder(column: any): void {
    if (column.sort) {
      if (this.pTable.sortOrder == 1) {
        this.pagingParams.sortOrder = "ASC";
      }
      else {
        this.pagingParams.sortOrder = "DESC";
      }
      this.pagingParams.sortColumn = this.pTable.sortField;
      this.fetchOrder();
    }
  }

  public changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchOrder();
    }
    else if (this.pagingParams.pageNo > this.totalPages) {
      this.pagingParams.pageNo = this.totalPages;
    }
    else if (this.pagingParams.pageNo <= 0) {
      this.pagingParams.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  public resetPaginator(): any {
    this.pagingParams.pageNo = 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchOrder();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  public prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchOrder();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  public next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchOrder();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  //#region private methods
  private setPermissions(): void {
    this.isListOrder = this._commonHelper.havePermission(enumPermissions.ListOrder);
    this.isViewOrder = this._commonHelper.havePermission(enumPermissions.ViewOrder);
    this.isAddOrder = this._commonHelper.havePermission(enumPermissions.AddOrder);
    this.isEditOrder = this._commonHelper.havePermission(enumPermissions.EditOrder);
    this.isDeleteOrder = this._commonHelper.havePermission(enumPermissions.DeleteOrder);
    this.isAssignWorkflow = this._commonHelper.havePermission(enumPermissions.AssignWorkflow);
    this.isImportOrder = this._commonHelper.havePermission(enumPermissions.ImportOrders);
    this.isExportOrders = this._commonHelper.havePermission(enumPermissions.ExportOrders);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadOrderDocument);
    this.isAssignOrder = this._commonHelper.havePermission(enumPermissions.AssignOrders);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);
    this.isShowActionColumn = this.isEditOrder;
  }

  private setColumnDefinations() {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'orderNumber', header: 'ORDERS.LISTING.TABLE_HEADER_ORDER_NUMBER', visible: true, sort: true, exportFieldName: 'orderNumber'},
      { field: 'orderDate', header: 'ORDERS.LISTING.TABLE_HEADER_ORDER_DATE', visible: true, sort: true, exportFieldName: 'orderDate'},
      { field: 'totalAmount', header: 'ORDERS.LISTING.TABLE_HEADER_TOTAL_AMOUNT', visible: true, sort: true, exportFieldName: 'totalAmount'},
      { field: 'billToContactName', header: 'ORDERS.LISTING.TABLE_HEADER_CONTACT', visible: true, sort: true, exportFieldName: 'billToContactName'},
      { field: 'entityWorkFlowName', header: 'ORDERS.LISTING.TABLE_HEADER_ENTITYWORKFLOW_NAME', visible: true, sort: true, exportFieldName: 'entityWorkFlowName'},
      { field: 'stageName', header: 'ORDERS.LISTING.TABLE_HEADER_STAGE_NAME', visible: true, sort: true, exportFieldName: 'stageName'},
      { field: 'assignedToName', header: 'ORDERS.LISTING.TABLE_HEADER_ASSIGNED_TO', visible: true, sort: true, exportFieldName: 'assignedToName'},
      { field: 'created', header: 'ORDERS.LISTING.TABLE_HEADER_CREATED', visible: true, sort: true, exportFieldName: 'created'},
      { field: 'action', header: '', visible: true, sort: false, class: "action " }
    ];
   
    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.cols.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private initializePagination(): void {
    this.pagingParams = new OrderPagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'created';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private getAssigedToUsers(selectedUserId, includeAllUsers, searchString: any) {
    return new Promise((resolve, reject) => {
      // prepare params
      let params = this.prepareParamsForAssignedToUsersAllOrder(selectedUserId, includeAllUsers, searchString);
      // call datasource service with params
      this._commonHelper.showLoader();
      return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALLORDERASSOGNTO, params).then((responce: any) => {
        if (responce) {
          this.userList = responce;
          this.userList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.FILTER_OPTION_TEXT_ASSIGNEDTO') });
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

  private prepareParamsForOrderStages() {
    const params = [];
    let paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.Orders
    };
    params.push(paramItem);
    return params;
  }

  private getEntityStageList() {
    return new Promise((resolve, reject) => {
      this.stages = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Order_WorkFlow_StageList));
      if (this.stages == null) {
        let params = this.prepareParamsForOrderStages();
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITYWORKFLOWSTAGES, params).then((response: any) => {
          if (response) {
            let rawStages: any = response;
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
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Order_WorkFlow_StageList, JSON.stringify(this.stages));
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

  private prepareParamsForAssignedToUsersAllOrder(assignedTo, includeAllUsers = 1, searchString = null) {
    const params = [];
    const paramItem = {
      name: 'SelectedUserID',
      type: 'int',
      value: assignedTo
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

  private prepareParamsForAssignedToUsers(workFlowId, stageID, assignedTo, includeAllUsers = 1, searchString = null) {
    const params = [];
    const paramItem = {
      name: 'EntityWorkFlowID',
      type: 'int',
      value: workFlowId
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'StageID',
      type: 'int',
      value: stageID
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

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_OrderListing, this.localStorageKeyPrefix));
    if (searchFilter != null) {
      this.ordersSearchFilter = searchFilter;
      this.showStarred = this.ordersSearchFilter.showStarred;
      if (this.ordersSearchFilter.recordTypeIds != null && this.ordersSearchFilter.recordTypeIds != '') {
        this.selectedRecordTypes = this.ordersSearchFilter.recordTypeIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedRecordTypes = null;
      }

      if (this.ordersSearchFilter.workflowIds != null && this.ordersSearchFilter.workflowIds != '') {
        this.selectedWorkflows = this.ordersSearchFilter.workflowIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedWorkflows = null;
      }

      if (this.ordersSearchFilter.stageIds != null && this.ordersSearchFilter.stageIds != '') {
        this.selectedstages = this.ordersSearchFilter.stageIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedstages = null;
      }

      this.stagesForFilter = this.stages;
      if (this.selectedWorkflows != null && this.selectedWorkflows != '') {
        let filteredStages: any[] = [];
        this.selectedWorkflows.toString().split(',').forEach(x => {
          this.stagesForFilter.filter(y => y.value == x).forEach(z => {
            filteredStages.push(z);
          });
        });
        this.stagesForFilter = filteredStages;
      }
      if (this.ordersSearchFilter.assignToUserIds != null && this.ordersSearchFilter.assignToUserIds != '') {
        this.selectedUser = this.ordersSearchFilter.assignToUserIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedUser = null;
      }

      this.showMyOrders = this.ordersSearchFilter.showMyOrders;
      this.pagingParams.rating =  this.ordersSearchFilter.rating;
    }
    this.lastOrderSearchFilter = JSON.parse(JSON.stringify(this.ordersSearchFilter));
  }

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.ordersSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OrderListing, JSON.stringify(this.ordersSearchFilter), this.localStorageKeyPrefix);
        this.fetchOrder();
      });
  }

  // get order for list
  private getOrdersList(pagingParams: OrderPagingParams) {
    this._commonHelper.showLoader();
    pagingParams.entityRecordTypeIDs = this.ordersSearchFilter.recordTypeIds;
    pagingParams.searchString = this.ordersSearchFilter.searchText;
    pagingParams.entityWorkflowIDs = this.ordersSearchFilter.workflowIds;
    pagingParams.entityWorkflowStageIDs = this.ordersSearchFilter.stageIds;
    pagingParams.assignToUserIds = this.ordersSearchFilter.assignToUserIds;
    pagingParams.showMyOrders = this.ordersSearchFilter.showMyOrders;
    pagingParams.rating = this.ordersSearchFilter.rating;
    pagingParams.showStarred = this.ordersSearchFilter.showStarred;
    this._ordersService.getOrderListWithPagination(pagingParams).then((response: any) => {
      if (response) {
        this.orders = response as any[];
        this.orders.forEach(data => {
          data['isSelected'] = false;
        });
        this.isAllCheckBoxSelected = false;
        this.unassignedOrderCount = this.orders.filter(x => !x.entityWorkFlowName).length;

        this.totalRecords = this.orders.length > 0 ? response[0].totalRecords : 0;
        this.pTable.rows = pagingParams.pageSize;
        this.totalPages = Math.ceil(this.totalRecords / pagingParams.pageSize);
        this.end = pagingParams.pageNo == this.totalPages ? this.totalRecords : pagingParams.pageNo * pagingParams.pageSize;
        this.start = this.end == this.totalRecords ? (this.totalRecords - this.orders.length + 1) : (this.end - pagingParams.pageSize) + 1;
        
        //set Action column show/hide dynamically
        this.isStageClosedOrCompleted = this.orders.filter(x => x.isCompletedStage || x.isClosedStage).length;
        if ((!this.isAllowToReopen && !this.isDeleteOrder) || (this.isStageClosedOrCompleted < 0 && this.isAllowToReopen)) {
          let entityNameColumn = this.cols.find(c => c.field == 'action');
          entityNameColumn.visible = false;
        }
        else {
          let entityNameColumn = this.cols.find(c => c.field == 'action');
          entityNameColumn.visible = true;
        }

        if (this.selectedOrderIdForActivityCenter != null && this.selectedOrderIdForActivityCenter > 0 && this.orders.some(x=>x.id == this.selectedOrderIdForActivityCenter)) {
          this.updateEntityDetails(true, this.orders.find(x=>x.id == this.selectedOrderIdForActivityCenter));
        }
        else{
          this.resetSelectedEntity();
        }

        this._commonHelper.hideLoader();
        this._fileSignedUrlService.getFileSingedUrl(this.orders, 'assignedToImagePath', 'assignedToSignedUrl', Entity.Users);
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(error.message);
    });
  }

  private fetchOrder(): void {
    if (this.pTable) {
      this.getOrdersList(this.pagingParams);
    }
  }

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'orders.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else if (error.messageCode.toLowerCase() == 'orders.closedOrCompleted') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.ORDERS_CLOSEDORCOMPLETED', { stageName: error.data.stageName }));
      }else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      }else if(error.messageCode.toLowerCase() == 'entityStage.AlreadyUpdated'){
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('ORDERS.' + error.messageCode.replace('.', '_').toUpperCase()));
      }
    }
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

  //Export Orders Listing
  
  exportExcel() {
    this.exportOrdersList(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportOrdersList(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();
    const excelExportPayload = {

      tenantId: this.pagingParams?.tenantId,
      searchString: this.pagingParams?.searchString,
      entityRecordTypeIds: this.pagingParams.entityRecordTypeIDs,
      entityWorkflowIDs: this.pagingParams?.entityWorkflowIDs,
      entityWorkflowStageIDs: this.pagingParams?.entityWorkflowStageIDs,
      assignToUserIds: this.pagingParams?.assignToUserIds,
      showMyOrders: this.pagingParams?.showMyOrders,
      sortColumn: this.pagingParams?.sortColumn,
      sortOrder: this.pagingParams?.sortOrder,
      exportType: exportType,
      rating:this.pagingParams?.rating,
      pageNo: 1,
      pageSize: this._commonHelper.DefaultPageSize,
      dynamicColumnSettingJson: "",
      selectedExportColumns: null,
      showStarred: this.pagingParams.showStarred
    }
    
    const visibleColumns = this.cols.filter(i => i.visible && i.exportFieldName).map((i, index) => ({ field: i.exportFieldName, index: index }));

    if (visibleColumns)
      excelExportPayload['selectedExportColumns'] = visibleColumns;

    let fileName = this._commonHelper.getConfiguredEntityName('{{Orders_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    this._ordersService.exportOrdersList(excelExportPayload).then((base64String: any) => {
      this._commonHelper.hideLoader();
      if (base64String && base64String != '') {
        this._commonHelper.downloadFile(`${fileName}${fileExtension}`, fileMimeType, base64String);
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('LISTING.MESSAGE_NO_DATA_EXPORT'));
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  } 

  // Show Quick View 
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
      entityRecordTypeName: rowData?.entityRecordTypeName,
      entityRecordTypeId: rowData?.entityRecordTypeId,
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageId,
      createdBy: rowData?.createdBy,
      isPaused: rowData?.isPaused
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
      selectedRowEntityId: this.selectedRowId
    }
    
    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewOrder);
  }
  
  advanceFilterVisibleChange(value:boolean){
    this.isAdvanceFilterVisible = value;
  }

  // Set row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Orders_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Orders_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
  }

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewOrder;
        this.selectedOrderIdForActivityCenter = details.id;
        this.selectedOrderForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedOrderIsPausedForActivityCenter = (details?.isPaused ?? false);
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
  
      this._ordersService.updateOrderField(params).then((response) => {
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

  private getEntityRecordTypes() {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
    if (allEntityRecordTypes == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Orders).map(x=> ({'label':x.name,'value':x.id }));
            this.recordTypes.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.FILTER_OPTION_TEXT_RECORDTYPE') });
            this.recordTypes.sort((a, b) => a.value - b.value);
            this.hideRecordTypeFilter = response?.filter(x => x.entityTypeID == Entity.Orders).map(x=> ({'label':x.name,'value':x.id }));
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
      this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Orders).map(x=> ({'label':x.name,'value':x.id }));
      this.recordTypes.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.FILTER_OPTION_TEXT_RECORDTYPE') });
      this.recordTypes.sort((a, b) => a.value - b.value);
      this.hideRecordTypeFilter = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Orders).map(x=> ({'label':x.name,'value':x.id }));
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

  onReopenStage(orders) {
    if (!this.isAllowToReopen) {
      return;
    }
    this.getEntityStagesWithTask(orders.entityWorkFlowID).then(() => {
      if (orders.isCompletedStage || orders.isClosedStage) {
        //get default stage details
        const getDefaultStage: any = this.ordersListByStages?.find(s => s.isDefault);
        var isShowStageChangeConfirmationBox: boolean = true;
        this.changeEntityStage(getDefaultStage, getDefaultStage.id, isShowStageChangeConfirmationBox, true, orders);
      }
    });
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
      this.modalRef.componentInstance.entityWorkflowId = orders.entityWorkFlowID;
      this.modalRef.componentInstance.stageId = toEntityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;

      this.modalRef.result.then(response => {
        if (response != undefined) {
          const stageValueNoteParams = {
            entityTypeId: this.entityTypeId,
            entityId: orders.id,
            workflowId: orders.entityWorkFlowID,
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
              this.getOrdersList(this.pagingParams);
            });
          }).catch(() => {
            this.getOrdersList(this.pagingParams);
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
        this.getOrdersList(this.pagingParams);
      }).catch(() => {
        this.getOrdersList(this.pagingParams);
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
      let currentStageId = this.ordersListByStages.find(s => s.id == orders.stageId)?.id;
      let dropStage = this.ordersListByStages.find(x => x.id == toEntityStageId);
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: orders?.entityRecordTypeId, entityId: orders.id, stageId: toEntityStageId, entityWorkflowId: orders.entityWorkFlowID, assignedTo: assignedToForDto, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.orderAssignedTo = response;
          if (assignedToForDto != this.orderAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._ordersService.updateOrderAssignedTo({ entityId: orders.id, assignedToId: this.orderAssignedTo.assignedToId, entityWorkflowId: orders.entityWorkFlowID, isForcedAssignment: this.orderAssignedTo.isForcedAssignment }).then((updateOrderResponse: any) => {

              if (updateOrderResponse) {
                assignedToForDto = this.orderAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MESSAGE_ORDER_MOVETO_STAGE',
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
                this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MESSAGE_ORDER_STAGE_REOPEN', {
                  entityName: orders?.name !== null ? orders?.name : " "
                })
              )
            } else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('ORDERS.LISTING.MESSAGE_ORDER_MOVETO_STAGE',
                  { stageName: toEntityStageName })
              );
            }
          }
        }
        this.getOrdersList(this.pagingParams);
        resolve(null);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    })
  }

  // get work tasks by stage
  getEntityStagesWithTask(id) {
    return new Promise((resolve, reject) => {
      this.entityStagesWithTasksStorageKey = '';
      this.entityStagesWithTasksStorageKey = LocalStorageKey.OrderEntityStageWithTasksKey + "_" + this.entityTypeId + (id ? ("_" + id) : '');

      const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
      if (entityStagesWithTasks == null) {
        this._commonHelper.showLoader();
        this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, id).then(
          (response: any[]) => {
            this.ordersListByStages = JSON.parse(JSON.stringify(response));
            this.ordersListByStages.forEach((stage: any) => {
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
            this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.ordersListByStages));
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
        this.ordersListByStages = entityStagesWithTasks;
        resolve(null);
      }
    });
  }

}
