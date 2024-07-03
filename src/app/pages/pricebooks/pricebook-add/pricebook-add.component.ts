import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../@core/common-helper';
import { PriceBook } from '../pricebook.model';
import { PricebookService } from '../pricebook.service';
import { DateGreaterThan } from '../../../@core/sharedValidators/date-greater-than.validator';
import * as moment from 'moment';

@Component({
  selector: 'ngx-pricebook-add',
  templateUrl: './pricebook-add.component.html',
  styleUrls: ['./pricebook-add.component.scss']
})
export class PricebookAddComponent implements OnInit {
  //For Product Form
  priceBook: PriceBook;
  priceBookForm: FormGroup;

  entityRecordTypes: any;

  title: string = this._commonHelper.getConfiguredEntityName(this._commonHelper.getInstanceTranlationData('PRICEBOOKS.ADD_DIALOG.TITLE'));
  copyPriceBookID: number = 0;

  //save Flag
  submitted = false;
  isDisabled = true;

  validation_messages = {
    'name': [
      { type: 'required', message: 'PRICEBOOKS.ADD_DIALOG.NAME_REQUIRED' },
      { type: 'maxlength', message: 'PRICEBOOKS.ADD_DIALOG.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'PRICEBOOKS.ADD_DIALOG.MESSAGE_NAME_MIN' }
    ],
    'description': [
      { type: 'maxlength', message: 'PRICEBOOKS.ADD_DIALOG.MESSAGE_DESCRIPTION_MAX' },
      { type: 'minlength', message: 'PRICEBOOKS.ADD_DIALOG.MESSAGE_DESCRIPTION_MIN' }
    ],
    'startDate': [
      { type: 'required', message: 'PRICEBOOKS.ADD_DIALOG.START_DATE_REQUIRED' }
    ],
    'endDate': [
      { type: 'dateGreaterThan', message: 'PRICEBOOKS.ADD_DIALOG.END_DATE_GREATERTHAN_STARTDATE' }
    ]
  }
  constructor(
    private _ngbActiveModal: NgbActiveModal,
    public _commonHelper: CommonHelper,
    private _formBuilder: FormBuilder,
    private _priceBookService: PricebookService
  ) { }

  ngOnInit(): void {
    this.priceBook = new PriceBook({});
    this.priceBookForm = this.createPriceBookForm();
  }

  createPriceBookForm(): FormGroup {
    return this._formBuilder.group({
      id: 0,
      tenantId: 0,
      name: [this.priceBook.name, Validators.compose([Validators.required, Validators.maxLength(500), Validators.minLength(2)])],
      description: [this.priceBook.description, Validators.compose([Validators.maxLength(2000), Validators.minLength(2)])],
      startDate: [this.priceBook.startDate, Validators.required],
      endDate: [this.priceBook.endDate]
    },
      {
        validator: DateGreaterThan('endDate', 'startDate')
      });
  }

  //save priceBook
  savePriceBook(formData) {
    this.submitted = true;
    if (this.priceBookForm.invalid) {
      this._commonHelper.validateAllFormFields(this.priceBookForm);
      return;
    }
    //prepare params
    let params: any = {
      id: 0,
      tenantId: 0,
      name: formData.name,
      description: formData.description,
      startDate: formData.startDate != null ? moment(formData?.startDate).format('YYYY-MM-DD') : formData?.startDate,
      endDate: formData?.endDate != null ? moment(formData?.endDate).format('YYYY-MM-DD') : formData?.endDate
    }

    this._commonHelper.showLoader();

    if (this.copyPriceBookID <= 0) {
      this._priceBookService.savePriceBook(params).then((response: any) => {
        this._commonHelper.hideLoader();       
        this.handleSavePriceBookResponse(response);
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    } else {
      params.copyPriceBookID = this.copyPriceBookID;
      this._priceBookService.copyPriceBook(params).then((response: any) => {
        this._commonHelper.hideLoader();       
        this.handleSavePriceBookResponse(response);
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
  }

  //for close form
  onCloseForm(status: boolean) {
    this._ngbActiveModal.close(status);
  }

  //#region Private Methods

  private handleSavePriceBookResponse(response: any): void {
    let priceBookId: number = 0;

    if (response && response != '') {
      priceBookId = response?.id;
    }
    this._ngbActiveModal.close(priceBookId);
  }
  
  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('PRICEBOOKS.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }

  //#endregion Private Methods
}
