import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { Paginator } from 'primeng/paginator';
import { PagingParams } from '../../../../@core/sharedModels/paging-params.model';
import { TeamsService } from '../teams.service';
import { UsersService } from '../../../usermanagement/users/users.service';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { Teams } from '../teams.model';
import { FormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TeamMemberImportDialogComponent } from '../team-member-import-dialog/team-member-import-dialog.component';
import { LocalStorageKey } from '../../../../@core/enum';

@Component({
  selector: 'ngx-teams-list',
  templateUrl: './teams-list.component.html',
  styleUrls: ['./teams-list.component.scss']
})
export class TeamsListComponent implements OnInit {
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('paginator', { static: true }) paginator: Paginator;
  @ViewChild('pTable', { static: false }) private pTable: Table;
  @ViewChild('entityDropdown', { static: false }) entityDropdownRef;

  pagingParams: PagingParams

  //Form
  teamForm: UntypedFormGroup;
  isEdit: boolean = false;

  //Table Column
  cols: any[];
  totalRecords: number;
  owner: any;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;

  //Data Souce
  teams: any = [];
  team: any;
  submitted = false;
  isEntitySelected = false;

  addEditTeamDiv: boolean = false;

  //search filter
  teamSearchFilter = {
    searchText: ''
  }

  //permissions
  isEditTeam: boolean = false;
  isAddTeam: boolean = false;
  isDeleteTeam: boolean = false;
  isListTeam: boolean = false;
  isViewTeam: boolean = false;
  isImportTeamMembers: boolean;

  //Loader Flag
  ownerId: number = null;

  //For Model Ref
  modalRef: NgbModalRef | null;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  constructor(public _commonHelper: CommonHelper,
    private _router: Router,
    private _confirmationDialogService: ConfirmationDialogService,
    private _teamsService: TeamsService,
    private _modalService: NgbModal) {

    //initiate Permissions
    this.isListTeam = this._commonHelper.havePermission(enumPermissions.ListTeams);
    this.isViewTeam = this._commonHelper.havePermission(enumPermissions.ViewTeam);
    this.isAddTeam = this._commonHelper.havePermission(enumPermissions.AddTeam);
    this.isEditTeam = this._commonHelper.havePermission(enumPermissions.EditTeam);
    this.isDeleteTeam = this._commonHelper.havePermission(enumPermissions.DeleteTeam);
    this.isImportTeamMembers = this._commonHelper.havePermission(enumPermissions.ImportTeamMembers);

    //Set column  name json
    this.cols = [
      { field: 'name', header: 'TEAMS.LIST.TABLE_HEADER_TEAMS', sort: true, visible: true },
      { field: 'ownerName', header: 'TEAMS.LIST.TABLE_HEADER_OWNER', sort: true, visible: true },
      { field: 'membersCount', header: 'TEAMS.LIST.TABLE_HEADER_TOTAL_MEMBERS', sort: true, class: 'pr-5 justify-content-end', visible: true},
      { field: 'ID', header: '', sort: false, class: "action" + (this.isDeleteTeam ? "hide" : ""), visible: this.isDeleteTeam }
    ];

    this._commonHelper.getTranlationData('dummyKey').then(result => {
      this.cols.forEach(item => {
        item.header = _commonHelper.getInstanceTranlationData(item.header);
      });
    });

    //Set load time PaginParam
    this.pagingParams = new PagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'teamName';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = _commonHelper.DefaultPageSize;

  }

  ngOnInit(): void {
    this.getTeams(this.pagingParams);
    //this.getusers();
  }

  // convenience getter for easy access to form fields
  get f() { return this.teamForm.controls; }

  //Call to add form
  addTeam() {
    this._router.navigate(['teammanagement/teams/add']);
  }

  validateAllFormFields(formGroup: UntypedFormGroup) {
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

  getTeams(pagingParams: PagingParams) {
    this.teamSearchFilter.searchText = this.teamSearchFilter.searchText != null ? this.teamSearchFilter.searchText.trim() : '';
    pagingParams.searchString = this.teamSearchFilter.searchText;

    this._commonHelper.showLoader();
    this._teamsService.getTeams(pagingParams).then(
      response => {
        if (response) {
          this.teams = response as Teams[];
          this.totalRecords = this.teams.length > 0 ? response[0].totalRecords : 0;
          this.pTable.rows = this.pagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
          this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.teams.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
        }
        this._commonHelper.hideLoader();
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  paginate(event) {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.getTeams(this.pagingParams);
  }

  ChangeOrder(column) {
    if (column.sort) {
      if (this.pTable.sortOrder == 1) {
        this.pagingParams.sortOrder = "ASC";
      }
      else {
        this.pagingParams.sortOrder = "DESC";
      }
      this.pagingParams.sortColumn = this.pTable.sortField;
      this.getTeams(this.pagingParams);
    }
  }

  changePage() {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.getTeams(this.pagingParams);
    }
    else if (this.pagingParams.pageNo > this.totalPages) {
      this.pagingParams.pageNo = this.totalPages;
    }
    else if (this.pagingParams.pageNo <= 0) {
      this.pagingParams.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  resetPaginator() {
    this.pagingParams.pageNo = 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.getTeams(this.pagingParams);
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to previous page
  prev() {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.getTeams(this.pagingParams);
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to next page
  next() {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getTeams(this.pagingParams);
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  deleteteam(Id) {
    this.optionsForPopupDialog.size = "md";
    this._confirmationDialogService.confirm('TEAMS.LIST.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._teamsService.deleteteam(Id).then(reponse => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('TEAMS.LIST.MESSAGE_TEAM_DELETED')
            );
            this.getTeams(this.pagingParams);
          },
            (error: any) => {
              this._commonHelper.hideLoader();
              if (error && error.messageCode.toUpperCase() == "TEAMS.CANNOTBEDELETED") {
                this._commonHelper.showToastrWarning(
                  this._commonHelper.getInstanceTranlationData("TEAMS.LIST." + error.messageCode.replace('.', '_').toUpperCase())
                );
              }
              else {
                this.getTranslateErrorMessageFromList(error);
              }
            });
        }
      });
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('TEAMS.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }
  getTranslateErrorMessageFromList(error) {
    if (error && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('TEAMS.LIST.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

  openTeamMemberImport() {
    this.modalRef = this._modalService.open(TeamMemberImportDialogComponent, this.optionsForPopupDialog);
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshData();
      }
    });
  }

  refreshData() {
    this.pagingParams.pageNo = 1;
    this.getTeams(this.pagingParams);
  }

}
