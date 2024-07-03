import { Component, OnDestroy, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { ShortNumberPipe } from '../../../../@core/pipes/short-number/short-number.pipe';
import { ThemeService } from '../../../../@core/sharedServices/theme.service';
import { IndicatorService } from '../../services/indicator.service';
import { AbstractChart } from '../abstract-chart';
import { colors, themes } from '../constants/widgetConstants';

@Component({
  selector: 'ngx-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent extends AbstractChart implements OnInit, OnDestroy {
  data;
  dataMin;
  dataMax;
  subScriptionList: Subscription = new Subscription();
  shortNumberPipe = new ShortNumberPipe();
  selectedDataView = "Monthly";
  selectedSuppliers = [];
  resizeObserver: ResizeObserver;
  parentEle: any;
  xAxisMin: any;
  xAxisMax: any;

  currentChartConfig: any;

  constructor(
    private _indicatorService: IndicatorService,
    private themeService: ThemeService
  ) {
    super();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.loadChart();
    this.parentEle = $(`#${this.indicatorName}`)[0];
    this.resizeObserver = new ResizeObserver(      
      () => {
        if (this.chart && this.indId != 39) {
          this.chart.setSize($(`#${this.indicatorName}`).innerWidth());
        }
        if (this.indId == 39) {
          this.chart.setSize($("#container_39").innerWidth());
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
      },
      lang: {
        numericSymbols: ["k", "M", "B", "T", "P", "E"]
      }
    });

    this.chart = Highcharts.chart('container_' + this.indId + "_" + this.selectedView, {
      chart: {
        renderTo: 'container_' + this.indId + "_" + this.selectedView,
        type: 'spline',
        marginBottom: 90,
        marginRight:20,
        events: {
          render() {
            if (tmpThis.data && (this.series == undefined || this.series.length <= 0))
              tmpThis.addSeries(this);
          }
        }
      },
      colors: colors,
      title: {
        text: ''
      },
      xAxis: {
        type: "datetime",
        labels: {
          formatter() {
            let formattedValue = "";
            formattedValue = moment(this.value).format('DD MMM');

            return formattedValue;
          }
        },
        tickPositioner() {
          let xAxis:any = this;
          let positions = [], tick = Math.floor(xAxis.dataMin);
          if(tmpThis.data)
          {
            let increment = (xAxis.dataMax - xAxis.dataMin) / (tmpThis.data.seriesData[0].data.length  - 1);

            if (xAxis.dataMax !== null && xAxis.dataMin !== null) {
                for (tick; tick - increment <= xAxis.dataMax; tick += increment) {
                    positions.push(moment(tick).startOf('day').valueOf());
                }
            }
          }
          return positions;
      }
      },
      yAxis: {
        type: 'linear',
        lineWidth: 1,
        allowDecimals : false,
        title: {
          text: this.selectedUIOptions.yAxisTitle
        },
        gridLineWidth: 0
      },
      tooltip: {
        shared: true,
        formatter: function () {
          let tooltipString = moment(this.x).format('DD MMM');
          this.points.forEach((point) => {
            tooltipString += '<br/>' + point.series.name + ': ' +
              tmpThis.shortNumberPipe.transform(point.y);
          }, '');
          return tooltipString;
        }
      },
      legend: {
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        // x: 100,
        y: 10,
        alignColumns: false,
        floating: true,
        borderWidth: 1,
        itemWidth: 130,
        backgroundColor:
          Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF'
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        series: {
          marker: {
            enabled: false
          },
          events: {
            legendItemClick: function () {
              if (tmpThis.dashboardName == "Risk_Forecast" && this.options.type == 'spline')
                this.chart.series.filter(s => s.name.includes(this.name) && s.options.type != 'spline').forEach((es) => {
                  if (this.visible)
                    es.hide();
                  else
                    es.show();
                });
              return true;
            }
          }
        }
      },
      series: []
    });
    let subscription = this.themeService.highChartTheme.subscribe(
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

    this.data = this.prepareDataFromIndicatorData(this.indicatorData);
    if (this.chart) {
      if (this.chart.series && this.chart.series.length > 0)
        this.removeSeries();

      this.addSeries(this.chart);
    }
  }
  ngOnDestroy() {
    this.subScriptionList.unsubscribe();
    this.chart = undefined;
  }

  removeSeries() {
    let sLen = this.chart.series.length;
    for (var i = 0; i < sLen; i++) {
      let s = this.chart.series[0];
      s.remove(false);
    }
  }

  addSeries(chart) {
    if (this.data.title)
      chart.setTitle({ text: this.data.title }, false);


    let tickIntrvl;
    if (this.selectedDataView == "Daily")
      tickIntrvl = 24 * 3600 * 1000;
    else if (this.selectedDataView == "Weekly")
      tickIntrvl = 7 * (24 * 3600 * 1000);

    chart.xAxis[0].update({
      labels: { rotation: this.selectedDataView == "Monthly" ? 0 : 315 },
      tickInterval: tickIntrvl
    }, false);

    this.data.seriesData.forEach(sd => {
      chart.addSeries(sd, false);
    });

    // if (this.xAxisMin && this.xAxisMax)
    //   this.chart.xAxis[0].setExtremes(this.xAxisMin, this.xAxisMax, true);
    // else
      chart.redraw();
  }

  prepareDataFromIndicatorData(data) {
    let tmpThis = this;
    let seriesData = [];

    if (this.selectedUIOptions.isDateTimeAsColumn) {
      let dateKeys = [];
      let keys = Object.keys(this.indicatorData[0]);
      keys.forEach(k => {
        if (new Date(k) instanceof Date && new Date(k).toString() != "Invalid Date") {
          dateKeys.push({ key: k, dateValue: new Date(k)});
        }
      });
      dateKeys.sort((a, b) => { return a.dateValue - b.dateValue; });

      let data = [];
      this.indicatorData.forEach((ad) => {
        dateKeys.forEach(sk => {
          data.push({ 'legendCol': ad[this.selectedUIOptions.legendCol], 'xAxisCol': sk.dateValue, 'yAxisCol': ad[sk.key] })
        });
      });

      let seriesNames = this.indicatorData.map(s => s[this.selectedUIOptions.legendCol]).filter((x, i, a) => a.indexOf(x) === i);

      seriesNames.forEach((s, i) => {
        let sData = {
          name: s,
          type: 'line',
          data: data.filter(ds => ds['legendCol'] == s).map(ds => ([ds['xAxisCol'].getTime(), ds['yAxisCol']]))
        }
        seriesData.push(sData);
      });


    }

    return {
      seriesData: seriesData,
    }
  }
}
