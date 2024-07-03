import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { PagingParams } from '../../../../@core/sharedModels/paging-params.model';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { TeamsService } from '../teams.service';
import { TeamMember, Teams } from '../teams.model';
import { CommonService } from '../../../../@core/sharedServices/common.service';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl } from '@angular/forms';
import { DataSources, LocalStorageKey, RefType, TeamMemberRoleRefType } from '../../../../@core/enum';
import { UsersService } from '../../../usermanagement/users/users.service';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { Table } from 'primeng/table';
import { throws } from 'assert';

@Component({
  selector: 'ngx-teams-form',
  templateUrl: './teams-form.component.html',
  styleUrls: ['./teams-form.component.scss']
})
export class TeamsFormComponent implements OnInit {

  @ViewChild('pTableOwners',{ static: false }) private pTableOwners: Table;
  @ViewChild('pTableTeamMemners', { static: false }) private pTableTeamMemners: Table; 

  teamMemberForm: UntypedFormGroup;
  teamForm: UntypedFormGroup;
  formMode: string;
  submitted = false;
  isEdit: boolean = false;
  isEditforTeam: boolean = false
  isAddforTeam: boolean = false

  //search member filter
  InActiveMembersFilter = {
    searchText: '',
    showInActiveMembers: false
  }

  //search owner filter
  InActiveOwnersFilter = {
    searchText: '',
    showInActiveOwners: false
  }

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  teamId: number = 0;
  members: any[] = [];
  owner: any;
  memberRoles: any[] = [];

  //Table Column
  cols: any[];
  column: any[];
  totalRecordsteamMembers: number;
  totalRecordsOwners: number;

  //Data Souce
  owners: any = [];
  teamMembers: any = [];
  teamMember: any = [];
  parentteam: any = [];
  team: any = [];
  isEntitySelected = false;

  addEditTeamMemberDiv: boolean = false;

  //permissions
  isEditTeam: boolean = false;
  isAddTeam: boolean = false;
  isDeleteTeam: boolean = false;
  isListTeam: boolean = false;
  isShowActionColumn: boolean = false;
  isInitialLoading: boolean = true;

  showInActiveTeamMembersRecords: boolean = false;
  showInActiveOwnersRecords: boolean = false;
  showInActiveTeamMembersRecordsLength: any;
  showInActiveOwnersRecordsLength: any
  showActiveTeamMembersRecordsLength: any;
  showActiveOwnersRecordsLength: any;
  showActiveTeamMembersRecords: any;
  showActiveOwnersRecords: any;
  

  //Validation
  teams_validation_messages = {
    'name': [
      { type: 'required', message: 'TEAMS.ADD.MESSAGE_REQUIRED_NAME' },
      { type: 'maxlength', message: 'TEAMS.ADD.MESSAGE_NAME_MAX' }
    ],
    'ownerName': [
      { type: 'required', message: 'TEAMS.ADD.MESSAGE_REQUIRED_OWNERNAME' }
    ]
  };

  teammembers_validation_messages = {
    'memberId': [
      { type: 'required', message: 'TEAMS.TEAM_MEMBERS.ADD.MESSAGE_REQUIRED_MEMBERNAME' },
    ],
    'memberIds': [
      { type: 'required', message: 'TEAMS.TEAM_MEMBERS.ADD.MESSAGE_REQUIRED_MEMBERNAME' },
    ],
    'teamMemberRoleId': [
      { type: 'required', message: 'TEAMS.TEAM_MEMBERS.ADD.MESSAGE_REQUIRED_TEAMMEMBERROLENAME' }
    ]
  };

  constructor(private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _teamsService: TeamsService,
    private _datasourceService: DatasourceService,
    private _formBuilder: UntypedFormBuilder,
    private _commonService: CommonService,
    private _confirmationDialogService: ConfirmationDialogService,) {
    //initiate Permissions
    this.isListTeam = this._commonHelper.havePermission(enumPermissions.ListTeams);
    this.isAddTeam = this._commonHelper.havePermission(enumPermissions.AddTeam);
    this.isEditTeam = this._commonHelper.havePermission(enumPermissions.EditTeam);
    this.isDeleteTeam = this._commonHelper.havePermission(enumPermissions.DeleteTeam);
    this.isShowActionColumn = this.isDeleteTeam || this.isEditTeam;
    //If Record Edit then set record edit id
    this._activeRoute.params.subscribe(param => {
      if (param['id'] != undefined) {
        if (param['id'] != null) {
          this.teamId = param['id'];
        }
      }
    });
    this.column = [
      { field: 'memberName', header: 'TEAMS.TEAM_MEMBERS.TABLE_HEADER_OWNER', sort: true },
      { field: 'teamMemberRoleName', header: 'TEAMS.TEAM_MEMBERS.TABLE_HEADER_MEMBER_ROLE', sort: true },
      // { field: 'memberIsActive', header: 'TEAMS.TEAM_MEMBERS.TABLE_HEADER_MEMBER_STATUS', sort: true },
      { field: 'id', header: '', sort: false, class: "action" + (this.isShowActionColumn ? "hide" : "") }
    ];
    //Set column  name json
    this.cols = [
      { field: 'memberName', header: 'TEAMS.TEAM_MEMBERS.TABLE_HEADER_TEAMMEMBER', sort: true },
      { field: 'teamMemberRoleName', header: 'TEAMS.TEAM_MEMBERS.TABLE_HEADER_MEMBER_ROLE', sort: true },
      // { field: 'memberIsActive', header: 'TEAMS.TEAM_MEMBERS.TABLE_HEADER_MEMBER_STATUS', sort: true },
      { field: 'id', header: '', sort: false, class: "action" + (this.isShowActionColumn ? "hide" : "") }
    ];
  }

  // convenience getter for easy access to form fields
  get tf() { return this.teamForm.controls; }
  get f() { return this.teamMemberForm.controls; }

  ngOnInit(): void {
    if (this.teamId > 0) {
      this.formMode = 'EDIT';
      this.getTeamDetail(this.formMode);
      this.getParentteams(this.formMode);
      this.isAddforTeam = false;
      this.isEditforTeam = true;
    }
    else {
      this.formMode = 'ADD';
      this.getusers();
      this.getParentteams(this.formMode);
      this.isAddforTeam = true;
      this.isEditforTeam = false;
      this.teamForm = this.createTeamForm(this.formMode);
    }
    this.setLastOwnerSearchFilterFromStorage();
    this.setLastMemberSearchFilterFromStorage();
    this.getTeamMembers();
  }

  closeForm() {
    this._router.navigate(['teammanagement/teams']);
  }

  onBack() {
    this.closeForm();
  }

  saveTeamMemberForm(frmMode, formData) {
    this.isEntitySelected = true;
    if (this.teamMemberForm.invalid) {
      this.validateAllFormFields(this.teamMemberForm);
      return;
    }
    this.submitted = true;
    if (frmMode === 'ADD') {
      this._commonHelper.showLoader();
      let param = {
        Id: formData.Id,
        TeamId: formData.TeamId,
        memberId: 0,
        memberIds: formData.memberIds.toString(),
        teamMemberRoleId: formData.teamMemberRoleId
      }
      this._teamsService.addTeamMember(param).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('TEAMS.TEAM_MEMBERS.MESSAGE_TEAMMEMBER_ADDED')
        );
        this.getTeamMembers();
        this.addEditTeamMemberDiv = !this.addEditTeamMemberDiv;
        this.submitted = false;
        this.isEntitySelected = false;
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        this.submitted = false;
        this.isEntitySelected = false;
      });
    }
    else if (frmMode === 'EDIT') {
      this._commonHelper.showLoader();
      this._teamsService.updateTeamMember(formData).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('TEAMS.TEAM_MEMBERS.MESSAGE_TEAMMEMBER_UPDATED')
        );
        this.addEditTeamMemberDiv = !this.addEditTeamMemberDiv;
        this.getTeamMembers();
        this.submitted = false;
        this.isEntitySelected = false;
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessageFromList(error);
        this.submitted = false;
        this.isEntitySelected = false;
      });
    }
  }
  
  onFilterTeamMemebers() {
    this.InActiveMembersFilter.showInActiveMembers = this.showInActiveTeamMembersRecords;
    this.pTableTeamMemners.filteredValue = this.teamMembers?.filter(x => x.memberIsActive == !this.showInActiveTeamMembersRecords);
    this.showInActiveTeamMembersRecordsLength = this.pTableTeamMemners.filteredValue.length;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_TeamMembersRecords, JSON.stringify(this.InActiveMembersFilter));
    
  }

  onFilterOwners() {
    this.InActiveOwnersFilter.showInActiveOwners = this.showInActiveOwnersRecords;
    this.pTableOwners.filteredValue = this.owners?.filter(s => s.memberIsActive == !this.showInActiveOwnersRecords);
    this.showInActiveOwnersRecordsLength = this.pTableOwners.filteredValue.length;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_OwnersRecord, JSON.stringify(this.InActiveOwnersFilter));
  }

  private setLastMemberSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_TeamMembersRecords));
    if (searchFilter != null) {
      this.InActiveMembersFilter = searchFilter;
      this.showInActiveTeamMembersRecords = this.InActiveMembersFilter.showInActiveMembers;
    }
    this.InActiveMembersFilter = JSON.parse(JSON.stringify(this.InActiveMembersFilter));
  }

  private setLastOwnerSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_OwnersRecord));
    if (searchFilter != null) {
      this.InActiveOwnersFilter = searchFilter;
      this.showInActiveOwnersRecords = this.InActiveOwnersFilter.showInActiveOwners;
    }
    this.InActiveOwnersFilter = JSON.parse(JSON.stringify(this.InActiveOwnersFilter));
  }

  saveTeamForm(frmMode, formData) {
    this.isEntitySelected = true;
    if (this.teamForm.invalid) {
      this.validateAllFormFields(this.teamForm);
      return;
    }
    this.submitted = true;
    if (frmMode === 'EDIT') {
      this._commonHelper.showLoader();
      this._teamsService.updateTeam(formData).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('TEAMS.ADD.MESSAGE_TEAM_UPDATED')
        );
        this.getTeamDetail(frmMode)
        this.submitted = false;
        this.isEntitySelected = false;
        this.isEditforTeam = true;
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        this.submitted = false;
        this.isEntitySelected = false;
      });
    }
    else if (frmMode === 'ADD') {
      this._commonHelper.showLoader();
      this._teamsService.addTeam(formData).then(response => {
        if(response)
        {
          this.team = response as Teams;
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('TEAMS.ADD.MESSAGE_TEAM_ADDED')
        );
        this._router.navigate([`/teammanagement/teams/details/${this.team.id}`]);
        this.isAddforTeam=false;
        this.submitted = false;
        this.isEntitySelected = false;
      }
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        this.submitted = false;
        this.isEntitySelected = false;
      });
    }
  }

  deleteMember(Id) {
    this.addEditTeamMemberDiv = false;
    this.optionsForPopupDialog.size = "md";
    this._confirmationDialogService.confirm('TEAMS.TEAM_MEMBERS.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._teamsService.deleteteammember(Id).then(reponse => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('TEAMS.TEAM_MEMBERS.MESSAGE_TEAMMEMBER_DELETED')
          );
          this.getTeamMembers();

        },
        (error: any) => {
          this._commonHelper.hideLoader();
          if (error && error.messageCode.toUpperCase() == "TEAMS.TEAM_MEMBERS.TEAMMEMBER_CANNOTBEDELETED") {
            this._commonHelper.showToastrWarning(
              this._commonHelper.getInstanceTranlationData("TEAMS.TEAM_MEMBERS." + error.messageCode.replace('.', '_').toUpperCase())
            );
          }
          else {
            this.getTranslateErrorMessageFromList(error);
          }
        });
      }
    });
  }

  showHideEditTeamDiv(formMode, Id) {
    if (formMode === 'CANCEL') { 
      this.closeForm();
    }
  }

  showHideAddEditTeamDiv(formMode, Id) {
    this.getMemberRole();
    this.getMembers();
    this.submitted = false;
    this.isEntitySelected = false;

    this.teamMemberForm = this.createTeamMemberForm(formMode);
    if (formMode === 'EDIT') {
      this.isEdit = true;
      this._commonHelper.showLoader();
      this._teamsService.getTeamMemberbyId(Id).then(
        response => {
          this.teamMember = response as TeamMember;
          this.teamMemberForm.reset();
          this.teamMemberForm.patchValue({
            id: this.teamMember.id,
            TeamId: this.teamMember.teamId,
            teamMemberRoleId: this.teamMember.teamMemberRoleId,
            memberId: this.teamMember.memberId,
            memberName: this.teamMember.memberName
          });
          if (this.addEditTeamMemberDiv === false) {
            this.addEditTeamMemberDiv = !this.addEditTeamMemberDiv;
          }
          this._commonHelper.hideLoader();
          //below block is only to focus on name field white it is in ADD mode    
          //setTimeout(() => { this.entityDropdownRef.applyFocus(); });
        },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
    else {
      this.isEdit = false;
      if (formMode === 'ADD') {
        if (this.addEditTeamMemberDiv === false) {
          this.addEditTeamMemberDiv = !this.addEditTeamMemberDiv;
        }
        //below block is only to focus on name field white it is in ADD mode    
        //setTimeout(() => { this.entityDropdownRef.applyFocus(); });
      }
      else {
        this.addEditTeamMemberDiv = !this.addEditTeamMemberDiv
      }
    }
  }

  // public onFilterShowActiveRecords() {
  //   this.teamSearchFilter.showInActiveRecords = this.showInActiveRecords;
  //   // this.pagingParams.pageNo = 1;
  //   this.getMembers();
  // }

  //#StartRegion Private methods
  private getusers(): void {
    this._commonHelper.showLoader();
    this._datasourceService.getDataSourceDataByCode(DataSources.TEAMOWNERS).then(response => {
      if (response) {
        this.owner = response;
      }
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private getMemberRole(): void {
    let params = { refType: RefType.TeamUserRoles };
    // storage key
    let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.TeamUserRoles}`;
    // get data
    const refTypeTeamUserRoles = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
    if (refTypeTeamUserRoles == null) {
      this._commonHelper.showLoader();
      this._commonService.getActiveReferenceTypeByRefType(params).then((entitylist: any) => {
        if (entitylist) {
          this.memberRoles = entitylist;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.memberRoles));
        }
        this._commonHelper.hideLoader();
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else {
      this.memberRoles = refTypeTeamUserRoles;
    }
  }

  private getParentteams(formMode) {
    this._commonHelper.showLoader();
    this._datasourceService.getDataSourceDataByCode(DataSources.TEAMPARENTTEAMS).then((entitylist: any) => {
      if (formMode === 'EDIT') {
        let list = entitylist.filter(ele => ele.value != this.teamId)
        if (list) {
          //let list = JSON.parse(JSON.stringify(list1));
          this.parentteam = list
        }
      }
      else if (formMode === 'ADD') {
        this.parentteam = entitylist
      }
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private prepareParamsForTeamMembers() {
    const params = [];
    const paramItem = {
      name: 'TeamId',
      type: 'int',
      value: this.teamId,
    };
    params.push(paramItem);
    return params;
  }
  
  private getMembers(): void {
    this._commonHelper.showLoader();
    var params = this.prepareParamsForTeamMembers();
    this._datasourceService.getDataSourceDataByCodeAndParams(DataSources.TEAMMEMBERS,params).then((memberList: any) => {
      this._commonHelper.hideLoader();
      if (memberList) {
        this.members = memberList;
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private getTeamDetail(formMode) {
    this._commonHelper.showLoader();
    this.isInitialLoading = true;
    this._teamsService.getTeambyId(this.teamId).then(response => {
      if (response) {
        this.team = response as Teams;
        this.teamForm = this.createTeamForm(formMode);
      }
      this.isInitialLoading = false;
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private createTeamForm(frmMode): UntypedFormGroup {
    this.formMode = frmMode;
    //this.teamMember.id = 0;
    if (this.formMode == 'EDIT') {
      return this._formBuilder.group({
        Id: [this.team.id],
        name: [this.team.name, [Validators.required, Validators.maxLength(50)]],
        parentId: [this.team.parentId],
        teamMemberIds: [this.team.teamMemberIDs],
      });
    }
    else if (this.formMode == 'ADD') {
      this.team = new Teams({});
      this.team.id = 0;
      return this._formBuilder.group({
        id: [this.team.id],
        name: [this.team.name, Validators.compose([Validators.required, Validators.maxLength(50)])],
        ownerId: [this.team.ownerId, Validators.compose([Validators.required])],
        parentId: [this.team.parentId]
      });
    }
  }

  private createTeamMemberForm(frmode): UntypedFormGroup {
    this.formMode = frmode
    this.teamMember.id = 0;
    if (this.formMode == 'ADD') {
      this.teamMember = new TeamMember({});
      return this._formBuilder.group({
        Id: [this.teamMember.id],
        TeamId: [this.team.id],
        teamMemberRoleId: [this.teamMember.teamMemberRoleId, Validators.compose([Validators.required])],
        memberId: [this.teamMember.memberId],
        memberIds: [null, Validators.compose([Validators.required])],
      });
    }
    else if (this.formMode == 'EDIT') {
      return this._formBuilder.group({
        id: [this.teamMember.id],
        TeamId: this.teamMember.teamId,
        teamMemberRoleId: [this.teamMember.teamMemberRoleId, Validators.compose([Validators.required])],
        memberId: [this.teamMember.memberId],
        memberIds: [null],
      });
    }
  }

  private validateAllFormFields(formGroup: UntypedFormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      }
      else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }
  private getTeamMembers() {
    this._commonHelper.showLoader();   
    this._teamsService.getTeamMembersbyTeamId(this.teamId).then((response: any) => {
      this.teamMembers = response.filter(ele => (ele.teamMemberRoleId != TeamMemberRoleRefType.Owner && ele.teamId == this.teamId))
      this.totalRecordsteamMembers = this.teamMembers.length;
      this.showActiveTeamMembersRecords = this.teamMembers?.filter(x => x.memberIsActive);
      this.showActiveTeamMembersRecordsLength = this.showActiveTeamMembersRecords.length;
      
      this.owners = response.filter(ele => ele.teamMemberRoleId == TeamMemberRoleRefType.Owner && ele.teamId == this.teamId)
      this.showActiveOwnersRecords = this.owners?.filter(s => s.memberIsActive);
      this.showActiveOwnersRecordsLength = this.showActiveOwnersRecords.length;     
      // total
      this.totalRecordsOwners = this.owners.length;

      setTimeout(() => {     
        this.onFilterOwners();
        this.onFilterTeamMemebers();
      }, 750);
     
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('TEAMS.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

  private getTranslateErrorMessageFromList(error) {
    if (error && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('TEAMS.TEAM_MEMBERS.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }
  //#EndRegion Private methods
  
}

