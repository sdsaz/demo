//ANGULAR
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, UntypedFormArray, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

//COMPONENTS
import { PricebookitemsAddComponent } from '../pricebookitems-add/pricebookitems-add.component';
import { PricebookAddComponent } from '../pricebook-add/pricebook-add.component';

//COMMON
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { Actions, Entity, LocalStorageKey, PublicTenantSettings, TabLayoutType } from '../../../@core/enum';
import { PriceBookItemsPagingParams } from '../../../@core/sharedModels/paging-params.model';
import { DynamicTableParameter } from '../../../@core/sharedModels/dynamic-table.model';
import { timeFrameValidator } from '../../../@core/sharedValidators/time-frame.validator';

//SERVICES
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { SettingsService } from '../../settings/settings.service';
import { PricebookService } from '../pricebook.service';

//PIPES
import { TimeFramePipe } from '../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { TimeFrameToMinutesPipe } from '../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';

//OTHER
import * as moment from 'moment';
import { Table } from 'primeng/table';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { EntityReferencesListComponent } from '../../../@core/sharedComponents/entity-references-list/entity-references-list.component';
@Component({
  selector: 'ngx-pricebook-detail',
  templateUrl: './pricebook-detail.component.html',
  styleUrls: ['./pricebook-detail.component.scss']
})
export class PricebookDetailComponent implements OnInit, OnDestroy {

  private priceBookTxtNameRef: ElementRef;
  @ViewChild('priceBookTxtName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.priceBookTxtNameRef = content;
    }
  }

  @ViewChild('pTable') private pTable: Table;

  // subcriptions
  private searchValueChanged: Subject<string> = new Subject<string>();
  private searchBoxSubscription: Subscription;

  entityTypeId: number = Entity.PriceBooks;
  priceBookId: number;
  entityRecordTypeId: number;
  priceBookName: String = '';

  priceBook: any;
  copyOfPriceBook: any;
  copyOfPrickBookFormValues: any;
  priceBookCustomFields: any[] = [];

  formDataJSON: any[] = [];
  selectedTab: string = '';
  priceBookForm: FormGroup;

  // extra variable
  submitted: boolean = false;
  isLoaded: boolean = false;
  isInitialLoading: boolean = true;
  isReadOnly: boolean = true;
  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  refreshCustomFieldDatasource: boolean = false;
  
  activeTab = '';
  navTabs: any[] = [];
  navTabsAll: any = [];
  navTabsMore: any = [];
  nativeTabDetails: any = [];
  isAdditionalTab: boolean = false;
  nativeTabCount: number = 0;
  isNativeTab: boolean = true;
  tabLayout: string = 'Default';
  currentActiveTabIndex: number = 0;
  previousActiveTabIndex: number = 0;
  forceRedirectionTabName: string = '';

  //datasources
  currencySymbol: any = null;
  hoursInDay:number = null;

  // permissions
  hasPermission: boolean = false;
  isViewPriceBook: boolean = false;
  isAddPriceBook: boolean = false;
  isEditPriceBook: boolean = false;
  isDeletePriceBook: boolean = false;
  isViewProduct: boolean = false;
  isViewProductSku: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isconfirmed:boolean = false;
  // price book items pagination
  pricebookItemsPagingParams: PriceBookItemsPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;
  priceBookItems: any[] = [];

  //pricebook Items edit variables
  priceBookItemsEditable: boolean = false;
  editedRows: any = [];

  //tab clicked variables
  onceStageHistoryClicked: boolean = false;
  oncePricebookItemsClicked: boolean = false;
  onceRelatedOpportunitiesClicked: boolean = false;
  refreshRelatedOpportunities: boolean = false;
  onceDocumentClicked: boolean = false;

  //related Opportunities
  tblRelatedOpportunitiesParameters: Array<DynamicTableParameter> = [];

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  private modalRef: NgbModalRef | null;

  pricebookItemCols = [
    { field: 'productName', header: 'PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.TABLE_HEADER_PRODUCTNAME', sort: true },
    { field: 'productSkuName', header: 'PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.TABLE_HEADER_PRODUCTSKUNAME', sort: true },
    { field: 'productSku', header: 'PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.TABLE_HEADER_PRODUCTSKU', sort: true },
    { field: 'uomName', header: 'PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.TABLE_HEADER_PRODUCT_UOM', sort: true },
    { field: 'price', header: 'PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.TABLE_HEADER_PRICE', sort: true, class: "text-right pr-5" },
    { field: 'status', header: 'PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.TABLE_HEADER_STATUS', sort: true, class: "status" },
    { field: 'id', header: '', sort: false, class: "icon--dropdown action" }
  ];

  priceBookValidationMessages = {
    name: [
      { type: 'required', message: 'PRICEBOOKS.DETAIL.TAB_DETAILS.MESSAGE_NAMEREQUIRED' },
      { type: 'minlength', message: 'PRICEBOOKS.DETAIL.TAB_DETAILS.MESSAGE_NAME_MIN' },
      { type: 'maxlength', message: 'PRICEBOOKS.DETAIL.TAB_DETAILS.MESSAGE_NAME_MAX' }
    ],
    description: [
      { type: 'minlength', message: 'PRICEBOOKS.DETAIL.TAB_DETAILS.MESSAGE_DESCRIPTION_MIN' },
      { type: 'maxlength', message: 'PRICEBOOKS.DETAIL.TAB_DETAILS.MESSAGE_DESCRIPTION_MAX' }
    ],
    startDate: [
      { type: 'required', message: 'PRICEBOOKS.DETAIL.TAB_DETAILS.MESSAGE_STARTDATE_REQUIRED' },
      { type: 'max', message: 'PRICEBOOKS.DETAIL.TAB_DETAILS.MESSAGE_STARTDATE_MAX' }
    ],
    endDate: [
      { type: 'min', message: 'PRICEBOOKS.DETAIL.TAB_DETAILS.MESSAGE_ENDDATE_MIN' }
    ]
  }

  isShowLoaderForPriceBookItem: boolean;
  refreshCustomFieldJSONGrid: boolean = false;

  countries: any;
  refreshDocument: boolean = false;

  constructor(
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _formBuilder: FormBuilder,
    private _priceBookService: PricebookService,
    private _settingsService: SettingsService,
    private _location: Location,
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    private _commonService: CommonService) {
    this.isViewPriceBook = this._commonHelper.havePermission(enumPermissions.ViewPriceBook);
    this.isAddPriceBook = this._commonHelper.havePermission(enumPermissions.AddPriceBook);
    this.isEditPriceBook = this._commonHelper.havePermission(enumPermissions.EditPriceBook);
    this.isDeletePriceBook = this._commonHelper.havePermission(enumPermissions.DeletePriceBook);
    this.isViewProduct = this._commonHelper.havePermission(enumPermissions.ViewProduct);
    this.isViewProductSku = this._commonHelper.havePermission(enumPermissions.ViewProductSku);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadPriceBookDocument);
    this.hasPermission = this.isViewPriceBook || this.isEditPriceBook;

    //Allows to reload same component while navigation
    this._router.routeReuseStrategy.shouldReuseRoute = function () { return false; };

    this.readRouteParameter();
    this.initializePagination();

    Promise.all([
      this.getTabLayoutTenantSetting()
    ]).then(() => {
      this.setTabLayout();
    });
  }

  ngOnInit(): void {
    // get details
    if (this.isViewPriceBook) {
      this.setRelatedOpportunitiesTabParameters();
      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getCountries()
      ]).then(() => {
        this.getPriceBookCustomFields();
        this.subscribeSearchBoxEvent();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.searchBoxSubscription) {
      this.searchBoxSubscription.unsubscribe();
    }
  }

  get priceBookfrm() { return this.priceBookForm.controls; }

  backToList(): void {
    this._location.back();
  }

  showHideDetailTab(frmMode: string) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.priceBookForm.invalid) {
        this.validateAllFormFields(this.priceBookForm);
        this.navigateToTabByValidation();
        return;
      }

      this.refreshActivity = true;

      Promise.all([
        this.saveData()
      ]).then(() => {
        this.isReadOnly = !this.isReadOnly
        this.submitted = false;
      })

    }
    else if (frmMode === 'CANCEL') {
      this.priceBook = this._commonHelper.deepClone(this.copyOfPriceBook);

      if (this.priceBook.customFieldJSONData && this.priceBook.customFieldJSONData !== null && this.priceBook.customFieldJSONData !== '' && this.priceBook.customFieldJSONData !== undefined) {
        this.priceBookCustomFields.forEach((field: any) => {
          if (field.fieldType == 'Date') {
            if (this.priceBook.customFieldJSONData[field.fieldName] && this.priceBook.customFieldJSONData[field.fieldName] != null && this.priceBook.customFieldJSONData[field.fieldName] != '' && this.priceBook.customFieldJSONData[field.fieldName] != undefined) {
              this.priceBook.customFieldJSONData[field.fieldName] = moment(new Date(this.priceBook.customFieldJSONData[field.fieldName])).toDate();
            }
          } else if (field.fieldType == 'JSON Grid') {
            if (this.priceBook.customFieldJSONData[field.fieldName] && this.priceBook.customFieldJSONData[field.fieldName] != null && this.priceBook.customFieldJSONData[field.fieldName] != '' && this.priceBook.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.priceBook.customFieldJSONData[field.fieldName] === 'string') {
                this.priceBook.customFieldJSONData[field.fieldName] = JSON.parse(this.priceBook.customFieldJSONData[field.fieldName]);
              }
            } else {
              this.priceBookForm.removeControl(field.fieldName)
            }
          } else if (String(field.fieldType).toLowerCase() === 'duration') {
            if (typeof this.priceBook.customFieldJSONData[field.fieldName] === 'number' || this.priceBook.customFieldJSONData[field.fieldName] == null) {
              this.priceBook.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.priceBook.customFieldJSONData[field.fieldName], this.hoursInDay);
            }
          } 
        })
      }

      this.priceBookForm.reset(this.copyOfPrickBookFormValues);
      this.refreshJSONGridData()
      this.isReadOnly = !this.isReadOnly
      this.submitted = false;
    }
    else if (frmMode === 'EDIT' && this.isReadOnly) {
      setTimeout(() => { this.priceBookTxtNameRef.nativeElement.focus(); });
      this.isReadOnly = !this.isReadOnly;
      this.submitted = false;
    }
  }

  refreshJSONGridData() {
    this.refreshCustomFieldJSONGrid = true;
     setTimeout(() => {
      this.refreshCustomFieldJSONGrid = false;
    }, 50);
  }

  // set current active tab
  setTab(activeInfo) {
    this.isAdditionalTab = activeInfo.isAdditionalTab;
    this.activeTab = activeInfo.tab.tabLink;
    this.selectedTab = activeInfo.tab.tabLink;

    if (!this.oncePricebookItemsClicked && this.activeTab == 'navPricebookItems') {
      this.getPriceBookItems(this.pricebookItemsPagingParams);
      this.oncePricebookItemsClicked = true;
    }

    if (!this.onceRelatedOpportunitiesClicked && this.activeTab == 'navRelatedOpportunities') {
      this.onceRelatedOpportunitiesClicked = true;
    }

    if((!this.onceStageHistoryClicked && this.activeTab == 'navHistory')) {
      this.onceStageHistoryClicked = true;
    }

    if (this.activeTab == 'navDocuments' && !this.onceDocumentClicked) {
      this.onceDocumentClicked = true;
    }
  }

  setRefreshEntityTag() {
    this.refreshEntityTag = !this.refreshEntityTag;
  }

  setRefreshActivityHistory() {
    this.refreshActivityHistory = false;
    setTimeout(() => {
      this.refreshActivityHistory = true;
    }, 500);
  }

  refreshChildComponent(componentName: string) {
    switch (componentName) {
      case "RelatedOpportunities": {
        this.refreshRelatedOpportunities = false;
        break;
      }
    }
  }

  private changePriceBookStatusMessage(id, status, confirmed) {
    this.optionsForPopupDialog.size = "md";
    let messageText = status ? 'PRICEBOOKS.DETAIL.MESSAGE_CONFIRM_INACTIVE' : 'PRICEBOOKS.DETAIL.MESSAGE_CONFIRM_ACTIVE';
    let successText = status ? 'PRICEBOOKS.DETAIL.MESSAGE_PRICEBOOK_INACTIVATED' : 'PRICEBOOKS.DETAIL.MESSAGE_PRICEBOOK_ACTIVATED';
    
    if(confirmed){
      this.changePriceBookStatus(id, status, successText);
    } else {
      this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
        if (confirmed) {
          this.changePriceBookStatus(id, status, successText);
        }
      });
    }
  }

  private changePriceBookStatus(id: any, status: any, successText: string) {
    this._commonHelper.showLoader();
    this._priceBookService.changePriceBookStatus(id, !status).then((response: any[]) => {
      if (response) {
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData(successText));
      }
      this.editedRows = [];
      //Toggle Edit Mode
      this.priceBookItemsEditable = false;
      this.pricebookItemCols.find(x => x.field == 'price').sort = true;
      this.getPriceBookDetail();
      this.fetchPriceBookItems();
      this.isReadOnly = true;
      this._commonHelper.hideLoader();
    }, (error) => {
      this.editedRows = [];
      //Toggle Edit Mode
      this.priceBookItemsEditable = false;
      this.pricebookItemCols.find(x => x.field == 'price').sort = true;
      this.getPriceBookDetail();
      this.fetchPriceBookItems();
      this.isReadOnly = true;
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  onActionChangeStatus() {
    if (!this.isEditPriceBook) {
      return
    }

    if (this.priceBook.isActive) {
      const params = {
        EntityTypeId: Entity.PriceBooks,
        EntityId: this.priceBook.id
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
          this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData('PRICEBOOKS.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DEACTIVE_LABEL');
          this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('PRICEBOOKS.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE');
          this.modalRef.componentInstance.action = Actions.InActive;
          this.modalRef.result.then((response: any) => {
            if (response) {
              this.changePriceBookStatusMessage(this.priceBook.id,this.priceBook.isActive,true)
            }
          });
        }
        else { 
          this.changePriceBookStatusMessage(this.priceBook.id,this.priceBook.isActive,false)
        }
      });
    }
    else{
      this.changePriceBookStatusMessage(this.priceBook.id,this.priceBook.isActive,false)
    }
  }

  addPriceBookItems() {
    // avoid multiple popup open
    if (this._modalService.hasOpenModals()) {
      return;
    }

    this.optionsForPopupDialog.size = "xl";
    this.modalRef = this._modalService.open(PricebookitemsAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.currencySymbol = this.currencySymbol;
    this.modalRef.componentInstance.priceBookId = this.priceBookId;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.oncePricebookItemsClicked = false;
        this.fetchPriceBookItems();
        setTimeout(() => {
          this.oncePricebookItemsClicked = true;
        }, 5);
      }
    });
  }

  onPriceBookItemsEditToggle() {
    //Toggle Edit Mode
    this.priceBookItemsEditable = true;
    this.pricebookItemCols.find(x => x.field == 'price').sort = false;
  }

  onPriceBookItemsEditCancle() {
    this.editedRows = [];
    //Toggle Edit Mode
    this.priceBookItemsEditable = false;
    this.pricebookItemCols.find(x => x.field == 'price').sort = true;
    this.fetchPriceBookItems();
  }

  afterEditPrice(rowData) {
    rowData.isEdited = true;

    if (this.editedRows.filter(x => x.id == rowData.id).length > 0) {
      this.editedRows.filter(x => x.id == rowData.id)[0] = this._commonHelper.cloningObject(rowData);
    }
    else {
      this.editedRows.push(this._commonHelper.cloningObject(rowData));
    }
  }

  saveEditedItems() {
    let params: any = [];
    let editedRows = this.priceBookItems.filter(x => x.isEdited == true);

    //validate price
    if (editedRows.find(x => x.price > 99999999999999)) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.TOSTER_MESSAGE_PRICE_MAX'));
      return;
    }

    editedRows.forEach(selectedItem => {
      params.push({
        id: selectedItem.id,
        priceBookId: this.priceBookId,
        price: selectedItem.price,
        productId: selectedItem.productID,
        productSkuId: selectedItem.productSkuID,
      })
    });

    this._commonHelper.showLoader();
    this._priceBookService.savePriceBookItems(params)
      .then(() => {
        this.editedRows = [];
        //Toggle Edit Mode
        this.priceBookItemsEditable = false;
        this.pricebookItemCols.find(x => x.field == 'price').sort = true;

        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.SUCCESS_MESSAGE'));
        this.fetchPriceBookItems();
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        this.getPriceBookDetail();
        this.fetchPriceBookItems();
      });
  }

  onDeletePriceBookItemClick(priceBookItemId) {

    const params = {
      EntityTypeId: Entity.PriceBookItems,
      EntityId: priceBookItemId
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
        this.modalRef.componentInstance.entityId = priceBookItemId;
        this.modalRef.componentInstance.entityTypeId = Entity.PriceBookItems;
        this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DELETE_LABEL');
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE');
      }
      else {        
        this.optionsForPopupDialog.size="md";
        this._confirmationDialogService.confirm('PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._priceBookService.deletePriceBookItem(priceBookItemId).then(() => {
                this.editedRows = [];
                //Toggle Edit Mode
                this.priceBookItemsEditable = false;
                this.pricebookItemCols.find(x => x.field == 'price').sort = true;
                this.pricebookItemsPagingParams.pageNo = 1;

                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.TAB_PRICEBOOKITEMS.MESSAGE_PRICEBOOK_DELETED')
                );

                this.fetchPriceBookItems();
                this._commonHelper.hideLoader();
              }, (error) => {
                this._commonHelper.hideLoader();
                this.fetchPriceBookItems();
                this.getTranslateErrorMessage(error);
              });
            }
          }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
      }
    });
  }

  search(val: string): void {
    this.searchValueChanged.next(val || '');
  }

  paginate(event: any): void {
    this.pricebookItemsPagingParams.pageNo = (event.first / event.rows) + 1;
    this.pricebookItemsPagingParams.pageSize = event.rows;
    this.fetchPriceBookItems();
  }

  changeOrder(column: any): void {
    if (column.sort) {
      if (this.pTable.sortOrder == 1) {
        this.pricebookItemsPagingParams.sortOrder = "ASC";
      }
      else {
        this.pricebookItemsPagingParams.sortOrder = "DESC";
      }
      this.pricebookItemsPagingParams.sortColumn = this.pTable.sortField;
      this.fetchPriceBookItems();
    }
  }

  changePage(): void {
    if (this.pricebookItemsPagingParams.pageNo <= this.totalPages && this.pricebookItemsPagingParams.pageNo > 0) {
      this.pricebookItemsPagingParams.pageNo = this.pricebookItemsPagingParams.pageNo > 0 ? this.pricebookItemsPagingParams.pageNo : 1;
      this.fetchPriceBookItems();
    }
    else if (this.pricebookItemsPagingParams.pageNo > this.totalPages) {
      this.pricebookItemsPagingParams.pageNo = this.totalPages;
    }
    else if (this.pricebookItemsPagingParams.pageNo <= 0) {
      this.pricebookItemsPagingParams.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  resetPaginator(): any {
    this.pricebookItemsPagingParams.pageNo = 1;
    if (this.end == this.pricebookItemsPagingParams.pageSize) {
      return false;
    }
    this.fetchPriceBookItems();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pricebookItemsPagingParams.pageNo = this.pricebookItemsPagingParams.pageNo - 1 > 0 ? this.pricebookItemsPagingParams.pageNo - 1 : 1;
    if (this.end == this.pricebookItemsPagingParams.pageSize) {
      return false;
    }
    this.fetchPriceBookItems();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pricebookItemsPagingParams.pageNo = (this.pricebookItemsPagingParams.pageNo + 1) <= this.totalPages ? this.pricebookItemsPagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchPriceBookItems();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  //#region Private methids
  private readRouteParameter(): void {
    this._activeRoute.params.subscribe(param => {
      let id = param['id'];
      if (id && !isNaN(Number(id)) && Number(id) > 0) {
        this.priceBookId = Number(id);
      } else {
        this._router.navigate(['pricebooks', 'list']);
      }
    });

    this._activeRoute.queryParamMap.subscribe(params => {
      if (params != null && params.keys.length > 0) {
        params.keys.forEach(paramKey => {
          if (paramKey.toLocaleLowerCase() === 'tab') {
            this.forceRedirectionTabName = params.get(paramKey)?.trim() ?? '';
          }
        });
      }
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

  private getNativeTabDetailsByEntityTypeId() {
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_PriceBooks));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_PriceBooks, JSON.stringify(response));
          resolve(null);
        },
          (error) => {
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.nativeTabDetails = nativeTabDetails;
    }
  }

  private getPriceBookCustomFields(): void {
    this._commonHelper.showLoader();
    this._priceBookService.getPriceBookCustomFields(this.entityTypeId, this.priceBookId)
      .then((response: any) => {
        if (response) {
          this.priceBookCustomFields = response || [];
          this.prepareFormDataInJSON();
          this.getPriceBookDetail();
        }
        else {
          this.isInitialLoading = false;
        }
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.isInitialLoading = false;
        this.getTranslateErrorMessage(error);
      });
  }

  private prepareFormDataInJSON(): void {
    this.priceBookCustomFields.forEach((customField: any) => {
      if (customField.isVisible) {
        let isLabelView: boolean = false;
        let tabNameObject = this.getValueFromJSON(customField.tabDisplayName);
        if (!tabNameObject) {
          let dataObject = {
            tabName: customField.tabDisplayName,
            tabNumber: customField.tabDisplayOrder,
            isTabAlwaysVisible: customField.tabIsAlwaysVisible,
            sections: [
              {
                sectionName: customField.sectionName,
                isLabelView: isLabelView,
                controls: [
                  {
                    displayOrder: customField.displayOrder,
                    fieldName: customField.fieldName,
                    fieldType: customField.fieldType,
                    fieldClass: customField.fieldClass,
                    defaultValue: customField.defaultValue,
                    label: customField.label,
                    optionsJSON: customField.optionsJSON ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
                    settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
                    dataSourceId: customField.datasourceID,
                    dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
                  }
                ]
              }
            ]
          }
          this.addControlToFormJSON(customField.tabDisplayName, dataObject);
        } else {
          let existingSection = tabNameObject.sections.find(s => s.sectionName == customField.sectionName);
          if (existingSection) {
            existingSection.controls.push({
              displayOrder: customField.displayOrder,
              fieldName: customField.fieldName,
              fieldType: customField.fieldType,
              fieldClass: customField.fieldClass,
              defaultValue: customField.defaultValue,
              label: customField.label,
              optionsJSON: customField.optionsJSON != null ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
              settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
              dataSourceId: customField.datasourceID,
              dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
            });
          } else {
            tabNameObject.sections.push({
              sectionName: customField.sectionName,
              isLabelView: isLabelView,
              controls: [
                {
                  displayOrder: customField.displayOrder,
                  fieldName: customField.fieldName,
                  fieldType: customField.fieldType,
                  fieldClass: customField.fieldClass,
                  defaultValue: customField.defaultValue,
                  label: customField.label,
                  optionsJSON: customField.optionsJSON != null ? this._commonHelper.tryParseJson(customField.optionsJSON) : '',
                  settingsJSON: customField.settingsJSON ? this._commonHelper.tryParseJson(customField.settingsJSON) : '',
                  dataSourceId: customField.datasourceID,
                  dataSourceParams: customField.datasourceParams != null ? this._commonHelper.tryParseJson(customField.datasourceParams) : ''
                }
              ]
            });
          }
        }
      }
    });
  }

  private getValueFromJSON(name: string): any {
    return this.formDataJSON.find(item => item.tabName == name);
  }

  private addControlToFormJSON(name: string, dataObject: any): void {
    let obj = this.formDataJSON.find(item => item[name]);
    if (obj) {
      obj[name] = dataObject[name];
    } else {
      this.formDataJSON.push(dataObject);
    }
  }

  private getPriceBookDetail() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._priceBookService.getPriceBookById(this.priceBookId).then((response: any) => {
        if (response) {
          this.setPriceBookDetails(response || {});
          this.priceBookForm = this.createPriceBookDetailForm();
          this.prepareFormCustomFields();
          // prepare tab with order
          this.setDefaultNavTabs();
          this.prepareTabsWithOrder();
          this.copyOfPrickBookFormValues = this.priceBookForm.value;
          this.isLoaded = true;
          this.refreshCustomFieldJSONGrid = true;
          setTimeout(() => { this.refreshCustomFieldJSONGrid = false; }, 50);
          resolve(null);
        }
        else {
          this.isInitialLoading = false;
          resolve(null);
        }
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.isInitialLoading = false;
        this.backToList();
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  private createPriceBookDetailForm(): FormGroup {
    return this._formBuilder.group({
      id: [this.priceBookId],
      name: [this.priceBook.name, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(500)])],
      description: [this.priceBook.description, Validators.compose([Validators.minLength(2), Validators.maxLength(2000)])],
      startDate: [this.priceBook.startDate != null ? moment(new Date(this.priceBook.startDate)).toDate() : this.priceBook.startDate, Validators.compose([Validators.required])],
      endDate: [this.priceBook.endDate != null ? moment(new Date(this.priceBook.endDate)).toDate() : this.priceBook.endDate],
    });
  }

  private prepareFormCustomFields(): void {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.priceBook.customFieldJSONData[control.fieldName] != null && this.priceBook.customFieldJSONData[control.fieldName] != '') {
              this.priceBook.customFieldJSONData[control.fieldName] = moment(new Date(this.priceBook.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
              this.priceBookForm.addControl(control.fieldName, new FormControl(this.priceBook.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.priceBookForm.addControl(control.fieldName, new FormControl(this.priceBook.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.priceBook.customFieldJSONData[control.fieldName] != null && this.priceBook.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.priceBook.customFieldJSONData[control.fieldName] === 'string') {
                this.priceBook.customFieldJSONData[control.fieldName] = JSON.parse(this.priceBook.customFieldJSONData[control.fieldName]);
              }
            }else {
              this.priceBook.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.priceBook.customFieldJSONData[control.fieldName] != null && this.priceBook.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.priceBook.customFieldJSONData[control.fieldName];
              this.priceBook.customFieldJSONData[control.fieldName] = this.priceBook.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
                this.priceBookForm.addControl(control.fieldName, new FormControl(this.priceBook.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.priceBookForm.addControl(control.fieldName, new FormControl(this.priceBook.customFieldJSONData[control.fieldName]));
              }
              this.priceBook.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.priceBookForm.addControl(control.fieldName, new FormControl(this.priceBook.customFieldJSONData[control.fieldName]));
              if (control.settingsJSON) {
                let validatorFn: ValidatorFn[] = [];
                if (control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
                  validatorFn.push(Validators.required);
                }
                if (control.settingsJSON.hasOwnProperty('minLength') && control.settingsJSON['minLength']) {
                  validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
                }
                if (control.settingsJSON.hasOwnProperty('maxLength') && control.settingsJSON['maxLength']) {
                  validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
                }
                if (validatorFn.length > 0) {
                  this.priceBookForm.controls[control.fieldName].setValidators(validatorFn);
                  this.priceBookForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.priceBook.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.priceBook.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.priceBookForm.addControl(control.fieldName, new UntypedFormControl(this.priceBook.customFieldJSONData[control.fieldName]));
              this.priceBookForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.priceBookForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.priceBookForm.addControl(control.fieldName, new UntypedFormControl(this.priceBook.customFieldJSONData[control.fieldName]));
              this.priceBookForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.priceBookForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.priceBookForm.addControl(control.fieldName, new UntypedFormControl(this.priceBook.customFieldJSONData[control.fieldName], Validators.email));
            let validatorFn: ValidatorFn[] = [];
            validatorFn.push(Validators.email);
            if (control.settingsJSON['isRequired']) {
              validatorFn.push(Validators.required);
            }
            if (control.settingsJSON['minLength']) {
              validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
            }
            if (control.settingsJSON['maxLength']) {
              validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
            }
            if (validatorFn.length > 0) {
              this.priceBookForm.controls[control.fieldName].setValidators(validatorFn);
              this.priceBookForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.priceBookForm.addControl(control.fieldName, new UntypedFormControl(this.priceBook.customFieldJSONData[control.fieldName]));
            if (this.priceBook.customFieldJSONData[control.fieldName] != null && this.priceBook.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.priceBook.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.priceBookForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") } );
              }
            } else {
              this.priceBookForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.priceBookForm.addControl(control.fieldName, new FormControl(this.priceBook.customFieldJSONData[control.fieldName]));
            if (control.settingsJSON) {
              let validatorFn: ValidatorFn[] = [];
              if (control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
                validatorFn.push(Validators.required);
              }
              if (control.settingsJSON.hasOwnProperty('minLength') && control.settingsJSON['minLength']) {
                validatorFn.push(Validators.minLength(control.settingsJSON['minLength']));
              }
              if (control.settingsJSON.hasOwnProperty('maxLength') && control.settingsJSON['maxLength']) {
                validatorFn.push(Validators.maxLength(control.settingsJSON['maxLength']));
              }
              if (control.settingsJSON.hasOwnProperty('min') && (String(control.settingsJSON['min']) || "").toString()) {
                validatorFn.push(Validators.min(+control.settingsJSON['min']));
              }
              if (control.settingsJSON.hasOwnProperty('max') && (String(control.settingsJSON['max']) || "").toString()) {
                validatorFn.push(Validators.max(+control.settingsJSON['max']));
              }
              if (validatorFn.length > 0) {
                this.priceBookForm.controls[control.fieldName].setValidators(validatorFn);
                this.priceBookForm.controls[control.fieldName].updateValueAndValidity();
              }
            }
          }
        });
      });
    });
  }

  private setDefaultNavTabs(): void {
    this.navTabsAll = [
      { tabName: 'Details', tabLink: 'navDetails', isFirst: true, condition: true, displayOrder: 101 },
      { tabName: '', tabLink: 'navPricebookItems', isFirst: false, condition: true, displayOrder: 201 },
      { tabName: '', tabLink: 'navRelatedOpportunities', isFirst: false, condition: true, displayOrder: 301 },
      { tabName: '', tabLink: 'navHistory', isFirst: false, condition: true, displayOrder: 401 },
      { tabName: '', tabLink: 'navDocuments', isFirst: false, condition: true, displayOrder: 501 }
    ];

    this.setNativeTabDetails();
    
    this.navTabsAll.forEach((f) => {
      (f.isNativeTab = true), (f.isTabAlwaysVisible = false),(f.showCloseTabIconBtn = false), (f.showButtonActive = false)
    });
  }

  private setNativeTabDetails() {
    this.navTabsAll.forEach(tab => {
      const nativeTabDetail = this.nativeTabDetails != null ? this.nativeTabDetails.find(x => x != null && x.code?.toLocaleLowerCase() === tab.tabLink.toLocaleLowerCase()) : null;
      if (nativeTabDetail != null) {
        tab.tabName = nativeTabDetail.displayName;
        tab.displayOrder = nativeTabDetail.displayOrder;
        tab.condition = tab.condition && nativeTabDetail.isActive;
      }
      else {
        tab.condition = false;
      }
    });

    if (!this.navTabsAll.some(x => x.condition)) {
      this.navTabsAll.find(x => x.isFirst).condition = true;
    }
  }

  private prepareTabsWithOrder(): void {
    this.formDataJSON.forEach(tab => {
      var objNavTab = {
        tabName: tab.tabName,
        tabLink: 'nav' + tab.tabName.replace(/\s/g, ""),
        isFirst: false,
        condition: true,
        displayOrder: tab.tabNumber,
        isNativeTab:false,
        isTabAlwaysVisible: tab.isTabAlwaysVisible,
        showCloseTabIconBtn : true,
        showButtonActive: false
      }

      this.navTabsAll.push(objNavTab);
    });

    this.navTabsAll = this.navTabsAll.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
    this.setTabLayout();
  }

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'pricebooks.duplicate') {
        this._commonHelper.showToastrError(error.message);
      } else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      } else if (error.messageCode.toLowerCase() == 'pricebooks.pricebookinotherentities') {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.PRICEBOOKS_PRICEBOOKINOTHERENTITIES')));
      } else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase()));
      }
    }
  }

  private validateAllFormFields(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }else if (control instanceof UntypedFormArray) {
        control?.controls?.forEach((i: UntypedFormGroup) => {
          this.validateAllFormFields(i);
        })
      }
    });
  }

  private setPriceBookDetails(response: any): void {
    this.priceBook = response;
    this.priceBookName = this.priceBook?.name;
    this.priceBook.customFieldJSONData = this._commonHelper.tryParseJson(this.priceBook.customFieldJSONData);
    this.copyOfPriceBook = this._commonHelper.deepClone(this.priceBook);
    this.entityRecordTypeId = this.priceBook?.entityRecordTypeID;
  }

  private saveData(): any {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.priceBook.customFieldJSONData) {
        this.priceBookCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.priceBook.customFieldJSONData[field.fieldName] && this.priceBook.customFieldJSONData[field.fieldName] != null && this.priceBook.customFieldJSONData[field.fieldName] != '') {
              this.priceBook.customFieldJSONData[field.fieldName] = moment(this.priceBook.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.priceBookForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.priceBook.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.priceBook.customFieldJSONData[field.fieldName] = null;
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.priceBookForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.priceBook.customFieldJSONData[field.fieldName] = data;
            } else {
              this.priceBook.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }

      this.priceBook.startDate = this.priceBookfrm.startDate.value != null ? moment(this.priceBookfrm.startDate.value).format('YYYY-MM-DD') : this.priceBookfrm.startDate.value;
      this.priceBook.endDate = this.priceBookfrm.endDate.value != null ? moment(this.priceBookfrm.endDate.value).format('YYYY-MM-DD') : this.priceBookfrm.endDate.value;

      let params = this._commonHelper.deepClone(this.priceBook);

      this.priceBookCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.priceBookForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = new TimeFrameToMinutesPipe().transform(formArrayValues, this.hoursInDay);
        }
      });

      this._priceBookService.savePriceBook(params)
        .then(() => {
          this.getPriceBookDetail().then(() => {
            this.refreshCustomFieldDatasource = true;
            setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
            resolve(null)
          });
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.SUCCESS_MESSAGE'));
          this._commonHelper.hideLoader();
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          if (error.messageCode.toLowerCase() !== 'staticmessage') {
            this.getPriceBookDetail().then(() => {
              this.refreshCustomFieldDatasource = true;
              setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
            });
            resolve(null)
          } else {
            reject(null)
          }
          reject(null)
        });
    })
  }

  private findInvalidControls() {
    const invalid = [];
    const controls = this.priceBookForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }

  navigateToTabByValidation() {
    let findInCustomTab: boolean = false;
    let customTabLink: string = '';
    let original_customTabLink: string = '';
    let inValidControls: any[] = this.findInvalidControls();
    if (inValidControls.length > 0) {
      this.formDataJSON.forEach(tab => {
        tab.sections.forEach(section => {
          section.controls.forEach(control => {
            const controlExists = inValidControls.find(x => x === control.fieldName);
            if (controlExists) {
              original_customTabLink = tab.tabName;
              customTabLink = tab.tabName.replace(/\s/g, "");
              findInCustomTab = true;
              return;
            }
          })
        });
      });
      if (this.tabLayout?.toLowerCase() === TabLayoutType.ADDITIONAL_TAB.toLowerCase()) {
        //Auto Redirect to Tab which is depen
        if (findInCustomTab) {
          if (this.navTabs.find(f => f.tabName?.toLocaleLowerCase() == original_customTabLink?.toLocaleLowerCase())) {
            document.getElementById('btn_nav' + customTabLink).click();
          }
          else {
            let tab = this.navTabsAll.find(f => f.tabName?.toLocaleLowerCase() == original_customTabLink?.toLocaleLowerCase())
            if (tab) {
              this.selectedTab = tab.tabLink;
              let param: any = {};
              param.isAdditionalTab = tab.tabLink === "additionalTabs";
              param.isNativeTab = true; // always true
              param.tab = tab;
              this.checkTabCall(param, false)
            }
          }
        } else {
          document.getElementById('btn_navDetails').click();
        }
      }
      else {
        if (findInCustomTab) {
          document.getElementById('btn_nav' + customTabLink).click();
        } else {
          document.getElementById('btn_navDetails').click();
        }
      }
    }
  }

  private subscribeSearchBoxEvent(): void {
    this.searchBoxSubscription = this.searchValueChanged
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      ).subscribe((val) => {
        this.pricebookItemsPagingParams.pageNo = 1;
        this.pricebookItemsPagingParams.searchString = val;
        this.fetchPriceBookItems();
      });
  }

  private initializePagination(): void {
    this.pricebookItemsPagingParams = new PriceBookItemsPagingParams();
    this.pricebookItemsPagingParams.searchString = '';
    this.pricebookItemsPagingParams.sortColumn = 'productName';
    this.pricebookItemsPagingParams.sortOrder = 'ASC';
    this.pricebookItemsPagingParams.pageNo = 1;
    this.pricebookItemsPagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private fetchPriceBookItems(): void {
    if (this.pTable) {
      this.getPriceBookItems(this.pricebookItemsPagingParams);
    }
  }

  private getPriceBookItems(pagingParams: PriceBookItemsPagingParams): void {
    this.isShowLoaderForPriceBookItem = true;
    this.pricebookItemsPagingParams.priceBookId = this.priceBookId;
    this._priceBookService.getPriceBookItems(pagingParams).then((response: any[]) => {
      if (response) {
        this.priceBookItems = response;
        this.isShowLoaderForPriceBookItem = false;
        setTimeout(() => {
          this.totalRecords = this.priceBookItems.length > 0 ? this.priceBookItems[0].totalRecords : 0;
          this.pTable.rows = this.pricebookItemsPagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pricebookItemsPagingParams.pageSize);
          this.end = this.pricebookItemsPagingParams.pageNo == this.totalPages ? this.totalRecords : this.pricebookItemsPagingParams.pageNo * this.pricebookItemsPagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.priceBookItems.length + 1) : (this.end - this.pricebookItemsPagingParams.pageSize) + 1;
        }, 50);
        

        //preserve edited values
        this.priceBookItems.filter(x => this.editedRows.filter(y => y.id == x.id).length > 0).map(x => { x.price = this.editedRows.filter(y => y.id == x.id)[0].price, x.isEdited = this.editedRows.filter(y => y.id == x.id)[0].isEdited });
        
      }
    }, (error) => {
      this.isShowLoaderForPriceBookItem = false;
      this.getTranslateErrorMessage(error);
    });
  }

  private setRelatedOpportunitiesTabParameters(): void {
    this.tblRelatedOpportunitiesParameters = [{
      name: 'PriceBookID',
      type: 'int',
      value: this.priceBookId
    }]
  }
  //#endregion
  /**
   * START
   * Moksh Dhameliya 25 May 2023
   * Additional Tabs Code 
   */
  async setTabLayout() {
    //Only configure once time when both are 0 for edit/save resolved issue
    if (this.navTabsAll.length > 0 && (this.nativeTabCount == this.navTabs.length)) {
      let isAdditionalTabExist = false;
      if (this.tabLayout?.toLowerCase() === TabLayoutType.ADDITIONAL_TAB.toLowerCase()) {
         this.navTabs = this.navTabsAll.filter(f => f.isNativeTab || f.isTabAlwaysVisible); // nativeTab 
        this.navTabsMore = this.navTabsAll.filter(f => !f.isNativeTab && !f.isTabAlwaysVisible); // custom tab
        //checking more tab exist for additional tab
        if (this.navTabsMore.length > 0) {
          isAdditionalTabExist = true;
          let objNavTab = {
            tabName: TabLayoutType.LABEL_ADDITIONAL_TAB,
            tabLink: 'additionalTabs',
            isFirst: false,
            condition: true,
            displayOrder: this.navTabs[this.navTabs.length - 1].displayOrder + 1,
            isNativeTab: true
          }
          objNavTab.condition = true;
          this.navTabs.push(objNavTab);
          this.nativeTabCount = this.navTabs.length;
        }
        else {
          isAdditionalTabExist = false;
        }
      }else {
        this.navTabsAll.forEach((f) => {
          (f.showCloseTabIconBtn = false)
        });
      }
      if (!isAdditionalTabExist) {
        this.navTabs = this._commonHelper.deepClone(this.navTabsAll);
        this.isNativeTab = true;
        this.isAdditionalTab = false;
      }
      //Tab Order Sorting
      this.navTabs = this.navTabs?.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
      this.navTabsMore = this.navTabsMore?.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
      // set first as default
      if (this.selectedTab == '') {
        this.setDefaultTab();
      }
    }
  }

  private setDefaultTab() {
    let defaultTab = this.navTabs[0];
    let isBypassAutoTabEvent: boolean = false;
    if (this.forceRedirectionTabName != null && this.forceRedirectionTabName != '') {
      if (this.navTabs?.some(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())) {
        defaultTab = this.navTabs.filter(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())[0];

        // Redirect to Native Tab
        let param: any = {};
        param.isAdditionalTab = defaultTab.tabLink === "additionalTabs";
        param.isNativeTab = true; // always true
        param.tab = defaultTab;
        this.checkTabCall(param, 1);
      }
      else if (this.navTabsMore?.some(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())) {
        defaultTab = this.navTabsMore.filter(x => this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData(x.tabName)).toLocaleLowerCase() === this.forceRedirectionTabName.toLocaleLowerCase())[0];

        // Generate Tab and Redirect to Custom Tab
        let param: any = {};
        param.isAdditionalTab = false;
        param.isNativeTab = true; // always true
        param.tab = defaultTab;
        this.checkTabCall(param, 0);

        //No need to initiate autoTabEventEvent event as it is already initiated in CheckTabCall Function
        isBypassAutoTabEvent = true;
      }
    }
    else {
      // Redirect to first tab in the array which was already sorted by display order
      let param: any = {};
      param.isAdditionalTab = defaultTab.tabLink === "additionalTabs";
      param.isNativeTab = true; // always true
      param.tab = defaultTab;
      this.checkTabCall(param, 1);
    }

    this.selectedTab = defaultTab.tabLink;
    if (!isBypassAutoTabEvent) {
      this._commonHelper.autoTabEventEvent.next(defaultTab);
    }
  }

  //Checking Tab Return call from globle tab
  checkTabCall(paramTab, isNativeTab) {
    this.previousActiveTabIndex = this.currentActiveTabIndex;
    this.isNativeTab = paramTab.isNativeTab;
    this.isAdditionalTab = paramTab.isAdditionalTab;
    if (!isNativeTab) {
      const tabExist = this.navTabs.find(x => x.tabLink === paramTab.tab.tabLink);
      if(this.navTabs.lastIndexOf(paramTab.tab)) {
        paramTab.tab.showButtonActive = true;
      }
      if (!tabExist) {
        this.navTabs.push(paramTab.tab);
      }
      this.currentActiveTabIndex = this.navTabs.findIndex(x => x.tabLink === paramTab.tab.tabLink)
      this.selectedTab = this.navTabs[this.currentActiveTabIndex].tabLink;
      this._commonHelper.autoTabEventEvent.next(paramTab.tab);
    }
    this.currentActiveTabIndex = this.navTabs.findIndex(x => x.tabLink === paramTab.tab.tabLink);
    this.setTab(paramTab);
  }

  //close specific additionalTabs
  closeNavTab(paramTab) {
    let index: any;
    let isSameTab;

    const removeNavtab = this.navTabs.findIndex(e => e.tabLink === paramTab.tab.tabLink);
    if(this.previousActiveTabIndex > removeNavtab)
      this.previousActiveTabIndex--;
    if(removeNavtab > -1) {
      if(removeNavtab === this.navTabs.findIndex(e => e.tabLink === this.activeTab)) {
        isSameTab = true;
        index = this.previousActiveTabIndex;
        this.currentActiveTabIndex = this.previousActiveTabIndex;
      }else {
        index = this.currentActiveTabIndex;
      }
      this.navTabs.splice(removeNavtab, 1);
      paramTab.tab.showButtonActive = false
      if (this.previousActiveTabIndex > this.navTabs.length - 1) {
        this.previousActiveTabIndex = this.navTabs.length - 1;
        if(isSameTab) {
          index = this.previousActiveTabIndex;
        }
      }
    }

    const paramTab1 = this.navTabs[index];
    paramTab1.isAdditionalTab = paramTab1.tabLink === "additionalTabs";
    paramTab1.tab = paramTab1;
    this._commonHelper.autoTabEventEvent.next(paramTab1.tab);
    this.setTab(paramTab1.tab);
  }

  // get tenant setting for tab layout
  private getTabLayoutTenantSetting() {
    return new Promise((resolve, reject) => {
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.PRICEBOOK_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.PRICEBOOK_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.PRICEBOOK_TAB_LAYOUT}`, JSON.stringify(response));
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            resolve(this.tabLayout);
          });

      }
      else {
        this.tabLayout = tabLayout;
        resolve(null);
      }
    });
  }
  /**
 * END
 * Additional Tabs Code 
 */

  copyPriceBook() {
    this.openAddPriceBookPopup(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.COPY_PRICEBOOK_TITLE', { priceBookName: this.priceBookName }), this.priceBookId);
  }

  setRefreshDocument() {
    this.refreshDocument = false;
    setTimeout(() => {
      this.refreshDocument = true;
    }, 500);
  }
  
  private openAddPriceBookPopup(title: string, copyPriceBookID: number) {
    // avoid multiple popup open
    if (this._modalService.hasOpenModals()) {
      return;
    }
    
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(PricebookAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = title;
    this.modalRef.componentInstance.copyPriceBookID = copyPriceBookID;
    this.modalRef.result.then((newPriceBookId: any) => {
      if (newPriceBookId && newPriceBookId != null && newPriceBookId >= 0) {
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.ADD_SUCCESS_MESSAGE'));
        this.redirectToPriceBookDetail(newPriceBookId);
      }
    });
  }

  private redirectToPriceBookDetail(priceBookId: number) {
    if ((+priceBookId || 0) >= 0)
      this._router.navigateByUrl('/pricebooks/details/' + priceBookId);
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

  onDeletePriceBookClick(priceBookId) {
    const params = {
      EntityTypeId: Entity.PriceBooks,
      EntityId: priceBookId
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
        this.modalRef.componentInstance.entityId = priceBookId;
        this.modalRef.componentInstance.entityTypeId = Entity.PriceBooks;
        this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DELETE_LABEL');
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE');
      }
      else {
        this.optionsForPopupDialog.size = "md";
        this._confirmationDialogService.confirm('PRICEBOOKS.DETAIL.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this.deletePriceBook(priceBookId);
            }
          });
        (error: any) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        }
      }
    });
  }

  private deletePriceBook(priceBookId) {
    this._commonHelper.showLoader();
    this._priceBookService.deletePriceBook(priceBookId).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.MESSAGE_PRICEBOOK_DELETED')
      );
      // Redirect Pricebook Listing Page.
      this._router.navigateByUrl('/pricebooks/list');
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

}
