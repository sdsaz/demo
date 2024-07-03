import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { CampaignPagingParams, PagingParams } from '../../../@core/sharedModels/paging-params.model';
import { ConfirmationDialogService } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import * as moment from 'moment';
import { CampaignsService } from '../campaigns.service';
import { CampaignAddComponent } from '../campaign-add/campaign-add.component';
import { DownloadFileMimeType, Entity, ExportType, FileExtension, LocalStorageKey, PublicTenantSettings, UserTypeID } from '../../../@core/enum';
import { SettingsService } from '../../settings/settings.service';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';

@Component({
  selector: 'ngx-campaign-list',
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.scss']
})
export class CampaignListComponent implements OnInit {

  // search and table element
  @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  userTypeID = UserTypeID;

  campaigns: any[] = [];
  entityTypeId: number = Entity.Campaigns;

  // pagination
  pagingParams: CampaignPagingParams;
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
  selectedCampaignsForActivityCenter: any;
  selectedCampaignsIdForActivityCenter: number = 0;
  selectedCampaignsIsActive: boolean = true;
  isAdvanceFilterVisible: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  entityRecordTypeId: number;
  refreshActivityCenter: boolean = false;

  // search filter
  lastCampaignSearchFilter: any;
  campaignSearchFilter = {
    searchText: '',
    // status: null,
    createdStartDate: null,
    createdEndDate: null,
    IsActive: false,
    rating: null,
    showStarred: false
  }

  IsActive: boolean = false;
  // statusOptions:any = [{value:null,label:"All"},{value:true,label:"Active"},{value:false,label:"Inactive"}]

  // permission variable
  isViewCampaign: boolean = false;
  isAddCampaign: boolean = false;
  isEditCampaign: boolean = false;
  isDeleteCampaign: boolean = false;
  isExportCampaigns: boolean = false;

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

  loggedInUserDetails: any;
  localStorageKeyPrefix: string = "";
  ratingOptions: any [] = [];
  showStarred:boolean = false;

  rowActionButtonMouseHoverFlag: boolean = false;
  
  keyfieldResponseData: any;
  currencySymbol: any = null;
  hoursInDay:number = null;
  campaginCreatedBy: number;
  quickViewConfig: any;

  //export Account
  dynamicColumnNameSetting: any = {};

  constructor(
    private _router: Router,
    public _commonHelper: CommonHelper,
    private _modalService: NgbModal,
    private _campaignsService: CampaignsService,
    private _settingsService: SettingsService,
    private _confirmationDialogService: ConfirmationDialogService,
    private _fileSignedUrlService: FileSignedUrlService) {

    this.setPermissions();
    this.setColumnDefinations();
    this.initializePagination();
    this.setRatingOptions();
  }

  ngOnInit(): void {
    //get user details
    this.loggedInUserDetails = this._commonHelper.getLoggedUserDetail();
    //set local storage prefix
    this.localStorageKeyPrefix = `${this.loggedInUserDetails.tenantId}_${this.loggedInUserDetails.userId}`;

    this.setLastSearchFilterFromStorage();
    if((this.rangeDates.length == 0) && (this.campaignSearchFilter.createdStartDate!=null || this.campaignSearchFilter.createdEndDate!=null))
    {
      this.startDate = moment(new Date(this.campaignSearchFilter.createdStartDate)).toDate();
      if(this.campaignSearchFilter.createdEndDate!=null){
      this.endDate = moment(new Date(this.campaignSearchFilter.createdEndDate)).toDate();
      }
      this.rangeDates.push(this.startDate);
      this.rangeDates.push(this.endDate);
    }
    
    this.getCurrencySymbol()
    this.getHoursInDay();
    this.getCampaigns(this.pagingParams);
    this.subscribeSearchboxEvent();

    // get set quickview local storage config start
    this.quickViewConfig = this.getQuickViewConfig();
    if (this.quickViewConfig) {
      this.selectedRowId = this.quickViewConfig.selectedRowEntityId;
      this.selectedCampaignsIdForActivityCenter = this.quickViewConfig.selectedRowEntityId;
    }
    // get set quickview local storage config end

  }
  
  fetchCampaigns(): void {
    if (this.pTable) {
      this.getCampaigns(this.pagingParams);
    }
  }

  setRatingOptions(){
    this._commonHelper.setRatingOptions().then((response) => { this.ratingOptions = response as []; });
  }

  campaignDetail(id: number): void {
    this._router.navigate(['detail/' + id]);
  }

  onFilterRating(event) {
    this.campaignSearchFilter.rating = event.value;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CampaignsKey, JSON.stringify(this.campaignSearchFilter), this.localStorageKeyPrefix);
    this.getCampaigns(this.pagingParams);
  }

  onFilterShowStarred() {
    this.campaignSearchFilter.showStarred = this.showStarred;
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CampaignsKey, JSON.stringify(this.campaignSearchFilter), this.localStorageKeyPrefix);
    this.pagingParams.pageNo = 1;
    this.getCampaigns(this.pagingParams);
  }

  onResetAllFilters() {
    this.campaignSearchFilter.searchText = '';
    // this.campaignSearchFilter.status = null;
    this.campaignSearchFilter.IsActive = false;
    this.campaignSearchFilter.createdStartDate = null;
    this.campaignSearchFilter.createdEndDate = null;
    this.campaignSearchFilter.rating = null;
    this.campaignSearchFilter.showStarred = false;

    this.rangeDates = null;
    this.IsActive = false;
    this.showStarred = false;

    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    // this.pagingParams.status = null;
    this.pagingParams.IsActive = false
    this.pagingParams.createdStartDate = null;
    this.pagingParams.createdEndDate = null;
    this.pagingParams.rating = null;
    this.pagingParams.showStarred = false;
    this.getCampaigns(this.pagingParams);
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.fetchCampaigns();
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
      this.fetchCampaigns();
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.fetchCampaigns();
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
    this.fetchCampaigns();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0 ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.fetchCampaigns();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.fetchCampaigns();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  onStatusChange(campaign) {
    if (!this.isEditCampaign) {
      return
    }

    let messageText = campaign.isActive ? 'CRM.CAMPAIGN.ALLLISTING.MESSAGE_CONFIRM_INACTIVE' : 'CRM.CAMPAIGN.ALLLISTING.MESSAGE_CONFIRM_ACTIVE';
    let successText = campaign.isActive ? 'CRM.CAMPAIGN.ALLLISTING.MESSAGE_CAMPAIGN_INACTIVATED' : 'CRM.CAMPAIGN.ALLLISTING.MESSAGE_CAMPAIGN_ACTIVATED';

    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        let params = { id: campaign.id, isActive: !campaign.isActive };
        this._campaignsService.updateCampaignIsActive(params).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
          }
          this.fetchCampaigns();
          this._commonHelper.hideLoader();
        }, (error) => {
          this.fetchCampaigns();
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
    });
  }

  // onFilterStatus(event) {
  //   this.campaignSearchFilter.status = event.value;
  //   this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CampaignsKey, JSON.stringify(this.campaignSearchFilter), this.localStorageKeyPrefix);
  //   this.getCampaigns(this.pagingParams);
  // }

  public onFilterShowActiveRecords() {
    this.campaignSearchFilter.IsActive = this.IsActive;
    this.pagingParams.pageNo = 1;
    this.getCampaigns(this.pagingParams);
  }

  onFilterCreated(event) {
    if (event == null) {
      this.rangeDates = [];
      this.campaignSearchFilter.createdStartDate = null;
      this.campaignSearchFilter.createdEndDate = null;
      this.getCampaigns(this.pagingParams);
    }
    else {
      if (event[0] < this._commonHelper.globalMinDate || event[0] > this._commonHelper.globalMaxDate || event[1] > this._commonHelper.globalMaxDate || event[1] < this._commonHelper.globalMinDate) {
        this.rangeDates = [];
        this.campaignSearchFilter.createdStartDate = null;
        this.campaignSearchFilter.createdEndDate = null;
        this.getCampaigns(this.pagingParams);
      }
      else
      {
      this.startDate = event[0];
      this.endDate = event[1];
      this.campaignSearchFilter.createdStartDate = event[0] != null ? moment(event[0]).format('YYYY-MM-DD') : null;
      this.campaignSearchFilter.createdEndDate = event[1] != null ? moment(event[1]).format('YYYY-MM-DD') : null;
      this.getCampaigns(this.pagingParams);
    }
  }
    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CampaignsKey, JSON.stringify(this.campaignSearchFilter), this.localStorageKeyPrefix);
  }

  addCampaign() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(CampaignAddComponent, this.optionsForPopupDialog);
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        // refresh data
        this.fetchCampaigns();
      }
    });
  }

  onDeleteCampaignClick(campaignID) {
    this._confirmationDialogService.confirm('CRM.CAMPAIGN.LIST.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._campaignsService.deleteCampaign(campaignID).then(() => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.LIST.MESSAGE_CAMPAIGN_DELETED')
          );
          this.totalRecords = this.totalRecords - 1;
          this.pagingParams.pageNo = this.totalRecords > 0 ? Math.ceil(this.totalRecords/this.pagingParams.pageSize) : 1;
          this.fetchCampaigns();
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
    this.isViewCampaign = this._commonHelper.havePermission(enumPermissions.ViewCampaign);
    this.isAddCampaign = this._commonHelper.havePermission(enumPermissions.AddCampaign);
    this.isEditCampaign = this._commonHelper.havePermission(enumPermissions.EditCampaign);
    this.isDeleteCampaign = this._commonHelper.havePermission(enumPermissions.DeleteCampaign);
    this.isExportCampaigns=this._commonHelper.havePermission(enumPermissions.ExportCampaign)
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadCampaignDocument);
    this.isShowActionColumn = this.isDeleteCampaign || this.isEditCampaign;
  }

  private setColumnDefinations(): void {
    this.cols = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'name', header: 'CRM.CAMPAIGN.LIST.TABLE_HEADER_NAME', sort: true, visible: true },
      { field: 'createdByName', header: 'CRM.CAMPAIGN.LIST.TABLE_HEADER_CREATED_BY', sort: true, visible: true },
      { field: 'created', header: 'CRM.CAMPAIGN.LIST.TABLE_HEADER_CREATED', sort: true, visible: true },
      // { field: 'isActive', header: 'CRM.CAMPAIGN.LIST.TABLE_HEADER_IS_ACTIVE', sort: true, class: "status" },
      { field: 'id', header: '', sort: false, class: "icon--dropdown action", visible: true }
    ];
     
    //set Action column show/hide dynamically
    if(!this.isEditCampaign && !this.isDeleteCampaign)
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
    this.pagingParams = new CampaignPagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortColumn = 'name';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
    // this.pagingParams.status = null;
    this.pagingParams.IsActive = this.IsActive;
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_CampaignsKey, this.localStorageKeyPrefix));
    if (searchFilter != null) {
      this.campaignSearchFilter = searchFilter;
      this.IsActive = this.campaignSearchFilter.IsActive;
      this.pagingParams.rating = this.campaignSearchFilter.rating;
      this.showStarred = this.campaignSearchFilter.showStarred;
    }
    this.lastCampaignSearchFilter = JSON.parse(JSON.stringify(this.campaignSearchFilter));
  }

  private subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        filter(res => res.length >= 0 || res == null || res === ''),
        debounceTime(1000)
      ).subscribe((val) => {
        this.campaignSearchFilter.searchText = val;
        // reset
        this.pagingParams.pageNo = 1;
        this.fetchCampaigns();
      });
  }

  private getCampaigns(pagingParams: CampaignPagingParams): void {
    this._commonHelper.showLoader();
    this.pagingParams.searchString = this.campaignSearchFilter.searchText;
    this.pagingParams.rating = this.campaignSearchFilter.rating;
    this.pagingParams.showStarred = this.campaignSearchFilter.showStarred;
    // this.pagingParams.status = this.campaignSearchFilter.status;

    this.pagingParams.IsActive = !this.campaignSearchFilter.IsActive;

    this.pagingParams.createdStartDate = this.campaignSearchFilter.createdStartDate;
    this.pagingParams.createdEndDate = this.campaignSearchFilter.createdEndDate;
    this._campaignsService.getAllCampaigns(pagingParams).then((response: any[]) => {
        this._commonHelper.hideLoader();
        if (response) {
          this.campaigns = response;
          this.totalRecords = this.campaigns.length > 0 ? this.campaigns[0].totalRecords : 0;
          this.pTable.rows = this.pagingParams.pageSize;
          this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
          this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
          this.start = this.end == this.totalRecords ? (this.totalRecords - this.campaigns.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
         
          if (this.selectedCampaignsIdForActivityCenter != null && this.selectedCampaignsIdForActivityCenter > 0 && this.campaigns.some(x => x.id == this.selectedCampaignsIdForActivityCenter)) {
            this.updateEntityDetails(true, this.campaigns.find(x => x.id == this.selectedCampaignsIdForActivityCenter));
          }
          else {
            this.resetSelectedEntity();
          }

          this._fileSignedUrlService.getFileSingedUrl(this.campaigns, 'createdByImagePath', 'createdBySignedUrl', Entity.Users);
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_CampaignsKey, JSON.stringify(this.campaignSearchFilter), this.localStorageKeyPrefix);
    }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

  //Export Campaigns Listing

  exportExcel(){
    this.exportCampaigns(ExportType.Excel, FileExtension.Excel, DownloadFileMimeType.Excel);
  }

  exportCampaigns(exportType: string, fileExtension: string, fileMimeType: string){
    this._commonHelper.showLoader();

    const excelExportPayload = {

      searchString: this.pagingParams.searchString,
      // status:this.pagingParams.status,
      IsActive:this.pagingParams.IsActive,
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
  
    let fileName = this._commonHelper.getConfiguredEntityName('{{Campaigns_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.ALLLISTING.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format(this._commonHelper.globalDownloadFileDateFormatWithTime)}`;
    excelExportPayload.dynamicColumnSettingJson = this.dynamicColumnNameSetting ? JSON.stringify(this.dynamicColumnNameSetting) : "";

    this._campaignsService.exportCampaigns(excelExportPayload).then((base64String: any) => {
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
      entityIcon: 'fas fa-bullhorn',
      entityName: this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.DETAIL.TITLE'),
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
    this.campaginCreatedBy = rowData?.createdBy;

    this.selectedCampaignsForActivityCenter = rowData;
    this.selectedCampaignsIdForActivityCenter = rowData.id;
    this.selectedCampaignsIsActive = rowData.isActive;

    // get set quickview local storage config start
    this.quickViewConfig = {
      selectedRowEntityId: this.selectedRowId
    }
    
    if(isShowActivityCenter != null){
      this.quickViewConfig.isQuickViewOpen = isShowActivityCenter;
    }

    this.onMoreDetailsClick(isShowActivityCenter && this.isViewCampaign);
  }

  advanceFilterVisibleChange(value: boolean) {
    this.isAdvanceFilterVisible = value;
  }

  // Set row item selection and quick view status 
  setQuickViewConfig() {
    if (this.quickViewConfig) {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Campaigns_List_SelectedItem, JSON.stringify(this.quickViewConfig));
    }
  }

  // Get row item selection and quick view status 
  getQuickViewConfig() {
    let dataJsonStr = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Campaigns_List_SelectedItem);
    return dataJsonStr ? JSON.parse(dataJsonStr) : null;
  }

  private updateEntityDetails(isFromList: boolean, details: any = null) {
    if (details != null) {
      details.entityWorkflowId = this.entityWorkflowId;
      if (!isFromList) {
        this.isShowActivityCenter = this.quickViewConfig.isQuickViewOpen && this.isViewCampaign;
        this.selectedCampaignsIdForActivityCenter = details.id;
        this.selectedCampaignsForActivityCenter = this._commonHelper.cloningObject(details);
        this.selectedCampaignsIsActive = details.isActive;
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
    this.selectedCampaignsForActivityCenter = null;
    this.selectedCampaignsIdForActivityCenter = 0;
    this.selectedCampaignsIsActive = null;
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

    this._campaignsService.updateCampaignField(params).then((response) => {
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
