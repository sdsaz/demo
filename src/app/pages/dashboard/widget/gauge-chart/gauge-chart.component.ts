import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import { Subscription } from 'rxjs';
import { ShortNumberPipe } from '../../../../@core/pipes/short-number/short-number.pipe';
import { ThemeService } from '../../../../@core/sharedServices/theme.service';
import { IndicatorService } from '../../services/indicator.service';
import { AbstractChart } from '../abstract-chart';
import { themes } from '../constants/widgetConstants';

@Component({
  selector: 'ngx-gauge-chart',
  templateUrl: './gauge-chart.component.html',
  styleUrls: ['./gauge-chart.component.scss']
})
export class GaugeChartComponent extends AbstractChart implements OnInit {

  data;
  shortNumberPipe = new ShortNumberPipe();
  subScriptionList: Subscription = new Subscription();
  resizeObserver: ResizeObserver;
  parentEle: any;

  constructor(private _indicatorService: IndicatorService,
    private _themeService: ThemeService) {
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
    this.chart = Highcharts.chart({
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
        type: 'gauge',
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
      pane: {
        startAngle: -150,
        endAngle: 150,
      },
      yAxis: {
        min: tmpThis.indicatorData[0][tmpThis.selectedUIOptions.minLimit] ?? 0,
        max: tmpThis.indicatorData[0][tmpThis.selectedUIOptions.maxLimit] ?? 200,

        minorTickInterval: 'auto',
        minorTickWidth: 1,
        minorTickLength: 10,
        minorTickPosition: 'inside',
        minorTickColor: '#666',

        tickPixelInterval: 30,
        tickWidth: 2,
        tickPosition: 'inside',
        tickLength: 10,
        tickColor: '#666',
        labels: {
          step: 2,
          //  rotation: 'auto'
        },
        title: {
          text: tmpThis.selectedUIOptions.innerTitleKey.toString()
        },
        plotBands: [{
          from: 0,
          to: 120,
          color: '#55BF3B' // green
        }, {
          from: 120,
          to: 160,
          color: '#DDDF0D' // yellow
        }, {
          from: 160,
          to: 200,
          color: '#DF5353' // red
        }]
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
    //this.subScriptionList.unsubscribe();
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
    let pinValueUniqueNames = data.map(im => im[this.selectedUIOptions.pinLabel]).filter((v, i, s) => s.indexOf(v) == i);
    let pdata = pinValueUniqueNames.map(yn => ({
      "name": yn,
      "data": data.filter(d => d[this.selectedUIOptions.pinLabel] == yn).map(r => r[this.selectedUIOptions.pinValue]),
      "dataLabels": { format: '', } // remove this to show value below pin
    }));

    return {
      seriesData: pdata,
    }
  }

}
