import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DueDateDialogComponent } from './due-date-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CalendarModule } from 'primeng/calendar';
import { DateMaskModule } from '../../sharedDirective/date-mask/date-mask.module'



@NgModule({
  declarations: [
    DueDateDialogComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    CalendarModule,
    DateMaskModule
  ]
})
export class DueDateDialogModule { }
