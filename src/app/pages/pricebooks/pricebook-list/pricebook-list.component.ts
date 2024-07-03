import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { PrimeNGConfig } from 'primeng/api';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { Actions, DownloadFileMimeType, Entity, ExportType, FileExtension, LocalStorageKey, PublicTenantSettings } from '../../../@core/enum';
import { PriceBookPagingParams } from '../../../@core/sharedModels/paging-params.model';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { SettingsService } from '../../settings/settings.service';
import { PricebookAddComponent } from '../pricebook-add/pricebook-add.component';
import { PricebookService } from '../pricebook.service';
import { EntityReferencesListComponent } from '../../../@core/sharedComponents/entity-references-list/entity-references-list.component';
import { CommonService } from '../../../@core/sharedServices/common.service';
import * as moment from 'moment';

@Component({
  selector: 'ngx-pricebook-list',
  templateUrl: './pricebook-list.component.html',
  styleUrls: ['./pricebook-list.component.scss']
})
export class PricebookListComponent implements OnInit {

  // search and table element
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  // PriceBooks list
  priceBooks: any[] = [];
  entityTypeId: number = Entity.PriceBooks;

  //right side activity menu
  isShowActivityCenter: boolean = false;
  selectedRowId: number = 0;
  entityWorkflowId: number = 0;
  entityDetails: any;
  entityRecordTypeId: number;
  selectedPriceBookForActivityCenter: any;
  selectedPriceBookIdForActivityCenter: number = 0;
  selectedPriceBookIsActive: boolean = true;
  selectedPriceBookIsDefault: boolean = false;
  refreshActivityCenter: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isAdvanceFilterVisible: boolean = false;

  // pagination
  pagingParams: PriceBookPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;
  ratingOptions: any[] = [];

  // search filter
  lastPriceBookSearchFilter: any;
  priceBookSearchFilter = {
    searchText: '',
    // status: null,
    IsActive: false,
    rating: null,
    showStarred: false
  }

  IsActive: boolean = false;
  showStarred:boolean = false;

  // statusOptions: any = [{ value: null, label: "All" }, { value: true, label: "Active" }, { value: false, label: "Inactive" }]

  // permission variable
  isViewPriceBook: boolean = false;
  isAddPriceBook: boolean = false;
  isEditPriceBook: boolean = false;
  isImportPriceBook: boolean = false;
  isDeletePriceBook: boolean = false;
  isExportPriceBooks: boolean = false;

  // Flag
  isDisabled = true;

  // table Column
  cols: any[];
  isShowActionColumn: boolean = false;

  //datasource
  currencySymbol: any = null;
  hoursInDay: number = null;
  keyfieldResponseData: any;


  private modalRef: NgbModalRef | null;
  private optionsForPopupDialog: any = {
    size: 'md',
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  loggedInUserDetails: any;
  localStorageKeyPrefix: string = "";

  priceBookCreatedBy: number;
  quickViewConfig: any;

  rowActionButtonMouseHoverFlag: boolean = false;

  //export Account
  dynamicColumnNameSetting: any = {};

  constructor(
    private _router: Router,
    public _commonHelper: CommonHelper,
    private _priceBookService: PricebookService,
    private _modalService: NgbModal,
    private _settingsService: SettingsService,
    private _confirmationDialogService: ConfirmationDialogService,
    private primengConfig: PrimeNGConfig,
    private _commonService: CommonService) {

    this.setPermissions();
    this.setColumnDefinations();
    this.initializePagination();
    this.setRatingOptions();
  }

  ngOnInit(): void {
    //get user detail
    this.loggedInUserDetails = this._commonHelper.getLoggedUserDetail();
    //set local storage prefix
    this.localStorageKeyPrefix = `${this.loggedInUserDetails.tenantId}_${this.loggedInUserDetails.userId}`;

    this.setLastSearchFilterFromStorage();

    this.getCurrencySymbol();
    this.getHoursInDay();

    this.getPriceBooks(this.pagingParams);

    this.subscribeSearchboxEvent();
    this.primengConfig.ripple = true;

    // get set quickview local storage config start
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedPriceBookIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
    }
    // get set quickview local storage config end

  }

  fetchPriceBooks(): void {
    if (this.pTable) {
      this.getPriceBooks(this.pagingParams);
    }
  }

  setRatingOptions() {
    this._commonHelper.setRatingOptions().then((response) => { this.ratingOptions = response as []; });
  }

  // onFilterStatus(event) {
  //   this.priceBookSearchFilter.status = event.value;
  //   this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_PricebookListKey, JSON.stringify(this.priceBookSearchFilter), this.localStorageKeyPrefix);
  //   this.getPriceBooks(this.pagingParams);
  // }

  onFilterRating(event) {
    this.priceBookSearchFilter.rating = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_PricebookListKey, JSON.stringify(this.priceBookSearchFilter), this.localStorageKeyPrefix);
    this.getPriceBooks(this.pagingParams);
  }

  onFilterShowStarred() {
    this.priceBookSearchFilter.showStarred = this.showStarred;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_PricebookListKey, JSON.stringify(this.priceBookSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getPriceBooks(this.pagingParams);
  }

  public onFilterShowActiveRecords() {
    this.priceBookSearchFilter.IsActive = this.IsActive;
    this.pagingParams.pageNo = 1;
    this.getPriceBooks(this.pagingParams);
  }

  onResetAllFilters() {
    this.priceBookSearchFilter.searchText = '';
    // this.priceBookSearchFilter.status = null;
    this.priceBookSearchFilter.IsActive = false;
    this.priceBookSearchFilter.rating = null;
    this.priceBookSearchFilter.showStarred = false;

    this.IsActive = false;
    this.showStarred = false;

    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.IsActive = false;
    this.pagingParams.rating = null;
    this.pagingParams.showStarred = false;
    this.getPriceBooks(this.pagingParams);
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchPriceBooks();
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
      this.fetchPriceBooks();
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchPriceBooks();
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
    this.fetchPriceBooks();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchPriceBooks();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchPriceBooks();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  //#region private methods
  private setPermissions(): void {
    this.isViewPriceBook = this._commonHelper.havePermission(enumPermissions.ViewPriceBook);
    this.isAddPriceBook = this._commonHelper.havePermission(enumPermissions.AddPriceBook);
    this.isEditPriceBook = this._commonHelper.havePermission(enumPermissions.EditPriceBook);
    this.isDeletePriceBook = this._commonHelper.havePermission(enumPermissions.DeletePriceBook);
    this.isExportPriceBooks = this._commonHelper.havePermission(enumPermissions.ExportPriceBooks);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadPriceBookDocument);
    this.isShowActionColumn = this.isDeletePriceBook || this.isEditPriceBook;
  }

  private setColumnDefinations(): void {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'name', header: 'PRICEBOOKS.LIST.TABLE_HEADER_NAME', sort: true, visible: true },
      { field: 'startDate', header: 'PRICEBOOKS.LIST.TABLE_HEADER_STARTDATE', sort: true, visible: true },
      { field: 'endDate', header: 'PRICEBOOKS.LIST.TABLE_HEADER_ENDDATE', sort: true, visible: true },
      { field: 'modified', header: 'PRICEBOOKS.LIST.TABLE_HEADER_LASTUPDATEDON', sort: true, class: "lastUpdatedOn", visible: true},
      // { field: 'status', header: 'PRICEBOOKS.LIST.TABLE_HEADER_STATUS', sort: true }
    ];

    if (!this.isDisabled) { this.cols.push({ field: 'type', header: 'PriceBookS.LIST.TYPE', sort: true, visible: true }); }

    this.cols.push({ field: 'id', header: '', sort: false, class: "icon--dropdown action", visible: true })

    //set Action column show/hide dynamically
    if(!this.isEditPriceBook && !this.isDeletePriceBook)
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
    this.pagingParams = new PriceBookPagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
    this.pagingParams.IsActive = this.IsActive;
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_PricebookListKey, this.localStorageKeyPrefix));
    if (searchFilter != null) {
      this.priceBookSearchFilter = searchFilter;
      this.IsActive = this.priceBookSearchFilter.IsActive;
      this.pagingParams.rating = this.priceBookSearchFilter.rating;
      this.showStarred = this.priceBookSearchFilter.showStarred;
    }

    this.lastPriceBookSearchFilter = JSON.parse(JSON.stringify(this.priceBookSearchFilter));
  }


  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.priceBookSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this.fetchPriceBooks();
      });
  }

  onPriceBookNameClick(priceBookId) {
    // check logged in user have permission to view user details
    if (!this.isViewPriceBook && !this.isEditPriceBook) {
      return;
    }

    // if not undefined then redirect
    if (priceBookId != undefined && priceBookId > 0) {
      this._router.navigateByUrl('/pricebooks/details/' + priceBookId);
    }
  }

  // open add popup
  addPriceBook() {
    this.openAddPriceBookPopup(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.ADD_DIALOG.TITLE')), 0);
  }

  copyPriceBook(priceBookID: number, priceBookName: string) {
    this.openAddPriceBookPopup(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.ADD_DIALOG.COPY_PRICEBOOK_TITLE', { priceBookName: priceBookName }), priceBookID);
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
      if (newPriceBookId && newPriceBookId != null) {

        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.ADD_DIALOG.SUCCESS_MESSAGE'));
        if ((+copyPriceBookID || 0) <= 0) {
          // refresh data
          this.fetchPriceBooks();
        } else {
          this.onPriceBookNameClick(+newPriceBookId || 0);
        }
      }
    });
  }

  private getPriceBooks(pagingParams: PriceBookPagingParams): void {
    this._commonHelper.showLoader();
    this.pagingParams.searchString = this.priceBookSearchFilter.searchText;
    // this.pagingParams.status = this.priceBookSearchFilter.status;
    this.pagingParams.showStarred = this.priceBookSearchFilter.showStarred;
    this.pagingParams.IsActive = !this.priceBookSearchFilter.IsActive;
    this.pagingParams.rating = this.priceBookSearchFilter.rating;

    this._priceBookService.getPriceBooks(pagingParams)
      .then((response: any[]) => {
        if (response) {
          this.priceBooks = response;
          this.totalRecords = this.priceBooks.length > 0 ? this.priceBooks[0].totalRecords : 0;
          this.pTable.rows = this.pagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
          this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.priceBooks.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
          if (this.selectedPriceBookIdForActivityCenter != null && this.selectedPriceBookIdForActivityCenter > 0 && this.priceBooks.some(x => x.id == this.selectedPriceBookIdForActivityCenter)) {
            this.updateEntityDetails(true, this.priceBooks.find(x => x.id == this.selectedPriceBookIdForActivityCenter));
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
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_PricebookListKey, JSON.stringify(this.priceBookSearchFilter), this.localStorageKeyPrefix);
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
        this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData('PRICEBOOKS.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DELETE_LABEL');
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('PRICEBOOKS.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE');
      }
      else {
        this.optionsForPopupDialog.size = "md";
        this._confirmationDialogService.confirm('PRICEBOOKS.LIST.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog)
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
        this._commonHelper.getInstanceTranlationData('PRICEBOOKS.LIST.MESSAGE_PRICEBOOK_DELETED')
      );
      this.totalRecords = this.totalRecords - 1;
      this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/ this.pagingParams.pageSize) : 1;
      this.fetchPriceBooks();
    },
      (error: any) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

  private changePriceBookStatus(id, status) {
    this.optionsForPopupDialog.size = "md";
    let messageText = status ? 'PRICEBOOKS.ALLLISTING.MESSAGE_CONFIRM_INACTIVE' : 'PRICEBOOKS.ALLLISTING.MESSAGE_CONFIRM_ACTIVE';
    let successText = status ? 'PRICEBOOKS.ALLLISTING.MESSAGE_PRICEBOOK_INACTIVATED' : 'PRICEBOOKS.ALLLISTING.MESSAGE_PRICEBOOK_ACTIVATED';
    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._priceBookService.changePriceBookStatus(id, !status).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
          }
          this.getPriceBooks(this.pagingParams);
          this._commonHelper.hideLoader();
        }, (error) => {
          this.getPriceBooks(this.pagingParams);
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
      else {
        this.getPriceBooks(this.pagingParams);
      }
    });
  }

  onChangeStatus(id, status) {
    if (!this.isEditPriceBook) {
      return;
    }
    if (status) {
      const params = {
        EntityTypeId: this.entityTypeId,
        EntityId: id
      };

      let messageText = status ? 'PRICEBOOKS.DETAIL.MESSAGE_CONFIRM_INACTIVE' : 'PRICEBOOKS.DETAIL.MESSAGE_CONFIRM_ACTIVE';
      let successText = status ? 'PRICEBOOKS.LIST.MESSAGE_PRICEBOOK_INACTIVATED' : 'PRICEBOOKS.LIST.MESSAGE_USER_ACTIVATED';
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
          this.modalRef.componentInstance.entityId = id;
          this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
          this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData('PRICEBOOKS.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DEACTIVE_LABEL');
          this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('PRICEBOOKS.LIST.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE');
          this.modalRef.componentInstance.action = Actions.InActive;
          this.modalRef.result.then((response: any) => {
            if (response) {
                this.optionsForPopupDialog.size = "md";
                  this._commonHelper.showLoader();
                  this._priceBookService.changePriceBookStatus(id, !status).then((response: any[]) => {
                    if (response) {
                      this.pagingParams.IsActive = !this.pagingParams.IsActive;
                      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData(successText));
                    }
                    this._commonHelper.hideLoader();
                    this.getPriceBooks(this.pagingParams);
                  }, (error) => {
                    this._commonHelper.hideLoader();
                    this.getPriceBooks(this.pagingParams);
                    this.getTranslateErrorMessage(error);
                });
          }
        });
        }

        else {
          this.changePriceBookStatus(id, status)
        }
      });
    }
    else {
      this.changePriceBookStatus(id, status)
    }
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'pricebooks.defaultpricebookdelete') {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.PRICEBOOKS_DEFAULTPRICEBOOKDELETE')));
      } else if (error.messageCode.toLowerCase() == 'pricebooks.defaultpricebookelse') {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.PRICEBOOKS_DEFAULTPRICEBOOK')));
      } else if (error.messageCode.toLowerCase() == 'pricebooks.pricebookalreadyinotherentities') {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.PRICEBOOKS_PRICEBOOKALREADYINOTHERENTITIES')));
      } else if (error.messageCode.toLowerCase() == 'pricebooks.pricebookinotherentities') {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.PRICEBOOKS_PRICEBOOKINOTHERENTITIES')));
      } else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('PRICEBOOKS.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }

  //Export PriceBooks Listing

  exportExcel() {
    this.exportPriceBooks(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportPriceBooks(exportType: string, fileExtension: string, fileMimeType: string) {
    this._commonHelper.showLoader();

    const excelExportPayload = {

      tenantId: this.pagingParams.tenantId,
      searchString: this.pagingParams.searchString,
      // status:this.pagingParams.status,
      IsActive: this.pagingParams.IsActive,
      sortColumn: this.pagingParams.sortColumn,
      sortOrder: this.pagingParams.sortOrder,
      exportType: exportType,
      pageNo: 1,
      pageSize: this._commonHelper.DefaultPageSize,
      rating: this.pagingParams.rating,
      dynamicColumnSettingJson: "",
      showStarred: this.pagingParams.showStarred
    }

    let fileName = this._commonHelper.getConfiguredEntityName('{{PriceBooks_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('PRICEBOOKS.ALLLISTING.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    this._priceBookService.exportPriceBooks(excelExportPayload).then((base64String: any) => {
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

  onMoreDetailsClick(isShowActivityCenter: boolean) {
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

  onRowClick(rowData: any, isShowActivityCenter: boolean = null) {

    if (this.rowActionButtonMouseHoverFlag) {
      return;
    }

    const settingsJson = JSON.parse(rowData?.settingsJson);
    const obj = {
      id: rowData.id,
      entityIcon: 'fas fas fa-book',
      entityName: this._commonHelper.getInstanceTranlationData('PRICEBOOKS.DETAIL.TITLE'),
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
      createdBy: rowData?.createdBy,
      isActive: rowData?.isActive
    };

    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id;
    this.priceBookCreatedBy = rowData?.createdBy;

    this.selectedPriceBookForActivityCenter = rowData;
    this.selectedPriceBookIdForActivityCenter = rowData.id;
    this.selectedPriceBookIsActive = rowData.isActive;
    this.selectedPriceBookIsDefault = rowData.isDefault;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedRowEntityId: this.selectedRowId
    }

    if (isShowActivityCenter != null) {
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewPriceBook);
  }

  advanceFilterVisibleChange(value: boolean) {
    this.isAdvanceFilterVisible = value;
  }

  // Set row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Pricebooks_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Pricebooks_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
  }

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewPriceBook;
        this.selectedPriceBookIdForActivityCenter = details.id;
        this.selectedPriceBookForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedPriceBookIsActive = details.isActive;
        this.selectedPriceBookIsDefault = details.isDefault;
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
    this.selectedPriceBookForActivityCenter = null;
    this.selectedPriceBookIdForActivityCenter = 0;
    this.selectedPriceBookIsActive = null;
    this.selectedPriceBookIsDefault = null;
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

    this._priceBookService.updatePriceBookField(params).then((response) => {
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

}
