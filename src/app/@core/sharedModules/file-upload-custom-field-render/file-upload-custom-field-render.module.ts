import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//COMPONENTS
import { FileUploadCustomFieldComponent } from './file-upload-custom-field/file-upload-custom-field.component';
import { CustomFileUploadDialogComponent } from './custom-file-upload-dialog/custom-file-upload-dialog.component';

//CUSTOM MODULES
import { CustomFieldRenderModule } from '../custom-field-render/custom-field-render.module';
import { DynamicComponentModule } from '../../sharedComponents/dynamic-component/dynamic-component.module';
import { TrimValueModule } from '../../sharedDirective/trim-value/trim-value.module';

//THIRD PARTY MODULES
import { FileUploadModule } from 'ng2-file-upload';
import { TranslateModule } from '@ngx-translate/core';

//PRIMENG
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';


@NgModule({
    declarations: [
        FileUploadCustomFieldComponent,
        CustomFileUploadDialogComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CustomFieldRenderModule,
        FileUploadModule,
        TranslateModule,
        DynamicComponentModule,
        TrimValueModule,
        DropdownModule,
        TableModule
    ],
    exports: [
        FileUploadCustomFieldComponent
    ]
})
export class FileUploadCustomFieldRenderModule { }
