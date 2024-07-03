import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowAssignDialogComponent } from './workflow-assign-dialog/workflow-assign-dialog.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';



@NgModule({
  declarations: [
    WorkflowAssignDialogComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    NgbModule
  ]
})
export class WorkflowAssignDialogModule { }
