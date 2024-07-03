//ANGULAR
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { FormControl, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
//COMMON
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { DataSources, Entity, FieldNames, LayoutTypes, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, RefType, SectionCodes, TabLayoutType } from '../../../../@core/enum';
import { DynamicTableParameter } from '../../../../@core/sharedModels/dynamic-table.model';
//SERVICES
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { WorkTasksService } from '../../worktasks.service';
import { WorkflowmanagementService } from '../../../workflowmanagement/workflowmanagement.service';
import { SettingsService } from '../../../settings/settings.service';
import { CommonService } from '../../../../@core/sharedServices/common.service';
//COMPONENTS
import { ReasonDialogComponent } from '../../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
import { LinkWorkTaskDialogComponent } from '../../link-work-task-dialog/link-work-task-dialog.component';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { WorktaskAddSubTaskComponent } from '../../worktask-add-subtask/worktask-add-subtask.component';
//PIPES
import { TimeFramePipe } from '../../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { TimeFrameToMinutesPipe } from '../../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
import { timeFrameValidator } from '../../../../@core/sharedValidators/time-frame.validator';
import { IsEntityFieldHiddenPipe } from '../../../../@core/pipes/is-entity-field-hidden/is-entity-field-hidden.pipe';

//OTHER
import * as moment from 'moment';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NoteService } from '../../../../@core/sharedComponents/notes/notes.service';

@Component({
  selector: 'ngx-data-detail',
  templateUrl: './worktask-detail.component.html',
  styleUrls: ['./worktask-detail.component.scss']
})
export class WorkTaskDetailComponent implements OnInit{
  private workTaskTxtNameRef: ElementRef;
  @ViewChild('workTaskTxtName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.workTaskTxtNameRef = content;
    }
  }

  entityId: number;
  entityTypeId: number = Entity.WorkTasks;
  entityWorkflowId: any = null;
  entityRecordTypeId: number;
  isEntityWorkflow: boolean = false;
  relatedToName: string;
  relatedToNamePlaceholder: string;
  relatedToNameForHeader: string;
  relatedToIcon: string;
  relatedToIconToolTip: string;

  //privacy Icon
  privacyIcon:string;
  privacyToolTip:string;

  // worktask Model
  worktaskStages: Array<any> = [];
  currentStage: any;
  isCompleted: boolean = false;
  isClosed: boolean = false;
  isDeleteWorkTask: boolean = false;
  isResumeRecord: boolean = false;
  selectedStage: any;
  workTask: any;
  copyOfworkTask: any;
  workTaskDetails: any = {};

  workTaskId: number = 0;
  workTaskName: string;

  formMode: string;

  workTaskCustomFields: any[] = [];
  formDataJSON: any[] = [];
  selectedTab: string = '';
  // create form
  workTaskDetailForm: UntypedFormGroup;
  copyOfworkTaskDetailFormValues: any;
  worktaskAssignedTo: any;
  // submitted
  submitted: boolean = false;

  // loader
  isLoaded: boolean = false;

  //Assigned To Loader
  showAssignedToLoader: boolean = false;
  isForceReloadAssignedTo: boolean = true;

  //Priority Loader
  showPriorityLoader: boolean = false;
  isForceReloadPriority: boolean = true;

  //Severity Loader
  showSeverityLoader: boolean = false;
  isForceReloadSeverity: boolean = true;

  //Verified By Loader
  showVerifiedByLoader: boolean = false;
  isForceReloadVerifiedBy: boolean = true;

  //Related To Loader
  showRelatedToLoader: boolean = false;

  // permissions
  isEditWorkTask: boolean = false;
  isViewWorkTask: boolean = false;
  changeWorkTaskStage: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  hasPermission: boolean = false;
  isInitialLoading: boolean = true;
  isAllowToReopen: boolean = false;
  isAssignWorkTask: boolean = false;

  //Parent Type Permission
  isParentSubTypeViewPermission: boolean = false;

  //user detail
  _loggedInUser: any;

  isListViewLayout: boolean = true;

  activeTab = '';
  
  onceLinkedWorkTaskClicked: boolean = false;
  refreshLinkedWorkTasks: boolean = false;
  onceSubWorkTaskClicked: boolean = false;
  onceStageHistoryClicked: boolean = false;
  refreshSubWorkTasks: boolean = false;
  onceTimeLineClicked: boolean = false;
  onceDocumentClicked: boolean = false;
  SelectedEntityTypeId:any;
  SelectedEntityId:any;

  tblSubWorkTaskParameters: Array<DynamicTableParameter> = [];
  tblLinkedWorkTaskParameters: Array<DynamicTableParameter> = [];

  // flag for details readonly
  isReadOnly: boolean = true;
  recordTypesDetail= null;


  workTask_validation_messages = {
    'name': [
      { type: 'required', message: 'WORKTASK.DETAIL.DETAILS_TAB.NAME_REQUIRED' },
      { type: 'maxlength', message: 'WORKTASK.DETAIL.DETAILS_TAB.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'WORKTASK.DETAIL.DETAILS_TAB.MESSAGE_NAME_MIN' }
    ],
    'description': [
      { type: 'minlength', message: 'WORKTASK.DETAIL.DETAILS_TAB.MESSAGE_DESCRIPTION_MIN' }
    ],
    'entityID': [
      { type: 'required', message: 'WORKTASK.DETAIL.DETAILS_TAB.RELATED_TO_REQUIRED' }
    ],
    'estimatedMins': [
      { type: 'required', message: 'WORKTASK.DETAIL.DETAILS_TAB.ESTIMATION_TIME_VALIDATION_REQUIRED' },
      { type: 'invalidTimeFrame', message: 'WORKTASK.DETAIL.DETAILS_TAB.ESTIMATION_TIME_VALIDATION' },
      { type: 'timeTooLarge', message: 'WORKTASK.DETAIL.DETAILS_TAB.ESTIMATION_TIME_LENGTH_VALIDATION' },
      { type: 'timeTooSmall', message: 'WORKTASK.DETAIL.DETAILS_TAB.ESTIMATION_TIME_MINIMUM_VALIDATION' }
    ],
    'estimatedPoints': [
      { type: 'required', message: 'WORKTASK.DETAIL.DETAILS_TAB.ESTIMATION_POINTS_REQUIRED_VALIDATION' },
      { type: 'min', message: 'WORKTASK.DETAIL.DETAILS_TAB.ESTIMATION_POINTS_MIN_VALIDATION' },
      { type: 'max', message: 'WORKTASK.DETAIL.DETAILS_TAB.ESTIMATION_POINTS_MAX_VALIDATION' }
    ],
    'entityStageId': [{ type: 'required', message: 'CASES.DETAIL.DETAILS_TAB.STATUS_REQUIRED' }],
  };

  //Total Time
  totalSpentTime: any = null;
  totalEffectiveTime: any = null;
  totalPauseTime: any = null;

  estimatedMins: any = null;
  estimatedPoints: any = null;
  currentStageTask: any;
  oldStageId: number;
  oldStageTask: any;

  // assigned users
  assignedToUsers: any;
  priorityList: any;
  severityList: any;
  verifiedByUsers: any;

  //Related to
  relatedToList: any = null; //related to entity records
  isShowRelatedTo: boolean = true;
  isHeaderShowRelatedTo:boolean = false;
  possibleEntityTypeIdsForRelatedTo: any = null;
  isRelatedToGroupDropDown: boolean = true;
  selectedRelatedToEntityTypeID = null;
  selectedRelatedToEntityID = null;

  recordTypes: any;
  entityPrivacyDetails:  any = [];

  entitySubTypes: any = [];
  availableSubWorkTaskTypeDetails:any;
  availableSubWorkTaskTypeNames:any;
  availableSubWorkTaskTypeNamesForWorkTaskDelete: any;

  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshActivity: boolean = false;
  refreshDocument: boolean = false;
  refreshEntityTag: boolean = false;
  refreshCustomFieldDatasource: boolean = false;

  tinyMceApiKey: string = '';
  currentDate = new Date();
  public getCurrentDate() {
    return this.currentDate;
  }
  currentYearRange: string = this.currentDate.getFullYear().toString() + ":" + this._commonHelper.globalMaxDate.getFullYear().toString();

  entityStagesWithTasksStorageKey: string = LocalStorageKey.WorkTaskEntityStageWithTasksKey;
  
  //datasource
  currencySymbol:any = null;
  hoursInDay:number = null;

  //For Model Ref
  modalRef: NgbModalRef | null;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  workflows:any = null;

  //navTabs
  navTabs: any[] = [];
  navTabsAll: any = [];
  navTabsMore: any = [];
  nativeTabDetails: any = [];
  isAdditionalTab: boolean = false;
  nativeTabCount: number = 0;
  isNativeTab: boolean = true;
  tabLayout: string = 'Default';
  forceRedirectionTabName: string = '';

  currentActiveTabIndex: number = 0;
  previousActiveTabIndex: number = 0;

  refreshCustomFieldJSONGrid: boolean = false;
  isWorkflowPermission:boolean = false;

  fromEntityStageId: any;

  timelineResponse: any[] = [];
  timelineLoader: boolean = true;
  entityHiddenFieldSettings: any[];
  sectionCodes = SectionCodes;
  fieldNames = FieldNames;

  countries: any;
  
  //Header Section Hidden Fields
  hiddenFieldStatus: boolean;
  hiddenFieldCreated: boolean;
  hiddenFieldUpdated: boolean;
  hiddenFieldRelatedTo: boolean;
  hiddenFieldEstimatedMins: boolean;
  hiddenFieldEstimatedPoints: boolean;
  hiddenFieldElapsedTime: boolean;
  hiddenFieldEffectiveTime: boolean;
  hiddenFieldPauseTime: boolean;
  
  constructor(private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _workTaskService: WorkTasksService,
    private _formBuilder: UntypedFormBuilder,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService,
    private _commonService: CommonService,
    private _workflowmanagementService: WorkflowmanagementService,
    private _location: Location,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _isEntityFieldHiddenPipe: IsEntityFieldHiddenPipe,
    private _noteService: NoteService) {
    
    this.setPermissions(this.entitySubTypes);
    this.tinyMceApiKey = this._commonHelper.globalTinymceApiKey;
    
    //Allows to reload same component while navigation
    this._router.routeReuseStrategy.shouldReuseRoute = function() { return false; };
    this.readRouteParameter();
    
    Promise.all([
      this.getTabLayoutTenantSetting()
    ]).then(() => {
      this.setTabLayout();
    });
  }

  ngOnInit(): void {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    this.setLinkedWorkTaskTabParameters();
    this.setSubWorkTaskTabParameters();

    if (this.hasPermission) {   

      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getWorkflowList(),
        this.getEntityRecordTypes(),
        this.getEntitySubTypes(),
        this.getPrivacyLevelRefererence(),
        this.getEntityHiddenField(),
        this.getCountries()
      ]).then(() => {
        this.getWorkTaskCustomFields();
      }, error => {
        this._commonHelper.hideLoader();
      });

      // add or edit
      if (this.workTaskId > 0) {
        this.formMode = 'EDIT';
      } else {
        this.formMode = 'ADD';
        this.workTask = {};
      }
    }
  }

  // initiate Permissions
  private setPermissions(subTypes?: any): void {
    this.isEditWorkTask = this._commonHelper.havePermission(enumPermissions.EditWorkTask);
    this.isViewWorkTask = this._commonHelper.havePermission(enumPermissions.ViewWorkTask);
    this.changeWorkTaskStage = this._commonHelper.havePermission(enumPermissions.ChangeWorkTaskStage);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadWorkTaskDocument);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);
    this.isAssignWorkTask = this._commonHelper.havePermission(enumPermissions.AssignWorkTask);
    this.isDeleteWorkTask = this._commonHelper.havePermission(enumPermissions.DeleteWorkTask);
    this.isResumeRecord = this._commonHelper.havePermission(enumPermissions.ResumeTask);

    const checkType = subTypes?.find(x => this.workTask.typeID == x.id);
    if (checkType) {
      this.isViewWorkTask = checkType.viewPermissionHash != null ? this._commonHelper.havePermission(checkType.viewPermissionHash) : this.isViewWorkTask;
      this.isEditWorkTask = checkType.editPermissionHash != null ? this._commonHelper.havePermission(checkType.editPermissionHash) : this.isEditWorkTask;
    }

    this.hasPermission = this.isEditWorkTask || this.isViewWorkTask;
  }

  private readRouteParameter(): void {
    // If Record Edit then set record edit id
    this._activeRoute.params.subscribe(param => {
      if (param['id'] !== undefined) {
        if (param['id'] !== null) {
          this.workTaskId = param['id'];
          this.entityId = this.workTaskId;
        }
      }

      if (param['wf'] !== undefined) {
        if (param['wf'] != null) {
          this.entityWorkflowId = param['wf'];
          this.isEntityWorkflow = true;
        }
        else {
          this.isEntityWorkflow = false;
        }
      }
      else {
        this.isEntityWorkflow = false;
      }
    });

    this._activeRoute.queryParamMap.subscribe(params => {
      if (params != null && params.keys.length > 0) {
        params.keys.forEach(paramKey => {
          if (paramKey.toLocaleLowerCase() === 'tab') {
            this.forceRedirectionTabName = params.get(paramKey)?.trim() ?? '';
          }
        });
      }
    });

     // set storage key
     this.entityStagesWithTasksStorageKey = this.entityStagesWithTasksStorageKey + "_" + this.entityTypeId + (this.entityWorkflowId ? ("_" + this.entityWorkflowId) : '');
  }

  assignedToOnFilter(e) {
    this.getAssignedToUsers(0, e.filter);    
  }

  assignedToOnChange(e) {
    if (!e.value) {
      this.getAssignedToUsers(1, null);
    }
  }
  verifiedByOnFilter(e) {
    this.getVerifiedByUsers(0, e.filter);    
  }

  verifiedByToOnChange(e) {
    if (!e.value) {
      this.getVerifiedByUsers(1, null);
    }
  }
  // get assigned users
  getAssignedToUsers(includeAllUsers = 1, searchString = null) {
    this.showAssignedToLoader = true;
    // DD 20220330 SDC-188: datasources with workflow id and other information
    // prepare params
    let assignedToId = this.workTaskDetails.assignedTo; // owner 1 is assigned to
    let workTaskStageId = this.workTaskDetails.entityStageId;
    // get datasource details
    var params = this.prepareParamsForAssignedToUsers(workTaskStageId, assignedToId, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKASSIGNEDTO, params).then(response => {
      this.assignedToUsers = response;
      this.showAssignedToLoader = false;

      if (!searchString) 
        this.isForceReloadAssignedTo = false;
      else 
        this.isForceReloadAssignedTo = true;
    },
      (error) => {
        this.showAssignedToLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  // get assigned users
  getVerifiedByUsers(includeAllUsers = 1, searchString = null) {
    this.showVerifiedByLoader = true;
    // prepare params
    let verifiedBy = this.workTaskDetails.verifiedBy;
    let workTaskStageId = this.workTaskDetails.entityStageId;
    // get datasource details
    const params = this.prepareParamsForVerifiedByUser(workTaskStageId, verifiedBy, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKTASKVERIFIEDBY, params).then(response => {
      this.verifiedByUsers = response;
      this.showVerifiedByLoader = false;

      if (!searchString) 
        this.isForceReloadVerifiedBy = false;
      else 
        this.isForceReloadVerifiedBy = true;
    },
      (error) => {
        this.showVerifiedByLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  // get priority
  getPriority() {
    this.showPriorityLoader = true;
    // get datasource details
    this._dataSourceService.getDataSourceDataByCode(DataSources.PRIORITY).then(response => {
      this.priorityList = response;
      this.showPriorityLoader = false;
      this.isForceReloadPriority = false;
    },
      (error) => {
        this.showPriorityLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  // get severity
  getSeverity() {
    this.showSeverityLoader = true;
    // get datasource details
    this._dataSourceService.getDataSourceDataByCode(DataSources.SEVERITY).then(response => {
      this.severityList = response;
      this.showSeverityLoader = false;
      this.isForceReloadSeverity = false;
    },
      (error) => {
        this.showSeverityLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  private getCurrencySymbol() {
    const currencySymbol = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL));
    if (currencySymbol == null) {
      return new Promise((resolve, reject) => {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CURRENCY_SYMBOL).then((response:any) => {
          this.currencySymbol = response.currencySymbol;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL, JSON.stringify(this.currencySymbol));
          resolve(null);
        },
          (error) => {
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
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.HOURS_IN_DAY).then((response: any) => {
          this.hoursInDay = (response != null && !isNaN(Number(response))) ? Number(response) : 24;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY, JSON.stringify(this.hoursInDay));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.hoursInDay = hrsInDay;
    }
  }

  private getNativeTabDetailsByEntityTypeId() {
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_WorkTasks));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_WorkTasks, JSON.stringify(response));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.nativeTabDetails = nativeTabDetails;
    }
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
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflows = response;
            this.workflows.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('WORKTASK.LISTING.FILTER_OPTION_TEXT_WORKFLOW') });
            this.workflows.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflows));
          }
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        resolve(null);
      }
    });
  }

  //allow only 6 digits and '.'(dot)
  percentEventHandler(event) {
    if (event.keyCode === 46 && event.target.value.split('.').length === 2) {
      return false;
    }
    //don't allow more than 15 digit number
    return event.target.value.length <= 6;
  }

  //allow only 13 digits and ','(comma)
  currencyEventHandler(event) {
    //don't allow more than 13 digit number
    return event.target.value.length < 17;
  }

  //allow only 8000 characters in total
  textEventHandler(event) {
    return event.target.value.length < 4000;
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

  prepareParamsForVerifiedByUser(stageId, verifiedBy, IncludeAllUsers = 1, searchString = '') {
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

  // get custom fields
  getWorkTaskCustomFields(): any {
    this._commonHelper.showLoader();
    this._workTaskService.getWorkTaskCustomFields(this.entityTypeId, this.entityId).then((res: any) => {
      if (res) {
        this.workTaskCustomFields = res || [];
        this.prepareFormDataInJSON();
        this.getWorkTaskDetails();
      }
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  // prepare form data in JSON format
  private prepareFormDataInJSON(): void {
    this.workTaskCustomFields.forEach((customField: any) => {
      if (customField.isVisible) {
        let isLabelView: boolean = false;
        let tabNameObject = this.getValueFromJSON(customField.tabDisplayName);
        if (!tabNameObject) {
          let dataObject = {
            tabName: customField.tabDisplayName,
            tabNumber: customField.tabDisplayOrder,
            isTabAlwaysVisible: customField.tabIsAlwaysVisible,
            sections: [
              {
                sectionName: customField.sectionName,
                isLabelView: isLabelView,
                controls: [
                  {
                    displayOrder: customField.displayOrder,
                    fieldName: customField.fieldName,
                    fieldType: customField.fieldType,
                    fieldClass: customField.fieldClass,
                    defaultValue: customField.defaultValue,
                    label: customField.label,
                    optionsJSON: customField.optionsJSON ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
                    settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
                    dataSourceId: customField.datasourceID,
                    dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
                  }
                ]
              }
            ]
          }
          this.addControlToFormJSON(customField.tabDisplayName, dataObject);
        } else {
          let existingSection = tabNameObject.sections.find(s => s.sectionName == customField.sectionName);
          if (existingSection) {
            existingSection.controls.push({
              displayOrder: customField.displayOrder,
              fieldName: customField.fieldName,
              fieldType: customField.fieldType,
              fieldClass: customField.fieldClass,
              defaultValue: customField.defaultValue,
              label: customField.label,
              optionsJSON: customField.optionsJSON != null ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
              settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
              dataSourceId: customField.datasourceID,
              dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
            });
          } else {
            tabNameObject.sections.push({
              sectionName: customField.sectionName,
              isLabelView: isLabelView,
              controls: [
                {
                  displayOrder: customField.displayOrder,
                  fieldName: customField.fieldName,
                  fieldType: customField.fieldType,
                  fieldClass: customField.fieldClass,
                  defaultValue: customField.defaultValue,
                  label: customField.label,
                  optionsJSON: customField.optionsJSON != null ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
                  settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
                  dataSourceId: customField.datasourceID,
                  dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
                }
              ]
            });
          }
        }
      }
    });
  }

  // add custom field controls to the form
  prepareFormCustomFields() {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.workTask.customFieldJSONData[control.fieldName] != null && this.workTask.customFieldJSONData[control.fieldName] != '') {
              this.workTask.customFieldJSONData[control.fieldName] = moment(new Date(this.workTask.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.workTaskDetailForm.addControl(control.fieldName, new UntypedFormControl(this.workTask.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.workTaskDetailForm.addControl(control.fieldName, new UntypedFormControl(this.workTask.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.workTask.customFieldJSONData[control.fieldName] != null && this.workTask.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.workTask.customFieldJSONData[control.fieldName] === 'string') {
                this.workTask.customFieldJSONData[control.fieldName] = JSON.parse(this.workTask.customFieldJSONData[control.fieldName]);
              }
            } else {
              this.workTask.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.workTask.customFieldJSONData[control.fieldName] != null && this.workTask.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.workTask.customFieldJSONData[control.fieldName];
              this.workTask.customFieldJSONData[control.fieldName] = this.workTask.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON['isRequired']) {
                this.workTaskDetailForm.addControl(control.fieldName, new UntypedFormControl(this.workTask.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.workTaskDetailForm.addControl(control.fieldName, new UntypedFormControl(this.workTask.customFieldJSONData[control.fieldName]));
              }
              this.workTask.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.workTaskDetailForm.addControl(control.fieldName, new UntypedFormControl(this.workTask.customFieldJSONData[control.fieldName]));
              if (control.settingsJSON) {
                let validatorFn: ValidatorFn[] = [];
                if (control.settingsJSON['isRequired']) {
                  validatorFn.push(Validators.required);
                }
                if (control.settingsJSON['minLength']) {
                  validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
                }
                if (control.settingsJSON['maxLength']) {
                  validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
                }
                if (validatorFn.length > 0) {
                  this.workTaskDetailForm.controls[control.fieldName].setValidators(validatorFn);
                  this.workTaskDetailForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.workTask.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.workTask.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.workTaskDetailForm.addControl(control.fieldName, new UntypedFormControl(this.workTask.customFieldJSONData[control.fieldName]));
              this.workTaskDetailForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.workTaskDetailForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.workTaskDetailForm.addControl(control.fieldName, new UntypedFormControl(this.workTask.customFieldJSONData[control.fieldName]));
              this.workTaskDetailForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.workTaskDetailForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.workTaskDetailForm.addControl(control.fieldName, new UntypedFormControl(this.workTask.customFieldJSONData[control.fieldName], Validators.email));
            let validatorFn: ValidatorFn[] = [];
            validatorFn.push(Validators.email);
            if (control.settingsJSON['isRequired']) {
              validatorFn.push(Validators.required);
            }
            if (control.settingsJSON['minLength']) {
              validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
            }
            if (control.settingsJSON['maxLength']) {
              validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
            }
            if (validatorFn.length > 0) {
              this.workTaskDetailForm.controls[control.fieldName].setValidators(validatorFn);
              this.workTaskDetailForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.workTaskDetailForm.addControl(control.fieldName, new UntypedFormControl(this.workTaskDetails.customFieldJSONData[control.fieldName]));
            if (this.workTaskDetails.customFieldJSONData[control.fieldName] != null && this.workTaskDetails.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.workTaskDetails.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.workTaskDetailForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") } );
              }
            } else {
              this.workTaskDetailForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.workTaskDetailForm.addControl(control.fieldName, new UntypedFormControl(this.workTask.customFieldJSONData[control.fieldName]));
            if (control.settingsJSON) {
              let validatorFn: ValidatorFn[] = [];
              if (control.settingsJSON['isRequired']) {
                validatorFn.push(Validators.required);
              } 
              if (control.settingsJSON['minLength']) {
                validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
              }
              if (control.settingsJSON['maxLength']) {
                validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
              }
              if (validatorFn.length > 0) {
                this.workTaskDetailForm.controls[control.fieldName].setValidators(validatorFn);
                this.workTaskDetailForm.controls[control.fieldName].updateValueAndValidity();
              }
            }
          }
        });
      });
    });
  }

  private setDefaultNavTabs(): void {
    this.navTabsAll = [
      { tabName: 'Details', tabLink: 'navDetails', isFirst: true, condition: true, displayOrder: 101 },
      { tabName: '', tabLink: 'navHistory', isFirst: false, condition: true, displayOrder: 201 },
      { tabName: '', tabLink: 'navLinkedWorkTasks', isFirst: false, condition: true, displayOrder: 401 },
      { tabName: '', tabLink: 'navSubWorkTasks', isFirst: false, condition: true, displayOrder: 501 },
      { tabName: '', tabLink: 'navTimeline', isFirst: false, condition: true, displayOrder: 601 },
      { tabName: '', tabLink: 'navDocuments', isFirst: false, condition: true, displayOrder: 701 }
    ];

    this.setNativeTabDetails();
    
    //set dynamic name for subtask
    if (this.availableSubWorkTaskTypeNames && this.availableSubWorkTaskTypeNames != '')
      this.navTabsAll.find(x => x.tabLink == 'navSubWorkTasks').tabName = this.availableSubWorkTaskTypeNames;
    else
      this.navTabsAll.find(x => x.tabLink == 'navSubWorkTasks').condition = false;

    if (this.workTask.parentID || !this.availableSubWorkTaskTypeNames) {
      this.navTabsAll.find(x => x.tabLink == 'navTimeline').condition = false;
    }
    
    this.navTabsAll.forEach((f) => {
      (f.isNativeTab = true), (f.isTabAlwaysVisible = false),(f.showCloseTabIconBtn = false), (f.showButtonActive = false)
    });
  }

  private setNativeTabDetails() {
    this.navTabsAll.forEach(tab => {
      const nativeTabDetail = this.nativeTabDetails != null ? this.nativeTabDetails.find(x => x != null && x.code?.toLocaleLowerCase() === tab.tabLink.toLocaleLowerCase()) : null;
      if (nativeTabDetail != null) {
        tab.tabName = nativeTabDetail.displayName;
        tab.displayOrder = nativeTabDetail.displayOrder;
        tab.condition = tab.condition && nativeTabDetail.isActive;
      }
      else {
        tab.condition = false;
      }
    });

    if (!this.navTabsAll.some(x => x.condition)) {
      this.navTabsAll.find(x => x.isFirst).condition = true;
    }
  }

  private prepareTabsWithOrder() : void {
    this.formDataJSON.forEach(tab => {
      var objNavTab  = {
        tabName: tab.tabName,
        tabLink: 'nav' + tab.tabName.replace(/\s/g, ""),
        isFirst: false,
        condition: true,
        displayOrder: tab.tabNumber,
        isNativeTab:false,
        isTabAlwaysVisible: tab.isTabAlwaysVisible,
        showCloseTabIconBtn : true,
        showButtonActive: false
      }

      this.navTabsAll.push(objNavTab);
    });
    this.navTabsAll = this.navTabsAll.sort(( a, b ) => a.displayOrder > b.displayOrder ? 1 : -1 );
    this.setTabLayout();
  }

  customfieldMultiSelectChange(event, fieldName) {
    const stringValue = event.value.toString()
    this.workTask.customFieldJSONData[fieldName] = stringValue != '' ? stringValue : null;
  }

  //add action answers to form JSON
  addControlToFormJSON(name, dataObject) {
    this.addOrUpdateFormJSON(name, dataObject);
  }

  // add question answer to JSON which is global for form - question/answer in array
  addOrUpdateFormJSON(name, dataObject) {
    let obj = this.formDataJSON.find(item => item[name]);
    if (obj) {
      obj[name] = dataObject[name];
    } else {
      this.formDataJSON.push(dataObject);
    }
  }

  //get value from the JSON
  getValueFromJSON(name: string) {
    return this.formDataJSON.find(item => item.tabName == name);
  }

  getWorkTaskDetails() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this.isInitialLoading = true;
      this._workTaskService.getWorkTaskById(this.workTaskId, this.entityWorkflowId).then((response: any) => {
        if (response) {
          this.workTask = response;
          this.isWorkflowPermission = this._commonHelper.havePermission(this.workTask.permissionHash);
          this.setPermissions(this.entitySubTypes);

          if (!this.isEntityWorkflow) {
            if (+this.workTask?.entityWorkflowID > 0) {
              this.isEntityWorkflow = true;
              this.entityWorkflowId = +this.workTask?.entityWorkflowID;
              this.entityStagesWithTasksStorageKey = `${this.entityStagesWithTasksStorageKey}_${this.entityWorkflowId}`;
            }
          }
         
          //custom fields
          this.workTask.customFieldJSONData = this._commonHelper.tryParseJson(this.workTask.customFieldJSONData);
          // work task details
          this.workTaskDetails = this.workTask;
          this.workTaskDetails.estimatedMins = new TimeFramePipe().transform(this.workTaskDetails.estimatedMins, this.hoursInDay);
          this.estimatedMins = this.workTaskDetails.estimatedMins;
          this.workTaskName = this.workTask?.name;
          this.estimatedPoints = this.workTask?.estimatedPoints;
          this.workTaskDetails.dueDate = this.workTaskDetails.dueDate != null ? moment(new Date(this.workTaskDetails.dueDate)).toDate() : this.workTaskDetails.dueDate;
          // record type
          this.entityRecordTypeId = this.workTaskDetails.entityRecordTypeID;
          //show/Hide Pause/Resume button
          this.workTaskDetails.isShowPauseOrResume = (this.workTask?.entityWorkflowID != null) ? true : false;
          //show raise hand icon
          if ((this.workTaskDetails.assignedTo == this._loggedInUser.userId || this.workTaskDetails.isHandRaised) && this.isEditWorkTask) {
            this.workTaskDetails.showRaiseHandButtons = true;
          } else {
            this.workTaskDetails.showRaiseHandButtons = false;
          }
          // related entityType
          this.selectedRelatedToEntityTypeID = this.workTaskDetails.entityTypeID;
          this.SelectedEntityTypeId = this.workTaskDetails.entityTypeID;
          // related entityID
          this.selectedRelatedToEntityID = this.workTaskDetails.entityID;
          this.SelectedEntityId = this.workTaskDetails.entityID;

          // copy detail
          this.copyOfworkTask = this._commonHelper.deepClone(this.workTaskDetails);

          this.fromEntityStageId = this.workTask.entityStageId;

          //available Subtask Types
          let worktaskTypeLevel:number = this.entitySubTypes.find(x=> x.id == this.workTaskDetails.typeID)?.level ?? 0;
          this.availableSubWorkTaskTypeDetails = this.entitySubTypes.filter(x => x.parentID == this.workTaskDetails.typeID && x.level == worktaskTypeLevel + 1 && this._commonHelper.havePermission(x.listPermissionHash));
          this.availableSubWorkTaskTypeNames = this.availableSubWorkTaskTypeDetails?.map(x => x.name).join("/")?.trim() ?? null;
          this.availableSubWorkTaskTypeNamesForWorkTaskDelete = this.availableSubWorkTaskTypeDetails?.map(x => x.name).join(" or ")?.trim() ?? null;

          //get privacy icon
          var privacyDetails = this.entityPrivacyDetails?.find((x: any) => x.intValue1 == this.workTaskDetails?.privacyLevel);
          this.privacyIcon = privacyDetails?.strValue1;
          this.privacyToolTip = privacyDetails?.name;
          
          //parent worktask Type Permission
          if (this.workTaskDetails.parentID) {
            let parentTypeDetails = this.entitySubTypes.find(x => x.id == this.workTaskDetails.parentTypeID);
            this.isParentSubTypeViewPermission = parentTypeDetails?.viewPermissionHash != null ? this._commonHelper.havePermission(parentTypeDetails?.viewPermissionHash) : this._commonHelper.havePermission(enumPermissions.ViewWorkTask);
          }

          // form
          if(!this.workTaskDetailForm){
            this.workTaskDetailForm = this.createworkTaskDetailForm();
          }
          else{
            this.updateWorktaskDetailForm();
          }

          if (this.isEntityWorkflow && this.entityWorkflowId > 0) {
            this.getWorkflowDetail(this.entityWorkflowId);
          }
          this.getEntityStagesWithTask();

          this.getEntityTotalReportingTime();
          this.prepareFormCustomFields();
          if (this.workTask.entityWorkflowID) {
            this.workTaskDetailForm.addControl('entityStageId', new FormControl(this.workTask.entityStageId ?? null, Validators.required));
          }
          this.setDefaultNavTabs();
          this.prepareTabsWithOrder();
          this.copyOfworkTaskDetailFormValues = this.workTaskDetailForm.value;
          const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.workTask.entityTypeID);
          if (foundRecord) {
            this.relatedToName = foundRecord?.['displayName'].toString().trim();
            this.relatedToNamePlaceholder = (this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.DETAILS_TAB.RELATED_TO_PLACEHOLDER', { entityName: foundRecord?.['displayName'].toString().trim()}));
            this.relatedToNameForHeader = foundRecord?.['displayName'].toString().trim();
            this.relatedToIcon = this._commonHelper.getEntityIconClass(this.workTask.entityTypeID);
            this.relatedToIconToolTip = foundRecord?.['displayName'].toString().trim();
          }
          else{
            this.relatedToName = this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.DETAILS_TAB.RELATED_TO');
            this.relatedToNamePlaceholder = this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.DETAILS_TAB.RELATED_TO_PLACEHOLDER', { entityName: this.relatedToName }).replace('(','').replace(')','').trim();
            this.relatedToNameForHeader = this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.ENTITY_NAME_LABEL');
          }
        }
        this._commonHelper.hideLoader();
        this.isInitialLoading = false;
        this.isLoaded = true;
        this.refreshCustomFieldJSONGrid = true;
        setTimeout(() => { this.refreshCustomFieldJSONGrid = false; }, 50);
        resolve(null);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.isInitialLoading = false;
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }
     
  bindDropdownData() {
    if (this.isAssignWorkTask && this.isForceReloadAssignedTo) this.getAssignedToUsers(1, '');
    if (this.isForceReloadPriority) this.getPriority();
    if (this.isForceReloadSeverity) this.getSeverity();
    if (this.isAssignWorkTask &&this.isForceReloadVerifiedBy) this.getVerifiedByUsers();
    this.possibleEntityTypeIdsForRelatedTo = null;
  }

  // get work tasks by stage
  getEntityStagesWithTask() {
    return new Promise((resolve, reject) => {
      const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
      if (entityStagesWithTasks != null) {
        this.worktaskStages = entityStagesWithTasks;
        this.getEntityStagesWithTaskAfterReset();
        resolve(null);
      } else {
        if ((+this.entityWorkflowId || 0) > 0) {
          this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId)
          .then((response: any[]) => {
              this.worktaskStages = this._commonHelper.tryParseJson(JSON.stringify(response || []));
              // stage tasks
              this.worktaskStages.forEach(stageElement => {
                if (stageElement.stageTasks != null) {
                  stageElement.stageTasks = this._commonHelper.tryParseJson(stageElement.stageTasks);
                  // all stage tasks - change label if task is required
                  stageElement.stageTasks.forEach(stageTask => {
                    if (stageTask.isRequired) {
                      stageTask.name = stageTask.name + ' *';
                    }
                  });
                }
              });
              // store in local storage
              this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.worktaskStages));
              this.getEntityStagesWithTaskAfterReset();
              resolve(null);
            }, (error) => {
              this._commonHelper.showToastrError(error.message);
              reject(null);
            }
          );
        }
      }
    });
  }

  getEntityStagesWithTaskAfterReset() {
    // get current stage 
    this.currentStage = this.worktaskStages.find(f => this.workTask && this.workTask.entityStageId === f.id) || this.worktaskStages.find(f => f.isDefault);
    if(this.currentStage != undefined){
    this.isCompleted = this.currentStage.isCompleted;
    this.isClosed = this.currentStage.isClosed;
    if(this.isCompleted || this.isClosed)
    {
      this.isReadOnly = true;
    }
    }
    //set selected stage for mobile view
    this.selectedStage = this.currentStage;

    // get current stage tasks
    this.currentStageTask = this.worktaskStages.length > 0 ? this.worktaskStages.find(s => s.id == this.workTaskDetails.entityStageId)?.stageTasks ?? null : '';
    if (this.workTaskDetails.selectedStageTaskIds != null && this.workTaskDetails.selectedStageTaskIds != "") {
      const taskIds: Array<number> = this.workTaskDetails.selectedStageTaskIds
        ? this.workTaskDetails.selectedStageTaskIds.split(",").map(m => Number(m))
        : [];
      // map and get only ID and Name
      this.workTaskDetails.selectedStageTaskIds = (this.currentStage.stageTasks || []).filter(f => taskIds.includes(f.id)) || [];
      this.oldStageTask = this._commonHelper.tryParseJson(JSON.stringify(this.workTaskDetails.selectedStageTaskIds));
    }
  }

  // convenience getter for easy access to form fields
  get workTaskfrm() { return this.workTaskDetailForm.controls; }
  //create worktask form
  createworkTaskDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.workTaskId],
      name: [this.workTaskDetails.name, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(500)])],
      description: [this.workTaskDetails.description],
      selectedStageTaskIds: [this.workTaskDetails.selectedStageTaskIds],
      estimatedMins: [this.workTaskDetails.estimatedMins, Validators.compose([timeFrameValidator()])],
      estimatedPoints: [this.workTaskDetails.estimatedPoints, Validators.compose([Validators.required,Validators.min(0),Validators.max(9999)])],
      assignedTo: [this.workTaskDetails.assignedTo],
      entityID: [this.workTaskDetails.entityID],
      priority: [this.workTaskDetails.priority],
      severity: [this.workTaskDetails.severity],
      dueDate: [moment(new Date(this.workTaskDetails.dueDate)).toDate()],
      verifiedBy: [this.workTaskDetails.verifiedBy]
    });
  }

  updateWorktaskDetailForm()
  {
    this.workTaskDetailForm.patchValue({'entityID': this.workTaskDetails.entityID});
    this.workTaskDetailForm.patchValue({'id': this.workTaskId});
    this.workTaskDetailForm.patchValue({'name': this.workTaskDetails.name});
    this.workTaskDetailForm.patchValue({'description': this.workTaskDetails.description});
    this.workTaskDetailForm.patchValue({'selectedStageTaskIds': this.workTaskDetails.selectedStageTaskIds});
    this.workTaskDetailForm.patchValue({'estimatedMins': this.workTaskDetails.estimatedMins});
    this.workTaskDetailForm.patchValue({'estimatedPoints': this.workTaskDetails.estimatedPoints});
    this.workTaskDetailForm.patchValue({'assignedTo': this.workTaskDetails.assignedTo});
    this.workTaskDetailForm.patchValue({'priority': this.workTaskDetails.priority});
    this.workTaskDetailForm.patchValue({'severity': this.workTaskDetails.severity});
    this.workTaskDetailForm.patchValue({'dueDate': moment(new Date(this.workTaskDetails.dueDate)).toDate()});
    this.workTaskDetailForm.patchValue({'verifiedBy': this.workTaskDetails.verifiedBy});
  }
  //show hide detail tab with save
  showHideDetailTab(frmMode) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.workTaskDetailForm.invalid) {
        this.validateAllFormFields(this.workTaskDetailForm);
        this.navigateToTabByValidation();
        return;
      }

      this.refreshActivity = true;
      
      Promise.all([
        this.saveData()
      ]).then(() => {
        this.isReadOnly = true;
        this.submitted = false;
       // this.isForceReloadRelatedTo = true;
      })
    }
    else if (frmMode === 'CANCEL') {
      this.workTaskDetails = this._commonHelper.deepClone(this.copyOfworkTask);
      
      if(this.workTaskDetails.customFieldJSONData && this.workTaskDetails.customFieldJSONData !== null && this.workTaskDetails.customFieldJSONData !== '' && this.workTaskDetails.customFieldJSONData !== undefined) {
        this.workTaskCustomFields.forEach((field: any) => {
          if(field.fieldType == 'Date') {
            if (this.workTaskDetails.customFieldJSONData[field.fieldName] && this.workTaskDetails.customFieldJSONData[field.fieldName] != null && this.workTaskDetails.customFieldJSONData[field.fieldName] != '' && this.workTaskDetails.customFieldJSONData[field.fieldName] != undefined) {
              this.workTaskDetails.customFieldJSONData[field.fieldName] = moment(new Date(this.workTaskDetails.customFieldJSONData[field.fieldName])).toDate();
            }
          }else if (field.fieldType == 'JSON Grid') {
            if (this.workTaskDetails.customFieldJSONData[field.fieldName] && this.workTaskDetails.customFieldJSONData[field.fieldName] != null && this.workTaskDetails.customFieldJSONData[field.fieldName] != '' && this.workTaskDetails.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.workTaskDetails.customFieldJSONData[field.fieldName] === 'string') {
                this.workTaskDetails.customFieldJSONData[field.fieldName] = JSON.parse(this.workTaskDetails.customFieldJSONData[field.fieldName]);
              }
            }else {
              this.workTaskDetailForm.removeControl(field.fieldName)
            }
          } else if (String(field.fieldType).toLowerCase() === 'duration') {
            if (typeof this.workTaskDetails.customFieldJSONData[field.fieldName] === 'number' || this.workTaskDetails.customFieldJSONData[field.fieldName] == null) {
              this.workTaskDetails.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.workTaskDetails.customFieldJSONData[field.fieldName], this.hoursInDay);
            }
          }
        })
      }

      this.workTaskDetailForm.reset(this.copyOfworkTaskDetailFormValues);
      this.refreshJSONGridData()
      this.getEntityStagesWithTaskAfterReset();
      this.isReadOnly = !this.isReadOnly
      this.submitted = false;
    }
    else if (frmMode === 'EDIT' && this.isReadOnly == true) {
      this.bindDropdownData();
      setTimeout(() => { this.workTaskTxtNameRef.nativeElement.focus(); });
      this.isReadOnly = !this.isReadOnly
      this.submitted = false;
    }
  }

  refreshJSONGridData() {
    this.refreshCustomFieldJSONGrid = true;
     setTimeout(() => {
      this.refreshCustomFieldJSONGrid = false;
    }, 50);
  }

  //save data
  saveData() {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.workTask.customFieldJSONData) {
        this.workTaskCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.workTask.customFieldJSONData[field.fieldName] && this.workTask.customFieldJSONData[field.fieldName] != null && this.workTask.customFieldJSONData[field.fieldName] != '') {
              this.workTask.customFieldJSONData[field.fieldName] = moment(this.workTask.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.workTaskDetailForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.workTask.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.workTask.customFieldJSONData[field.fieldName] = null;
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.workTaskDetailForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.workTask.customFieldJSONData[field.fieldName] = data;
            } else {
              this.workTask.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }
      this.workTaskDetails.dueDate = this.workTaskDetails.dueDate != null ? moment(this.workTaskDetails.dueDate).format('YYYY-MM-DD') : this.workTaskDetails.dueDate;
      this.workTaskDetails.entityTypeID = this.selectedRelatedToEntityTypeID;
      //copy of leads detail
      let params = this._commonHelper.deepClone(this.workTaskDetails);
      
      this.workTaskCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.workTaskDetailForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = new TimeFrameToMinutesPipe().transform(formArrayValues, this.hoursInDay);
        }
      });

      //Convert time formate to mins before save
      params.estimatedMins = new TimeFrameToMinutesPipe().transform(this.workTaskDetails.estimatedMins, this.hoursInDay);

      //set selectedStageTaskIDs
      if (params.selectedStageTaskIds != null) {
        if (Array.isArray(params.selectedStageTaskIds)) {
          params.selectedStageTaskIds = params.selectedStageTaskIds.map(task => task.id).toString()
        }
      } else {
        params.selectedStageTaskIds = '';
      }
      params.fromEntityStageId = this.fromEntityStageId;
      // set entity workflow
      params.entityWorkflowId = this.entityWorkflowId;
      // save
      this._workTaskService.updateWorkTask(params).then((response: any) => {
        // get details
        this.getWorkTaskDetails().then(() => {
          this.refreshCustomFieldDatasource = true;
          setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          resolve(null)
        });

        //Refresh Stage History
        this.setRefreshStageHistory();

        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.MESSAGE_WORK_TASK_UPDATED'));
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error != null && String(error.messageCode).toLowerCase() === 'worktasks.pausedorinactiveerror') {
          this.getWorkTaskDetails().then(() => {
            this.refreshCustomFieldDatasource = true;
            setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          });
        } else if (error.messageCode.toLowerCase() !== 'staticmessage') {
          this.getWorkTaskDetails().then(() => {
            this.refreshCustomFieldDatasource = true;
            setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          });
          resolve(null);
        } else {
          reject(null);
        }
        reject(null)
      });
    })
  }

  // form validation
  validateAllFormFields(formGroup: UntypedFormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      }
      else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }else if (control instanceof UntypedFormArray) {
        control?.controls?.forEach((i: UntypedFormGroup) => {
          this.validateAllFormFields(i);
        })
      }
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

  onReopenStage() {
    if(!this.isAllowToReopen) {
      return;
    }

    if(this.isCompleted || this.isClosed) {
      //get default stage details
      const dropEntityStageDetail: any = this.worktaskStages?.find(s => s.isDefault);
      this.onMarkStageAsComplete(dropEntityStageDetail?.id, true);
    }
  }

  // stage transition
  onMarkStageAsComplete(dropEntityStageId, isReopenedStage: boolean = false) {
    var isShowStageChangeConfirmationBox: boolean = true;
    this.optionsForPopupDialog.size = 'md';
    //check can user change stage
    const dropEntityStageDetail = this.worktaskStages.find(s => s.id == dropEntityStageId);
    if (dropEntityStageDetail != null && dropEntityStageId != this.workTaskDetails.entityStageId) {
      const prevEntityStageDetail = this.worktaskStages.find(s => s.id == this.workTaskDetails.entityStageId);
      const canUserChangeStage: boolean = this.canUserChangeStage(prevEntityStageDetail, this.workTaskDetails);

      if (!canUserChangeStage) {
        if (this.changeWorkTaskStage) {
          isShowStageChangeConfirmationBox = false;
          this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
            .then((confirmed) => {
              if (confirmed) {
                this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
              }
            });
        }
        else {
          this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
        }
      }
      else {
        this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
      }
    }
  }

  afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean) {
    this.optionsForPopupDialog.size = 'md';
    const dropEntityStageDetail = this.worktaskStages.find(s => s.id == dropEntityStageId);
    
    // if any one of the current stage task is required
    let anyTasksIsRequired: boolean = false;
    let requiredTasks: any[] = [];
    // find out the current stage
    let currentStage = this.worktaskStages.find(x => x.id == this.workTaskDetails.entityStageId);
    let isAllTasksRequired = currentStage?.isAllTasksRequired;
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
      this._workflowmanagementService.isEntityStageTasksCompleted(this.entityId, this.entityTypeId, this.workTaskDetails.entityStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.checkHandRaised(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.MESSAGE_BEFORE_MOVE_WORK_TASK_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
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
      this._workflowmanagementService.isEntityStageTasksCompleted(this.entityId, this.entityTypeId, this.workTaskDetails.entityStageId, this.entityWorkflowId, null).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.checkHandRaised(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.MESSAGE_BEFORE_MOVE_WORK_TASK_STAGE_TASK_SHOULD_BE_COMPLETED'));
          return false;
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    } else {
      this.checkHandRaised(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
    }
  }
  
  checkHandRaised(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox:boolean, isReopenedStage: boolean){
    this._commonHelper.showLoader();

    this._workflowmanagementService.isEntityStageRaiseHandTransitionExist(this.entityId, this.entityTypeId, this.entityWorkflowId, this.workTaskDetails.entityStageId).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response === true) {
        //Hand Raised - Not allowed to move the stage
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.MESSAGE_BEFORE_MOVE_WORK_TASK_FOR_RAISED_HAND_TASK'));
        return false;
      } else {
        this.changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  changeEntityStage(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox:boolean, isReopenedStage: boolean) {
    let noteSubjectName: any; 
    if(!isReopenedStage) {
      noteSubjectName = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropEntityStageDetail.name }))}`
    }else {
      noteSubjectName = this._commonHelper.getInstanceTranlationData('COMMON.STAGE_REOPEN_TEXT');
    }
    if (dropEntityStageDetail.isNoteRequired || isReopenedStage) {
      isShowStageChangeConfirmationBox = false;
      this.refreshActivity = false;
      this.optionsForPopupDialog.size = 'md';
      this.modalRef = this._modalService.open(ReasonDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = this.entityId;
      this.modalRef.componentInstance.noteSubject = noteSubjectName;
      this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
      this.modalRef.componentInstance.stageId = dropEntityStageId;
      this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYSTAGEREASONS;
      this.modalRef.componentInstance.isSaveNote = true;
      this.modalRef.result.then(response => {
        if (response != undefined) {
          this.refreshActivity = true;
          this.setRefreshActivityHistory();
          const stageValueNoteParams = {
            entityTypeId: this.entityTypeId,
            entityId: this.entityId,
            workflowId: this.entityWorkflowId,
            workflowStageId: dropEntityStageId,
            stageNoteID: response.id,
            pauseNoteID: null,
            processNoteTypeId: ProcessEntityWorkflowStageValueNoteType.StageNote
          };

          Promise.all([
            this.updateEntityStage(dropEntityStageId, dropEntityStageDetail, isShowStageChangeConfirmationBox, isReopenedStage),
          ]).then(() => {
            Promise.all([
              this.saveEntityWorkflowStageValueNote(stageValueNoteParams)
            ]).then(() => {
              // get details
              this.getWorkTaskDetails();
              
              if (this.isEntityWorkflow) {
                this.setRefreshStageHistory();
              }
            });
          }).catch(()=>{
            this.getWorkTaskDetails();
            
            if (this.isEntityWorkflow) {
              this.setRefreshStageHistory();
            }
          });
        }
        else
        {
          this.selectedStage = this.currentStage;
        }
      });
    }
    else {
      Promise.all([
        this.updateEntityStage(dropEntityStageId, dropEntityStageDetail, isShowStageChangeConfirmationBox, isReopenedStage),
      ]).then(() => {
        // get details
        this.getWorkTaskDetails();
        if (this.isEntityWorkflow) {
          this.setRefreshStageHistory();
        }
      }).catch(()=>{
        this.getWorkTaskDetails();
        if (this.isEntityWorkflow) {
          this.setRefreshStageHistory();
        }
      });
    }
  }

  // update workflow entity stage values
  updateEntityStage(dropEntityStageId, dropEntityStageDetail, isShowStageChangeConfirmationBox:boolean, isReopenedStage: boolean) {
    this.optionsForPopupDialog.size = 'md';
    return new Promise((resolve, reject) => {
      if(isShowStageChangeConfirmationBox){
        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('WORKTASK.CHANGE_STAGE_CONFIRMATION'), null, null, this.optionsForPopupDialog).then((confirmed) => {
          if (confirmed) {
            return this.afterUpdateEntityStage(dropEntityStageId, dropEntityStageDetail, isReopenedStage);
          }
        });
      }
      else{
        return this.afterUpdateEntityStage(dropEntityStageId, dropEntityStageDetail, isReopenedStage);
      }
    });
  }

  afterUpdateEntityStage(dropEntityStageId, dropEntityStageDetail, isReopenedStage: boolean){
    return new Promise((resolve, reject) => {
      let assignedToForDto = this.copyOfworkTask.assignedTo;
      this._commonHelper.showLoader();
      let currentStageId = this.worktaskStages.find(x => x.id == this.workTaskDetails.entityStageId)?.id;
      let dropStage = this.worktaskStages.find(x => x.id == dropEntityStageId);
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: this.entityId, stageId: dropEntityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedToForDto, verifiedBy: this.copyOfworkTask.verifiedBy, oldStageId: currentStageId}).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          if(dropStage.isCompleted || dropStage.isClosed)
          {
            this.refreshLinkedWorkTasks = true;
            this.refreshSubWorkTasks = !this.refreshSubWorkTasks;
          }
          this.worktaskAssignedTo = response;
          if (assignedToForDto != this.worktaskAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._workTaskService.updateWorkTaskAssignedTo({ entityId: this.entityId, assignedToId: this.worktaskAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.worktaskAssignedTo.isForcedAssignment }).then((response: any) => {
              if (response) {
                assignedToForDto = this.worktaskAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.MESSAGE_WORK_TASK_MOVETO_STAGE',
                  { stageName: dropEntityStageDetail.name })
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
            if(isReopenedStage) {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.MESSAGE_WORK_TASK_STAGE_REOPEN', {
                  entityName: this.workTaskDetails?.name !== null ? this.workTaskDetails?.name : " " })
              )
            }else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.MESSAGE_WORK_TASK_MOVETO_STAGE',
                  { stageName: dropEntityStageDetail.name })
              );
            }
          }
        }
         // get details
         this.getWorkTaskDetails();
         if (this.isEntityWorkflow) {
          this.setRefreshStageHistory();
        }
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

  // event emitted from kanban
  onRelatedToClick(workTask) {
    // check logged in user have permission to view related entity details
    if (!this._commonHelper.isUserHaveViewPermissionOfRelatedEntity(workTask.entityTypeId)) {
      return;
    }

    // if not undefined then redirect
    if (workTask.entityTypeName != undefined && workTask.entityID != undefined) {
      this._router.navigateByUrl('/' + this._commonHelper.getRouteNameByEntityTypeId(workTask.entityTypeId).toLowerCase() + '/details/' + workTask.entityID);
    }
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'worktasks.closedorcompleted') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.WORKTASKS_CLOSEDORCOMPLETED', { stageName: error.data.stageName }));
      }
      else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      }
      else if (error.messageCode == 'WorkTask.NoAccess') {
        this.hasPermission = false;
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }

  onBack() {
    this._location.back();
  }

  closeForm() {
    this._router.navigate(['worktasks/workflow/' + this.entityWorkflowId]);
  }

  createDynamicControlId(idPrefixValue, stageName) {
    return this._commonHelper.createDynamicControlId(idPrefixValue, stageName);
  }

  setRefreshEntityTag() {
    this.refreshEntityTag = !this.refreshEntityTag;
  }

  setRefreshActivityHistory() {
    this.refreshActivityHistory = false;
    setTimeout(() => {
      this.refreshActivityHistory = true;
    }, 500);
  }

  setRefreshDocument() {
    this.refreshDocument = false;
    setTimeout(() => {
      this.refreshDocument = true;
    }, 500);
  }

  setRefreshStageHistory() {
    this.refreshStageHistory = false;
    setTimeout(() => {
      this.refreshStageHistory = true;
    }, 500);
  }

  //DD 20220329: SDC-145: Hide edit button on stage history tab
  // set current active tab
	setTab(activeInfo) {
    this.isAdditionalTab = activeInfo.isAdditionalTab;
    this.activeTab = activeInfo.tab.tabLink;
    this.selectedTab = activeInfo.tab.tabLink;
    if (!this.onceLinkedWorkTaskClicked && this.activeTab == 'navLinkedWorkTasks') {
      this.onceLinkedWorkTaskClicked = true;
    }

    if (!this.onceSubWorkTaskClicked && this.activeTab == 'navSubWorkTasks') {
      this.onceSubWorkTaskClicked = true;
    }

    if(!this.onceStageHistoryClicked && this.activeTab == 'navHistory') {
      this.onceStageHistoryClicked = true;
    }

    if (this.activeTab == 'navTimeline' && !this.onceTimeLineClicked) {
      this.onceTimeLineClicked = true;
      this.getTimelineDetail();
    }

    if (this.activeTab == 'navDocuments' && !this.onceDocumentClicked) {
      this.onceDocumentClicked = true;
    }
  }

  refreshChildComponent(componentName: string) {
    switch (componentName) {
      case "LinkedWorkTasks": {
        this.refreshLinkedWorkTasks = false;
        break;
      }
      case "SubWorkTasks": {
        this.refreshSubWorkTasks = false;
        break;
      }
    }
  }

  private setLinkedWorkTaskTabParameters(): void {
    this.tblLinkedWorkTaskParameters = [{
      name: 'WorkTaskID',
      type: 'int',
      value: this.workTaskId
    }]
  }

  private setSubWorkTaskTabParameters(): void {
    this.tblSubWorkTaskParameters = [{
      name: 'WorkTaskID',
      type: 'int',
      value: this.workTaskId
    }]
  }

  addSubTask(subTaskTypeId: number, subTaskTypeName: any) {
    if (this.workTaskDetails != null && (this.workTaskDetails.isPaused || this.isCompleted || this.isClosed)) {
      return;
    }

    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddSubTaskComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.parentId = this.workTaskDetails.id;
    this.modalRef.componentInstance.entityTypeId = this.workTaskDetails.entityTypeID;
    this.modalRef.componentInstance.entityId = this.workTaskDetails.entityID;
    this.modalRef.componentInstance.workflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.parentEntityTypeId = this.workTaskDetails?.entityTypeID;
    this.modalRef.componentInstance.entityRecordTypes = this.recordTypesDetail.filter(x => x.parentEntityTypeID == this.workTaskDetails?.entityTypeID).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.typeId = subTaskTypeId;
    this.modalRef.componentInstance.parentTypeId = this.workTaskDetails?.typeID;
    this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.SUB_WORK_TASKS_TAB.ADD_SUBTASK_PREFIX') + " " + subTaskTypeName;
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.SubWorkTaskPopup;
    this.modalRef.componentInstance.parentPrivacyLevel = this.workTaskDetails.privacyLevel;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        if (this.onceSubWorkTaskClicked) {
          this.refreshSubWorkTasks = !this.refreshSubWorkTasks;
        } 
        if (this.onceTimeLineClicked) {
          this.getTimelineDetail();
        }
      }
    });
  }

  linkWorktask() {
    this.modalRef = this._modalService.open(LinkWorkTaskDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDCONTACT.ADD_DIALOG_TITLE'));
    this.modalRef.componentInstance.workTaskId = this.workTaskId;
    this.modalRef.componentInstance.entityWorkFlowId = this.entityWorkflowId ?? null;

    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshLinkedWorkTasks = true
      }
    });
  }

  deleteWorkTaskLink(id: any) {
    if (+id > 0) {
      this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.LINKED_WORK_TASKS_TAB.DELETE_LINKEDWORKTASK_DIALOG_TEXT'), null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._workTaskService.deleteWorkTaskLink(id).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.LINKED_WORK_TASKS_TAB.MESSAGE_DELETE_LINKEDWORKTASK_SUCCESS'));
            this.refreshLinkedWorkTasks = true;
          }, (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error.message);
            this.refreshLinkedWorkTasks = true;
          });
        }
      });
    }
  }

  
  deleteSubWorkTask(workTask) {
    if (this.workTask.isPaused || this.isCompleted || this.isClosed) {
      return;
    }
    
    this._commonHelper.showLoader();
    this._workTaskService.isSubWorkTaskExist(workTask.id).then((res: any) => {
      this._commonHelper.hideLoader();
      let hasSubWorkTask: boolean = res?.isExist || false;

      if (hasSubWorkTask) {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.WORKTASKS_SUBWORKTASKEXISTMESSAGEBEFOREPARENTTASKDELETE', { entitySubTypeName: this.availableSubWorkTaskTypeNamesForWorkTaskDelete })
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
        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_CONFIRM_SUBWORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' }), null, null, optionsForConfirmDialog)
        .then((confirmed) => {
          if (confirmed) {
            this._commonHelper.showLoader();
            this._workTaskService.deleteWorkTask((workTask.id)).then(response => {
              this._commonHelper.hideLoader();
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('WORKTASK.LIST.MESSAGE_SUBWORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' })
              );
              // get work tasks
              
              if (this.onceSubWorkTaskClicked) {
                this.refreshSubWorkTasks = !this.refreshSubWorkTasks;
              }
              
              if (this.onceTimeLineClicked) {
                this.getTimelineDetail();
              }
            },
              (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
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
  getEntityTotalReportingTime() {
    this._workflowmanagementService.getEntityTotalReportingTime(this.workTaskId,this.entityTypeId).then((response: any) => {
      if (response) {
        this.totalSpentTime = new TimeFramePipe().transform(+response?.totalSpentTime, this.hoursInDay);
        this.totalEffectiveTime = new TimeFramePipe().transform(+response?.totalEffectiveTime, this.hoursInDay);
        this.totalPauseTime = new TimeFramePipe().transform(+response?.totalPauseTime, this.hoursInDay);
      }
    },
      (error) => {
        this.getTranslateErrorMessage(error);
      });
  }  

  onChangeRelateTo(e) {
    this.selectedRelatedToEntityTypeID=e.value;
    this.setRelateToEntityDisplay(e.value);
  }

  onValueChange(value) {
    this.SelectedEntityId = value;
    this.workTaskDetails.entityID = value;
}

  setRelateToEntityDisplay(relatedEntityTypeId) {
    const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == relatedEntityTypeId);
    if (foundRecord) {
      this.relatedToName = foundRecord?.['displayName'].toString().trim();
      this.SelectedEntityTypeId = relatedEntityTypeId;
    }
    else {
      this.relatedToName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.DETAILS_TAB.RELATED_TO'));;
    }
  }

  findInvalidControls() {
    const invalid = [];
    const controls = this.workTaskDetailForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }

  navigateToTabByValidation() {
    let findInCustomTab: boolean = false;
    let customTabLink: string = '';
    let original_customTabLink: string = '';
    let inValidControls: any[] = this.findInvalidControls();
    if (inValidControls.length > 0) {
      this.formDataJSON.forEach(tab => {
        tab.sections.forEach(section => {
          section.controls.forEach(control => {
            const controlExists = inValidControls.find(x => x === control.fieldName);
            if (controlExists) {
              original_customTabLink = tab.tabName;
              customTabLink = tab.tabName.replace(/\s/g, "");
              findInCustomTab = true;
              return;
            }
          })
        });
      });
      if (this.tabLayout?.toLowerCase() === TabLayoutType.ADDITIONAL_TAB.toLowerCase()) {
        //Auto Redirect to Tab which is depen
        if (findInCustomTab) {
          if (this.navTabs.find(f => f.tabName?.toLocaleLowerCase() == original_customTabLink?.toLocaleLowerCase())) {
            document.getElementById('btn_nav' + customTabLink).click();
          }
          else {
            let tab = this.navTabsAll.find(f => f.tabName?.toLocaleLowerCase() == original_customTabLink?.toLocaleLowerCase())
            if (tab) {
              this.selectedTab = tab.tabLink;
              let param: any = {};
              param.isAdditionalTab = tab.tabLink === "additionalTabs";
              param.isNativeTab = true; // always true
              param.tab = tab;
              this.checkTabCall(param, false)
            }
          }
        } else {
          document.getElementById('btn_navDetails').click();
        }
      }
      else {
        if (findInCustomTab) {
          document.getElementById('btn_nav' + customTabLink).click();
        } else {
          document.getElementById('btn_navDetails').click();
        }
      }
    }
  }

  numberInputHandler(event) {
    if (event.key === "." || event.key === "-") {
      return false;
    }
  }

 /**
   * START
   * Moksh Dhameliya 25 May 2023
   * Additional Tabs Code 
   */
 async setTabLayout() {
  
  //Only configure once time when both are 0 for edit/save resolved issue
  if (this.navTabsAll.length > 0 && (this.nativeTabCount == this.navTabs.length )  ) {
    let isAdditionalTabExist = false;
      if (this.tabLayout?.toLowerCase() === TabLayoutType.ADDITIONAL_TAB.toLowerCase()) {
         this.navTabs = this.navTabsAll.filter(f => f.isNativeTab || f.isTabAlwaysVisible); // nativeTab 
        this.navTabsMore = this.navTabsAll.filter(f => !f.isNativeTab && !f.isTabAlwaysVisible); // custom tab
        //checking more tab exist for additional tab
        if (this.navTabsMore.length > 0) {
          isAdditionalTabExist = true;
          let objNavTab = {
            tabName: TabLayoutType.LABEL_ADDITIONAL_TAB,
            tabLink: 'additionalTabs',
            isFirst: false,
            condition: true,
            displayOrder: this.navTabs[this.navTabs.length - 1].displayOrder + 1,
            isNativeTab: true
          }
          objNavTab.condition = true;
          this.navTabs.push(objNavTab);
          this.nativeTabCount = this.navTabs.length;
        }
        else {
          isAdditionalTabExist = false;
        }
      }else {
        this.navTabsAll.forEach((f) => {
          (f.showCloseTabIconBtn = false)
        });
      }
      if (!isAdditionalTabExist) {
        this.navTabs = this._commonHelper.deepClone(this.navTabsAll);
        this.isNativeTab = true;
        this.isAdditionalTab = false;
      }
      //Tab Order Sorting
      this.navTabs = this.navTabs?.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
      this.navTabsMore = this.navTabsMore?.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
      // set first as default
      if (this.selectedTab == ''){
        this.setDefaultTab();
      }
    }
  }

  private setDefaultTab() {
    let defaultTab = this.navTabs[0];
    let isBypassAutoTabEvent: boolean = false;
    if (this.forceRedirectionTabName != null && this.forceRedirectionTabName != '') {
      if (this.navTabs?.some(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())) {
        defaultTab = this.navTabs.filter(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())[0];

        // Redirect to Native Tab
        let param: any = {};
        param.isAdditionalTab = defaultTab.tabLink === "additionalTabs";
        param.isNativeTab = true; // always true
        param.tab = defaultTab;
        this.checkTabCall(param, 1);
      }
      else if (this.navTabsMore?.some(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())) {
        defaultTab = this.navTabsMore.filter(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())[0];

        // Generate Tab and Redirect to Custom Tab
        let param: any = {};
        param.isAdditionalTab = false;
        param.isNativeTab = true; // always true
        param.tab = defaultTab;
        this.checkTabCall(param, 0);

        //No need to initiate autoTabEventEvent event as it is already initiated in CheckTabCall Function
        isBypassAutoTabEvent = true;
      }
    }
    else {
      // Redirect to first tab in the array which was already sorted by display order
      let param: any = {};
      param.isAdditionalTab = defaultTab.tabLink === "additionalTabs";
      param.isNativeTab = true; // always true
      param.tab = defaultTab;
      this.checkTabCall(param, 1);
    }

    this.selectedTab = defaultTab.tabLink;
    if (!isBypassAutoTabEvent) {
      this._commonHelper.autoTabEventEvent.next(defaultTab);
    }
  }
  
  //Checking Tab Return call from globle tab
  checkTabCall(paramTab, isNativeTab) {
    this.previousActiveTabIndex = this.currentActiveTabIndex;
    this.isNativeTab = paramTab.isNativeTab;
    this.isAdditionalTab = paramTab.isAdditionalTab;
    if (!isNativeTab) {
      const tabExist = this.navTabs.find(x => x.tabLink === paramTab.tab.tabLink);
      if(this.navTabs.lastIndexOf(paramTab.tab)) {
        paramTab.tab.showButtonActive = true;
      }
      if (!tabExist) {
        this.navTabs.push(paramTab.tab);
      }
      this.currentActiveTabIndex = this.navTabs.findIndex(x => x.tabLink === paramTab.tab.tabLink)
      this.selectedTab = this.navTabs[this.currentActiveTabIndex].tabLink;
      this._commonHelper.autoTabEventEvent.next(paramTab.tab);
    }
    this.currentActiveTabIndex = this.navTabs.findIndex(x => x.tabLink === paramTab.tab.tabLink);
    this.setTab(paramTab);
  }

  //close specific additionalTabs
  closeNavTab(paramTab) {
    let index: any;
    let isSameTab;

    const removeNavtab = this.navTabs.findIndex(e => e.tabLink === paramTab.tab.tabLink);
    if(this.previousActiveTabIndex > removeNavtab)
      this.previousActiveTabIndex--;
    if(removeNavtab > -1) {
      if(removeNavtab === this.navTabs.findIndex(e => e.tabLink === this.activeTab)) {
        isSameTab = true;
        index = this.previousActiveTabIndex;
        this.currentActiveTabIndex = this.previousActiveTabIndex;
      }else {
        index = this.currentActiveTabIndex;
      }
      this.navTabs.splice(removeNavtab, 1);
      paramTab.tab.showButtonActive = false
      if (this.previousActiveTabIndex > this.navTabs.length - 1) {
        this.previousActiveTabIndex = this.navTabs.length - 1;
        if(isSameTab) {
          index = this.previousActiveTabIndex;
        }
      }
    }

    const paramTab1 = this.navTabs[index];
    paramTab1.isAdditionalTab = paramTab1.tabLink === "additionalTabs";
    paramTab1.tab = paramTab1;
    this._commonHelper.autoTabEventEvent.next(paramTab1.tab);
    this.setTab(paramTab1.tab);
  }

  // get tenant setting for tab layout
  private getTabLayoutTenantSetting() {
    return new Promise((resolve, reject) => {
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.WORKTASK_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.WORKTASK_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.WORKTASK_TAB_LAYOUT}`, JSON.stringify(response));
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            resolve(this.tabLayout);
          });

      }
      else {
        this.tabLayout = tabLayout;
        resolve(null);
      }
    });
  }
  getWorkflowDetail(entityWorkflowId): Promise<any> {
    return new Promise((resolve, reject) => {

      //storage key
      let storageKey = `${LocalStorageKey.WorkTaskWorkflowDetailsKey}_${entityWorkflowId}`;

      // get data
      const workflowDetail = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (workflowDetail == null) {
        this._commonHelper.showLoader();
        this.isInitialLoading = true;
        this._workflowmanagementService.getWorkflowDetail(entityWorkflowId)
          .then((response: any) => {
            if (response.layoutTypeID == LayoutTypes.ListView) {
              this.isListViewLayout = true;
            } else { this.isListViewLayout = false; }

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
        if (workflowDetail && workflowDetail?.layoutTypeID == LayoutTypes.ListView) {
          this.isListViewLayout = true;
        } else { this.isListViewLayout = false; }

        resolve(workflowDetail);
      }
    });
  }

  //get Entity Record Type
  private getEntityRecordTypes() {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
    if (allEntityRecordTypes == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS');
            this.recordTypesDetail = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS');
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
      this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS');
      this.recordTypesDetail = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS');
    }
  }

  private getEntitySubTypes() {
    return new Promise((resolve, reject) => {
      let storageKey = `${LocalStorageKey.ALLENTITYSUBTYPES}`;
      const allEntitySubTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntitySubTypes == null) {

        this._commonHelper.showLoader();
        this._commonService.getEntitySubTypes().then((response: any) => {
          if (response) {
            this.entitySubTypes = response.sort((a, b) => a.parentID - b.parentID);;
            
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
  /**
 * END
 * Additional Tabs Code 
 */

  //#region Timeline  Events
  private getTimelineDetail() {
    this.timelineLoader = true;
    this._workTaskService.getWorkTaskTimeLine(this.workTaskId).then(res => {
      this.timelineLoader = false;
      if (res) {
        this.timelineResponse = res as any[];
      }
    }, (error) => {
      this.timelineLoader = false;
      this.getTranslateErrorMessage(error);
    });
  }

  addSubTaskTimeLine(obj: any) {

    if (this.workTaskDetails != null && (this.workTaskDetails.isPaused || this.isCompleted || this.isClosed)) {
      return;
    }

    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddSubTaskComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.parentId = obj.entityID
    this.modalRef.componentInstance.entityTypeId = this.workTaskDetails.entityTypeID;
    this.modalRef.componentInstance.entityId = this.workTaskDetails.entityID;
    this.modalRef.componentInstance.workflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.parentEntityTypeId = this.workTaskDetails?.entityTypeID;
    this.modalRef.componentInstance.entityRecordTypes = this.recordTypesDetail.filter(x => x.parentEntityTypeID == this.workTaskDetails?.entityTypeID).map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.typeId = obj.typeID;
    this.modalRef.componentInstance.parentTypeId = obj.parentTypeID;
    this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.SUB_WORK_TASKS_TAB.ADD_SUBTASK_PREFIX') + " " + obj.typeName;
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.SubWorkTaskPopup;
    this.modalRef.componentInstance.parentPrivacyLevel = this.workTaskDetails.privacyLevel;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.getTimelineDetail();
      }
    });
  }
  //#endregion

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
            this.setHiddenFieldFlags();
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
        this.setHiddenFieldFlags();
        resolve(null);
      }
    });
  }

  setHiddenFieldFlags() {
    //Header Section
    this.hiddenFieldStatus = !this._isEntityFieldHiddenPipe.transform(this.entityHiddenFieldSettings, this.entityTypeId, this.sectionCodes.HeaderSection, this.fieldNames?.Status);
    this.hiddenFieldCreated = !this._isEntityFieldHiddenPipe.transform(this.entityHiddenFieldSettings, this.entityTypeId, this.sectionCodes.HeaderSection, this.fieldNames?.Created);
    this.hiddenFieldUpdated = !this._isEntityFieldHiddenPipe.transform(this.entityHiddenFieldSettings, this.entityTypeId, this.sectionCodes.HeaderSection, this.fieldNames?.Modified);
    this.hiddenFieldRelatedTo = !this._isEntityFieldHiddenPipe.transform(this.entityHiddenFieldSettings, this.entityTypeId, this.sectionCodes.HeaderSection, this.fieldNames?.RelatedTo);
    this.hiddenFieldEstimatedMins = !this._isEntityFieldHiddenPipe.transform(this.entityHiddenFieldSettings, this.entityTypeId, this.sectionCodes.HeaderSection, this.fieldNames?.EstimatedMins);
    this.hiddenFieldEstimatedPoints = !this._isEntityFieldHiddenPipe.transform(this.entityHiddenFieldSettings, this.entityTypeId, this.sectionCodes.HeaderSection, this.fieldNames?.EstimatedPoints);
    this.hiddenFieldElapsedTime = !this._isEntityFieldHiddenPipe.transform(this.entityHiddenFieldSettings, this.entityTypeId, this.sectionCodes.HeaderSection, this.fieldNames?.TotalElapsedTime);
    this.hiddenFieldEffectiveTime = !this._isEntityFieldHiddenPipe.transform(this.entityHiddenFieldSettings, this.entityTypeId, this.sectionCodes.HeaderSection, this.fieldNames?.TotalEffectiveTime);
    this.hiddenFieldPauseTime = !this._isEntityFieldHiddenPipe.transform(this.entityHiddenFieldSettings, this.entityTypeId, this.sectionCodes.HeaderSection, this.fieldNames?.TotalPauseTime);
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

  
//navigate to edit page
editLinkWorkTask(id) {
  this.getLinkWorkTaskDetail(id);
}

  getLinkWorkTaskDetail(id: number)
  {
    if (id > 0) {
      this._commonHelper.showLoader();
      this._workTaskService.getWorkTaskRelation(id).then((response: any) => {
        if (response) {
            this._commonHelper.hideLoader();
            this.openLinkWorkTaskEditPopup(response);
        }
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
    }

  openLinkWorkTaskEditPopup(workTaskDetail)
  {
    this.modalRef = this._modalService.open(LinkWorkTaskDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDCONTACT.ADD_DIALOG_TITLE'));
    this.modalRef.componentInstance.id = workTaskDetail.id;
    this.modalRef.componentInstance.workTaskId = this.workTaskId;
    this.modalRef.componentInstance.entityWorkFlowId = this.entityWorkflowId ?? null;
    this.modalRef.componentInstance.relationTypeId = workTaskDetail.relationTypeId;
    this.modalRef.componentInstance.relatedTo = workTaskDetail.relatedTo;
    this.modalRef.componentInstance.isEdit = true;

    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshLinkedWorkTasks = true
      }
    });
  }

  //delete work task - confirmation dialog
  onDeleteWorkTaskClick(workTask) {
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

        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.MESSAGE_CONFIRM_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' }), null, null, optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._workTaskService.deleteWorkTask(workTask.id).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.MESSAGE_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' })
                );
                // Redirect work tasks Listing Page.
                this._router.navigateByUrl('/worktasks/list');
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                });
            }
          })
          .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.WORKTASK_DISMISS_DIALOG')));
      }
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  onWorkTaskStagePauseChanged(workTask: any, isPaused: boolean) {
    if (!this.isEditWorkTask) { return; }

    if (workTask.assignedTo !== this._loggedInUser.userId) {
      let message = "";
      if (workTask.assignedTo == null || workTask.assignedTo == "" || workTask.assignedTo == undefined) {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('WORKTASK.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.workTaskStagePauseChange(workTask, isPaused);
          }
        });
    }
    else if (workTask.assignedTo == this._loggedInUser.userId) {
      this.workTaskStagePauseChange(workTask, isPaused);
    }
  }

  workTaskStagePauseChange(workTask, isPaused: boolean) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: workTask.id,
      entityStageId: workTask.entityStageId,
      isPaused: isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: workTask.assignedTo,
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
          this.modalRef.componentInstance.stageId = workTask.entityStageId;
          this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
          this.modalRef.componentInstance.isSaveNote = true;

          this.modalRef.result.then(noteDate => {
            if (noteDate) {
              params.noteID = noteDate.id;
              this.saveEntityStagePauseTransition(params, workTask);
            }
          });
        } else {
          this.getWorkTaskDetails();
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
          this.saveEntityStagePauseTransition(params, workTask);
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

  saveEntityStagePauseTransition(params, workTask) {
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

  onWorkTaskRaiseHandChanged(worktask: any, isHandRaised: boolean) {
    if (worktask != null && (worktask.isPaused || !this.isEditWorkTask)) {
      return;
    }

    if (worktask.assignedTo == this._loggedInUser.userId) {
      const params = {
        entityTypeId: this.entityTypeId,
        entityId: worktask.id,
        entityStageId: worktask.entityStageId,
        isHandRaised: isHandRaised,
        entityWorkflowId: this.entityWorkflowId,
        assignedTo: worktask.assignedTo
      }

      this._commonHelper.showLoader();
      this._workflowmanagementService.saveEntityStageRaiseHandTransition(params)
        .then(() => {
          worktask.isHandRaised = isHandRaised;
          this._commonHelper.hideLoader();
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          this.getWorkTaskDetails();
        });
    } else {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.RAISEHAND_WORKTASKASSIGNUSERMISMATCH'))
    }
  }
}
