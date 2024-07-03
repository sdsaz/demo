import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoteDialogComponent } from './note-dialog/note-dialog.component';
import { NoteFormComponent } from './note-form/note-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TrimValueModule } from '../../sharedDirective/trim-value/trim-value.module';
import { ReasonDialogComponent } from './reason-dialog/reason-dialog.component';
import { DropdownModule } from 'primeng/dropdown';
import { TrimModule } from '../../sharedDirective/trim/trim.module';

@NgModule({
  declarations: [
    NoteDialogComponent,
    NoteFormComponent,
    ReasonDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    TrimValueModule,
    DropdownModule,
    TrimModule
  ],
  exports:[
    NoteFormComponent
  ]
})
export class NotesModule { }
