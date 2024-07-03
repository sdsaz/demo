import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { TeamsListComponent } from './teams-list/teams-list.component';
import { TeamsService } from './teams.service';
import { PaginatorModule } from 'primeng/paginator';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ActivePipeModule } from '../../../@core/pipes/active-pipe/active-pipe-module';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TeamsFormComponent } from './teams-form/teams-form.component';
import { TrimValueModule } from '../../../@core/sharedDirective/trim-value/trim-value.module';
import { MultiSelectModule } from 'primeng/multiselect';
import { TeamMemberImportDialogComponent } from './team-member-import-dialog/team-member-import-dialog.component';
import { ConfiguredEntityNamePipeModule } from '../../../@core/pipes/configured-entity-name-pipe/configured-entity-name-pipe.module';

const routes: Routes = [
  {
    path: '',
    component: TeamsListComponent
  },
  {
    path: 'add',
    component: TeamsFormComponent
},
  {
    path: 'details/:id',
    component: TeamsFormComponent
  }
];

@NgModule({
    declarations: [
        TeamsListComponent,
        TeamsFormComponent,
        TeamMemberImportDialogComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        TranslateModule,
        TableModule,
        DropdownModule,
        MultiSelectModule,
        PaginatorModule,
        FormsModule,
        ReactiveFormsModule,
        ActivePipeModule,
        ButtonModule,
        ToggleButtonModule,
        TrimValueModule,
        ConfiguredEntityNamePipeModule
    ],
    providers: [
        TeamsService
    ]
})
export class TeamsModule { }
