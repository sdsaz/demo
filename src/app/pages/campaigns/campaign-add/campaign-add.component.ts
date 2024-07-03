import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../@core/common-helper';
import { Validators, UntypedFormBuilder, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { Campaign } from '../campaign.model';
import { CampaignsService } from '../campaigns.service';
import * as moment from 'moment';

@Component({
  selector: 'ngx-campaign-add',
  templateUrl: './campaign-add.component.html',
  styleUrls: ['./campaign-add.component.scss']
})
export class CampaignAddComponent implements OnInit {

  campaign: Campaign;
  campaignForm: UntypedFormGroup;

  //save Flag
  submitted = false;
  isInitialLoaded = false;
  isDisabled = true;

  formMode: string;

  validation_messages = {
    'name': [
      { type: 'required', message: 'CRM.CAMPAIGN.ADD_DIALOG.NAME_REQUIRED' },
      { type: 'maxlength', message: 'CRM.CAMPAIGN.ADD_DIALOG.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'CRM.CAMPAIGN.ADD_DIALOG.MESSAGE_NAME_MIN' }
    ],
    'description': [
      { type: 'minlength', message: 'CRM.CAMPAIGN.ADD_DIALOG.MESSAGE_DESCRIPTION_MIN' },
      { type: 'maxlength', message: 'CRM.CAMPAIGN.ADD_DIALOG.MESSAGE_DESCRIPTION_MAX' }
    ],
    'startDate': [
      { type: 'required', message: 'CRM.CAMPAIGN.ADD_DIALOG.STARTDATE_REQUIRED' },
    ],
    'endDate': [
      { type: 'required', message: 'CRM.CAMPAIGN.ADD_DIALOG.ENDDATE_REQUIRED' },
    ]
  }

  constructor(private _ngbActiveModal: NgbActiveModal,
    public _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _campaignsService: CampaignsService
  ) { }

  ngOnInit(): void {
    this.formMode = 'ADD';
    this.campaign = new Campaign({});
    this.campaignForm = this.createCampaignForm();
  }

  createCampaignForm(): UntypedFormGroup {
    if (this.formMode == 'ADD') {
      return this._formBuilder.group({
        id: 0,
        tenantId: 0,
        name: [this.campaign.name, Validators.compose([Validators.required ,Validators.maxLength(200),Validators.minLength(2)])],
        description: [this.campaign.description, Validators.compose([Validators.minLength(2), Validators.maxLength(2000)])],
        startDate: [this.campaign.startDate != null ? moment(new Date(this.campaign.startDate)).toDate() : this.campaign.startDate, Validators.compose([Validators.required])],
        endDate: [this.campaign.endDate != null ? moment(new Date(this.campaign.endDate)).toDate() : this.campaign.endDate, Validators.compose([Validators.required])],
      });
    }
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

  saveCampaign(formData) {
    this.submitted = true;
    if (this.campaignForm.invalid) {
      this.validateAllFormFields(this.campaignForm);
      return;
    }

    //prepare params
    let params = {
      id: 0,
      tenantId: 0,
      name: formData.name,
      description: formData.description,
      startDate: formData.startDate != null ? moment(formData.startDate).format('YYYY-MM-DD') : formData.startDate,
      endDate: formData.endDate != null ? moment(formData.endDate).format('YYYY-MM-DD') : formData.endDate,
      isActive: true
    }

    this._commonHelper.showLoader();
    this._campaignsService.saveCampaign(params).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.ADD_DIALOG.SUCCESS_MESSAGE'));
      this._ngbActiveModal.close(true);
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
      if (error.messageCode.toLowerCase() == 'campaigns.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.CAMPAIGN.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }

}
