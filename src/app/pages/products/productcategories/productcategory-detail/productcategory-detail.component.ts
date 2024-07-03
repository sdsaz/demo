import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl, ValidatorFn, UntypedFormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { Dropdown } from 'primeng/dropdown';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { Entity, RefType, ReferenceType, DataSources, PublicTenantSettings, TabLayoutType, LocalStorageKey } from '../../../../@core/enum';
import { DynamicTableParameter } from '../../../../@core/sharedModels/dynamic-table.model';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { CommonService } from '../../../../@core/sharedServices/common.service';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { SettingsService } from '../../../settings/settings.service';
import { ProductAddComponent } from '../../product-add/product-add.component';
import { ProductsService } from '../../products.service';
import { timeFrameValidator } from '../../../../@core/sharedValidators/time-frame.validator';
import { TimeFrameToMinutesPipe } from '../../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
import { TimeFramePipe } from '../../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
import { Location } from '@angular/common';

@Component({
  selector: 'ngx-productcategory-detail',
  templateUrl: './productcategory-detail.component.html',
  styleUrls: ['./productcategory-detail.component.scss']
})
export class ProductcategoryDetailComponent implements OnInit {

  private categoryTxtNameRef: ElementRef;
  @ViewChild('categoryTxtName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.categoryTxtNameRef = content;
    }
  }

  @ViewChild('relatedProductDrp', { static: false }) relatedProductDrpRef: Dropdown;

  private modalRef: NgbModalRef | null;
  
  // contact model
  entityTypeId: number = Entity.ProductCategories;
  productCategoryId: number;
  entityRecordTypeId: number = null;

  productCategory: any;
  copyOfProductCategory: any;
  productCategoryForm: UntypedFormGroup;
  copyOfProductCategoryFormValues: any;
  productCategoryCustomFields: any[] = [];

  formDataJSON: any[] = [];
  selectedTab: string = '';

  // extra variable
  submitted: boolean = false;
  isLoaded: boolean = false;
  dcRelatedProductsParameters: Array<DynamicTableParameter> = [];

  isReadOnly: boolean = true;
  refreshActivity: boolean = false;
  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  refreshEntityTag: boolean = false;
  refreshRelatedProducts: boolean = false;
  refreshCustomFieldDatasource: boolean = false;
  onceRelatedProductClicked: boolean = false;
  onceStageHistoryClicked: boolean = false;
  onceDocumentClicked: boolean = false;

  activeTab = '';

  // permissions
  hasPermission: boolean = false;
  isViewProductCategory: boolean = false;
  isEditProductCategory: boolean = false;
  isListProducts: boolean = false;
  isAddProducts: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isDeleteProductCategory: boolean = false;

  isInitialLoading: boolean = true;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //datepicker
  todaysDate = new Date();
  currentYearRange: string = "1901:" + this.todaysDate.getFullYear().toString();

  //datasource
  genders: any = null;
  currencySymbol:any = null;
  hoursInDay:number = null;
  parentCategoryOptions: any = null;
  productsForProductCategory: any;
  selectedProduct: any;

  productCategoryName:string='';
  productCategoryValidationMessages = {
    name: [
      { type: 'required', message: 'PRODUCTCATEGORIES.PRODUCTCATEGORY_NAMEREQUIRED' },
      { type: 'maxlength', message: 'PRODUCTCATEGORIES.PRODUCTCATEGORY_NAMEMAXLENGTH' },
      { type: 'minlength', message: 'PRODUCTCATEGORIES.PRODUCTCATEGORY_NAMEMINLENGTH' }
    ],
    code: [
      { type: 'maxlength', message: 'PRODUCTCATEGORIES.PRODUCTCATEGORY_CODEMAXLENGTH' },
      { type: 'minlength', message: 'PRODUCTCATEGORIES.PRODUCTCATEGORY_CODEMINLENGTH' }
    ],
    description: [
      { type: 'maxlength', message: 'PRODUCTCATEGORIES.PRODUCTCATEGORY_DESCRIPTION_MAXLENGTH' },
      { type: 'minlength', message: 'PRODUCTCATEGORIES.PRODUCTCATEGORY_DESCRIPTION_MINLENGTH' }
    ]
  }

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

  isShowLoaderForProductCategory: boolean;

  refreshCustomFieldJSONGrid: boolean = false;
  
  countries: any;
  refreshDocument: boolean = false;

  constructor(
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _productsService: ProductsService,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService,
    private _commonService: CommonService,
    private _formBuilder: UntypedFormBuilder,
    private _modalService: NgbModal,
    private _location: Location,
    private _confirmationDialogService: ConfirmationDialogService) {
    this.isEditProductCategory = this._commonHelper.havePermission(enumPermissions.EditProductCategory);
    this.isViewProductCategory = this._commonHelper.havePermission(enumPermissions.ViewProductCategory);
    this.isListProducts = this._commonHelper.havePermission(enumPermissions.ListProducts);
    this.isAddProducts = this._commonHelper.havePermission(enumPermissions.AddProduct);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadProductCategoryDocument);
    this.isDeleteProductCategory = this._commonHelper.havePermission(enumPermissions.DeleteProductCategory);

    this.hasPermission = this.isViewProductCategory || this.isEditProductCategory;

    this.readRouteParameter();

    Promise.all([
      this.getTabLayoutTenantSetting()
    ]).then(() => {
      this.setTabLayout();
    });
  }

  ngOnInit(): void {
    this.setRelatedProductsTabParameters();
    // get details
    if (this.isViewProductCategory) {
      Promise.all([
        this.getNativeTabDetailsByEntityTypeId(),
        this.getGenderFromReferenceType(),
        this.getCurrencySymbol(),
        this.getHoursInDay(),
        this.getParentProductCategory(),
        this.getCountries()
      ]).then(() => this.getProductCategoryCustomFields());
    }
  }

  //#region Events
  get productCategoryfrm() { return this.productCategoryForm.controls; }

  backToList(): void {
    this._location.back();
  }

  showHideDetailTab(frmMode: string) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.productCategoryForm.invalid) {
        this.validateAllFormFields(this.productCategoryForm);
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
      this.productCategory = this._commonHelper.deepClone(this.copyOfProductCategory);
      
      if(this.productCategory.customFieldJSONData && this.productCategory.customFieldJSONData !== null && this.productCategory.customFieldJSONData !== '' && this.productCategory.customFieldJSONData !== undefined) {
        this.productCategoryCustomFields.forEach((field: any) => {
          if(field.fieldType == 'Date') {
            if (this.productCategory.customFieldJSONData[field.fieldName] && this.productCategory.customFieldJSONData[field.fieldName] != null && this.productCategory.customFieldJSONData[field.fieldName] != '' && this.productCategory.customFieldJSONData[field.fieldName] != undefined) { 
              this.productCategory.customFieldJSONData[field.fieldName] = moment(new Date(this.productCategory.customFieldJSONData[field.fieldName])).toDate();
            }
          }else if (field.fieldType == 'JSON Grid') {
            if (this.productCategory.customFieldJSONData[field.fieldName] && this.productCategory.customFieldJSONData[field.fieldName] != null && this.productCategory.customFieldJSONData[field.fieldName] != '' && this.productCategory.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.productCategory.customFieldJSONData[field.fieldName] === 'string') {
                this.productCategory.customFieldJSONData[field.fieldName] = JSON.parse(this.productCategory.customFieldJSONData[field.fieldName]);
              }
            }else {
              this.productCategoryForm.removeControl(field.fieldName);
            }
          } else if (String(field.fieldType).toLowerCase() === 'duration') {
            if (typeof this.productCategory.customFieldJSONData[field.fieldName] === 'number' || this.productCategory.customFieldJSONData[field.fieldName] == null) {
              this.productCategory.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.productCategory.customFieldJSONData[field.fieldName], this.hoursInDay);
            }
          }
        })
      }

      this.productCategoryForm.reset(this.copyOfProductCategoryFormValues);
      this.refreshJSONGridData()      
      this.isReadOnly = !this.isReadOnly;
      this.submitted = false;
    }
    else if (frmMode === 'EDIT' && this.isReadOnly) {
      setTimeout(() => { this.categoryTxtNameRef.nativeElement.focus(); });
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
  

  customfieldMultiSelectChange(event, fieldName) {
    const stringValue =  event.value.toString()
    this.productCategory.customFieldJSONData[fieldName] = stringValue != '' ? stringValue : null;
  }

  onActionChangeStatus() {
    if (!this.isEditProductCategory) {
      return
    }

    let messageText = this.productCategory.isActive ? 'PRODUCTCATEGORIES.MESSAGE_CONFIRM_INACTIVE' : 'PRODUCTCATEGORIES.MESSAGE_CONFIRM_ACTIVE';
    let successText = this.productCategory.isActive ? 'PRODUCTCATEGORIES.MESSAGE_CONTACT_INACTIVATED' : 'PRODUCTCATEGORIES.MESSAGE_CONTACT_ACTIVATED';

    this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._productsService.changeStatus(this.productCategory.id, !this.productCategory.isActive).then((response: any[]) => {
          if (response) {
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData(successText)
            );
          }
          this.getProductCategoryDetail()
          this.isReadOnly = true;
          this._commonHelper.hideLoader();
        }, (error) => {
          this.getProductCategoryDetail()
          this.isReadOnly = true;
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
    });
  }

  relatedProductsOnFilter(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getProductsForProductCategory(e.filter.trim());
      }
    }
    else {
      this.getProductsForProductCategory('');
    }
  }

  relatedProductsOnChange(e) {
    this._commonHelper.showLoader();
    let param = {
      ProductID: e.value,
      ProductCategoryID: this.productCategory.id
    }
    this._productsService.saveProductCategoryProduct(param).then(response => {
      this.refreshRelatedProducts = true;
      this.relatedProductDrpRef.resetFilter();
      this.getProductsForProductCategory('');
      this.selectedProduct = null;
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.DETAIL.TAB_RELATEDPRODUCTS.MESSAGE_ADD_RELATEDPRODUCTS_SUCCESS'));
    }, (error) => {
      this.relatedProductDrpRef.resetFilter();
      this.getProductsForProductCategory('');
      this.selectedProduct = null;
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  prepareParamsForProductsDropdown(searchString: any) {
    const params = [];
    const paramItem = {
      name: 'ProductCategoryID',
      type: 'int',
      value: this.productCategory.id,
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

  private getProductsForProductCategory(searchString: any) {
    let params = this.prepareParamsForProductsDropdown(searchString);
    this.isShowLoaderForProductCategory = true;
    // get datasource details
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ADDPRODUCTSFORPRODUCTCATEGORY, params).then(response => {
      this.productsForProductCategory = response;
      this.isShowLoaderForProductCategory = false;
    },
      (error) => {
        this.isShowLoaderForProductCategory = false;
        this._commonHelper.showToastrError(error.message);
      });
  }

  addRelatedProduct() {
    this.modalRef = this._modalService.open(ProductAddComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.DETAIL.TAB_RELATEDPRODUCTS.ADD_DIALOG_TITLE'));
    this.modalRef.componentInstance.isShowAssignTo = false;
    this.modalRef.componentInstance.isShowProductCategory = false;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        let param = {value: response}
        this.relatedProductsOnChange(param);
      }
    });
  }

  deleteRelatedProduct(id: any) {
    this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.DETAIL.TAB_RELATEDPRODUCTS.DELETE_RELATEDPRODUCTS_DIALOG_TEXT'), null, null, this.optionsForPopupDialog)
      .then((confirmed) => {
        if (confirmed) {
          this._commonHelper.showLoader();
          this._productsService.deleteProductCategoryProduct(id).then(response => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.DETAIL.TAB_RELATEDPRODUCTS.MESSAGE_DELETE_RELATEDPRODUCTS_SUCCESS'));
            this.refreshRelatedProducts = true;
            this.relatedProductDrpRef.resetFilter();
            this.getProductsForProductCategory('');
          }, (error) => {
            this.relatedProductDrpRef.resetFilter();
            this.getProductsForProductCategory('');
            this.selectedProduct = null;
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
        }
      });
  }

  // set current active tab
  setTab(activeInfo) {
    this.isAdditionalTab = activeInfo.isAdditionalTab;
    this.activeTab = activeInfo.tab.tabLink;
    this.selectedTab = activeInfo.tab.tabLink;
    if (!this.onceRelatedProductClicked && this.activeTab == 'navRelatedProducts'){
      this.getProductsForProductCategory('');
      this.onceRelatedProductClicked = true;
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

  setRefreshActivityHistory(){
    this.refreshActivityHistory = false;
    setTimeout(() => {
      this.refreshActivityHistory = true;  
    }, 500);
  }

  setRefreshStageHistory() {
    this.refreshStageHistory = false;
    setTimeout(() => {
      this.refreshStageHistory = true;
    }, 500);
  }

  refreshChildComponent(componentName: string) {
    switch (componentName) {
      case "RelatedProducts": {
        this.refreshRelatedProducts = false;
        break;
      }
    }
  }
  //#endregion

  //#region Private methids
  private readRouteParameter(): void {
    this._activeRoute.params.subscribe(param => {
      let id = param['id'];
      if (id && !isNaN(Number(id)) && Number(id) > 0) {
        this.productCategoryId = Number(id);
      } else {
        this._router.navigate(['productcategories', 'list']);
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

  private getGenderFromReferenceType() {
    return new Promise((resolve, reject) => {
      let params = { refType:  RefType.Gender};
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.Gender}`;
      // get data
      const refTypeGender = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeGender == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.genders = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.genders));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
      else {
        this.genders = refTypeGender;
        resolve(null);
      }
    });
  }
  
  private getCurrencySymbol() {
    const currencySymbol = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL));
    if (currencySymbol == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CURRENCY_SYMBOL).then((response:any) => {
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
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_ProductCategories));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_ProductCategories, JSON.stringify(response));
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

  //allow only 6 digits and '.'(dot)
  percentEventHandler(event) {
    if (event.keyCode === 46 && event.target.value.split('.').length === 2) {
      return false;
    }
    //don't allow more than 15 digit number
    return event.target.value.length <= 6;
  }

  //allow only 13 digits and ','(comma)
  currencyEventHandler(event) {
    //don't allow more than 13 digit number
    return event.target.value.length < 17;
  }

  //allow only 8000 characters in total
  textEventHandler(event) {
    return event.target.value.length < 4000;
  }

  private getParentProductCategory() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      // prepare params
      var params = this.prepareParamsForProductCategoryType('');
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ADDPRODUCTPRODUCTCATEGORY, params).then((response: any) => {
        //product category 
        if (response.length != 0) {
          this.parentCategoryOptions = response as [];
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

  private prepareParamsForProductCategoryType(searchString: any) {
    const params = []; 
    const paramItem = {
      name: 'ProductCategoryID',
      type: 'int', 
      value: this.productCategoryId,
    };
    params.push(paramItem);
  
    const paramItem1 = {
      name: 'SearchString',
      type: 'string',
      value: searchString
    }; 
    params.push(paramItem1);
    return params; 
  }

  private getProductCategoryCustomFields(): void {
    this._commonHelper.showLoader();
    this._productsService.getProductCategoryCustomFields(this.entityTypeId, this.productCategoryId)
      .then((response: any) => {
        if (response) {
          this.productCategoryCustomFields = response || [];
          this.prepareFormDataInJSON();
          this.getProductCategoryDetail();
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
    this.productCategoryCustomFields.forEach((customField: any) => {
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

  private getProductCategoryDetail() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._productsService.getProductCategoryDetailById(this.productCategoryId).then((response: any) => {
        if (response) {
          this.setProductCategoryDetails(response || {});
          this.productCategoryForm = this.createProductCategoryDetailForm();
          this.prepareFormCustomFields();
          // prepare tab with order
          this.setDefaultNavTabs();
          this.prepareTabsWithOrder();
          this.copyOfProductCategoryFormValues = this.productCategoryForm.value;
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

  private createProductCategoryDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.productCategoryId],
      name: [this.productCategory.name, Validators.compose([Validators.required, Validators.maxLength(200),Validators.minLength(2)])],
      code: [this.productCategory.code, Validators.compose([Validators.maxLength(100),Validators.minLength(2)])],
      description: [this.productCategory.description, Validators.compose([Validators.maxLength(2000),Validators.minLength(2)])],
      parent: [this.productCategory.parentID]
    });
  }

  private prepareFormCustomFields(): void {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.productCategory.customFieldJSONData[control.fieldName] != null && this.productCategory.customFieldJSONData[control.fieldName] != '') {
              this.productCategory.customFieldJSONData[control.fieldName] = moment(new Date(this.productCategory.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.productCategoryForm.addControl(control.fieldName, new UntypedFormControl(this.productCategory.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.productCategoryForm.addControl(control.fieldName, new UntypedFormControl(this.productCategory.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.productCategory.customFieldJSONData[control.fieldName] != null && this.productCategory.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.productCategory.customFieldJSONData[control.fieldName] === 'string') {
                this.productCategory.customFieldJSONData[control.fieldName] = JSON.parse(this.productCategory.customFieldJSONData[control.fieldName]);
              }
            } else {
              this.productCategory.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.productCategory.customFieldJSONData[control.fieldName] != null && this.productCategory.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.productCategory.customFieldJSONData[control.fieldName];
              this.productCategory.customFieldJSONData[control.fieldName] = this.productCategory.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON['isRequired']) {
                this.productCategoryForm.addControl(control.fieldName, new UntypedFormControl(this.productCategory.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.productCategoryForm.addControl(control.fieldName, new UntypedFormControl(this.productCategory.customFieldJSONData[control.fieldName]));
              }
              this.productCategory.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.productCategoryForm.addControl(control.fieldName, new UntypedFormControl(this.productCategory.customFieldJSONData[control.fieldName]));
              if (control.settingsJSON) {
                let validatorFn: ValidatorFn[] = [];
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
                  this.productCategoryForm.controls[control.fieldName].setValidators(validatorFn);
                  this.productCategoryForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.productCategory.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.productCategory.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.productCategoryForm.addControl(control.fieldName, new UntypedFormControl(this.productCategory.customFieldJSONData[control.fieldName]));
              this.productCategoryForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.productCategoryForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.productCategoryForm.addControl(control.fieldName, new UntypedFormControl(this.productCategory.customFieldJSONData[control.fieldName]));
              this.productCategoryForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.productCategoryForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.productCategoryForm.addControl(control.fieldName, new UntypedFormControl(this.productCategory.customFieldJSONData[control.fieldName], Validators.email));
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
              this.productCategoryForm.controls[control.fieldName].setValidators(validatorFn);
              this.productCategoryForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.productCategoryForm.addControl(control.fieldName, new UntypedFormControl(this.productCategory.customFieldJSONData[control.fieldName]));
            if (this.productCategory.customFieldJSONData[control.fieldName] != null && this.productCategory.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.productCategory.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.productCategoryForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") } );
              }
            } else {
              this.productCategoryForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.productCategoryForm.addControl(control.fieldName, new UntypedFormControl(this.productCategory.customFieldJSONData[control.fieldName]));
            if (control.settingsJSON) {
              let validatorFn: ValidatorFn[] = [];
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
                this.productCategoryForm.controls[control.fieldName].setValidators(validatorFn);
                this.productCategoryForm.controls[control.fieldName].updateValueAndValidity();
              }
            }
          }
        });
      });
    });
  }

  setDefaultNavTabs(): void {
    this.navTabsAll = [
      { tabName: 'Details', tabLink: 'navDetails', isFirst: true, condition: true, displayOrder: 101 },
      { tabName: '', tabLink: 'navRelatedProducts', isFirst: false, condition: this.isListProducts, displayOrder: 201 },
      { tabName: '', tabLink: 'navHistory', isFirst: false, condition: true, displayOrder: 301 },
      { tabName: '', tabLink: 'navDocuments', isFirst: false, condition: true, displayOrder: 401 }
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

  private prepareTabsWithOrder() : void {
    this.formDataJSON.forEach(tab => {
      var objNavTab  = {
        tabName: tab.tabName,
        tabLink: 'nav' + tab.tabName.replace(/\s/g, ""),
        isFirst: false,
        condition: true,
        displayOrder: tab.tabNumber,
        isNativeTab:false,
        isTabAlwaysVisible: tab.isTabAlwaysVisible,
        showCloseTabIconBtn : true,
        showButtonActive : false
      }

      this.navTabsAll.push(objNavTab);
    });

    this.navTabsAll = this.navTabsAll.sort(( a, b ) => a.displayOrder > b.displayOrder ? 1 : -1 );
    this.setTabLayout();
  }

  private setRelatedProductsTabParameters(): void {
    this.dcRelatedProductsParameters = [{
      name: 'ProductCategoryID',
      type: 'int',
      value: this.productCategoryId
    }]
  }

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'productcategory.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.' + error.messageCode.replace('.', '_').toUpperCase()));
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
      }
      else if (control instanceof UntypedFormArray) {
        control?.controls?.forEach((i: UntypedFormGroup) => {
          this.validateAllFormFields(i);
        })
      }
    });
  }

  private setProductCategoryDetails(response: any): void {
    this.productCategory = response;
    this.productCategoryName = this.productCategory?.name || '';
    this.productCategory.customFieldJSONData = this._commonHelper.tryParseJson(this.productCategory.customFieldJSONData);
    this.copyOfProductCategory = this._commonHelper.deepClone(this.productCategory);
    this.entityRecordTypeId = this.productCategory?.entityRecordTypeID;
  }

  private saveData(): any {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.productCategory.customFieldJSONData) {
        this.productCategoryCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.productCategory.customFieldJSONData[field.fieldName] && this.productCategory.customFieldJSONData[field.fieldName] != null && this.productCategory.customFieldJSONData[field.fieldName] != '') {
              this.productCategory.customFieldJSONData[field.fieldName] = moment(this.productCategory.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.productCategoryForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.productCategory.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.productCategory.customFieldJSONData[field.fieldName] = null;
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.productCategoryForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.productCategory.customFieldJSONData[field.fieldName] = data;
            } else {
              this.productCategory.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }

      let params = this._commonHelper.deepClone(this.productCategory);
      this.productCategoryCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.productCategoryForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = new TimeFrameToMinutesPipe().transform(formArrayValues, this.hoursInDay);
        }
      });

      this._productsService.saveProductCategory(params).then(() => {
        this.getProductCategoryDetail().then(() => {
          this.refreshCustomFieldDatasource = true;
          setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          this.setRefreshStageHistory();
          resolve(null)
        });
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.DETAIL.SUCCESS_MESSAGE'));
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error.messageCode.toLowerCase() !== 'staticmessage') {
          this.getProductCategoryDetail().then(() => {
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
  //#endregion

  findInvalidControls() {
    const invalid = [];
    const controls = this.productCategoryForm.controls;
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
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.PRODUCT_CATEGORY_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.PRODUCT_CATEGORY_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.PRODUCT_CATEGORY_TAB_LAYOUT}`, JSON.stringify(response));
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

  onDeleteProductCategoryClick(productCategoryId) {
    this._confirmationDialogService.confirm('PRODUCTCATEGORIES.DETAIL.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._productsService.deleteProductCategory(productCategoryId).then(() => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.DETAIL.MESSAGE_PRODUCTCATEGORY_DELETED')
          );
          // Redirect Product Categories Listing Page.
          this._router.navigateByUrl('/productcategories/list');

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
