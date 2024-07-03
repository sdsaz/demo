//ANGUlAR
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormControl, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { DataSources, Entity, FieldNames, LayoutTypes, LocalStorageKey, ProcessEntityWorkflowStageValueNoteType, PublicTenantSettings, SectionCodes, TabLayoutType } from '../../../@core/enum';
//SERVICES
import { CasesService } from '../cases.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { SettingsService } from '../../settings/settings.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
//COMPONENTS
import { ReasonDialogComponent } from '../../../@core/sharedComponents/notes/reason-dialog/reason-dialog.component';
//PIPES
import { timeFrameValidator } from '../../../@core/sharedValidators/time-frame.validator';
import { TimeFramePipe } from '../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { TimeFrameToMinutesPipe } from '../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
//OTHER
import * as moment from 'moment';
import { WorkTasksService } from '../../worktasks/worktasks.service';
import { DynamicTableParameter } from '../../../@core/sharedModels/dynamic-table.model';
import { WorktaskAddComponent } from '../../worktasks/worktask-add/worktask-add.component';
import { IsEntityFieldHiddenPipe } from '../../../@core/pipes/is-entity-field-hidden/is-entity-field-hidden.pipe';
import { NoteService } from '../../../@core/sharedComponents/notes/notes.service';

@Component({
  selector: 'ngx-case-detail',
  templateUrl: './case-detail.component.html',
  styleUrls: ['./case-detail.component.scss']
})
export class CaseDetailComponent implements OnInit {

  private caseTxtNameRef: ElementRef;
  @ViewChild('casesTxtName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.caseTxtNameRef = content;
    }
  }

  entityId: number;
  entityTypeId: number = Entity.Cases;
  entityWorkflowId: any = null;
  entityRecordTypeId: number;
  isEntityWorkflow: boolean = false;
  relatedEntityTypeId: number = 0;
  relatedEntityRecordTypeId: number = 0;
  relatedToNameForHeader: string;
  relatedToNamePlaceholder: string;
  relatedToName: string;
  relatedToIcon: string;
  relatedToIconToolTip: string;

  caseId: number = 0;
  caseName: string;

  privacyLevel: number;

  casesStages: Array<any> = [];

  formMode: string;

  casesCustomFields: any[] = [];
  formDataJSON: any[] = [];

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
  isForceReloadRelatedTo: boolean = true;

  // permissions
  isEditCases: boolean = false;
  isViewCases: boolean = false;
  isAddSubCase: boolean = false;
  isDeleteSubCase: boolean = false;
  isResumeRecord: boolean = false;
  changeCasesStage: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  hasPermission: boolean = false;
  isInitialLoading: boolean = true;
  isListWorkTask: boolean = false;
  isAddWorkTask: boolean = false;
  isAllowToReopen: boolean = false;
  isAssignCase: boolean = false;
  isDeleteCase: boolean = false;

  isCompleted: boolean = false;
  isClosed: boolean = false;
  SelectedEntityTypeId:any;
  SelectedEntityId:any;

  cases: any
  copyOfCases: any;
  casesDetails: any = {};

  // create form
  casesDetailForm: UntypedFormGroup;
  copyOfCasesDetailFormValues: any;
  caseAssignedTo: any;
  // submitted
  submitted: boolean = false;

  // loader
  isLoaded: boolean = false;

  //user detail
  loggedInUser: any;

  isListViewLayout: boolean = true;

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

  tinyMceApiKey: string = '';
  currentDate = new Date();
  public getCurrentDate() {
    return this.currentDate;
  }

  //Related to
  relatedToList: any = null; //related to entity records
  isShowRelatedTo: boolean = true;
  possibleEntityTypeIdsForRelatedTo: any = null;
  isRelatedToGroupDropDown: boolean = true;
  selectedRelatedToEntityTypeID = null;

  recordTypes: any;

  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  refreshCustomFieldDatasource: boolean = false;
  refreshDocument: boolean = false;

  selectedTab: string = '';

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

  currentYearRange: string = this.currentDate.getFullYear().toString() + ":" + this._commonHelper.globalMaxDate.getFullYear().toString();

  entityStagesWithTasksStorageKey: string = LocalStorageKey.CaseEntityStageWithTasksKey;

  currencySymbol:any = null;
  hoursInDay:number = null;

  activeTab = '';
  
  onceLinkedCasesClicked: boolean = false;
  refreshLinkedCases: boolean = false;
  onceSubCaseClicked: boolean = false;
  onceStageHistoryClicked: boolean = false;
  refreshSubCases: boolean = false;
  onceWorkTaskClicked: boolean = false;
  onceDocumentClicked: boolean = false;

  // tblSubCaseParameters: Array<DynamicTableParameter> = [];
  // tblLinkedCaseParameters: Array<DynamicTableParameter> = [];

  // flag for details readonly
  isReadOnly: boolean = true;

  currentStage: any;
  selectedStage: any;

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

  fromEntityStageId: any;

  tbWorktaskParameters: Array<DynamicTableParameter> = [];
  refreshWorkTaskTab: boolean = false;
  
  // worktask tab
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  entitySubTypes: any = [];
  workTaskSubTypeDetails: any;
  availableSubWorkTaskTypeDetails:any;
  availableSubWorkTaskTypeNamesForWorkTaskDelete: any;

  cases_validation_messages = {
    'name': [
      { type: 'required', message: 'CASES.DETAIL.DETAILS_TAB.NAME_REQUIRED' },
      { type: 'maxlength', message: 'CASES.DETAIL.DETAILS_TAB.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'CASES.DETAIL.DETAILS_TAB.MESSAGE_NAME_MIN' }
    ],
    'description': [
      { type: 'minlength', message: 'CASES.DETAIL.DETAILS_TAB.MESSAGE_DESCRIPTION_MIN' }
    ],
    'entityID': [
      { type: 'required', message: 'CASES.DETAIL.DETAILS_TAB.RELATED_TO_REQUIRED' }
    ],
    'estimatedMins': [
      { type: 'required', message: 'CASES.DETAIL.DETAILS_TAB.ESTIMATION_TIME_VALIDATION_REQUIRED' },
      { type: 'invalidTimeFrame', message: 'CASES.DETAIL.DETAILS_TAB.ESTIMATION_TIME_VALIDATION' },
      { type: 'timeTooLarge', message: 'CASES.DETAIL.DETAILS_TAB.ESTIMATION_TIME_LENGTH_VALIDATION' },
      { type: 'timeTooSmall', message: 'CASES.DETAIL.DETAILS_TAB.ESTIMATION_TIME_MINIMUM_VALIDATION' }
    ],
    'estimatedPoints': [
      { type: 'required', message: 'CASES.DETAIL.DETAILS_TAB.ESTIMATION_POINTS_REQUIRED_VALIDATION' },
      { type: 'min', message: 'CASES.DETAIL.DETAILS_TAB.ESTIMATION_POINTS_MIN_VALIDATION' },
      { type: 'max', message: 'CASES.DETAIL.DETAILS_TAB.ESTIMATION_POINTS_MAX_VALIDATION' }
    ],
    'entityStageId': [{ type: 'required', message: 'CASES.DETAIL.DETAILS_TAB.STATUS_REQUIRED' }],
  };

  entityHiddenFieldSettings: any[];
  fieldNames = FieldNames;
  sectionCodes = SectionCodes;

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
    private _casesService: CasesService,
    private _formBuilder: UntypedFormBuilder,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService,
    private _commonService: CommonService,
    private _workTaskService: WorkTasksService,
    
    private _location: Location,
    private _workflowmanagementService: WorkflowmanagementService,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _isEntityFieldHiddenPipe: IsEntityFieldHiddenPipe,
    private _noteService: NoteService) { 

    this.isEditCases = this._commonHelper.havePermission(enumPermissions.EditCase);
    this.isViewCases = this._commonHelper.havePermission(enumPermissions.ViewCase);
    this.isAddSubCase = this._commonHelper.havePermission(enumPermissions.AddSubCase);
    this.isDeleteSubCase = this._commonHelper.havePermission(enumPermissions.DeleteSubCase);
    this.changeCasesStage = this._commonHelper.havePermission(enumPermissions.ChangeCaseStage);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadCaseDocument);
    this.isListWorkTask = this._commonHelper.havePermission(enumPermissions.ListWorkTasks);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAllowToReopen = this._commonHelper.havePermission(enumPermissions.AllowToReopen);
    this.isAssignCase = this._commonHelper.havePermission(enumPermissions.AssignCase);
    this.isDeleteCase = this._commonHelper.havePermission(enumPermissions.DeleteCase);
    this.isResumeRecord = this._commonHelper.havePermission(enumPermissions.ResumeTask);
    
    this.hasPermission = this.isEditCases || this.isViewCases;

    this.tinyMceApiKey = this._commonHelper.globalTinymceApiKey;
    
    //Allows to reload same component while navigation
    this._router.routeReuseStrategy.shouldReuseRoute = function() { return false; };
    this.readRouteParameter();
    
    Promise.all([
      this.getTabLayoutTenantSetting(),
      this.getEntityRecordTypes(),
      this.getWorktaskWorkflowList(),
      this.getEntityHiddenField(),
      this.getEntitySubTypes()
    ]).then(() => {
      this.setTabLayout();
    });
  }


  ngOnInit(): void {
    this.loggedInUser = this._commonHelper.getLoggedUserDetail();

    if (this.hasPermission) {      
      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.setWorkTaskTabParameters(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getWorkflowList(),
        this.getEntityRecordTypes(),
        this.getCountries()
      ]).then(() => {
        this.getCasesCustomFields();
      }, error => {
        this._commonHelper.hideLoader();
      });
    }
  }

  private readRouteParameter(): void {
    // If Record Edit then set record edit id
    this._activeRoute.params.subscribe(param => {
      if (param['id'] !== undefined) {
        if (param['id'] !== null) {
          this.caseId = param['id'];
          this.entityId = this.caseId;
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
    
    // prepare params
    let assignedToId = this.casesDetails.assignedTo; // owner 1 is assigned to
    let caseStageId = this.casesDetails.entityStageId;
    // get datasource details
    var params = this.prepareParamsForAssignedToUsers(caseStageId, assignedToId, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CASEASSIGNEDTO, params).then(response => {
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

  // get verified users
  getVerifiedByUsers(includeAllUsers = 1, searchString = null) {
    this.showVerifiedByLoader = true;
    // prepare params
    let verifiedBy = this.casesDetails.verifiedBy;
    let caseStageId = this.casesDetails.entityStageId;
    // get datasource details
    const params = this.prepareParamsForVerifiedByUser(caseStageId, verifiedBy, includeAllUsers, searchString);
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CASEVERIFIEDBY, params).then(response => {
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
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_Cases));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_Cases, JSON.stringify(response));
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
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflows = response;
            this.workflows.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.DETAIL.FILTER_OPTION_TEXT_WORKFLOW') });
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

  relatedToOnChange(e) {
    
    this.selectedRelatedToEntityTypeID=e.value;
    this.setRelateToEntityDisplay(e.value);
  }
  setRelateToEntityDisplay(relatedEntityTypeId) {
    const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == relatedEntityTypeId);
    if (foundRecord) {
      this.relatedToName = foundRecord?.['displayName'].toString().trim();
      this.SelectedEntityTypeId = relatedEntityTypeId;
    }
    else {
      this.relatedToName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.DETAIL.ENTITY_NAME_LABEL'));;
    }
  }

  onValueChange(value) {
    this.SelectedEntityId = value;
    this.casesDetails.entityID = value;
}
  
  findInvalidControls() {
    const invalid = [];
    const controls = this.casesDetailForm.controls;
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
  getCasesCustomFields() {
    this._commonHelper.showLoader();
    this._casesService.getCaseCustomFields(this.entityTypeId, this.entityId).then((res: any) => {
      if (res) {
        this.casesCustomFields = res || [];
        this.prepareFormDataInJSON();
        this.getCasesDetails();
      }
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        if (error.messageCode == 'Case.NoAccess') {
          this.getTranslateErrorMessage(error);
        }
        else {
          this._commonHelper.showToastrError(error.message);
        }
      });
  }

  // prepare form data in JSON format
  private prepareFormDataInJSON(): void {
    this.casesCustomFields.forEach((customField: any) => {
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
            if (this.cases.customFieldJSONData[control.fieldName] != null && this.cases.customFieldJSONData[control.fieldName] != '') {
              this.cases.customFieldJSONData[control.fieldName] = moment(new Date(this.cases.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.casesDetailForm.addControl(control.fieldName, new UntypedFormControl(this.cases.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.casesDetailForm.addControl(control.fieldName, new UntypedFormControl(this.cases.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.cases.customFieldJSONData[control.fieldName] != null && this.cases.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.cases.customFieldJSONData[control.fieldName] === 'string') {
                this.cases.customFieldJSONData[control.fieldName] = JSON.parse(this.cases.customFieldJSONData[control.fieldName]);
              }
            } else {
              this.cases.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.cases.customFieldJSONData[control.fieldName] != null && this.cases.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.cases.customFieldJSONData[control.fieldName];
              this.cases.customFieldJSONData[control.fieldName] = this.cases.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON['isRequired']) {
                this.casesDetailForm.addControl(control.fieldName, new UntypedFormControl(this.cases.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.casesDetailForm.addControl(control.fieldName, new UntypedFormControl(this.cases.customFieldJSONData[control.fieldName]));
              }
              this.cases.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.casesDetailForm.addControl(control.fieldName, new UntypedFormControl(this.cases.customFieldJSONData[control.fieldName]));
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
                  this.casesDetailForm.controls[control.fieldName].setValidators(validatorFn);
                  this.casesDetailForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.cases.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.cases.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.casesDetailForm.addControl(control.fieldName, new UntypedFormControl(this.cases.customFieldJSONData[control.fieldName]));
              this.casesDetailForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.casesDetailForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.casesDetailForm.addControl(control.fieldName, new UntypedFormControl(this.cases.customFieldJSONData[control.fieldName]));
              this.casesDetailForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.casesDetailForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.casesDetailForm.addControl(control.fieldName, new UntypedFormControl(this.cases.customFieldJSONData[control.fieldName], Validators.email));
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
              this.casesDetailForm.controls[control.fieldName].setValidators(validatorFn);
              this.casesDetailForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.casesDetailForm.addControl(control.fieldName, new UntypedFormControl(this.casesDetails.customFieldJSONData[control.fieldName]));
            if (this.casesDetails.customFieldJSONData[control.fieldName] != null && this.casesDetails.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.casesDetails.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.casesDetailForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") } );
              }
            } else {
              this.casesDetailForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.casesDetailForm.addControl(control.fieldName, new UntypedFormControl(this.cases.customFieldJSONData[control.fieldName]));
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
                this.casesDetailForm.controls[control.fieldName].setValidators(validatorFn);
                this.casesDetailForm.controls[control.fieldName].updateValueAndValidity();
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
      { tabName: 'WorkTask', tabLink: 'navWorkTasks', isFirst: true, condition: this.isListWorkTask, displayOrder: 201 },
      { tabName: '', tabLink: 'navHistory', isFirst: false, condition: true, displayOrder: 301 },
      { tabName: '', tabLink: 'navDocuments', isFirst: false, condition: true, displayOrder: 401 }
    ];

    this.setNativeTabDetails();
    
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

  private prepareTabsWithOrder(): void {
    this.formDataJSON.forEach(tab => {
      var objNavTab = {
        tabName: tab.tabName,
        tabLink: 'nav' + tab.tabName.replace(/\s/g, ""),
        isFirst: false,
        condition: true,
        displayOrder: tab.tabNumber,
        isNativeTab: false,
        isTabAlwaysVisible: tab.isTabAlwaysVisible,
        showCloseTabIconBtn: true,
        showButtonActive: false
      }

      this.navTabsAll.push(objNavTab);
    });
    this.navTabsAll = this.navTabsAll.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
    this.setTabLayout();
  }

  customfieldMultiSelectChange(event, fieldName) {
    const stringValue = event.value.toString()
    this.cases.customFieldJSONData[fieldName] = stringValue != '' ? stringValue : null;
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

  async setTabLayout() {
    //Only configure once time when both are 0 for edit/save resolved issue
    if (this.navTabsAll.length > 0 && (this.nativeTabCount == this.navTabs.length)) {
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
      } else {
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
      if (this.selectedTab == '') {
        this.setDefaultTab();
      }
    }
  }

  getEntityTotalReportingTime() {
    this._workflowmanagementService.getEntityTotalReportingTime(this.caseId, this.entityTypeId).then((response: any) => {
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

  getCasesDetails() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this.isInitialLoading = true;
      this._casesService.getCaseByID(this.caseId, this.entityWorkflowId).then((response: any) => {
        if (response) {
          this.cases = response;
          this.isWorkflowPermission = this._commonHelper.havePermission(this.cases.permissionHash);
          if (!this.isEntityWorkflow) {
            if (+this.cases?.entityWorkflowID > 0) {
              this.isEntityWorkflow = true;
              this.entityWorkflowId = +this.cases?.entityWorkflowID;
              this.entityStagesWithTasksStorageKey = `${this.entityStagesWithTasksStorageKey}_${this.entityWorkflowId}`;
            }
          }
          //show/Hide Pause/Resume button
          this.cases.isShowPauseOrResume = (this.cases?.entityWorkflowID != null) ? true : false;
          //custom fields
          this.cases.customFieldJSONData = this._commonHelper.tryParseJson(this.cases.customFieldJSONData);
          // case details
          this.casesDetails = this.cases;
          this.casesDetails.estimatedMins = new TimeFramePipe().transform(this.casesDetails.estimatedMins, this.hoursInDay);
          this.estimatedMins = this.casesDetails.estimatedMins;
          this.caseName = this.cases?.name;
          this.privacyLevel = this.cases?.privacyLevel;
          this.estimatedPoints = this.cases?.estimatedPoints;
          this.casesDetails.dueDate = this.casesDetails.dueDate != null ? moment(new Date(this.casesDetails.dueDate)).toDate() : this.casesDetails.dueDate;
          // record type
          this.entityRecordTypeId = this.casesDetails?.entityRecordTypeID;
          // related entityType
          this.selectedRelatedToEntityTypeID = this.casesDetails.entityTypeID;
          // copy detail
          this.copyOfCases = this._commonHelper.deepClone(this.casesDetails);

          this.workTaskSubTypeDetails = this.entitySubTypes.find(x => x.level == 1);

          this.fromEntityStageId = this.cases.entityStageId;
          this.SelectedEntityTypeId = this.casesDetails.entityTypeID;
          this.SelectedEntityId = this.casesDetails.entityID;
          // form
          
          if (!this.casesDetailForm) {
            this.casesDetailForm = this.createCaseDetailForm();
          } else {
            this.updateCaseDetailForm();
          }
          
          if (this.isEntityWorkflow && this.entityWorkflowId > 0) {
            this.getWorkflowDetail(this.entityWorkflowId);
          }
          this.getEntityStagesWithTask();

          this.getEntityTotalReportingTime()
          this.prepareFormCustomFields();
          if (this.cases.entityWorkflowID) {
            this.casesDetailForm.addControl('entityStageId', new FormControl(this.cases.entityStageId ?? null, Validators.required));
          }
          this.setDefaultNavTabs();
          this.prepareTabsWithOrder();
          this.copyOfCasesDetailFormValues = this.casesDetailForm.value;          
          const foundRecord = this._commonHelper.entityTypeList.find(de => de['id'] == this.cases.entityTypeID);
          if (foundRecord) {
            this.relatedToName = foundRecord?.['displayName'].toString().trim();
            this.relatedToNameForHeader = foundRecord?.['displayName'].toString().trim();
            this.relatedToIcon = this._commonHelper.getEntityIconClass(this.cases.entityTypeID);
            this.relatedToIconToolTip = foundRecord?.['displayName'].toString().trim();
          }
          else{
            this.relatedToName = this._commonHelper.getInstanceTranlationData('CASES.DETAIL.DETAILS_TAB.RELATED_TO');
            this.relatedToNamePlaceholder = this._commonHelper.getInstanceTranlationData('CASES.DETAIL.DETAILS_TAB.RELATED_TO_PLACEHOLDER', { entityName: this.relatedToName }).replace('(','').replace(')','').trim();
            this.relatedToNameForHeader = this._commonHelper.getInstanceTranlationData('CASES.DETAIL.ENTITY_NAME_LABEL');
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

  private canUserChangeStage(currentStage, cases): boolean {
    if (currentStage == null || cases == null) {
      return true;
    }

    let canUserMoveTask: boolean = false;
    if (currentStage.transitionAssociates != null && currentStage.transitionAssociates != '') {
      const associates = currentStage.transitionAssociates.trim().split(',');
      associates.forEach(associate => {
        const associatePropertyName = this._commonHelper.convertToCamalize(associate);
        canUserMoveTask = canUserMoveTask || (cases.hasOwnProperty(associatePropertyName) ? (cases[associatePropertyName] == this.loggedInUser.userId) : false);
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
      const dropEntityStageDetail: any = this.casesStages?.find(s => s.isDefault);
      this.onMarkStageAsComplete(dropEntityStageDetail?.id, true);
    }
  }

  // stage transition
  onMarkStageAsComplete(dropEntityStageId, isReopenedStage: boolean = false) {
    var isShowStageChangeConfirmationBox: boolean = true;
    this.optionsForPopupDialog.size = 'md';
    //check can user change stage
    const dropEntityStageDetail = this.casesStages.find(s => s.id == dropEntityStageId);
    if (dropEntityStageDetail != null && dropEntityStageId != this.casesDetails.entityStageId) {
      const prevEntityStageDetail = this.casesStages.find(s => s.id == this.casesDetails.entityStageId);
      const canUserChangeStage: boolean = this.canUserChangeStage(prevEntityStageDetail, this.casesDetails);

      if (!canUserChangeStage) {
        if (this.changeCasesStage) {
          isShowStageChangeConfirmationBox = false;
          this._confirmationDialogService.confirm(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_CONFIRM_CHANGE_STAGE')), null, null, this.optionsForPopupDialog)
            .then((confirmed) => {
              if (confirmed) {
                this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
              }
            });
        }
        else {
          this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_CHANGE_STAGE_PERMISSIONS')));
        }
      }
      else {
        this.afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
      }
    }
  }

  afterMarkStageAsComplete(dropEntityStageId, isShowStageChangeConfirmationBox: boolean, isReopenedStage: boolean) {
    this.optionsForPopupDialog.size = 'md';
    const dropEntityStageDetail = this.casesStages.find(s => s.id == dropEntityStageId);
    
    // if any one of the current stage task is required
    let anyTasksIsRequired: boolean = false;
    let requiredTasks: any[] = [];
    // find out the current stage
    let currentStage = this.casesStages.find(x => x.id == this.casesDetails.entityStageId);
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
        * Call API to validate case has completed the stage tasks (which are required) before moving on to other stage.
        * Params: EntityWorkflowId, EntityTypeId, EntityStageId, EntityTaskIds (comma separated) and EntityId (caseId)
        * */
      let requiredTaskIds = requiredTasks.length > 0 ? requiredTasks.join(", ") : null;
      this._commonHelper.showLoader();
      this._workflowmanagementService.isEntityStageTasksCompleted(this.entityId, this.entityTypeId, this.casesDetails.entityStageId, this.entityWorkflowId, requiredTaskIds).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.checkHandRaised(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.DETAIL.MESSAGE_BEFORE_MOVE_CASES_STAGE_SOME_TASK_SHOULD_BE_COMPLETED'));
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
      this._workflowmanagementService.isEntityStageTasksCompleted(this.entityId, this.entityTypeId, this.casesDetails.entityStageId, this.entityWorkflowId, null).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response === true) {
          this.checkHandRaised(dropEntityStageDetail, dropEntityStageId, isShowStageChangeConfirmationBox, isReopenedStage);
        } else {
          //Stage Tasks are not completed..
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.DETAIL.MESSAGE_BEFORE_MOVE_CASES_STAGE_TASK_SHOULD_BE_COMPLETED'));
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

    this._workflowmanagementService.isEntityStageRaiseHandTransitionExist(this.entityId, this.entityTypeId, this.entityWorkflowId, this.casesDetails.entityStageId).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response === true) {
        //Hand Raised - Not allowed to move the stage
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.DETAIL.MESSAGE_BEFORE_MOVE_CASES_FOR_RAISED_HAND_TASK'));
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
      noteSubjectName = `${this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CASES.STAGE_CHANGE_REASON_NOTE_SUBJECT', { stageName: dropEntityStageDetail.name }))}`
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
              this.getCasesDetails();
              
              if (this.isEntityWorkflow) {
                this.setRefreshStageHistory();
              }
            });
          }).catch(()=>{
            this.getCasesDetails();
            
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
        this.getCasesDetails();
        if (this.isEntityWorkflow) {
          this.setRefreshStageHistory();
        }
      }).catch(()=>{
        this.getCasesDetails();
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
        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CASES.CHANGE_STAGE_CONFIRMATION'), null, null, this.optionsForPopupDialog).then((confirmed) => {
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
      let assignedToForDto = this.copyOfCases.assignedTo;
      this._commonHelper.showLoader();
    let currentStageId = this.casesStages.find(x => x.id == this.casesDetails.entityStageId)?.id;
      let dropStage = this.casesStages.find(x => x.id == dropEntityStageId);
      this._workflowmanagementService.updateWorkflowEntityStage({ entityTypeId: this.entityTypeId, entityRecordTypeId: this.entityRecordTypeId, entityId: this.entityId, stageId: dropEntityStageId, entityWorkflowId: this.entityWorkflowId, assignedTo: assignedToForDto, verifiedBy: this.copyOfCases.verifiedBy, oldStageId: currentStageId}).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          if(dropStage.isCompleted || dropStage.isClosed)
          {
            this.refreshLinkedCases = true;
            this.refreshSubCases = true;
          }
          this.caseAssignedTo = response;
          if (assignedToForDto != this.caseAssignedTo.assignedToId) {
            this._commonHelper.showLoader();
            this._casesService.updateCaseAssignedToUsers({ entityId: this.entityId, assignedToId: this.caseAssignedTo.assignedToId, entityWorkflowId: this.entityWorkflowId, isForcedAssignment: this.caseAssignedTo.isForcedAssignment }).then((response: any) => {
              if (response) {
                assignedToForDto = this.caseAssignedTo.assignedToId;
              }
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('CASES.DETAIL.MESSAGE_CASES_MOVETO_STAGE',
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
                this._commonHelper.getInstanceTranlationData('CASES.DETAIL.MESSAGE_CASES_STAGE_REOPEN', {
                  entityName: this.casesDetails?.name !== null ? this.casesDetails?.name : " " })
              )
            }else {
              this._commonHelper.showToastrSuccess(
                this._commonHelper.getInstanceTranlationData('CASES.DETAIL.MESSAGE_CASES_MOVETO_STAGE',
                  { stageName: dropEntityStageDetail.name })
              );
            }
            
          }
        }
         // get details
         this.getCasesDetails();
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

  bindDropdownData() {
    if (this.isAssignCase && this.isForceReloadAssignedTo) this.getAssignedToUsers(1, '');
    if (this.isForceReloadPriority) this.getPriority();
    if (this.isForceReloadSeverity) this.getSeverity();
    if (this.isAssignCase && this.isForceReloadVerifiedBy) this.getVerifiedByUsers();
    this.possibleEntityTypeIdsForRelatedTo = null;
  }

  // get cases by stage
  getEntityStagesWithTask() {
    return new Promise((resolve, reject) => {
      const entityStagesWithTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.entityStagesWithTasksStorageKey));
      if (entityStagesWithTasks != null) {
        this.casesStages = entityStagesWithTasks;
        this.getEntityStagesWithTaskAfterReset();
        resolve(null);
      } else {
        if ((+this.entityWorkflowId || 0) > 0) {
          this._workflowmanagementService.getEntityStagesWithTask(this.entityTypeId, this.entityWorkflowId).then(
            (response: any[]) => {
              this.casesStages = this._commonHelper.tryParseJson(JSON.stringify(response || []));
              // stage tasks
              this.casesStages.forEach(stageElement => {
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
              this._commonHelper.setLocalStorageEncryptData(this.entityStagesWithTasksStorageKey, JSON.stringify(this.casesStages));
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
    this.currentStage = this.casesStages.find(f => this.cases && this.cases.entityStageId === f.id) || this.casesStages.find(f => f.isDefault);
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
    this.currentStageTask = this.casesStages.length > 0 ? this.casesStages.find(s => s.id == this.casesDetails.entityStageId)?.stageTasks ?? null : '';
    if (this.casesDetails.selectedStageTaskIds != null && this.casesDetails.selectedStageTaskIds != "") {
      const taskIds: Array<number> = this.casesDetails.selectedStageTaskIds
        ? this.casesDetails.selectedStageTaskIds.split(",").map(m => Number(m))
        : [];
      // map and get only ID and Name
      this.casesDetails.selectedStageTaskIds = (this.currentStage.stageTasks || []).filter(f => taskIds.includes(f.id)) || [];
      this.oldStageTask = this._commonHelper.tryParseJson(JSON.stringify(this.casesDetails.selectedStageTaskIds));
    }
  }
  
  // convenience getter for easy access to form fields
  get casesFrm() { return this.casesDetailForm.controls; }

  //create case form
  createCaseDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.caseId],
      name: [this.casesDetails.name, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(500)])],
      description: [this.casesDetails.description],
      selectedStageTaskIds: [this.casesDetails.selectedStageTaskIds],
      estimatedMins: [this.casesDetails.estimatedMins, Validators.compose([timeFrameValidator()])],
      estimatedPoints: [this.casesDetails.estimatedPoints, Validators.compose([Validators.required,Validators.min(0),Validators.max(9999)])],
      assignedTo: [this.casesDetails.assignedTo],
      entityID: [this.casesDetails.entityID],
      priority: [this.casesDetails.priority],
      severity: [this.casesDetails.severity],
      dueDate: [moment(new Date(this.casesDetails.dueDate)).toDate()],
      verifiedBy: [this.casesDetails.verifiedBy]
    });
  }
  
  //create case form
  updateCaseDetailForm() {
    this.casesDetailForm.patchValue({'entityID': this.casesDetails.entityID});
    this.casesDetailForm.patchValue({'id': this.caseId});
    this.casesDetailForm.patchValue({'name': this.casesDetails.name});
    this.casesDetailForm.patchValue({'description': this.casesDetails.description});
    this.casesDetailForm.patchValue({'selectedStageTaskIds': this.casesDetails.selectedStageTaskIds});
    this.casesDetailForm.patchValue({'estimatedMins': this.casesDetails.estimatedMins});
    this.casesDetailForm.patchValue({'estimatedPoints': this.casesDetails.estimatedPoints});
    this.casesDetailForm.patchValue({'assignedTo': this.casesDetails.assignedTo});
    this.casesDetailForm.patchValue({'priority': this.casesDetails.priority});
    this.casesDetailForm.patchValue({'severity': this.casesDetails.severity});
    this.casesDetailForm.patchValue({'dueDate': moment(new Date(this.casesDetails.dueDate)).toDate()});
    this.casesDetailForm.patchValue({'verifiedBy': this.casesDetails.verifiedBy});
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

 

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'cases.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else if (error.messageCode.toLowerCase() == 'cases.closedorcompleted') {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.DETAIL.CASES_CLOSEDORCOMPLETED', { stageName: error.data.stageName }));
      }
      else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      }
      else if (error.messageCode == 'Case.NoAccess') {
        this.hasPermission = false;
      }
      else
      {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('CASES.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );}
    }
  }

  onBack() {
    this._location.back();
  }

  closeForm() {
    this._router.navigate(['cases/workflow/' + this.entityWorkflowId]);
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

  setRefreshStageHistory() {
    this.refreshStageHistory = false;
    setTimeout(() => {
      this.refreshStageHistory = true;
    }, 500);
  }

  setRefreshDocument() {
    this.refreshDocument = false;
    setTimeout(() => {
      this.refreshDocument = true;
    }, 500);
  }

  //DD 20220329: SDC-145: Hide edit button on stage history tab
  // set current active tab
	setTab(activeInfo) {
    this.isAdditionalTab = activeInfo.isAdditionalTab;
    this.activeTab = activeInfo.tab.tabLink;
    this.selectedTab = activeInfo.tab.tabLink;
    
    if (!this.onceWorkTaskClicked && this.activeTab == 'navWorkTasks') {
      this.onceWorkTaskClicked = true;
    }
    
    if(!this.onceStageHistoryClicked && this.activeTab == 'navHistory') {
      this.onceStageHistoryClicked = true;
    }

    if (this.activeTab == 'navDocuments' && !this.onceDocumentClicked) {
      this.onceDocumentClicked = true;
    }
  }

  //save data
  saveData() {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.cases.customFieldJSONData) {
        this.casesCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.cases.customFieldJSONData[field.fieldName] && this.cases.customFieldJSONData[field.fieldName] != null && this.cases.customFieldJSONData[field.fieldName] != '') {
              this.cases.customFieldJSONData[field.fieldName] = moment(this.cases.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.casesDetailForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.cases.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.cases.customFieldJSONData[field.fieldName] = null;
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.casesDetailForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.cases.customFieldJSONData[field.fieldName] = data;
            } else {
              this.cases.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }
      this.casesDetails.dueDate = this.casesDetails.dueDate != null ? moment(this.casesDetails.dueDate).format('YYYY-MM-DD') : this.casesDetails.dueDate;
      this.casesDetails.entityTypeID = this.selectedRelatedToEntityTypeID;
      //copy of leads detail
      let params =this._commonHelper.deepClone(this.casesDetails);
      
      this.casesCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.casesDetailForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = new TimeFrameToMinutesPipe().transform(formArrayValues, this.hoursInDay);
        }
      });
      
      //Convert time formate to mins before save
      params.estimatedMins = new TimeFrameToMinutesPipe().transform(this.casesDetails.estimatedMins, this.hoursInDay);

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
      
      this._casesService.saveCase(params).then((response: any) => {
        // get details
        this.getCasesDetails().then(() => {
          this.refreshCustomFieldDatasource = true;
          setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          resolve(null)
        });

        //Refresh Stage History
        this.setRefreshStageHistory();

        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CASES.DETAIL.MESSAGE_CASES_UPDATED'));
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error != null && String(error.messageCode).toLowerCase() === 'cases.pausedorinactiveerror') {
          this.getCasesDetails().then(() => {
            this.refreshCustomFieldDatasource = true;
            setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          });
        } else if (error?.messageCode?.toLowerCase() !== 'staticmessage') {
          this.getCasesDetails().then(() => {
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

  //show hide detail tab with save
  showHideDetailTab(frmMode: string) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.casesDetailForm.invalid) {
        this.validateAllFormFields(this.casesDetailForm);
        this.navigateToTabByValidation();
        return;
      }

      this.refreshActivity = true;

      Promise.all([
        this.saveData()
      ]).then(() => {
        this.isReadOnly = true;
        this.submitted = false;
        //this.isForceReloadRelatedTo = true;
      })
    }
    else if (frmMode === 'CANCEL') {
      this.casesDetails = this._commonHelper.deepClone(this.copyOfCases);

      if (this.casesDetails.customFieldJSONData && this.casesDetails.customFieldJSONData !== null && this.casesDetails.customFieldJSONData !== '' && this.casesDetails.customFieldJSONData !== undefined) {
        this.casesCustomFields.forEach((field: any) => {
          if (field.fieldType == 'Date') {
            if (this.casesDetails.customFieldJSONData[field.fieldName] && this.casesDetails.customFieldJSONData[field.fieldName] != null && this.casesDetails.customFieldJSONData[field.fieldName] != '' && this.casesDetails.customFieldJSONData[field.fieldName] != undefined) {
              this.casesDetails.customFieldJSONData[field.fieldName] = moment(new Date(this.casesDetails.customFieldJSONData[field.fieldName])).toDate();
            }
          } else if (field.fieldType == 'JSON Grid') {
            if (this.casesDetails.customFieldJSONData[field.fieldName] && this.casesDetails.customFieldJSONData[field.fieldName] != null && this.casesDetails.customFieldJSONData[field.fieldName] != '' && this.casesDetails.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.casesDetails.customFieldJSONData[field.fieldName] === 'string') {
                this.casesDetails.customFieldJSONData[field.fieldName] = JSON.parse(this.casesDetails.customFieldJSONData[field.fieldName]);
              }
            } else {
              this.casesDetailForm.removeControl(field.fieldName)
            }
          } else if (String(field.fieldType)?.toLowerCase() === 'duration') {
            if (typeof this.casesDetails.customFieldJSONData[field.fieldName] === 'number' || this.casesDetails.customFieldJSONData[field.fieldName] == null ) {
              this.casesDetails.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.casesDetails.customFieldJSONData[field.fieldName], this.hoursInDay);
             
            }
          } 
        });
      }
      this.casesDetailForm.reset(this.copyOfCasesDetailFormValues);
      this.refreshJSONGridData()
      this.getEntityStagesWithTaskAfterReset();
      this.isReadOnly = !this.isReadOnly
      this.submitted = false;
    }
    else if (frmMode === 'EDIT' && this.isReadOnly == true) {
      this.bindDropdownData();
      setTimeout(() => { this.caseTxtNameRef.nativeElement.focus(); });
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


  // form validation
  private validateAllFormFields(formGroup: UntypedFormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      }
      else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      } else if (control instanceof UntypedFormArray) {
        control?.controls?.forEach((i: UntypedFormGroup) => {
          this.validateAllFormFields(i);
        })
      }
    });
  }

  // get tenant setting for tab layout
  private getTabLayoutTenantSetting() {
    
    return new Promise((resolve, reject) => {
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.CASES_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CASES_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.CASES_TAB_LAYOUT}`, JSON.stringify(response));
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

  private getWorkflowDetail(entityWorkflowId): Promise<any> {
    return new Promise((resolve, reject) => {

      //storage key
      let storageKey = `${LocalStorageKey.CaseWorkflowDetailsKey}_${entityWorkflowId}`;

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
  private setWorkTaskTabParameters(): void {
    this.tbWorktaskParameters = [{
      name: 'EntityTypeID',
      type: 'int',
      value: this.entityTypeId
    }, {
      name: 'EntityID',
      type: 'int',
      value: this.caseId
    }]
  }
  addWorkTask() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.caseId;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.worktaskRecordTypes.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.worktaskWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Cases || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityWorkTaskPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Cases;
    this.modalRef.componentInstance.parentPrivacyLevel = this.privacyLevel;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
      }
    });
  }
  //delete work task - confirmation dialog
  deleteWorkTask(workTask) {
    this._commonHelper.showLoader();
    this._workTaskService.isSubWorkTaskExist(workTask.id).then((res: any) => {
      this._commonHelper.hideLoader();

      let hasSubWorkTask: boolean = res?.isExist || false;

      if (hasSubWorkTask) {
        //available Subtask Types
        let worktaskTypeLevel: number = this.entitySubTypes.find(x => x.id == workTask.typeID)?.level ?? 0;
        this.availableSubWorkTaskTypeDetails = this.entitySubTypes.filter(x => x.parentID == workTask.typeID && x.level == worktaskTypeLevel + 1 && this._commonHelper.havePermission(x.listPermissionHash));
        this.availableSubWorkTaskTypeNamesForWorkTaskDelete = this.availableSubWorkTaskTypeDetails?.map(x => x.name).join(" or ")?.trim() ?? null;
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CASES.DETAIL.TAB_WORKTASKS.WORKTASKS_SUBWORKTASKEXISTMESSAGEBEFOREPARENTTASKDELETE', { entitySubTypeName: this.availableSubWorkTaskTypeNamesForWorkTaskDelete })
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

        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CASES.DETAIL.TAB_WORKTASKS.MESSAGE_CONFIRM_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' }), null, null, optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._workTaskService.deleteWorkTask(workTask.id).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('CASES.DETAIL.TAB_WORKTASKS.MESSAGE_WORKTASK_DELETE', { entitySubTypeName: this.entitySubTypes.find(x => x.id == workTask.typeID)?.name ?? '' })
                );
                this.refreshWorkTaskTab = !this.refreshWorkTaskTab;
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                });
            }
          })
          .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.DETAIL.TAB_WORKTASKS.WORKTASK_DISMISS_DIALOG')));
      }
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }
  
  //navigate to edit page
  editWorkTask(workTaskId) {
    this._router.navigate(['/worktasks/details/' + workTaskId]);
  }

  refreshChildComponent() {
    this.refreshWorkTaskTab = false;
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
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Cases);
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
      this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
      this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases);
    }
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
            this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CASES.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
        this.worktaskWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
  }

  // event emitted from kanban
  onRelatedToClick(cases) {
    // check logged in user have permission to view related entity details
    if (!this._commonHelper.isUserHaveViewPermissionOfRelatedEntity(cases.entityTypeID)) {
      return;
    }

    // if not undefined then redirect
    if (cases.entityTypeName != undefined && cases.entityID != undefined) {
      this._router.navigateByUrl('/' + this._commonHelper.getRouteNameByEntityTypeId(cases.entityTypeID).toLowerCase() + '/details/' + cases.entityID);
    }
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
      }else {
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

  //delete case - confirmation dialog
  onDeleteCaseClick(caseId) {
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

        this._confirmationDialogService.confirm('CASES.DETAIL.MESSAGE_CONFIRM_CASE_DELETE', null, null, optionsForConfirmDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._casesService.deleteCase(caseId).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('CASES.DETAIL.MESSAGE_CASE_DELETE')
                );
                // Redirect Cases Listing Page.
                this._router.navigateByUrl('/cases/list');
              },
                (error) => {
                  this._commonHelper.hideLoader();
                  this.getTranslateErrorMessage(error);
                });
            }
          })
          .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.DETAIL.CASE_DISMISS_DIALOG')));
      }
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  onCaseStagePauseChanged(caseItem: any, isPaused: boolean) {
    if(!this.isEditCases){ return; }

    if (caseItem.assignedTo !== this.loggedInUser.userId) {
      let message = "";
      if (caseItem.assignedTo == null || caseItem.assignedTo == "" || caseItem.assignedTo == undefined) {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_PAUSE_CONFIRMATION_UNASSIGNED') : this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_RESUME_CONFIRMATION_UNASSIGNED');
      }
      else {
        message = isPaused ? this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_PAUSE_CONFIRMATION') : this._commonHelper.getInstanceTranlationData('CASES.MESSAGE_RESUME_CONFIRMATION');
      }
      this._confirmationDialogService.confirm(message, null, null, this.optionsForPopupDialog)
        .then((confirmed) => {
          if (confirmed) {
            this.caseStagePauseChange(caseItem, isPaused);
          }
        });
    }
    else if (caseItem.assignedTo == this.loggedInUser.userId) {
      this.caseStagePauseChange(caseItem, isPaused);
    }
  }

  caseStagePauseChange(caseItem, isPaused: boolean) {
    const params = {
      entityTypeId: this.entityTypeId,
      entityId: caseItem.id,
      entityStageId: caseItem.entityStageId,
      isPaused: isPaused,
      entityWorkflowId: this.entityWorkflowId,
      assignedTo: caseItem.assignedTo,
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
          this.modalRef.componentInstance.stageId = caseItem.entityStageId;
          this.modalRef.componentInstance.dataSourceCode = DataSources.ENTITYPAUSEREASONS;
          this.modalRef.componentInstance.isSaveNote = true;

          this.modalRef.result.then(noteDate => {
            if (noteDate) {
              params.noteID = noteDate.id;
              this.saveEntityStagePauseTransition(params, caseItem);
            }
          });
        } else {
          this.cases = [];
          this.getCasesDetails();
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
        createdBy: this.loggedInUser.userId
      };

      this._commonHelper.showLoader();
      this._noteService.addNewNote(noteParam).then((response: any) => {
        if (response) {
          params.noteID = response.id;
          this.saveEntityStagePauseTransition(params, caseItem);
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

  saveEntityStagePauseTransition(params, caseItem) {
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

  onCaseRaiseHandChanged(caseItem: any,isHandRaised: boolean ) {
    if (!this.isEditCases || !this.isViewCases || (caseItem != null && caseItem.isPaused)) {
      return;
    }

    if (caseItem.assignedTo == this.loggedInUser.userId) {
      const params = {
        entityTypeId: this.entityTypeId,
        entityId: caseItem.id,
        entityStageId: caseItem.entityStageId,
        isHandRaised: isHandRaised,
        entityWorkflowId: this.entityWorkflowId,
        assignedTo: caseItem.assignedTo
      }

      this._commonHelper.showLoader();
      this._workflowmanagementService.saveEntityStageRaiseHandTransition(params)
        .then(() => {
          caseItem.isHandRaised = isHandRaised;
          this._commonHelper.hideLoader();
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          this.getCasesDetails();
        });
    } else {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('CASES.RAISEHAND_CASEASSIGNUSERMISMATCH'))
    }
  }
}
