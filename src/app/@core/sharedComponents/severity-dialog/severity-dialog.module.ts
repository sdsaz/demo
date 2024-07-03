import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeverityDialogComponent } from './severity-dialog.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  declarations: [
    SeverityDialogComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    NgbModule,
  ]
})
export class SeverityDialogModule { }
