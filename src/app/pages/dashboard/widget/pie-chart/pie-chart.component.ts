import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import { Subscription } from 'rxjs';
import { ShortNumberPipe } from '../../../../@core/pipes/short-number/short-number.pipe';
import { ThemeService } from '../../../../@core/sharedServices/theme.service';
import { IndicatorService } from '../../services/indicator.service';
import { AbstractChart } from '../abstract-chart';
import { colors, themes } from '../constants/widgetConstants';

@Component({
  selector: 'ngx-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent extends AbstractChart implements OnInit {

  data;
  shortNumberPipe = new ShortNumberPipe();
  subScriptionList: Subscription = new Subscription();
  resizeObserver: ResizeObserver;
  parentEle: any;

  constructor(
      private _indicatorService: IndicatorService,
      private _themeService: ThemeService
  ) {
      super();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
      let tmpThis = this;
      this.loadChart();
      let subscription = this._themeService.highChartTheme.subscribe(
          (theme: any) => {
              if (theme == 'default') {
                  tmpThis.chart.update(themes.defaultTheme);
              }
              else {
                  tmpThis.chart.update(themes.darkTheme);
              }
          }
      );
      this.subScriptionList.add(subscription);
      this.parentEle = $(`#${this.indicatorName}`)[0];
      this.resizeObserver = new ResizeObserver(
          () => {
              if (this.chart) {
                  this.chart.setSize($(`#${this.indicatorName}`).innerWidth());
              }
          }
      );
      if (this.parentEle)
          this.resizeObserver.observe(this.parentEle);
  }

  loadChart() {
      let tmpThis = this;
      Highcharts.setOptions({
          chart: {
              style: {
                  fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", 
            Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", 
            "Segoe UI Emoji", "Segoe UI Symbol"`
              }
          }
      });
      this.chart = Highcharts.chart('container_' + this.indId + "_" + this.selectedView, {
          chart: {
              // Edit chart spacing
              spacingBottom: 0,
              spacingTop: 0,
              spacingLeft: 10,
              spacingRight: 0,
              marginBottom: 5,
              margin: 0,
              renderTo: 'container_' + this.indId + "_" + this.selectedView,
              plotBackgroundColor: null,
              plotBorderWidth: null,
              plotShadow: false,
              type: 'pie',
              events: {
                  render() {
                      if (tmpThis.data && (this.series == undefined || this.series.length <= 0))
                          tmpThis.addSeries(this);
                  }
              }
          },
          title: {
              text: ''
          },
          tooltip: {
              headerFormat: null,
              pointFormat: '{point.name}: <b>{point.percentage:.1f}%</b>'
          },
          legend: {
              align: 'right',
              verticalAlign: 'top',
              layout: 'vertical',
              x: 0,
              y: 50,
              enabled: false
          },
          plotOptions: {
              pie: {
                  colors: colors,
                  allowPointSelect: true,
                  innerSize: 0,
                  cursor: 'pointer',
                  showInLegend: true,
                  center: ["50%", "50%"],
                  dataLabels: {
                      enabled: true,
                      color: '#000',
                      position: 'right',
                      x: 0,
                      y: 0,
                      padding: 0,
                      connectorPadding: 0,
                      distance: '7%',
                      format: '{point.name}: <b>{point.percentage:.1f}%</b>',
                      style: {
                          fontWeight: '600',
                          textOverflow: 'ellipsis'
                      }
                  }
              }
          },
          series: null,
          credits: {
              enabled: false
          }
      });
     
      this.data = this.prepareDataFromIndicatorData(this.indicatorData);
      if (this.chart) {
          if (this.chart.series && this.chart.series.length > 0)
              this.removeSeries();

          this.addSeries(this.chart);
      }
  }

  ngOnDestroy() {
      this.subScriptionList.unsubscribe();
  }

  removeSeries() {
      let sLen = this.chart.series.length;
      for (var i = 0; i < sLen; i++) {
          let s = this.chart.series[0];
          s.remove(false);
      }
  }

  addSeries(chart) {
      this.data.seriesData.forEach(sd => {
          chart.addSeries(sd, false);
      });

      chart.redraw();

  }

  prepareDataFromIndicatorData(data) {
      let seriesData = [];
      let yAxisUniqueNames = data.map(im => im[this.selectedUIOptions.xAxisCol]).filter((v, i, s) => s.indexOf(v) == i);

      let pdata = yAxisUniqueNames.map(yn => ({
          "name": yn,
          "y": data.filter(d => d[this.selectedUIOptions.xAxisCol] == yn).map(r => r[this.selectedUIOptions.yAxisCol]).reduce((res, value) => { return res + value }, 0)
      }));
      let sData = {
          "name": this.selectedUIOptions.legendCol,
          "data": pdata,
          "colorByPoint": true
      }
      seriesData.push(sData);

      return {
          seriesData: seriesData,
      }
  }
}