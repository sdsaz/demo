import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../common-helper';
import { Note } from '../note.model';
import { NoteService } from '../notes.service';
import { DatasourceService } from '../../../sharedServices/datasource.service';

@Component({
  selector: 'reason-dialog',
  templateUrl: './reason-dialog.component.html',
  styleUrls: ['./reason-dialog.component.scss']
})
export class ReasonDialogComponent implements OnInit {

  @ViewChild('stageReason', { static: false }) stageReasonRef: ElementRef;
  //note form
  noteForm: UntypedFormGroup;
  note: Note;
  stagereasons: any;
  isDescriptionShow: boolean = false;

  //user detail
  _loggedInUser: any;

  //input params
  @Input() entityTypeId: number;
  @Input() entityId: number;
  @Input() entityRecordTypeID: number;
  @Input() noteSubject: string = '';
  @Input() entityWorkflowId: number;
  @Input() stageId: number;
  @Input() dataSourceCode: string;
  @Input() isSaveNote: boolean = true;

  //save flag
  submitted = false;

  constructor(private _commonHelper: CommonHelper,
    private _ngbActiveModal: NgbActiveModal,
    private _formBuilder: UntypedFormBuilder,
    private _noteService: NoteService,
    private _dataSourceService: DatasourceService) { }

  ngOnInit() {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();
    this.bindStageReasons();
    //for add note
    this.note = new Note({});
    this.note.id = 0;
    this.note.tenantId = this._loggedInUser.tenantId;
    this.note.createdBy = this._loggedInUser.userId;
    this.note.isPrivate = false;
    this.note.entityTypeId = this.entityTypeId;
    this.note.entityId = this.entityId;
    this.note.entityRecordTypeID = this.entityRecordTypeID;
    this.note.subject = this.noteSubject;

    this.noteForm = this.createdNoteForm();
    setTimeout(() => { this.stageReasonRef?.nativeElement.focus(); });
  }

  showHideDescription(formData) {
    let other = this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.OTHER_REASON');
    if (formData.stagereason.label === other) {
      this.isDescriptionShow = true;
      this.noteForm.get('description').setValidators([Validators.required]);
      this.noteForm.get('description').updateValueAndValidity();
    }
    else {
      this.isDescriptionShow = false;
      this.noteForm.get('description').clearValidators();
      this.noteForm.get('description').updateValueAndValidity();
    }
  }

  saveNotes(formData) {
    this.submitted = true;
    if (this.noteForm.invalid) {
      this.validateAllFormFields(this.noteForm);
      return;
    }

    let other = this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.OTHER_REASON');
    if (formData.stagereason && formData.stagereason.label !== other) {
      formData.description = formData.stagereason.label;
    }
    else{
      formData.description = this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.NOTE_REASON_PRETEXT') + ': ' + formData.description;
    }

    if (!this.isSaveNote) {
      this._ngbActiveModal.close({
        description: formData.description,
        subject: this.noteSubject
      });
    }
    else {
      this._commonHelper.showLoader();
      this._noteService.addNewNote(formData).then(response => {
        this._commonHelper.hideLoader();
        this._ngbActiveModal.close(response);
      },
      (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('ACTIVITY.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      });
    }
  }

  //for close form
  onCloseForm() {
    this._ngbActiveModal.close();
  }

  // convenience getter for easy access to form fields
  get f() { return this.noteForm.controls; }
  validateAllFormFields(formGroup: UntypedFormGroup): void {
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

  private createdNoteForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.note.id],
      tenantId: [this.note.tenantId],
      entityTypeId: [this.note.entityTypeId],
      entityId: [this.note.entityId],
      entityRecordTypeID: [this.note.entityRecordTypeID],
      subject: [this.note.subject],
      stagereason: [this.note.description],
      description: [this.note.description],
      isPrivate: [this.note.isPrivate],
      createdBy: [this.note.createdBy]
    });
  }

  private prepareParamsForStageReasons() {
    const params = [];
    const paramItem = {
      name: 'EntityWorkflowId',
      type: 'int',
      value: this.entityWorkflowId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'StageId',
      type: 'int',
      value: this.stageId
    };
    params.push(paramItem1);

    return params;
  }

  private bindStageReasons() {
    this._commonHelper.showLoader();
    let params = this.prepareParamsForStageReasons();
    this._dataSourceService.getDataSourceDataByCodeAndParams(this.dataSourceCode, params).then((response: any) => {
      if (response.length > 0) {
        this.noteForm.get('stagereason').setValidators([Validators.required]);
        this.noteForm.get('stagereason').updateValueAndValidity();
        this.stagereasons = response;
        this.stagereasons.push({ label: this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.OTHER_REASON') });
      }
      else {
        this.noteForm.get('stagereason').clearValidators();
        this.noteForm.get('stagereason').updateValueAndValidity();
        this.isDescriptionShow = true;
        this.noteForm.get('description').setValidators([Validators.required]);
        this.noteForm.get('description').updateValueAndValidity();
      }
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      }
    );
  }

  private getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('WORKTASK.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }
}
