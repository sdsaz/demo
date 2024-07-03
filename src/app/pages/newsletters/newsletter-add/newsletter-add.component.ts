import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../@core/common-helper';
import { Validators, UntypedFormBuilder, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { Newsletter } from '../newsletter.model';
import { NewslettersService } from '../newsletters.service';

@Component({
  selector: 'ngx-newsletter-add',
  templateUrl: './newsletter-add.component.html',
  styleUrls: ['./newsletter-add.component.scss']
})
export class NewsletterAddComponent implements OnInit {


  newsletter: Newsletter;
  newsletterForm: UntypedFormGroup;

  //save Flag
  submitted = false;
  isInitialLoaded = false;
  isDisabled = true;

  formMode: string;

  validation_messages = {
    'name': [
      { type: 'required', message: 'CRM.NEWSLETTER.ADD_DIALOG.NAME_REQUIRED' },
      { type: 'maxlength', message: 'CRM.NEWSLETTER.ADD_DIALOG.MESSAGE_NAME_MAX' },
      { type: 'minlength', message: 'CRM.NEWSLETTER.ADD_DIALOG.MESSAGE_NAME_MIN' }
    ],
    'description': [
      { type: 'minlength', message: 'CRM.NEWSLETTER.ADD_DIALOG.MESSAGE_DESCRIPTION_MIN' },
      { type: 'maxlength', message: 'CRM.NEWSLETTER.ADD_DIALOG.MESSAGE_DESCRIPTION_MAX' }
    ]
  }

  constructor(private _ngbActiveModal: NgbActiveModal,
    private _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _newslettersService: NewslettersService
  ) { }

  ngOnInit(): void {
    this.formMode = 'ADD';
    this.newsletter = new Newsletter({});
    this.newsletterForm = this.createNewsletterForm();
  }

  createNewsletterForm(): UntypedFormGroup {
    if (this.formMode == 'ADD') {
      return this._formBuilder.group({
        id: 0,
        tenantId: 0,
        name: [this.newsletter.name, Validators.compose([Validators.required, Validators.maxLength(200), Validators.minLength(2)])],
        description: [this.newsletter.description, Validators.compose([Validators.minLength(2), Validators.maxLength(2000)])]
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

  saveNewsletter(formData) {
    this.submitted = true;
    if (this.newsletterForm.invalid) {
      this.validateAllFormFields(this.newsletterForm);
      return;
    }

    //prepare params
    let params = {
      id: 0,
      tenantId: 0,
      name: formData.name,
      description: formData.description,
      isActive: true
    }

    this._commonHelper.showLoader();
    this._newslettersService.saveNewsletter(params).then(() => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.ADD_DIALOG.SUCCESS_MESSAGE'));
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
      if (error.messageCode.toLowerCase() == 'newsletters.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('CRM.NEWSLETTER.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }

}
