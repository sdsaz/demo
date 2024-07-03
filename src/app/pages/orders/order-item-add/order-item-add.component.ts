
import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../@core/common-helper';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { OrdersService } from '../orders.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { DataSources, Entity, PublicTenantSettings, ReferenceType, RefType } from '../../../@core/enum';
import { SettingsService } from '../../settings/settings.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service'; 
import { OrderItem } from '../order-item.model';

@Component({
  selector: 'ngx-order-add',
  templateUrl: './order-item-add.component.html',
  styleUrls: ['./order-item-add.component.scss']
})
export class OrderItemAddComponent implements OnInit {


  isInitialLoaded = false;
  accountTypeList: any = null; //related to entity records
  accountTypePlaceholder = 'ORDERS.ADD_DIALOG.ACCOUNT_TYPE_PLACEHOLDER';
  customerPlaceholder = 'ORDERS.ADD_DIALOG.CONTACT_PLACEHOLDER';


  @Input() title: string;
  @Input() orderID?: number;
  
  @Input() assignedTo?: number;
  @Input() isAdd?: boolean; 

   
  productName?: string; 
  productCode?: string; 
  productList: any[] = []; 
  //For Order Form
  orderitem: OrderItem = new OrderItem({});
  orderItemForm: UntypedFormGroup;

  entityRecordTypes: any[] = [];
  //datasource
  discountTypeList: any[] = [];
  selectedDiscountType: string = null;

  //save Flag
  submitted = false;

  //datasource
  currencySymbol: any = null;

  formMode: string;
  customerContactList: any[] = []; //related to data source 

  validation_messages = { 
    'productID': [
      { type: 'required', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.PRODUCT_REQUIRED' }, 
    ],
    'orderItemNumber': [
      { type: 'required', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.ORDER_ITEM_NO_REQUIRED' },
      { type: 'minlength', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.MESSAGE_ORDER_ITEM_NO_MIN' },
      { type: 'maxlength', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.MESSAGE_ORDER_ITEM_NO_MAX' }
    ],
    'price': [
      { type: 'required', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.PRICE_REQUIRED' },
      { type: 'maxlength', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.MESSAGE_PRICE_MAX' }
    ],   
    'totalPrice': [ 
      { type: 'maxlength', message: 'ORDERS.ADD_DIALOG.MESSAGE_AMOUNT_MAX' }
    ],
    'quantity': [
      { type: 'required', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.QUANTITY_REQUIRED' },
      { type: 'maxlength', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.MESSAGE_QUANTITY_MAX' }
    ], 
    'discountRate': [
      { type: 'max', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.MESSAGE_DISCOUNT_PERCENTAGE' }
    ],
    'discountAmount': [
      { type: 'maxlength', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.MESSAGE_DISCOUNT_AMOUNT' }
    ],
    'taxRate': [
      { type: 'max', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.MESSAGE_TAX_PERCENTAGE' }
    ],
    'taxAmount': [
      { type: 'maxlength', message: 'ORDERS.DETAIL.TAB_ITEMS.ADD_DIALOG.MESSAGE_TAX_AMOUNT' }
    ],
  }
  constructor
    (
      private _ngbActiveModal: NgbActiveModal,
      private _commonHelper: CommonHelper,
      private _formBuilder: UntypedFormBuilder,
      private _orderService: OrdersService,
      private _settingsService: SettingsService,
      private _commonService: CommonService,
      private _dataSourceService: DatasourceService
    ) { 
      
    }

  ngOnInit(): void {
    this.formMode = 'ADD'; 
    Promise.all([
      this.getProductList(''),
      this.getCurrencySymbol(),
      this.getEntityTypeOptionsRef(), 
      this.getDiscountFromReferenceType(),
    ]).then(() => { this.orderItemForm = this.createOrderForm(); 
    });
  }

  createOrderForm(): UntypedFormGroup {
    if (this.formMode == 'ADD') {
      return this._formBuilder.group({
        id: 0, 
        orderID: [this.orderID], 
        orderItemNumber: [this.orderitem?.orderItemNumber, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
        price: [this.orderitem?.price, Validators.compose([ Validators.required, Validators.maxLength(14)])],
        productID:    [this.orderitem.productID,    Validators.compose([Validators.required])],
        discountType: [this.orderitem?.discountType, Validators.compose([])],
        quantity:[this.orderitem?.quantity, Validators.compose([ Validators.maxLength(5)])],
        discountRate: [this.orderitem?.discountRate, Validators.compose([Validators.max(100), Validators.min(0)])],
        discountAmount: [this.orderitem?.discountAmount, Validators.compose([Validators.maxLength(14)])],
        taxRate: [this.orderitem?.taxRate, Validators.compose([Validators.max(100), Validators.min(0)])],
        taxAmount: [this.orderitem?.taxAmount, Validators.compose([Validators.maxLength(14)])],
        totalPrice: [this.orderitem?.totalPrice, Validators.compose([Validators.maxLength(14)])], 
     
      });
    }
  }

  validateAllFormFields(formGroup: UntypedFormGroup) {
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

  private getEntityTypeOptionsRef(): any {
    let params = { entityTypeId: Entity.Orders };
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._commonService.getEntityRecordTypesByEntityTypeId(params).then(response => {
        if (response) {
          this.entityRecordTypes = response as [];
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

  get orderItemfrm() { return this.orderItemForm.controls; }
  
  //save order
  saveOrderItem(formData) {
    this.submitted = true;
    if (this.orderItemForm.invalid) {
      this.validateAllFormFields(this.orderItemForm);
      return;
    }

    // prepare params
    let params = {
      id: 0,
      tenantId: 0,
      name: this.productName,
      orderID: this.orderID,
      productID: formData.productID,
      orderItemNumber: formData.orderItemNumber,
      price: formData.price, 
      quantity: formData.quantity, 
      discountType: formData.discountType, 
      discountRate: formData.discountRate, 
      discountAmount: formData.discountAmount, 
      taxRate: formData.taxRate, 
      taxAmount: formData.taxAmount,
      totalPrice: formData.totalPrice
    }
     
    this._commonHelper.showLoader();
    // save order item
    this._orderService.saveOrderItem(params).then((response) => {
      this._commonHelper.hideLoader();
      this._ngbActiveModal.close(response);
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

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'orders.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('ORDERS.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  } 

  getDiscountFromReferenceType() {
    return new Promise((resolve, reject) => {
      let params = { refType: RefType.DiscountType };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.DiscountType}`;
      // get data
      const refTypeGender = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeGender == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.discountTypeList = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.discountTypeList));
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
        this.discountTypeList = refTypeGender;
        resolve(null);
      }
    });
  }
  changeDiscountType(event: any) {
    this.selectedDiscountType = this.discountTypeList.find(c => c.intValue1 == event.value)?.name || null;
  }

  
  relatedProductsOnFilter(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getProductList(e.filter.trim());
      }
    }
    else {
      this.getProductList('');
    }
  }


  private getProductList(searchString: any) {
    return new Promise((resolve, reject) => {
    let params = this.prepareParamsForDropdown(searchString);
    this._commonHelper.showLoader();
    // get datasource details 
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ADDPRODUCTORDERITEM, params).then(response => {
      this.productList = response as [];
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


  prepareParamsForDropdown(searchString: any) {
    const params = [];

    const paramItem1 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem1);

    return params;
  }

  

  relatedProductsOnChange(e) {
    if (e.value) {    
      const selectedProduct =  this.productList.find(c=>c.value == e.value) || null; 
      if(selectedProduct != null){
        this.productName = selectedProduct.label || '';
        this.productCode = selectedProduct.code || '';
        const price = selectedProduct?.initValue1 || 0;
        this.orderItemForm.controls['price'].patchValue(price);
      }
     
    } 
    else{ 
      this.productName =  '';
      this.productCode ='';
      this.orderItemForm.controls['price'].patchValue(null);
    }
  }

  
}
