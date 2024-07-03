//angular
import { Component, OnInit, Input } from '@angular/core';
import { Validators, UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, ValidatorFn } from '@angular/forms';
//common
import { CommonHelper } from '../../../../@core/common-helper';
import { DataSources, Entity, LocalStorageKey, PublicTenantSettings } from '../../../../@core/enum';
import { ProductSku } from '../productsku.model';
//service
import { SettingsService } from '../../../settings/settings.service';
import { ProductsService } from '../../products.service';
//other

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';


@Component({
  selector: 'ngx-productsku-add',
  templateUrl: './productsku-add.component.html',
  styleUrls: ['./productsku-add.component.scss']
})
export class ProductskuAddComponent implements OnInit {

  @Input() title: string;
  @Input() productId: string;
  @Input() isShowProductControl: boolean = false;
  @Input() isFromSameEntity: boolean = true;
  
  //For product sku Form
  productSku: ProductSku;
  productSkuForm: UntypedFormGroup;
  entityTypeId: number = Entity.ProductSkus;
  tenantId: number;

  //save Flag
  submitted = false;
  isInitialLoaded = false;
  formMode: string;

  //datasource
  currencySymbol: any = null;
  groupedUOMTypes: any = [];
  productList:any = [];
  
  showUOMLoader: boolean = false;

  validation_messages = {
    name: [
      { type: 'required', message: 'PRODUCTSKU.ADD_DIALOG.PRODUCTSKU_NAMEREQUIRED' },
      { type: 'maxlength', message: 'PRODUCTSKU.ADD_DIALOG.PRODUCTSKU_NAMEMAXLENGTH' },
      { type: 'minlength', message: 'PRODUCTSKU.ADD_DIALOG.PRODUCTSKU_NAMEMINLENGTH' }
    ],
    sku: [
      { type: 'required', message: 'PRODUCTSKU.ADD_DIALOG.PRODUCTSKU_SKUREQUIRED' },
      { type: 'maxlength', message: 'PRODUCTSKU.ADD_DIALOG.PRODUCTSKU_SKUMAXLENGTH' },
      { type: 'minlength', message: 'PRODUCTSKU.ADD_DIALOG.PRODUCTSKU_SKUMINLENGTH' }
    ],
    price: [
      { type: 'maxlength', message: 'PRODUCTSKU.ADD_DIALOG.PRODUCTSKU_PRICEMAXLENGTH' },
    ],
    stockQty: [
      { type: 'maxlength', message: 'PRODUCTSKU.ADD_DIALOG.PRODUCTSKU_STOCK_QUANTITY_MAXLENGTH' }
    ],
    productId: [
      { type: 'required', message: 'PRODUCTSKU.ADD_DIALOG.PRODUCTSKU_PRODUCTREQUIRED' },
    ],
  }

  constructor(private _ngbActiveModal: NgbActiveModal,
    public _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _settingsService: SettingsService,
    private _productService: ProductsService,
    private _dataSourceService: DatasourceService
  ) { }

  ngOnInit(): void {
    this.productSku = new ProductSku({});
    this.formMode = 'ADD';
    this.tenantId = this._commonHelper.getTenantId();

    Promise.all([
      this.getProducts(),
      this.getCurrencySymbol(),
      this.getUOMTypes()
    ]).then(() => {
      this.productSkuForm = this.createProductSkuForm();
      if (this.isShowProductControl) {
        this.productSkuForm.controls['productId'].setValidators([Validators.required]);
        this.productSkuForm.controls['productId'].updateValueAndValidity();
      } else {
        this.productSkuForm.controls['productId'].patchValue(null);
        this.productSkuForm.controls['productId'].clearValidators();
        this.productSkuForm.controls['productId'].updateValueAndValidity();
      }
    });
  }

  //#region Private Methods

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

  private createProductSkuForm(): UntypedFormGroup {
    if (this.formMode == 'ADD') {
      return this._formBuilder.group({
        name: [this.productSku.name, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
        sku: [this.productSku.sku, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
        uomId: [this.productSku.uomId],
        price: [this.productSku.price, Validators.compose([Validators.maxLength(14)])],
        stockQty: [this.productSku.stockQty, Validators.compose([Validators.maxLength(14)])],
        productId: [this.productSku.productId],
      });
    }
  }

  //For Form Validate
  private validateAllFormFields(formGroup: UntypedFormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      }
      else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'productsku.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('PRODUCTSKU.' + error.messageCode.replaceAll('.', '_').toUpperCase()));
      }
    }
  }
  //#endregion Private Methods

  saveProductSku(formData) {
    this.submitted = true;
    if (this.productSkuForm.invalid) {
      this.validateAllFormFields(this.productSkuForm);
      return;
    }
    if(this.isShowProductControl){
      this.productId = formData.productId;
    }
    //prepare params
    let params = {
      Name: formData.name,
      Sku: formData.sku,
      uomId: formData.uomId,
      StockQty: formData.stockQty,
      Price: formData.price,
      ProductId: this.productId
    }

    this._commonHelper.showLoader();
    this._productService.saveProductSku(params).then((response) => {
      this._commonHelper.hideLoader();
      let productSku: any = response;
      if (this.isFromSameEntity) {
        this._ngbActiveModal.close(productSku.id);
      } else {
        this._ngbActiveModal.close(productSku);
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  //for close form
  onCloseForm(status: boolean) {
    this._ngbActiveModal.close(status);
  }

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

  private getProducts(searchString: any = '', selectedEntityID = null) {
    return new Promise((resolve, reject) => {
      let selectedEntities = [Entity.Products];
      let params = [{
        name: 'EntityTypeID',
        type: 'string',
        value: selectedEntities && selectedEntities.length > 0 ? selectedEntities.toString() : null
      },
      {
        name: 'EntityRecordTypeID',
        type: 'int',
        value: null
      },
      {
        name: 'SelectedEntityID',
        type: 'int',
        value: selectedEntityID
      },
      {
        name: 'IncludeAllEntities',
        type: 'bit',
        value: 0
      },
      {
        name: 'SearchString',
        type: 'string',
        value: searchString
      }];
      this.productList = [];
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.GETALLPRODUCT, params)
      .then((response: any) => {
        if (response && response.length > 0) {
          let responseList: any = response as [];
          this.productList = responseList.map(x => ({ 'label': x.label, 'value': x.value }));
        }
        resolve(true);
      }, (error) => {
        this._commonHelper.showToastrError(error.message);
        reject(false);
      });
    }).catch();
  }

  ProductOnFilter(e) {
    let selectId = this.productSkuForm.value.productId;
    let EntityId: any = [];
    if (selectId) {
      EntityId.push(selectId);
    }
    this.getProducts(e.filter,selectId?.toString());
  }
}
