import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../common-helper';
import { EntityReviewsService } from '../entity-reviews.service';

@Component({
  selector: 'ngx-entity-review-dialog',
  templateUrl: './entity-review-dialog.component.html',
  styleUrls: ['./entity-review-dialog.component.scss']
})
export class EntityReviewDialogComponent implements OnInit {
 //input params
 @Input() entityReviewId: number = 0;
 @Input() entityTypeId: number;
 @Input() entityId: number;
 @Input() rating: number;

 entityReviewDetails: any;
 entityReviewForm: UntypedFormGroup;

 submitted = false;

 // convenience getter for easy access to form fields
 get f() { return this.entityReviewForm.controls; }

 constructor(private _commonHelper: CommonHelper,
   private _ngbActiveModal: NgbActiveModal,
   private _formBuilder: UntypedFormBuilder,
   private _entityReviewsService: EntityReviewsService) { }

 ngOnInit() {
   if (this.entityReviewId != null && this.entityReviewId > 0) {
     this.getEntityReviewDetailsById();
   }
   else {
     this.entityReviewDetails = {
       id: 0,
       entityTypeID: this.entityTypeId,
       entityID: this.entityId,
       rating: this.rating,
       reviewComment: null
     }
     this.entityReviewForm = this.createEntityReviewForm();
   }
 }

 public onCloseForm() {
   this._ngbActiveModal.close();
 }

 public saveEntityReview(formData) {
   this.submitted = true;
   if (this.entityReviewForm.invalid) {
     this.validateAllFormFields(this.entityReviewForm);
     return;
   }
   
   this._commonHelper.showLoader();
   this._entityReviewsService.saveEntityReview(formData).then(response => {
     this._commonHelper.hideLoader();
     this._commonHelper.showToastrSuccess(
       this.entityReviewId != null && this.entityReviewId > 0 ? this._commonHelper.getInstanceTranlationData('ACTIVITY.ENTITYREVIEWS.MESSAGE_ENTITYREVIEW_EDIT') : this._commonHelper.getInstanceTranlationData('ACTIVITY.ENTITYREVIEWS.MESSAGE_ENTITYREVIEW_ADD')
     );
     this._ngbActiveModal.close(response);
   },
     (error) => {
       this._commonHelper.hideLoader();
       this.getTranslateErrorMessage(error);
     });
 }

 private createEntityReviewForm(): UntypedFormGroup {
   return this._formBuilder.group({
     id: [this.entityReviewDetails.id],
     entityTypeId: [this.entityReviewDetails.entityTypeID],
     entityId: [this.entityReviewDetails.entityID],
     rating: [this.entityReviewDetails.rating, Validators.compose([Validators.required])],
     reviewComment: [this.entityReviewDetails.reviewComment]
   });
 }

 private getEntityReviewDetailsById() {
   return new Promise((resolve, reject) => {
     this._commonHelper.showLoader();
     this._entityReviewsService.getEntityReviewDetailsById(this.entityReviewId).then(response => {
       if (response) {
         this.entityReviewDetails = response;
       }
       else {
         this.entityReviewId = null;
       }
       this.entityReviewForm = this.createEntityReviewForm();
       this._commonHelper.hideLoader();
       resolve(null);
     }, (error) => {
       this._commonHelper.hideLoader();
       this.getTranslateErrorMessage(error);
       reject(null);
     }).catch(() => {
       resolve(null);
     });
   });
 }

 private validateAllFormFields(formGroup: UntypedFormGroup): void {
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
   if (error?.messageCode) {
     this._commonHelper.showToastrError(
       this._commonHelper.getInstanceTranlationData('ACTIVITY.ENTITYREVIEWS.' + error.messageCode.replaceAll('.', '_').toUpperCase())
     );
   }
 }
}
