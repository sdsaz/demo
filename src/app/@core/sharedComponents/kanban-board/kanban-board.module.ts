import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StagesComponent } from './stages/stages.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AvatarModule } from 'ngx-avatar';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { PhonePipeModule } from '../../pipes/phone-pipe/phone-pipe.module';
import { NgxMaskDirective } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { DateFormatPipeModule } from '../../pipes/date-format-pipe/date-format-pipe.module';
import { DisplayValueFinderModule } from '../../pipes/display-value-finder/display-value-finder.module';
import { CommonUserProfieModule } from '../common-user-profie/common-user-profie.module';
import { TranslateModule } from '@ngx-translate/core';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { IsEntityFieldHiddenModule } from '../../pipes/is-entity-field-hidden/is-entity-field-hidden.module';
import { EntityReviewDisplayModule } from '../entity-review-display/entity-review-display.module';
import { EntityBookmarkModule } from '../entity-bookmark/entity-bookmark.module';


@NgModule({
  declarations: [
    StagesComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    NgbTooltipModule,
    MultiSelectModule,
    AvatarModule,
    PhonePipeModule,
    NgxMaskDirective, NgxMaskPipe,
    DateFormatPipeModule,
    DisplayValueFinderModule,
    CommonUserProfieModule,
    TranslateModule,
    ConfiguredEntityNamePipeModule,
    IsEntityFieldHiddenModule,
    EntityReviewDisplayModule,
    EntityBookmarkModule
  ],
  providers:[provideNgxMask({})],
  exports: [
    StagesComponent
  ]
})
export class KanbanBoardModule { }
