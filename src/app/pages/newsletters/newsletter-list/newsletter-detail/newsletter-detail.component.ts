import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { DataSources, Entity, LocalStorageKey, PublicTenantSettings, ReferenceType, RefType, TabLayoutType } from '../../../../@core/enum';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { NewslettersService } from '../../newsletters.service';
import { CampaignsService } from '../../../campaigns/campaigns.service';
import * as moment from 'moment';
import { SettingsService } from '../../../settings/settings.service';
import { CommonService } from '../../../../@core/sharedServices/common.service';
import { DynamicTableParameter } from '../../../../@core/sharedModels/dynamic-table.model';
import { Dropdown } from 'primeng/dropdown';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { TimeFramePipe } from '../../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { timeFrameValidator } from '../../../../@core/sharedValidators/time-frame.validator';
import { TimeFrameToMinutesPipe } from '../../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';

@Component({
  selector: 'ngx-newsletter-detail',
  templateUrl: './newsletter-detail.component.html',
  styleUrls: ['./newsletter-detail.component.scss']
})
export class NewsletterDetailComponent implements OnInit {
  private newsletterTxtNameRef: ElementRef;
  @ViewChild('newsletterTxtName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.newsletterTxtNameRef = content;
    }
  }
  @ViewChild('relatedCampaignDrp', { static: false }) relatedCampaignDrpRef: Dropdown;

  entityTypeId: number = Entity.Newsletters;
  newsletterId: number;
  entityRecordTypeId: number;
  newsletterName: String = '';

  newsletter: any;
  copyOfNewsletter: any;
  copyOfNewsletterFormValues: any;
  newsletterCustomFields: any[] = [];

  formDataJSON: any[] = [];
  selectedTab: string = '';
  newsletterForm: UntypedFormGroup;

  // extra variable
  submitted: boolean = false;
  isLoaded: boolean = false;

  isReadOnly: boolean = true;
  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  refreshRelatedCampaigns: boolean = false;
  refreshCustomFieldDatasource: boolean = false;

  activeTab = '';

  //datasource
  currencySymbol: any = null;
  hoursInDay:number = null;
  availableRelatedCampaigns: any;
  selectedCampaign: any;

  //flags
  onceRelatedCampaignClicked: boolean = false;
  onceStageHistoryClicked: boolean = false;
  onceDocumentClicked: boolean = false;

  //dynamic table params
  tbRelatedCampaignsParams: Array<DynamicTableParameter> = [];

   //Related Campaigns Loader
   isShowAvailableRelatedCampaignsLoader: boolean = false;

  // ref types
  newsletterTokens: ReferenceType[] = null;

  // permissions
  hasPermission: boolean = false;
  isViewNewsletter: boolean = false;
  isAddNewsletter: boolean = false;
  isEditNewsletter: boolean = false;
  isDeleteNewsletter: boolean = false;
  isDocumentDownloadPermission: boolean = false;

  isInitialLoading: boolean = true;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  newsletterValidationMessages = {
    name: [
      { type: 'required', message: 'CRM.NEWSLETTER.DETAIL.TAB_DETAILS.MESSAGE_NAMEREQUIRED' },
      { type: 'minlength', message: 'CRM.NEWSLETTER.DETAIL.TAB_DETAILS.MESSAGE_NAME_MIN' },
      { type: 'maxlength', message: 'CRM.NEWSLETTER.DETAIL.TAB_DETAILS.MESSAGE_NAME_MAX' }
    ],
    description: [
      { type: 'maxlength', message: 'CRM.NEWSLETTER.DETAIL.TAB_DETAILS.MESSAGE_DESCRIPTION_MAX' },
      { type: 'minlength', message: 'CRM.NEWSLETTER.DETAIL.TAB_DETAILS.MESSAGE_DESCRIPTION_MIN' }
    ],
    title: [
      { type: 'maxlength', message: 'CRM.NEWSLETTER.DETAIL.TAB_DETAILS.MESSAGE_TITLE_MAX' }
    ],
    bodyText: [],
    tokens: []
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

  tinyMcaConfig: any = {}

  refreshCustomFieldJSONGrid: boolean = false;

  countries: any;
  refreshDocument: boolean = false;

  constructor(
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _newslettersService: NewslettersService,
    private _campaignService: CampaignsService,
    private _settingsService: SettingsService,
    private _commonService: CommonService,
    private _dataSourceService: DatasourceService,
    private _location: Location,
    private _confirmationDialogService: ConfirmationDialogService) {
    Promise.all([
      this.getTabLayoutTenantSetting()
    ]).then(() => {
      this.setTabLayout();
    });
    this.isViewNewsletter = this._commonHelper.havePermission(enumPermissions.ViewNewsletter);
    this.isAddNewsletter = this._commonHelper.havePermission(enumPermissions.AddNewsletter);
    this.isEditNewsletter = this._commonHelper.havePermission(enumPermissions.EditNewsletter);
    this.isDeleteNewsletter = this._commonHelper.havePermission(enumPermissions.DeleteNewsletter);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadNewsletterDocument);

    this.hasPermission = this.isViewNewsletter || this.isEditNewsletter;

    this.readRouteParameter();
  }

  ngOnInit(): void {
    // get details
    if (this.isViewNewsletter) {
      this.setRelatedCampaignsTabParameters();

      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getTokensFromReferenceType(),
        this.getCountries()
      ]).then(() => { this.getNewsletterCustomFields(); });
    }
  }

  //#region Events
  get newsletterfrm() { return this.newsletterForm.controls; }

  backToList(): void {
    this._location.back();
  }

  showHideDetailTab(frmMode: string) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.newsletterForm.invalid) {
        this.validateAllFormFields(this.newsletterForm);
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
      this.newsletter = this._commonHelper.deepClone(this.copyOfNewsletter);
      
      if(this.newsletter.customFieldJSONData && this.newsletter.customFieldJSONData !== null && this.newsletter.customFieldJSONData !== '' && this.newsletter.customFieldJSONData !== undefined) {
        this.newsletterCustomFields.forEach((field: any) => {
          if(field.fieldType == 'Date') {
            if (this.newsletter.customFieldJSONData[field.fieldName] && this.newsletter.customFieldJSONData[field.fieldName] != null && this.newsletter.customFieldJSONData[field.fieldName] != '' && this.newsletter.customFieldJSONData[field.fieldName] != undefined) {
              this.newsletter.customFieldJSONData[field.fieldName] = moment(new Date(this.newsletter.customFieldJSONData[field.fieldName])).toDate();
            }
          }else if (field.fieldType == 'JSON Grid') {
            if (this.newsletter.customFieldJSONData[field.fieldName] && this.newsletter.customFieldJSONData[field.fieldName] != null && this.newsletter.customFieldJSONData[field.fieldName] != '' && this.newsletter.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.newsletter.customFieldJSONData[field.fieldName] === 'string') {
                this.newsletter.customFieldJSONData[field.fieldName] = JSON.parse(this.newsletter.customFieldJSONData[field.fieldName]);
              }
            }else {
              this.newsletterForm.removeControl(field.fieldName)
            }
          } else if (String(field.fieldType).toLowerCase() === 'duration') {
            if (typeof this.newsletter.customFieldJSONData[field.fieldName] === 'number' || this.newsletter.customFieldJSONData[field.fieldName] == null) {
              this.newsletter.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.newsletter.customFieldJSONData[field.fieldName], this.hoursInDay);
            }
          } 
        });
      }
      
      this.newsletterForm.reset(this.copyOfNewsletterFormValues);
      this.refreshJSONGridData()
      this.isReadOnly = !this.isReadOnly
      this.submitted = false;
    }
    else if (frmMode === 'EDIT' && this.isReadOnly) {
      setTimeout(() => { this.newsletterTxtNameRef.nativeElement.focus(); });
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

    if (!this.onceRelatedCampaignClicked && this.activeTab == 'navRelatedCampaigns') {
      this.getCampaignsForRelatedCampaigns('');
      this.onceRelatedCampaignClicked = true;
    }

    if((!this.onceStageHistoryClicked && this.activeTab == 'navHistory')) {
      this.onceStageHistoryClicked = true;
    }

    if (this.activeTab == 'navDocuments' && !this.onceDocumentClicked) {
      this.onceDocumentClicked = true;
    }
  }

  refreshChildComponent(componentName: string) {
    switch (componentName) {
      case "RelatedCampaigns": {
        this.refreshRelatedCampaigns = false;
        break;
      }
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
    if (!this.isEditNewsletter) {
      return
    }

    let messageText = this.newsletter.isActive ? 'CRM.NEWSLETTER.DETAIL.MESSAGE_CONFIRM_INACTIVE' : 'CRM.NEWSLETTER.DETAIL.MESSAGE_CONFIRM_ACTIVE';
    let successText = this.newsletter.isActive ? 'CRM.NEWSLETTER.DETAIL.MESSAGE_NEWSLETTER_INACTIVATED' : 'CRM.NEWSLETTER.DETAIL.MESSAGE_NEWSLETTER_ACTIVATED';

    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        let params = { id: this.newsletter.id, isActive: !this.newsletter.isActive };
        this._newslettersService.updateNewsletterIsActive(params).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
          }
          this.getNewsletterDetail()
          this.isReadOnly = true;
          this._commonHelper.hideLoader();
        }, (error) => {
          this.getNewsletterDetail()
          this.isReadOnly = true;
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
    });
  }

  relatedCampaignsOnFilter(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getCampaignsForRelatedCampaigns(e.filter.trim());
      }
    }
    else {
      this.getCampaignsForRelatedCampaigns('');
    }
  }

  relatedCampaignsOnChange(e) {
    let param = {
      CampaignID: e.value,
      NewsletterID: this.newsletter.id
    }
    this._commonHelper.showLoader();
    this._campaignService.saveCampaignNewsletter(param).then(response => {
      this.refreshRelatedCampaigns = true;
      this.relatedCampaignDrpRef.resetFilter();
      this.getCampaignsForRelatedCampaigns('');
      this.selectedCampaign = null;
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.DETAIL.TAB_RELATEDCAMPAIGN.MESSAGE_ADD_RELATEDCAMPAIGN_SUCCESS'));
    }, (error) => {
      this.relatedCampaignDrpRef.resetFilter();
      this.getCampaignsForRelatedCampaigns('');
      this.selectedCampaign = null;
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  deleteRelatedCampaign(id: any) {
    this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.DETAIL.TAB_RELATEDCAMPAIGN.DELETE_RELATEDCAMPAIGN_DIALOG_TEXT'), null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._campaignService.deleteCampaignNewsletter(id).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.DETAIL.TAB_RELATEDCAMPAIGN.MESSAGE_DELETE_RELATEDCAMPAIGN_SUCCESS'));
            this.refreshRelatedCampaigns = true;
            this.relatedCampaignDrpRef.resetFilter();
            this.getCampaignsForRelatedCampaigns('');
          }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
        }
      });
  }
  
  //#region Private methids
  private readRouteParameter(): void {
    this._activeRoute.params.subscribe(param => {
      let id = param['id'];
      if (id && !isNaN(Number(id)) && Number(id) > 0) {
        this.newsletterId = Number(id);
      } else {
        this._router.navigate(['newsletters', 'list']);
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

  private setRelatedCampaignsTabParameters(): void {
    this.tbRelatedCampaignsParams = [{
      name: 'NewsletterID',
      type: 'int',
      value: this.newsletterId
    }]
  }

  private initiateTinyMca() {
    this.tinyMcaConfig = {
      height: 500,
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'preview', 'anchor', 'searchreplace', 'insertdatetime', 'media', 'table', 'wordcount', 'code'
      ],
      toolbar: 'menuTokenButton | undo redo | casechange blocks | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist checklist outdent indent | removeformat | code',
      setup: (editor) => {
        editor.ui.registry.addMenuButton('menuTokenButton', {
          text: this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.DETAIL.TAB_CONTENTS.TINYMCA_TOKEN_MENU'),
          fetch: (callback) => {
            let items: any[] = [];
            this.newsletterTokens.forEach(x => {
              items.push({
                type: 'menuitem',
                text: x.strValue1,
                onAction: (_) => editor.insertContent('{{' + x.strValue1 + '}}')
              })
            });
            callback(items);
          }
        });
      }
    }
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
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_Newsletters));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_Newsletters, JSON.stringify(response));
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

  private prepareParamsForCampaignsDropdown(searchString: any) {
    const params = [];
    const paramItem = {
      name: 'NewsletterID',
      type: 'int',
      value: this.newsletter.id,
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

  private getCampaignsForRelatedCampaigns(searchString: any) {
    this.isShowAvailableRelatedCampaignsLoader = true;
    let params = this.prepareParamsForCampaignsDropdown(searchString);
    // get datasource details
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ADDCAMPAIGNSNEWSLETTER, params).then(response => {
      this.availableRelatedCampaigns = response;
      this.relatedCampaignDrpRef.resetFilter();
      this.isShowAvailableRelatedCampaignsLoader = false;
    },
      (error) => {
        this.isShowAvailableRelatedCampaignsLoader = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  private getTokensFromReferenceType() {
    return new Promise((resolve, reject) => {
      let params = { refType:  RefType.NewsletterToken};
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.NewsletterToken}`;
      // get data
      const refTypeNewsletterTokens = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeNewsletterTokens == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.newsletterTokens = response as ReferenceType[];
            this.initiateTinyMca();
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.newsletterTokens));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
      }
      else {
        this.newsletterTokens = refTypeNewsletterTokens;
        this.initiateTinyMca();
        resolve(null);
      }
    });
  }

  private getNewsletterCustomFields(): void {
    this._commonHelper.showLoader();
    this._newslettersService.getNewsletterCustomFields(this.entityTypeId, this.newsletterId)
      .then((response: any) => {
        if (response) {
          this.newsletterCustomFields = response || [];
          this.prepareFormDataInJSON();
          this.getNewsletterDetail();
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
    this.newsletterCustomFields.forEach((customField: any) => {
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

  private getNewsletterDetail() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      let params = { id: this.newsletterId };
      this._newslettersService.getNewsletterByID(params).then((response: any) => {
        if (response) {
          this.setNewsletterDetails(response || {});
          this.newsletterForm = this.createNewsletterDetailForm();
          this.prepareFormCustomFields();
          // prepare tab with order
          this.setDefaultNavTabs();
          this.prepareTabsWithOrder();
          this.copyOfNewsletterFormValues = this.newsletterForm.value;
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

  private createNewsletterDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.newsletterId],
      name: [this.newsletter.name, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
      description: [this.newsletter.description, Validators.compose([Validators.minLength(2), Validators.maxLength(2000)])],
      bodyText: [this.newsletter.bodyText],
      title: [this.newsletter.title, Validators.compose([Validators.maxLength(200)])],
    });
  }

  private prepareFormCustomFields(): void {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.newsletter.customFieldJSONData[control.fieldName] != null && this.newsletter.customFieldJSONData[control.fieldName] != '') {
              this.newsletter.customFieldJSONData[control.fieldName] = moment(new Date(this.newsletter.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
              this.newsletterForm.addControl(control.fieldName, new UntypedFormControl(this.newsletter.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.newsletterForm.addControl(control.fieldName, new UntypedFormControl(this.newsletter.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.newsletter.customFieldJSONData[control.fieldName] != null && this.newsletter.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.newsletter.customFieldJSONData[control.fieldName] === 'string') {
                this.newsletter.customFieldJSONData[control.fieldName] = JSON.parse(this.newsletter.customFieldJSONData[control.fieldName]);
              }
            } else {
              this.newsletter.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.newsletter.customFieldJSONData[control.fieldName] != null && this.newsletter.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.newsletter.customFieldJSONData[control.fieldName];
              this.newsletter.customFieldJSONData[control.fieldName] = this.newsletter.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON.hasOwnProperty('isRequired') && control.settingsJSON['isRequired']) {
                this.newsletterForm.addControl(control.fieldName, new UntypedFormControl(this.newsletter.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.newsletterForm.addControl(control.fieldName, new UntypedFormControl(this.newsletter.customFieldJSONData[control.fieldName]));
              }
              this.newsletter.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.newsletterForm.addControl(control.fieldName, new UntypedFormControl(this.newsletter.customFieldJSONData[control.fieldName]));
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
                  this.newsletterForm.controls[control.fieldName].setValidators(validatorFn);
                  this.newsletterForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.newsletter.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.newsletter.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.newsletterForm.addControl(control.fieldName, new UntypedFormControl(this.newsletter.customFieldJSONData[control.fieldName]));
              this.newsletterForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.newsletterForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.newsletterForm.addControl(control.fieldName, new UntypedFormControl(this.newsletter.customFieldJSONData[control.fieldName]));
              this.newsletterForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.newsletterForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.newsletterForm.addControl(control.fieldName, new UntypedFormControl(this.newsletter.customFieldJSONData[control.fieldName], Validators.email));
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
              this.newsletterForm.controls[control.fieldName].setValidators(validatorFn);
              this.newsletterForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.newsletterForm.addControl(control.fieldName, new UntypedFormControl(this.newsletter.customFieldJSONData[control.fieldName]));
            if (this.newsletter.customFieldJSONData[control.fieldName] != null && this.newsletter.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.newsletter.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.newsletterForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") } );
              }
            } else {
              this.newsletterForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.newsletterForm.addControl(control.fieldName, new UntypedFormControl(this.newsletter.customFieldJSONData[control.fieldName]));
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
                this.newsletterForm.controls[control.fieldName].setValidators(validatorFn);
                this.newsletterForm.controls[control.fieldName].updateValueAndValidity();
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
      { tabName: '', tabLink: 'navContents', isFirst: false, condition: true, displayOrder: 201 },
      { tabName: '', tabLink: 'navRelatedCampaigns', isFirst: false, condition: true, displayOrder: 301 },
      { tabName: '', tabLink: 'navHistory', isFirst: false, condition: true, displayOrder: 401 },
      { tabName: '', tabLink: 'navDocuments', isFirst: false, condition: true, displayOrder: 501 }
    ];

    this.setNativeTabDetails();

    this.navTabsAll.forEach((f) => {
      (f.isNativeTab = true), (f.isTabAlwaysVisible = false),(f.showCloseTabIconBtn = false),  (f.showButtonActive = false)
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
      if (error.messageCode.toLowerCase() == 'newsletters.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase()));
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

  private setNewsletterDetails(response: any): void {
    this.newsletter = response;
    this.newsletterName = this.newsletter?.name;
    this.newsletter.customFieldJSONData = this._commonHelper.tryParseJson(this.newsletter.customFieldJSONData);
    this.copyOfNewsletter = this._commonHelper.deepClone(this.newsletter);
    this.entityRecordTypeId = this.newsletter?.entityRecordTypeID;
  }

  private getAppliedTokens(): string {
    let tokens: string = '';
    this.newsletter.tokens = '';
    if (this.newsletter.bodyText != null) {
      this.newsletterTokens.forEach(x => {
        if (this.newsletter.bodyText.search('{{' + x.strValue1 + '}}') != -1) {
          tokens += x.strValue1 + ',';
        }
      });
    }

    return tokens.length > 0 ? tokens.substring(0, tokens.length - 1) : null;
  }

  private saveData(): any {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.newsletter.customFieldJSONData) {
        this.newsletterCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.newsletter.customFieldJSONData[field.fieldName] && this.newsletter.customFieldJSONData[field.fieldName] != null && this.newsletter.customFieldJSONData[field.fieldName] != '') {
              this.newsletter.customFieldJSONData[field.fieldName] = moment(this.newsletter.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.newsletterForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.newsletter.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.newsletter.customFieldJSONData[field.fieldName] = null;
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.newsletterForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.newsletter.customFieldJSONData[field.fieldName] = data;
            } else {
              this.newsletter.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }

      this.newsletter.tokens = this.getAppliedTokens();

      let params = this._commonHelper.deepClone(this.newsletter);

      this.newsletterCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.newsletterForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = new TimeFrameToMinutesPipe().transform(formArrayValues, this.hoursInDay);
        }
      });

      this._newslettersService.saveNewsletter(params).then(() => {
        this.getNewsletterDetail().then(() => {
          this.refreshCustomFieldDatasource = true;
          setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          resolve(null)
        });
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.DETAIL.SUCCESS_MESSAGE'));
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error.messageCode.toLowerCase() !== 'staticmessage') {
          this.getNewsletterDetail().then(() => {
            this.refreshCustomFieldDatasource = true;
            setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          });
          resolve(null);
        } else {
          reject(null)
        }
        reject(null)
      });
    })
  }

  private findInvalidControls() {
    const invalid = [];
    const controls = this.newsletterForm.controls;
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

  setRefreshDocument() {
    this.refreshDocument = false;
    setTimeout(() => {
      this.refreshDocument = true;
    }, 500);
  }
  
  // get tenant setting for tab layout
  private getTabLayoutTenantSetting() {
    return new Promise((resolve, reject) => {
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.NEWSLETTER_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.NEWSLETTER_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.NEWSLETTER_TAB_LAYOUT}`, JSON.stringify(response));
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

  onDeleteNewsletterClick(newsletterID) {
    this._confirmationDialogService.confirm('CRM.NEWSLETTER.DETAIL.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._newslettersService.deleteNewsletter(newsletterID).then(() => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.DETAIL.MESSAGE_NEWSLETTER_DELETED')
          ); // Redirect Newsletter Listing Page.
          this._router.navigateByUrl('/newsletters/list');
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
