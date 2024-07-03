//Angular
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

//Components
import { TimelineComponent } from './timeline.component';

//Custom Modules
import { CommonUserProfieModule } from '../../sharedComponents/common-user-profie/common-user-profie.module';
import { EntityReviewModule } from '../../sharedComponents/entity-review/entity-review.module';

//ThirdParty Modules
import { NgbModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

//Custom Pipes
import { SortByPipeModule } from '../../pipes/sort-by-pipe/sort-by-pipe.module';

//Services
import { DatasourceService } from '../../sharedServices/datasource.service';
import { HasPermissionPipeModule } from '../../pipes/has-permission-pipe/has-permission-pipe.module';

@NgModule({
  declarations: [
    TimelineComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    NgbModule,
    NgbTooltipModule,
    CommonUserProfieModule,
    SortByPipeModule,
    EntityReviewModule,
    TranslateModule,
    HasPermissionPipeModule
  ],
  exports: [
    TimelineComponent
  ],
  providers: [
    DatasourceService
  ]
})
export class TimelineModule { }
