//MODULES
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//COMPONENTS
import { DocumentViewerDialogComponent } from './document-viewer-dialog/document-viewer-dialog.component';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { ImageViewerComponent } from './image-viewer/image-viewer.component';
import { CsvViewerComponent } from './csv-viewer/csv-viewer.component';
import { OfficeDocumentViewerComponent } from './office-document-viewer/office-document-viewer.component';

//SERVICES
import { DocumentService } from '../../sharedComponents/documents/document.service';

//DIRECTIVES
import { NoRightClickModule } from '../../sharedDirective/no-right-click/no-right-click.module';
import { PreventPrintWithInspectElementModule } from '../../sharedDirective/prevent-print-with-inspect-element/prevent-print-with-inspect-element.module';
import { PreventScreenshotModule } from '../../sharedDirective/prevent-screenshot/prevent-screenshot.module';

//THIRD PARTY MODULES
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { VideoViewerComponent } from './video-viewer/video-viewer.component';
import { TranslateModule } from '@ngx-translate/core';
import { AudioViewerComponent } from './audio-viewer/audio-viewer.component';
@NgModule({
  declarations: [
    DocumentViewerDialogComponent,
    PdfViewerComponent,
    ImageViewerComponent,
    CsvViewerComponent,
    OfficeDocumentViewerComponent,
    VideoViewerComponent,
    AudioViewerComponent
  ],
  imports: [
    CommonModule,
    PdfViewerModule,
    NgxDocViewerModule,
    NoRightClickModule,
    PreventPrintWithInspectElementModule,
    PreventScreenshotModule,
    TranslateModule
  ],
  exports: [
    DocumentViewerDialogComponent
  ],
  providers:[DocumentService]
})
export class DocumentViewerModule { }
