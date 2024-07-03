import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../../@core/common-helper';
import { DataSources } from '../../../../@core/enum';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { noWhitespaceValidator } from '../../../../@core/sharedValidators/no-whiteSpace.validator';
import { ProductsService } from '../../products.service';
import { ProductCategory } from '../productcategory.model';

@Component({
  selector: 'ngx-productcategory-add',
  templateUrl: './productcategory-add.component.html',
  styleUrls: ['./productcategory-add.component.scss']
})
export class ProductcategoryAddComponent implements OnInit {
 
  @Input() title: string;
  
  @Input() productId: number;
  
  //For productCategory Form
  productCategory: ProductCategory;
  parentCategoryForm: UntypedFormGroup;
  parentProductCategoryList: any = null; //related to entity records
  
  //save Flag
  submitted = false;
  isInitialLoaded = false;
  isDisabled = true;

  formMode: string;
  
  validation_messages = {
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

  constructor(private _ngbActiveModal: NgbActiveModal,
    private _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _dataSourceService: DatasourceService,
    private _productService: ProductsService) { }

  ngOnInit(): void {
    this.formMode = 'ADD';
    this.productCategory = new ProductCategory({});
    Promise.all([
      this.getParentProductCategory()
    ]).then(() => {this.parentCategoryForm = this.createProductCategoryForm();});
  }

  createProductCategoryForm(): UntypedFormGroup { 
    if (this.formMode == 'ADD') {
      return this._formBuilder.group({
        productId:[this.productId],
        parentId: [this.productCategory.parentId],
        name: [this.productCategory.name, Validators.compose([Validators.required ,Validators.maxLength(200),Validators.minLength(2)])],
        code: [this.productCategory.code, Validators.compose([Validators.maxLength(100),Validators.minLength(2)])],
        description:[this.productCategory.description, Validators.compose([Validators.maxLength(2000),Validators.minLength(2)])]
      });
    }
  }
 
  // prepare params for datasource with required fields
  prepareParamsForProductCategoryType(searchString: any) {
    const params = []; 
    const paramItem = {
      name: 'ProductCategoryID',
      type: 'int', 
      value: this.productCategory?.id || 0,
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

  getParentProductCategory() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      // prepare params
      var params = this.prepareParamsForProductCategoryType('');
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ADDPRODUCTPRODUCTCATEGORY, params).then((response: any) => {
        //product category 
        if (response.length != 0) {
          this.parentProductCategoryList = response as [];
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

  //For Form Validate
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


  //save product category
  saveProductCategory(formData) {
    this.submitted = true;
    if (this.parentCategoryForm.invalid) {
      this.validateAllFormFields(this.parentCategoryForm);
      return;
    } 

    //prepare params
    let params = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      productId: formData.productId,
      parentId: formData.parentId  
    }

    this._commonHelper.showLoader();
    //save product category 
    this._productService.saveProductCategory(params).then((response) => {
      this._commonHelper.hideLoader();
      let productCategory: any = response;
      this._ngbActiveModal.close(productCategory.id);
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
      if (error.messageCode.toLowerCase() == 'productcategory.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('PRODUCTCATEGORIES.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }
}
