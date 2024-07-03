//ANGULAR
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

//COMMON
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { DataSources, Entity, PublicTenantSettings } from '../../../../@core/enum';
import { noWhitespaceValidator } from '../../../../@core/sharedValidators/no-whiteSpace.validator';

//SERVICES
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { WorkflowmanagementService } from '../../workflowmanagement.service';
import { SettingsService } from '../../../settings/settings.service';

@Component({
  selector: 'ngx-entityworkflow-detail',
  templateUrl: './entityworkflow-detail.component.html',
  styleUrls: ['./entityworkflow-detail.component.scss']
})
export class EntityworkflowDetailComponent implements OnInit {
  // workflow model
  entityTypeId: number = Entity.EntityWorkflows;
  workflowId: number;
  entityRecordTypeId: number;

  entityWorkflow: any;
  copyOfentityWorkflow: any;

  formDataJSON: any[] = [];
  selectedTab: number = 0;
  workflowForm: UntypedFormGroup;

  //tab variables
  onceStageHistoryClicked: boolean = false;

  //dropdown sources
  teamsOptions: any[] = [];
  stageTypeOptions: any[] = [];
  hoursInDay:number = null;

  //permission veriables
  isEditWorkflow: boolean = false;
  isWorkflowPermission:boolean = true;

  // extra variable
  submitted: boolean = false;
  isLoaded: boolean = false;
  isReadOnly: boolean = true;
  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  activeTab = 'navDetails';

  //validations obj
  workflowValidationMessages = {
    name: [{ type: 'required', message: 'ENTITYWORKFLOW.DETAIL.TAB_DETAILS.NAME_REQUIRED' }, { type: 'whitespace', message: 'ENTITYWORKFLOW.DETAIL.TAB_DETAILS.NAME_REQUIRED' }],
    teamIds: [{ type: 'required', message: 'ENTITYWORKFLOW.DETAIL.TAB_DETAILS.TEAMS_REQUIRED' }],
    defaultAssignedTo: [{ type: 'required', message: 'ENTITYWORKFLOW.DETAIL.TAB_DETAILS.DEFAULTASSIGNEDTO_REQUIRED' }],
    completionPercentage: [
      { type: 'min', message: 'ENTITYWORKFLOW.DETAIL.TAB_TEAMS.MESSAGE_STAGE_COMPLETIONPERCENTAGE_MIN'}, 
      { type: 'max', message: 'ENTITYWORKFLOW.DETAIL.TAB_TEAMS.MESSAGE_STAGE_COMPLETIONPERCENTAGE_MAX' }],
    thresholdMins: [{ type: 'required', message: 'ENTITYWORKFLOW.DETAIL.TAB_TEAMS.MESSAGE_STAGE_THRESHOLDMINS' }]
  }

  constructor(
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _workflowmanagementService: WorkflowmanagementService,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService,
    private _formBuilder: UntypedFormBuilder) {
    this.isEditWorkflow = this._commonHelper.havePermission(enumPermissions.EditEntityWorkflow);
    this.readRouteParameter();
  }

  ngOnInit(): void {
    Promise.all([
        this.getHoursInDay(),
        this.getTeamsData(),
        this.getEntityStageTypes()
      ]).then(() => this.getWorkflowDetail());
  }

  //#region Events
  get workflowFrm() { return this.workflowForm.controls; }

  //region Public
  public backToList(): void {
    this._router.navigate(['../../'], { relativeTo: this._activeRoute });
  }

  public showHideDetailTab(frmMode: string) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      this.refreshActivity = true;
      if (this.workflowForm.invalid) {
        this.validateAllFormFields(this.workflowForm);
        return;
      }
      this.saveData();
    }
    else if (frmMode === 'CANCEL') {
      this.entityWorkflow = this._commonHelper.cloningObject(this.copyOfentityWorkflow);
      this.workflowForm = this.createworflowDetailForm();
      this.createDynamicFormArray(this.entityWorkflow.stageTeams);
      this.setTeamsDropdownSelectedValues();
    }
    this.isReadOnly = !this.isReadOnly;
    this.submitted = false;
  }

  public fillTeamMembersDropdown(event) {
    var selectedTeamIds = event.get('teamIds').value.toString();
    this.getTeamMembersData(selectedTeamIds, null).then(res => {
      if (res) {
        event.patchValue({
          defaultAssignedToOptions: res,
          defaultAssignedTo: null
        });
      }
    });
  }

   // set current active tab
   public setTab(activeTab) {
    this.activeTab = activeTab;

    if((!this.onceStageHistoryClicked && this.activeTab == 'navHistory')) {
      this.onceStageHistoryClicked = true;
    }
  }

  public setRefreshEntityTag() {
    this.refreshEntityTag = !this.refreshEntityTag;
  }

  public setRefreshActivityHistory(){
    this.refreshActivityHistory = false;
    setTimeout(() => {
      this.refreshActivityHistory = true;  
    }, 500);
  }

  public setRefreshStageHistory() {
    this.refreshStageHistory = false;
    setTimeout(() => {
      this.refreshStageHistory = true;
    }, 500);
  }
  //#endregion

  //#region Private methids
  private readRouteParameter(): void {
    this._activeRoute.params.subscribe(param => {
      let id = param['id'];
      if (id && !isNaN(Number(id)) && Number(id) > 0) {
        this.workflowId = Number(id);
      } else {
        this._router.navigate(['..'], { relativeTo: this._activeRoute });
      }
    });
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

  private getTeamsData() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._dataSourceService.getDataSourceDataByCode(DataSources.WORKFLOWTEAMS).then((response: any) => {
        if (response) {
          this.teamsOptions = response;
          this._commonHelper.hideLoader();
          resolve(null);
        }
      },
        (error) => {
          this._commonHelper.hideLoader();
          reject(null);
          this.getTranslateErrorMessage(error);
        });
    });
  }

  private getEntityStageTypes() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._dataSourceService.getDataSourceDataByCode(DataSources.ENTITYSTAGETYPES).then((response: any) => {
        if (response) {
          this.stageTypeOptions = response;
          this._commonHelper.hideLoader();
          resolve(null);
        }
      },
        (error) => {
          this._commonHelper.hideLoader();
          reject(null);
          this.getTranslateErrorMessage(error);
        });
    });
  }

  private prepareParamsForAssignedToUsers(teamIds, assigendMemberID) {
    const params = [];
    const paramItem = {
      name: 'TeamIds',
      type: 'string',
      value: teamIds
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'AssignedTo',
      type: 'int',
      value: assigendMemberID
    };
    params.push(paramItem1);

    return params;
  }

  private getTeamMembersData(teamIds: string, assigendMemberID): any {
    let params = this.prepareParamsForAssignedToUsers(teamIds, assigendMemberID);
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWSTAGETEAMSMEMBERS, params).then((response: any) => {
        this._commonHelper.hideLoader();
        return resolve(response);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
    });
  }

  private getWorkflowDetail(): void {
    this._commonHelper.showLoader();
    this._workflowmanagementService.getWorkflowDetailById(this.workflowId)
      .then((response: any) => {
        this.setWorflowDetails(response || {});
        this.workflowForm = this.createworflowDetailForm();
        this.isWorkflowPermission = this._commonHelper.havePermission(response.permissionHash);
        this.createDynamicFormArray(response.stageTeams);
        this.setTeamsDropdownSelectedValues();
        this.isLoaded = true;
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.isLoaded = true;
        this.getTranslateErrorMessage(error);
      });
  }

  private createDynamicFormArray(stageTeams) {
    (stageTeams as []).forEach(data => {
      const add = this.workflowForm.get('stageTeams') as UntypedFormArray;
      add.push(this._formBuilder.group({
        stageId: data['stageID'],
        stageName: data['stageName'],
        teamNames: data['teamNames'],
        isForcedAssignment: data['isForcedAssignment'],
        teamIds: [data['teamIds']??''],
        defaultAssignedToName: data['defaultAssignedToName'],
        defaultAssignedTo: [data['defaultAssignedTo']],
        defaultAssignedToOptions: [],
        defaultTrackItLabel: data['defaultTrackItLabel'],
        thresholdMins: data['thresholdMins'] ?? 0,
        isNoteRequired: data['isNoteRequired'],
        isAllTasksRequired: data['isAllTasksRequired'],
        completionPercentage: [data['completionPercentage'] ?? 0, [Validators.max(100), Validators.min(0)]],
        defaultTrackItValue: [{ value: data['defaultTrackItValue'], disabled: (data['isClosed'] || data['isCompleted']) }, Validators.compose([Validators.required])],
        defaultTrackItOptions: [],
        isClosed:data['isClosed'],
        isCompleted:data['isCompleted']
      }));
    });
  }

  private createworflowDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.workflowId],
      name: [this.entityWorkflow.name, noWhitespaceValidator],
      entityTypeName: [this.entityWorkflow.email],
      entityRecordTypeName: [this.entityWorkflow.phone],
      stageTeams: this._formBuilder.array([])
    });
  }

  private setTeamsDropdownSelectedValues() {
    Object.keys(this.workflowForm.controls).forEach(field => {
      const control = this.workflowForm.get(field);
      if (control instanceof UntypedFormArray && field == "stageTeams") {
        control.controls.forEach(element => {
          element.patchValue({defaultTrackItOptions: this.stageTypeOptions});
            
          let frmTeamIds = element.get('teamIds');
          if (frmTeamIds.value != null && frmTeamIds.value.length > 0) {
            let teamIds = frmTeamIds.value.split(',') as [];
            let teamIdsObj: any[] = [];
            teamIds.forEach((team: string) => {
              const obj = this.teamsOptions.find(x => x.value === parseInt(team.trim()))
              if (obj) {
                teamIdsObj.push(obj.value);
              }
            });

            let selectedDefaultAssignedTo = element.get('defaultAssignedTo').value;

            this.getTeamMembersData(frmTeamIds.value, selectedDefaultAssignedTo).then(res => {
              element.patchValue({ teamIds: teamIdsObj });
              if (res) {
                element.patchValue({ defaultAssignedToOptions: res });

                let defaultMembers: any = element.get('defaultAssignedToOptions').value;

                if (defaultMembers != null && defaultMembers.find(x => x.value === selectedDefaultAssignedTo) == null) {
                  element.patchValue({ defaultAssignedTo: null, defaultAssignedToName: null });
                }
              }
            });
          }
        });
      }
    });
  }

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('ENTITYWORKFLOW.DETAIL.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

  private validateAllFormFields(formGroup: UntypedFormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  private setWorflowDetails(response: any): void {
    this.entityWorkflow = response;
    this.copyOfentityWorkflow = this._commonHelper.cloningObject(this.entityWorkflow);
    this.entityRecordTypeId = this.entityWorkflow.entityRecordTypeId;
  }

  private saveData(): void {
    this._commonHelper.showLoader();
    let params = Object.assign({}, this.entityWorkflow);
    const formValues = this.workflowForm.getRawValue();

    params.stageTeams.forEach(param => {
      let stageteam = formValues.stageTeams.find(x => x.stageId == param.stageID);
      param.defaultAssignedTo = stageteam.defaultAssignedTo;
      param.isForcedAssignment = stageteam.isForcedAssignment == null ? false : stageteam.isForcedAssignment;
      param.thresholdMins = stageteam.thresholdMins;
      param.isNoteRequired = stageteam.isNoteRequired == null ? false : stageteam.isNoteRequired;
      param.isAllTasksRequired = stageteam.isAllTasksRequired == null ? false : stageteam.isAllTasksRequired;
      param.completionPercentage = stageteam.completionPercentage;
      param.teamIds = stageteam.teamIds.toString();
      param.defaultTrackItValue = stageteam.defaultTrackItValue;
    });

    this._workflowmanagementService.updateEntityWorkflow(params).then(() => {
      this.getWorkflowDetail();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ENTITYWORKFLOW.DETAIL.ENTITYWORKFLOW_MESSAGE_SAVE'));
      this._commonHelper.hideLoader();
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }
  //#endregion
}
