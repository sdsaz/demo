import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../@core/common-helper';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { DateGreaterThan } from '../../../@core/sharedValidators/date-greater-than.validator';
import { AccountsService } from '../accounts.service';
import * as moment from 'moment';

@Component({
  selector: 'ngx-account-product-edit-dialog',
  templateUrl: './account-product-edit-dialog.component.html',
  styleUrls: ['./account-product-edit-dialog.component.scss']
})
export class AccountProductEditDialogComponent implements OnInit {

  @Input() title: string;
  @Input() productId: number;
  @Input() accountId: number;
  @Input() productName: string;
  @Input() description: string;
  @Input() accountProductId: number;
  @Input() accountProductStartDate?: Date;
  @Input() accountProductEndDate?: Date;

  //For Product Form
  productForm: UntypedFormGroup;

  entityRecordTypes: any;

  //save Flag
  submitted = false;
  isLoaded = false;

  validation_messages = {
    'startDate': [
      { type: 'required', message: 'PRODUCTS.ADD_DIALOG.START_DATE_REQUIRED' }
    ],
    'endDate': [
      { type: 'dateGreaterThan', message: 'PRODUCTS.ADD_DIALOG.END_DATE_GREATERTHAN_STARTDATE' }
    ]
  }

  constructor(private _ngbActiveModal: NgbActiveModal,
    public _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _accountsService: AccountsService) { }

  ngOnInit(): void {
    this.productForm = this.createProductForm();
  }

  createProductForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: 0,
      tenantId: 0,
      name: [{ value: this.productName, disabled: true}],
      description: [{value: this.description, disabled: true}],
      startDate: [this.accountProductStartDate, Validators.compose([Validators.required])],
      endDate: [this.accountProductEndDate],
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

  //save product
  saveProduct(formData) {
    this.submitted = true;
    if (this.productForm.invalid) {
      this.validateAllFormFields(this.productForm);
      return;
    }

    // let accountProductResult = {
    //   id: this.accountProductId,
    //   productId: this.productId,
    //   accountId: this.accountId,
    //   startDate: formData?.startDate != null ? moment(formData?.startDate).format('YYYY-MM-DD') : formData?.startDate,
    //   endDate: formData?.endDate != null ? moment(formData?.endDate).format('YYYY-MM-DD') : formData?.endDate
    // }

    // this._commonHelper.showLoader();
    // this._accountsService.saveAccountProducts(accountProductResult).then(response => {
    //   this._commonHelper.hideLoader();
    //   if ((this.accountProductId || 0) > 0) {
    //     this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDPRODUCT.MESSAGE_EDIT_RELATEDPRODUCT_SUCCESS'));
    //   } else {
    //     this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.ACCOUNT.DETAIL.TAB_RELATEDPRODUCT.MESSAGE_ADD_RELATEDPRODUCT_SUCCESS'));
    //   }
    //   this._ngbActiveModal.close(true);
    // }, (error) => {
    //   this._commonHelper.hideLoader();
    //   this.getAccountProducTranslateErrorMessage(error);
    // });

    
  }

  private getAccountProducTranslateErrorMessage(error): void {
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

  //for close form
  onCloseForm(status: boolean) {
    this._ngbActiveModal.close(status);
  }

}
