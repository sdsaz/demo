import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { CommonHelper } from '../../../common-helper';
import { Note } from '../note.model';
import { NoteService } from '../notes.service';

@Component({
  selector: 'note-form',
  templateUrl: './note-form.component.html',
  styleUrls: ['./note-form.component.scss']
})
export class NoteFormComponent implements OnInit {

  @ViewChild('description', { static: false }) descriptionRef: ElementRef;

  //user detail
  _loggedInUser: any;

  //Note Form
  noteForm: UntypedFormGroup;
  note: Note;

  //input params
  @Input() noteId: number = 0;
  @Input() entityTypeId: number;
  @Input() entityId: number;
  @Input() uid: number;  
  @Input() entityRecordTypeID: number;
  @Output() isNoteSubmittedToEmit = new EventEmitter<boolean>(); 

  //Save Flag
  submitted = false;

  constructor(private _commonHelper: CommonHelper,
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

  saveNotes(formData) {
    this.submitted = true;
    if (this.noteForm.invalid) {
      this.validateAllFormFields(this.noteForm);
      return;
    }
    this._commonHelper.showLoader();
    this._noteService.addNewNote(formData).then(response => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        // 'Note Added Successfully!'
        this._commonHelper.getInstanceTranlationData('ACTIVITY.NOTES.MESSAGE_NOTE_ADD')
        );
      this.isNoteSubmittedToEmit.emit(true);
      this.submitted = false;
      this.noteForm.reset();
      this.noteForm = this.createdNoteForm();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('ACTIVITY.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      });
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
