import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { EntityTagsViewService } from './entity-tags-view.service';
import { EntityTagsViewComponent } from './entity-tags-view/entity-tags-view.component';

@NgModule({
  declarations: [EntityTagsViewComponent],
  imports: [
    CommonModule,
    NgbTooltipModule
  ],
  exports: [EntityTagsViewComponent],
  providers: [EntityTagsViewService]
})
export class EntityTagsViewModule { }
