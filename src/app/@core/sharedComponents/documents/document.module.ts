import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DocumentDialogComponent } from './document-dialog/document-dialog.component';
import { DocumentFormComponent } from './document-form/document-form.component';
import { DocumentListComponent } from './document-list/document-list.component';
import { TranslateModule } from '@ngx-translate/core';
import { DateFormatPipeModule } from '../../pipes/date-format-pipe/date-format-pipe.module';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'ng2-file-upload';
import { DocumentService } from './document.service';
import { FileUploadDialogModule } from '../file-upload-dialog/file-upload-dialog.module';

@NgModule({
    declarations: [
        DocumentDialogComponent,
        DocumentFormComponent,
        DocumentListComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        FileUploadModule,
        DropdownModule,
        DateFormatPipeModule,
        TranslateModule,
        FileUploadDialogModule
    ],
    exports: [
        DocumentFormComponent,
        DocumentListComponent
    ],
    providers: [DocumentService]
})

export class DocumentModule {
}
