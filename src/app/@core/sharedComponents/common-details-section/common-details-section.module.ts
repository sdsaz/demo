import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonDetailsSectionComponent } from './common-details-section.component';
import { EntityTagsViewModule } from '../entity-tags-view/entity-tags-view.module';
import { ShowHidePencilButtonModule } from "../../pipes/show-hide-pencil-button/show-hide-pencil-button.module";
import { MultiSelectModule } from 'primeng/multiselect';
import { TranslateModule } from '@ngx-translate/core';
import { ConfiguredEntityNamePipeModule } from "../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module";
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { WorkflowmanagementService } from '../../../pages/workflowmanagement/workflowmanagement.service';
import { RouterModule } from '@angular/router';
import { KeyFieldRenderModule } from '../../sharedModules/key-field-render/key-field-render.module';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { HasPermissionPipeModule } from '../../pipes/has-permission-pipe/has-permission-pipe.module';
import { EntityReviewDisplayModule } from '../entity-review-display/entity-review-display.module';
import { EntityBookmarkModule } from '../entity-bookmark/entity-bookmark.module';

@NgModule({
  declarations: [
    CommonDetailsSectionComponent
  ],
  exports: [
    CommonDetailsSectionComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    EntityTagsViewModule,
    ShowHidePencilButtonModule,
    MultiSelectModule,
    TranslateModule,
    ConfiguredEntityNamePipeModule,
    FormsModule,
    ReactiveFormsModule,
    KeyFieldRenderModule,
    NgbTooltipModule,
    HasPermissionPipeModule,
    EntityReviewDisplayModule,
    EntityBookmarkModule
  ],
  providers: [
    WorkflowmanagementService
  ]
})
export class CommonDetailsSectionModule { }
