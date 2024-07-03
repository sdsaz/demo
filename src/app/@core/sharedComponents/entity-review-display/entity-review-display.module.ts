import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntityReviewDisplayComponent } from './entity-review-display/entity-review-display.component';
import { RatingModule } from 'primeng/rating';
import { DatasourceService } from '../../sharedServices/datasource.service';
import { SkeletonModule } from 'primeng/skeleton';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    EntityReviewDisplayComponent
  ],
  imports: [
    CommonModule,
    RatingModule,
    SkeletonModule,
    NgbTooltipModule,
    TranslateModule,
  ],
  providers: [
    DatasourceService
  ],
  exports: [
    EntityReviewDisplayComponent
  ]
})
export class EntityReviewDisplayModule { }
