import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddRelatedToControlComponent } from './add-related-to-control.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { NgxMaskPipe } from 'ngx-mask';
import { TranslateModule } from '@ngx-translate/core';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  declarations: [AddRelatedToControlComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    NgxMaskPipe,
    TranslateModule,
    ConfiguredEntityNamePipeModule,
    NgbTooltipModule
  ],
  exports: [
    AddRelatedToControlComponent
  ]
})
export class AddRelatedToControlModule { }
