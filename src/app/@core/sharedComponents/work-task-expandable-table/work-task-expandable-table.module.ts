//#region  Angular 
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
//#endregion

//#region  Third Party Modules
import { TableModule } from 'primeng/table';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
//#endregion

//#region Custom Components
import { WorkTaskExpandableTableComponent } from './work-task-expandable-table.component';
//#endregion

//#region Custom Pipe Module
import { ConfiguredEntityNamePipeModule } from '../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';
import { DateFormatPipeModule } from '../../pipes/date-format-pipe/date-format-pipe.module';
import { IsEntityFieldHiddenModule } from '../../pipes/is-entity-field-hidden/is-entity-field-hidden.module';
//#endregion

//#region Custom Modules
import { CommonUserProfieModule } from '../common-user-profie/common-user-profie.module';
import { TabLevelLoaderModule } from '../tab-level-loader/tab-level-loader.module';
import { ConfirmationDialogModule } from '../../sharedModules/confirmation-dialog/confirmation-dialog.module';
import { EntityBookmarkModule } from '../entity-bookmark/entity-bookmark.module';
//#endregion

//#region Services
import { WorkTasksService } from '../../../pages/worktasks/worktasks.service';
//#endregion

@NgModule({
  declarations: [
    WorkTaskExpandableTableComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TranslateModule,
    ConfiguredEntityNamePipeModule,
    CommonUserProfieModule,
    TabLevelLoaderModule,
    DateFormatPipeModule,
    ConfirmationDialogModule,
    IsEntityFieldHiddenModule,
    NgbTooltipModule,
    EntityBookmarkModule
  ],
  exports: [
    WorkTaskExpandableTableComponent
  ],
  providers:[
    WorkTasksService
  ]
})
export class WorkTaskExpandableTableModule { }
