import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { WidgetDetailComponent } from './widget-detail/widget-detail.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { CalendarModule } from 'primeng/calendar';


@NgModule({
    declarations: [
        WidgetDetailComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        HighchartsChartModule,
        CalendarModule
    ],
    exports: [
        WidgetDetailComponent
    ],
    providers: [],
    entryComponents: []
})

export class WidgetModule {
}
