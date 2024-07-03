import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { debounceTime, map, filter } from "rxjs/operators";
import { fromEvent } from 'rxjs';
import { Paginator } from 'primeng/paginator';

import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { PagingParams } from '../../../../@core/sharedModels/paging-params.model';
import { Role } from '../role.model';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { RolesService } from '../role.service';
import { LocalStorageKey } from '../../../../@core/enum';

@Component({
  selector: 'role-list',
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.scss']
})
export class RoleListComponent implements OnInit {
  //Form View child
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  //Role list data source
  dataSource: Role[] = [];
  pagingParams: PagingParams;

  //paginator
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;

  //permission variable
  isViewRole: boolean = false;
  isAddRole: boolean = false;
  isEditRole: boolean = false;
  isDeleteRole: boolean = false;

  //Table Column
  cols: any[];

  //search filter
  lastRoleSearchFilter: any;
  roleSearchFilter = {
    searchText: ''
  }

  constructor(private _router: Router,
    private _confirmationDialogService: ConfirmationDialogService,
    private _commonHelper: CommonHelper,
    private _rolesService: RolesService) {
    this.isViewRole = this._commonHelper.havePermission(enumPermissions.ViewRole);
    this.isAddRole = this._commonHelper.havePermission(enumPermissions.AddRole);
    this.isEditRole = this._commonHelper.havePermission(enumPermissions.EditRole);
    this.isDeleteRole = this._commonHelper.havePermission(enumPermissions.DeleteRole);

    //Set column  name json
    this.cols = [
      { field: 'name', header: 'URAM.ROLE.LIST.TABLE_HEADER_ROLE', sort: true, visible: true },
      { field: 'permissionSetName', header: 'URAM.ROLE.LIST.TABLE_HEADER_PERMISSION_SET', sort: false, visible: true },
      { field: 'id', header: '', sort: false,class: "icon--dropdown action", visible: true }
    ];

    //set Action column show/hide dynamically
    if (!this.isDeleteRole) {
      let entityNameColumn = this.cols.find(c => c.field == 'id');
      entityNameColumn.visible = false;
  }

    this._commonHelper.getTranlationData('dummyKey').then(result => {
      this.cols.forEach(item => {
        item.header = _commonHelper.getInstanceTranlationData(item.header);
      });
    });

    //Set load time PaginParam
    this.pagingParams = new PagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  ngOnInit(): void {

    //get local storage for search        
    let roleFilterData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_RoleSearch));
    if (roleFilterData != null) {
      this.roleSearchFilter = roleFilterData;
    }
    this.lastRoleSearchFilter = JSON.parse(JSON.stringify(this.roleSearchFilter));

    this.getRoles(this.pagingParams);

    //for text box on search debounce Time
    fromEvent(this.searchTextInput.nativeElement, 'keyup').pipe(
      // get value
      map((event: any) => {
        return event.target.value;
      })
      // if character length greater then 2
      , filter(res => res.length >= 0 || res == null || res === '')
      // Time in milliseconds between key events
      , debounceTime(1000)
    ).subscribe((text: string) => {
      this.pagingParams.pageNo = 1;
      this.pagingParams.searchString = this.roleSearchFilter.searchText;
      this.pTable.reset();
      this.getRoles(this.pagingParams);
    });
  }

  loadRoles() {
    if (this.pTable != undefined) {
      this.pagingParams.searchString = this.roleSearchFilter.searchText;

      if (this.pTable.sortOrder == 1) {
        this.pagingParams.sortOrder = "ASC";
      }
      else {
        this.pagingParams.sortOrder = "DESC";
      }
      this.pagingParams.sortColumn = this.pTable.sortField;

      this.getRoles(this.pagingParams)
    }
  }

  onResetAllFilters() {
    //set Serch Textbox value
    this.roleSearchFilter.searchText = '';

    //Set pagination params
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;

    //Fill Roles
    this.getRoles(this.pagingParams);
  }

  getRoles(pagingParams: PagingParams) {   

    this.roleSearchFilter.searchText = this.roleSearchFilter.searchText != null ? this.roleSearchFilter.searchText.trim() : '';
    pagingParams.searchString = this.roleSearchFilter.searchText;

    this._commonHelper.showLoader();
    this._rolesService.getRoles(pagingParams).then(
      response => {
        if (response) {
          this.dataSource = response as Role[];
          this.totalRecords = this.dataSource.length > 0 ? response[0].totalRecords : 0;
          this.pTable.rows = this.pagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
          this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.dataSource.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
        }
        this._commonHelper.hideLoader();
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);        
      });
    //set search filter in local storage
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_RoleSearch, JSON.stringify(this.roleSearchFilter));
  }

  //Call to add form
  addRole() {
    this._router.navigate(['uram/roles/add']);
  }

  deleteRole(roleId) {
    //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('URAM.ROLE.LIST.MESSAGE_CONFIRM_ROLE_DELETE', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._rolesService.deleteRole(roleId).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('URAM.ROLE.LIST.MESSAGE_ROLE_DELETE')
            );

            this.onResetAllFilters();
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }
      })
      .catch(() => this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('URAM.ROLE.LIST.ROLE_DISMISS_DIALOG')));
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('URAM.ROLE.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

  paginate(event) {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.loadRoles();
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
      this.loadRoles();
    }
  }

  changePage() {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.loadRoles();
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
    this.loadRoles();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to previous page
  prev() {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.loadRoles();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to next page
  next() {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.loadRoles();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }
}
