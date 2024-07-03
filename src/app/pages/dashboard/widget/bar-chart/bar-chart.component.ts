import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import * as Highcharts from 'highcharts';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../../../@core/sharedServices/theme.service';
import { AbstractChart } from '../abstract-chart';
import { themes } from '../constants/widgetConstants';

@Component({
  selector: 'ngx-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent extends AbstractChart implements AfterViewInit, OnDestroy {

  @Input() data: any;

  subScriptionList: Subscription = new Subscription();
  
  constructor(private _themeService: ThemeService) {
    super();
  }

  loadChart() {
    this.chart = {
      chart: {
        type: 'bar',
        renderTo: 'container_' + this.indId + "_" + this.selectedView,
      },
      accessibility: {
        description: '',
      },
      title: {
        text: ''
      },
      subtitle: {
        text: ''
      },
      xAxis: {
        categories: [],
        tickmarkPlacement: 'on',
        title: {
          enabled: false
        }
      },
      yAxis: {
        min: 0,
        allowDecimals : false,
        alignTicks: false,
        title: {
          text: '',
          align: 'high'
        },
        labels: {
          overflow: 'justify'
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true
          }
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        floating: true,
        borderWidth: 1,
        backgroundColor:
          Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',
        shadow: true
      },
      credits: {
        enabled: false
      },
      series: []
    }

    this.prepareXAxis();
    this.prepareYAxis();
    this.chart = Highcharts.chart('container_' + this.indId + "_" + this.selectedView, this.chart);

  }

  ngAfterViewInit(): void {
    this.loadChart();

    let subscription = this._themeService.highChartTheme.subscribe(
      (theme: any) => {
        if (theme == 'default') {
          this.chart.update(themes.defaultTheme);
        }
        else {
          this.chart.update(themes.darkTheme);
        }
      }
    );
    this.subScriptionList.add(subscription);
  }

  ngOnDestroy(): void {
    this.subScriptionList.unsubscribe();
    this.chart = undefined;
  }

  prepareXAxis() {
    let categories: string[] = [];
    (this.indicatorData as any[]).forEach((data) => {
      categories.push(data[this.selectedUIOptions.xAxisCol] as string);
    });
    this.chart.xAxis.categories = categories;
  }

  prepareYAxis() {
    let series: any[] = [];

    (this.selectedUIOptions.yAxisCol as any[]).forEach(column => {
      let payload = {
        name: column.displayColumn,
        data: []
      };
      (this.indicatorData as any[]).forEach((data) => {
        payload.data.push(data[column.fieldColumn]);
      });
      series.push(payload);
    })
    this.chart.series = series;
  }
}
