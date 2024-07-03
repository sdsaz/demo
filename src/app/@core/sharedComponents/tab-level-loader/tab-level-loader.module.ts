//ANGULAR MODULE
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

//THIRD PARTY PACAKGES
import { SkeletonModule } from 'primeng/skeleton';

//COMPONENTS
import { TabLevelLoaderComponent } from './tab-level-loader.component';

//DIRECTIVES MODULE
import { NoRightClickModule } from '../../sharedDirective/no-right-click/no-right-click.module';
import { PreventPrintWithInspectElementModule } from '../../sharedDirective/prevent-print-with-inspect-element/prevent-print-with-inspect-element.module';
import { PreventScreenshotModule } from '../../sharedDirective/prevent-screenshot/prevent-screenshot.module';


@NgModule({
  declarations: [
    TabLevelLoaderComponent
  ],
  imports: [
    CommonModule,
    SkeletonModule,
    NoRightClickModule,
    PreventPrintWithInspectElementModule,
    PreventScreenshotModule
  ],
  exports: [
    TabLevelLoaderComponent
  ]
})
export class TabLevelLoaderModule { }
