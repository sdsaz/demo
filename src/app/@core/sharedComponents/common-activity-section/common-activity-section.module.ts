// ANGULAR
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

//THIRD PARTY MODULES
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { TranslateModule } from '@ngx-translate/core';
import { AvatarModule } from 'ngx-avatar';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ButtonModule } from 'primeng/button';

//COMPONENTS
import { ActivityDialogComponent } from './activity-dialog/activity-dialog.component';
import { ActivitySectionComponent } from './activity-section/activity-section.component';

//CUSTOM MODULES
import { NotesModule } from '../notes/notes.module';
import { DateFormatPipeModule } from '../../pipes/date-format-pipe/date-format-pipe.module';
import { TimeAgoPipeModule } from '../../pipes/timeAgo-pipe/timeAgo-pipe-module';
import { DocumentModule } from '../documents/document.module';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { DateMaskModule } from '../../sharedDirective/date-mask/date-mask.module';
import { DocumentViewerModule } from '../../sharedModules/document-viewer/document-viewer.module';
import { CommonDetailsSectionModule } from '../common-details-section/common-details-section.module';
import { EntityNotificationModule } from '../entity-notification/entity-notification.module';
import { CharacterLimitModule } from '../../pipes/character-limit/character-limit.module';
import { EntityReviewModule } from '../entity-review/entity-review.module';
import { RatingModule } from 'primeng/rating';
import { CommonUserProfieModule } from '../common-user-profie/common-user-profie.module';
import { GetFileNameOrExtensionPipeModule } from '../../pipes/get-file-extension/get-file-name-or-extension-pipe.module';
import { CarouselModule } from '../../sharedModules/carousel/carousel.module';
import { FileUploadDialogModule } from '../file-upload-dialog/file-upload-dialog.module';
import { ControlLevelLoadingBarModule } from '../control-level-loading-bar/control-level-loading-bar.module';
import { TrimValueModule } from '../../sharedDirective/trim-value/trim-value.module';

@NgModule({
  declarations: [
    ActivitySectionComponent,
    ActivityDialogComponent
  ],
  imports: [
    TranslateModule,
    CommonModule,
    AvatarModule,
    DropdownModule,
    ButtonModule,
    MultiSelectModule,
    CalendarModule,
    FormsModule,
    ReactiveFormsModule,
    NotesModule,
    DateFormatPipeModule,
    TimeAgoPipeModule,
    DocumentModule,
    NgbTooltipModule,
    ConfiguredEntityNamePipeModule,
    DateMaskModule,
    DocumentViewerModule,
    CommonDetailsSectionModule,
    EntityNotificationModule,
    CharacterLimitModule,
    RatingModule,
    CommonUserProfieModule,
    EntityReviewModule,
    GetFileNameOrExtensionPipeModule,
    CarouselModule,
    FileUploadDialogModule,
    ControlLevelLoadingBarModule,
    TrimValueModule,
  ],
  exports: [
    ActivitySectionComponent
  ]
})
export class CommonActivitySectionModule { }
