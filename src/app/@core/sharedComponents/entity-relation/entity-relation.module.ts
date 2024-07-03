import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//COMPONENTS
import { EntityRelationComponent } from './entity-relation/entity-relation.component';
import { AddEntityRelationComponent } from './add-entity-relation/add-entity-relation.component';

//COMMON SERVICES
import { CommonService } from '../../sharedServices/common.service';

//PRIMENG COMPONENTS
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';

//THIRD PARTY MODULES
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { AvatarModule } from 'ngx-avatar';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MultiSelectModule } from 'primeng/multiselect';

//CUSTOM MODULES
import { TabLevelLoaderModule } from '../tab-level-loader/tab-level-loader.module';
import { ControlLevelLoadingBarModule } from '../control-level-loading-bar/control-level-loading-bar.module';
import { CustomFieldRenderModule } from '../../sharedModules/custom-field-render/custom-field-render.module';

//CUSTOM DIRECTIVE
import { TrimValueModule } from '../../sharedDirective/trim-value/trim-value.module';
import { DateMaskModule } from '../../sharedDirective/date-mask/date-mask.module';

//CUSTOM PIPE MODULES
import { DateFormatPipeModule } from '../../pipes/date-format-pipe/date-format-pipe.module';
import { CustomPipeModule } from '../../pipes/custom-pipe/custom-pipe.module';
import { TimeAgoPipeModule } from '../../pipes/timeAgo-pipe/timeAgo-pipe-module';
import { ActivePipeModule } from '../../pipes/active-pipe/active-pipe-module';
import { ShowHideActionModule } from '../../pipes/show-hide-action/show-hide-action.module';
import { HasPermissionPipeModule } from '../../pipes/has-permission-pipe/has-permission-pipe.module';
import { DynamicTableLinkFormatPipeModule } from '../../pipes/dynamic-table-link-format-pipe/dynamic-table-link-format-pipe.module';
import { PhonePipeModule } from '../../pipes/phone-pipe/phone-pipe.module';
import { DynamicTableVisibleColumnPipeModule } from '../../pipes/dynamic-table-visible-column-pipe/dynamic-table-visible-column-pipe.module';

//SERVICES
import { AccountsService } from '../../../pages/accounts/accounts.service';
import { ContactsService } from '../../../pages/contacts/contacts.service';
import { ProductsService } from '../../../pages/products/products.service';

import { CommonUserProfieModule } from '../common-user-profie/common-user-profie.module';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';


@NgModule({
  declarations: [
    EntityRelationComponent,
    AddEntityRelationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    PaginatorModule,
    ButtonModule,
    AvatarModule,
    ActivePipeModule,
    TranslateModule,
    NgbTooltipModule,
    RouterModule,
    DynamicTableVisibleColumnPipeModule,
    DynamicTableLinkFormatPipeModule,
    HasPermissionPipeModule,
    PhonePipeModule,
    NgxMaskDirective, NgxMaskPipe,
    DateFormatPipeModule,
    CustomPipeModule,
    TimeAgoPipeModule,
    TabLevelLoaderModule,
    ShowHideActionModule,
    ControlLevelLoadingBarModule,
    DropdownModule,
    CalendarModule,
    TrimValueModule,
    CustomFieldRenderModule,
    DateMaskModule,
    CommonUserProfieModule,
    ConfiguredEntityNamePipeModule,
    MultiSelectModule
  ], exports: [
    EntityRelationComponent
  ],
  providers: [CommonService, provideNgxMask({}), AccountsService, ContactsService, ProductsService]
})
export class EntityRelationModule { }
