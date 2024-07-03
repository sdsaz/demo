import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { CommonHelper } from '../../../../@core/common-helper';
import { Actions, DataSources } from '../../../../@core/enum';
import { ProductsService } from '../../products.service';
import { Dropdown } from 'primeng/dropdown';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'ngx-add-sku-assembly',
  templateUrl: './add-sku-assembly.component.html',
  styleUrls: ['./add-sku-assembly.component.scss']
})
export class AddSkuAssemblyComponent implements OnInit {

  @ViewChild('drpskus') drpSkus: Dropdown;
  
  @Input() title: string;
  @Input() productSkuAssemblyId: number;
  @Input() parentSkuId: number;
  @Input() action: Actions;
  
  skuAssemblyDetail: any;
  skuAssemblyForm: UntypedFormGroup;
  productSKU: any[] = [];
  
  validation_messages = {
    'skuId': [
      { type: 'required', message: 'PRODUCTSKU.DETAIL.ADD_ASSEMBLIES_DIALOG.SKU_REQUIRED' },
    ],
    'quantity': [
      { type: 'maxlength', message: 'PRODUCTSKU.DETAIL.ADD_ASSEMBLIES_DIALOG.PRODUCTSKU_STOCKQTYMAXLENGTH' }
    ],
    'description': [
      { type: 'maxlength', message: 'PRODUCTSKU.DETAIL.ADD_ASSEMBLIES_DIALOG.MESSAGE_DESCRIPTION_MAX' },
      { type: 'minlength', message: 'PRODUCTSKU.DETAIL.ADD_ASSEMBLIES_DIALOG.MESSAGE_DESCRIPTION_MIN' }
    ],
  };

  constructor(private _ngbActiveModal: NgbActiveModal, private _fb: UntypedFormBuilder,
    private _dataSourceService: DatasourceService,
    private _commonHelper: CommonHelper,
    private _productService: ProductsService) { }

  ngOnInit(): void {
    if (this.action == Actions.Add) {
      this.getProductSKU('').then(() => {
        this.skuAssemblyForm = this.createSkuAssemblyForm();
        setTimeout(() => {
          this.setFilter();
        }, 50);
      });
    } else {
        this.getProductSkuAssemblyDetail();
    }
  }

  getProductSkuAssemblyDetail() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._productService.getProductSkuAssemblyById(this.productSkuAssemblyId).then((res: any) => {
        this._commonHelper.hideLoader();
        if (res) {
          this.skuAssemblyDetail = res;
          this.getProductSKU('').then(() => {
            this.skuAssemblyForm = this.editSkuAssemblyForm(this.skuAssemblyDetail);
            setTimeout(() => {
              this.setFilter();
            }, 50);
          });
          resolve(null);
        }
      }, err => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(err);
        reject(null);
      })
    });
  }

  createSkuAssemblyForm() {
    return this._fb.group({
      'id': 0,
      'skuId': [null, [Validators.required]],
      'quantity': [null, Validators.compose([Validators.maxLength(14)])],
      'description': ['', Validators.compose([Validators.maxLength(2000), Validators.minLength(2)])],
      'parentSkuId': [this.parentSkuId]
    })
  }

  editSkuAssemblyForm(assemblyDetail: any) {
    return this._fb.group({
      'id': assemblyDetail.id,
      'skuId': [assemblyDetail.skuID, [Validators.required]],
      'quantity': [assemblyDetail.quantity, Validators.compose([Validators.maxLength(14)])],
      'description': [assemblyDetail.description, Validators.compose([Validators.maxLength(2000), Validators.minLength(2)])],
      'parentSkuId': [assemblyDetail.primarySkuID]
    })
  }


  //for close form
  onCloseForm(status: boolean) {
    this._ngbActiveModal.close(status);
  }

  // get assigned users
  getProductSKU(searchString: string) {

    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();

      // get datasource details
      const params = this.prepareParamsForProductSKUDropdown(searchString);
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.PRODUCTSKU, params).then(response => {

        const skus: any = response as any[];
        
        let groupProducts: any[] = [];

        const distinctProductIds = [...new Set(skus.map(item => item.productID))];
        distinctProductIds.forEach(x => {
          let groupProductsList: any = {
            label: null,
            items: [],
            value: x
          };

          skus.forEach(element => {
            if (element.productID == x) {
              groupProductsList.label = element.productName;
              groupProductsList.items.push({ label: element.sku, value: element.skuID, productName: element.productName });
            }
          });
          groupProducts.push(groupProductsList);
        });

        this.productSKU = groupProducts;
        
        if (this.drpSkus && this.drpSkus.overlayVisible) {
          this.drpSkus.hide();
          if (this.drpSkus.filterViewChild && this.drpSkus.filterViewChild.nativeElement) {
            this.drpSkus.filterValue = searchString;
            this.drpSkus.filterViewChild.nativeElement.value = searchString;
          }
          this.drpSkus.show();
        }
        
        this._commonHelper.hideLoader();
        resolve(null);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrError(error.message);
          reject(null);
        });
    });
  }

  skuFilter(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getProductSKU(e.filter.trim());
      }
    }
    else {
      this.getProductSKU('');
    }
  }

  private prepareParamsForProductSKUDropdown(searchString: string) {
    const params = [];
    const paramItem = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };

    params.push(paramItem);

    const paramItem1 = {
      name: 'SkuID',
      type: 'int',
      value: this.parentSkuId,
    };

    params.push(paramItem1);

    const paramItem2 = {
      name: 'EditSkuID',
      type: 'int',
      value: this.skuAssemblyDetail?.skuID,
    };

    params.push(paramItem2);

    return params;
  }

  saveSkuAssembly() {
    if (this.skuAssemblyForm.invalid) {
      this._commonHelper.validateAllFormFields(this.skuAssemblyForm);
      return;
    }

    //prepare params
    const params = {
      id: this.skuAssemblyForm.value.id,
      primarySkuId: this.skuAssemblyForm.value.parentSkuId,
      skuId: this.skuAssemblyForm.value.skuId,
      quantity: this.skuAssemblyForm.value.quantity,
      description: this.skuAssemblyForm.value.description,
    };

    this._commonHelper.showLoader();
    this._productService.saveUpdateSkuAssembly(params).then(() => {
      if (this.action == Actions.Add) {
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTSKU.DETAIL.ADD_ASSEMBLIES_DIALOG.SUCCESS_ADD_MESSAGE'));
      } else {
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTSKU.DETAIL.ADD_ASSEMBLIES_DIALOG.SUCCESS_EDIT_MESSAGE'));
      }
      this._commonHelper.hideLoader();
      this._ngbActiveModal.close(true);
    }, err => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(err);
      this._ngbActiveModal.close(false);
    });
  }

  private getTranslateErrorMessage(error): void {
    if (error && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('PRODUCTSKU.' + error.messageCode.replaceAll('.', '_').toUpperCase()));
    }
  }

  private setFilter() {
    this.drpSkus.onFilter
      .pipe(debounceTime(500))
      .subscribe((value) => {
        if (value.filter) {
          if (String(value.filter).length > 2) {
            this.getProductSKU(String(value.filter));
          }
        } else {
          this.getProductSKU('');
        }
      });
  }
}
