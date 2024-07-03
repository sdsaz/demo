import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntityDocumentsComponent } from './entity-documents/entity-documents.component';
import { DocumentsTableComponent } from './documents-table/documents-table.component';
import { TableModule } from 'primeng/table';
import { TranslateModule } from '@ngx-translate/core';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonUserProfieModule } from '../../sharedComponents/common-user-profie/common-user-profie.module';
import { DateFormatPipeModule } from '../../pipes/date-format-pipe/date-format-pipe.module';
import { ButtonModule } from 'primeng/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TabLevelLoaderModule } from '../../sharedComponents/tab-level-loader/tab-level-loader.module';
import { CustomFieldRenderModule } from '../custom-field-render/custom-field-render.module';
import { FileUploadModule } from 'ng2-file-upload';
import { DynamicComponentModule } from '../../sharedComponents/dynamic-component/dynamic-component.module';
import { TrimValueModule } from '../../sharedDirective/trim-value/trim-value.module';
import { DropdownModule } from 'primeng/dropdown';
import { GetFileNameOrExtensionPipeModule } from '../../pipes/get-file-extension/get-file-name-or-extension-pipe.module';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ControlLevelLoadingBarModule } from '../../sharedComponents/control-level-loading-bar/control-level-loading-bar.module';
import { CarouselModule } from '../carousel/carousel.module';
import { FileUploadDialogModule } from '../../sharedComponents/file-upload-dialog/file-upload-dialog.module';

@NgModule({
  declarations: [
    EntityDocumentsComponent,
    DocumentsTableComponent
  ],
  imports: [
    CommonModule,
    TableModule,
    TranslateModule,
    ConfiguredEntityNamePipeModule,
    NgbModule,
    CommonUserProfieModule,
    DateFormatPipeModule,
    ButtonModule,
    FormsModule,
    TabLevelLoaderModule,
    ReactiveFormsModule,
    CustomFieldRenderModule,
    FileUploadModule,
    DynamicComponentModule,
    TrimValueModule,
    DropdownModule,
    GetFileNameOrExtensionPipeModule,
    NgbTooltipModule,
    ControlLevelLoadingBarModule,
    CarouselModule,
    FileUploadDialogModule
  ],
  exports:[
    EntityDocumentsComponent,
    DocumentsTableComponent
  ]
})
export class EntityDocumentsModule { }
