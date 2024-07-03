//angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
//common
import { enumPermissions } from '../../../@core/common-helper';
import { EntityTagsViewModule } from '../../../@core/sharedComponents/entity-tags-view/entity-tags-view.module';
import { DynamicComponentModule } from '../../../@core/sharedComponents/dynamic-component/dynamic-component.module';
import { CustomFieldRenderModule } from '../../../@core/sharedModules/custom-field-render/custom-field-render.module';
import { ShowHidePencilButtonModule } from '../../../@core/pipes/show-hide-pencil-button/show-hide-pencil-button.module';
import { RemoveWhiteSpaceModule } from '../../../@core/pipes/remove-white-space/remove-white-space.module';
import { GlobleNavTabModule } from '../../../@core/sharedComponents/globle-nav-tab/globle-nav-tab.module';
import { ControlLevelLoadingBarModule } from '../../../@core/sharedComponents/control-level-loading-bar/control-level-loading-bar.module';
import { HistoryTabModule } from '../../../@core/sharedComponents/history-tab/history-tab.module';
import { EntityReviewDisplayModule } from '../../../@core/sharedComponents/entity-review-display/entity-review-display.module';
import { ConfiguredEntityNamePipeModule } from '../../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { DateFormatPipeModule } from '../../../@core/pipes/date-format-pipe/date-format-pipe.module';
import { CommonActivitySectionModule } from '../../../@core/sharedComponents/common-activity-section/common-activity-section.module';
import { DisplayValueFinderModule } from '../../../@core/pipes/display-value-finder/display-value-finder.module';
import { TrimValueModule } from '../../../@core/sharedDirective/trim-value/trim-value.module';
import { CommaSeperatorValueModule } from '../../../@core/pipes/comma-seperator-value/comma-seperator-value.module';
import { ActivePipeModule } from '../../../@core/pipes/active-pipe/active-pipe-module';
import { EntityDocumentsModule } from '../../../@core/sharedModules/entity-documents/entity-documents.module';
//components
import { ProductskuDetailComponent } from './productsku-detail/productsku-detail.component';
import { AddSkuAssemblyComponent } from './add-sku-assembly/add-sku-assembly.component';
import { ProductskuAddComponent } from './productsku-add/productsku-add.component';
//service
import { ProductsService } from '../products.service';
//other
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
//primeng
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';


const routes: Routes = [
  {
    path: 'details/:id',
    component: ProductskuDetailComponent,
    data: { permission: enumPermissions.ViewProductSku }
  }
];

@NgModule({
  declarations: [
    ProductskuDetailComponent,
    AddSkuAssemblyComponent,
    ProductskuAddComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    PaginatorModule,
    TranslateModule,
    NgbModule,
    DateFormatPipeModule,
    NgxMaskDirective, NgxMaskPipe,
    CommonActivitySectionModule,
    RouterModule.forChild(routes),
    ButtonModule,
    CustomFieldRenderModule,
    DynamicComponentModule,
    ConfiguredEntityNamePipeModule,
    RemoveWhiteSpaceModule,
    DisplayValueFinderModule,
    TrimValueModule,
    DropdownModule,
    CommaSeperatorValueModule,
    ActivePipeModule,
    EntityTagsViewModule,
    ShowHidePencilButtonModule,
    GlobleNavTabModule,
    ControlLevelLoadingBarModule,
    HistoryTabModule,
    EntityReviewDisplayModule,
    EntityDocumentsModule
  ],
  providers: [ProductsService, provideNgxMask({})]
})
export class ProductskuModule { }
