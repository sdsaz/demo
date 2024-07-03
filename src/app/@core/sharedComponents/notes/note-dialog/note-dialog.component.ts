import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../common-helper';
import { Note } from '../note.model';
import { NoteService } from '../notes.service';

@Component({
  selector: 'note-dialog',
  templateUrl: './note-dialog.component.html',
  styleUrls: ['./note-dialog.component.scss']
})
export class NoteDialogComponent implements OnInit {

  @ViewChild('description', { static: false }) descriptionRef: ElementRef;
  //note form
  noteForm: UntypedFormGroup;
  note: Note;

  //user detail
  _loggedInUser: any;

  //input params
  @Input() noteId: number = 0;
  @Input() entityTypeId: number;
  @Input() entityId: number;
  @Input() entityRecordTypeID: number;

  //save flag
  submitted = false;

  constructor(private _commonHelper: CommonHelper,
    private _ngbActiveModal: NgbActiveModal,
    private _formBuilder: UntypedFormBuilder,
    private _noteService: NoteService) { }

  ngOnInit() {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    //for add note
    if (this.noteId == 0) {
      this.note = new Note({});
      this.note.id = 0;
      this.note.tenantId = this._loggedInUser.tenantId;
      this.note.createdBy = this._loggedInUser.userId;
      this.note.isPrivate = false;
      this.note.entityTypeId = this.entityTypeId;
      this.note.entityId = this.entityId;
      this.note.entityRecordTypeID = this.entityRecordTypeID;

      this.noteForm = this.createdNoteForm();
      setTimeout(() => { this.descriptionRef.nativeElement.focus(); });
    } else if (this.noteId > 0) {
      this.getNoteDetailById(this.noteId);
    }
  }

  getNoteDetailById(noteId) {
    this._commonHelper.showLoader();
    const params = { id: noteId };
    this._noteService.getNoteDetailById(params).then(response => {
      this.note = response as Note;
      this.noteForm = this.createdNoteForm();
      this._commonHelper.hideLoader();
      setTimeout(() => { this.descriptionRef.nativeElement.focus(); });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('ACTIVITY.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      });
  }

  saveNotes(formData) {
    this.submitted = true;
    if (this.noteForm.invalid) {
      this.validateAllFormFields(this.noteForm);
      return;
    }

    //for add new note
    if (this.noteId == 0) {
      this._commonHelper.showLoader();
      this._noteService.addNewNote(formData).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          // 'Note Added Successfully!'
          this._commonHelper.getInstanceTranlationData('ACTIVITY.NOTES.MESSAGE_NOTE_ADD')
        );
        this._ngbActiveModal.close(response);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrError(
            this._commonHelper.getInstanceTranlationData('ACTIVITY.' + error.messageCode.replace('.', '_').toUpperCase())
          );
        });
    }
    //for edit current note
    else if (this.noteId > 0) {
      this._commonHelper.showLoader();
      this._noteService.addNewNote(formData).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('ACTIVITY.NOTES.MESSAGE_NOTE_EDIT')
        );
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


  createdNoteForm(): UntypedFormGroup {
    return this._formBuilder.group({
      id: [this.note.id],
      tenantId: [this.note.tenantId],
      entityTypeId: [this.note.entityTypeId],
      entityId: [this.note.entityId],
      entityRecordTypeID: [this.note.entityRecordTypeID],
      subject: [this.note.subject],
      description: [this.note.description, Validators.compose([Validators.required])],
      isPrivate: [this.note.isPrivate],
      createdBy: [this.note.createdBy]
    });
  }

  //for close form
  public onCloseForm() {
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
}
