//#region Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
//#endregion

//#region Custom Component
import { CarouselComponent } from './carousel/carousel.component';
//#endregion

//#region Custom Modules
import { DocumentViewerModule } from '../document-viewer/document-viewer.module';
//#endregion

//#region Custom Directive Module
import { NoRightClickModule } from '../../sharedDirective/no-right-click/no-right-click.module';
import { PreventPrintWithInspectElementModule } from '../../sharedDirective/prevent-print-with-inspect-element/prevent-print-with-inspect-element.module';
import { PreventScreenshotModule } from '../../sharedDirective/prevent-screenshot/prevent-screenshot.module';
//#endregion

//#region Third Party Modules
import { TranslateModule } from '@ngx-translate/core';
//#endregion

@NgModule({
  declarations: [
    CarouselComponent
  ],
  imports: [
    CommonModule,
    DocumentViewerModule,
    TranslateModule,
    NoRightClickModule,
    PreventPrintWithInspectElementModule,
    PreventScreenshotModule
  ],
  exports: [
    CarouselComponent
  ]
})
export class CarouselModule { }
