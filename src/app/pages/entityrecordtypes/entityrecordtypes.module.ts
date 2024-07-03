import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TableModule } from 'primeng/table';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PaginatorModule } from 'primeng/paginator';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { EntityRecordTypesListComponent } from './entityrecordtypes-list/entityrecordtypes-list.component';
import { ActivePipeModule } from '../../@core/pipes/active-pipe/active-pipe-module';
import { GroupByPipeModule } from '../../@core/pipes/group-by-pipe/group-by-pipe-module';
import { ConfirmationDialogModule } from '../../@core/sharedModules/confirmation-dialog/confirmation-dialog.module';
import { CommonService } from '../../@core/sharedServices/common.service';

const routes: Routes = [
    {
        path: '**',
        component: EntityRecordTypesListComponent
    }
];

@NgModule({
    declarations: [
        EntityRecordTypesListComponent
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
        CommonService
    ]
})
export class EntityRecordTypesModule { }
