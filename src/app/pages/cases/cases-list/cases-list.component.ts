//ANGULAR
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { CasePagingParams } from '../../../@core/sharedModels/paging-params.model';
import { DataSources, DownloadFileMimeType, Entity, ExportType, FieldNames, FileExtension, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, RefType, ReferenceType, SectionCodes, UserTypeID } from '../../../@core/enum';
//SERVICES
import { CasesService } from '../cases.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { SettingsService } from '../../settings/settings.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
//COMPONENTS
import { CaseAddComponent } from '../case-add/case-add.component';
import { UserAssignDialogComponent } from '../../../@core/sharedComponents/user-assign/user-assign-dialog/user-assign-dialog.component';
import { WorkflowAssignDialogComponent } from '../../../@core/sharedComponents/workflow-assign-dialog/workflow-assign-dialog/workflow-assign-dialog.component';
import { CaseImportDialogComponent } from '../case-import-dialog/case-import-dialog.component';
import { PriorityDialogComponent } from '../../../@core/sharedComponents/priority-dialog/priority-dialog.component';
import { SeverityDialogComponent } from '../../../@core/sharedComponents/severity-dialog/severity-dialog.component';
//PRIMNG
import { Table } from 'primeng/table';
import { Paginator } from 'primeng/paginator';
import { MultiSelect } from 'primeng/multiselect';
//OTHER
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, filter, fromEvent, map } from 'rxjs';
import * as moment from 'moment';
import { WorktaskAddComponent } from '../../worktasks/worktask-add/worktask-add.component';
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';


@Component({
  selector: 'ngx-cases-list',
  templateUrl: './cases-list.component.html',
  styleUrls: ['./cases-list.component.scss']
})
export class CasesListComponent implements OnInit {

  /*
  @ Angular Decorators 
  */
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;
 
  // case list
  cases: any[] = [];
  caseAssignedTo: any;
  entityTypeId: number = Entity.Cases;
  EntityTitle: any;
 
  //user detail
  loggedInUser: any;
  localStorageKeyPrefix: string = '';

  //right side activity menu
  isShowActivityCenter: boolean = false;
  refreshActivityCenter: boolean = false;
  selectedCaseForActivityCenter: any;
  selectedCaseIdForActivityCenter: number = 0;
  selectedCaseIsPausedForActivityCenter: boolean = false;
  selectedCaseIsClosedForActivityCenter: boolean = false;
  selectedCaseIsCompletedForActivityCenter: boolean = false;
  selectedRowId: number = 0;
  selectedCardExists: boolean = false;
  entityDetails: any;
  entityWorkflowId: number = 0;
  isAdvanceFilterVisible: boolean = false;
  entityRecordTypeId: number;
  hideRecordTypeFilter = null;

  // pagination
  pagingParams: CasePagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;
  startDate: Date;
  endDate: Date;

  // search filter
  lastCaseSearchFilter: any;
  casesSearchFilter = {
    searchText: '',
    recordTypeIds: null,
    workflowIds: null,
    stageIds: null,
    assignToIDs: null,
    verifiedByIDs: null,
    showMyCases: false,
    rating: null,
    showStarred: false
  };

  
  //filter
  workflows: any = null;
  entityRecordTypes: any = [];

  selectedWorkflows: any = null;
  stages: any = null;
  stagesForFilter: any = null;
  selectedstages: any = null;
  userList: any = [];
  verifiedByList: any = [];
  selectedUser = null;
  verifiedByUser = null;
  recordTypes = null;
  recordTypesDetail = null;
  selectedRecordTypes: any = null;
  showMyCases: boolean = false;
  priorityDetails: any = null;
  severityDetails: any = null;
  ratingOptions: any[] = [];
  quickViewConfig: any;
  isShowEntityTypeNameIcon: boolean = true;
  showStarred:boolean = false;

  // permission variable
  isListCase: boolean = false;
  isViewCase: boolean = false;
  isAddCase: boolean = false;
  isEditCase: boolean = false;
  isDeleteCase: boolean = false;
  isAssignWorkflow: boolean = false;
  isWorkflowPermission: boolean = true;
  isImportCases: boolean = false;
  isExportCases: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAddWorkTask: boolean = false;
  isAssignCase: boolean = false;
  isAllowToReopen: boolean = false;

  caseCreatedBy: number;
  casePrivacyLevel: number;

  // table Column
  cols: any[];
  isShowActionColumn: boolean = false;

  private modalRef: NgbModalRef | null;
  private optionsForPopupDialog: any = {
    size: 'md',
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  unassignedCaseCount: number;
  isAllCheckBoxSelected: boolean;

  rowActionButtonMouseHoverFlag: boolean = false;
  entityStagesWithTasksStorageKey : string = LocalStorageKey.CaseEntityStageWithTasksKey;
  casesListByStages: any[] = [];
  currentStage: any;
  selectedStage: any;

  keyfieldResponseData: any;
  currencySymbol: any = null;
  hoursInDay:number = null;
  
  //Add WorkTask
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  refreshWorkTaskTab;

  //hidden fields region
  entityHiddenFieldSettings: any;
  sectionCodeName = SectionCodes;
  fieldNames = FieldNames;
  isAssignedToFieldKanbanListColumn: boolean;
  isVerifiedByFieldKanbanListColumn: boolean;

  entitySubTypes: any = [];
  workTaskSubTypeDetails: any;

  //Export Case
  dynamicColumnNameSetting: any = {};
  CaseNumberColumnName: string;

  userTypeID = UserTypeID;
  
  entityHasWorkflow:boolean;
  isStageClosedOrCompleted: number;

  constructor(private _router: Router,
    public _commonHelper: CommonHelper,
    private _casesService: CasesService,
    private _dataSourceService: DatasourceService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _commonService: CommonService,
    private _settingsService: SettingsService) {
    
    this.EntityTitle = this._commonHelper.getEntityTitleFromMenuItemByUrl(decodeURI(this._router.url));
    this.setPermissions();
    this.initializePagination();
    this.setRatingOptions();
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
      this.getVerifiedBy(null, 1, ''),
      this.getWorktaskWorkflowList(),
      this.getPriorityFromReferenceType(),
      this.getSeverityFromReferenceType(),
      this.getEntityHiddenField(),
      this.getEntitySubTypes()
    ]).then(() => {
      this.checkEntityHasAnyActiveWorkflow();
      this.setLastSearchFilterFromStorage();
      this.getCasesList(this.pagingParams);
      this.subscribeSearchboxEvent();
      this.workTaskSubTypeDetails = this.entitySubTypes?.find(x => x.level == 1);
      this.CaseNumberColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.LISTING.EXPORT_CASE_NUMBER_LABEL'));

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
        }
        this.isShowEntityTypeNameIcon = false;
      }
      this.dynamicColumnNameSetting = {};
      this.dynamicColumnNameSetting["CaseNumber"] = this.CaseNumberColumnName;
      this.dynamicColumnNameSetting["EntityName"] = tabInfo.header;

    });

    //hide assignedTo field Column;
    if(this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.AllListColumn, FieldNames.AssignedTo)) {
      this.isAssignedToFieldKanbanListColumn = true;
    }else {
      this.isAssignedToFieldKanbanListColumn = false;
    }

    //hide verifiedBy field Column;
    if(this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.entityTypeId, SectionCodes.AllListColumn, FieldNames.AssignedTo)) {
      this.isVerifiedByFieldKanbanListColumn = true;
    }else {
      this.isVerifiedByFieldKanbanListColumn = false;
    }

    this.setColumnDefinations();

    // get set quickview local storage config start
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedCaseIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
    }
    // get set quickview local storage config end

  }

  setRatingOptions(){
    this._commonHelper.setRatingOptions().then((response) => { this.ratingOptions = response as []; });
  }

  onFilterRating(event) {
    this.casesSearchFilter.rating = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesListing, JSON.stringify(this.casesSearchFilter), this.localStorageKeyPrefix);
    this.getCasesList(this.pagingParams);
  }

  onFilterShowStarred() {
    this.casesSearchFilter.showStarred = this.showStarred;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesListing, JSON.stringify(this.casesSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getCasesList(this.pagingParams);
  }

  //Bulk Assign Workflow For case
  public assignWorkflow() {
    const selectedWorkList = this.cases.filter(x => x.isSelected);

    if (selectedWorkList.length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MEESAGE_SELECT_ONE_CASE'));
      return;
    }
    
    // filter workflows based on Parent Entity Type ID
    let filteredWorkflows = this.workflows.filter(x => x.value != 0);
    const distinctEntityType = [...new Set(selectedWorkList.map(item => item.entityTypeId))];
    const distinctEntity = [...new Set(selectedWorkList.map(item => item.entityWorkFlowID))];
    let isWorkflowAssign: boolean = distinctEntity?.[0] != null;

    if (distinctEntityType != null && distinctEntityType.length > 0 && distinctEntityType[0] > 0) {
      filteredWorkflows = filteredWorkflows.filter(x => (x.isDefault != null && x.isDefault == true) || x.parentEntityTypeID == distinctEntityType[0]);
    }

    if (filteredWorkflows?.length == 0) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }

    if (filteredWorkflows?.length <= 1 && isWorkflowAssign) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }
   
    //TO BE DELETED PN - 15-12-2023 - SDC-3362
    // const distinctEntityRecordType = [...new Set(selectedWorkList.map(item => item.entityRecordTypeId))];
    // if (distinctEntityRecordType.length > 1) {
    //   this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
    //   return;
    // }

    if (distinctEntityType.length > 1) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
      return;
    }

    if (distinctEntity.length > 1) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MEESAGE_SELECT_ONETYPE_OF_WORKFLOW'));
      return;
    }

    if (selectedWorkList.filter(x => x.isPaused == true).length > 0) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_CANNOT_BULKASSIGN_WORKFLOW_PAUSED'));
      return;
    }

    let eligibilityParams: any[] = [];
    selectedWorkList.forEach(x => {
      let param = {
        entityTypeId: Entity.Cases,
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
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CASES.LISTING.WORK_ASSIGN_DIALOG.DIALOG_TITLE');
        this.modalRef.componentInstance.workflowSelectLabel = this._commonHelper.getInstanceTranlationData('CASES.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_SELECT_LABEL');
        this.modalRef.componentInstance.workflowSelectPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_STAGE_SELECT_PLACEHOLDER');

        this.modalRef.componentInstance.OnSubmitAssignWorkflow.subscribe((selectedWorkflowId) => {
          //option for confirm dialog settings
          let optionsForConfirmDialog = {
            size: "md",
            centered: false,
            backdrop: 'static',
            keyboard: false
          };
          this._confirmationDialogService.confirm('CASES.LISTING.MESSAGE_CONFIRM_ASSIGN_CASE', null, null, optionsForConfirmDialog, true).then((confirmed) => {
            if (confirmed) {
              let DeleteRelatedDataParams: any[] = [];
              selectedWorkList.filter(x => x.entityWorkFlowID != selectedWorkflowId).forEach(x => {
                let param = {
                  entityTypeId: Entity.Cases,
                  entityId: x.id
                }
                DeleteRelatedDataParams.push(param);
              });

              this._commonHelper.showLoader();
              this._workflowmanagementService.BulkDeleteRelatedDataToChangeWorkflow(DeleteRelatedDataParams).then((response: any) => {
                this._commonHelper.hideLoader();
                let arrCases: any[] = [];
                let arrCasesIds: any[] = [];
                selectedWorkList.filter(x => x.entityWorkFlowID != selectedWorkflowId).forEach(x => {
                  let params = {
                    EntityWorkflowId: selectedWorkflowId,
                    EntityType: Entity.Cases,
                    Id: x.id,
                    AssignedTo: x.assignedTo,
                    EntityWorkflowRecordKey: null,
                    SelectedStageTaskIds: null,
                    IsAdd: true
                  };

                  arrCases.push(params);
                  arrCasesIds.push(x.id);
                });

                this._commonHelper.showLoader();
                this._workflowmanagementService.assignBulkWorkFlowForTask(arrCases).then(res => {
                  this._casesService.changeEntityRecordType(arrCasesIds.toString(), this.workflows.filter(x => x.value == selectedWorkflowId)[0].entityRecordTypeID).then(res => {
                    this._casesService.changeCaseEntityType(arrCasesIds.toString(), selectedWorkflowId).then(() => {
                      this._casesService.updateDefaultEstimatedTimeAndPoint(arrCasesIds.toString(), selectedWorkflowId).then(() => {
                        this.fetchCase();
                        this._commonHelper.hideLoader();
                        // success message
                        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_WORKFLOW_ASSIGN_SUCCESS'));
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
        //one of the case is not eligible to assign workflow
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_WORKFLOW_BULKASSIGN_NOTELIGIBLE'));
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  public onVerifiedByClick(cases = null) {
    this.isWorkflowPermission = this._commonHelper.havePermission(cases.entityWorkFlowPermissionHash);
    
    if (!this.isAssignCase || !this.isWorkflowPermission) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.VERIFIED_BY_DIALOG.MESSAGE_NOT_HAVE_PERMISIION_ASSIGN_VERIFIED_BY'));
      return;
    }

    if (cases != null && cases.entityWorkFlowID == null) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.VERIFIED_BY_DIALOG.MESSAGE_CANNOT_ASSIGN_VERIFIED_BY'));
      return;
    }
    
    if (cases != null && cases.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.VERIFIED_BY_DIALOG.MESSAGE_CANNOT_ASSIGN_VERIFIED_BY_PAUSED'));
      return;
    }

    if (cases != null && (cases.isClosedStage || cases.isCompletedStage)) {
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.VERIFIED_BY_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_CASES', { stageName: cases.stageName }));
        return;
    }

    this._commonHelper.showLoader();
    // get data from event
    const assignedToId = cases.assignedTo;
    const verifiedById = cases.verifiedBy;
    const caseId = cases.id;
    const caseStageId = cases.stageID;
    const workFlowId = cases.entityWorkFlowID;

    // prepare params
    const params = this.prepareParamsForVerifiedByUser(workFlowId, caseStageId, verifiedById, 1, '');
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CASES.LISTING.VERIFIED_BY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('CASES.LISTING.VERIFIED_BY_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LISTING.VERIFIED_BY_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        const obj = {
          entityid: caseId,
          verifiedById: selectedUserId,
          entityWorkflowId: workFlowId
        };

        this._commonHelper.showLoader();
        this._casesService.updateCaseVerifiedBy(obj).then((response: any) => {
          if (response) {
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: Entity.Cases, entityId: caseId, entityWorkflowId: workFlowId, stageId: caseStageId, assignedTo: assignedToId, verifiedBy: selectedUserId }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_CASE_VERIFIED_BY'));
              }
              this._commonHelper.hideLoader();
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              }
            );
          }

          this.getCasesList(this.pagingParams);
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


  public caseDetail(id: number): void {
    this._router.navigate(['detail/' + id]);
  }

  public onResetAllFilters() {
    this.casesSearchFilter.searchText = '';
    this.casesSearchFilter.recordTypeIds = null;
    this.casesSearchFilter.workflowIds = null;
    this.casesSearchFilter.stageIds = null;
    this.casesSearchFilter.assignToIDs = null;
    this.casesSearchFilter.verifiedByIDs = null;
    this.casesSearchFilter.showMyCases = false;
    this.casesSearchFilter.rating = null;
    this.casesSearchFilter.showStarred = false;

    this.selectedRecordTypes = null;
    this.selectedWorkflows = null;
    this.selectedstages = null;
    this.stagesForFilter = this.stages;
    this.selectedUser = null;
    this.verifiedByUser = null;
    this.showMyCases = false;
    this.showStarred = false;

    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'created';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.entityRecordTypeIds = null;
    this.pagingParams.entityWorkflowIDs = null;
    this.pagingParams.entityWorkflowStageIDs = null;
    this.pagingParams.assignToIDs = null;
    this.pagingParams.verifiedByIDs = null;
    this.pagingParams.showMyCases = false;
    this.pagingParams.rating = null;
    this.pagingParams.showStarred = false;
    
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesListing, JSON.stringify(this.casesSearchFilter), this.localStorageKeyPrefix);
    this.getCasesList(this.pagingParams);
  }

  public isAllSelected() {
    const selectedWorkListCount = this.cases.filter(x => x.isSelected).length;

    if (this.cases.length == selectedWorkListCount) {
      this.isAllCheckBoxSelected = true;
    } else {
      this.isAllCheckBoxSelected = false;
    }
  }

  public checkUncheckAll() {
    this.cases.forEach(cases => {
      cases.isSelected = this.isAllCheckBoxSelected;
    });
  }

 openCaseImport() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CaseImportDialogComponent, this.optionsForPopupDialog);
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.fetchCase();
      }
    });
  }

 // open add popup
  public addCase() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CaseAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityWorkflowId = null;
    this.modalRef.componentInstance.relatedEntityTypeId = null;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = null;
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.entityRecordTypes = this.recordTypesDetail;
    this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.AddPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Cases;
    this.modalRef.componentInstance.isShowAddButton = true;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.fetchCase();
      }
    });
  }

  //delete case
  public deleteCase(caseId) {

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

        this._confirmationDialogService.confirm('CASES.LISTING.MESSAGE_CONFIRM_CASE_DELETE', null, null, optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._casesService.deleteCase(caseId).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_CASE_DELETE')
                );
                this.totalRecords = this.totalRecords - 1;
                this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.pagingParams.pageSize) : 1;
                // get case
                this.fetchCase();
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                  // get case
                  this.fetchCase();
                });
            }
          })
          .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.LISTING.CASE_DISMISS_DIALOG')));
      }
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  public onFilterAssignTo(event) {
    this.casesSearchFilter.assignToIDs = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesListing, JSON.stringify(this.casesSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getCasesList(this.pagingParams);
  }

  public onFilterVerifiedBy(event) {
    this.casesSearchFilter.verifiedByIDs = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesListing, JSON.stringify(this.casesSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getCasesList(this.pagingParams);
  }

  public verifiedByOnFilter(e?: any, selectedUser?: any) {
    this.getVerifiedBy(selectedUser?.toString(), 0, e.filter);
  }

  public assignedToOnFilter(e?: any, selectedUser?: any) {
    this.getAssigedToUsers(selectedUser?.toString(), 0, e.filter);
  }

  public onFilterShowMyCase() {
    this.casesSearchFilter.showMyCases = this.showMyCases;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesListing, JSON.stringify(this.casesSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getCasesList(this.pagingParams);
  }
  
  // assigned to user what to do
  public onAssignedToClick(cases = null) {
    this.isWorkflowPermission = this._commonHelper.havePermission(cases.entityWorkFlowPermissionHash);
    
    if (!this.isAssignCase || !this.isWorkflowPermission) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_NOT_HAVE_PERMISSION_ASSIGN_USER'));
      return;
    }

    if (cases != null && cases.entityWorkFlowID == null) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_CANNOT_ASSIGN_USER'));
      return;
    }
    
    if (cases != null && cases.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_CANNOT_ASSIGN_USER_PAUSED')));
      return;
    }

    if (cases != null && (cases.isClosedStage || cases.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.ASSIGNED_TO_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_CASES', { stageName: cases.stageName }));
      return;
    }

    this._commonHelper.showLoader();
    // get data from event
    let assignedToId = cases.assignedTo; //owner 1 is assigned to
    let caseId = cases.id;
    let caseStageId = cases.stageID;
    let workFlowId = cases.entityWorkFlowID;
    
    // prepare params
    let params = this.prepareParamsForAssignedToUsers(workFlowId, caseStageId, assignedToId);
    // call datasource service with params
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CASEASSIGNEDTO, params).then((response: any) => {
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
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CASES.LISTING.ASSIGNED_TO_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.userSelectLabel = this._commonHelper.getInstanceTranlationData('CASES.LISTING.ASSIGNED_TO_DIALOG.USER_SELECT_LABEL');
      this.modalRef.componentInstance.userSelectPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LISTING.ASSIGNED_TO_DIALOG.USER_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitAssignUser.subscribe((selectedUserId) => {
        // prepare object to send to backend to save
        let obj = {
          entityid: caseId,
          assignedToId: selectedUserId,
          entityWorkflowId: workFlowId,
          stageId: caseStageId
        };

        this._commonHelper.showLoader();
        this._casesService.updateCaseAssignedTo(obj).then((response: any) => {
          if (response) {
            this.caseAssignedTo = response;
            this._commonHelper.showLoader();
            this._workflowmanagementService.saveEntityStageTransition({ entityTypeId: Entity.Cases, entityId: caseId, entityWorkflowId: workFlowId, stageId: caseStageId, assignedTo: selectedUserId, verifiedBy: cases.verifiedBy }).then(response => {
              if (response) {
                this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_CASE_ASSIGNEDTO'));
              }
              this._commonHelper.hideLoader();
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              }
            );
          }
          this.getCasesList(this.pagingParams);
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

  public onFilterRecordType(event) {
    this.casesSearchFilter.recordTypeIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesListing, JSON.stringify(this.casesSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getCasesList(this.pagingParams);
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

    this.casesSearchFilter.workflowIds = event.value.toString();

    this.casesSearchFilter.stageIds = null;
    this.pagingParams.entityWorkflowStageIDs = null;
    this.pagingParams.pageNo = 1;
    this.selectedstages = null;

    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesListing, JSON.stringify(this.casesSearchFilter), this.localStorageKeyPrefix);
    this.getCasesList(this.pagingParams);
  }

  public onFilterStage(event) {
    this.casesSearchFilter.stageIds = event.value.toString();
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesListing, JSON.stringify(this.casesSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
  this.getCasesList(this.pagingParams);
  }

  public trimFilterValue(e: any, multiSelect: MultiSelect) {
    multiSelect.filterValue = String(e.filter).trim();
    multiSelect.filterInputChild.nativeElement.value = String(e.filter).trimStart();
  }

  public onAssignWorkflow(cases) {
    if (!this.isEditCase || !this.isAssignWorkflow) {
      return;
    }

    if (cases != null && cases.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.WORK_ASSIGN_DIALOG.MESSAGE_CANNOT_ASSIGN_WORKFLOW_PAUSED'));
      return;
    }

    // filter workflows based on Parent Entity Type ID
    let filteredWorkflows = this.workflows.filter(x => x.value != 0);
    let isWorkflowAssign: boolean = cases?.entityWorkFlowID != null;
    if (cases?.entityTypeId != null && cases?.entityTypeId > 0) {
      filteredWorkflows = filteredWorkflows.filter(x => (x.isDefault != null && x.isDefault == true) || x.parentEntityTypeID == cases?.entityTypeId);
    }

    if (filteredWorkflows?.length == 0) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }

    if (filteredWorkflows?.length <= 1 && isWorkflowAssign) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_NO_WORKFLOW_AVAILABLE'));
      return;
    }

    this._commonHelper.showLoader();
    this._workflowmanagementService.IsEntityEligibleToChangeWorkflow(Entity.Cases, cases.id, cases.entityWorkFlowID == null).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response) {
        //TO BE DELETED PN - 15-12-2023 - SDC-3362
        // else if (cases?.entityRecordTypeId != null && cases?.entityRecordTypeId > 0) {
        //   if (filteredWorkflows.some(x => x.entityRecordTypeId == cases?.entityRecordTypeId)) {
        //     let parentEntityTypeId = filteredWorkflows.filter(x => x.entityRecordTypeId == cases?.entityRecordTypeId)[0]?.parentEntityTypeID;
        //     filteredWorkflows = filteredWorkflows.filter(x => (x.parentEntityTypeID == null && x.entityRecordTypeId == null) || x.parentEntityTypeID == parentEntityTypeId);
        //   }
        // }

        this.optionsForPopupDialog.size = "md";
        this.modalRef = this._modalService.open(WorkflowAssignDialogComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.workflows = filteredWorkflows;
        this.modalRef.componentInstance.workflowId = cases.entityWorkFlowID;
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CASES.LISTING.WORK_ASSIGN_DIALOG.DIALOG_TITLE');
        this.modalRef.componentInstance.workflowSelectLabel = this._commonHelper.getInstanceTranlationData('CASES.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_SELECT_LABEL');
        this.modalRef.componentInstance.workflowSelectPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LISTING.WORK_ASSIGN_DIALOG.WORKFLOW_STAGE_SELECT_PLACEHOLDER');

        this.modalRef.componentInstance.OnSubmitAssignWorkflow.subscribe((selectedWorkflowId) => {
          if (selectedWorkflowId != cases.entityWorkFlowID) {
            //option for confirm dialog settings
            let optionsForConfirmDialog = {
              size: "md",
              centered: false,
              backdrop: 'static',
              keyboard: false
            };
            this._confirmationDialogService.confirm('CASES.LISTING.MESSAGE_CONFIRM_ASSIGN_CASE', null, null, optionsForConfirmDialog, true).then((confirmed) => {
              if (confirmed) {
                this._commonHelper.showLoader();
                this._workflowmanagementService.DeleteRelatedDataToChangeWorkflow(Entity.Cases, cases.id).then((response: any) => {
                  this._commonHelper.hideLoader();
                  //prepare object to send to backend to save
                  let params = {
                    EntityWorkflowId: selectedWorkflowId,
                    EntityType: Entity.Cases,
                    Id: cases.id,
                    AssignedTo: cases.assignedTo,
                    EntityWorkflowRecordKey: null,
                    SelectedStageTaskIds: null,
                    IsAdd: true
                  };

                  this._commonHelper.showLoader();
                  this._workflowmanagementService.postSaveEntityProcess(params).then(() => {
                    this._casesService.changeEntityRecordType(cases.id, this.workflows.filter(x => x.value == selectedWorkflowId)[0].entityRecordTypeID).then(() => {
                      this._casesService.changeCaseEntityType(cases.id, selectedWorkflowId).then(() => {
                        this._casesService.updateDefaultEstimatedTimeAndPoint(cases.id, selectedWorkflowId).then(() => {
                          this.fetchCase();
                          this._commonHelper.hideLoader();
                          // success message
                          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_WORKFLOW_ASSIGN_SUCCESS'));
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
        //case is not eligible to assign workflow
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_WORKFLOW_ASSIGN_NOTELIGIBLE'));
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  public onPriorityClick(caseItem = null) {
    if (!this.isEditCase) {
      return;
    }

    if (caseItem != null && caseItem.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.PRIORITY_DIALOG.MESSAGE_CANNOT_CHANGE_PRIORITY_PAUSED'));
      return;
    }

    if (caseItem != null && (caseItem.isClosedStage || caseItem.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.PRIORITY_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: caseItem?.stageName }));
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
      this.modalRef.componentInstance.priorityId = caseItem?.priority;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CASES.LISTING.PRIORITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.prioritySelectLabel = this._commonHelper.getInstanceTranlationData('CASES.LISTING.PRIORITY_DIALOG.PRIORITY_SELECT_LABEL');
      this.modalRef.componentInstance.prioritySelectPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LISTING.PRIORITY_DIALOG.PRIORITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangePriority.subscribe((selectedPriorityId) => {
        // prepare object to send to backend to save
        let obj = {
          entityId: caseItem?.id,
          priority: selectedPriorityId,
          EntityWorkflowId: caseItem?.entityWorkFlowID
        };
       
        this._commonHelper.showLoader();
        this._casesService.updateCasePriority(obj).then(response => {
          if (response) {
            this.getCasesList(this.pagingParams);
            // success message
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_SUCCESS_PRIORITY')
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

  onSeverityClick(caseItem = null) {
    if (!this.isEditCase) {
      return;
    }
    
    if (caseItem != null && caseItem.isPaused) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.SEVERITY_DIALOG.MESSAGE_CANNOT_CHANGE_SEVERITY_PAUSED'));
      return;
    }

    if (caseItem != null && (caseItem.isClosedStage || caseItem.isCompletedStage)) {
      this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('CASES.LISTING.SEVERITY_DIALOG.MESSAGE_CONNOT_CHANGE_DETAILS_DONE_CLOSE_TASKS', { stageName: caseItem?.stageName }));
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
      this.modalRef.componentInstance.severityId = caseItem?.severity;
      this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('CASES.LISTING.SEVERITY_DIALOG.DIALOG_TITLE');
      this.modalRef.componentInstance.severitySelectLabel = this._commonHelper.getInstanceTranlationData('CASES.LISTING.SEVERITY_DIALOG.SEVERITY_SELECT_LABEL');
      this.modalRef.componentInstance.severitySelectPlaceholder = this._commonHelper.getInstanceTranlationData('CASES.LISTING.SEVERITY_DIALOG.SEVERITY_STAGE_SELECT_PLACEHOLDER');

      this.modalRef.componentInstance.OnSubmitChangeSeverity.subscribe((selectedSeverityId) => {
         // prepare object to send to backend to save
         let obj = {
          entityId: caseItem?.id,
          severity: selectedSeverityId,
          entityWorkflowId: caseItem?.entityWorkFlowID
        };

        this._commonHelper.showLoader();
        this._casesService.updateCaseSeverity(obj).then(response => {
          if (response) {
            this.getCasesList(this.pagingParams);
            // success message
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_SUCCESS_SEVERITY')
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

  public paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchCase();
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
      this.fetchCase();
    }
  }

  public changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchCase();
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
    this.fetchCase();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  public prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchCase();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  public next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchCase();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  //#region private methods
  private setPermissions(): void {
    this.isListCase = this._commonHelper.havePermission(enumPermissions.ListCases);
    this.isViewCase = this._commonHelper.havePermission(enumPermissions.ViewCase);
    this.isAddCase = this._commonHelper.havePermission(enumPermissions.AddCase);
    this.isEditCase = this._commonHelper.havePermission(enumPermissions.EditCase);
    this.isDeleteCase = this._commonHelper.havePermission(enumPermissions.DeleteCase);
    this.isAssignWorkflow = this._commonHelper.havePermission(enumPermissions.AssignWorkflow);
    this.isImportCases = this._commonHelper.havePermission(enumPermissions.ImportCases);
    this.isExportCases = this._commonHelper.havePermission(enumPermissions.ExportCases);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadCaseDocument);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAssignCase = this._commonHelper.havePermission(enumPermissions.AssignCase);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);

    this.isShowActionColumn = this.isDeleteCase || this.isEditCase;
  }

  public setColumnDefinations() {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'caseNumber', header: 'CASES.LISTING.TABLE_HEADER_CASE_NUMBER', visible: true, sort: true, exportFieldName: 'caseNumber'},
      { field: 'name', header: 'CASES.LISTING.TABLE_HEADER_NAME', visible: true, sort: true, exportFieldName: 'name'},
      { field: 'entityName', header: 'CASES.LISTING.TABLE_HEADER_RELATED_TO', visible: true, sort: true, exportFieldName: 'entityName'},
      { field: 'entityWorkFlowName', header: 'CASES.LISTING.TABLE_HEADER_WORKFLOW_NAME', visible: true, sort: true, exportFieldName: 'entityWorkFlowName'},
      { field: 'stageName', header: 'CASES.LISTING.TABLE_HEADER_STAGE_NAME', visible: true, sort: true, exportFieldName: 'stageName'},
      { field: 'assignedToName', header: 'CASES.LISTING.TABLE_HEADER_ASSIGNEDTO', visible: !this.isAssignedToFieldKanbanListColumn, sort: true, exportFieldName: 'assignedToName'},
      { field: 'verifiedByName', header: 'CASES.LISTING.TABLE_HEADER_VERIFIED_BY', visible: !this.isVerifiedByFieldKanbanListColumn, sort: true, exportFieldName: 'verifiedByName'},
      { field: 'createdByName', header: 'CASES.LISTING.TABLE_HEADER_CREATED_BY', visible: true, sort: true, exportFieldName: 'createdByName'},
      { field: 'created', header: 'CASES.LISTING.TABLE_HEADER_CREATED', visible: true, sort: true, exportFieldName: 'created'},
      { field: 'id', header: '', visible: true, sort: false, class: "action ", display: 'td-display'}
    ];

    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.cols.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private initializePagination(): void {
    this.pagingParams = new CasePagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'created';
    this.pagingParams.sortOrder = 'DESC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private getAssigedToUsers(selectedUserId, includeAllUsers, searchString: any) {
    return new Promise((resolve, reject) => {
      // prepare params
      let params = this.prepareParamsForAssignedToUsersAllCase(selectedUserId, includeAllUsers, searchString);
      // call datasource service with params
      this._commonHelper.showLoader();
      return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALLCASEASSIGNEDTO, params).then((responce: any) => {
        if (responce) {
          this.userList = responce;
          this.userList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.LISTING.FILTER_OPTION_TEXT_ASSIGNEDTO')});
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

  private getVerifiedBy(selectedUserId, includeAllUsers, searchString: any) {
    return new Promise((resolve, reject) => {
      let params = this.prepareParamsForVerifiedByUserAllCase(selectedUserId, includeAllUsers, searchString);
      // call datasource service with params
      this._commonHelper.showLoader();
      return this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALLCASEVERIFIEDBY, params).then((responce: any) => {
        if (responce) {
          this.verifiedByList = responce;
          this.verifiedByList.push({value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.LISTING.FILTER_OPTION_TEXT_VERIFIEDBY')});
          this.verifiedByList.sort((a, b) => a.value - b.value);
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

  private prepareParamsForCaseStages() {
    const params = [];
    let paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.Cases
    };
    params.push(paramItem);
    return params;
  }

  private getEntityStageList() {
    return new Promise((resolve, reject) => {
      this.stages = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Case_WorkFlow_StageList));
      if (this.stages == null) {
        let params = this.prepareParamsForCaseStages();
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
                  groupWorkflows.items.push({ label: element.label, value: element.value , groupLabel : element.entityWorkflowName});
                }
              });
              groupedStages.push(groupWorkflows);
            });

            this.stages = groupedStages;
            this.stagesForFilter = this.stages;
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Case_WorkFlow_StageList, JSON.stringify(this.stages));
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

  private prepareParamsForAssignedToUsersAllCase(assignedTo, includeAllUsers=1, searchString=null) {
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

  private prepareParamsForAssignedToUsers(workFlowId, stageID, assignedTo, includeAllUsers = 1, searchString=null) {
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
    return [{ name: 'EntityTypeID', type: 'int', value: Entity.Cases }];
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
            this.workflows.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.LISTING.FILTER_OPTION_TEXT_WORKFLOW') });
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
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_CasesListing, this.localStorageKeyPrefix));
    if (searchFilter != null) {
      this.casesSearchFilter = searchFilter;
      if (this.casesSearchFilter.recordTypeIds != null && this.casesSearchFilter.recordTypeIds != '') {
        this.selectedRecordTypes = this.casesSearchFilter.recordTypeIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedRecordTypes = null;
      }

      if (this.casesSearchFilter.workflowIds != null && this.casesSearchFilter.workflowIds != '') {
        this.selectedWorkflows = this.casesSearchFilter.workflowIds.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedWorkflows = null;
      }

      if (this.casesSearchFilter.stageIds != null && this.casesSearchFilter.stageIds != '') {
        this.selectedstages = this.casesSearchFilter.stageIds.split(',').map(x => Number(x)) as [];
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
      if (this.casesSearchFilter.assignToIDs != null && this.casesSearchFilter.assignToIDs != '') {
        this.selectedUser = this.casesSearchFilter.assignToIDs.split(',').map(x => Number(x)) as [];
      }
      else {
        this.selectedUser = null;
      }

      if (this.casesSearchFilter.verifiedByIDs != null && this.casesSearchFilter.verifiedByIDs != '') {
        this.verifiedByUser = this.casesSearchFilter.verifiedByIDs.split(',').map(x => Number(x)) as [];
      }
      else {
        this.verifiedByUser = null;
      }
      
      this.showMyCases = this.casesSearchFilter.showMyCases;
      this.pagingParams.rating = this.casesSearchFilter.rating;
      this.showStarred = this.casesSearchFilter.showStarred;
    }
    this.lastCaseSearchFilter = JSON.parse(JSON.stringify(this.casesSearchFilter));
  }

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.casesSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CasesListing, JSON.stringify(this.casesSearchFilter), this.localStorageKeyPrefix);
        this.fetchCase();
      });
  }

  // get case for list
  private getCasesList(pagingParams: CasePagingParams) {
    this._commonHelper.showLoader();
    pagingParams.searchString = this.casesSearchFilter.searchText;
    pagingParams.entityRecordTypeIds = this.casesSearchFilter.recordTypeIds;
    pagingParams.entityWorkflowIDs = this.casesSearchFilter.workflowIds;
    pagingParams.entityWorkflowStageIDs = this.casesSearchFilter.stageIds;
    pagingParams.assignToIDs = this.casesSearchFilter.assignToIDs;
    pagingParams.verifiedByIDs = this.casesSearchFilter.verifiedByIDs;
    pagingParams.showMyCases = this.casesSearchFilter.showMyCases;
    pagingParams.rating = this.casesSearchFilter.rating;
    pagingParams.showStarred = this.casesSearchFilter.showStarred;
    this._casesService.getCaseList(pagingParams).then((response: any) => {
      if(response) {
        this.cases = response as any [];
        this.cases.forEach(data => {
        data['isSelected'] = false;
        data.relatedToIconToolTip = this._commonHelper.entityTypeList.find(entityType => entityType['id'] == data['entityTypeId'])?.displayName.toString().trim();
      });
      this.isAllCheckBoxSelected = false;
      this.unassignedCaseCount = this.cases.filter(x => !x.entityWorkFlowName).length;

      this.totalRecords = this.cases.length > 0 ? response[0].totalRecords : 0;
      this.pTable.rows = pagingParams.pageSize;
      this.totalPages = Math.ceil(this.totalRecords / pagingParams.pageSize);
      this.end = pagingParams.pageNo == this.totalPages ? this.totalRecords : pagingParams.pageNo * pagingParams.pageSize;
      this.start = this.end == this.totalRecords ? (this.totalRecords - this.cases.length + 1) : (this.end - pagingParams.pageSize) + 1;
      
      //set Action column show/hide dynamically
      this.isStageClosedOrCompleted = this.cases.filter(x => x.isCompletedStage || x.isClosedStage).length;
      if ((!this.isAllowToReopen && !this.isDeleteCase) || (this.isStageClosedOrCompleted < 0 && this.isAllowToReopen)) {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = false;
      }
      else {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = true;
      }

      if (this.selectedCaseIdForActivityCenter != null && this.selectedCaseIdForActivityCenter > 0 && this.cases.some(x=>x.id == this.selectedCaseIdForActivityCenter)) {
        this.updateEntityDetails(true, this.cases.find(x=>x.id == this.selectedCaseIdForActivityCenter));
      }
      else{
        this.resetSelectedEntity();
      }

      this._commonHelper.hideLoader();
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(error.message);
    });
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('CASES.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }

  private prepareParamsForVerifiedByUser(workFlowId, stageId, verifiedBy, includeAllUsers = 1, searchString = '') {
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

  private prepareParamsForVerifiedByUserAllCase(verifiedBy, includeAllUsers = 1, searchString = '') {
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

  private fetchCase(): void {
    if (this.pTable) {
      this.getCasesList(this.pagingParams);
    }
  }

  //Export Cases Listing

  exportExcel() {
    this.exportCases(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  private exportCases(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();
    const excelExportPayload = {
      searchString: this.pagingParams.searchString,
      entityRecordTypeIds: this.pagingParams.entityRecordTypeIds,
      entityWorkflowIDs: this.pagingParams.entityWorkflowIDs,
      entityWorkflowStageIDs: this.pagingParams.entityWorkflowStageIDs,
      assignToIDs: this.pagingParams.assignToIDs,
      verifiedByIDs: this.pagingParams.verifiedByIDs,
      showMyCases: this.pagingParams.showMyCases,
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

    let fileName = this._commonHelper.getConfiguredEntityName('{{Cases_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('CASES.LISTING.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    this._casesService.exportCasesList(excelExportPayload).then((base64String: any) => {
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
 
  // show quick view 
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
      entityIcon: 'fas fa-file-invoice',
      entityName: this._commonHelper.getInstanceTranlationData('CASES.DETAIL.CASE_NAME_LABEL'),
      label1: settingsJson.Token1Text,
      label1RedirectURL: settingsJson.Token1Url,
      label2: settingsJson.Token2Text,
      label2RedirectURL: settingsJson.Token2Url,
      label3: settingsJson.Token3Text,
      label3RedirectURL: settingsJson.Token3Url,
      relatedToLabel: rowData?.entityName,
      entityTypeId: rowData?.entityTypeId,
      relatedToIconToolTip: this._commonHelper.entityTypeList.find(entityType => entityType['id'] == rowData?.entityTypeId)?.displayName.toString().trim(),
      entityRecordTypeName: rowData?.entityRecordTypeName,
      entityRecordTypeId: rowData?.entityRecordTypeId,
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      isPaused: rowData?.isPaused,
      createdBy: rowData?.createdBy,
      workTaskTypeName: this._commonHelper.getInstanceTranlationData('CASES.DETAIL.TAB_WORKTASKS.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
      workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass,
      relatedToRedirectURL: this.onRelatedToClick(rowData),
    }
    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id;
    this.caseCreatedBy = rowData?.createdBy;
    this.casePrivacyLevel = rowData?.privacyLevel;

    this.selectedCaseForActivityCenter = rowData;
    this.selectedCaseIdForActivityCenter = rowData.id;
    this.selectedCaseIsPausedForActivityCenter = (rowData?.isPaused ?? false);
    this.selectedCaseIsClosedForActivityCenter = rowData?.isClosedStage;
    this.selectedCaseIsCompletedForActivityCenter = rowData?.isCompletedStage;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedRowEntityId: this.selectedRowId
    }
    
    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewCase);
  }

  onRelatedToClick(caseItem) {
     // check logged in user have permission to view related entity details
     if (!this._commonHelper.isUserHaveViewPermissionOfRelatedEntity(caseItem.entityTypeId)) {
      return this._router.url;
    }

    // if not undefined then redirect
    if (caseItem.entityTypeName != undefined && caseItem.entityId != undefined) {
      return '/' + this._commonHelper.getRouteNameByEntityTypeId(caseItem.entityTypeId).toLowerCase() + '/details/' + caseItem.entityId;
    }
    return this._router.url;
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

  // Set row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Cases_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Cases_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
  }
 
  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewCase;
        this.selectedCaseIdForActivityCenter = details.id;
        this.selectedCaseForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedCaseIsPausedForActivityCenter = (details?.isPaused ?? false);
        this.selectedCaseIsClosedForActivityCenter = details.isClosedStage;
        this.selectedCaseIsCompletedForActivityCenter = details.isCompletedStage;
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

  private getEntityRecordTypes() {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
    if (allEntityRecordTypes == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypesDetail = response?.filter(x => x.entityTypeID == Entity.Cases && (x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == Entity.Products || x.parentEntityTypeID == null)).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }));
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Cases).map(x=> ({'label':x.name,'value':x.id }));
            this.recordTypes.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.LISTING.FILTER_OPTION_TEXT_RECORDTYPE') });
            this.recordTypes.sort((a, b) => a.value - b.value);
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
            this.hideRecordTypeFilter = response?.filter(x => x.entityTypeID == Entity.Cases).map(x=> ({'label':x.name,'value':x.id }));
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
      this.recordTypesDetail = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases && (x.parentEntityTypeID == Entity.Accounts || x.parentEntityTypeID == Entity.Contacts || x.parentEntityTypeID == Entity.Products || x.parentEntityTypeID == null )).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }));
      this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases).map(x=> ({'label':x.name,'value':x.id }));
      this.recordTypes.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.LISTING.FILTER_OPTION_TEXT_RECORDTYPE') });
      this.recordTypes.sort((a, b) => a.value - b.value);
      this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
      this.hideRecordTypeFilter = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases).map(x=> ({'label':x.name,'value':x.id }));
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
        this.priorityDetails = refTypePriority as ReferenceType[];
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
        this.severityDetails = refTypeSeverity as ReferenceType[];
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

  onReopenStage(cases) {
    if (!this.isAllowToReopen) {
      return;
    }
    this.getEntityStagesWithTask(cases.entityWorkFlowID).then(() => {
      if (cases.isCompletedStage || cases.isClosedStage) {
        //get default stage details
        const getDefaultStage: any = this.casesListByStages?.find(s => s.isDefault);
        var isShowStageChangeConfirmationBox: boolean = true;
        this.changeEntityStage(getDefaultStage, getDefaultStage.id, isShowStageChangeConfirmationBox, true, cases);
      }
    });
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
      this.modalRef.componentInstance.entityWorkflowId = cases.entityWorkFlowID;
      this.modalRef.componentInstance.stageId = toEntityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;
      this.modalRef.result.then(response => {
        if (response != undefined) {
          const stageValueNoteParams = {
            entityTypeId: this.entityTypeId,
            entityId: cases.id,
            workflowId: cases.entityWorkFlowID,
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
              // get list
              this.getCasesList(this.pagingParams);
            });
          }).catch(() => {
            this.getCasesList(this.pagingParams);
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
        // get details
        this.getCasesList(this.pagingParams);
      }).catch(() => {
        this.getCasesList(this.pagingParams);
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
      let currentStageId = this.casesListByStages.find(x => x.id == cases.stageID)?.id;
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: cases?.entityRecordTypeId, entityId: cases.id, stageId: toEntityStageId, entityWorkflowId: cases?.entityWorkFlowID, assignedTo: assignedToForDto, verifiedBy: cases.verifiedBy, oldStageId: currentStageId }).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.caseAssignedTo = response;
          if (assignedToForDto != this.caseAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._casesService.updateCaseAssignedToUsers({ entityId: cases.id, assignedToId: this.caseAssignedTo.assignedToId, entityWorkflowId: cases?.entityWorkFlowID, isForcedAssignment: this.caseAssignedTo.isForcedAssignment }).then((response: any) => {
              if (response) {
                assignedToForDto = this.caseAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_CASES_MOVETO_STAGE',
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
                this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_CASES_STAGE_REOPEN', {
                  entityName: cases?.name !== null ? cases?.name : " "
                })
              )
            } else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('CASES.LISTING.MESSAGE_CASES_MOVETO_STAGE',
                  { stageName: toEntityStageDetail.name })
              );
            }

          }
        }
        // get details
        this.getCasesList(this.pagingParams);
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
      this.entityStagesWithTasksStorageKey = LocalStorageKey.CaseEntityStageWithTasksKey + "_" + this.entityTypeId + (id ? ("_" + id) : '');

      const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
      if (entityStagesWithTasks == null) {
        this._commonHelper.showLoader();
        this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, id).then(
          (response: any[]) => {
            this.casesListByStages = JSON.parse(JSON.stringify(response));
            this.casesListByStages.forEach((stage: any) => {
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
            this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.casesListByStages));
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
        this.casesListByStages = entityStagesWithTasks;
        resolve(null);
      }
    });
  }
}

