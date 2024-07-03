import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { Paginator } from 'primeng/paginator';
import { debounceTime, map, filter } from "rxjs/operators";
import { fromEvent } from 'rxjs';

import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { PagingParams } from '../../../../@core/sharedModels/paging-params.model';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { PermissionSet } from '../permissionset.model';
import { PermissionSetService } from '../permissionset.service';
import { LocalStorageKey } from '../../../../@core/enum';

@Component({
  selector: 'permissionset-list',
  templateUrl: './permissionset-list.component.html',
  styleUrls: ['./permissionset-list.component.scss'],
})
export class PermissionSetListComponent implements OnInit {

  //Form View child
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  //permission set list data source
  dataSource: PermissionSet[] = [];
  pagingParams: PagingParams;

  //paginator
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;

  //permission variable    
  isListPermissionSet: boolean = false; 
  isViewPermissionSet: boolean = false;
  isAddPermissionSet: boolean = false;
  isEditPermissionSet: boolean = false;
  isDeletePermissionSet: boolean = false;

  //Table Column
  cols: any[];

  //search filter
  lastPermissionSetSearchFilter: any;
  permissionSetSearchFilter = {
      searchText: ''
  }

  constructor(private _router: Router,
    private _confirmationDialogService: ConfirmationDialogService,
    private _commonHelper: CommonHelper,
    private _permissionSetService: PermissionSetService) {
    this.isListPermissionSet = this._commonHelper.havePermission(enumPermissions.ListPermissionSets);
    this.isViewPermissionSet = this._commonHelper.havePermission(enumPermissions.ViewPermissionSet);
    this.isAddPermissionSet = this._commonHelper.havePermission(enumPermissions.AddPermissionSet);
    this.isEditPermissionSet = this._commonHelper.havePermission(enumPermissions.EditPermissionSet);
    this.isDeletePermissionSet = this._commonHelper.havePermission(enumPermissions.DeletePermissionSet);

    //Set column  name json
    this.cols = [
      { field: 'name', header: 'URAM.PERMISSION_SET.LIST.TABLE_HEADER_PERMISSION_SET', sort: true, visible: true },
      { field: 'permissionName', header: 'URAM.PERMISSION_SET.LIST.TABLE_HEADER_PERMISSION', sort: false, visible: true },
      // { field: 'isActive', header: 'Active', sort: false },
      { field: 'id', header: '', sort: false, class: "action " + (this.isDeletePermissionSet ? "hide" : ""), visible: this.isDeletePermissionSet }
    ];

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
    this.pagingParams.pageSize = _commonHelper.DefaultPageSize;
  }

  ngOnInit(): void {

    //get local storage for search        
    let localPageLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.UsersPermissionsSetListKey)); 
    if(localPageLayout != null){
        this.permissionSetSearchFilter = localPageLayout;
    }       
    this.lastPermissionSetSearchFilter = JSON.parse(JSON.stringify(this.permissionSetSearchFilter));      

    this.getPermissionSets(this.pagingParams);

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
      this.pagingParams.searchString = this.permissionSetSearchFilter.searchText;
      this.pTable.reset();
      this.getPermissionSets(this.pagingParams);
    });
  }

  loadPermissionSets() {
    if (this.pTable != undefined) {
      this.pagingParams.searchString = this.permissionSetSearchFilter.searchText;

      if (this.pTable.sortOrder == 1) {
        this.pagingParams.sortOrder = "ASC";
      }
      else {
        this.pagingParams.sortOrder = "DESC";
      }
      this.pagingParams.sortColumn = this.pTable.sortField;

      this.getPermissionSets(this.pagingParams);
    }
  }

  onResetAllFilters(){
    this.permissionSetSearchFilter.searchText = '';
    //Set pagination params
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.getPermissionSets(this.pagingParams);
  }

  getPermissionSets(pagingParams: PagingParams) {
    
    this.permissionSetSearchFilter.searchText = this.permissionSetSearchFilter.searchText != null ? this.permissionSetSearchFilter.searchText.trim() : '';
    pagingParams.searchString = this.permissionSetSearchFilter.searchText;

    this._commonHelper.showLoader();
    this._permissionSetService.getPermissionSets(pagingParams).then(response => {
      if (response) {
        this.dataSource = response as PermissionSet[];
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
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.UsersPermissionsSetListKey, JSON.stringify(this.permissionSetSearchFilter));
  }

  //Call to add form
  addPermissionSet() {
    this._router.navigate(['uram/permissionsets/add']);
  }

  deletePermissionSet(permissionsetId) {
    //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('URAM.PERMISSION_SET.LIST.MESSAGE_PERMISSIONSET_DELETE', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._permissionSetService.delete(permissionsetId).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('URAM.PERMISSION_SET.LIST.MESSAGE_PERMISSIONSET_DELETE_SUCESSFULLY')
            );
              this.onResetAllFilters();
          },
            (error) => {
              this._commonHelper.hideLoader();
              this.getTranslateErrorMessage(error);
            });
        }
      })
      .catch(() => this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('URAM.PERMISSION_SET.LIST.PERMISSIONSETS_DISMISS_DIALOG')
      ));
  }

  getTranslateErrorMessage(error) {
      if (error != null && error.messageCode) {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('URAM.PERMISSION_SET.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
  }

  paginate(event) {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.loadPermissionSets()
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
      this.loadPermissionSets()
    }
  }

  changePage() {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.loadPermissionSets()
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
    this.loadPermissionSets();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to previous page
  prev() {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.loadPermissionSets();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to next page
  next() {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.loadPermissionSets();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }
}