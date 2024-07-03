import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicTableComponent } from './dynamic-table/dynamic-table.component';
import { CommonService } from '../../sharedServices/common.service';
import { DynamicTableVisibleColumnPipeModule } from '../../pipes/dynamic-table-visible-column-pipe/dynamic-table-visible-column-pipe.module';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DynamicTableLinkFormatPipeModule } from '../../pipes/dynamic-table-link-format-pipe/dynamic-table-link-format-pipe.module';
import { RouterModule } from '@angular/router';
import { AvatarModule } from 'ngx-avatar';
import { HasPermissionPipeModule } from '../../pipes/has-permission-pipe/has-permission-pipe.module';
import { PhonePipeModule } from '../../pipes/phone-pipe/phone-pipe.module';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
import { TabLevelLoaderModule } from '../tab-level-loader/tab-level-loader.module';
import { CommonUserProfieModule } from '../common-user-profie/common-user-profie.module';

//CUSTOM PIPE MODULES
import { DateFormatPipeModule } from '../../pipes/date-format-pipe/date-format-pipe.module';
import { CustomPipeModule } from '../../pipes/custom-pipe/custom-pipe.module';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TimeAgoPipeModule } from '../../pipes/timeAgo-pipe/timeAgo-pipe-module';
import { ActivePipeModule } from '../../pipes/active-pipe/active-pipe-module';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { EntityBookmarkModule } from '../entity-bookmark/entity-bookmark.module';
import { ShowHideActionModule } from '../../pipes/show-hide-action/show-hide-action.module';

@NgModule({
  declarations: [
    DynamicTableComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
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
    CommonUserProfieModule,
    TabLevelLoaderModule,
    ConfiguredEntityNamePipeModule,
    EntityBookmarkModule,
    ShowHideActionModule
  ],
  exports: [
    DynamicTableComponent
  ],
  providers: [CommonService, provideNgxMask({})]
})
export class DynamicComponentModule { }
