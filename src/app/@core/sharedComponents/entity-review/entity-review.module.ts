import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { TrimValueModule } from '../../sharedDirective/trim-value/trim-value.module';
import { TrimModule } from '../../sharedDirective/trim/trim.module';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { RatingModule } from 'primeng/rating';
import { EntityReviewDialogComponent } from './entity-review-dialog/entity-review-dialog.component';

@NgModule({
  declarations: [
    EntityReviewDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    TrimValueModule,
    DropdownModule,
    TrimModule,
    ConfiguredEntityNamePipeModule,
    RatingModule 
  ],
  exports:[
    EntityReviewDialogComponent
  ]
})
export class EntityReviewModule { }
