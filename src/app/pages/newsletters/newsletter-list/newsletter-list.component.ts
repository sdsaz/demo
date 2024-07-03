import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { NewsletterPagingParams } from '../../../@core/sharedModels/paging-params.model';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import * as moment from 'moment';
import { NewslettersService } from '../newsletters.service';
import { NewsletterAddComponent } from '../newsletter-add/newsletter-add.component';
import { DownloadFileMimeType, Entity, ExportType, FileExtension, LocalStorageKey, PublicTenantSettings, UserTypeID } from '../../../@core/enum';
import { SettingsService } from '../../settings/settings.service';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';

@Component({
  selector: 'ngx-newsletter-list',
  templateUrl: './newsletter-list.component.html',
  styleUrls: ['./newsletter-list.component.scss']
})
export class NewsletterListComponent implements OnInit {

  // search and table element
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  newsletters: any[] = [];
  entityTypeId: number = Entity.Newsletters;
  // pagination
  pagingParams: NewsletterPagingParams;
  totalPages: number;
  start: number;
  end = 0;
  first = 0;
  totalRecords: number;
  startDate: Date;
  endDate: Date;

  //right side activity menu
  isShowActivityCenter: boolean = false;
  selectedRowId: number = 0;
  entityWorkflowId: number = 0;
  entityDetails: any;
  selectedNewslettersForActivityCenter: any;
  selectedNewslettersIdForActivityCenter: number = 0;
  selectedNewslettersIsActive: boolean = true;
  isAdvanceFilterVisible: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  entityRecordTypeId: number;
  refreshActivityCenter: boolean = false;
  ratingOptions: any [] = [];

  // search filter
  lastNewsletterSearchFilter: any;
  newsletterSearchFilter = {
    searchText: '',
    // status: null,
    createdStartDate: null,
    createdEndDate: null,
    IsActive: false,
    rating: null,
    showStarred: false
  }

  IsActive: boolean = false;
  // statusOptions: any = [{ value: null, label: "All" }, { value: true, label: "Active" }, { value: false, label: "Inactive" }]

  // permission variable
  isViewNewsletter: boolean = false;
  isAddNewsletter: boolean = false;
  isEditNewsletter: boolean = false;
  isDeleteNewsletter: boolean = false;
  isExportNewsletter:boolean = false;

  // table Column
  cols: any[];
  isShowActionColumn: boolean = false;
  rangeDates: any[] = [];
  dateSelectOptionsButtonBar = ['today', 'yesterday', 'last7days'];

  private modalRef: NgbModalRef | null;
  private optionsForPopupDialog: any = {
    size: 'md',
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //LoggedInUser details
  loggedInUserDetails: any;
  localStorageKeyPrefix: string = "";

  rowActionButtonMouseHoverFlag: boolean = false;

  newsletterCreatedBy: number;

  keyfieldResponseData: any;
  currencySymbol: any = null;
  hoursInDay: number = null;
  userTypeID = UserTypeID;
  quickViewConfig: any;
  showStarred:boolean = false;

  //export Account
  dynamicColumnNameSetting: any = {};
  CampaignColumnName: string;

  constructor(
    private _router: Router,
    public _commonHelper: CommonHelper,
    private _modalService: NgbModal,
    private _newslettersService: NewslettersService,
    private _settingsService: SettingsService,
    private _confirmationDialogService: ConfirmationDialogService,
    private _fileSignedUrlService: FileSignedUrlService) {

    this.setPermissions();
    this.setColumnDefinations();
    this.initializePagination();
    this.setRatingOptions();
  }

  ngOnInit(): void {
    //get user detail
    this.loggedInUserDetails = this._commonHelper.getLoggedUserDetail();
    //set local storage key
    this.localStorageKeyPrefix = `${this.loggedInUserDetails.tenantId}_${this.loggedInUserDetails.userId}`;

    this.setLastSearchFilterFromStorage();
    if ((this.rangeDates.length == 0) && (this.newsletterSearchFilter.createdStartDate != null || this.newsletterSearchFilter.createdEndDate != null)) {
      this.startDate = moment(new Date(this.newsletterSearchFilter.createdStartDate)).toDate();
      if (this.newsletterSearchFilter.createdEndDate != null) {
        this.endDate = moment(new Date(this.newsletterSearchFilter.createdEndDate)).toDate();
      }
      this.rangeDates.push(this.startDate);
      this.rangeDates.push(this.endDate);
    }

    this.getCurrencySymbol()
    this.getHoursInDay();

    this.getNewsletters(this.pagingParams);
    this.subscribeSearchboxEvent();

    // get set quickview local storage config start
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedNewslettersIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
    }
    // get set quickview local storage config end

  }

  private setExportLabel() {
    this.CampaignColumnName = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.ALLLISTING.EXPORT_CAMPAIGN_LABEL'));

    this.dynamicColumnNameSetting = {};
    this.dynamicColumnNameSetting["CampaignName"] = this.CampaignColumnName;
  }

  setRatingOptions(){
    this._commonHelper.setRatingOptions().then((response) => { this.ratingOptions = response as []; });
  }

  fetchNewsletters(): void {
    if (this.pTable) {
      this.getNewsletters(this.pagingParams);
    }
  }

  newsletterDetail(id: number): void {
    this._router.navigate(['detail/' + id]);
  }

  onFilterRating(event) {
    this.newsletterSearchFilter.rating = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_NewsletterKey, JSON.stringify(this.newsletterSearchFilter), this.localStorageKeyPrefix);
    this.getNewsletters(this.pagingParams);
  }

  onFilterShowStarred() {
    this.newsletterSearchFilter.showStarred = this.showStarred;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_NewsletterKey, JSON.stringify(this.newsletterSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getNewsletters(this.pagingParams);
  }

  onResetAllFilters() {
    this.newsletterSearchFilter.searchText = '';
    // this.newsletterSearchFilter.status = null;
    this.newsletterSearchFilter.IsActive = false;
    this.newsletterSearchFilter.createdStartDate = null;
    this.newsletterSearchFilter.createdEndDate = null;
    this.newsletterSearchFilter.rating = null;
    this.newsletterSearchFilter.showStarred = false;

    this.rangeDates = null;
    this.IsActive = false;
    this.showStarred = false;
    this.newsletterSearchFilter.rating = null;
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    // this.pagingParams.status = null;
    this.pagingParams.createdStartDate = null;
    this.pagingParams.createdEndDate = null;
    this.pagingParams.IsActive = false;
    this.pagingParams.rating = null;
    this.pagingParams.showStarred = false;
    this.getNewsletters(this.pagingParams);
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchNewsletters();
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
      this.fetchNewsletters();
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchNewsletters();
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
    this.fetchNewsletters();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchNewsletters();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchNewsletters();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  onStatusChange(newsletter) {
    if (!this.isEditNewsletter) {
      return
    }

    let messageText = newsletter.isActive ? 'CRM.NEWSLETTER.ALLLISTING.MESSAGE_CONFIRM_INACTIVE' : 'CRM.NEWSLETTER.ALLLISTING.MESSAGE_CONFIRM_ACTIVE';
    let successText = newsletter.isActive ? 'CRM.NEWSLETTER.ALLLISTING.MESSAGE_NEWSLETTER_INACTIVATED' : 'CRM.NEWSLETTER.ALLLISTING.MESSAGE_NEWSLETTER_ACTIVATED';

    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        let params = { id: newsletter.id, isActive: !newsletter.isActive };
        this._newslettersService.updateNewsletterIsActive(params).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
          }
          this.fetchNewsletters();
          this._commonHelper.hideLoader();
        }, (error) => {
          this.fetchNewsletters();
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
    });
  }

  // onFilterStatus(event) {
  //   this.newsletterSearchFilter.status = event.value;
  //   this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_NewsletterKey, JSON.stringify(this.newsletterSearchFilter), this.localStorageKeyPrefix);
  //   this.getNewsletters(this.pagingParams);
  // }

  public onFilterShowActiveRecords() {
    this.newsletterSearchFilter.IsActive = this.IsActive;
    this.pagingParams.pageNo = 1;
    this.getNewsletters(this.pagingParams);
  }

  onFilterCreated(event) {
    if (event == null) {
      this.rangeDates = null;
      this.newsletterSearchFilter.createdStartDate = null;
      this.newsletterSearchFilter.createdEndDate = null;
      this.getNewsletters(this.pagingParams);
    }
    else {
      if (event[0] < this._commonHelper.globalMinDate || event[0] > this._commonHelper.globalMaxDate || event[1] > this._commonHelper.globalMaxDate || event[1] < this._commonHelper.globalMinDate) {
        this.rangeDates = [];
        this.newsletterSearchFilter.createdStartDate = null;
        this.newsletterSearchFilter.createdEndDate = null;
        this.getNewsletters(this.pagingParams);
      }
      else {
      this.startDate = event[0];
      this.endDate = event[1];
      this.newsletterSearchFilter.createdStartDate = event[0] != null ? moment(event[0]).format('YYYY-MM-DD') : null;
      this.newsletterSearchFilter.createdEndDate = event[1] != null ? moment(event[1]).format('YYYY-MM-DD') : null;
      this.getNewsletters(this.pagingParams);
    }
  }
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_NewsletterKey, JSON.stringify(this.newsletterSearchFilter), this.localStorageKeyPrefix);
  }

  addNewsletter() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(NewsletterAddComponent, this.optionsForPopupDialog);
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.fetchNewsletters();
      }
    });
  }

  onDeleteNewsletterClick(newsletterID) {
    this._confirmationDialogService.confirm('CRM.NEWSLETTER.LIST.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._newslettersService.deleteNewsletter(newsletterID).then(() => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.LIST.MESSAGE_NEWSLETTER_DELETED')
          );
          this.totalRecords = this.totalRecords - 1;
          this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/this.pagingParams.pageSize) : 1;
          this.fetchNewsletters();
        },
          (error: any) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          }
        );
      }
    });
  }

  //#region private methods
  private setPermissions(): void {
    this.isViewNewsletter = this._commonHelper.havePermission(enumPermissions.ViewNewsletter);
    this.isAddNewsletter = this._commonHelper.havePermission(enumPermissions.AddNewsletter);
    this.isEditNewsletter = this._commonHelper.havePermission(enumPermissions.EditNewsletter);
    this.isDeleteNewsletter = this._commonHelper.havePermission(enumPermissions.DeleteNewsletter);
    this.isExportNewsletter=this._commonHelper.havePermission(enumPermissions.ExportNewsletter);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadNewsletterDocument);
    this.isShowActionColumn = this.isDeleteNewsletter || this.isEditNewsletter;
  }

  private setColumnDefinations(): void {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'name', header: 'CRM.NEWSLETTER.LIST.TABLE_HEADER_NAME', sort: true, visible: true },
      { field: 'campaignName', header: 'CRM.NEWSLETTER.LIST.TABLE_HEADER_CAMPAIGNNAME', sort: true, visible: true },
      { field: 'createdByName', header: 'CRM.NEWSLETTER.LIST.TABLE_HEADER_CREATED_BY', sort: true, visible: true },
      { field: 'created', header: 'CRM.NEWSLETTER.LIST.TABLE_HEADER_CREATED', sort: true, visible: true },
      // { field: 'isActive', header: 'CRM.NEWSLETTER.LIST.TABLE_HEADER_IS_ACTIVE', sort: true, class: "status" },
      { field: 'id', header: '', sort: false, class: "icon--dropdown action", visible: true }
    ];
    
    //set Action column show/hide dynamically
    if(!this.isEditNewsletter && !this.isDeleteNewsletter)
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
    this.pagingParams = new NewsletterPagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
    // this.pagingParams.status = null;
    this.pagingParams.IsActive = this.IsActive;
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_NewsletterKey, this.localStorageKeyPrefix));
    if (searchFilter != null) {
      this.newsletterSearchFilter = searchFilter;
      this.IsActive = this.newsletterSearchFilter.IsActive;
      this.pagingParams.rating = this.newsletterSearchFilter.rating;
      this.showStarred = this.newsletterSearchFilter.showStarred;
    }
    this.lastNewsletterSearchFilter = JSON.parse(JSON.stringify(this.newsletterSearchFilter));
  }

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.newsletterSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this.fetchNewsletters();
      });
  }

  private getNewsletters(pagingParams: NewsletterPagingParams): void {
    this._commonHelper.showLoader();
    this.pagingParams.searchString = this.newsletterSearchFilter.searchText;
    this.pagingParams.rating = this.newsletterSearchFilter.rating;
    this.pagingParams.showStarred = this.newsletterSearchFilter.showStarred;
    // this.pagingParams.status = this.newsletterSearchFilter.status;

    this.pagingParams.IsActive = !this.newsletterSearchFilter.IsActive;
    
    this.pagingParams.createdStartDate = this.newsletterSearchFilter.createdStartDate;
    this.pagingParams.createdEndDate = this.newsletterSearchFilter.createdEndDate;
    this._newslettersService.getAllNewsletters(pagingParams)
      .then((response: any[]) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.newsletters = response;
          this.totalRecords = this.newsletters.length > 0 ? this.newsletters[0].totalRecords : 0;
          this.pTable.rows = this.pagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
          this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.newsletters.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
          
          if (this.selectedNewslettersIdForActivityCenter != null && this.selectedNewslettersIdForActivityCenter > 0 && this.newsletters.some(x => x.id == this.selectedNewslettersIdForActivityCenter)) {
            this.updateEntityDetails(true, this.newsletters.find(x => x.id == this.selectedNewslettersIdForActivityCenter));
          }
          else {
            this.resetSelectedEntity();
          }

          this._fileSignedUrlService.getFileSingedUrl(this.newsletters, 'createdByImagePath', 'createdBySignedUrl', Entity.Users)
        }
        this.setExportLabel();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_NewsletterKey, JSON.stringify(this.newsletterSearchFilter), this.localStorageKeyPrefix);
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

  //Export Newsletters Listing

  exportExcel(){
    this.exportNewsletters(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportNewsletters(exportType: string, fileExtension: string, fileMimeType: string){
    this._commonHelper.showLoader();

    const excelExportPayload = {

      searchString: this.pagingParams.searchString,
      // status:this.pagingParams.status,
      IsActive:this.pagingParams.IsActive,
      tenantId:this.pagingParams.tenantId,
      createdStartDate:this.pagingParams.createdStartDate,
      createdEndDate:this.pagingParams.createdEndDate,
      sortColumn: this.pagingParams.sortColumn,
      sortOrder: this.pagingParams.sortOrder,
      exportType: exportType,
      rating: this.pagingParams.rating,
      pageNo: 1,
      pageSize: this._commonHelper.DefaultPageSize,
      dynamicColumnSettingJson: "",
      showStarred: this.pagingParams.showStarred
    }

    let fileName = this._commonHelper.getConfiguredEntityName('{{Newsletters_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.ALLLISTING.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    this._newslettersService.exportNewsletters(excelExportPayload).then((base64String: any) => {
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

  onRowClick(rowData: any, isShowActivityCenter:boolean = null) {
    
    if (this.rowActionButtonMouseHoverFlag) {
      return;
    }

    const settingsJson = JSON.parse(rowData.settingsJson);
    const obj = {
      id: rowData.id,
      entityIcon: 'fas fa-newspaper',
      entityName: this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.DETAIL.TITLE'),
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
      isActive: rowData?.isActive,
      createdBy: rowData?.createdBy,
      relatedToRedirectURL: null
    };

    this.entityDetails = this._commonHelper.cloningObject(obj);
    this.selectedRowId = rowData.id;
    this.newsletterCreatedBy = rowData?.createdBy;

    this.selectedNewslettersForActivityCenter = rowData;
    this.selectedNewslettersIdForActivityCenter = rowData.id;
    this.selectedNewslettersIsActive = rowData.isActive;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedRowEntityId: this.selectedRowId
    }
    
    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewNewsletter);
  }

  advanceFilterVisibleChange(value: boolean) {
    this.isAdvanceFilterVisible = value;
  }

  // Set row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Newsletters_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Newsletters_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
  }

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewNewsletter;
        this.selectedNewslettersIdForActivityCenter = details.id;
        this.selectedNewslettersForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedNewslettersIsActive = details.isActive;
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
    this.selectedNewslettersForActivityCenter = null;
    this.selectedNewslettersIdForActivityCenter = 0;
    this.selectedNewslettersIsActive = null;
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

    this._newslettersService.updateNewsletterField(params).then((response) => {
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
