import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { DataSources, Entity, LocalStorageKey, PublicTenantSettings, TabLayoutType, Week } from '../../../../@core/enum';
import { CampaignsService } from '../../campaigns.service';
import * as moment from 'moment';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { SettingsService } from '../../../settings/settings.service';
import { Dropdown } from 'primeng/dropdown';
import { DynamicTableParameter } from '../../../../@core/sharedModels/dynamic-table.model';
import { Table } from 'primeng/table';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';
import { CommonService } from '../../../../@core/sharedServices/common.service';
import { TimeFrameToMinutesPipe } from '../../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
import { TimeFramePipe } from '../../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { timeFrameValidator } from '../../../../@core/sharedValidators/time-frame.validator';

@Component({
  selector: 'ngx-campaign-detail',
  templateUrl: './campaign-detail.component.html',
  styleUrls: ['./campaign-detail.component.scss']
})
export class CampaignDetailComponent implements OnInit {
  private campaignTxtNameRef: ElementRef;
  @ViewChild('campaignTxtName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.campaignTxtNameRef = content;
    }
  }

  @ViewChild('relatedNewsletterDrpRef', { static: false }) relatedNewsletterDrpRef: Dropdown;
  @ViewChild('relatedNewsletterSearchBoxInput', { static: true }) relatedNewsletterSearchBoxInput: ElementRef;
  @ViewChild('relatedNewsletterTable') private relatedNewsletterTable: Table;

  entityTypeId: number = Entity.Campaigns;
  campaignId: number;
  entityRecordTypeId: number;
  campaignName: String = '';

  campaign: any;
  copyOfCampaign: any;
  copyOfCampaignFormValues: any;
  campaignCustomFields: any[] = [];

  formDataJSON: any[] = [];
  selectedTab: string = '';
  campaignForm: UntypedFormGroup;

  // extra variable
  submitted: boolean = false;
  isLoaded: boolean = false;

  isReadOnly: boolean = true;
  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  refreshCustomFieldDatasource: boolean = false;

  activeTab = '';

  //datasources
  SmtpFromEmails: any[] = [];
  campaignRecipients: any[] = [];
  currencySymbol: any = null;
  hoursInDay:number = null;
  availableNewsletters: any;
  selectedNewsletter: any;
  relatedNewsletters: any[] = [];
  totalRelatedNewsletterRecord: number = 0;

  //Smtp From Emails Loader
  isShowSmtpFromEmailsLoader: boolean = false;
  isForceReloadSmtpFromEmails: boolean = true;

  //Available Newsletters Loader
  isShowAvailableNewslettersLoader: boolean = false;
  
  //Related Newsletters Table Loader
  showRelatedNewslettersTableLoader: boolean = false;

  //Table Column
  relatedNewsletterColumns: any[];
  relatedNewsletterDragEnable: boolean = false;
  reorderedRelatedNewslatters: any[] = [];
  
  // subcriptions
  private relatedNewsletterSearchValueChanged: Subject<string> = new Subject<string>();
  private relatedNewsletterSearchBoxSubscription: Subscription;
  
  //Pagination
  relatedNewsLetterFilterParams = {
    searchString: '',
    sortColumn: '',
    sortOrder: ''
  }

  // permissions
  hasPermission: boolean = false;
  isViewCampaign: boolean = false;
  isAddCampaign: boolean = false;
  isEditCampaign: boolean = false;
  isDeleteCampaign: boolean = false;
  isViewNewsletter: boolean = false;
  isDocumentDownloadPermission: boolean = false;

  isInitialLoading: boolean = true;
  entity = Entity;

  onceRelatedNewsletterClicked: boolean = false;
  onceStageHistoryClicked: boolean = false;
  onceDocumentClicked: boolean = false;

  //dynamic table params
  tbRelatedNewslettersParams: Array<DynamicTableParameter> = [];

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  campaignValidationMessages = {
    name: [
      { type: 'required', message: 'CRM.CAMPAIGN.DETAIL.TAB_DETAILS.MESSAGE_NAMEREQUIRED' },
      { type: 'minlength', message: 'CRM.CAMPAIGN.DETAIL.TAB_DETAILS.MESSAGE_NAME_MIN' },
      { type: 'maxlength', message: 'CRM.CAMPAIGN.DETAIL.TAB_DETAILS.MESSAGE_NAME_MAX' }
    ],
    description: [
      { type: 'maxlength', message: 'CRM.CAMPAIGN.DETAIL.TAB_DETAILS.MESSAGE_DESCRIPTION_MAX' },
      { type: 'minlength', message: 'CRM.CAMPAIGN.DETAIL.TAB_DETAILS.MESSAGE_DESCRIPTION_MIN' }
    ],
    startDate: [
      { type: 'required', message: 'CRM.CAMPAIGN.DETAIL.TAB_DETAILS.MESSAGE_STARTDATE_REQUIRED' },
      { type: 'max', message: 'CRM.CAMPAIGN.DETAIL.TAB_DETAILS.MESSAGE_STARTDATE_MAX' }
    ],
    endDate: [
      { type: 'required', message: 'CRM.CAMPAIGN.DETAIL.TAB_DETAILS.MESSAGE_ENDDATE_REQUIRED' },
      { type: 'min', message: 'CRM.CAMPAIGN.DETAIL.TAB_DETAILS.MESSAGE_ENDDATE_MIN' }
    ],
    fromSMTPSettingID: [
      { type: 'required', message: 'CRM.CAMPAIGN.DETAIL.TAB_DETAILS.MESSAGE_FROM_REQUIRED' }
    ],
    toDatasourceCodes: [
      { type: 'required', message: 'CRM.CAMPAIGN.DETAIL.TAB_DETAILS.MESSAGE_RECIPIENTS_REQUIRED' }
    ],
    scheduleTime: [
      { type: 'required', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_MESSAGE_SCHEDULETIME' }
    ],
    day: [
      { type: 'required', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_DAY_REQUIRED' },
      { type: 'min', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_MIN_MAX_VALUE' },
      { type: 'max', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_MIN_MAX_VALUE' }
    ],
    week: [
      { type: 'required', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_WEEK_REQUIRED' },
      { type: 'min', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_WEEK_MIN_MAX_VALUE' },
      { type: 'max', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_WEEK_MIN_MAX_VALUE' }
    ],
    monthDay: [
      { type: 'required', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_MONTH_DAY_REQUIRED' },
      { type: 'pattern', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_MONTH_DAY_PATTERN' },
    ],
    month: [
      { type: 'required', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_MONTH_MONTH_REQUIRED' },
      { type: 'min', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_MONTH_MONTH_MIN_MAX_VALUE' },
      { type: 'max', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_MONTH_MONTH_MIN_MAX_VALUE' }
    ],
    maxNoOfOccurrence: [
      { type: 'min', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_MIN_MAX_VALUE' },
      { type: 'max', message: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.ERROR_MIN_MAX_VALUE' }
    ]
  }

  //navTabs
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

  recurrence_pattern: string = '';
  every_day_type: string = '' ;
  
  schedulePattern: string = '';
  timeString: string = '';
  day: any = null;
  week: any = null;
  monthDay: any = null;
  month: any = null;
  
  weekdays : any[] = [];
  isAnyWeekDaySelected: boolean = true;
  isAnyMonthlyDaysRepeat: boolean = false;

  refreshCustomFieldJSONGrid: boolean = false;

  countries: any;
  refreshDocument: boolean = false;

  constructor(
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _campaignService: CampaignsService,
    private _settingsService: SettingsService,
    private _dataSourceService: DatasourceService,
    private _location: Location,
    private _commonService: CommonService,
    private _confirmationDialogService: ConfirmationDialogService) {
    this.isViewCampaign = this._commonHelper.havePermission(enumPermissions.ViewCampaign);
    this.isAddCampaign = this._commonHelper.havePermission(enumPermissions.AddCampaign);
    this.isEditCampaign = this._commonHelper.havePermission(enumPermissions.EditCampaign);
    this.isDeleteCampaign = this._commonHelper.havePermission(enumPermissions.DeleteCampaign);
    this.isViewNewsletter = this._commonHelper.havePermission(enumPermissions.ViewNewsletter);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadCampaignDocument);

    this.hasPermission = this.isViewCampaign || this.isEditCampaign;

    this.readRouteParameter();    

    Promise.all([
      this.getTabLayoutTenantSetting()
    ]).then(() => {
      this.setTabLayout();
    });
  }

  ngOnInit(): void {
    // get details
    if (this.isViewCampaign) {
      this.fillWeeks();
      this.setRelatedNewslettersTabParameters();
      this.setRelatedNewsletterColumnDefinations();
      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getCampaignRecipients(),
        this.getCountries()
      ]).then(() => {
         this.getCampaignCustomFields(); 
      });
    }
  }
  
  //#region Events
  get campaignfrm() { return this.campaignForm.controls; }

  backToList(): void {
    this._location.back();
  }

  showHideDetailTab(frmMode: string) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.campaignForm.invalid) {
        this.validateAllFormFields(this.campaignForm);
        this.navigateToTabByValidation();
        return;
      }

      //Recurrence pattern custom validation
      if (!this.recurrence_pattern || this.recurrence_pattern == '') {
        this.navigateToTabByValidation();
        return;
      }

      //Daily custom validation 
      if (this.recurrence_pattern == 'Daily' && (!this.every_day_type || this.every_day_type == '')) {
        this.navigateToTabByValidation();
        return;
      }
      
      //weekly custom validation
      this.isAnyWeekDaySelected = this.weekdays.filter(x=>x.isSelected==true).length > 0 ? true : false;
      if(!this.isAnyWeekDaySelected && this.recurrence_pattern=='Weekly'){
        this.navigateToTabByValidation();
        return;
      }

      //monthly custom validation
      this.isMonthlyDaysRepeat();
      if(this.isAnyMonthlyDaysRepeat && this.recurrence_pattern=='Monthly'){
        this.navigateToTabByValidation();
        return;
      }
      

      this.refreshActivity = true;
      Promise.all([
        this.saveData()
      ]).then(() => {
        this.isReadOnly = !this.isReadOnly;
        this.submitted = false;
      })
    }
    else if (frmMode === 'CANCEL') {
      this.campaign = this._commonHelper.deepClone(this.copyOfCampaign);
      
      if(this.campaign.customFieldJSONData && this.campaign.customFieldJSONData !== null && this.campaign.customFieldJSONData !== '' && this.campaign.customFieldJSONData !== undefined) {
        this.campaignCustomFields.forEach((field: any) => {
          if(field.fieldType == 'Date') {
            if (this.campaign.customFieldJSONData[field.fieldName] && this.campaign.customFieldJSONData[field.fieldName] != null && this.campaign.customFieldJSONData[field.fieldName] != '' && this.campaign.customFieldJSONData[field.fieldName] != undefined) {
              this.campaign.customFieldJSONData[field.fieldName] = moment(new Date(this.campaign.customFieldJSONData[field.fieldName])).toDate();
            }
          }else if (field.fieldType == 'JSON Grid') {
            if (this.campaign.customFieldJSONData[field.fieldName] && this.campaign.customFieldJSONData[field.fieldName] != null && this.campaign.customFieldJSONData[field.fieldName] != '' && this.campaign.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.campaign.customFieldJSONData[field.fieldName] === 'string') {
                this.campaign.customFieldJSONData[field.fieldName] = JSON.parse(this.campaign.customFieldJSONData[field.fieldName]);
              }
            }else {
              this.campaignForm.removeControl(field.fieldName)
            }
          } else if (String(field.fieldType).toLowerCase() === 'duration') {
            if (typeof this.campaign.customFieldJSONData[field.fieldName] === 'number' || this.campaign.customFieldJSONData[field.fieldName] == null) {
              this.campaign.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.campaign.customFieldJSONData[field.fieldName], this.hoursInDay);
            }
          } 
        });
      }
      
      this.campaignForm.reset(this.copyOfCampaignFormValues);
      this.refreshJSONGridData()
      this.resetSchedule();
      this.isReadOnly = !this.isReadOnly;
      this.submitted = false;
    }
    else if (frmMode === 'EDIT' && this.isReadOnly) {
      setTimeout(() => { this.campaignTxtNameRef.nativeElement.focus(); });
      this.bindDropdownData();
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

    if (!this.onceRelatedNewsletterClicked && this.activeTab == 'navRelatedNewsletters') {      
      this.subscribeRelatedNewsletterSearchboxEvent();
      this.getAvailableNewslettersForRelatedNewsletters('');
      this.getRelatedNewsletters();      
      this.onceRelatedNewsletterClicked = true;
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

  onActionChangeStatus() {
    if (!this.isEditCampaign) {
      return
    }

    let messageText = this.campaign.isActive ? 'CRM.CAMPAIGN.DETAIL.MESSAGE_CONFIRM_INACTIVE' : 'CRM.CAMPAIGN.DETAIL.MESSAGE_CONFIRM_ACTIVE';
    let successText = this.campaign.isActive ? 'CRM.CAMPAIGN.DETAIL.MESSAGE_CAMPAIGN_INACTIVATED' : 'CRM.CAMPAIGN.DETAIL.MESSAGE_CAMPAIGN_ACTIVATED';

    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        let params = { id: this.campaign.id, isActive: !this.campaign.isActive };
        this._campaignService.updateCampaignIsActive(params).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
          }
          this.reorderedRelatedNewslatters = [];
          this.relatedNewsletterDragEnable = false;
          this.getCampaignDetail();
          this.getRelatedNewsletters();
          this.isReadOnly = true;
          this._commonHelper.hideLoader();
        }, (error) => {
          this.reorderedRelatedNewslatters = [];
          this.relatedNewsletterDragEnable = false;
          this.getCampaignDetail();
          this.getRelatedNewsletters();
          this.isReadOnly = true;
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
    });
  }

  relatedNewslettersOnFilter(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getAvailableNewslettersForRelatedNewsletters(e.filter.trim());
      }
    }
    else {
      this.getAvailableNewslettersForRelatedNewsletters('');
    }
  }

  relatedNewslettersOnChange(e) {
    let param = {
      CampaignID: this.campaignId,
      NewsletterID: e.value
    }
    this._commonHelper.showLoader();
    this._campaignService.saveCampaignNewsletter(param).then(response => {
      this.relatedNewsletterDrpRef.resetFilter();
      this.relatedNewsLetterFilterParams.searchString = "";
      this.getAvailableNewslettersForRelatedNewsletters('');
      this.getRelatedNewsletters();
      this.selectedNewsletter = null;
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.DETAIL.TAB_RELATEDNEWSLETTER.MESSAGE_ADD_RELATEDNEWSLETTER_SUCCESS'));
    }, (error) => {
      this.relatedNewsletterDrpRef.resetFilter();
      this.getAvailableNewslettersForRelatedNewsletters('');
      this.getRelatedNewsletters();
      this.selectedNewsletter = null;
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  deleteRelatedNewsletter(id: any) {
    this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.DETAIL.TAB_RELATEDNEWSLETTER.DELETE_RELATEDNEWSLETTER_DIALOG_TEXT'), null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._campaignService.deleteCampaignNewsletter(id).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.DETAIL.TAB_RELATEDNEWSLETTER.MESSAGE_DELETE_RELATEDNEWSLETTER_SUCCESS'));
            this.relatedNewsletterDrpRef.resetFilter();
            this.getAvailableNewslettersForRelatedNewsletters('');
            this.relatedNewsLetterFilterParams.searchString = "";
            this.getRelatedNewsletters();
          }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
        }
      });
  }

  changeOrder(column: any): void {
    if (column.sort) {
      if (this.relatedNewsletterTable.sortOrder == 1) {
        this.relatedNewsLetterFilterParams.sortOrder = "ASC";
      }
      else {
        this.relatedNewsLetterFilterParams.sortOrder = "DESC";
      }
      this.relatedNewsLetterFilterParams.sortColumn = this.relatedNewsletterTable.sortField;
      this.getRelatedNewsletters();
    }
  }

  onNewsletterNameClick(id) {
    // check logged in user have permission to view user details
    if (!this.isViewNewsletter) {
      return;
    }

    // if not undefined then redirect
    if ((+id || 0) > 0) {
      this._router.navigateByUrl('/newsletters/details/' + id);
    }
  }

  search(val: string): void {
    this.relatedNewsletterSearchValueChanged.next(val || '');
  }

  onRowReorderForRelatedNewsletter(event) {
    const { dragIndex, dropIndex } = event
    if (dragIndex != dropIndex) {
      if (this.relatedNewsletterTable.value && this.relatedNewsletterTable.value.length > 0) {
        this.relatedNewsletterTable.value.forEach((item, index) => {
          this.reorderedRelatedNewslatters.push({ id: item.id, displayOrder: (index + 1) });
        });
      }
    }
  }

  onDragToggle(){
    this.relatedNewsletterDragEnable = true;
  }

  onDragSave() {
    if (this.reorderedRelatedNewslatters.length > 0) {
      Promise.all([
        this.changeCampaignNewsletterDisplayOrder(this.reorderedRelatedNewslatters)
      ]).then(() => {
        this.getRelatedNewsletters();
        this.reorderedRelatedNewslatters = [];
        this.relatedNewsletterDragEnable = false;
      });
    }
    else {
      this.relatedNewsletterDragEnable = false;
    }
  }

  onDragCancle() {
    if (this.reorderedRelatedNewslatters.length > 0) {
      this.reorderedRelatedNewslatters = [];
      this.getRelatedNewsletters();
    }

    this.relatedNewsletterDragEnable = false;
    setTimeout(() => { 
      this.relatedNewsletterDrpRef.resetFilter(); 
      this.getAvailableNewslettersForRelatedNewsletters('');
    }, 50);
  }

  //allow only 3 characters in total
  textEventHandlerFor3Char(event) {
    return (event.charCode != 8 && event.charCode == 0 || (event.charCode >= 48 && event.charCode <= 57) && event.target.value.length < 3);
  }

  //allow only 2 characters in total
  textEventHandlerFor2Char(event) {
    return (event.charCode != 8 && event.charCode == 0 || (event.charCode >= 48 && event.charCode <= 57) && event.target.value.length < 2);
  }

  //allow only comma seperated numbers less then 31
  textCommaSperatedNumberEventHandler(event){
    if(event.charCode != 8 && (event.charCode == 44 || event.charCode == 0) || (event.charCode >= 48 && event.charCode <= 57) ){
      //Prevent Last comma
      if((event.target.value.substr(event.target.selectionStart-1,1) == ',' || event.target.value.substr(event.target.selectionStart,1) == ',' || event.target.value.length <= 0) && event.charCode == 44){
        return false;
      }

      return true;
    }
    else{
      return false;
    }
  }

  isMonthlyDaysRepeat(){ 
    if (this.monthDay) {
      const splitValue = this.monthDay.toString().split(',');
      this.isAnyMonthlyDaysRepeat = splitValue.some((val, i) => splitValue.indexOf(val) !== i);
    }
  }

  onDailySubOptionChange() {
    if (this.every_day_type == 'Every') {
      if (!this.day || this.day == 0) {
        this.day = null;
        this.campaignForm.patchValue({ 'day': this.day });
      }
      this.setDayControlValidators();
    } else {
      if (!this.campaignForm.get('day').value || this.campaignForm.get('day').value == 0) {
        this.day = null;
        this.campaignForm.patchValue({ 'day': this.day });
      }
      this.removeDayControlValidators();
    }
  }

  onScheduleOptionChange() {
    if (this.recurrence_pattern == 'Daily') {
      if (!this.schedulePattern) {
        this.every_day_type = '';
      }
      this.setDayControlValidators();
      this.removeWeekControlValidators();
      this.removeMonthlyControlValidators();
    } 
    else if (this.recurrence_pattern == 'Weekly') {
      this.setWeekControlValidators();
      this.removeDayControlValidators();
      this.removeMonthlyControlValidators();
    }
    else if (this.recurrence_pattern == 'Monthly') {
      this.setMonthlyControlsValidators();
      this.removeWeekControlValidators();
      this.removeDayControlValidators();
    }
  }

  onWeekDaycheckChange(){
    this.isAnyWeekDaySelected = this.weekdays.filter(x=>x.isSelected==true).length > 0 ? true : false;
  }

  onRecipientsChange(event) {
    const stringValue = event.value.toString()
    this.campaignForm.patchValue({ "toDatasourceCodes": stringValue != '' ? this.campaignRecipients.filter(x => stringValue?.split(',').includes(x.value)).map(y => y.value) : null });
    this.campaign.toDatasourceCodes = this.campaignForm.get('toDatasourceCodes').value?.join(',');
  }

  //#region Private methids
  private readRouteParameter(): void {
    this._activeRoute.params.subscribe(param => {
      let id = param['id'];
      if (id && !isNaN(Number(id)) && Number(id) > 0) {
        this.campaignId = Number(id);
      } else {
        this._router.navigate(['campaigns', 'list']);
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

  private bindDropdownData() {
    if (this.isForceReloadSmtpFromEmails) this.getSMTPFromEmails();
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
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_Campaigns));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_Campaigns, JSON.stringify(response));
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

  private getSMTPFromEmails(){
    return new Promise((resolve, reject) => {
    this.isShowSmtpFromEmailsLoader = true;
    this._dataSourceService.getDataSourceDataByCode(DataSources.SMTPFROMEMAIL).then((response: any) => {
        if (response) {
          this.SmtpFromEmails = response;
        }
        this.isShowSmtpFromEmailsLoader = false;
        resolve(null);
      }, (error) => {
        this.isShowSmtpFromEmailsLoader = false;
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  private getCampaignRecipients(){
    return new Promise((resolve, reject) => {
    this._commonHelper.showLoader();
    this._dataSourceService.getDataSourceDataByCode(DataSources.CAMPAIGNRECIPIENTS).then((response: any) => {
        if (response) {
          this.campaignRecipients = response;
        }
        this._commonHelper.hideLoader();
        resolve(null);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  private getCampaignCustomFields(): void {
    this._commonHelper.showLoader();
    this._campaignService.getCampaignCustomFields(this.entityTypeId, this.campaignId)
      .then((response: any) => {
        if (response) {
          this.campaignCustomFields = response || [];
          this.prepareFormDataInJSON();
          this.getCampaignDetail();
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
    this.campaignCustomFields.forEach((customField: any) => {
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

  private getCampaignDetail() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      let params = { id: this.campaignId };
      this._campaignService.getCampaignByID(params)
        .then((response: any) => {
          if (response) {
            this.setCampaignDetails(response || {});
            this.campaignForm = this.createCampaignDetailForm();
            this.prepareFormCustomFields();
            // prepare tab with order
            this.setDefaultNavTabs();
            this.prepareTabsWithOrder();
            this.evaluateSchedulePattern();
            this.copyOfCampaignFormValues = this.campaignForm.value;
            this.refreshCustomFieldJSONGrid = true;
            setTimeout(() => { this.refreshCustomFieldJSONGrid = false; }, 50);
            this.isLoaded = true;
          }
          else {
            this.isInitialLoading = false;
          }
          resolve(null);
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
  
  private createCampaignDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.campaignId],
      name: [this.campaign.name, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
      description: [this.campaign.description, Validators.compose([Validators.minLength(2), Validators.maxLength(2000)])],
      startDate: [this.campaign.startDate != null ? moment(new Date(this.campaign.startDate)).toDate() : this.campaign.startDate, Validators.compose([Validators.required])],
      endDate: [this.campaign.endDate != null ? moment(new Date(this.campaign.endDate)).toDate() : this.campaign.endDate, Validators.compose([Validators.required])],
      fromSMTPSettingID: [this.campaign.fromSMTPSettingID, Validators.required],
      maxNoOfOccurrence : [this.campaign.maxNoOfOccurrence, Validators.compose([Validators.min(1), Validators.max(999)])],
      scheduleTime: ['', Validators.required],
      isRepeatContentList: [this.campaign.isRepeatContentList],
      toDatasourceCodes: [this.campaignRecipients.filter(x => this.campaign.toDatasourceCodes?.split(',').includes(x.value)).map(y => y.value), Validators.required],
      day: [this.day],
      week: [this.week],
      monthDay: [this.monthDay],
      month: [this.month]
    });
  }

  private prepareFormCustomFields(): void {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.campaign.customFieldJSONData[control.fieldName] != null && this.campaign.customFieldJSONData[control.fieldName] != '') {
              this.campaign.customFieldJSONData[control.fieldName] = moment(new Date(this.campaign.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
              this.campaignForm.addControl(control.fieldName, new UntypedFormControl(this.campaign.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.campaignForm.addControl(control.fieldName, new UntypedFormControl(this.campaign.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.campaign.customFieldJSONData[control.fieldName] != null && this.campaign.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.campaign.customFieldJSONData[control.fieldName] === 'string') {
                this.campaign.customFieldJSONData[control.fieldName] = JSON.parse(this.campaign.customFieldJSONData[control.fieldName]);
              }
            } else {
              this.campaign.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.campaign.customFieldJSONData[control.fieldName] != null && this.campaign.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.campaign.customFieldJSONData[control.fieldName];
              this.campaign.customFieldJSONData[control.fieldName] = this.campaign.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
                this.campaignForm.addControl(control.fieldName, new UntypedFormControl(this.campaign.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.campaignForm.addControl(control.fieldName, new UntypedFormControl(this.campaign.customFieldJSONData[control.fieldName]));
              }
              this.campaign.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.campaignForm.addControl(control.fieldName, new UntypedFormControl(this.campaign.customFieldJSONData[control.fieldName]));
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
                  this.campaignForm.controls[control.fieldName].setValidators(validatorFn);
                  this.campaignForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.campaign.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.campaign.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.campaignForm.addControl(control.fieldName, new UntypedFormControl(this.campaign.customFieldJSONData[control.fieldName]));
              this.campaignForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.campaignForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.campaignForm.addControl(control.fieldName, new UntypedFormControl(this.campaign.customFieldJSONData[control.fieldName]));
              this.campaignForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.campaignForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.campaignForm.addControl(control.fieldName, new UntypedFormControl(this.campaign.customFieldJSONData[control.fieldName], Validators.email));
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
              this.campaignForm.controls[control.fieldName].setValidators(validatorFn);
              this.campaignForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.campaignForm.addControl(control.fieldName, new UntypedFormControl(this.campaign.customFieldJSONData[control.fieldName]));
            if (this.campaign.customFieldJSONData[control.fieldName] != null && this.campaign.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.campaign.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.campaignForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") } );
              }
            } else {
              this.campaignForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.campaignForm.addControl(control.fieldName, new UntypedFormControl(this.campaign.customFieldJSONData[control.fieldName]));
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
                this.campaignForm.controls[control.fieldName].setValidators(validatorFn);
                this.campaignForm.controls[control.fieldName].updateValueAndValidity();
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
      { tabName: '', tabLink: 'navRelatedNewsletters', isFirst: false, condition: true, displayOrder: 301 },
      { tabName: '', tabLink: 'navSchedule', isFirst: false, condition: true, displayOrder: 201 },
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
        showCloseTabIconBtn: true,
        showButtonActive: false
      }

      this.navTabsAll.push(objNavTab);
    });

    this.navTabsAll = this.navTabsAll.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
    this.setTabLayout();
  }

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'campaigns.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase()));
      }
    }
  }

  private validateAllFormFields(formGroup: UntypedFormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }else if (control instanceof UntypedFormArray) {
        control?.controls?.forEach((i: UntypedFormGroup) => {
          this.validateAllFormFields(i);
        })
      }
    });
  }

  private setCampaignDetails(response: any): void {
    this.campaign = response;
    this.campaignName = this.campaign?.name;
    this.campaign.customFieldJSONData = this._commonHelper.tryParseJson(this.campaign.customFieldJSONData);
    this.copyOfCampaign = this._commonHelper.deepClone(this.campaign);
    this.entityRecordTypeId = this.campaign?.entityRecordTypeID;
    this.schedulePattern = this.campaign?.schedulePattern;
  }

  private saveData(): any {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.campaign.customFieldJSONData) {
        this.campaignCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.campaign.customFieldJSONData[field.fieldName] && this.campaign.customFieldJSONData[field.fieldName] != null && this.campaign.customFieldJSONData[field.fieldName] != '') {
              this.campaign.customFieldJSONData[field.fieldName] = moment(this.campaign.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.campaignForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.campaign.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.campaign.customFieldJSONData[field.fieldName] = null;
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.campaignForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.campaign.customFieldJSONData[field.fieldName] = data;
            } else {
              this.campaign.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }

      this.campaign.startDate = this.campaignfrm.startDate.value != null ? moment(this.campaignfrm.startDate.value).format('YYYY-MM-DD') : this.campaignfrm.startDate.value;
      this.campaign.endDate = this.campaignfrm.endDate.value != null ? moment(this.campaignfrm.endDate.value).format('YYYY-MM-DD') : this.campaignfrm.endDate.value;

      this.generateSchedulePattern();
      this.campaign.schedulePattern = this.schedulePattern;

      let params = this._commonHelper.deepClone(this.campaign);
      
      this.campaignCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.campaignForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = new TimeFrameToMinutesPipe().transform(formArrayValues, this.hoursInDay);
        }
      });

      this._campaignService.saveCampaign(params).then(() => {
        this.getCampaignDetail().then(() => {
          this.refreshCustomFieldDatasource = true;
          setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          resolve(null)
        });
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.DETAIL.SUCCESS_MESSAGE'));
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error.messageCode.toLowerCase() !== 'staticmessage') {
          this.getCampaignDetail().then(() => {
            this.refreshCustomFieldDatasource = true;
            setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          });
          resolve(null);
        } else {
          reject(null);
        }
        reject(null)
      });
    })
  }

  private findInvalidControls() {
    const invalid = [];
    const controls = this.campaignForm.controls;
    for (const name in controls) {
      if (controls[name].invalid) {
        invalid.push(name);
      }
    }
    return invalid;
  }

  private navigateToTabByValidation() {
    let findInCustomTab: boolean = false;
    let customTabLink: string = '';
    let inValidControls: any[] = this.findInvalidControls();
    if (inValidControls.length > 0) {
      this.formDataJSON.forEach(tab => {
        customTabLink = tab.tabName.replace(/\s/g, "");
        tab.sections.forEach(section => {
          section.controls.forEach(control => {
            const isControlFind = inValidControls.find(x => x === control.fieldName);
            if (isControlFind) {
              findInCustomTab = true;
              return;
            }
          })
        });
      });
    }

    if (findInCustomTab) {
      document.getElementById('btn_nav' + customTabLink).click();
    } else {
      if ((inValidControls.length > 0 && inValidControls.find(x => x === 'day' || x === 'week' || x === 'month' || x === 'monthDay' || x === 'scheduleTime' || x === 'maxNoOfOccurrence'))
          || (!this.recurrence_pattern || this.recurrence_pattern == '')
          || (this.recurrence_pattern == 'Daily' && (!this.every_day_type || this.every_day_type == ''))) {
        document.getElementById('btn_navSchedule').click();
      } else {
        document.getElementById('btn_navDetails').click();
      }
    }
    
  }

  private prepareParamsForAvailableNewslettersDropdown(searchString: any) {
    const params = [];
    const paramItem = {
      name: 'CampaignID',
      type: 'int',
      value: this.campaignId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem1);

    return params;
  }

  private getAvailableNewslettersForRelatedNewsletters(searchString: any) {
    this.isShowAvailableNewslettersLoader = true;
    let params = this.prepareParamsForAvailableNewslettersDropdown(searchString);
    // get datasource details
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.AVAILABLENEWSLETTERSFORCAMPAIGN, params).then(response => {
      this.availableNewsletters = response;
      this.isShowAvailableNewslettersLoader = false;
    },
      (error) => {
        this.isShowAvailableNewslettersLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  private setRelatedNewslettersTabParameters(): void {
    this.tbRelatedNewslettersParams = [{
      name: 'CampaignID',
      type: 'int',
      value: this.campaignId
    }]
  }

  private prepareParamsForRelatedNewsletterGrid() {
    const params = [];
    const paramItem = {
      name: 'CampaignID',
      type: 'int',
      value: this.campaignId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'SearchString',
      type: 'string',
      value: this.relatedNewsLetterFilterParams.searchString,
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SortColumn',
      type: 'string',
      value: this.relatedNewsLetterFilterParams.sortColumn || "",
    };
    params.push(paramItem2);

    const paramItem3 = {
      name: 'SortOrder',
      type: 'string',
      value: this.relatedNewsLetterFilterParams.sortOrder || "",
    };
    params.push(paramItem3);

    return params;
  }

  private getRelatedNewsletters() {
    this.showRelatedNewslettersTableLoader = true;
    let params = this.prepareParamsForRelatedNewsletterGrid();
    // get datasource details
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.CAMPAIGNRELATEDNEWSLETTERS, params).then((response: any) => {
      this.relatedNewsletters = response ? response as any[] : [];
      
      this.totalRelatedNewsletterRecord = this.relatedNewsletters?.length || 0;
      this.showRelatedNewslettersTableLoader = false;
    },
      (error) => {
        this.showRelatedNewslettersTableLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  private setRelatedNewsletterColumnDefinations(): void {
    this.relatedNewsletterColumns = [
      { field: 'bookmark', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'newsletterName', header: 'CRM.CAMPAIGN.DETAIL.TAB_RELATEDNEWSLETTER.TABLE_HEADER_NAME', sort: false },
      { field: 'sentOn', header: 'CRM.CAMPAIGN.DETAIL.TAB_RELATEDNEWSLETTER.TABLE_HEADER_SENTON', sort: false },
      { field: 'status', header: 'CRM.CAMPAIGN.DETAIL.TAB_RELATEDNEWSLETTER.TABLE_HEADER_STATUS', sort: false, class: "status" },
      { field: 'id', header: '', sort: false, class: "icon--dropdown action" }
    ];

    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.relatedNewsletterColumns.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private subscribeRelatedNewsletterSearchboxEvent(): void {
    this.relatedNewsletterSearchBoxSubscription = this.relatedNewsletterSearchValueChanged
      .pipe(
        map((val: any) => val),
        filter(res => res.length >= 2 || res == null || res === ''),
        debounceTime(1000),
        distinctUntilChanged()
      ).subscribe((val) => {
        this.relatedNewsLetterFilterParams.searchString = val;
        this.getRelatedNewsletters();
      });
  }

  private changeCampaignNewsletterDisplayOrder(data) {
    return new Promise((resolve, reject) => {
      let param = { data }
      this._commonHelper.showLoader();
      this._campaignService.changeCampaignNewsletterDisplayOrder(param).then((response: any) => {
        this._commonHelper.hideLoader();

        if (response && response.isDisplayOrderChanged) {
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.DETAIL.TAB_RELATEDNEWSLETTER.MESSAGE_CHANGE_DISPLAYORDER_RELATEDNEWSLETTER_SUCCESS'));
        }
        resolve(null);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  private fillWeeks() {
    Object.keys(Week).forEach(data => {
      const day = {
        key: 'CRM.CAMPAIGN.DETAIL.TAB_SCHEDULE.WEEK_DAY_' + data.toUpperCase(),
        value : Week[data],
        isSelected : false
      }
      this.weekdays.push(day);
    });
  }

  private generateSchedulePattern() {
    const getTime = new Date(this.campaignForm.get("scheduleTime").value);

    if (this.recurrence_pattern == 'Daily') {
      const day = this.campaignForm.get("day").value;
      if (day && this.every_day_type == 'Every') {
        this.schedulePattern = `${getTime.getMinutes()} ${getTime.getHours()} */${day} * *`
      } else {
        this.schedulePattern = `${getTime.getMinutes()} ${getTime.getHours()} * * *`
      }
    }
    else if (this.recurrence_pattern == 'Weekly') {
      const week = this.campaignForm.get("week").value;
      const selectedWeekDays = this.weekdays.filter(x=>x.isSelected == true).map(x=>x.value).join(',');
      this.schedulePattern = `${getTime.getMinutes()} ${getTime.getHours()} * * ${selectedWeekDays.toString()}/${week}`
    }
    else if (this.recurrence_pattern == 'Monthly') {
      if (this.monthDay) {
        this.monthDay = this.monthDay.split(',').sort((a, b) => (Number(a) > Number(b) ? 1 : -1)).toString()
        this.campaignForm.patchValue({ 'monthDay': String(this.monthDay) });
        const monthDay = this.campaignForm.get("monthDay").value;
        const month = this.campaignForm.get("month").value;
        this.schedulePattern = `${getTime.getMinutes()} ${getTime.getHours()} ${monthDay} */${month} *`
      }
    }
  }

  private evaluateSchedulePattern() {
    if (this.schedulePattern) {
      const patternList = this.schedulePattern.split(' ');
      let minute = Number(patternList[0]);
      let hour = Number(patternList[1]);

      if (hour == 12) {
        this.timeString = `${hour}:${minute == 0 ? '00' : (minute < 10 ? '0' + minute : minute)} PM`;
      } else if (hour >= 12) {
        const temp_hour = hour - 12;
        this.timeString = `${temp_hour}:${minute == 0 ? '00' : (minute < 10 ? '0' + minute : minute)} PM`;
      } else {
        this.timeString = `${hour == 0 ? 12 : hour}:${minute == 0 ? '00' : (minute < 10 ? '0' + minute : minute)} AM`;
      }

      const temp_scheduleTime = new Date(this.campaign.startDate);
      temp_scheduleTime.setHours(hour, minute);
      this.campaignForm.patchValue({ 'scheduleTime': temp_scheduleTime });
      //Daily Section
      if (patternList[4] == '*' && patternList[3] == '*') {
        if (patternList[2] == '*') {
          this.every_day_type = 'Every_Weekday';
          //this.day = 1;
        } else {
          this.every_day_type = 'Every';
          this.day = String(patternList[2]).split('/')[1];
          this.campaignForm.patchValue({ 'day': String(patternList[2]).split('/')[1] });
          this.setDayControlValidators();
        }

        //clear day validators
        this.removeWeekControlValidators();
        this.removeMonthlyControlValidators();
        this.recurrence_pattern = 'Daily';
        this.resetWeekDays();
      }
      //Weekly Section
      else if (patternList[4] != '*') {
        this.week = 1;
        this.week = String(patternList[4]).split('/')[1];
        this.campaignForm.patchValue({ 'week': String(patternList[4]).split('/')[1] });
        this.setWeekControlValidators();

        //reset weekdays
        this.resetWeekDays();

        //select checkboxes
        (String(patternList[4]).split('/')[0]).split(',').forEach(weekDay => {
          this.weekdays.find(x => x.value == weekDay).isSelected = true;  
        });

        //clear day validators
        this.removeDayControlValidators();
        this.removeMonthlyControlValidators();
        this.recurrence_pattern = 'Weekly';
      }
      else
      {
        this.monthDay = String(patternList[2]) || null;
        this.month = String(patternList[3]).split('/')[1] || null;
        this.campaignForm.patchValue({ 'monthDay': this.monthDay });
        this.campaignForm.patchValue({ 'month': this.month });
        this.setMonthlyControlsValidators();
        
        //clear day validators
        this.removeDayControlValidators();
        this.removeWeekControlValidators();
        this.recurrence_pattern = 'Monthly';
        this.resetWeekDays();
      }
    }
    else
    {
      this.recurrence_pattern = '';
      this.every_day_type = '';
      this.resetWeekDays();
    }
  }

  private setDayControlValidators(){
    let validatorFn: ValidatorFn[] = [Validators.min(1), Validators.max(999), Validators.required];
    this.campaignForm.get('day').setValidators(validatorFn);
    this.campaignForm.get('day').updateValueAndValidity();
  }

  private removeDayControlValidators(){
    this.campaignForm.get('day').clearValidators();
    this.campaignForm.get('day').updateValueAndValidity();
  }

  private setWeekControlValidators(){
    let validatorFn: ValidatorFn[] = [Validators.min(1), Validators.max(99), Validators.required];
    this.campaignForm.get('week').setValidators(validatorFn);
    this.campaignForm.get('week').updateValueAndValidity();
  }

  private removeWeekControlValidators(){
    this.campaignForm.get('week').clearValidators();
    this.campaignForm.get('week').updateValueAndValidity();
  }

  private setMonthlyControlsValidators(){
    let validatorFnForMonthDay: ValidatorFn[] = [Validators.required,Validators.pattern("^(([1-9]|1[0-9]|2[0-9]|3[0-1]))(,([1-9]|1[0-9]|2[0-9]|3[0-1]))*$")];
    this.campaignForm.get('monthDay').setValidators(validatorFnForMonthDay);
    this.campaignForm.get('monthDay').updateValueAndValidity();

    let validatorFnForMonth: ValidatorFn[] = [Validators.min(1), Validators.max(99), Validators.required];
    this.campaignForm.get('month').setValidators(validatorFnForMonth);
    this.campaignForm.get('month').updateValueAndValidity();
  }

  private removeMonthlyControlValidators(){
    this.campaignForm.get('monthDay').clearValidators();
    this.campaignForm.get('monthDay').updateValueAndValidity();

    this.campaignForm.get('month').clearValidators();
    this.campaignForm.get('month').updateValueAndValidity();
  }

  private resetWeekDays(){
    Object.keys(this.weekdays).forEach(v => this.weekdays[v].isSelected = false);
  }

  private resetSchedule() {
    this.evaluateSchedulePattern();
  }
  //#endregion
   /**
   * START
   * Moksh Dhameliya 25 May 2023
   * Additional Tabs Code 
   */
   async setTabLayout() {
    //Only configure once time when both are 0 for edit/save resolved issue
    if (this.navTabsAll.length > 0 && (this.nativeTabCount == this.navTabs.length )  ) {
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
      if (this.selectedTab == ''){
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
  closeNavTab(paramTab, isNativeTab) {
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
  getTabLayoutTenantSetting() {
    return new Promise((resolve, reject) => {
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.CAMPAIGN_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CAMPAIGN_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.CAMPAIGN_TAB_LAYOUT}`, JSON.stringify(response));
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

  setRefreshDocument() {
    this.refreshDocument = false;
    setTimeout(() => {
      this.refreshDocument = true;
    }, 500);
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

  onDeleteCampaignClick(campaignID) {
    this._confirmationDialogService.confirm('CRM.CAMPAIGN.DETAIL.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._campaignService.deleteCampaign(campaignID).then(() => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.DETAIL.MESSAGE_CAMPAIGN_DELETED')
          );
          // Redirect Campaign Listing Page.
          this._router.navigateByUrl('/campaigns/list');
        },
          (error: any) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          }
        );
      }
    });
  }
}
