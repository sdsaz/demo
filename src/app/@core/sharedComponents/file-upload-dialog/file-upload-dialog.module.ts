//#region Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
//#endregion

//#region Third Party Modules
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
//#endregion

//#region  Custom Components
import { FileUploadDialogComponent } from './file-upload-dialog.component';
//#endregion

@NgModule({
  declarations: [
    FileUploadDialogComponent    
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    TableModule,
    DropdownModule
  ]
})
export class FileUploadDialogModule { }
