//ANGULAR
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { DataSources, DownloadFileMimeType, Entity, ExportType, FieldNames, FileExtension, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, RefType, ReferenceType, SectionCodes, UserTypeID } from '../../../@core/enum';
import { WorktaskPagingParams } from '../../../@core/sharedModels/paging-params.model';
//SERVICES
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { WorkTasksService } from '../worktasks.service';
import { SettingsService } from '../../settings/settings.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
//COMPONENTS
import { UserAssignDialogComponent } from '../../../@core/sharedComponents/user-assign/user-assign-dialog/user-assign-dialog.component';
import { WorkflowAssignDialogComponent } from '../../../@core/sharedComponents/workflow-assign-dialog/workflow-assign-dialog/workflow-assign-dialog.component';
import { WorkTaskImportDialogComponent } from '../work-task-import-dialog/work-task-import-dialog.component';
import { WorktaskAddComponent } from '../worktask-add/worktask-add.component';
import { WorktaskAddSubTaskComponent } from '../worktask-add-subtask/worktask-add-subtask.component';
import { LinkWorkTaskDialogComponent } from '../link-work-task-dialog/link-work-task-dialog.component';
import { PriorityDialogComponent } from '../../../@core/sharedComponents/priority-dialog/priority-dialog.component';
//PRIMNG
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
//OTHER
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import * as moment from 'moment';
import { SeverityDialogComponent } from '../../../@core/sharedComponents/severity-dialog/severity-dialog.component';
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';


@Component({
  selector: 'ngx-worktask-listing',
  templateUrl: './worktask-listing.component.html',
  styleUrls: ['./worktask-listing.component.scss']
})
export class WorktaskListingComponent implements OnInit {
  // search and table element
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  // worktask list
  worktasks: any[] = [];
  worktaskAssignedTo: any;
  entityTypeId: number = Entity.WorkTasks;
  EntityTitle: any;
  //ratingOptions: any [] = [];
  rating: number = null;
  customFilterConfig: any[] = [
  ];

  //user detail
  _loggedInUser: any;
  localStorageKeyPrefix: string = '';
  isFilterVisible: boolean = false;
  filterCount: number = 0;
  isfilterLoaded = false;

  //right side activity menu
  isShowActivityCenter: boolean = false;
  refreshActivityCenter: boolean = false;
  selectedWorkTaskForActivityCenter: any;
  selectedWorkTaskIdForActivityCenter: number = 0;
  selectedWorkTaskIsPausedForActivityCenter: boolean = false;
  selectedWorkTaskIsClosedForActivityCenter: boolean = false;
  selectedWorkTaskIsCompletedForActivityCenter: boolean = false;

  selectedRowId: number = 0;
  selectedCardExists: boolean = false;
  entityDetails: any;
  entityWorkflowId: number = 0;
  isAdvanceFilterVisible: boolean = false;
  entityRecordTypeId: number;
  isFromKanbanOrListView: boolean = false;

  // pagination
  pagingParams: WorktaskPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;
  startDate: Date;
  endDate: Date;

  // search filter
  lastWorktaskSearchFilter: any;
  worktaskSearchFilter = {
    searchText: '',
    recordTypeIds: null,
    workflowIds: null,
    stageIds: null,
    rating: this.rating,
    assignToUserIds: null,
    verifiedByIds: null,
    typeIds: null,
    showMyTasks: false,
    showStarred: false
  };

  //filter
  workflows: any = null;
  selectedWorkflows: any = null;
  stages: any = null;
  stagesForFilter: any = null;
  selectedstages: any = null;
  userList: any = [];
  verifiedByList: any = [];
  selectedUser = null;
  verifiedByUser = null;
  recordTypes = null;
  entitySubTypes: any = [];
  recordTypesDetail = null;
  recordTypesforSubWorkTask: any = null;
  selectedRecordTypes: any = null;
  selectedTypes: any = null;
  defaultTypeValue: any[] = [];
  showMyTasks: boolean = false;
  showStarred: boolean = false;

  // permission variable
  isViewWorktask: boolean = false;
  isAddWorktask: boolean = false;
  isEditWorktask: boolean = false;
  isImportWorktask: boolean = false;
  isDeleteWorktask: boolean = false;
  isAssignWorkflow: boolean = false;
  isWorkflowPermission: boolean = true;
  isExportWorkTasks: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAssignWorkTask: boolean = false;
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

  unassignedWorkTaskCount: number;
  isAllCheckBoxSelected: boolean;
  priorityDetails: any = null;
  severityDetails: any = null;
  entityStagesWithTasksStorageKey: string = LocalStorageKey.WorkTaskEntityStageWithTasksKey;
  changeWorkTaskStage: boolean = false;
  workTaskListByStages: any[] = [];

  //Export Worktask
  dynamicColumnNameSetting: any = {};
  TaskNumberColumnName: string;

  entityPrivacyDetails: any = [];
  userTypeID = UserTypeID;

  rowActionButtonMouseHoverFlag: boolean = false;
  keyfieldResponseData: any;
  currencySymbol: any = null;
  hoursInDay: number = null;

  relatedToIconToolTip: string;
  workTaskCreatedBy: number;
  workTaskPrivacyLevel: number;

  // sub work tasks
  isAddSubWorkTask: boolean = false;
  entitySubTypeDropdownValues: any = [];
  availableSubWorkTaskTypeNamesForWorkTaskDelete: any;

  //hidden fields region
  entityHiddenFieldSettings: any;
  isAssignedToHiddenInListColumn: boolean = false;
  isVerifiedByHiddenInListColumn: boolean = false;
  sectionCodes = SectionCodes;
  fieldNames = FieldNames;
  quickViewConfig: any;
  isShowEntityTypeNameIcon: boolean = true;

  hideRecordTypeFilter = null;

  entityHasWorkflow: boolean;
  isStageClosedOrCompleted: number;

  constructor(private _router: Router,
    public _commonHelper: CommonHelper,
    private _workTasksService: WorkTasksService,
    private _settingsService: SettingsService,
    private _dataSourceService: DatasourceService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _commonService: CommonService,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService) {
    this.EntityTitle = this._commonHelper.getEntityTitleFromMenuItemByUrl(decodeURI(this._router.url));
    this.setPermissions();

    this.initializePagination();
    this.setColumnDefinations();
  }

  ngOnInit(): void {
    // get logged in user information
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    //set local storage prefix
    this.localStorageKeyPrefix = `${this._loggedInUser.tenantId}_${this._loggedInUser.userId}`;

    Promise.all([
      this.getCurrencySymbol(),
      this.getHoursInDay(),
      this.getEntitySubTypes(),
      this.getWorkflowList(),
      this.getEntityStageList(),
      this.getPriorityFromReferenceType(),
      this.getSeverityFromReferenceType(),
      this.getPrivacyLevelRefererence(),
      this.getEntityHiddenField()
    ]).then((results: any) => {
      this.checkEntityHasAnyActiveWorkflow();
      this.setLastSearchFilterFromStorage();
      this.getHeaderFilters();
      this.getWorkTasks(this.pagingParams);
      this.subscribeSearchboxEvent();

      //hide assignedTo field Column;
      if (this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.AllListColumn, FieldNames.AssignedTo)) {
        this.isAssignedToHiddenInListColumn = true;
      } else {
        this.isAssignedToHiddenInListColumn = false;
      }
      //hide verifiedBy field Column;
      if (this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.AllListColumn, FieldNames.VerifiedBy)) {
        this.isVerifiedByHiddenInListColumn = true;
      } else {
        this.isVerifiedByHiddenInListColumn = false;
      }
      //new function 'set header column'
      const distinctStages = [...new Set(this.workflows.filter(f => f.parentEntityTypeID != null).map(item => item.parentEntityTypeID))];
      let tabInfo = this.cols.find(x => x.field === 'entityName');
      if (distinctStages.length == 0) {
        const distinctEntityRecordType = [...new Set(this.recordTypesDetail.filter(f => f.relatedToEntityTypeId != null).map(item => item.relatedToEntityTypeId))];
        if (distinctEntityRecordType.length == 1) {
          tabInfo.header = this._commonHelper.entityTypeList.find(de => de['id'] == distinctEntityRecordType[0]).displayName;
          this.isShowEntityTypeNameIcon = false;
        }
      }
      if (distinctStages != null && distinctStages.length == 1) {
        if (tabInfo) {
          tabInfo.header = this._commonHelper.entityTypeList.find(de => de['id'] == distinctStages[0]).displayName;
          this.isShowEntityTypeNameIcon = false;
        }
      }
      this.TaskNumberColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.EXPORT_TASK_NUMBER_LABEL'));

      this.dynamicColumnNameSetting = {};
      this.dynamicColumnNameSetting["TaskNumber"] = this.TaskNumberColumnName;
      this.dynamicColumnNameSetting["EntityName"] = tabInfo.header;

      this.setColumnDefinations();
      // get set quickview local storage config start
      this.quickViewConfig = this.getQuickViewConfig();
      if (this.quickViewConfig) {
        this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
        this.selectedWorkTaskIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
      }
      // get set quickview local storage config end
    });
  }

  fetchWorktasks(): void {
    if (this.pTable) {
      this.getWorkTasks(this.pagingParams);
    }
  }

  worktaskDetail(id: number): void {
    this._router.navigate(['detail/' + id]);
  }

  isAllSelected() {
    const selectedWorkListCount = this.worktasks.filter(x => x.isSelected).length;

    if (this.worktasks.length == selectedWorkListCount) {
      this.isAllCheckBoxSelected = true;
    } else {
      this.isAllCheckBoxSelected = false;
    }
  }

  checkUncheckAll() {
    this.worktasks.forEach(worktask => {
      worktask.isSelected = this.isAllCheckBoxSelected;
    });
  }

  openWorktaskImport() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorkTaskImportDialogComponent, this.optionsForPopupDialog);
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.fetchWorktasks();
      }
    });
  }

  //Export WorkTasks Listing

  exportExcel() {
    this.exportWorkTasks(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  private exportWorkTasks(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();

    const excelExportPayload = {
      searchString: this.pagingParams.searchString,
      entityRecordTypeIds: this.pagingParams.entityRecordTypeIds,
      entityWorkflowIds: this.pagingParams.entityWorkflowIds,
      entityWorkflowStageIds: this.pagingParams.entityWorkflowStageIds,
      assignToUserIds: this.pagingParams.assignToUserIds,
      verifiedByIds: this.pagingParams.verifiedByIds,
      typeIds: this.pagingParams.typeIds,
      showMyTasks: this.pagingParams.showMyTasks,
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

    let fileName = this._commonHelper.getConfiguredEntityName('{{WorkTasks_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    this._workTasksService.exportWorkTaskList(excelExportPayload).then((base64String: any) => {
      this._commonHelper.hideLoader();
      if (base64String && base64String != '') {
        this._commonHelper.downloadFile(`${fileName}${fileExtension}`, fileMimeType, base64String);
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_NO_DATA_EXPORT'));
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  // open add popup
  addWorkTask() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityWorkflowId = null;
    this.modalRef.componentInstance.relatedEntityTypeId = null;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = null;
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.entityRecordTypes = this.recordTypesDetail;
    this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.AddPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.WorkTasks;

    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.fetchWorktasks();
      }
    });
  }

  //delete work task
  deleteWorkTask(workTask) {

    this._commonHelper.showLoader();
    this._workTasksService.isSubWorkTaskExist(workTask.id).then((res: any) => {
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

        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_CONFIRM_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' }), null, null, optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._workTasksService.deleteWorkTask(workTask.id).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' })
                );
                this.totalRecords = this.totalRecords - 1;
                this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords / this.pagingParams.pageSize) : 1;
                // get work tasks
                this.fetchWorktasks();
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                  // get work tasks
                  this.fetchWorktasks();
                });
            }
          })
          .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.WORKTASK_DISMISS_DIALOG')));
      }
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  onWorktaskNameClick(worktaskID, workflowId) {
    // check logged in user have permission to view user details
    if (!this.isViewWorktask) {
      return;
    }

    // if not undefined then redirect
    if (worktaskID != undefined) {
      if (workflowId != undefined) {
        this._router.navigate(['/worktasks/details/' + workflowId + '/' + worktaskID]);
      }
      else {
        this._router.navigate(['/worktasks/details/' + worktaskID]);
      }
    }
  }


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

  // assigned to user what to do
  onAssignedToClick(worktask = null) {

    this.isWorkflowPermission = this._commonHelper.havePermission(worktask?.entityWorkFlowPermissionHash);

    if (!this.isAssignWorkTask || !this.isWorkflowPermission) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_NOT_HAVE_PERMISSION_ASSIGN_USER'));
      return;
    }

    if (worktask != null && worktask.entityWorkFlowID == null) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_CANNOT_ASSIGN_USER'));
      return;
    }

    if (worktask != null && worktask.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_CANNOT_ASSIGN_USER_PAUSED')));
      return;
    }

    if (worktask != null && (worktask.isClosedStage || worktask.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: worktask.stageName }));
      return;
    }

    this._commonHelper.showLoader();
    // get data from event
    let assignedToId = worktask.assignedTo; //owner 1 is assigned to
    let workTaskId = worktask.id;
    let workTaskStageId = worktask.stageID;
    let workFlowId = worktask.entityWorkFlowID;

    //DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    let params = this.prepareParamsForAssignedToUsers(workFlowId, workTaskStageId, assignedToId);
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.ASSIGNED_TO_DIALOG.DIALOG_TITLE'));
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        let obj = {
          entityid: workTaskId,
          assignedToId: selectedUserId,
          entityWorkflowId: workFlowId,
          stageId: workTaskStageId
        };

        this._commonHelper.showLoader();
        this._workTasksService.updateWorkTaskAssignedTo(obj).then((response: any) => {
          if (response) {
            this.worktaskAssignedTo = response;
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: Entity.WorkTasks, entityId: workTaskId, entityWorkflowId: workFlowId, stageId: workTaskStageId, assignedTo: selectedUserId, verifiedBy: worktask.verifiedBy }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORK_TASK_ASSIGNEDTO'));
              }
              this._commonHelper.hideLoader();
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              }
            );
          }
          this.getWorkTasks(this.pagingParams);
          this._commonHelper.hideLoader();
          // close
          this.modalRef.close();
        });
      });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  onFilterWorkflow(event): Promise<any> {
    return new Promise((resolve) => {
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
      if(event.value){
        this.worktaskSearchFilter.workflowIds = event.value.toString();
      } else {  
        this.worktaskSearchFilter.workflowIds = null
      }
     
      this.worktaskSearchFilter.stageIds = null;
      this.pagingParams.entityWorkflowStageIds = null;
      this.selectedstages = null;

      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_WorktasksListing, JSON.stringify(this.worktaskSearchFilter), this.localStorageKeyPrefix);
      resolve(this.stagesForFilter);
    });
  }

  onAssignWorkflow(worktask) {
    if (!worktask.isEditWorkTask || !this.isAssignWorkflow) {
      return;
    }

    if (worktask != null && worktask.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.WORK_ASSIGN_DIALOG.MESSAGE_CANNOT_ASSIGN_WORKFLOW_PAUSED'));
      return;
    }

    // filter workflows based on Parent Entity Type ID
    let filteredWorkflows = this.workflows.filter(x => x.value != 0);
    let isWorkflowAssign: boolean = worktask?.entityWorkFlowID != null;
    if (worktask?.entityTypeId != null && worktask?.entityTypeId > 0) {
      filteredWorkflows = filteredWorkflows.filter(x => (x.isDefault != null && x.isDefault == true) || x.parentEntityTypeID == worktask?.entityTypeId);
    }

    if (filteredWorkflows?.length == 0) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }

    if (filteredWorkflows?.length <= 1 && isWorkflowAssign) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }

    this._commonHelper.showLoader();
    this._workflowmanagementService.IsEntityEligibleToChangeWorkflow(Entity.WorkTasks, worktask.id, worktask.entityWorkFlowID == null).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response) {
        //TO BE DELETED PN - 15-12-2023 - SDC-3362
        // else if (worktask?.entityRecordTypeId != null && worktask?.entityRecordTypeId > 0) {
        //   if (filteredWorkflows.some(x => x.entityRecordTypeId == worktask?.entityRecordTypeId)) {
        //     let parentEntityTypeId = filteredWorkflows.filter(x => x.entityRecordTypeId == worktask?.entityRecordTypeId)[0]?.parentEntityTypeID;
        //     filteredWorkflows = filteredWorkflows.filter(x => (x.parentEntityTypeID == null && x.entityRecordTypeId == null) || x.parentEntityTypeID == parentEntityTypeId);
        //   }
        // }

        this.optionsForPopupDialog.size = "md";
        this.modalRef = this._modalService.open(WorkflowAssignDialogComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.workflows = filteredWorkflows;
        this.modalRef.componentInstance.workflowId = worktask.entityWorkFlowID;
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.WORK_ASSIGN_DIALOG.DIALOG_TITLE');
        this.modalRef.componentInstance.workflowSelectLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_SELECT_LABEL');
        this.modalRef.componentInstance.workflowSelectPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_STAGE_SELECT_PLACEHOLDER');

        this.modalRef.componentInstance.OnSubmitAssignWorkflow.subscribe((selectedWorkflowId) => {
          if (selectedWorkflowId != worktask.entityWorkFlowID) {
            //option for confirm dialog settings
            let optionsForConfirmDialog = {
              size: "md",
              centered: false,
              backdrop: 'static',
              keyboard: false
            };
            this._confirmationDialogService.confirm('WORKTASK.LISTING.MESSAGE_CONFIRM_ASSIGN_WORKTASK', null, null, optionsForConfirmDialog, true).then((confirmed) => {
              if (confirmed) {
                this._commonHelper.showLoader();
                this._workflowmanagementService.DeleteRelatedDataToChangeWorkflow(Entity.WorkTasks, worktask.id).then((response: any) => {
                  this._commonHelper.hideLoader();
                  //prepare object to send to backend to save
                  let params = {
                    EntityWorkflowId: selectedWorkflowId,
                    EntityType: Entity.WorkTasks,
                    Id: worktask.id,
                    AssignedTo: worktask.assignedTo,
                    EntityWorkflowRecordKey: null,
                    SelectedStageTaskIds: null,
                    IsAdd: true
                  };

                  this._commonHelper.showLoader();
                  this._workflowmanagementService.postSaveEntityProcess(params).then(() => {
                    this._workTasksService.changeEntityRecordType(worktask.id, this.workflows.filter(x => x.value == selectedWorkflowId)[0].entityRecordTypeID).then(() => {
                      this._workTasksService.changeWorkTaskEntityType(worktask.id, selectedWorkflowId).then(() => {
                        this._workTasksService.updateDefaultEstimatedTimeAndPoint(worktask.id, selectedWorkflowId).then(() => {
                          this.fetchWorktasks();
                          this._commonHelper.hideLoader();
                          // success message
                          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORKFLOW_ASSIGN_SUCCESS'));
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
        //worktask is not eligible to assign workflow
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORKFLOW_ASSIGN_NOTELIGIBLE'));
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchWorktasks();
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
      this.fetchWorktasks();
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchWorktasks();
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
    this.fetchWorktasks();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchWorktasks();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchWorktasks();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  //#region private methods
  private setPermissions(): void {
    this.isViewWorktask = this._commonHelper.havePermission(enumPermissions.ViewWorkTask);
    this.isAddWorktask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isEditWorktask = this._commonHelper.havePermission(enumPermissions.EditWorkTask);
    this.isDeleteWorktask = this._commonHelper.havePermission(enumPermissions.DeleteWorkTask);
    this.isImportWorktask = this._commonHelper.havePermission(enumPermissions.ImportWorkTasks);
    this.isAssignWorkflow = this._commonHelper.havePermission(enumPermissions.AssignWorkflow);
    this.isExportWorkTasks = this._commonHelper.havePermission(enumPermissions.ExportWorkTasks);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadWorkTaskDocument);
    this.isAssignWorkTask = this._commonHelper.havePermission(enumPermissions.AssignWorkTask);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);
    // sub work task
    this.isAddSubWorkTask = this._commonHelper.havePermission(enumPermissions.AddSubWorkTask);
    this.isShowActionColumn = this.isDeleteWorktask || this.isEditWorktask;
  }

  private setColumnDefinations(): void {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'taskNumber', header: 'WORKTASK.LISTING.TABLE_HEADER_TASK_NUMBER', visible: true, sort: true, exportFieldName: 'taskNumber' },
      { field: 'name', header: 'WORKTASK.LISTING.TABLE_HEADER_NAME', visible: true, sort: true, exportFieldName: 'name' },
      { field: 'entityName', header: 'WORKTASK.LISTING.TABLE_HEADER_RELATED_TO', visible: true, sort: true, exportFieldName: 'entityName' },
      { field: 'entityWorkFlowName', header: 'WORKTASK.LISTING.TABLE_HEADER_WORKFLOW_NAME', visible: true, sort: true, exportFieldName: 'entityWorkFlowName' },
      { field: 'stageName', header: 'WORKTASK.LISTING.TABLE_HEADER_STAGE_NAME', visible: true, sort: true, exportFieldName: 'stageName' },
      { field: 'assignedToName', header: 'WORKTASK.LISTING.TABLE_HEADER_ASSIGNEDTO', visible: !this.isAssignedToHiddenInListColumn, sort: true, exportFieldName: 'assignedToName' },
      { field: 'verifiedByName', header: 'WORKTASK.LISTING.TABLE_HEADER_VERIFIED_BY', visible: !this.isVerifiedByHiddenInListColumn, sort: true, exportFieldName: 'verifiedByName' },
      { field: 'createdByName', header: 'WORKTASK.LISTING.TABLE_HEADER_CREATED_BY', visible: true, sort: true, exportFieldName: 'createdByName' },
      { field: 'created', header: 'WORKTASK.LISTING.TABLE_HEADER_CREATED', visible: true, sort: true, exportFieldName: 'created' },
      { field: 'id', header: '', visible: true, sort: false, class: "action ", display: 'td-display' }
    ];

    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.cols.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private initializePagination(): void {
    this.pagingParams = new WorktaskPagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'created';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private getAssigedToUsers(selectedUserId, includeAllUsers, searchString: any) : Promise<any> {
    return new Promise((resolve, reject) => {
      //DD 20220330 SDC-188: datasources with workflow id and other information
      // prepare params
      let params = this.prepareParamsForAssignedToUsersAllWorkTask(selectedUserId, includeAllUsers, searchString);
      // call datasource service with params
      this._commonHelper.showLoader();
      return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALLWORKTASKASSIGNEDTO, params).then((responce: any) => {
        if (responce) {
          this.userList = responce;
          this.userList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_OPTION_TEXT_ASSIGNEDTO') });
          this.userList.sort((a, b) => a.value - b.value);
        }
        this._commonHelper.hideLoader();
        resolve(this.userList);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  private getVerifiedBy(selectedUserId, includeAllUsers, searchString: any) : Promise<any> {
    return new Promise((resolve, reject) => {
      let params = this.prepareParamsForVerifiedByUserAllWorkTask(selectedUserId, includeAllUsers, searchString);
      // call datasource service with params
      this._commonHelper.showLoader();
      return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALLWORKTASKVERIFIEDBY, params).then((responce: any) => {
        if (responce) {
          this.verifiedByList = responce;
          this.verifiedByList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_OPTION_TEXT_VERIFIEDBY') });
          this.verifiedByList.sort((a, b) => a.value - b.value);
        }
        this._commonHelper.hideLoader();
        resolve(this.verifiedByList);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  private prepareParamsForWorkTaskStages() {
    const params = [];
    let paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.WorkTasks
    };
    params.push(paramItem);
    return params;
  }

  private getEntityStageList() {
    return new Promise((resolve, reject) => {
      this.stages = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.WorkTaskWorkFlowStageList));
      if (this.stages == null) {
        let params = this.prepareParamsForWorkTaskStages();
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
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.WorkTaskWorkFlowStageList, JSON.stringify(this.stages));
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

  private prepareParamsForAssignedToUsersAllWorkTask(assignedTo, includeAllUsers = 1, searchString = null) {
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
    const params = [];
    let paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.WorkTasks
    };
    params.push(paramItem);
    return params;
  }

  private getWorkflowList(): Promise<any> {
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
      } else {
        resolve(null);
      }
    });
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_WorktasksListing, this.localStorageKeyPrefix));
    if (searchFilter != null) {
      this.worktaskSearchFilter = searchFilter;
      if (this.worktaskSearchFilter.recordTypeIds != null && this.worktaskSearchFilter.recordTypeIds != '') {
        this.selectedRecordTypes = this.worktaskSearchFilter.recordTypeIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedRecordTypes = null;
      }

      if (this.worktaskSearchFilter.workflowIds != null && this.worktaskSearchFilter.workflowIds != '') {
        this.selectedWorkflows = this.worktaskSearchFilter.workflowIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedWorkflows = null;
      }

      if (this.worktaskSearchFilter.stageIds != null && this.worktaskSearchFilter.stageIds != '') {
        this.selectedstages = this.worktaskSearchFilter.stageIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedstages = null;
      }

      if (this.worktaskSearchFilter.typeIds != null && this.worktaskSearchFilter.typeIds != '') {
        this.selectedTypes = this.worktaskSearchFilter.typeIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedTypes = this.defaultTypeValue;
        this.pagingParams.typeIds = this.defaultTypeValue.toString();
        this.pagingParams.rating = this.worktaskSearchFilter.rating;
        this.worktaskSearchFilter.typeIds = this.defaultTypeValue.toString();
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
      if (this.worktaskSearchFilter.assignToUserIds != null && this.worktaskSearchFilter.assignToUserIds != '') {
        this.selectedUser = this.worktaskSearchFilter.assignToUserIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedUser = null;
      }

      if (this.worktaskSearchFilter.verifiedByIds != null && this.worktaskSearchFilter.verifiedByIds != '') {
        this.verifiedByUser = this.worktaskSearchFilter.verifiedByIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.verifiedByUser = null;
      }

      this.showMyTasks = this.worktaskSearchFilter.showMyTasks;
      this.showStarred = this.worktaskSearchFilter.showStarred;
    }
    else {
      this.selectedTypes = this.defaultTypeValue;
      this.pagingParams.typeIds = this.defaultTypeValue.toString();
      this.worktaskSearchFilter.typeIds = this.defaultTypeValue.toString();
    }

    this.lastWorktaskSearchFilter = JSON.parse(JSON.stringify(this.worktaskSearchFilter));
  }

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.worktaskSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_WorktasksListing, JSON.stringify(this.worktaskSearchFilter), this.localStorageKeyPrefix);
        this.fetchWorktasks();
      });
  }

  // get work tasks for list
  private getWorkTasks(pagingParams: WorktaskPagingParams) {
    this._commonHelper.showLoader();
    pagingParams.searchString = this.worktaskSearchFilter.searchText;
    pagingParams.entityRecordTypeIds = this.worktaskSearchFilter.recordTypeIds;
    pagingParams.entityWorkflowIds = this.worktaskSearchFilter.workflowIds;
    pagingParams.entityWorkflowStageIds = this.worktaskSearchFilter.stageIds;
    pagingParams.assignToUserIds = this.worktaskSearchFilter.assignToUserIds;
    pagingParams.verifiedByIds = this.worktaskSearchFilter.verifiedByIds;
    pagingParams.typeIds = this.worktaskSearchFilter.typeIds;
    pagingParams.showMyTasks = this.worktaskSearchFilter.showMyTasks;
    pagingParams.showStarred = this.worktaskSearchFilter.showStarred;
    pagingParams.rating = this.worktaskSearchFilter.rating;

    this._workTasksService.getWorkTaskList(pagingParams).then((response: any) => {
      this.worktasks = response;
      this.worktasks.forEach(data => {
        let settingsJson = JSON.parse(data.settingsJson);
        data['isSelected'] = false;
        data.relatedToIconToolTip = this._commonHelper.entityTypeList.find(entityType => entityType['id'] == data['entityTypeId'])?.displayName.toString().trim();

        var privacyDetails = this.entityPrivacyDetails?.find((x: any) => x.intValue1 == data['privacyLevel']);
        data['privacyIcon'] = privacyDetails?.strValue1;
        data['privacyToolTip'] = privacyDetails?.name;

        const parentSubTypeDetails = this.entitySubTypes?.find(x => data.parentTypeID == x.id);
        data.isParentSubTypeViewWorkTask = parentSubTypeDetails?.viewPermissionHash != null ? this._commonHelper.havePermission(parentSubTypeDetails.viewPermissionHash) : this.isViewWorktask;
        data.isParentSubTypeEditWorkTask = parentSubTypeDetails?.editPermissionHash != null ? this._commonHelper.havePermission(parentSubTypeDetails.editPermissionHash) : this.isEditWorktask;
        data.isParentSubTypeDeleteWorkTask = parentSubTypeDetails?.deletePermissionHash != null ? this._commonHelper.havePermission(parentSubTypeDetails.deletePermissionHash) : this.isDeleteWorktask;

        const subTypeDetails = this.entitySubTypes?.find(x => data.typeID == x.id);
        data.isViewWorkTask = subTypeDetails?.viewPermissionHash != null ? this._commonHelper.havePermission(subTypeDetails.viewPermissionHash) : this.isViewWorktask;
        data.isEditWorkTask = subTypeDetails?.editPermissionHash != null ? this._commonHelper.havePermission(subTypeDetails.editPermissionHash) : this.isEditWorktask;
        data.isDeleteWorkTask = subTypeDetails?.deletePermissionHash != null ? this._commonHelper.havePermission(subTypeDetails.deletePermissionHash) : this.isDeleteWorktask;
        data.labelTooltip1 = settingsJson.Token1Tooltip;
        data.parentLabelTooltip1 = settingsJson.ParentTokenTooltip;
      });
      this.isAllCheckBoxSelected = false;
      this.unassignedWorkTaskCount = this.worktasks.filter(x => !x.entityWorkFlowName).length;

      this.totalRecords = this.worktasks.length > 0 ? response[0].totalRecords : 0;
      this.pTable.rows = pagingParams.pageSize;
      this.totalPages = Math.ceil(this.totalRecords / pagingParams.pageSize);
      this.end = pagingParams.pageNo == this.totalPages ? this.totalRecords : pagingParams.pageNo * pagingParams.pageSize;
      this.start = this.end == this.totalRecords ? (this.totalRecords - this.worktasks.length + 1) : (this.end - pagingParams.pageSize) + 1;

      //set Action column show/hide dynamically
      this.isStageClosedOrCompleted = this.worktasks.filter(x => x.isCompletedStage || x.isClosedStage).length;
      if ((!this.isAllowToReopen && !this.isDeleteWorktask) || (this.isStageClosedOrCompleted < 0 && this.isAllowToReopen)) {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = false;
      }
      else {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = true;
      }

      if (this.selectedWorkTaskIdForActivityCenter != null && this.selectedWorkTaskIdForActivityCenter > 0 && this.worktasks.some(x => x.id == this.selectedWorkTaskIdForActivityCenter)) {
        this.updateEntityDetails(true, this.worktasks.find(x => x.id == this.selectedWorkTaskIdForActivityCenter));
      }
      else {
        this.resetSelectedEntity();
      }

      this._commonHelper.hideLoader();

    }, (error) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(error.message);
    });
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('WORKTASK.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }
  //#endregion

  onPriorityClick(worktask = null) {
    if (!worktask.isEditWorkTask) {
      return;
    }

    if (worktask != null && worktask.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.PRIORITY_DIALOG.MESSAGE_CANNOT_CHANGE_PRIORITY_PAUSED'));
      return;
    }

    if (worktask != null && (worktask.isClosedStage || worktask.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.PRIORITY_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: worktask?.stageName }));
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
      this.modalRef.componentInstance.priorityId = worktask?.priority;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.PRIORITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.prioritySelectLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.PRIORITY_DIALOG.PRIORITY_SELECT_LABEL');
      this.modalRef.componentInstance.prioritySelectPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.PRIORITY_DIALOG.PRIORITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangePriority.subscribe((selectedPriorityId) => {
        // prepare object to send to backend to save
        let obj = {
          workTaskId: worktask?.id,
          priority: selectedPriorityId,
          EntityWorkflowId: worktask?.entityWorkFlowID
        };

        this._commonHelper.showLoader();
        this._workTasksService.updateWorkTaskPriority(obj).then(response => {
          if (response) {
            this.getWorkTasks(this.pagingParams);
            // success message
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORK_TASK_PRIORITY')
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

  onSeverityClick(worktask = null) {
    if (!worktask.isEditWorkTask) {
      return;
    }

    if (worktask != null && worktask.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.SEVERITY_DIALOG.MESSAGE_CANNOT_CHANGE_SEVERITY_PAUSED'));
      return;
    }

    if (worktask != null && (worktask.isClosedStage || worktask.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.SEVERITY_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: worktask?.stageName }));
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
      this.modalRef.componentInstance.severityId = worktask?.severity;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.SEVERITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.severitySelectLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.SEVERITY_DIALOG.SEVERITY_SELECT_LABEL');
      this.modalRef.componentInstance.severitySelectPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.SEVERITY_DIALOG.SEVERITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangeSeverity.subscribe((selectedSeverityId) => {
        // prepare object to send to backend to save
        let obj = {
          workTaskId: worktask?.id,
          severity: selectedSeverityId,
          entityWorkflowId: worktask?.entityWorkFlowID
        };

        this._commonHelper.showLoader();
        this._workTasksService.updateWorkTaskSeverity(obj).then(response => {
          if (response) {
            this.getWorkTasks(this.pagingParams);
            // success message
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORK_TASK_SEVERITY')
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

  /**
   * Assign Bulk Work Flow For Work Task
   * @returns
   */
  assignWorkflow() {

    const selectedWorkList = this.worktasks.filter(x => x.isSelected);

    if (selectedWorkList.length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MEESAGE_SELECT_ONE_WORKRASK'));
      return;
    }

    const distinctEntity = [...new Set(selectedWorkList.map(item => item.entityWorkFlowID))];
    if (distinctEntity.length > 1) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
      return;
    }

    // filter workflows based on Parent Entity Type ID
    let filteredWorkflows = this.workflows.filter(x => x.value != 0);
    const distinctEntityType = [...new Set(selectedWorkList.map(item => item.entityTypeId))];
    let isWorkflowAssign: boolean = distinctEntity?.[0] != null;

    if (distinctEntityType != null && distinctEntityType.length > 0 && distinctEntityType[0] > 0) {
      filteredWorkflows = filteredWorkflows.filter(x => (x.isDefault != null && x.isDefault == true) || x.parentEntityTypeID == distinctEntityType[0]);
    }

    if (filteredWorkflows?.length == 0) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }

    if (filteredWorkflows?.length <= 1 && isWorkflowAssign) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }

    //TO BE DELETED PN - 15-12-2023 - SDC-3362
    // const distinctEntityRecordType = [...new Set(selectedWorkList.map(item => item.entityRecordTypeId))];
    // if (distinctEntityRecordType.length > 1) {
    //   this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
    //   return;
    // }

    if (distinctEntityType.length > 1) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
      return;
    }

    if (selectedWorkList.filter(x => x.isPaused == true).length > 0) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_CANNOT_BULKASSIGN_WORKFLOW_PAUSED'));
      return;
    }

    let eligibilityParams: any[] = [];
    selectedWorkList.forEach(x => {
      let param = {
        entityTypeId: Entity.WorkTasks,
        entityId: x.id,
        bypassWokflowChecking: x.entityWorkFlowID == null
      }
      eligibilityParams.push(param);
    });

    this._commonHelper.showLoader();
    this._workflowmanagementService.BulkCheckIsEntityEligibleToChangeWorkflow(eligibilityParams).then((response: any) => {
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
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.WORK_ASSIGN_DIALOG.DIALOG_TITLE');
        this.modalRef.componentInstance.workflowSelectLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_SELECT_LABEL');
        this.modalRef.componentInstance.workflowSelectPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_STAGE_SELECT_PLACEHOLDER');

        this.modalRef.componentInstance.OnSubmitAssignWorkflow.subscribe((selectedWorkflowId) => {
          //option for confirm dialog settings
          let optionsForConfirmDialog = {
            size: "md",
            centered: false,
            backdrop: 'static',
            keyboard: false
          };
          this._confirmationDialogService.confirm('WORKTASK.LISTING.MESSAGE_CONFIRM_ASSIGN_WORKTASK', null, null, optionsForConfirmDialog, true).then((confirmed) => {
            if (confirmed) {
              let DeleteRelatedDataParams: any[] = [];
              selectedWorkList.filter(x => x.entityWorkFlowID != selectedWorkflowId).forEach(x => {
                let param = {
                  entityTypeId: Entity.WorkTasks,
                  entityId: x.id
                }
                DeleteRelatedDataParams.push(param);
              });

              this._commonHelper.showLoader();
              this._workflowmanagementService.BulkDeleteRelatedDataToChangeWorkflow(DeleteRelatedDataParams).then((response: any) => {
                this._commonHelper.hideLoader();
                let arrWorkTasks: any[] = [];
                let arrWorkTaskIds: any[] = [];
                selectedWorkList.filter(x => x.entityWorkFlowID != selectedWorkflowId).forEach(x => {
                  let params = {
                    EntityWorkflowId: selectedWorkflowId,
                    EntityType: Entity.WorkTasks,
                    Id: x.id,
                    AssignedTo: x.assignedTo,
                    EntityWorkflowRecordKey: null,
                    SelectedStageTaskIds: null,
                    IsAdd: true
                  };

                  arrWorkTasks.push(params);
                  arrWorkTaskIds.push(x.id);
                });

                this._commonHelper.showLoader();
                this._workflowmanagementService.assignBulkWorkFlowForTask(arrWorkTasks).then(res => {
                  this._workTasksService.changeEntityRecordType(arrWorkTaskIds.toString(), this.workflows.filter(x => x.value == selectedWorkflowId)[0].entityRecordTypeID).then(res => {
                    this._workTasksService.changeWorkTaskEntityType(arrWorkTaskIds.toString(), selectedWorkflowId).then(() => {
                      this._workTasksService.updateDefaultEstimatedTimeAndPoint(arrWorkTaskIds.toString(), selectedWorkflowId).then(() => {
                        this.fetchWorktasks();
                        this._commonHelper.hideLoader();
                        // success message
                        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORKFLOW_ASSIGN_SUCCESS'));
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
        //one of the worktask is not eligible to assign workflow
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORKFLOW_BULKASSIGN_NOTELIGIBLE'));
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }


  onVerifiedByClick(worktask = null) {
    this.isWorkflowPermission = this._commonHelper.havePermission(worktask.entityWorkFlowPermissionHash);

    if (!this.isAssignWorkTask || !this.isWorkflowPermission) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.VERIFIED_BY_DIALOG.MESSAGE_NOT_HAVE_PERMISIION_ASSIGN_VERIFIED_BY'));
      return;
    }

    if (worktask != null && worktask.entityWorkFlowID == null) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.VERIFIED_BY_DIALOG.MESSAGE_CANNOT_ASSIGN_VERIFIED_BY'));
      return;
    }

    if (worktask != null && worktask.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.VERIFIED_BY_DIALOG.MESSAGE_CANNOT_ASSIGN_VERIFIED_BY_PAUSED'));
      return;
    }

    if (worktask != null && (worktask.isClosedStage || worktask.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.VERIFIED_BY_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: worktask.stageName }));
      return;
    }

    this._commonHelper.showLoader();
    // get data from event
    const assignedToId = worktask.assignedTo;
    const verifiedById = worktask.verifiedBy;
    const workTaskId = worktask.id;
    const workTaskStageId = worktask.stageID;
    const workFlowId = worktask.entityWorkFlowID;

    // prepare params
    const params = this.prepareParamsForVerifiedByUser(workFlowId, workTaskStageId, verifiedById, 1, '');
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.VERIFIED_BY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.VERIFIED_BY_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.VERIFIED_BY_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        const obj = {
          entityid: workTaskId,
          verifiedById: selectedUserId,
          entityWorkflowId: workFlowId
        };

        this._commonHelper.showLoader();
        this._workTasksService.updateWorkTaskVerifiedBy(obj).then((response: any) => {
          if (response) {
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: Entity.WorkTasks, entityId: workTaskId, entityWorkflowId: workFlowId, stageId: workTaskStageId, assignedTo: assignedToId, verifiedBy: selectedUserId }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORK_TASK_VERIFIED_BY'));
              }
              this._commonHelper.hideLoader();
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              }
            );
          }

          this.getWorkTasks(this.pagingParams);
          this._commonHelper.hideLoader();

          // close
          this.modalRef.close();
        });
      });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  prepareParamsForVerifiedByUser(workFlowId, stageId, verifiedBy, includeAllUsers = 1, searchString = '') {
    const params = [];
    const paramItem = {
      name: 'EntityWorkflowID',
      type: 'int',
      value: workFlowId,
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
      type: 'int',
      value: includeAllUsers,
    };

    params.push(paramItem3);
    const paramItem4 = {
      name: 'SearchString',
      type: 'int',
      value: searchString,
    };
    params.push(paramItem4);



    return params;
  }
  prepareParamsForVerifiedByUserAllWorkTask(verifiedBy, includeAllUsers = 1, searchString = '') {
    const params = [];

    const paramItem = {
      name: 'SelectedUserID',
      type: 'int',
      value: verifiedBy,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'IncludeAllUsers',
      type: 'int',
      value: includeAllUsers,
    };

    params.push(paramItem1);
    const paramItem2 = {
      name: 'SearchString',
      type: 'int',
      value: searchString,
    };
    params.push(paramItem2);



    return params;
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

    const settingsJson = JSON.parse(rowData.settingsJson);

    let showAddSubWorkTaskButton: boolean = false;
    let isShowMoreDetailButton: boolean = false;
    // show/hide add sub work task button
    let entitySubTypeLevel = this.entitySubTypes.find(x => x.id == rowData.typeID)?.level;
    let availableSubWorktaskTypeDetails = this.entitySubTypes.filter(x => x.parentID == rowData.typeID && x.level == entitySubTypeLevel + 1);
    this.availableSubWorkTaskTypeNamesForWorkTaskDelete = availableSubWorktaskTypeDetails?.map(x => x.name).join(" or ")?.trim() ?? null;
    if (availableSubWorktaskTypeDetails.length > 0) {
      showAddSubWorkTaskButton = true;
    }

    if (rowData.isViewWorkTask) {
      isShowMoreDetailButton = true;
    }
    var privacyDetails = this.entityPrivacyDetails?.find((x: any) => x.intValue1 == rowData?.privacyLevel);
    let privacyIcon = privacyDetails?.strValue1;
    let privacyToolTip = privacyDetails?.name;

    const obj = {
      id: rowData.id,
      entityIcon: settingsJson?.Token1IconClass,
      entityName: rowData?.typeName,
      label1: settingsJson.Token1Text,
      label1RedirectURL: settingsJson.Token1Url,
      label1IconClass: settingsJson?.Token1IconClass,
      labelTooltip1: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(settingsJson.Token1Tooltip)),
      label1TypeName: rowData?.typeName,
      label2: settingsJson.Token2Text,
      label2RedirectURL: settingsJson.Token2Url,
      label3: settingsJson.Token3Text,
      label3RedirectURL: settingsJson.Token3Url,
      relatedToId: rowData?.entityId,
      relatedToLabel: rowData?.entityName,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      entityRecordTypeId: rowData?.entityRecordTypeId,
      entityWorkflowId: rowData?.entityWorkFlowID,
      entityTypeId: rowData?.entityTypeId,
      entityId: rowData?.entityId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      relatedToRedirectURL: this.onRelatedToClick(rowData),
      relatedToIconToolTip: this._commonHelper.entityTypeList.find(entityType => entityType['id'] == rowData?.entityTypeId)?.displayName.toString().trim(),
      isClosedStage: rowData?.isClosedStage,
      isCompletedStage: rowData?.isCompletedStage,
      isPaused: rowData?.isPaused,
      availableSubWorkTaskTypeDetails: availableSubWorktaskTypeDetails,
      entitySubTypeId: rowData?.typeID,
      showAddSubWorkTaskButton: showAddSubWorkTaskButton,
      privacyLevel: rowData?.privacyLevel,
      createdBy: rowData?.createdBy,
      subWorkTaskToolTipPrefix: this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.SUB_WORK_TASKS_TAB.ADD_SUBTASK_PREFIX'),
      privacyIcon: privacyIcon,
      privacyToolTip: privacyToolTip,
      isShowMoreDetailButton: isShowMoreDetailButton
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
    this.isFromKanbanOrListView = false;
    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedRowEntityId: this.selectedRowId
    }

    if (isShowActivityCenter != null) {
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && rowData.isViewWorkTask);
  }

  // open add popup
  onSubTaskCreateForWorkTask(workTask) {

    if ((workTask != null && workTask.isPaused)) {
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
    this.modalRef.componentInstance.workflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.parentEntityTypeId = workTask?.entityTypeId;
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
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.LINK_WORKTASK_TITLE'));
    this.modalRef.componentInstance.workTaskId = workTask.id;
    this.modalRef.componentInstance.entityWorkFlowId = this.entityWorkflowId;

    this.modalRef.result.then((response: boolean) => {
      if (response) { }
    });
  }

  // refresh all data
  refreshData() {
    if (!this.worktaskSearchFilter) {
      // reset
      this.pagingParams.pageNo = 1;
      // this.workTaskList = [];
    } else {
      this.pagingParams.pageNo = 1;
      // this.workTaskList = [];
      this.getWorkTasks(this.pagingParams);
    }
  }

  // Set row item selection and quick view status
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Worktasks_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get row item selection and quick view status
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Worktasks_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
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

  private resetSelectedEntity() {
    this.isShowActivityCenter = false;
    this.selectedWorkTaskForActivityCenter = null;
    this.selectedWorkTaskIsPausedForActivityCenter = null;
    this.selectedWorkTaskIsClosedForActivityCenter = null;
    this.selectedWorkTaskIsCompletedForActivityCenter = null;
    this.selectedWorkTaskIdForActivityCenter = 0;
    this.selectedRowId = 0;
  }

  advanceFilterVisibleChange(value: boolean) {
    this.isAdvanceFilterVisible = value;
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

    this._workTasksService.updateWorktaskField(params).then((response) => {
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
            this.recordTypes.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_OPTION_TEXT_RECORDTYPE') });
            this.recordTypes.sort((a, b) => a.value - b.value);
            this.recordTypesforSubWorkTask = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS');
            this.hideRecordTypeFilter = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS').map(x => ({ 'label': x.name, 'value': x.id }));
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
          }
          this._commonHelper.hideLoader();
          resolve(this.recordTypes);
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
      }
      else {
        this.recordTypesDetail = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == Entity.Products || x.parentEntityTypeID == Entity.Cases || x.parentEntityTypeID == Entity.Opportunities || x.parentEntityTypeID == null)).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }));
        this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS').map(x => ({ 'label': x.name, 'value': x.id }));
        this.recordTypes.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_OPTION_TEXT_RECORDTYPE') });
        this.recordTypes.sort((a, b) => a.value - b.value);
        this.recordTypesforSubWorkTask = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS');
        this.hideRecordTypeFilter = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS').map(x => ({ 'label': x.name, 'value': x.id }));
        resolve(this.recordTypes);
      }
    });
  }

  private getEntitySubTypes(): Promise<any> {
    let storageKey = `${LocalStorageKey.ALLENTITYSUBTYPES}`;
    return new Promise((resolve, reject) => {
      const allEntitySubTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntitySubTypes == null) {
        this._commonHelper.showLoader();
        this._commonService.getEntitySubTypes().then((response: any) => {
          if (response) {
            this.entitySubTypes = response.sort((a, b) => a.parentID - b.parentID);
            this.defaultTypeValue = this.getDefaultEntitySubTypes(this.entitySubTypes);

            this.entitySubTypeDropdownValues = this.entitySubTypes.filter(x => x.listPermissionID == null || this._commonHelper.havePermission(x.listPermissionHash)).sort((a, b) => a.parentID - b.parentID);
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
          }
          this._commonHelper.hideLoader();
          resolve(this.entitySubTypeDropdownValues);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.entitySubTypes = allEntitySubTypes;
        this.defaultTypeValue = this.getDefaultEntitySubTypes(this.entitySubTypes);
        this.entitySubTypeDropdownValues = this.entitySubTypes.filter(x => x.listPermissionID == null || this._commonHelper.havePermission(x.listPermissionHash)).sort((a, b) => a.parentID - b.parentID);
        resolve(this.entitySubTypeDropdownValues);
      }
    });
  }

  private getDefaultEntitySubTypes(entitySubTypesList): any[] {
    let defaultValues: any[] = [];
    let defaultTypeObject = entitySubTypesList.find(x => x.parentID == null);
    if (defaultTypeObject != null && defaultTypeObject != undefined) {
      defaultValues.push(defaultTypeObject.id);
    }
    return defaultValues
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
      } else {
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

  private checkEntityHasAnyActiveWorkflow() {
    this.workflows = this.workflows.filter(x => x.value != 0);
    if (this.workflows.length == 0) {
      this.entityHasWorkflow = false;
      if (this.cols && this.cols.length > 0) {
        this.checkColumnExist('entityWorkFlowName');
        this.checkColumnExist('stageName');
        this.checkColumnExist('assignedToName');
        this.checkColumnExist('verifiedByName');
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

  onReopenStage(workTask: any) {
    if (!this.isAllowToReopen) {
      return;
    }

    this.getEntityStagesWithTask(workTask.entityWorkFlowID).then(() => {
      if (workTask.isClosedStage || workTask.isCompletedStage) {
        //get default stage details
        const getDefaultStage: any = this.workTaskListByStages?.find(s => s.isDefault);
        var isShowStageChangeConfirmationBox: boolean = true;
        this.changeEntityStage(getDefaultStage, getDefaultStage.id, isShowStageChangeConfirmationBox, true, workTask);
      }
    });
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
      this.modalRef.componentInstance.entityWorkflowId = workTask.entityWorkFlowID;
      this.modalRef.componentInstance.stageId = toEntityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;
      this.modalRef.result.then(response => {
        if (response != undefined) {
          const stageValueNoteParams = {
            entityTypeId: this.entityTypeId,
            entityId: workTask.id,
            workflowId: workTask.entityWorkFlowID,
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
              this.getWorkTasks(this.pagingParams);
            });
          }).catch(() => {
            this.getWorkTasks(this.pagingParams);
          });
        }
      });
    }
    else {
      Promise.all([
        this.updateEntityStage(toEntityStageId, toEntityStageDetail, isShowStageChangeConfirmationBox, isReopenedStage, workTask),
      ]).then(() => {
        // get list
        this.getWorkTasks(this.pagingParams);
      }).catch(() => {
        this.getWorkTasks(this.pagingParams);
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
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: workTask?.entityRecordTypeId, entityId: workTask.id, stageId: toEntityStageId, entityWorkflowId: workTask.entityWorkFlowID, assignedTo: assignedToForDto, verifiedBy: workTask.verifiedBy, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.worktaskAssignedTo = response;
          if (assignedToForDto != this.worktaskAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._workTasksService.updateWorkTaskAssignedTo({ entityId: workTask.id, assignedToId: this.worktaskAssignedTo.assignedToId, entityWorkflowId: workTask.entityWorkFlowID, isForcedAssignment: this.worktaskAssignedTo.isForcedAssignment }).then((response: any) => {
              if (response) {
                assignedToForDto = this.worktaskAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORK_TASK_MOVETO_STAGE',
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
                this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORK_TASK_STAGE_REOPEN', {
                  entityName: workTask?.name !== null ? workTask?.name : " "
                })
              )
            } else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.MESSAGE_WORK_TASK_MOVETO_STAGE',
                  { stageName: toEntityStageDetail.name })
              );
            }
          }
        }
        // get list
        this.getWorkTasks(this.pagingParams);
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

  // get work tasks by stage
  getEntityStagesWithTask(id) {

    return new Promise((resolve, reject) => {
      this.entityStagesWithTasksStorageKey = '';
      this.entityStagesWithTasksStorageKey = LocalStorageKey.WorkTaskEntityStageWithTasksKey + "_" + this.entityTypeId + (id ? ("_" + id) : '');

      const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
      if (entityStagesWithTasks == null) {
        this._commonHelper.showLoader();
        this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, id).then(
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
      }
      else {
        this.workTaskListByStages = entityStagesWithTasks;
        resolve(null);
      }
    });
  }

  showhideFilter() {
    this.isFilterVisible = !this.isFilterVisible;
  }

  isFilterVisibleChange(value: boolean) {
    this.isFilterVisible = value;
  }

  // when filter is changed
  getFilterValues(event) {
    let changefiltercount = 0;
    event.forEach(item => {
      let kay = Object.keys(item)[0];
      this.worktaskSearchFilter[kay] = item[kay];
      if (item[Object.keys(item)[0]] != '' && item[Object.keys(item)[0]] && item.isCountableFilter == 1) {
        changefiltercount++;
      }
    });

    this.filterCount = changefiltercount;

    //set workTask search filter
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_WorktasksListing, JSON.stringify(this.worktaskSearchFilter), this.localStorageKeyPrefix);

    this.getWorkTasks(this.pagingParams);

    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedWorkTaskIdForActivityCenter = this.quickViewConfig.selectedCardEntityId;
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
    }
  }

  multiSelectFilterEvent(event) {
    if (event && event.controlName == 'assignToUserIds') {
      this.getAssigedToUsers(event.selectedIds, 0, event.filter).then(results => {
        this.userList = results;
        this.customFilterConfig[4].options = this.userList;
      });
    }
    if (event && event.controlName == 'verifiedByIds') {
      this.getVerifiedBy(event.selectedIds, 0, event.filter).then(results => {
        this.userList = results;
        this.customFilterConfig[5].options = this.userList;
      });
    }
  }

  multiSelectOnchangeEvent(value){
    if (value && value.controlName == 'workflowIds') {
      this.onFilterWorkflow(value.event).then(results => {
        this.customFilterConfig.forEach((element: any) => {
          if(element.name == "stageIds"){
            element.options = this.stagesForFilter;
            element.ngModel = '';
          }
        });
      });
    }
  }

  getHeaderFilters() {
    // other filter master data
    const requestArray = [];

    const requestrecordTypeList = this.getEntityRecordTypes();
    const requestAssignedTo = this.getAssigedToUsers(null, 1, '');
    const requestVerifiedBy = this.getVerifiedBy(null, 1, '');
    const rationList = this._commonHelper.setRatingOptions();

    requestArray.push(requestrecordTypeList);
    requestArray.push(requestAssignedTo);
    requestArray.push(requestVerifiedBy);
    requestArray.push(rationList);

    this._commonHelper.showLoader();
    forkJoin(requestArray).subscribe((results: any[]) => {
      if (results) {

        //Record type
        if (results[0]) {
          let isRecordTypesFilterVisible = false;
          let entityRecordType = null;
          entityRecordType = results[0] as [];

          //Show/Hide Record Type Filter.
          let hideRecordTypeFilter = entityRecordType.filter(x => x.value != 0);
          if (hideRecordTypeFilter && hideRecordTypeFilter.length > 0) {
            isRecordTypesFilterVisible = false;
          } else {
            isRecordTypesFilterVisible = true;
          }

          //set selected record type in dropdown
          let selectedRecordTypeIds: any[] = [];

          if (entityRecordType?.length > 0) {
            var selectedIdSString = this.worktaskSearchFilter.recordTypeIds;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString?.split(',');

              if (selectedIds?.length > 0) {
                let increseFilterCount = true;
                selectedIds.forEach((element: any) => {
                  const obj = entityRecordType.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    {
                      selectedRecordTypeIds.push(obj.value);
                      if(increseFilterCount){
                        this.filterCount++;
                      }
                      increseFilterCount = false;
                    }
                });
              }
            }
          }

          let recordTypeFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_LABEL_RECORDTYPE'),
            name: 'recordTypeIds',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.FILTER_PLACEHOLDER_RECORDTYPE'),
            ngModel: this.selectedRecordTypes == null ? '' : selectedRecordTypeIds,
            optionLabel: 'label',
            optionValue: 'value',
            options: entityRecordType,
            isHidden: isRecordTypesFilterVisible,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-md',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(recordTypeFilter);
        }

        //Work flow
        if (this.workflows && this.entityHasWorkflow) {
          let entityworkflowlist = this.workflows;

          //set selected Work flow in dropdown
          let selectedWorkflows: any[] = [];

          if (entityworkflowlist?.length > 0) {
            var selectedIdSString = this.worktaskSearchFilter.workflowIds;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString?.split(',');

              if (selectedIds?.length > 0) {
                let increseFilterCount = true;
                selectedIds.forEach((element: any) => {
                  const obj = entityworkflowlist.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    {
                      selectedWorkflows.push(obj.value);
                      if(increseFilterCount){
                        this.filterCount++;
                      }
                      increseFilterCount = false;
                    }
                });
              }
            }
          }

          let workflowFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_LABEL_WORKFLOW'),
            name: 'workflowIds',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_PLACEHOLDER_WORKFLOW'),
            ngModel: selectedWorkflows == null ? '' : selectedWorkflows,
            isOnChangeEvent: true,
            optionLabel: 'label',
            optionValue: 'value',
            options: entityworkflowlist,
            isHidden: !this.entityHasWorkflow,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-md',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(workflowFilter);
        }

        //Stage
        if (this.stagesForFilter && this.entityHasWorkflow) {
          let stagesForFilterlist = this.stagesForFilter;

          if (stagesForFilterlist?.length > 0) {
            var selectedIdSString = this.worktaskSearchFilter.stageIds;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString?.split(',');
              if (selectedIds?.length > 0) {
                this.filterCount++;
              }
            }
          }

          let stageFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_LABEL_STAGES'),
            name: 'stageIds',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_PLACEHOLDER_STAGE'),
            ngModel: this.selectedstages == null ? '' : this.selectedstages,
            optionLabel: 'label',
            optionValue: 'value',
            options: stagesForFilterlist,
            isHidden: !this.entityHasWorkflow,
            group: true,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-md',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(stageFilter);
        }

        //Type
        if (this.entitySubTypeDropdownValues) {
          let entityTypelist = this.entitySubTypeDropdownValues;

          //set selected type in dropdown
          let selectedTypes: any[] = [];
          let defaultValue: any[] = [];

          if (entityTypelist?.length > 0) {
            let defaultObject = entityTypelist.find(x => x.parentID == null);
            if (defaultObject != null && defaultObject != undefined) {
              defaultValue.push(defaultObject.id);
            }

            var selectedIdSString = this.worktaskSearchFilter.typeIds;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString?.split(',');
              if (selectedIds?.length > 0) {
                let increseFilterCount = true;
                selectedIds.forEach((element: any) => {
                  const obj = entityTypelist.find(x => x.id === parseInt(element))
                  if (obj != null && obj != undefined)
                    {
                      selectedTypes.push(obj.id);
                      if(increseFilterCount){
                        this.filterCount++;
                      }
                      increseFilterCount = false;
                    }
                });
              }
            }
          }

          let entitytypeFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_LABEL_TYPE'),
            name: 'typeIds',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_PLACEHOLDER_TYPE'),
            ngModel: selectedTypes.length == 0 ? defaultValue : selectedTypes,
            ngModelDefaultValue: defaultValue,
            optionLabel: 'name',
            optionValue: 'id',
            options: entityTypelist,
            isHidden: false,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-md',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(entitytypeFilter);
        }

        //Assigned To
        let isEntityHiddenFieldSettingsAssignedTo = this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.AllListFilter, this.fieldNames.AssignedTo);
        if (results[1] && this.entityHasWorkflow && !isEntityHiddenFieldSettingsAssignedTo) {
          let assignToUserList = null;
          assignToUserList = results[1] as [];

          //set selected type in dropdown
          let selectedassignToUser: any[] = [];

          if (assignToUserList?.length > 0) {
            var selectedIdSString = this.worktaskSearchFilter.assignToUserIds;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString?.split(',');

              if (selectedIds?.length > 0) {
                let increseFilterCount = true;
                selectedIds.forEach((element: any) => {
                  const obj = assignToUserList.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    {
                      selectedassignToUser.push(obj.value);
                      if(increseFilterCount){
                        this.filterCount++;
                      }
                      increseFilterCount = false;
                    }
                });
              }
            }
          }

          let assignToUserFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_LABEL_ASSIGNTO'),
            name: 'assignToUserIds',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_PLACEHOLDER_ASSIGNTO'),
            ngModel: selectedassignToUser == null ? '' : selectedassignToUser,
            optionLabel: 'label',
            optionValue: 'value',
            options: assignToUserList,
            isHidden: false,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-md',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(assignToUserFilter);
        }

        //Verified By
        let isEntityHiddenFieldSettingsVerifiedBy = this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.AllListFilter, this.fieldNames.VerifiedBy);
        if (results[2] && this.entityHasWorkflow && !isEntityHiddenFieldSettingsVerifiedBy) {
          let verifiedByUserList = null;
          verifiedByUserList = results[2] as [];

          //set selected type in dropdown
          let selectedverifiedByUser: any[] = [];

          if (verifiedByUserList?.length > 0) {
            var selectedIdSString = this.worktaskSearchFilter.verifiedByIds;
            if (selectedIdSString != "") {
              var selectedIds = selectedIdSString?.split(',');

              if (selectedIds?.length > 0) {
                let increseFilterCount = true;
                selectedIds.forEach((element: any) => {
                  const obj = verifiedByUserList.find(x => x.value === parseInt(element))
                  if (obj != null && obj != undefined)
                    {
                      selectedverifiedByUser.push(obj.value);
                      if(increseFilterCount){
                        this.filterCount++;
                      }
                      increseFilterCount = false;
                    }
                });
              }
            }
          }

          let verifiedByUserFilter = {
            inputType: 'MultiSelect',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_LABEL_VERIFIEDBY'),
            name: 'verifiedByIds',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_PLACEHOLDER_VERIFIEDBY'),
            ngModel: selectedverifiedByUser == null ? '' : selectedverifiedByUser,
            optionLabel: 'label',
            optionValue: 'value',
            options: verifiedByUserList,
            isHidden: false,
            defaultClass: 'basic-filter',
            panelStyleClass: 'maxWidthOverride-md',
            isCountableFilter: 1
          }
          // add to filter
          this.customFilterConfig.push(verifiedByUserFilter);
        }

        //Rating
        if (results[3]) {
          let ratingOptions = results[3] as any[];
          let selectedRatingIds: any = this.pagingParams.rating;
          if (selectedRatingIds == null || selectedRatingIds == '') {
            selectedRatingIds = null;
          } else {
            this.filterCount++;
          }

          let ratingFilter = {
            inputType: 'Dropdown',
            label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_LABEL_RATING'),
            name: 'rating',
            placeHolder: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_PLACEHOLDER_RATING'),
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
          this.worktaskSearchFilter.rating = selectedRatingIds == null ? null : selectedRatingIds;
        }

        //showMyTasks
        let isshowMyTasks = this.worktaskSearchFilter.showMyTasks;
        let showMyTasksFilter =
        {
          inputType: 'Checkbox',
          label: this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_MY_TASKS')),
          name: 'showMyTasks',
          ngModel: isshowMyTasks,
          ngModelDefaultValue: false,
          isHidden: false,
          isCountableFilter: 1
        }
        this.customFilterConfig.push(showMyTasksFilter);
        if (showMyTasksFilter.ngModel == true) {
          this.filterCount++;
        }

        //for showStarred
        let isshowStarred = this.worktaskSearchFilter.showStarred;
        let showStarredFilter =
        {
          inputType: 'Checkbox',
          label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_STARRED'),
          name: 'showStarred',
          ngModel: isshowStarred,
          ngModelDefaultValue: false,
          isHidden: false,
          isCountableFilter: 1
        }
        this.customFilterConfig.push(showStarredFilter);
        if (showStarredFilter.ngModel == true) {
          this.filterCount++;
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

}
