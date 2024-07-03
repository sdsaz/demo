import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { debounceTime, map, filter } from "rxjs/operators";
import { fromEvent } from 'rxjs';
import { Paginator } from 'primeng/paginator';

import { PagingParams } from '../../../../@core/sharedModels/paging-params.model';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { Entity, LocalStorageKey, Actions} from '../../../../@core/enum';

import { UsersService } from '../users.service';
import { UserDetail } from '../../../../@core/sharedModels/user';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserResetPasswordDialogComponent } from '../user-reset-password-dialog/user-reset-password-dialog.component';
import { RolesService } from '../../roles/role.service';
import { DashboardService } from '../../../../@core/sharedServices/dashboard.service';
import { CommonService } from '../../../../@core/sharedServices/common.service';
import { EntityReferencesListComponent } from '../../../../@core/sharedComponents/entity-references-list/entity-references-list.component';
import { FileSignedUrlService } from '../../../../@core/sharedServices/file-signed-url.service';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss']
})

export class UserListComponent implements OnInit, AfterViewInit {

    //For Model Ref
    modalRef: NgbModalRef | null;

    //Form View child
    @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
    @ViewChild('pTable') private pTable: Table;
    @ViewChild('paginator', { static: true }) paginator: Paginator;

    //User list data source
    dataSource: any[] = [];
    pagingParams: PagingParams;

    //permission variable
    isViewUser: boolean = false;
    isAddUser: boolean = false;
    isEditUser: boolean = false;
    isDeleteUser: boolean = false;
    isEditProfile: boolean = false;

    loggedUserDetail: any;
    localStorageKeyPrefix: string = '';

    //all popup dialog open option settings
    optionsForPopupDialog: any = {
        size: "md",
        centered: false,
        backdrop: 'static',
        keyboard: false
    };

    //Table Column
    cols: any[];
    isShowImpersonateColumn: boolean = false;

    roleDataSource: any = [];

    //search filter
    lastUserSearchFilter: any;
    userSearchFilter = {
        searchText: '',
        selectedRoleIds: [],
        IsActive: false
    }

    IsActive: boolean = false;

    //paginator
    totalPages: number;
    start: number;
    end = 0;
    first = 0;
    totalRecords: number;

    countries: any;
    countryReadOnlyMask: any;

    constructor(private _router: Router,
        private _modalService: NgbModal,
        private _confirmationDialogService: ConfirmationDialogService,
        public _commonHelper: CommonHelper,
        private _usersService: UsersService,
        private _rolesService: RolesService,
        private _dashboardService: DashboardService,
        private _commonService: CommonService,
        private _fileSignedUrlService: FileSignedUrlService) {


        this.isViewUser = this._commonHelper.havePermission(enumPermissions.ViewUser);
        this.isAddUser = this._commonHelper.havePermission(enumPermissions.AddUser);
        this.isEditUser = this._commonHelper.havePermission(enumPermissions.EditUser);
        this.isDeleteUser = this._commonHelper.havePermission(enumPermissions.DeleteUser);
        this.isEditProfile = this._commonHelper.havePermission(enumPermissions.EditProfile);

        this.isShowImpersonateColumn = this._commonHelper.havePermission(enumPermissions.LoginImpersonate);

        //Set column  name json
        this.cols = [
            // { field: 'imagePath', header: '', sort: false, class: "user-img" },
            { field: 'fullName', header: 'URAM.USER.LIST.TABLE_HEADER_NAME', sort: true, visible: true },
            { field: 'email', header: 'URAM.USER.LIST.TABLE_HEADER_EMAIL', sort: true, visible: true },
            { field: 'phone', header: 'URAM.USER.LIST.TABLE_HEADER_PHONE', sort: true, visible: true },
            { field: 'roleName', header: 'URAM.USER.LIST.TABLE_HEADER_ROLE', sort: true, visible: true },
            { field: 'isActive', header: 'URAM.USER.LIST.TABLE_HEADER_STATUS', sort: true, class: "status", visible: true },
            { field: 'id', header: '', sort: false, class: "impersonate " + (!this.isShowImpersonateColumn ? "d-none" : ""), visible: true }, // URAM.USER.LIST.TABLE_HEADER_IMPERSONATELOGIN
            { field: 'action', header: '', sort: false, class: "icon--dropdown action", visible: true }
        ];

        //set Action column show/hide dynamically
        if (!this.isDeleteUser && !this.isEditProfile) {
            let entityNameColumn = this.cols.find(c => c.field == 'action');
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
        this.pagingParams.sortColumn = 'fullName';
        this.pagingParams.sortOrder = 'ASC';
        this.pagingParams.pageNo = 1;
        this.pagingParams.pageSize = _commonHelper.DefaultPageSize;
        this.pagingParams.roleIds = '';
        this.pagingParams.IsActive = this.IsActive;
    }

    ngOnInit(): void {
        this.loggedUserDetail = this._commonHelper.getLoggedUserDetail();

        //Set Local Storage Prefix
        this.localStorageKeyPrefix = `${this.loggedUserDetail.tenantId}_${this.loggedUserDetail.userId}`;

        //get local storage for search        
        let filterUserSearch = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_UsersListKey, this.localStorageKeyPrefix));
        if (filterUserSearch != null) {
            this.userSearchFilter = filterUserSearch;
            this.IsActive = this.userSearchFilter.IsActive;
        }
        this.lastUserSearchFilter = JSON.parse(JSON.stringify(this.userSearchFilter));
        this.getAllRoles();
        this.loadUsers();
        this.getCountries();
    }

    ngAfterViewInit() {
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
            this.pagingParams.searchString = this.userSearchFilter.searchText;
            this.pTable.reset();
            this.getUsers(this.pagingParams);
        });
    }

    onResetAllFilters() {
        this.userSearchFilter = {
            searchText: '',
            selectedRoleIds: [],
            IsActive: false
        }

        this.IsActive = false;
        
        //Set pagination params
        this.pagingParams.searchString = '';
        this.pagingParams.sortColumn = 'fullName';
        this.pagingParams.sortOrder = 'ASC';
        this.pagingParams.pageNo = 1;
        this.pagingParams.roleIds = '';
        this.pagingParams.IsActive = false;

        //Fill Users
        this.getUsers(this.pagingParams);
    }

    loadUsers() {
        if (this.userSearchFilter.selectedRoleIds.length > 0) {
            
            this.pagingParams.roleIds = this.userSearchFilter.selectedRoleIds.toString();
        } else {
            this.pagingParams.roleIds = '';
        }

        this.userSearchFilter.searchText = this.userSearchFilter.searchText != null ? this.userSearchFilter.searchText.trim() : '';
        this.pagingParams.searchString = this.userSearchFilter.searchText;

        if (this.userSearchFilter.selectedRoleIds.length > 0) {
            this.pagingParams.roleIds = this.userSearchFilter.selectedRoleIds.toString();
        } else {
            this.pagingParams.roleIds = '';
        }
        this.getUsers(this.pagingParams);
    }


    public onFilterShowActiveRecords() {
       this.userSearchFilter.IsActive = this.IsActive;
       this.pagingParams.pageNo = 1;
       this.getUsers(this.pagingParams);
    }


    getUsers(pagingParams: PagingParams) {
        this._commonHelper.showLoader();
        this.pagingParams.searchString = this.userSearchFilter.searchText;

        this.pagingParams.IsActive = !this.userSearchFilter.IsActive;
        
        this._usersService.getUsers(pagingParams).then(
            response => {
                if (response) {
                    this.dataSource = response as UserDetail[];
                    this.totalRecords = this.dataSource.length > 0 ? response[0].totalRecords : 0;
                    this.pTable.rows = this.pagingParams.pageSize;
                    this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
                    this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
                    this.start = this.end == this.totalRecords ? (this.totalRecords - this.dataSource.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
                    this._fileSignedUrlService.getFileSingedUrl(this.dataSource,'imagePath', 'imagePathSignedUrl',Entity.Users);
                    // this.setPaginationInfo();
                    this.dataSource.forEach((user: any) => {
                        if (user.phone) {
                          const phoneDetail = String(user.phone).split('|');
                          if (phoneDetail.length == 2) {
                            user['countryCode'] = phoneDetail[0];
                            user['phoneNumber'] = phoneDetail[1];
                            user['phoneMask'] = String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0");
                          } 
                        }
                    })
                }
                this._commonHelper.hideLoader();
            },
            (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
            });

        //set search filter in local storage
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_UsersListKey, JSON.stringify(this.userSearchFilter), this.localStorageKeyPrefix);
    }

    //admin reset user password
    resetPassword(userId) {
        this.optionsForPopupDialog.size = "md";
        this.modalRef = this._modalService.open(UserResetPasswordDialogComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.userId = userId;
        this.modalRef.result.then(response => {
            if (response != undefined) {

                //Set pagination params
                this.pagingParams.searchString = '';
                this.pagingParams.sortColumn = 'fullName';
                this.pagingParams.sortOrder = 'ASC';
                this.pagingParams.pageNo = 1;
                this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
                //Fill Users
                this.getUsers(this.pagingParams);
            }
        });
    }

    //Call to add form
    addUser() {
        this._router.navigate(['uram/users/add']);
    }

    deleteUser(userId) {
        //option for confirm dialog settings
        let optionsForConfirmDialog = {
            size: "md",
            centered: false,
            backdrop: 'static',
            keyboard: false
        };
        const params = {
            EntityTypeId: Entity.Users,
            EntityId: userId
        };
        this._commonHelper.showLoader();
        this._commonService.getEntityReferences(params).then((response: any) => {
            this._commonHelper.hideLoader();
            if (response != undefined && response.length != 0) {
                if (this._modalService.hasOpenModals()) {
                    return;
                }
                
                this.optionsForPopupDialog.size = "lg";
                this.modalRef = this._modalService.open(EntityReferencesListComponent, this.optionsForPopupDialog);
                this.modalRef.componentInstance.entityList = response;
                this.modalRef.componentInstance.entityId = userId;
                this.modalRef.componentInstance.entityTypeId = Entity.Users;
                this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData('URAM.USER.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DELETE_LABEL');
                this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('URAM.USER.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE');
                this.modalRef.componentInstance.action = Actions.Delete;
            }
            else {
                this._commonHelper.hideLoader();
                this._confirmationDialogService.confirm('URAM.USER.LIST.MESSAGE_CONFIRM_DELETE', null, null, optionsForConfirmDialog)
                    .then((confirmed) => {
                        if (confirmed) {
                            this._commonHelper.showLoader();
                            this._usersService.delete(userId).then(response => {
                                this._commonHelper.hideLoader();
                                this._commonHelper.showToastrSuccess(
                                    this._commonHelper.getInstanceTranlationData('URAM.USER.LIST.MESSAGE_USER_DELETE')
                                );
                                this.loadUsers();
                            },
                                (error) => {
                                    this._commonHelper.hideLoader();
                                    this.getTranslateErrorMessage(error);
                                });
                        }
                    });
            }
        });
    }

    getAllRoles(): void {
        this._commonHelper.showLoader();
        this._usersService.getRoles().then(response => {
            this._commonHelper.hideLoader();
            if (response) {
                this.roleDataSource = response as [];
            }
        },
            (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
            });
    }

    getTranslateErrorMessage(error) {
        if (error != null && error.messageCode) {
            this._commonHelper.showToastrError(
                this._commonHelper.getInstanceTranlationData('URAM.USER.' + error.messageCode.replace('.', '_').toUpperCase())
            );
        }
    }

    onLoginImpersonate(rowData: any): void {
        this._commonHelper.showLoader();
        this._usersService.loginImpersonate(rowData.id).then(response => {
            this._commonHelper.hideLoader();
            if (response) {
                let accessToken = response;
                this._router.navigateByUrl(`auth/autologin?k=${accessToken}`);
            }
        },
        (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
        });
    }

    paginate(event) {
        this.pagingParams.pageNo = (event.first / event.rows) + 1;
        this.pagingParams.pageSize = event.rows;
        this.loadUsers();
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
            this.loadUsers();
        }
    }

    changePage() {
        if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
            this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
            this.loadUsers();
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
        this.loadUsers();
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }

    // go to previous page
    prev() {
        this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
        if (this.end == this.pagingParams.pageSize) {
            return false;
        }
        this.loadUsers();
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }

    // go to next page
    next() {
        this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
        if (this.end == this.totalRecords) {
            return false;
        }
        this.loadUsers();
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }

    onChangeStatus(rowData) {
        if (!this.isEditUser) {
            return;
        }
        const params = {
            EntityTypeId: Entity.Users,
            EntityId: rowData.id
        };
        let messageText = rowData.isActive ? 'URAM.USER.LIST.MESSAGE_CONFIRM_ACTIVE' : 'URAM.USER.LIST.MESSAGE_CONFIRM_INACTIVE';
        let successText = rowData.isActive ? 'URAM.USER.LIST.MESSAGE_USER_ACTIVATED' : 'URAM.USER.LIST.MESSAGE_USER_INACTIVATED';
        this._commonHelper.showLoader();
        this._commonService.getEntityReferences(params).then((response: any) => {
            this._commonHelper.hideLoader();
            if (response != undefined && response.length != 0 && !rowData.isActive) {
                if (this._modalService.hasOpenModals()) {
                    return;
                }

                this.optionsForPopupDialog.size = "lg";
                this.modalRef = this._modalService.open(EntityReferencesListComponent, this.optionsForPopupDialog);
                this.modalRef.componentInstance.entityList = response;
                this.modalRef.componentInstance.entityId = rowData.id;
                this.modalRef.componentInstance.entityTypeId = Entity.Users;
                this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData('URAM.USER.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_STATUS_LABEL');
                this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('URAM.USER.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE');
                this.modalRef.componentInstance.action = Actions.InActive;
                this.modalRef.result.then((response: any) => {
                    if (response) {
                        let params = { id: rowData.id, isActive: rowData.isActive };
                        this._commonHelper.showLoader();
                        this._usersService.changeUserStatus(params.id, params.isActive).then((response: any[]) => {
                            if (response) {
                                this.pagingParams.IsActive = !this.pagingParams.IsActive;
                                this._commonHelper.showToastrSuccess(
                                    this._commonHelper.getInstanceTranlationData(successText)
                                );
                            }
                            this.getUsers(this.pagingParams);
                            this._commonHelper.hideLoader();
                        }, (error) => {
                            this.getUsers(this.pagingParams);
                            this._commonHelper.hideLoader();
                            this.getTranslateErrorMessage(error);
                        });
                    }
                    else {
                        rowData.isActive = !rowData.isActive;
                    }
                })

            }
            else {
                this.optionsForPopupDialog.size = "md";
                this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
                    if (confirmed) {
                        let params = { id: rowData.id, isActive: rowData.isActive };
                        this._commonHelper.showLoader();
                        this._usersService.changeUserStatus(params.id, params.isActive).then((response: any[]) => {
                            if (response) {
                                this.pagingParams.IsActive = !this.pagingParams.IsActive;
                                this._commonHelper.showToastrSuccess(
                                    this._commonHelper.getInstanceTranlationData(successText)
                                );
                            }
                            this.getUsers(this.pagingParams);
                            this._commonHelper.hideLoader();
                        }, (error) => {
                            this.getUsers(this.pagingParams);
                            this._commonHelper.hideLoader();
                            this.getTranslateErrorMessage(error);
                        });
                    }
                    else {
                        rowData.isActive = !rowData.isActive;
                    }
                });
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
}
