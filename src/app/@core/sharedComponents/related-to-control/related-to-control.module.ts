import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskPipe } from 'ngx-mask';
import { DropdownModule } from 'primeng/dropdown';
import { RelatedToControlComponent } from './related-to-control/related-to-control.component';
import { TranslateModule } from '@ngx-translate/core';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ControlLevelLoadingBarModule } from '../control-level-loading-bar/control-level-loading-bar.module';



@NgModule({
  declarations: [
    RelatedToControlComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    NgxMaskPipe,
    TranslateModule,
    ConfiguredEntityNamePipeModule,
    NgbTooltipModule,
    ControlLevelLoadingBarModule
  ],
  exports: [
    RelatedToControlComponent
  ]
})
export class RelatedToControlModule { }
