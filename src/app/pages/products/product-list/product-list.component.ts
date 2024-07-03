//ANGULAR
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { ProductPagingParams } from '../../../@core/sharedModels/paging-params.model';
import { Actions, DataSources, DownloadFileMimeType, Entity, ExportType, FileExtension, LocalStorageKey, PublicTenantSettings, SectionCodes } from '../../../@core/enum';
//SERVICES
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { ProductsService } from '../products.service';
import { SettingsService } from '../../settings/settings.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
//COMPONENTS
import { ProductAddComponent } from '../product-add/product-add.component';
import { ProductImportDialogComponent } from '../product-import-dialog/product-import-dialog.component';
import { EntityReferencesListComponent } from '../../../@core/sharedComponents/entity-references-list/entity-references-list.component';
//PRIMENG
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { PrimeNGConfig } from 'primeng/api';
import { Dropdown } from 'primeng/dropdown';
import { MultiSelect } from 'primeng/multiselect';
//OTHER
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import * as moment from 'moment';
import { WorktaskAddComponent } from '../../worktasks/worktask-add/worktask-add.component';
import { CaseAddComponent } from '../../cases/case-add/case-add.component';

@Component({
  selector: 'ngx-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {

  // search and table element
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;
  @ViewChild('uomDrodown') uomDrodown: Dropdown;

  // products list
  products: any[] = [];
  entityTypeId: number = Entity.Products;
  EntityTitle: any;

  //right side activity menu
  entityWorkflowId: number = 0;
  isShowActivityCenter: boolean = false;
  selectedRowId: number = 0;
  entityDetails: any;
  selectedProductForActivityCenter: any;
  selectedProductIdForActivityCenter: number = 0;
  selectedProductIsPausedForActivityCenter: boolean = false;
  selectedProductIsActive: boolean = true;
  entityRecordTypeId: number;
  refreshActivityCenter: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAdvanceFilterVisible: boolean = false;

  showEntityRecordTypeLoader: boolean = false;
  showWorkflowLoader: boolean = false;
  workflows: any;
  showStarred:boolean = false;

   //Filters
   recordTypes = null;
   selectedRecordTypes: any = null;
   ratingOptions: any[] = [];

  // pagination
  pagingParams: ProductPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;

  // search filter
  lastProductSearchFilter: any;
  productSearchFilter = {
    searchText: '',
    // status: null,
    recordTypeIds: null,
    uomId: null,
    IsActive: false,
    rating: null,
    showStarred: false
  }

  IsActive: boolean = false;
  // statusOptions: any = [{ value: null, label: "All" }, { value: true, label: "Active" }, { value: false, label: "Inactive" }]

  // permission variable
  isViewProduct: boolean = false;
  isAddProduct: boolean = false;
  isEditProduct: boolean = false;
  isImportProduct: boolean = false;
  isDeleteProduct: boolean = false;
  isExportProduct: boolean = false;
  isAddWorkTask: boolean = false;
  isAddCase: boolean = false;

  // Flag
  isDisabled = true;

  // table Column
  cols: any[];
  isShowActionColumn: boolean = false;

  //datasource
  currencySymbol: any = null;
  groupedUOMTypes: any = [];

  private modalRef: NgbModalRef | null;
  private optionsForPopupDialog: any = {
    size: 'md',
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //user details
  loggedInUserDetails: any;
  localStorageKeyPrefix: string = "";
  rowActionButtonMouseHoverFlag: boolean = false;

  keyfieldResponseData: any;
  hoursInDay:number = null;

  productCreatedBy: number;
  quickViewConfig: any;

  //Add WorkTask
  worktaskRecordTypes: any;
  worktaskWorkflowList: any = null;
  refreshWorkTaskTab;
  entitySubTypes: any = [];
  workTaskSubTypeDetails: any;

  casesRecordTypes: any;
  casesWorkflowList: any;

  entityHiddenFieldSettings: any;

  //export Account
  dynamicColumnNameSetting: any = {};
  hideRecordTypeFilter = null;

  constructor(
    private _router: Router,
    public _commonHelper: CommonHelper,
    private _productService: ProductsService,
    private _settingsService: SettingsService,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _dataSourceService: DatasourceService,
    private primengConfig: PrimeNGConfig,
    private _commonService: CommonService) {
    this.EntityTitle = this._commonHelper.getEntityTitleFromMenuItemByUrl(decodeURI(this._router.url));
    this.setPermissions();
    this.setColumnDefinations();
    this.initializePagination();
    this.setRatingOptions();
  }

  ngOnInit(): void {
    //get user detail
    this.loggedInUserDetails = this._commonHelper.getLoggedUserDetail();
    //set local storage prefix
    this.localStorageKeyPrefix = `${this.loggedInUserDetails.tenantId}_${this.loggedInUserDetails.userId}`

    this.setLastSearchFilterFromStorage();

    Promise.all([
      this.getCurrencySymbol(),
      this.getHoursInDay(),
      this.getEntityRecordTypes(),
      this.getWorkflowList(),
      this.getUOMTypes(),
      this.getWorktaskWorkflowList(),
      this.getWorkflowListForCase(),
      this.getEntityHiddenField(),
      this.getEntitySubTypes()
    ]).then(() => { 
      this.getProducts(this.pagingParams);
      this.workTaskSubTypeDetails = this.entitySubTypes?.find(x => x.level == 1);
    });

    // get set quickview local storage config start
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedProductIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
    }
    // get set quickview local storage config end

    this.subscribeSearchboxEvent();
    this.primengConfig.ripple = true;
  }

  fetchProducts(): void {
    if (this.pTable) {
      this.getProducts(this.pagingParams);
    }
  }

  productDetail(id: number): void {
    this._router.navigate(['detail/' + id]);
  }

  setRatingOptions(){
    this._commonHelper.setRatingOptions().then((response) => { this.ratingOptions = response as []; });
  }

  // onFilterStatus(event) {
  //   this.productSearchFilter.status = event.value;
  //   this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ProductListingKey, JSON.stringify(this.productSearchFilter), this.localStorageKeyPrefix);
  //   this.getProducts(this.pagingParams);
  // }

  onFilterRating(event) {
    this.productSearchFilter.rating = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ProductListingKey, JSON.stringify(this.productSearchFilter), this.localStorageKeyPrefix);
    this.getProducts(this.pagingParams);
  }

  onFilterShowStarred() {
    this.productSearchFilter.showStarred = this.showStarred;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ProductListingKey, JSON.stringify(this.productSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getProducts(this.pagingParams);
  }

  trimFilterValue(e: any, multiSelect: MultiSelect) {
    multiSelect.filterValue = String(e.filter).trim();
    multiSelect.filterInputChild.nativeElement.value = String(e.filter).trimStart();
  }

  onFilterRecordType(event) {
    this.productSearchFilter.recordTypeIds = event.value.toString();
    this.pagingParams.pageNo = 1;
    this.getProducts(this.pagingParams);
  }

  public onFilterShowActiveRecords() {
    this.productSearchFilter.IsActive = this.IsActive;
    this.pagingParams.pageNo = 1;
    this.getProducts(this.pagingParams);
  }

  onFilterUOM(event) {
    this.productSearchFilter.uomId = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ProductListingKey, JSON.stringify(this.productSearchFilter), this.localStorageKeyPrefix);
    this.getProducts(this.pagingParams);
  }

  onResetAllFilters() {
    this.productSearchFilter.searchText = '';
    // this.productSearchFilter.status = null;
    this.productSearchFilter.recordTypeIds = null;
    this.productSearchFilter.IsActive = false;
    this.productSearchFilter.uomId = null;
    this.productSearchFilter.rating = null;
    this.productSearchFilter.showStarred = false;

    this.selectedRecordTypes = null;
    this.IsActive = false;
    this.showStarred = false;
    
    this.pagingParams.searchString = '';
    this.pagingParams.entityRecordTypeIds = null;
    this.pagingParams.uomId = null;
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.uomDrodown.clear(null);
    this.pagingParams.IsActive = false;
    this.pagingParams.rating = null;
    this.pagingParams.showStarred = false;
    this.getProducts(this.pagingParams);
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchProducts();
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
      this.fetchProducts();
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchProducts();
    }
    else if (this.pagingParams.pageNo > this.totalPages) {
      this.pagingParams.pageNo = this.totalPages;
    }
    else if (this.pagingParams.pageNo <= 0) {
      this.pagingParams.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  resetPaginator(): any {
    this.pagingParams.pageNo = 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchProducts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchProducts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchProducts();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  //#region private methods
  private setPermissions(): void {
    this.isViewProduct = this._commonHelper.havePermission(enumPermissions.ViewProduct);
    this.isAddProduct = this._commonHelper.havePermission(enumPermissions.AddProduct);
    this.isEditProduct = this._commonHelper.havePermission(enumPermissions.EditProduct);
    this.isDeleteProduct = this._commonHelper.havePermission(enumPermissions.DeleteProduct);
    this.isImportProduct = this._commonHelper.havePermission(enumPermissions.ImportProduct);
    this.isExportProduct = this._commonHelper.havePermission(enumPermissions.ExportProduct);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadProductDocument);
    this.isAddWorkTask = this._commonHelper.havePermission(enumPermissions.AddWorkTask);
    this.isAddCase = this._commonHelper.havePermission(enumPermissions.AddCase);
    this.isShowActionColumn = this.isDeleteProduct || this.isEditProduct;
  }

  private setColumnDefinations(): void {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'name', header: 'PRODUCTS.LIST.TABLE_HEADER_NAME', sort: true, visible: true },
      { field: 'code', header: 'PRODUCTS.LIST.TABLE_HEADER_CODE', sort: true, visible: true},
      { field: 'stockQty', header: 'PRODUCTS.LIST.TABLE_HEADER_STOCK_QUANTITY', sort: true, visible: true },
      { field: 'uomName', header: 'PRODUCTS.LIST.TABLE_HEADER_UOM', sort: true, visible: true },
      { field: 'price', header: 'PRODUCTS.LIST.TABLE_HEADER_PRICE', sort: true, class: "justify-content-end pr-5", visible: true },
      { field: 'description', header: 'PRODUCTS.LIST.TABLE_HEADER_DESCRIPTION', sort: false, visible: true },
      // { field: 'status', header: 'PRODUCTS.LIST.TABLE_HEADER_STATUS', sort: true },
    ];

    if (!this.isDisabled) { this.cols.push({ field: 'type', header: 'PRODUCTS.LIST.TYPE', sort: true }); }

    this.cols.push({ field: 'id', header: '', sort: false, class: "icon--dropdown action", visible: true })

    //set Action column show/hide dynamically
    if(!this.isEditProduct && !this.isDeleteProduct)
      {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = false;
      }

    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.cols.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private initializePagination(): void {
    this.pagingParams = new ProductPagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.entityRecordTypeIds = null;
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
    this.pagingParams.IsActive = this.IsActive;
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_ProductListingKey, this.localStorageKeyPrefix));
    if (searchFilter != null) {
      this.productSearchFilter = searchFilter;
      this.IsActive = this.productSearchFilter.IsActive;
      this.showStarred = this.productSearchFilter.showStarred;
    }

    if (this.productSearchFilter.recordTypeIds != null && this.productSearchFilter.recordTypeIds != '') {
      this.selectedRecordTypes = this.productSearchFilter.recordTypeIds.split(',').map(x => Number(x)) as [];
    }
    else {
      this.selectedRecordTypes = null;
    }
    this.pagingParams.rating = this.productSearchFilter.rating;
    this.lastProductSearchFilter = JSON.parse(JSON.stringify(this.productSearchFilter));
  }


  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.productSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this.fetchProducts();
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

  // open add popup
  addProduct() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(ProductAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.ADD_DIALOG.TITLE'));
    this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.entityRecordTypeId = null;
    this.modalRef.componentInstance.entityWorkflowId = this.entityWorkflowId;
    this.modalRef.componentInstance.workflows = this.workflows.filter(x => x.value != 0);
    this.modalRef.componentInstance.recordTypes = this.recordTypes?.filter(s => s.value != 0);
    this.modalRef.componentInstance.isShowWorkflow = true;
    this.modalRef.componentInstance.isShowAssignTo = true;
    this.modalRef.componentInstance.isShowProductCategory = true;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.fetchProducts();
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTS.ADD_DIALOG.SUCCESS_MESSAGE'));
      }
    });
  }

  private getProducts(pagingParams: ProductPagingParams): void {
    this._commonHelper.showLoader();
    this.pagingParams.searchString = this.productSearchFilter.searchText;
    this.pagingParams.entityRecordTypeIds = this.productSearchFilter.recordTypeIds;
    // this.pagingParams.status = this.productSearchFilter.status;
    this.pagingParams.showStarred = this.productSearchFilter.showStarred;
    this.pagingParams.IsActive = !this.productSearchFilter.IsActive;

    this.pagingParams.uomId = this.productSearchFilter.uomId;
    this._productService.getProducts(pagingParams)
      .then((response: any[]) => {
        if (response) {
          this.products = response;
          this.totalRecords = this.products.length > 0 ? this.products[0].totalRecords : 0;
          this.pTable.rows = this.pagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
          this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.products.length + 1) : (this.end - this.pagingParams.pageSize) + 1;

          if (this.selectedProductIdForActivityCenter != null && this.selectedProductIdForActivityCenter > 0 && this.products.some(x => x.id == this.selectedProductIdForActivityCenter)) {
            this.updateEntityDetails(true, this.products.find(x => x.id == this.selectedProductIdForActivityCenter));
          }
          else {
            this.resetSelectedEntity();
          }
        }
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_ProductListingKey, JSON.stringify(this.productSearchFilter), this.localStorageKeyPrefix);
  }

  onDeleteProductClick(productID) {
    let params = {
      "entityId": productID,
      "entityTypeId": Entity.Products
    }
    let message: string = "";
    this._commonHelper.showLoader();
    this._commonService.getEntityReferences(params).then((res: any) => {
      this._commonHelper.hideLoader();
      if (res != undefined && res.length != 0) {
        if (this._modalService.hasOpenModals()) {
          return;
        }
        this.optionsForPopupDialog.size = "lg";
        this.modalRef = this._modalService.open(EntityReferencesListComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.entityList = res;
        this.modalRef.componentInstance.entityId = productID;
        this.modalRef.componentInstance.entityTypeId = Entity.Products;
        this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData("PRODUCTS.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DELETE_LABEL");
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData("PRODUCTS.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE");
      } else {
        this.optionsForPopupDialog.size = "md";
        this._confirmationDialogService.confirm("PRODUCTS.LIST.MESSAGE_CONFIRM_DELETE", null, null, this.optionsForPopupDialog).then((confirmed) => {
          if (confirmed) {
            this.deleteProduct(productID);
          }
        });
        (error: any) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        };
      }
    });
  }

  private deleteProduct(productID) {
    this._commonHelper.showLoader();
    this._productService.deleteProduct(productID).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('PRODUCTS.LIST.MESSAGE_PRODUCT_DELETED')
      );
      this.totalRecords = this.totalRecords - 1;
      this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.pagingParams.pageSize) : 1;
      this.fetchProducts();
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

  changeProductStatusMessage(id, status, isconfirmed) {
    this.optionsForPopupDialog.size = "md";
    let messageText = status ? 'PRODUCTS.ALLLISTING.MESSAGE_CONFIRM_INACTIVE' : 'PRODUCTS.ALLLISTING.MESSAGE_CONFIRM_ACTIVE' ;
    let successText = status ? 'PRODUCTS.ALLLISTING.MESSAGE_PRODUCT_INACTIVATED' : 'PRODUCTS.ALLLISTING.MESSAGE_PRODUCT_ACTIVATED';
    if (isconfirmed) {
      this.changeProductStatus(id, status, successText);
    } else {
      this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
        if (confirmed) {
          this.changeProductStatus(id, status, successText);
        }
        else {
          this.getProducts(this.pagingParams);
        }
      });
    }
  }

  private changeProductStatus(id: any, status: any, successText: string) {
    this._commonHelper.showLoader();
    this._productService.changeProductStatus(id, !status).then((response: any[]) => {
      if (response) {
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData(successText)
        );
      }
      this.getProducts(this.pagingParams);
      this._commonHelper.hideLoader();
    }, (error) => {
      this.getProducts(this.pagingParams);
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  onStatusChange(product) {
    if (!this.isEditProduct) {
      return;
    }
    if (product.isActive) {
      const params = {
        EntityTypeId: Entity.Products,
        EntityId: product.id
      };
      this._commonHelper.showLoader();
      this._commonService.getEntityReferences(params).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response != undefined && response.length != 0) {
          if (this._modalService.hasOpenModals()) {
            return;
          }
          this.optionsForPopupDialog.size = "xl";
          this.modalRef = this._modalService.open(EntityReferencesListComponent, this.optionsForPopupDialog);
          this.modalRef.componentInstance.entityList = response;
          this.modalRef.componentInstance.entityId = product.id;
          this.modalRef.componentInstance.entityTypeId = Entity.Products;
          this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData('PRODUCTS.ALLLISTING.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DEACTIVE_LABEL');
          this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('PRODUCTS.ALLLISTING.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE');
          this.modalRef.componentInstance.action = Actions.InActive;
          this.modalRef.result.then((response: any) => {
            if (response) {
              this.changeProductStatusMessage(product.id, product.isActive,true)
            }
          });
          this.getProducts(this.pagingParams);
        }
        else {
          this.changeProductStatusMessage(product.id, product.isActive,false)
        }
      });
    }
    else {
      this.changeProductStatusMessage(product.id, product.isActive,false)
    }
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'products.productinotherentities') {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.PRODUCTS_PRODUCTINOTHERENTITIES')));
      } else if (error.messageCode.toLowerCase() == 'products.productmodelrequired') {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.PRODUCTS_PRODUCTMODELREQUIRED')));
      } else if (error.messageCode.toLowerCase() == 'products.productalreadyinotherentities') {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTS.PRODUCTS_PRODUCTALREADYINOTHERENTITIES')));
      } else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('PRODUCTS.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }
  //#endregion

  openImportModel(): void {
    this.modalRef = this._modalService.open(ProductImportDialogComponent, this.optionsForPopupDialog);
    this.modalRef.result
      .then((response: boolean) => {
        if (response) {
          this.onResetAllFilters();
        }
      });
  }

  private getUOMTypes() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      let storageKey = LocalStorageKey.UOM_TypeKey;
      let localUOMTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (!localUOMTypes) {
        // get datasource details
        this._dataSourceService.getDataSourceDataByCode(DataSources.UOM_TYPES).then(response => {
          this._commonHelper.hideLoader();
          if (response) {
            let responseList = response as [];
            let filteredGroups = Array.from(new Set(responseList.map((item: any = []) => item.group)));
            filteredGroups.forEach(groupLabel => {
              let items = responseList.filter((obj: any) => { return obj.group === groupLabel }).map((s: any) => { return { label: s.label, value: s.value, groupLabel: groupLabel } });
              this.groupedUOMTypes.push(
                {
                  label: groupLabel,
                  items: items as []
                }
              );
            });
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.groupedUOMTypes));
          }
          resolve(null);
        }, (error) => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrError(error.message);
          reject(null);
        }).catch(() => {
          resolve(null);
        });
      }
      else {
        this._commonHelper.hideLoader();
        this.groupedUOMTypes = localUOMTypes;
        resolve(null);
      }
    });
  }

  //Export Products Listing

  exportExcel() {
    this.exportProductList(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportProductList(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();

    const excelExportPayload = {

      tenantId: this.pagingParams.tenantId,
      searchString: this.pagingParams.searchString,
      entityRecordTypeIds: this.pagingParams.entityRecordTypeIds,
      // status: this.pagingParams.status,
      IsActive: this.pagingParams.IsActive,
      uomId: this.pagingParams.uomId,
      sortColumn: this.pagingParams.sortColumn,
      sortOrder: this.pagingParams.sortOrder,
      exportType: exportType,
      rating: this.pagingParams.rating,
      pageNo: 1,
      pageSize: this._commonHelper.DefaultPageSize,
      dynamicColumnSettingJson: "",
      showStarred: this.pagingParams.showStarred

    }

    let fileName = this._commonHelper.getConfiguredEntityName('{{Products_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('PRODUCTS.ALLLISTING.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    this._productService.exportProductList(excelExportPayload).then((base64String: any) => {
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
    const settingsJson = JSON.parse(rowData?.settingsJson);

    const obj = {
      id: rowData.id,
      entityIcon: 'fas fa-boxes',
      entityName: this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TITLE'),
      label1: settingsJson.Token1Text,
      label1RedirectURL: settingsJson.Token1Url,
      label2: settingsJson.Token2Text,
      label2RedirectURL: settingsJson.Token2Url,
      label3: settingsJson.Token3Text,
      label3RedirectURL: settingsJson.Token3Url,
      relatedToLabel: rowData?.entityName,
      entityRecordTypeName: rowData?.entityRecordTypeName,
      entityRecordTypeId: rowData?.entityRecordTypeID,
      entityWorkflowId: this.entityWorkflowId,
      owner1Id: rowData?.assignedTo,
      stageId: rowData?.stageID,
      isActive: rowData?.isActive,
      createdBy: rowData?.createdBy,
      isPaused: rowData?.isPaused,
      workTaskTypeName: this._commonHelper.getInstanceTranlationData('PRODUCTS.DETAIL.TAB_WORKTASKS.ADD_WORKTASK_PREFIX') + " " + this.workTaskSubTypeDetails?.name,
      workTaskTypeIconClass: this.workTaskSubTypeDetails?.iconClass
    };

    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id;
    this.productCreatedBy = rowData?.createdBy;

    this.selectedProductForActivityCenter = rowData;
    this.selectedProductIdForActivityCenter = rowData.id;
    this.selectedProductIsPausedForActivityCenter = (rowData.isPaused ?? false);
    this.selectedProductIsActive =  rowData.isActive;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedRowEntityId: this.selectedRowId
    }
    
    this.onMoreDetailsClick(isShowActivityCenter && this.isViewProduct);
  }

  advanceFilterVisibleChange(value: boolean) {
    this.isAdvanceFilterVisible = value;
  }

  // Set row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Products_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Products_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
  }

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewProduct;
        this.selectedProductIdForActivityCenter = details.id;
        this.selectedProductForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedProductIsPausedForActivityCenter = (details.isPaused ?? false);
        this.selectedProductIsActive = details.isActive;
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

  private resetSelectedEntity() {
    this.isShowActivityCenter = false;
    this.selectedProductForActivityCenter = null;
    this.selectedProductIdForActivityCenter = 0;
    this.selectedProductIsPausedForActivityCenter = null;
    this.selectedProductIsActive = null;
    this.selectedRowId = 0;
  }


  onSaveKeyFieldEvent(event) {
    let params = {
      entityTypeId: event.entityTypeId,
      entityId: event.entityId,
      isCustomField: event.isCustomField,
      type: event.type,
      field: event.field,
      fieldValue: event.fieldValue ? event.fieldValue.toString() : null
    };

    this._productService.updateProductField(params).then((response) => {
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

  private prepareParamsForWorkflows() {
    return [ { name: 'EntityTypeID', type: 'int', value: Entity.Products } ];
  }

  private getWorkflowList() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Products}`;
      this.showWorkflowLoader = true;
      this.workflows = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.workflows == null) {
        const params = this.prepareParamsForWorkflows();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.workflows = response;
            this.workflows.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.workflows));
          }
          this.showWorkflowLoader = false;
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this.showWorkflowLoader = false;
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.showWorkflowLoader = false;
        resolve(null);
      }
    });
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

  private getEntityRecordTypes() {
    let storageKey = `${LocalStorageKey.AllEntityRecordTypes}`;
    const allEntityRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
    if (allEntityRecordTypes == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getEntityRecordTypes().then((response: any) => {
          if (response) {
            this.recordTypes = response?.filter(x => x.entityTypeID == Entity.Products).map(x=> ({'label':x.name,'value':x.id }));
            this.recordTypes.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.LIST.FILTER_OPTION_TEXT_RECORDTYPE') });
            this.recordTypes.sort((a, b) => a.value - b.value);
            this.worktaskRecordTypes = response?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
            this.casesRecordTypes = response?.filter(x => x.entityTypeID == Entity.Cases && x.parentEntityTypeID == this.entityTypeId);
            this.hideRecordTypeFilter = response?.filter(x => x.entityTypeID == Entity.Products).map(x=> ({'label':x.name,'value':x.id }));
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
      this.recordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Products).map(x=> ({'label':x.name,'value':x.id }));
      this.recordTypes.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.LIST.FILTER_OPTION_TEXT_RECORDTYPE') });
      this.recordTypes.sort((a, b) => a.value - b.value);
      this.worktaskRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.WorkTasks && x.code.toUpperCase() != 'MISC_TASKS' && (x.parentEntityTypeID == this.entityTypeId));
      this.casesRecordTypes = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Cases && x.parentEntityTypeID == this.entityTypeId);
      this.hideRecordTypeFilter = allEntityRecordTypes?.filter(x => x.entityTypeID == Entity.Products).map(x=> ({'label':x.name,'value':x.id }));
    }
  }

  addWorkTask() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(WorktaskAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.entityDetails.id;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.worktaskRecordTypes.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.worktaskWorkflowList.filter(x => x.value != 0).filter(x => x.parentEntityTypeID == Entity.Products || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityWorkTaskPopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Products;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshWorkTaskTab = true;
      }
    });
  }

  addCase() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CaseAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.isShowRelatedTo = false;
    this.modalRef.componentInstance.relatedEntityId = this.entityDetails.id;
    this.modalRef.componentInstance.relatedEntityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.relatedEntityRecordTypeId = this.entityRecordTypeId;
    this.modalRef.componentInstance.entityRecordTypes = this.casesRecordTypes?.map(x => ({ 'label': x.name, 'value': x.id, 'relatedToEntityTypeId': x.parentEntityTypeID }))?.sort((a, b) => a.value - b.value);
    this.modalRef.componentInstance.workflows = this.casesWorkflowList?.filter(x => x.value != 0)?.filter(x => x.parentEntityTypeID == Entity.Products || x.parentEntityTypeID == null);
    this.modalRef.componentInstance.entityHiddenFieldSettings = this.entityHiddenFieldSettings;
    this.modalRef.componentInstance.sectionCodes = SectionCodes.EntityCasePopup;
    this.modalRef.componentInstance.entityTypeId = Entity.Products;
  }

  private prepareParamsForWorkflowList(entityTypeId: number) {
    const params = [];
    let paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: entityTypeId
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
        const params = this.prepareParamsForWorkflowList(Entity.WorkTasks);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.worktaskWorkflowList = response;
            this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
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
        this.worktaskWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_WORKTASKS.FILTER_OPTION_TEXT_WORKFLOW') });
        this.worktaskWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
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
        resolve(null);
      }
    });
  }

  private getWorkflowListForCase() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.Workflow_ListKey}_${Entity.Cases}`;

      this.casesWorkflowList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (this.casesWorkflowList == null) {
        const params = this.prepareParamsForWorkflowList(Entity.Cases);
        this._commonHelper.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.WORKFLOWBYENTITYTYPEID, params).then((response: any) => {
          if (response) {
            this.casesWorkflowList = response;
            this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.ALLLISTING.FILTER_OPTION_TEXT_WORKFLOW') });
            this.casesWorkflowList.sort((a, b) => a.value - b.value);
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.casesWorkflowList));
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
        this.casesWorkflowList.push({ value: 0, label: this._commonHelper.getInstanceTranlationData('PRODUCTS.ALLLISTING.FILTER_OPTION_TEXT_WORKFLOW') });
        this.casesWorkflowList.sort((a, b) => a.value - b.value);
        resolve(null);
      }
    });
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

}