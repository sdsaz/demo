//angular
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
//common
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { Actions, DataSources, Entity, LocalStorageKey, PublicTenantSettings, TabLayoutType } from '../../../../@core/enum';
import { DynamicTableParameter } from '../../../../@core/sharedModels/dynamic-table.model';
import { timeFrameValidator } from '../../../../@core/sharedValidators/time-frame.validator';
//services
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { SettingsService } from '../../../settings/settings.service';
import { ProductsService } from '../../products.service';
import { CommonService } from '../../../../@core/sharedServices/common.service';
//pipes
import { TimeFrameToMinutesPipe } from '../../../../@core/pipes/time-frame-to-minutes/time-frame-to-minutes.pipe';
import { TimeFramePipe } from '../../../../@core/pipes/time-frame-pipe/time-frame-pipe.pipe';
//other
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { AddSkuAssemblyComponent } from '../add-sku-assembly/add-sku-assembly.component';
import { EntityReferencesListComponent } from '../../../../@core/sharedComponents/entity-references-list/entity-references-list.component';

@Component({
  selector: 'ngx-productsku-detail',
  templateUrl: './productsku-detail.component.html',
  styleUrls: ['./productsku-detail.component.scss']
})
export class ProductskuDetailComponent implements OnInit {
  private skuTxtNameRef: ElementRef;
  @ViewChild('skuTxtName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.skuTxtNameRef = content;
    }
  }

  // contact model
  entityTypeId: number = Entity.ProductSkus;
  productSkuId: number;
  entityRecordTypeId: number = null;

  productSku: any;
  copyOfProductSku: any;
  productSkuForm: UntypedFormGroup;
  copyOfProductSkuFormValues: any;
  productSkuCustomFields: any[] = [];

  formDataJSON: any[] = [];
  selectedTab: string = '';

  // extra variable
  submitted: boolean = false;
  isLoaded: boolean = false;
  isReadOnly: boolean = true;
  refreshActivity: boolean = false;
  refreshEntityTag: boolean = false;
  refreshCustomFieldDatasource: boolean = false;
  activeTab = '';
  isInitialLoading: boolean = true;

  navTabs: any[] = [];
  navTabsAll: any = [];
  navTabsMore: any = [];
  nativeTabDetails: any = [];
  isAdditionalTab: boolean = false;
  nativeTabCount: number = 0;
  isNativeTab: boolean = true;
  tabLayout: string = 'Default';
  forceRedirectionTabName: string = '';

  // permissions
  hasPermission: boolean = false;
  isViewProductSku: boolean = false;
  isEditProductSku: boolean = false;
  isAddProductSku: boolean = false;
  isDocumentDownloadPermission: boolean = false;
  isDeleteProductSku: boolean = false;

  //all popup dialog open option settings
  //all popup dialog open option settings  
  private modalRef: NgbModalRef | null;
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //datasource
  currencySymbol: any = null;
  groupedUOMTypes: any = [];
  hoursInDay:number = null;
  
  showUOMLoader: boolean = false;
  
  productSkuValidationMessages = {
    name: [
      { type: 'required', message: 'PRODUCTSKU.PRODUCTSKU_NAMEREQUIRED' },
      { type: 'maxlength', message: 'PRODUCTSKU.PRODUCTSKU_NAMEMAXLENGTH' },
      { type: 'minlength', message: 'PRODUCTSKU.PRODUCTSKU_NAMEMINLENGTH' }
    ],
    sku: [
      { type: 'required', message: 'PRODUCTSKU.PRODUCTSKU_SKUREQUIRED' },
      { type: 'maxlength', message: 'PRODUCTSKU.PRODUCTSKU_SKUMAXLENGTH' },
      { type: 'minlength', message: 'PRODUCTSKU.PRODUCTSKU_SKUMINLENGTH' }
    ],
    price: [
      { type: 'maxlength', message: 'PRODUCTSKU.PRODUCTSKU_PRICEMAXLENGTH' },
    ],
    stockQty: [
      { type: 'maxlength', message: 'PRODUCTSKU.PRODUCTSKU_STOCK_QUANTITY_MAXLENGTH' }
    ]
  }

  onceAssembliesClicked: boolean;
  tbSkuAssembliesParameters: Array<DynamicTableParameter> = []; //dynamic table params
  refreshAssemblyList: boolean = true;

  //navTabs
  currentActiveTabIndex: number = 0;
  previousActiveTabIndex: number = 0;

  refreshCustomFieldJSONGrid: boolean = false;

  refreshStageHistory: boolean = false;
  refreshActivityHistory: boolean = false;
  onceStageHistoryClicked: boolean = false;
  onceDocumentClicked: boolean = false;

  countries: any;
  refreshDocument: boolean = false;

  constructor(
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    public _commonHelper: CommonHelper,
    private _productsService: ProductsService,
    private _commonService: CommonService,
    private _dataSourceService: DatasourceService,
    private _settingsService: SettingsService,
    private _formBuilder: UntypedFormBuilder,
    private _modalService: NgbModal,
    private _location: Location,
    private _confirmationDialogService: ConfirmationDialogService) {
    this.isEditProductSku = this._commonHelper.havePermission(enumPermissions.EditProductSku);
    this.isViewProductSku = this._commonHelper.havePermission(enumPermissions.ViewProductSku);
    this.isAddProductSku = this._commonHelper.havePermission(enumPermissions.AddProductSku);
    this.isDocumentDownloadPermission = this._commonHelper.havePermission(enumPermissions.DownloadProductSkuDocument);
    this.isDeleteProductSku = this._commonHelper.havePermission(enumPermissions.DeleteProductSku);

    this.hasPermission = this.isViewProductSku || this.isEditProductSku;

    this.readRouteParameter();

    Promise.all([
      this.getTabLayoutTenantSetting(),
      this.getHoursInDay()
    ]).then(() => {
      this.setTabLayout();
    });
  }

  ngOnInit(): void {
    Promise.all([
      this.getNativeTabDetailsByEntityTypeId(),
      this.getCurrencySymbol(),
      this.getUOMTypes(),
      this.getCountries()
    ]).then(() => this.getProductSkuCustomFields());
  }

  //#region Events
  get productSkufrm() { return this.productSkuForm.controls; }

  onbackClick(): void {
    this._location.back();
  }

  showHideDetailTab(frmMode: string) {
    this.submitted = true;
    if (frmMode === 'SAVE') {
      if (this.productSkuForm.invalid) {
        this.validateAllFormFields(this.productSkuForm);
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
      this.productSku = this._commonHelper.deepClone(this.copyOfProductSku);
      
      if (this.productSku.customFieldJSONData && this.productSku.customFieldJSONData !== null && this.productSku.customFieldJSONData !== '' && this.productSku.customFieldJSONData !== undefined) {
        this.productSkuCustomFields.forEach((field: any) => {
          if (field.fieldType == 'Date') {
            if (this.productSku.customFieldJSONData[field.fieldName] && this.productSku.customFieldJSONData[field.fieldName] != null && this.productSku.customFieldJSONData[field.fieldName] != '' && this.productSku.customFieldJSONData[field.fieldName] != undefined) {
              this.productSku.customFieldJSONData[field.fieldName] = moment(new Date(this.productSku.customFieldJSONData[field.fieldName])).toDate();
            }
          }else if (field.fieldType == 'JSON Grid') {
            if (this.productSku.customFieldJSONData[field.fieldName] && this.productSku.customFieldJSONData[field.fieldName] != null && this.productSku.customFieldJSONData[field.fieldName] != '' && this.productSku.customFieldJSONData[field.fieldName] != undefined) {
              if (typeof this.productSku.customFieldJSONData[field.fieldName] === 'string') {
                this.productSku.customFieldJSONData[field.fieldName] = JSON.parse(this.productSku.customFieldJSONData[field.fieldName]);
              }
            }else {
              this.productSkuForm.removeControl(field.fieldName)
            }
          } else if (String(field.fieldType).toLowerCase() === 'duration') {
            if (typeof this.productSku.customFieldJSONData[field.fieldName] === 'number' || this.productSku.customFieldJSONData[field.fieldName] == null) {
              this.productSku.customFieldJSONData[field.fieldName] = new TimeFramePipe().transform(this.productSku.customFieldJSONData[field.fieldName], this.hoursInDay);
            }
          }
        })
      }
      
      this.productSkuForm.reset(this.copyOfProductSkuFormValues);
      this.refreshJSONGridData()
      this.isReadOnly = !this.isReadOnly;
      this.submitted = false;
    }
    else if (frmMode === 'EDIT' && this.isReadOnly) {
      setTimeout(() => { this.skuTxtNameRef.nativeElement.focus(); });
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
    const stringValue = event.value.toString()
    this.productSku.customFieldJSONData[fieldName] = stringValue != '' ? stringValue : null;
  }
  private changeProductSkuStatusMessage(id, status,isconfirmed) {
    this.optionsForPopupDialog.size = "md";
    let messageText = this.productSku.isActive ? 'PRODUCTSKU.MESSAGE_CONFIRM_INACTIVE' : 'PRODUCTSKU.MESSAGE_CONFIRM_ACTIVE';
    let successText = this.productSku.isActive ? 'PRODUCTSKU.MESSAGE_CONTACT_INACTIVATED' : 'PRODUCTSKU.MESSAGE_CONTACT_ACTIVATED';

    if(isconfirmed){
      this.changeProductSkuStatus(id, status, successText);
    } else {
      this._confirmationDialogService.confirm(messageText, null, null, this.optionsForPopupDialog).then((confirmed) => {
        if (confirmed) {
          this.changeProductSkuStatus(id, status, successText);
        }
      });
    }
  }

  private changeProductSkuStatus(id: any, status: any, successText: string) {
    this._commonHelper.showLoader();
    this._productsService.changeSkuStatus(id, !status).then((response: any[]) => {
      if (response) {
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData(successText)
        );
      }
      this.getProductSkuDetail();
      this.isReadOnly = true;
      if (this.onceAssembliesClicked) {
        this.refreshAssemblyList = false;
        setTimeout(() => {
          this.refreshAssemblyList = true;
        }, 50);
      }
      this._commonHelper.hideLoader();
    }, (error) => {
      this.getProductSkuDetail();
      this.isReadOnly = true;
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  onActionChangeStatus() { 
    if (!this.isEditProductSku) {
      return
    }
    if (this.productSku.isActive) {
      const params = {
        EntityTypeId: Entity.ProductSkus,
        EntityId: this.productSku.id
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
          this.modalRef.componentInstance.entityId = this.productSku.id;
          this.modalRef.componentInstance.entityTypeId = Entity.ProductSkus;
          this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData('PRODUCTSKU.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DEACTIVE_LABEL');
          this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData('PRODUCTSKU.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE');
          this.modalRef.componentInstance.action = Actions.InActive;
          this.modalRef.result.then((response: any) => {
            if (response) {
              this.changeProductSkuStatusMessage(this.productSku.id, this.productSku.isActive,true)
            }
          });
        }
        else { 
          this.changeProductSkuStatusMessage(this.productSku.id,this.productSku.isActive,false);
          this.optionsForPopupDialog.size = "md";
        }
      });
    }
    else{
      this.isProductActive(this.productSku.productID).then((res) => {
        if (res) {
            this.changeProductSkuStatusMessage(this.productSku.id, this.productSku.isActive,false)
        }
      },
      (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
      });
    }    
  }

  private isProductActive(productId) {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._productsService.getProductById(productId).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response) {
          if (response.isActive) {  
            resolve(true);
          } else {
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTSKU.DETAIL.MESSAGE_PRODUCTSKUS_HAS_INACTIVE_PRODUCT'));
            resolve(false);
          }
        }
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(true);
        });
    });
  }

  // set current active tab
  setTab(activeInfo) {
    this.isAdditionalTab = activeInfo.isAdditionalTab;
    this.activeTab = activeInfo.tab.tabLink;
    this.selectedTab = activeInfo.tab.tabLink;

    if (!this.onceAssembliesClicked && this.activeTab == 'navAssemblies') {
      this.setSkuAssembliesTabParameters();
      this.onceAssembliesClicked = true;
    }

    if (!this.onceStageHistoryClicked && this.activeTab == 'navHistory') {
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

  setRefreshStageHistory() {
    this.refreshStageHistory = false;
    setTimeout(() => {
      this.refreshStageHistory = true;
    }, 500);
  }


  openAddSKUPopup() {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(AddSkuAssemblyComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = 'PRODUCTSKU.DETAIL.ADD_ASSEMBLIES_DIALOG.ADD_TITLE';
    this.modalRef.componentInstance.parentSkuId = this.productSkuId;
    this.modalRef.componentInstance.action = Actions.Add;
    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshAssemblyList = false;
        setTimeout(() => {
          this.refreshAssemblyList = true;
        }, 50);
      }
    });
  }

  editProductSkuAssembly(productAssemblyId: number) {
    this.optionsForPopupDialog.size = "md";
    this.modalRef = this._modalService.open(AddSkuAssemblyComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.title = 'PRODUCTSKU.DETAIL.ADD_ASSEMBLIES_DIALOG.EDIT_TITLE';
    this.modalRef.componentInstance.parentSkuId = this.productSkuId;
    this.modalRef.componentInstance.action = Actions.Edit;
    this.modalRef.componentInstance.productSkuAssemblyId = productAssemblyId;

    this.modalRef.result.then((response: boolean) => {
      if (response) {
        this.refreshAssemblyList = false;
        setTimeout(() => {
          this.refreshAssemblyList = true;
        }, 50);
      }
    });
  }

  deleteProductSkuAssembly(id: number) {
    this.optionsForPopupDialog.size = "md";
    this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('PRODUCTSKU.DETAIL.TAB_ASSEMBLIES.DELETE_PRODUCTSKUASSEMBLY_DIALOG_TEXT'), null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._productsService.deleteProductSkuAssembly(id).then(() => {
          this.refreshAssemblyList = false;
          setTimeout(() => {
            this.refreshAssemblyList = true;
          }, 50);
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTSKU.DETAIL.TAB_ASSEMBLIES.MESSAGE_DELETE_PRODUCTSKUASSEMBLY_SUCCESS'));
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
      }
    });
  }
  //#endregion

  //#region Private methids
  private readRouteParameter(): void {
    this._activeRoute.params.subscribe(param => {
      let id = param['id'];
      if (id && !isNaN(Number(id)) && Number(id) > 0) {
        this.productSkuId = Number(id);
      } else {
        this._location.back();
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

  private getNativeTabDetailsByEntityTypeId() {
    const nativeTabDetails = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NativeTabList_ProductSkus));
    if (nativeTabDetails == null) {
      return new Promise((resolve, reject) => {
        this._commonService.getNativeTabDetailsByEntityTypeId(this.entityTypeId).then((response: any) => {
          this.nativeTabDetails = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NativeTabList_ProductSkus, JSON.stringify(response));
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

  private getProductSkuCustomFields(): void {
    this._commonHelper.showLoader();
    this._productsService.getProductSkuCustomFields(this.entityTypeId, this.productSkuId)
      .then((response: any) => {
        if (response) {
          this.productSkuCustomFields = response || [];
          this.prepareFormDataInJSON();
          this.getProductSkuDetail();
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
    this.productSkuCustomFields.forEach((customField: any) => {
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

  private getProductSkuDetail() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._productsService.getProductSkuDetailById(this.productSkuId).then((response: any) => {
        if (response) {
          this.setProductSkuDetails(response || {});
          this.productSkuForm = this.createProductSkuDetailForm();
          this.prepareFormCustomFields();
          // prepare tab with order
          this.setDefaultNavTabs();
          this.prepareTabsWithOrder();
          this.copyOfProductSkuFormValues = this.productSkuForm.value;
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
        this.getTranslateErrorMessage(error);
        reject(null);
      });
    });
  }

  private createProductSkuDetailForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.productSkuId],
      name: [this.productSku.name, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
      sku: [this.productSku.sku, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
      uomid: [this.productSku.uomid],
      uomName: [this.productSku.uomName],
      price: [this.productSku.price, Validators.compose([Validators.maxLength(15)])],
      stockQty: [this.productSku.stockQty, Validators.compose([Validators.maxLength(15)])]
    });
  }

  private prepareFormCustomFields(): void {
    this.formDataJSON.forEach(tab => {
      tab.sections.forEach(section => {
        section.controls.forEach(control => {
          if (control.fieldType == 'Date') {
            if (this.productSku.customFieldJSONData[control.fieldName] != null && this.productSku.customFieldJSONData[control.fieldName] != '') {
              this.productSku.customFieldJSONData[control.fieldName] = moment(new Date(this.productSku.customFieldJSONData[control.fieldName])).toDate();
            }
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.productSkuForm.addControl(control.fieldName, new UntypedFormControl(this.productSku.customFieldJSONData[control.fieldName], Validators.required));
            } else {
              this.productSkuForm.addControl(control.fieldName, new UntypedFormControl(this.productSku.customFieldJSONData[control.fieldName]));
            }
          }
          else if (control.fieldType == 'JSON Grid') {
            if (this.productSku.customFieldJSONData[control.fieldName] != null && this.productSku.customFieldJSONData[control.fieldName] != '') {
              if (typeof this.productSku.customFieldJSONData[control.fieldName] === 'string') {
                this.productSku.customFieldJSONData[control.fieldName] = JSON.parse(this.productSku.customFieldJSONData[control.fieldName]);
              }
            }else {
              this.productSku.customFieldJSONData[control.fieldName] = [];
            }
          }
          else if (control.fieldType == 'Picklist (MultiSelect)') {
            if (this.productSku.customFieldJSONData[control.fieldName] != null && this.productSku.customFieldJSONData[control.fieldName] != '') {
              const stringValue = this.productSku.customFieldJSONData[control.fieldName];
              this.productSku.customFieldJSONData[control.fieldName] = this.productSku.customFieldJSONData[control.fieldName].split(',') as [];
              if (control.settingsJSON && control.settingsJSON['isRequired']) {
                this.productSkuForm.addControl(control.fieldName, new UntypedFormControl(this.productSku.customFieldJSONData[control.fieldName], Validators.required));
              } else {
                this.productSkuForm.addControl(control.fieldName, new UntypedFormControl(this.productSku.customFieldJSONData[control.fieldName]));
              }
              this.productSku.customFieldJSONData[control.fieldName] = stringValue
            }
            else {
              this.productSkuForm.addControl(control.fieldName, new UntypedFormControl(this.productSku.customFieldJSONData[control.fieldName]));
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
                  this.productSkuForm.controls[control.fieldName].setValidators(validatorFn);
                  this.productSkuForm.controls[control.fieldName].updateValueAndValidity();
                }
              }
            }
          }
          else if (control.fieldType == 'Duration') {
            this.productSku.customFieldJSONData[control.fieldName] = new TimeFramePipe().transform(this.productSku.customFieldJSONData[control.fieldName], this.hoursInDay);
            if (control.settingsJSON && control.settingsJSON['isRequired']) {
              this.productSkuForm.addControl(control.fieldName, new UntypedFormControl(this.productSku.customFieldJSONData[control.fieldName]));
              this.productSkuForm.controls[control.fieldName].setValidators(Validators.compose([Validators.required, timeFrameValidator()]));
              this.productSkuForm.controls[control.fieldName].updateValueAndValidity();
            } else {
              this.productSkuForm.addControl(control.fieldName, new UntypedFormControl(this.productSku.customFieldJSONData[control.fieldName]));
              this.productSkuForm.controls[control.fieldName].setValidators(Validators.compose([timeFrameValidator(false)]));
              this.productSkuForm.controls[control.fieldName].updateValueAndValidity();
            }
          }
          else if (control.fieldType == 'Email') {
            this.productSkuForm.addControl(control.fieldName, new UntypedFormControl(this.productSku.customFieldJSONData[control.fieldName], Validators.email));
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
              this.productSkuForm.controls[control.fieldName].setValidators(validatorFn);
              this.productSkuForm.controls[control.fieldName].updateValueAndValidity();
            }
          } else if (control.fieldType == 'Phone') {
            this.productSkuForm.addControl(control.fieldName, new UntypedFormControl(this.productSku.customFieldJSONData[control.fieldName]));
            if (this.productSku.customFieldJSONData[control.fieldName] != null && this.productSku.customFieldJSONData[control.fieldName] != '') {
              const phoneDetail = String(this.productSku.customFieldJSONData[control.fieldName]).split('|');
              if (phoneDetail.length == 2) {
                this.productSkuForm.controls[control.fieldName].patchValue({ countryCode: phoneDetail[0], phoneNumber: phoneDetail[1], phoneMask: String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0") } );
              }
            } else {
              this.productSkuForm.controls[control.fieldName].patchValue({ countryCode: null, phoneNumber: null, phoneMask: null });
            }
          }
          else {
            this.productSkuForm.addControl(control.fieldName, new UntypedFormControl(this.productSku.customFieldJSONData[control.fieldName]));
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
                this.productSkuForm.controls[control.fieldName].setValidators(validatorFn);
                this.productSkuForm.controls[control.fieldName].updateValueAndValidity();
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
      { tabName: '', tabLink: 'navAssemblies', isFirst: false, condition: true, displayOrder: 201 },
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

  private prepareTabsWithOrder(): void {
    this.formDataJSON.forEach(tab => {
      var objNavTab = {
        tabName: tab.tabName,
        tabLink: 'nav' + tab.tabName.replace(/\s/g, ""),
        isFirst: false,
        condition: true,
        displayOrder: tab.tabNumber,
        isNativeTab: false,
        isTabAlwaysVisible: tab.isTabAlwaysVisible,
        showCloseTabIconBtn : true,
        showButtonActive : false
      }

      this.navTabsAll.push(objNavTab);
    });

    this.navTabsAll = this.navTabsAll.sort((a, b) => a.displayOrder > b.displayOrder ? 1 : -1);
    this.setTabLayout();
  }

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'productsku.duplicate') {
        this._commonHelper.showToastrError(error.message);
      } else if (error.messageCode.toLowerCase() == 'staticmessage') {
        this._commonHelper.showToastrError(error.message);
      } else if (error.messageCode.toLowerCase() == 'productsku.productskuinotherentities') {
        this._commonHelper.showToastrError(this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRODUCTSKU.PRODUCTSKU_PRODUCTSKUINOTHERENTITIES')));
      } else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('PRODUCTSKU.' + error.messageCode.replaceAll('.', '_').toUpperCase()));
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

  private setProductSkuDetails(response: any): void {
    this.productSku = response;
    this.productSku.price = (this.productSku.price == null || this.productSku.price == undefined) ? null : this.productSku.price.toString();
    this.productSku.stockQty = (this.productSku.stockQty == null || this.productSku.stockQty == undefined) ? null : this.productSku.stockQty.toString();
    this.productSku.customFieldJSONData = this._commonHelper.tryParseJson(this.productSku.customFieldJSONData);
    this.copyOfProductSku = this._commonHelper.deepClone(this.productSku);
  }

  private saveData(): any {
    return new Promise((resolve: any, reject: any) => {
      this._commonHelper.showLoader();
      if (this.productSku.customFieldJSONData) {
        this.productSkuCustomFields.forEach(field => {
          if (field.fieldType == 'Date') {
            if (this.productSku.customFieldJSONData[field.fieldName] && this.productSku.customFieldJSONData[field.fieldName] != null && this.productSku.customFieldJSONData[field.fieldName] != '') {
              this.productSku.customFieldJSONData[field.fieldName] = moment(this.productSku.customFieldJSONData[field.fieldName]).format('YYYY-MM-DD');
            }
          } else if (field.fieldType == 'JSON Grid') {
            const formArrayValues = this.productSkuForm.get(field.fieldName)?.value || [];
            if (formArrayValues && formArrayValues.length > 0) {
              this.productSku.customFieldJSONData[field.fieldName] = JSON.stringify(formArrayValues);
            } else {
              this.productSku.customFieldJSONData[field.fieldName] = null;
            }
          } else if(field.fieldType == 'Phone') {
            const phoneControlValue = this.productSkuForm.get(field.fieldName)?.value;
            if (phoneControlValue?.countryCode && phoneControlValue?.countryCode !== "" && phoneControlValue?.phoneNumber && phoneControlValue?.phoneNumber !== "") {
              let data = phoneControlValue?.countryCode + '|' + String(phoneControlValue?.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
              this.productSku.customFieldJSONData[field.fieldName] = data;
            } else {
              this.productSku.customFieldJSONData[field.fieldName] = null;
            }
          }
        })
      }

      let params = this._commonHelper.deepClone(this.productSku);
      
      this.productSkuCustomFields.forEach(field => {
        if (field.fieldType == 'Duration') {
          const formArrayValues = this.productSkuForm.get(field.fieldName)?.value || [];
          params.customFieldJSONData[field.fieldName] = new TimeFrameToMinutesPipe().transform(formArrayValues, this.hoursInDay);
        }
      });

      this._productsService.saveProductSku(params).then(() => {
        this.getProductSkuDetail().then(() => {
          this.refreshCustomFieldDatasource = true;
          setTimeout(() => { this.refreshCustomFieldDatasource = false; }, 50);
          resolve(null)
        });
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTSKU.DETAIL.SUCCESS_MESSAGE'));
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        if (error.messageCode.toLowerCase() !== 'staticmessage') {
          this.getProductSkuDetail().then(() => {
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
    const controls = this.productSkuForm.controls;
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

  private setSkuAssembliesTabParameters(): void {
    this.tbSkuAssembliesParameters = [{
      name: 'SkuID',
      type: 'int',
      value: this.productSkuId
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
      const tabLayout = JSON.parse(this._commonHelper.getLocalStorageDecryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.PRODUCTSKU_TAB_LAYOUT}`));
      if (tabLayout == null) {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.PRODUCTSKU_TAB_LAYOUT).then((response: any) => {
          this.tabLayout = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(`${this._commonHelper.tenantSettingPrefixKey}${PublicTenantSettings.PRODUCTSKU_TAB_LAYOUT}`, JSON.stringify(response));
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

  private getUOMTypes() {
    return new Promise((resolve, reject) => {
      this.showUOMLoader = true;
      let storageKey = LocalStorageKey.UOM_TypeKey;
      let localUOMTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (!localUOMTypes) {
        // get datasource details
        this._dataSourceService.getDataSourceDataByCode(DataSources.UOM_TYPES).then(response => {
          this.showUOMLoader = false;
          if (response) {
            let responseList = response as [];
            let filteredGroups = Array.from(new Set(responseList.map((item: any = []) => item.group)));
            filteredGroups.forEach(groupLabel => {
              let items = responseList.filter((obj: any) => { return obj.group === groupLabel }).map((s: any) => { return { label: s.label, value: s.value, groupLabel:groupLabel } });
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
          this.showUOMLoader = false;
          this._commonHelper.showToastrError(error.message);
          reject(null);
        }).catch(() => {
          resolve(null);
        });
      }
      else {
        this.showUOMLoader = false;
        this.groupedUOMTypes = localUOMTypes;
        resolve(null);
      }
    });
  }

  onUOMSelectionChange(value) {
    this.productSku.uomid = value;
  }
 
  setRefreshDocument() {
    this.refreshDocument = false;
    setTimeout(() => {
      this.refreshDocument = true;
    }, 500);
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

  onDeleteProductSku(id: any) {
    const params = {
      EntityTypeId: Entity.ProductSkus,
      EntityId: id,
    };
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
        this.modalRef.componentInstance.entityId = id;
        this.modalRef.componentInstance.entityTypeId = Entity.ProductSkus;
        this.modalRef.componentInstance.label = this._commonHelper.getInstanceTranlationData("PRODUCTSKU.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_DELETE_LABEL");
        this.modalRef.componentInstance.dialogTitle = this._commonHelper.getInstanceTranlationData("PRODUCTSKU.DETAIL.ENTITY_REFERENCE_LIST_DIALOG.DIALOG_TITLE");
      }
      else {
        this.optionsForPopupDialog.size = "md";
        this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData("PRODUCTSKU.DETAIL.DELETE_PRODUCTSKU_DIALOG_TEXT"), null, null, this.optionsForPopupDialog)
          .then((confirmed) => {
            if (confirmed) {
              this._commonHelper.showLoader();
              this._productsService.deleteProductSku(id).then(() => {
                this._commonHelper.hideLoader();
                this._commonHelper.showToastrSuccess(
                  this._commonHelper.getInstanceTranlationData(
                    "PRODUCTSKU.DETAIL.MESSAGE_DELETE_PRODUCTSKU_SUCCESS"
                  )
                );
                // Redirect Product Listing Page.
                this._router.navigateByUrl('/products/list');
              }, (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
              });
            }
          });
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }
}
