import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TableModule } from 'primeng/table';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PaginatorModule } from 'primeng/paginator';

import { ConfirmationDialogModule } from '../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.module';
import { ActivePipeModule } from '../../../@core/pipes/active-pipe/active-pipe-module';
import { GroupByPipeModule } from '../../../@core/pipes/group-by-pipe/group-by-pipe-module';

import { PermissionListComponent } from './permission-list/permission-list.component';
import { TranslateModule } from '@ngx-translate/core';
import { PermissionsService } from './permissions.service';

import { CardModule } from 'primeng/card';

const routes: Routes = [
    {
        path: '**',
        component: PermissionListComponent
    }
];

@NgModule({
    declarations: [
        PermissionListComponent
    ],
    exports: [],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BsDropdownModule,
        //primeng 
        TableModule,
        ScrollPanelModule,
        PaginatorModule,
        RouterModule.forChild(routes),
        ActivePipeModule,
        GroupByPipeModule,
        ConfirmationDialogModule,
        TranslateModule,
        CardModule
    ],
    providers: [
        PermissionsService
    ]
})
export class PermissionsModule { }
