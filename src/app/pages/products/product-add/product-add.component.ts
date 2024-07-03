import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../@core/common-helper';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { ProductsService } from '../products.service';
import { Product } from '../product.model';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { DataSources, Entity, LocalStorageKey, PublicTenantSettings } from '../../../@core/enum';
import { SettingsService } from '../../settings/settings.service';
import { DateGreaterThan } from '../../../@core/sharedValidators/date-greater-than.validator';
import { AccountsService } from '../../accounts/accounts.service';
import * as moment from 'moment';
import { WorkflowmanagementService } from '../../workflowmanagement/workflowmanagement.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';

@Component({
  selector: 'ngx-product-add',
  templateUrl: './product-add.component.html',
  styleUrls: ['./product-add.component.scss']
})
export class ProductAddComponent implements OnInit {

  @Input() title: string;
  @Input() isShowAccountProductControls: boolean = false;
  @Input() accountId?: number;
  @Input() entityWorkflowId: number;
  @Input() isShowAssignTo: boolean;
  @Input() isShowProductCategory: boolean;
  @Input() entityRecordTypeId: number;
  @Input() workflows: any;
  @Input() recordTypes: any;
  @Input() showEntityRecordTypeLoader: boolean = false;
  @Input() showAssginedToLoader: boolean;
  @Input() showWorkflowLoader: boolean;
  @Input() isShowWorkflow: boolean;

  /**
   * If it is belongs to Entity or not, If it used from other Entity then values must be false
   */
  @Input() isFromSameEntity: boolean = true;

  //For Product Form
  product: Product;
  productForm: UntypedFormGroup;

  entityRecordTypes: any;

  //save Flag
  submitted = false;
  filteredWorkflows: any;

  //datasource
  currencySymbol: any = null;
  assignedToUsers: any = null; //assigned to users

  copyOfAssignedTo: any; //copy of assingedUsers

  groupedUOMTypes: any = [];
  showUOMLoader: boolean = false;

  selectedWorkflow: any;
  productCategories: any;

  copyOfWorkflows: any;
  copyOfRecordTypes: any;
  isShowRecordTypes : boolean = true;
  isSpecificWorkflowPage: boolean = true;
  
  validation_messages = {
    'name': [
      { type: 'required', message: 'PRODUCTS.ADD_DIALOG.NAME_REQUIRED' },
      { type: 'maxlength', message: 'PRODUCTS.ADD_DIALOG.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'PRODUCTS.ADD_DIALOG.MESSAGE_NAME_MIN' }
    ],
    'code': [
      { type: 'maxlength', message: 'PRODUCTS.ADD_DIALOG.MESSAGE_CODE_MAX' },
      { type: 'minlength', message: 'PRODUCTS.ADD_DIALOG.MESSAGE_CODE_MIN' }
    ],
    'description': [
      { type: 'maxlength', message: 'PRODUCTS.ADD_DIALOG.MESSAGE_DESCRIPTION_MAX' },
      { type: 'minlength', message: 'PRODUCTS.ADD_DIALOG.MESSAGE_DESCRIPTION_MIN' }
    ],
    'stockQty': [
      { type: 'maxlength', message: 'PRODUCTS.ADD_DIALOG.MESSAGE_STOCK_QUANTITY_MAXLENGTH' }
    ],
    'price': [
      { type: 'required', message: 'PRODUCTS.ADD_DIALOG.PRICE_REQUIRED' },
      { type: 'maxlength', message: 'PRODUCTS.ADD_DIALOG.MESSAGE_PRICE_MAX' }
    ],
    'startDate': [
      { type: 'required', message: 'PRODUCTS.ADD_DIALOG.START_DATE_REQUIRED' }
    ],
    'endDate': [
      { type: 'dateGreaterThan', message: 'PRODUCTS.ADD_DIALOG.END_DATE_GREATERTHAN_STARTDATE' }
    ],
    'entityRecordTypeId': [
      { type: 'required', message: 'CRM.ACCOUNT.ADD_DIALOG.TYPE_REQUIRED' }
    ],
    'entityWorkflowId': [
      { type: 'required', message: 'PRODUCTS.ADD_DIALOG.WORKFLOW_REQUIRED' }
    ],
    'assignedTo': [
      { type: 'required', message: 'CRM.ACCOUNT.ADD_DIALOG.ASSIGNED_TO_REQUIRED' }
    ]
  }

  constructor
    (
      private _ngbActiveModal: NgbActiveModal,
      public _commonHelper: CommonHelper,
      private _formBuilder: UntypedFormBuilder,
      private _productService: ProductsService,
      private _settingsService: SettingsService,
      private _commonService: CommonService,
      private _accountService: AccountsService,
      private _workflowmanagementService: WorkflowmanagementService,
      private _dataSourceService: DatasourceService
    ) { }

  ngOnInit(): void {
    this.product = new Product({});
    Promise.all([
      this.getCurrencySymbol(),
      this.getUOMTypes(),
      this.getCategoriesForProductCategories()
    ]).then(() => {
      this.productForm = this.createProductForm();

      //fill workflow field dropdown only general 
      this.filteredWorkflows = this.workflows?.filter((x: any) => x.entityRecordTypeID == null);
      this.setInitialValues();

      if (this.isShowAccountProductControls) {
        this.productForm.get('startDate').setValidators([Validators.required]);
        this.productForm.get('startDate').updateValueAndValidity();
      }
    });
  }

  private setInitialValues() {
    if ((!this.entityWorkflowId && !this.entityRecordTypeId) || (this.entityWorkflowId && !this.entityRecordTypeId)) {
      this.isSpecificWorkflowPage = false;
      this.showHideRecordType();
      this.showHideWorkflowAndAssignedTo();

      // get assigned to users
      if (this.isShowAssignTo && !this.isShowWorkflow) {
        this.getAssignedToUsers(null, 1, null);
      }
    }
    else {
      this.setDataForSpecificWorkflow();
    }
  }

  private showHideRecordType() {
    // Record Types
    if (this.recordTypes && this.recordTypes.length == 1) {
      this.copyOfRecordTypes = this._commonHelper.deepClone(this.recordTypes)
      this.isShowRecordTypes = false;
      this.entityRecordTypeId = this.recordTypes[0].value;

      this.productForm.controls['entityRecordTypeId'].patchValue(this.entityRecordTypeId);
      this.productForm.controls['entityRecordTypeId'].updateValueAndValidity();
    }
    else if (this.recordTypes && this.recordTypes.length > 0) {
      this.copyOfRecordTypes = this._commonHelper.deepClone(this.recordTypes)
    }
    else {
      this.isShowRecordTypes = false;
    }
  }

  private showHideWorkflowAndAssignedTo() {
    // Workflows
    if (this.workflows && this.workflows?.length == 1) {
      this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
      this.isShowWorkflow = false;
      this.entityWorkflowId = this.workflows[0].value;
      this.productForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
      this.productForm.controls['entityWorkflowId'].clearValidators();
      this.productForm.controls['entityWorkflowId'].updateValueAndValidity();
    }
    else if (this.workflows && this.workflows?.length > 0) {
      this.copyOfWorkflows = this._commonHelper.deepClone(this.workflows)
      if (this.copyOfRecordTypes?.length == 1) {
        this.workflows = this.workflows?.filter(x => x.isDefault || x.entityRecordTypeID == this.entityRecordTypeId);
      }
      else {
        this.workflows = this.copyOfWorkflows?.filter(s => s.isDefault);
      }
    }
    else {
      this.isShowWorkflow = false;
      this.isShowAssignTo = false;
      if (this.workflows?.length <= 0) {
        this.productForm.controls['entityWorkflowId'].clearValidators();
        this.productForm.controls['entityWorkflowId'].updateValueAndValidity();
      }
    }
  }

  private setDataForSpecificWorkflow() {
    this.isSpecificWorkflowPage = true;

    // Get Assigned To users
    this.getAssignedToUsers(null, 1, null);

    this.isShowRecordTypes = false;
    this.isShowWorkflow = false;

    this.productForm.controls['entityWorkflowId'].patchValue(this.entityWorkflowId);
    this.productForm.controls['entityWorkflowId'].clearValidators();
    this.productForm.controls['entityWorkflowId'].updateValueAndValidity();
    this.isShowAssignTo = true;
  }
  
  createProductForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: 0,
      tenantId: 0,
      name: [this.product.name, Validators.compose([Validators.required, Validators.maxLength(500), Validators.minLength(2)])],
      productCategoryId: [this.product.productCategoryIds],
      code: [this.product.code, Validators.compose([Validators.maxLength(100), Validators.minLength(2)])],
      stockQty: [this.product.stockQty, Validators.compose([Validators.maxLength(14)])],
      uomId: [this.product.uomId],
      price: [this.product.price, Validators.compose([Validators.required, Validators.maxLength(14)])],
      description: [this.product.description, Validators.compose([Validators.maxLength(2000), Validators.minLength(2)])],
      entityRecordTypeId: [this.product.entityRecordTypeId],
      startDate: [this.product.startDate],
      assignedTo: [this.product.assignedTo],
      endDate: [this.product.endDate],
      entityWorkflowId: [this.product.entityWorkflowId]
    },
      {
        validator: DateGreaterThan('endDate', 'startDate')
      });
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

  private prepareParamsForAssignedToUsers(stageId, assignedTo, includeAllUsers = 1, searchString = null) {
    const params = [];
    const paramItem = {
      name: 'EntityWorkflowID',
      type: 'int',
      value: this.entityWorkflowId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'StageID',
      type: 'int',
      value: stageId
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SelectedUserID',
      type: 'int',
      value: assignedTo
    };
    params.push(paramItem2);

    const paramItem3 = {
      name: 'IncludeAllUsers',
      type: 'bit',
      value: includeAllUsers
    };
    params.push(paramItem3);

    const paramItem4 = {
      name: 'SearchString',
      type: 'string',
      value: searchString
    };
    params.push(paramItem4);

    return params;
  }

  private getAssignedToUsers(assignedTo, includeAllUsers = 1, searchString = null) {
    return new Promise((resolve, reject) => {
      this.showAssginedToLoader = true;
      let defaultStageID = this.workflows?.find(x => x.value == this.entityWorkflowId)?.defaultStageID;

      var params = this.prepareParamsForAssignedToUsers(defaultStageID, assignedTo, includeAllUsers, searchString);
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.PRODUCTASSIGNEDTO, params).then((response: any) => {
        //assigned to users
        if (response != undefined) {
          // users to assign to dropdwon
          this.assignedToUsers = response as [];
          this.copyOfAssignedTo = response as any[];
        }
        this.showAssginedToLoader = false;
        resolve(null);
      }, (error) => {
        this.showAssginedToLoader = false;
        reject(null);
      });
    });
  }

  private prepareParamsForProductType() {
    const params = [];
    const paramItem1 = {
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.Products
    };
    params.push(paramItem1);

    return params;
  }

  private prepareParamsForCategoriesDropdown() {
    const params = [];
    const paramItem = {
      name: 'ProductID',
      type: 'int',
      value: null,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'SearchString',
      type: 'string',
      value: null,
    };
    params.push(paramItem1);

    return params;
  }

  private getCategoriesForProductCategories() {
    let params = this.prepareParamsForCategoriesDropdown();
    this._commonHelper.showLoader();
    // get datasource details 
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ADDPRODUCTCATEGORY, params).then(response => {
      this.productCategories = response;
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
      });
  }

  workflowOnChange(e) {
    if (e.value) {
      this.entityWorkflowId = e.value;
      this.getAssignedToUsers(null, 1, null);
      // set record type from selected workflow
      if (this.workflows != null && this.workflows.length > 0) {
        this.selectedWorkflow = this.workflows?.filter(x => x.value == e.value)[0];
      }
      this.assignedToUsers = [];
    } 
  }

  workflowOnClear(e) {
    this.entityWorkflowId = null;
    this.assignedToUsers = [];
  }

   recordTypeOnChange(e) {
    if(e.value) {
      this.entityRecordTypeId = e.value;
      if (this.entityRecordTypeId && this.entityRecordTypeId > 0) {
        this.filteredWorkflows = this.copyOfWorkflows.filter(s => (s.entityRecordTypeID == this.entityRecordTypeId) || s.isDefault);
        if(this.workflows.length == 1)
          {
            let value = this.workflows.find(x=>x.entityRecordTypeID == this.entityRecordTypeId).value;
             
            this.productForm.controls['entityWorkflowId'].patchValue(value);
            this.productForm.controls['entityWorkflowId'].updateValueAndValidity();
          }
      }
      this.assignedToUsers = [];
     }
  }

  recordTypeOnClear(e) {
    this.entityWorkflowId = null;
      this.entityRecordTypeId = null;
      this.filteredWorkflows = [];
      var data = this.workflows?.filter(z => z.entityRecordTypeID == null);
      this.filteredWorkflows.push(data[0]);
      if(!this.selectedWorkflow?.isDefault) {
        this.assignedToUsers = [];
      }
      this.assignedToUsers.concat(this.copyOfAssignedTo);
  }

  //save product
  saveProduct(formData) {
    this.submitted = true;
    if (this.productForm.invalid) {
      this.validateAllFormFields(this.productForm);
      return;
    }
    //empty custom fields
    var customFields: any = {};

    if(this.isShowWorkflow) {
      this.entityWorkflowId = null;
    }
    
    //prepare params
    let params = {
      id: 0,
      tenantId: 0,
      name: formData.name,
      productCategoryIds: formData.productCategoryId ? formData.productCategoryId.join(',') : null,
      code: formData.code,
      stockQty: formData.stockQty,
      uomId: formData.uomId,
      price: formData.price,
      description: formData.description,
      assignedTo: formData.assignedTo,
      entityRecordTypeId: formData.entityRecordTypeId || this.entityRecordTypeId,
      entityWorkflowId: formData.entityWorkflowId || this.entityWorkflowId,
    }

    this._commonHelper.showLoader();
    // save product
    this._productService.updateProduct(params).then((response) => {
      let product: any = response;
      if (this.isFromSameEntity) {
        this._ngbActiveModal.close(product.id);
      } else {
        this._ngbActiveModal.close(product);
      }

      if (!this.isShowAccountProductControls) {
        this._commonHelper.hideLoader();
        this._ngbActiveModal.close(product);
      } else {

        // let accountProduct = {
        //   id: 0,
        //   productId: product.id,
        //   accountId: this.accountId,
        //   startDate: formData.startDate != null ? moment(formData?.startDate).format('YYYY-MM-DD') : formData?.startDate,
        //   endDate: formData?.endDate != null ? moment(formData?.endDate).format('YYYY-MM-DD') : formData?.endDate
        // }

        // this._accountService.saveAccountProducts(accountProduct).then(response => {
        //   this._commonHelper.hideLoader();
        //   this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDPRODUCT.MESSAGE_ADD_RELATEDPRODUCT_SUCCESS'));
        //   this._ngbActiveModal.close(true);
        // }, (error) => {
        //   this._commonHelper.hideLoader();
        //   this.getAccountProducTranslateErrorMessage(error);
        // });
      }

    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  assignedToOnFilter(e) {
    this.getAssignedToUsers(e.value, 0, e.filter);
  }

  assignedToOnChange(e) {
    if (!e.value) {
      this.getAssignedToUsers(e.value, 1, null);
    }
  }
  //for close form
  onCloseForm(status: boolean) {
    if (this.isFromSameEntity) {
      this._ngbActiveModal.close(status);
    } else {
      this._ngbActiveModal.close();
    }
  }

  getAccountProducTranslateErrorMessage(error) {
    if (error && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'accounts.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.' + error.messageCode.replaceAll('.', '_').toUpperCase())
        );
      }
    }
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('PRODUCTS.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
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
}
