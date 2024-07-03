import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

//ROUTING
import { DashboardRoutingModule } from './dashboard-routing.module';

//PRIMRENG
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';

//DASHBOARD COMPONENTS
import { DashboardComponent as DashboardParentComponent } from './dashboard.component';
import { SectionComponent } from './section/section.component';
import { WidgetComponent } from './widget/widget.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ListDefaultComponent } from './widget/list-default/list-default.component';
import { SolidGaugeChartComponent } from './widget/solid-gauge-chart/solid-gauge-chart.component';
import { GaugeChartComponent } from './widget/gauge-chart/gauge-chart.component';
import { LineChartComponent } from './widget/line-chart/line-chart.component';
import { PieChartComponent } from './widget/pie-chart/pie-chart.component';
import { ChartSelectorComponent } from './widget/chart-selector/chart-selector.component';
import { BarChartComponent } from './widget/bar-chart/bar-chart.component';
import { DonutChartComponent } from './widget/donut-chart/donut-chart.component';
import{ CurrentValueDefaultComponent} from './widget/current-value-default/current-value-default.component';

//CUSTOM MODULES
import { CustomCalenderModule } from '../../@core/sharedComponents/custom-calender/custom-calender.module';

//PIPES
import { HeightWidthThumbnailModule } from '../../@core/pipes/height-width-thumbnail/height-width-thumbnail.module';
import { HasPermissionPipeModule } from '../../@core/pipes/has-permission-pipe/has-permission-pipe.module';
import { DynamicTableLinkFormatPipeModule } from '../../@core/pipes/dynamic-table-link-format-pipe/dynamic-table-link-format-pipe.module';
import { PhonePipeModule } from '../../@core/pipes/phone-pipe/phone-pipe.module';
import { CustomPipeModule } from '../../@core/pipes/custom-pipe/custom-pipe.module';
import { IdGeneratorPipe } from './pipes/id-generator.pipe';
import { TimeAgoPipeModule } from '../../@core/pipes/timeAgo-pipe/timeAgo-pipe-module';
import { SafehtmlPipe } from '../../@core/pipes/safehtml/safehtml.pipe';

//THIRD PARTY MODULES
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { NgxMaskDirective } from 'ngx-mask';
import { NgxMaskPipe } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
import { AngularResizeEventModule } from 'angular-resize-event';

//SERVICES
import { CustomPipe } from '../../@core/pipes/custom-pipe/custom-pipe.pipe';

@NgModule({
  declarations: [
    DashboardParentComponent,
    SectionComponent,
    WidgetComponent,
    DashboardComponent,
    ListDefaultComponent,
    ChartSelectorComponent,
    PieChartComponent,
    LineChartComponent,
    GaugeChartComponent,
    SolidGaugeChartComponent,
    BarChartComponent,
    DonutChartComponent,
    IdGeneratorPipe,
    CurrentValueDefaultComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DashboardRoutingModule,
    CardModule,
    ButtonModule,
    TableModule,
    CommonModule,
    SkeletonModule,
    TooltipModule,
    BsDropdownModule,
    NgbTooltipModule,
    RadioButtonModule,
    ToggleButtonModule,
    TranslateModule,
    HeightWidthThumbnailModule,
    HasPermissionPipeModule,
    DynamicTableLinkFormatPipeModule,
    PhonePipeModule,
    NgxMaskDirective, NgxMaskPipe,
    CustomCalenderModule,
    AngularResizeEventModule,
    CustomPipeModule,
    TimeAgoPipeModule
  ], providers: [
    CustomPipe,
    provideNgxMask({}),
    IdGeneratorPipe,
    SafehtmlPipe
  ]
})
export class DashboardModule { }
