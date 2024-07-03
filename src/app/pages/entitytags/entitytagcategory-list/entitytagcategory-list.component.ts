import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Table } from 'primeng/table';
import { debounceTime, map, filter } from "rxjs/operators";
import { fromEvent, Subscription } from 'rxjs';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { EntitytagCategories } from '../entitytags.model';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { EntitytagsService } from '../entitytags.service';
import { ValidateDropdown } from '../../../@core/sharedValidators/entities-Dropdown.validator';
import { LocalStorageKey } from '../../../@core/enum';
@Component({
    selector: 'entitytagcategory-list',
    templateUrl: './entitytagcategory-list.component.html',
    styleUrls: ['./entitytagcategory-list.component.scss']
})
export class EntitytagcategoryListComponent implements OnInit, AfterViewInit {
    //Form View child
    @ViewChild('entityDropdown', { static: false }) entityDropdownRef;
    @ViewChild('searchTextInput', { static: false }) searchTextInput: ElementRef;
    @ViewChild('pTable', { static: false }) private pTable: Table;

    private entityTagCategoryNameRef: ElementRef;
    @ViewChild('entityTagCategoryName', { static: false }) set content(content: ElementRef) {
        if (content) { // initially setter gets called with undefined
            this.entityTagCategoryNameRef = content;
        }
    }

    //Form
    tagsCategoryForm: UntypedFormGroup;
    isEdit: boolean = false;

    //Data Souce
    entityTagsCategories: any = [];
    isEntitySelected = false;
    submitted = false;

    //permissions
    isEditTagCategory: boolean = false;
    isListTagCategories: boolean = false;
    isAddTagCategory: boolean = false;
    isDeleteTagCategory: boolean = false;
    isShowActionColumn: boolean = false;

    //Table Column
    cols: any[];
    totalRecords: number;
    IsPrivate: string;
    entities: any = [];
    entityRecordTypes: any = [];
    filteredentityRecordTypes: any = [];
    filteredentityRecordTypesForFilter: any = [];
    tagsCategory: EntitytagCategories;

    totalPages: number;
    start: number;
    end = 0;
    first = 0;

    addEditTagsCategoryDiv: boolean = false;

    //Loader Flag
    isLoading: boolean;
    hashData: any = '';
    selectedEntities: number = null;
    selectedEntityRecordType: number = null;
    filterParam = {
        searchString: '',
        sortColumn: 'name',
        sortOrder: 'DESC',
        pageNo: 1,
        pageSize: this._commonHelper.DefaultPageSize,
        hashData: '',
        filters: {
            EntityTypeId: null,
            EntityRecordTypeId: null
        }
    };

    //all popup dialog open option settings
    optionsForPopupDialog: any = {
        size: "md",
        centered: false,
        backdrop: 'static',
        keyboard: false
    };

    //Validation
    tagsCategories_validation_messages = {
        'name': [
            { type: 'required', message: 'ENTITYTAG_CATEGORY.ADD.MESSAGE_REQUIRED_NAME' },
            { type: 'maxlength', message: 'ENTITYTAG_CATEGORY.ADD.MESSAGE_NAME_MAX' }
        ],
        'entityDropDown': [
            { type: 'required', message: 'ENTITYTAG_CATEGORY.ADD.MESSAGE_REQUIRED_ENTITY' }
        ]
    };

    _loggedInUser: any;
    localStoragePrefix: string = "";

    constructor(private _formBuilder: UntypedFormBuilder,
        public _commonHelper: CommonHelper,
        private _confirmationDialogService: ConfirmationDialogService,
        private _entityTagsService: EntitytagsService,
        private _commonService: CommonService
    ) {

        //initiate Permissions
        this.isEditTagCategory = this._commonHelper.havePermission(enumPermissions.EditTagCategory);
        this.isListTagCategories = this._commonHelper.havePermission(enumPermissions.ListTagCategories);
        this.isAddTagCategory = this._commonHelper.havePermission(enumPermissions.AddTagCategory);
        this.isDeleteTagCategory = this._commonHelper.havePermission(enumPermissions.DeleteTagCategory);

        this.isShowActionColumn = this.isDeleteTagCategory || this.isEditTagCategory;

        //Set column  name json
        this.cols = [
            { field: 'name', header: 'ENTITYTAG_CATEGORY.LIST.TABLE_HEADER_NAME', sort: true, visible: true },
            { field: 'entityTypeName', header: 'ENTITYTAG_CATEGORY.LIST.TABLE_HEADER_ENTITYTYPE', sort: true, visible: true },
            { field: 'entityRecordTypeName', header: 'ENTITYTAG_CATEGORY.LIST.TABLE_HEADER_ENTITYRECORDTYPE', sort: true, visible: true },
            // { field: 'isPrivate', header: 'Is Private?', sort: true },
            { field: 'isSingular', header: 'ENTITYTAG_CATEGORY.LIST.TABLE_HEADER_SINGULAR', sort: true, visible: true },
            { field: 'id', header: '', sort: false, class: "action"+ (this.isShowActionColumn ? "hide" : ""), visible: this.isShowActionColumn }
        ];
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
            this.getEntityTagsCategories();
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
            this.getEntityTagsCategories();
        });
    }

    ngOnDestroy(): void {
        //this.updateSubscription.unsubscribe();
    }

    private setLastSearchFilterFromStorage(): void {
        const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_EntityTagCategoriesKey, this.localStoragePrefix));
        if (searchFilter != null) {
          this.filterParam = searchFilter;
            this.selectedEntities = this.filterParam.filters.EntityTypeId;
            this.selectedEntityRecordType = this.filterParam.filters.EntityRecordTypeId;
        }
        else{
            this.selectedEntities = null;
            this.selectedEntityRecordType = null;
        }
        this.filterParam = JSON.parse(JSON.stringify(this.filterParam));
      }

    getEntities() {
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
        this.filteredentityRecordTypes = this.entityRecordTypes;
        this.filteredentityRecordTypesForFilter = this.entityRecordTypes;
    }

    onChangeEntity(selectedEntityTypeID): void {
        this.filteredentityRecordTypes = this.entityRecordTypes;
        if(selectedEntityTypeID != null){
            this.filteredentityRecordTypes = this.filteredentityRecordTypes.filter(x=>x.entityTypeID == selectedEntityTypeID);
        }
    }

    getEntityTagsCategories() {
        this._commonHelper.showLoader();
        this._entityTagsService.getEntityTagsCategories(this.filterParam).then(
            (response: any) => {
                if (response) {
                    let result: any = response;
                    if (response.isDataUpdated) {
                        this.filterParam.hashData = result.hashData;
                        this.entityTagsCategories = result.data || [];
                        this.totalRecords = result.data.length > 0 ? result.data[0].totalRecords : 0;
                        this.pTable.rows = this.filterParam.pageSize;
                        this.totalPages = Math.ceil(this.totalRecords / this.filterParam.pageSize);
                        this.end = this.filterParam.pageNo == this.totalPages ? this.totalRecords : this.filterParam.pageNo * this.filterParam.pageSize;
                        this.start = this.end == this.totalRecords ? (this.totalRecords - this.entityTagsCategories.length + 1) : (this.end - this.filterParam.pageSize) + 1;
                    }
                }
                this._commonHelper.hideLoader();
            },
            (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessageFromList(error);
            });
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_EntityTagCategoriesKey, JSON.stringify(this.filterParam), this.localStoragePrefix);
    }

    // convenience getter for easy access to form fields
    get f() { return this.tagsCategoryForm.controls; }
    createTagsCategoryForm(isDisableControl: boolean): UntypedFormGroup {
        this.tagsCategory = new EntitytagCategories({ isPrivate: false, isSingular: false });
        this.tagsCategory.id = 0;

        this.tagsCategoryForm = null;
        return this._formBuilder.group({
            id: [this.tagsCategory.id],
            entityDropDown: [{ value: this.tagsCategory.entityTypeId, disabled: isDisableControl},Validators.compose([Validators.required])],
            entityRecordTypeDropDown: [{ value: this.tagsCategory.entityRecordTypeId, disabled: isDisableControl}],
            name: [this.tagsCategory.name, Validators.compose([Validators.required, Validators.maxLength(100)])],
            isPrivate: [this.tagsCategory.isPrivate],
            isSingular: [this.tagsCategory.isSingular],
        });
    }

    changeEntityType(event) {
        this.filteredentityRecordTypesForFilter = this.entityRecordTypes;
        if(event.value != null){
            this.filteredentityRecordTypesForFilter = this.filteredentityRecordTypesForFilter.filter(x=>x.entityTypeID == event.value);
        }

        this.filterParam.filters.EntityTypeId = event.value;
        if(this.filteredentityRecordTypesForFilter.filter(x=> x.value == this.selectedEntityRecordType).length > 0){
            this.filterParam.filters.EntityRecordTypeId = this.selectedEntityRecordType;
        }
        else
        {
            this.filterParam.filters.EntityRecordTypeId = null;
            this.selectedEntityRecordType = null;
        }

        this.filterParam.pageNo = 1;

        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_EntityTagCategoriesKey, JSON.stringify(this.filterParam), this.localStoragePrefix);
        this.getEntityTagsCategories();
    }

    changeEntityRecordTypeType(event) {
        this.filterParam.filters.EntityTypeId = this.selectedEntities;
        this.filterParam.filters.EntityRecordTypeId = event.value;
        this.filterParam.pageNo = 1;

        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_EntityTagCategoriesKey, JSON.stringify(this.filterParam), this.localStoragePrefix);
        this.getEntityTagsCategories();
    }

    showHideAddEditTagsCategoryDiv(formMode, Id) {
        this.submitted = false;
        this.isEntitySelected = false;

        if (formMode === 'EDIT') {
            this.isEdit = true;
            this.tagsCategoryForm = this.createTagsCategoryForm(true);
            this._commonHelper.showLoader();
            this._entityTagsService.getTagsCategoryById(Id).then(
                response => {
                    this.tagsCategory = response as EntitytagCategories;
                    if (this.tagsCategory.isPrivate) {
                        this.IsPrivate = 'Yes';
                    }
                    else {
                        this.IsPrivate = 'No';
                    }
                    
                    this.tagsCategoryForm.patchValue({
                        id: this.tagsCategory.id,
                        entityDropDown: this.tagsCategory.entityTypeId,
                        entityRecordTypeDropDown: this.tagsCategory.entityRecordTypeId,
                        name: this.tagsCategory.name,
                        isPrivate: this.tagsCategory.isPrivate,
                        isSingular: this.tagsCategory.isSingular
                    });

                    setTimeout(() => { this.tagsCategoryForm.get('isPrivate').disable(); });
                    setTimeout(() => { this.tagsCategoryForm.get('isSingular').disable(); });

                    if (this.addEditTagsCategoryDiv === false) {
                        this.addEditTagsCategoryDiv = !this.addEditTagsCategoryDiv;
                    }
                    //below block is only to focus on name field while it is in Edit mode    
                    setTimeout(() => { this.entityTagCategoryNameRef.nativeElement.focus(); });
                    this._commonHelper.hideLoader();
                },
                (error) => {
                    this._commonHelper.hideLoader();
                    this.getTranslateErrorMessage(error);
                });
        }
        else {
            this.tagsCategoryForm = this.createTagsCategoryForm(false);
            this.isEdit = false;
            this.tagsCategory.isPrivate = false;
            this.tagsCategory.isSingular = false;
            if (this.tagsCategory.isPrivate) {
                this.IsPrivate = 'Yes';
            }
            else {
                this.IsPrivate = 'No';
            }

            setTimeout(() => { this.tagsCategoryForm.get('isPrivate').enable(); });
            setTimeout(() => { this.tagsCategoryForm.get('isSingular').enable(); });

            if (formMode === 'ADD') {
                if (this.addEditTagsCategoryDiv === false) {
                    this.addEditTagsCategoryDiv = !this.addEditTagsCategoryDiv;
                }
                //below block is only to focus on name field while it is in ADD mode    
                setTimeout(() => { this.entityDropdownRef.applyFocus(); });
            }
            else {
                this.addEditTagsCategoryDiv = !this.addEditTagsCategoryDiv
            }
        }
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

    saveTagsCategoryForm(frmMode, submitedData) {
        this.isEntitySelected = true;
        if (this.tagsCategoryForm.invalid) {
            this.validateAllFormFields(this.tagsCategoryForm);
            return;
        }

        let params = {
            "id": submitedData['id'],
            "entityTypeID": submitedData['entityDropDown'],
            "entityRecordTypeID": submitedData['entityRecordTypeDropDown'],
            "isPrivate": submitedData['isPrivate'],
            "isSingular": submitedData['isSingular'],
            "name": submitedData['name']
        }

        this.submitted = true;
        if (frmMode === 'ADD') {
            this._commonHelper.showLoader();
            this._entityTagsService.saveTagsCategory(params).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                    this._commonHelper.getInstanceTranlationData('ENTITYTAG_CATEGORY.ADD.MESSAGE_ENTITYTAGCATEGORY_ADDED')
                );
                this.addEditTagsCategoryDiv = !this.addEditTagsCategoryDiv;
                this.getEntityTagsCategories();
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
            this._entityTagsService.saveTagsCategory(params).then(response => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                    this._commonHelper.getInstanceTranlationData('ENTITYTAG_CATEGORY.ADD.MESSAGE_ENTITYTAGCATEGORY_UPDATED')
                );
                this.addEditTagsCategoryDiv = !this.addEditTagsCategoryDiv;
                this.getEntityTagsCategories();
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
    }

    deleteEntityTagCategory(Id) {
        this.optionsForPopupDialog.size = "md";
        this._confirmationDialogService.confirm('ENTITYTAG_CATEGORY.LIST.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog)
            .then((confirmed) => {
                if (confirmed) {
                    this._commonHelper.showLoader();
                    this._entityTagsService.deleteEntityTagCategoryById(Id).then(reponse => {
                        this._commonHelper.hideLoader();
                        this._commonHelper.showToastrSuccess(
                            this._commonHelper.getInstanceTranlationData('ENTITYTAG_CATEGORY.LIST.MESSAGE_ENTITYTAGCATEGORY_DELETED')
                        );
                        this.getEntityTagsCategories();
                    },
                        (error: any) => {
                            this._commonHelper.hideLoader();
                            if (error && error.messageCode.toUpperCase() == "ENTITYTAGCATEGORY.CANNOTBEDELETED") {
                                this._commonHelper.showToastrWarning(
                                    this._commonHelper.getInstanceTranlationData("ENTITYTAG_CATEGORY.LIST." + error.messageCode.replace('.', '_').toUpperCase())
                                );
                            }
                            else {
                                this.getTranslateErrorMessageFromList(error);
                            }
                        });
                }
            });
    }

    onCheckIsPrivate(element: any) {
        if (element.target.checked) {
            this.IsPrivate = 'Yes';
        }
        else {
            this.IsPrivate = 'No';
        }
    }

    onResetAllFilters() {
        this.filterParam.searchString = '';
        this.filterParam.filters.EntityTypeId = null;
        this.filterParam.filters.EntityRecordTypeId = null;
        this.selectedEntities = null;
        this.selectedEntityRecordType = null;
        this.filterParam.pageNo = 1;

        this.filteredentityRecordTypesForFilter = this.entityRecordTypes;

        this.getEntityTagsCategories();
    }

    getTranslateErrorMessageFromList(error) {
        if (error && error.messageCode) {
            this._commonHelper.showToastrError(
                this._commonHelper.getInstanceTranlationData('ENTITYTAG_CATEGORY.LIST.' + error.messageCode.replace('.', '_').toUpperCase())
            );
        }
    }

    getTranslateErrorMessage(error) {
        if (error && error.messageCode) {
            this._commonHelper.showToastrError(
                this._commonHelper.getInstanceTranlationData('ENTITYTAG_CATEGORY.ADD.' + error.messageCode.replace('.', '_').toUpperCase())
            );
        }
    }

    paginate(event) {
        this.filterParam.pageNo = (event.first / event.rows) + 1;
        this.filterParam.pageSize = event.rows;
        this.getEntityTagsCategories();
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
            this.getEntityTagsCategories();
        }
    }

    changePage() {
        if (this.filterParam.pageNo <= this.totalPages && this.filterParam.pageNo > 0) {
            this.filterParam.pageNo = this.filterParam.pageNo > 0 ? this.filterParam.pageNo : 1;
            this.getEntityTagsCategories();
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
        this.getEntityTagsCategories();
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }

    // go to previous page
    prev() {
        this.filterParam.pageNo = this.filterParam.pageNo - 1 > 0 ? this.filterParam.pageNo - 1 : 1;
        if (this.end == this.filterParam.pageSize) {
            return false;
        }
        this.getEntityTagsCategories();
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }

    // go to next page
    next() {
        this.filterParam.pageNo = (this.filterParam.pageNo + 1) <= this.totalPages ? this.filterParam.pageNo + 1 : this.totalPages;
        if (this.end == this.totalRecords) {
            return false;
        }
        this.getEntityTagsCategories();
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }
}
