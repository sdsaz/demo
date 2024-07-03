import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';

import { EntityReferencesListComponent } from './entity-references-list.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';




@NgModule({
  declarations: [EntityReferencesListComponent],
  imports: [
    CommonModule,
    TranslateModule,
    ConfiguredEntityNamePipeModule,
    NgbModule,
    TableModule,
    ButtonModule,
    FormsModule,
    PaginatorModule],
  exports: [EntityReferencesListComponent]
})
export class EntityReferencesListModule { }
