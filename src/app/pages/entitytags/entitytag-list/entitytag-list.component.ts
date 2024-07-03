import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { Table } from 'primeng/table';
import { debounceTime, map, filter } from "rxjs/operators";
import { fromEvent, Subscription } from 'rxjs';
import { Paginator } from 'primeng/paginator';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { ActivatedRoute, Router } from '@angular/router';
import { EntitytagsService } from '../entitytags.service';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { LocalStorageKey } from '../../../@core/enum';
import { PagingParams } from '../../../@core/sharedModels/paging-params.model';

@Component({
    selector: 'ngx-entitytag-list',
    templateUrl: './entitytag-list.component.html',
    styleUrls: ['./entitytag-list.component.scss']
})
export class EntitytagListComponent implements OnInit, AfterViewInit {

    //Form View child
    @ViewChild('searchTextInput', { static: false }) searchTextInput: ElementRef;
    @ViewChild('pTable', { static: false }) private pTable: Table;
    @ViewChild('paginator', { static: true }) paginator: Paginator;

    //Drop-down DataSource
    tagCategoryList: any;

    //model
    entityTags: any = [];
    entities: any = [];
    entityRecordTypes: any = [];
    filteredentityRecordTypesForFilter: any = [];
    selectedEntities: any = null;
    selectedEntityRecordType: any = null;

    //permission
    isListTags: boolean = false;
    isAddTag: boolean = false;
    isEditTag: boolean = false;
    isDeleteTag: boolean = false;

    filterParam = {
        searchString: '',
        sortColumn: 'name',
        sortOrder: 'DESC',
        pageNo: 1,
        pageSize: this._commonHelper.DefaultPageSize,
        hashData: '',
        filters: {
            EntityTypeId: null,
            EntityRecordTypeId: null,
            TagCategoryId: null
        },
        IsActive: false
    };

    IsActive: boolean = false;

    //all popup dialog open option settings
    optionsForPopupDialog: any = {
        size: "md",
        centered: false,
        backdrop: 'static',
        keyboard: false
    };

    //paginator
    totalPages: number;
    start: number;
    end = 0;
    first = 0;
    totalRecords: number;

    //Table Column
    cols: any[];

    tenantDataSource = [{ id: 0, name: 'All Tenants' }];

    userSearchFilter = {
        searchText: '',
        selectedTenant: {},
        IsActive: false
    }

    _loggedInUser: any;
    localStoragePrefix: string = "";

    constructor(public _commonHelper: CommonHelper,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _entityTagsService: EntitytagsService,
        private _commonService: CommonService,
        private _confirmationDialogService: ConfirmationDialogService) {

        //initiate Permissions
        this.isListTags = this._commonHelper.havePermission(enumPermissions.ListTags);
        this.isAddTag = this._commonHelper.havePermission(enumPermissions.AddTag);
        this.isEditTag = this._commonHelper.havePermission(enumPermissions.EditTag);
        this.isDeleteTag = this._commonHelper.havePermission(enumPermissions.DeleteTag);

        //Set column  name json
        this.cols = [
            { field: 'name', header: 'ENTITYTAGS.ENTITYTAGS.LIST.TABLE_HEADER_NAME', sort: true, visible: true },
            { field: 'tagCategoryName', header: 'ENTITYTAGS.ENTITYTAGS.LIST.TABLE_HEADER_CATEGORYNAME', sort: true, visible: true },
            { field: 'entityTypeName', header: 'ENTITYTAGS.ENTITYTAGS.LIST.TABLE_HEADER_ENTITYTYPE', sort: true, visible: true },
            { field: 'entityRecordTypeName', header: 'ENTITYTAGS.ENTITYTAGS.LIST.TABLE_HEADER_ENTITYRECORDTYPE', sort: true, visible: true },
            { field: 'displayOrder', header: 'ENTITYTAGS.ENTITYTAGS.LIST.TABLE_HEADER_DISPLAYORDER', sort: true, class: 'pr-5 justify-content-end', visible: true },
            // { field: 'isActive', header: 'ENTITYTAGS.ENTITYTAGS.LIST.TABLE_HEADER_STATUS', sort: true },
            { field: 'tagCategoryId', header: '', sort: false, class: "d-none", visible: true },
            { field: 'id', header: '', sort: false, class: "icon--dropdown action", visible: true }
        ];

        //set Action column show/hide dynamically
        if (!this.isDeleteTag) {
            let entityNameColumn = this.cols.find(c => c.field == 'id');
            entityNameColumn.visible = false;
        }
    }

    ngOnInit() {
        // get logged in user information
        this._loggedInUser = this._commonHelper.getLoggedUserDetail();

        //set local storage prefix
        this.localStoragePrefix = `${this._loggedInUser?.tenantId}_${this._loggedInUser?.userId}`

        Promise.all([
            this.getEntities()
          ]).then(() => {
            this.setLastSearchFilterFromStorage();
            this.getEntityTagsCategoriesByEntityTypeId();
            this.getEntityTagsData();
          });
    }

    ngAfterViewInit(): void {
        //for text box on search debounce Time
        fromEvent(this.searchTextInput.nativeElement, 'keyup').pipe(
            // get value
            map((event: any) => {
                return event.target.value;
            })
            // if character length greater then 3
            , filter(res => res.length >= 0 || res == null || res === '')
            // Time in milliseconds between key events
            , debounceTime(1000)
        ).subscribe((text: string) => {
            this.filterParam.pageNo = 1;
            this.pTable.reset();
            this.getEntityTagsData();
        });
    }

    private setLastSearchFilterFromStorage(): void {
        const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_EntityTagKey, this.localStoragePrefix));
        if (searchFilter != null) {
          this.filterParam = searchFilter;
          this.IsActive = this.filterParam.IsActive;
            this.selectedEntities = this.filterParam.filters.EntityTypeId;
            this.selectedEntityRecordType = this.filterParam.filters.EntityRecordTypeId;

        }
        else{
            this.selectedEntities = null;
            this.selectedEntityRecordType = null;
        }
        this.filterParam = JSON.parse(JSON.stringify(this.filterParam));
      }

    deleteEntityTags(Id, entityName) {
        this._confirmationDialogService.confirm('ENTITYTAGS.ENTITYTAGS.LIST.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog).then((confirmed) => {
            if (confirmed) {
                this._commonHelper.showLoader();
                this._entityTagsService.deleteEntityTagById(Id).then(response => {
                    this._commonHelper.hideLoader();
                    this._commonHelper.showToastrSuccess(
                        this._commonHelper.getInstanceTranlationData('ENTITYTAGS.ENTITYTAGS.LIST.MESSAGE_ENTITYTAG_DELETED')
                    );
                    this.getEntityTagsData();
                },
                (error: any) => {
                    this._commonHelper.hideLoader();
                    if (error && error.messageCode.toUpperCase() == "ENTITYTAG.CANNOTBEDELETED") {
                        this._commonHelper.showToastrWarning(
                            this._commonHelper.getInstanceTranlationData("ENTITYTAGS.ENTITYTAGS.LIST." + error.messageCode.replace('.', '_').toUpperCase(), { entityName: entityName })
                        );
                    }
                    else {
                        this.getTranslateErrorMessage(error);
                    }
                });
            }
        });
    }

    onEntitySelectionChange(value:any) {
        this.filteredentityRecordTypesForFilter = this.entityRecordTypes;
        if(value != null){
            this.filteredentityRecordTypesForFilter = this.filteredentityRecordTypesForFilter.filter(x=>x.entityTypeID == value);
        }

        this.filterParam.filters.EntityTypeId = value;

        if(this.filteredentityRecordTypesForFilter.filter(x=> x.value == this.selectedEntityRecordType).length > 0){
            this.filterParam.filters.EntityRecordTypeId = this.selectedEntityRecordType;
        }
        else
        {
            this.filterParam.filters.EntityRecordTypeId = null;
            this.selectedEntityRecordType = null;
        }
        
        this.filterParam.pageNo = 1;

        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_EntityTagKey, JSON.stringify(this.filterParam), this.localStoragePrefix);
        this.getEntityTagsData();
        this.getEntityTagsCategoriesByEntityTypeId();
    }

    changeEntityRecordTypeType(value) {
        this.filterParam.filters.EntityTypeId = this.selectedEntities;
        this.filterParam.filters.EntityRecordTypeId = value;
        this.filterParam.pageNo = 1;

        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_EntityTagKey, JSON.stringify(this.filterParam), this.localStoragePrefix);
        this.getEntityTagsData();
        this.getEntityTagsCategoriesByEntityTypeId();
    }

    onTagCategorySelectionChange(value) {
        this.filterParam.filters.TagCategoryId = value;
        this.filterParam.pageNo = 1;

        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_EntityTagKey, JSON.stringify(this.filterParam), this.localStoragePrefix);
        this.getEntityTagsData();
    }

    onResetAllFilters() {
        this.filterParam.searchString = '';
        this.filterParam.filters.EntityTypeId = null;
        this.filterParam.filters.EntityRecordTypeId = null;
        this.filterParam.filters.TagCategoryId = null;
        this.filterParam.IsActive = false;

        this.IsActive = false;
        this.selectedEntities = null;
        this.selectedEntityRecordType = null;
        this.filterParam.pageNo = 1;

        this.filteredentityRecordTypesForFilter = this.entityRecordTypes;

        this.getEntityTagsCategoriesByEntityTypeId();
        this.getEntityTagsData();
    }

    addNewEntityTags() {
        this._router.navigate(['add'], { relativeTo: this._activatedRoute });
    }

    paginate(event) {
        this.filterParam.pageNo = (event.first / event.rows) + 1;
        this.filterParam.pageSize = event.rows;
        this.getEntityTagsData();
    }

    ChangeOrder(column) {
        if (column.sort) {
            if (this.pTable.sortOrder == 1) {
                this.filterParam.sortOrder = "ASC";
            }
            else {
                this.filterParam.sortOrder = "DESC";
            }
            this.filterParam.sortColumn = this.pTable.sortField;
            this.getEntityTagsData();
        }
    }

    changePage() {
        if (this.filterParam.pageNo <= this.totalPages && this.filterParam.pageNo > 0) {
            this.filterParam.pageNo = this.filterParam.pageNo > 0 ? this.filterParam.pageNo : 1;
            this.getEntityTagsData();
        }
        else if (this.filterParam.pageNo > this.totalPages) {
            this.filterParam.pageNo = this.totalPages;
        }
        else if (this.filterParam.pageNo <= 0) {
            this.filterParam.pageNo = 1;
        }
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }

    resetPaginator() {
        this.filterParam.pageNo = 1;
        if (this.end == this.filterParam.pageSize) {
            return false;
        }
        this.getEntityTagsData();
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }

    // go to previous page
    prev() {
        this.filterParam.pageNo = this.filterParam.pageNo - 1 > 0 ? this.filterParam.pageNo - 1 : 1;
        if (this.end == this.filterParam.pageSize) {
            return false;
        }
        this.getEntityTagsData();
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }

    // go to next page
    next() {
        this.filterParam.pageNo = (this.filterParam.pageNo + 1) <= this.totalPages ? this.filterParam.pageNo + 1 : this.totalPages;
        if (this.end == this.totalRecords) {
            return false;
        }
        this.getEntityTagsData();
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }

    public onFilterShowActiveRecords() {
        this.filterParam.IsActive = this.IsActive;
        this.filterParam.pageNo = 1;
        this.getEntityTagsData();
      }

    //#region Private Method
    private getEntities() {
        return new Promise((resolve, reject) => {
            const entityWithRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.VisibleEntityWithRecordTypes));
            if (entityWithRecordTypes == null) {
                this._commonHelper.showLoader();
                this._commonService.getDisplayEntityWithRecordType().then((entitylist: any) => {
                    if (entitylist) {
                        this.processEntities(entitylist);
                        // store in local storage
                        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.VisibleEntityWithRecordTypes, JSON.stringify(entitylist));
                    }
                    this._commonHelper.hideLoader();
                    resolve(null);
                },
                    (error) => {
                        this._commonHelper.hideLoader();
                        reject(null);
                        this.getTranslateErrorMessage(error);
                    });
            }
            else {
                this.processEntities(entityWithRecordTypes);
                resolve(null);
            }
        });
    }

    private processEntities(entitylist: any) {
        entitylist.forEach(element => {
            this.entities.push({ label: element.displayName, value: element.id });
            if (element.entityRecordTypes) {
                element.entityRecordTypes.forEach(recordType => {
                    this.entityRecordTypes.push({ label: recordType.name, value: recordType.id, entityTypeID: element.id });
                });
            }
        });
        this.filteredentityRecordTypesForFilter = this.entityRecordTypes;
    }

    private getEntityTagsCategoriesByEntityTypeId(): void {
        this._commonHelper.showLoader();
        this._entityTagsService.getEntityTagsCategoriesByEntityTypeId(this.filterParam.filters.EntityTypeId, this.filterParam.filters.EntityRecordTypeId).then((response: any) => {
            if (response) {
                this.tagCategoryList = response.map((i: any) =>
                    ({ label: i.text, value: i.value })
                );
            }
            this._commonHelper.hideLoader();
        }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
        });
    }

    private getEntityTagsData() {
        this._commonHelper.showLoader();

        this.filterParam.IsActive = !this.IsActive;
       
        this._entityTagsService.getEntityTags(this.filterParam).then((response: any) => {
            if (response) {
                let result: any = response;
                    this.filterParam.IsActive = !this.filterParam.IsActive;
                    this.entityTags = result.data || [];
                    this.totalRecords = result.data.length > 0 ? result.data[0].totalRecords : 0;
                    this.pTable.rows = this.filterParam.pageSize;
                    this.totalPages = Math.ceil(this.totalRecords / this.filterParam.pageSize);
                    this.end = this.filterParam.pageNo == this.totalPages ? this.totalRecords : this.filterParam.pageNo * this.filterParam.pageSize;
                    this.start = this.end == this.totalRecords ? (this.totalRecords - this.entityTags.length + 1) : (this.end - this.filterParam.pageSize) + 1;
            }
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_EntityTagKey, JSON.stringify(this.filterParam), this.localStoragePrefix);
            this._commonHelper.hideLoader();
        },
        (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_EntityTagKey, JSON.stringify(this.filterParam), this.localStoragePrefix);
        });
        
    }

    private getTranslateErrorMessage(error) {
        if (error && error.messageCode) {
            this._commonHelper.showToastrError(
                this._commonHelper.getInstanceTranlationData("ENTITYTAGS.ENTITYTAGS.LIST." + error.messageCode.replace('.', '_').toUpperCase())
            );
        }
    }
    //#endregion Private Method
}
