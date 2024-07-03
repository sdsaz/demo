import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
import { ReportListComponent } from './report-list/report-list.component';
import { ReportDetailComponent } from './report-detail/report-detail.component';

import { TableModule } from 'primeng/table';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { PaginatorModule } from 'primeng/paginator';
import { CalendarModule } from 'primeng/calendar';
import { MultiSelectModule } from 'primeng/multiselect';
import { TreeTableModule } from 'primeng/treetable';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DateMaskModule } from '../../@core/sharedDirective/date-mask/date-mask.module';
import { ReportsService } from './reports.service';
import { DatasourceService } from '../../@core/sharedServices/datasource.service';
import { AuthGuard } from '../auth/auth.guard';
import { CustomCalenderModule } from '../../@core/sharedComponents/custom-calender/custom-calender.module';
import { SettingsService } from '../settings/settings.service';
import { CustomPipeModule } from '../../@core/pipes/custom-pipe/custom-pipe.module';
import { CustomPipe } from '../../@core/pipes/custom-pipe/custom-pipe.pipe';
import { SafehtmlModule } from '../../@core/pipes/safehtml/safehtml.module';


const routes: Routes = [
  {
    path: '',
    component: ReportListComponent,
  },
  {
    path: ':group',
    component: ReportListComponent,
  },
  {
    path: 'detail/:id',
    component: ReportDetailComponent,
  },
];

@NgModule({
  declarations: [
    ReportListComponent,
    ReportDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    RouterModule.forChild(routes),
    TranslateModule,
    NgxMaskDirective, NgxMaskPipe,
    DateMaskModule,
    //Primeng
    TableModule,
    ScrollPanelModule,
    PaginatorModule,
    CalendarModule,
    MultiSelectModule,
    TreeTableModule,
    NgbTooltipModule,
    CustomCalenderModule,
    CustomPipeModule,
    SafehtmlModule
    //dataTable
    //DataTablesModule,
  ],
  providers: [
    DatePipe,
    DecimalPipe,
    CustomPipe,
    ReportsService,
    DatasourceService,
    SettingsService,
    provideNgxMask({})
  ]
})

export class ReportsModule { }
