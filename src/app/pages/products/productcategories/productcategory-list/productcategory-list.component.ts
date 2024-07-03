import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { DownloadFileMimeType, Entity, ExportType, FileExtension, LocalStorageKey, PublicTenantSettings } from '../../../../@core/enum';
import { ProductCategoryPagingParams } from '../../../../@core/sharedModels/paging-params.model';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { ProductcategoryAddComponent } from '../productcategory-add/productcategory-add.component';
import { ProductsService } from '../../products.service';
import * as moment from 'moment';
import { SettingsService } from '../../../settings/settings.service';

@Component({
  selector: 'ngx-productcategory-list',
  templateUrl: './productcategory-list.component.html',
  styleUrls: ['./productcategory-list.component.scss']
})
export class ProductcategoryListComponent implements OnInit {

  // search and table element
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  // contacts list
  productCategories: any[] = [];
  entityTypeId: number = Entity.ProductCategories;

  //right side activity menu
  isShowActivityCenter: boolean = false;
  selectedRowId:number = 0;
  entityWorkflowId: number = 0;
  entityDetails: any;
  selectedProductCategoryForActivityCenter: any;
  selectedProductCategoryIdForActivityCenter: number = 0;
  selectedProductCategoryIsActive: boolean = true;
  isAdvanceFilterVisible: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  entityRecordTypeId: number;
  refreshActivityCenter: boolean = false;

  // pagination
  pagingParams: ProductCategoryPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;

  // search filter
  lastProductCategorySearchFilter: any;
  ProductCategorySearchFilter = {
    searchText: '',
    // status:null,
    IsActive: false,
    rating: null,
    showStarred: false
  }

  IsActive: boolean = false
  ratingOptions: any[] = [];
  showStarred:boolean = false;

  // statusOptions:any = [{value:null,label:"All"},{value:true,label:"Active"},{value:false,label:"Inactive"}]

  // permission variable
  isViewProductCategory: boolean = false;
  isAddProductCategory: boolean = false;
  isEditProductCategory: boolean = false;
  isDeleteProductCategory: boolean = false;
  isExportProductCategorys: boolean = false;

  // table Column
  cols: any[];

  private modalRef: NgbModalRef | null;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };


  loggedInUserDetails: any;
  localStorageKeyPrefix: string = "";
  
  rowActionButtonMouseHoverFlag: boolean = false;
  productCategoryCreatedBy: number;

  keyfieldResponseData: any;
  currencySymbol: any = null;
  hoursInDay: number = null;
  quickViewConfig: any;

  //export Account
  dynamicColumnNameSetting: any = {};

  constructor(
    private _router: Router,
    public _commonHelper: CommonHelper,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _productsService: ProductsService,
    private _settingsService: SettingsService
    ) {

    this.setPermissions();
    this.setColumnDefinations();
    this.initializePagination();
    this.setRatingOptions();
  }

  
  ngOnInit(): void {
    //get loggedIn user details
    this.loggedInUserDetails = this._commonHelper.getLoggedUserDetail();
    this.localStorageKeyPrefix = `${this.loggedInUserDetails.tenantId}_${this.loggedInUserDetails.userId}`;

    this.setLastSearchFilterFromStorage();
    this.getCurrencySymbol();
    this.getHoursInDay();
    this.getProductCategories(this.pagingParams);
    this.subscribeSearchboxEvent();

     //set Action column show/hide dynamically
     if(!this.isEditProductCategory && !this.isDeleteProductCategory)
      {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = false;
      }

    // get set quickview local storage config start
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedProductCategoryIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
    }
    // get set quickview local storage config end

  }

  setRatingOptions(){
    this._commonHelper.setRatingOptions().then((response) => { this.ratingOptions = response as []; });
  }

  // open add popup
  addProductCategory() {
    this.modalRef = this._modalService.open(ProductcategoryAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.ADD_DIALOG.TITLE'));
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.fetchProductCategories();
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.ADD_DIALOG.SUCCESS_MESSAGE'));
      }
    });
  }

  onFilterRating(event) {
    this.ProductCategorySearchFilter.rating = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ProductCategoryListKey, JSON.stringify(this.ProductCategorySearchFilter), this.localStorageKeyPrefix);
    this.getProductCategories(this.pagingParams);
  }

  onFilterShowStarred() {
    this.ProductCategorySearchFilter.showStarred = this.showStarred;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ProductCategoryListKey, JSON.stringify(this.ProductCategorySearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getProductCategories(this.pagingParams);
  }

  onEditProductCategory(productCategoryId) {
    // check logged in user have permission to view contact details
    if (!this.isViewProductCategory) {
      return;
    }
    
    // if not undefined then redirect
    if (productCategoryId != undefined) {
      this._router.navigateByUrl('/productcategories/details/'+ productCategoryId);
    }
  }

  onDeleteProductCategory(productCategoryId) {
    this._confirmationDialogService.confirm('PRODUCTCATEGORIES.LIST.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._productsService.deleteProductCategory(productCategoryId).then(() => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.LIST.MESSAGE_PRODUCTCATEGORY_DELETED')
          );
          this.totalRecords = this.totalRecords - 1;
          this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.pagingParams.pageSize) : 1;
          this.fetchProductCategories();
        },
          (error: any) => {
            this._commonHelper.hideLoader();
            this.fetchProductCategories();
            this.getTranslateErrorMessage(error);
          }
        );
      }
    });
  }

  onChangeStatus(id, status) {
    if (!this.isEditProductCategory) {
      return;
    }

    let messageText = status ? 'PRODUCTCATEGORIES.MESSAGE_CONFIRM_ACTIVE' : 'PRODUCTCATEGORIES.MESSAGE_CONFIRM_INACTIVE';
    let successText = status ? 'PRODUCTCATEGORIES.MESSAGE_CONTACT_ACTIVATED' : 'PRODUCTCATEGORIES.MESSAGE_CONTACT_INACTIVATED';

    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._productsService.changeStatus(id, status).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
          }
          this.fetchProductCategories();
          this._commonHelper.hideLoader();
        }, (error) => {
          this.fetchProductCategories();
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
      else{
        this.fetchProductCategories();
      }
    });
  }

  // onFilterStatus(event){
  //   this.ProductCategorySearchFilter.status = event.value;
  //   this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ProductCategoryListKey, JSON.stringify(this.ProductCategorySearchFilter), this.localStorageKeyPrefix);
  //   this.fetchProductCategories();
  // }

  public onFilterShowActiveRecords() {
    this.ProductCategorySearchFilter.IsActive = this.IsActive;
    this.pagingParams.pageNo = 1;
    this.getProductCategories(this.pagingParams);
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchProductCategories();
  }

  changeOrder(column: any): void {
    if (column.sort) {
      if (this.pTable.sortOrder == 1) {
        this.pagingParams.sortOrder = "ASC";
      }
      else {
        this.pagingParams.sortOrder = "DESC";
      }
      this.pagingParams.sortColumn = this.pTable.sortField;
      this.fetchProductCategories();
    }
  }

  onResetAllFilters() {
    this.ProductCategorySearchFilter.searchText = '';
    // this.ProductCategorySearchFilter.status = null;
    this.ProductCategorySearchFilter.IsActive = false;
    this.ProductCategorySearchFilter.rating = null;
    this.ProductCategorySearchFilter.showStarred = false;

    this.IsActive = false;
    this.showStarred = false;

    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    // this.pagingParams.status = null;
    this.pagingParams.IsActive = false;
    this.pagingParams.rating = null;
    this.pagingParams.showStarred = false;
    this.getProductCategories(this.pagingParams);
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchProductCategories();
    }
    else if (this.pagingParams.pageNo > this.totalPages){
      this.pagingParams.pageNo = this.totalPages;
    }
    else if (this.pagingParams.pageNo <= 0){
      this.pagingParams.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  resetPaginator(): any {
    this.pagingParams.pageNo = 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchProductCategories();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchProductCategories();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchProductCategories();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  //#region private methods
  private fetchProductCategories(): void {
    if (this.pTable) {
      this.getProductCategories(this.pagingParams);
    }
  }

  private setPermissions(): void {
    this.isViewProductCategory = this._commonHelper.havePermission(enumPermissions.ViewProductCategory);
    this.isAddProductCategory = this._commonHelper.havePermission(enumPermissions.AddProductCategory);
    this.isEditProductCategory = this._commonHelper.havePermission(enumPermissions.EditProductCategory);
    this.isDeleteProductCategory = this._commonHelper.havePermission(enumPermissions.DeleteProductCategory);
    this.isExportProductCategorys = this._commonHelper.havePermission(enumPermissions.ExportProductCategorys)
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadProductCategoryDocument);
  }

  private setColumnDefinations(): void {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'name', header: 'PRODUCTCATEGORIES.LIST.TABLE_HEADER_NAME', sort: true, visible: true },
      { field: 'code', header: 'PRODUCTCATEGORIES.LIST.TABLE_HEADER_CODE', sort: true, visible: true },
      { field: 'parentName', header: 'PRODUCTCATEGORIES.LIST.TABLE_HEADER_PARENT', sort: true, visible: true },
      // { field: 'status', header: 'PRODUCTCATEGORIES.LIST.TABLE_HEADER_STATUS', sort: true },
      { field: 'id', header: '', sort: false, class: "icon--dropdown action", visible: true }
    ];

    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.cols.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private initializePagination(): void {
    this.pagingParams = new ProductCategoryPagingParams();
    this.pagingParams.tenantId = 0;
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
    // this.pagingParams.status = null;
    this.pagingParams.IsActive = this.IsActive;
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_ProductCategoryListKey, this.localStorageKeyPrefix));
    if (searchFilter != null) {
      this.ProductCategorySearchFilter = searchFilter;
      this.IsActive = this.ProductCategorySearchFilter.IsActive;
      this.showStarred = this.ProductCategorySearchFilter.showStarred;      
    }
    
    this.pagingParams.rating  = this.ProductCategorySearchFilter.rating;
    this.lastProductCategorySearchFilter = JSON.parse(JSON.stringify(this.ProductCategorySearchFilter));
  }

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.ProductCategorySearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this.fetchProductCategories();
      });
  }

  private getProductCategories(pagingParams: ProductCategoryPagingParams): void {
    this._commonHelper.showLoader();
    this.pagingParams.searchString = this.ProductCategorySearchFilter.searchText;
    // this.pagingParams.status = this.ProductCategorySearchFilter.status;
    this.pagingParams.showStarred = this.ProductCategorySearchFilter.showStarred;
    this.pagingParams.IsActive = !this.ProductCategorySearchFilter.IsActive;

    this._productsService.getProductCategories(pagingParams)
      .then((response: any[]) => {
        if (response) {
          this.productCategories = response;
          this.totalRecords = this.productCategories.length > 0 ? this.productCategories[0].totalRecords : 0;
          this.pTable.rows = this.pagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
          this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.productCategories.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
          
          if (this.selectedProductCategoryIdForActivityCenter != null && this.selectedProductCategoryIdForActivityCenter > 0 && this.productCategories.some(x=>x.id == this.selectedProductCategoryIdForActivityCenter)) {
            this.updateEntityDetails(true, this.productCategories.find(x=>x.id == this.selectedProductCategoryIdForActivityCenter));
          }
          else{
            this.resetSelectedEntity();
          }
        }
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ProductCategoryListKey, JSON.stringify(this.ProductCategorySearchFilter), this.localStorageKeyPrefix);
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'productcategoryproduct.productcategoryproductmodelrequired') {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.PRODUCTCATEGORYPRODUCT_PRODUCTCATEGORYPRODUCTMODELREQUIRED')));
      } else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }

  //Export Product Categories Listing

  exportExcel(){
    this.exportProductCategories(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportProductCategories(exportType: string, fileExtension: string, fileMimeType: string){
    this._commonHelper.showLoader();

    const excelExportPayload = {

      tenantId: this.pagingParams.tenantId,
      searchString: this.pagingParams.searchString,
      // status:this.pagingParams.status,
      IsActive:this.pagingParams.IsActive,
      sortColumn: this.pagingParams.sortColumn,
      sortOrder: this.pagingParams.sortOrder,
      exportType: exportType,
      rating: this.pagingParams.rating,
      pageNo: 1,
      pageSize: this._commonHelper.DefaultPageSize,
      dynamicColumnSettingJson: "",
      showStarred: this.pagingParams.showStarred
    }

    let fileName = this._commonHelper.getConfiguredEntityName('{{ProductCategories_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.ALLLISTING.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    this._productsService.exportProductCategories(excelExportPayload).then((base64String: any) => {
      this._commonHelper.hideLoader();      
      if (base64String && base64String != '') {
        this._commonHelper.downloadFile(`${fileName}${fileExtension}`, fileMimeType, base64String);
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ALLLISTING.MESSAGE_NO_DATA_EXPORT'));
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  } 

  // Setup Quick View
  onMoreDetailsClick(isShowActivityCenter:boolean) {
    this.isShowActivityCenter = isShowActivityCenter;
    if (!this.quickViewConfig) {
      this.quickViewConfig = { isQuickViewOpen: this.isShowActivityCenter }
    }
    else {
      this.quickViewConfig.isQuickViewOpen = this.isShowActivityCenter;
    }
    this.setQuickViewConfig();
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  } 

  onRowActionButtonMouseEnter() {
    this.rowActionButtonMouseHoverFlag = true;
  }

  onRowActionButtonMouseLeave() {
    this.rowActionButtonMouseHoverFlag = false;
  }

  onRowClick(rowData: any, isShowActivityCenter:boolean = null) {

    if (this.rowActionButtonMouseHoverFlag) {
      return;
    }

    const settingsJson = JSON.parse(rowData.settingsJson);
    const obj = {
      id: rowData.id,
      entityIcon: 'fas fa-inbox',
      entityName: this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.DETAIL.TITLE'),
      label1: settingsJson.Token1Text,
      label1RedirectURL: settingsJson.Token1Url,
      label2: settingsJson.Token2Text,
      label2RedirectURL: settingsJson.Token2Url,
      label3: settingsJson.Token3Text,
      label3RedirectURL: settingsJson.Token3Url,
      relatedToLabel: rowData?.entityName,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      entityRecordTypeId: rowData?.entityRecordTypeID,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      relatedToRedirectURL: null,
      createdBy: rowData?.createdBy,
      isActive: rowData?.isActive
    };

    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id;
    this.productCategoryCreatedBy = rowData?.createdBy;

    this.selectedProductCategoryForActivityCenter = rowData;
    this.selectedProductCategoryIdForActivityCenter = rowData.id;
    this.selectedProductCategoryIsActive = rowData.isActive;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedRowEntityId: this.selectedRowId
    }

    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewProductCategory);
  }

  advanceFilterVisibleChange(value: boolean) {
    this.isAdvanceFilterVisible = value;
  }

  // Set card/row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.ProductCategories_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get card/row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.ProductCategories_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
  }

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewProductCategory;
        this.selectedProductCategoryIdForActivityCenter = details.id;
        this.selectedProductCategoryForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedProductCategoryIsActive = details.isActive;
        this.entityDetails = this._commonHelper.cloningObject(details);
      }
      else {
        this.onRowClick(details, this.quickViewConfig.isQuickViewOpen);
      }
    }
    else {
      this.resetSelectedEntity();
    }
  }
  
  private resetSelectedEntity(){
    this.isShowActivityCenter = false;
    this.selectedProductCategoryForActivityCenter = null;
    this.selectedProductCategoryIdForActivityCenter = 0;
    this.selectedProductCategoryIsActive = null;
    this.selectedRowId = 0;
  }
  //#endregion

  onSaveKeyFieldEvent(event) {

    let params = {
      entityTypeId: event.entityTypeId,
      entityId: event.entityId,
      isCustomField: event.isCustomField,
      type: event.type,
      field: event.field,
      fieldValue: event.fieldValue ? event.fieldValue.toString() : null
    };

    this._productsService.updateProductCategoryField(params).then((response) => {
      this.keyfieldResponseData = {
        keyfieldNameToHideLoader: event.field,
        fieldValue: event.fieldValue,
        fieldOldValue: event.fieldValue
      }
    }, (error) => {
      this.keyfieldResponseData = {
        keyfieldNameToHideLoader: event.field,
        fieldValue: event.fieldValue,
        fieldOldValue: event.fieldOldValue
      }
      this._commonHelper.showToastrError(error.message);
    });
  }

  private getCurrencySymbol() {
    const currencySymbol = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL));
    if (currencySymbol == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CURRENCY_SYMBOL).then((response: any) => {
          this.currencySymbol = response.currencySymbol;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL, JSON.stringify(this.currencySymbol));
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
      this.currencySymbol = currencySymbol;
    }
  }

  private getHoursInDay() {
    const hrsInDay = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY));
    if (hrsInDay == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.HOURS_IN_DAY).then((response: any) => {
          this.hoursInDay = (response != null && !isNaN(Number(response))) ? Number(response) : 24;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY, JSON.stringify(this.hoursInDay));
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
      this.hoursInDay = hrsInDay;
    }
  }

  onStatusChange(productcategory) {
    if (!this.isEditProductCategory) {
      return
    }

    let messageText = productcategory.isActive ? 'PRODUCTCATEGORIES.MESSAGE_CONFIRM_INACTIVE' : 'PRODUCTCATEGORIES.MESSAGE_CONFIRM_ACTIVE';
    let successText = productcategory.isActive ? 'PRODUCTCATEGORIES.MESSAGE_CONTACT_INACTIVATED' : 'PRODUCTCATEGORIES.MESSAGE_CONTACT_ACTIVATED';

    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._productsService.changeStatus(productcategory.id, !productcategory.isActive).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
          }
          this.getProductCategories(this.pagingParams);
          this._commonHelper.hideLoader();
        }, (error) => {
          this.getProductCategories(this.pagingParams);
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
    });
  }
}
