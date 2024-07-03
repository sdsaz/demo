import { Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import { Subscription } from 'rxjs';
import { ShortNumberPipe } from '../../../../@core/pipes/short-number/short-number.pipe';
import { ThemeService } from '../../../../@core/sharedServices/theme.service';
import { AbstractChart } from '../abstract-chart';
import { themes } from '../constants/widgetConstants';
import more from 'highcharts/highcharts-more';
import solidguage from 'highcharts/modules/solid-gauge';
more(Highcharts);
solidguage(Highcharts);
@Component({
  selector: 'ngx-solid-gauge-chart',
  templateUrl: './solid-gauge-chart.component.html',
  styleUrls: ['./solid-gauge-chart.component.scss']
})
export class SolidGaugeChartComponent extends AbstractChart implements OnInit {

  data;
  shortNumberPipe = new ShortNumberPipe();
  subScriptionList: Subscription = new Subscription();
  resizeObserver: ResizeObserver;
  parentEle: any;

  constructor(private _themeService: ThemeService) {
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
    this.chart = Highcharts.chart('container_' + this.indId + "_" + this.selectedView,{
      chart: {
        renderTo: 'container_' + this.indId + "_" + this.selectedView,
        type: 'solidgauge',
        events: {
          render() {
            if (tmpThis.data && (this.series == undefined || this.series.length <= 0))
              tmpThis.addSeries(this);
          }
        },
        animation: false
      },

      title:null,

      pane: {
        startAngle: -90,
        endAngle: 90,
        background: [
          {
            backgroundColor: '#EEE',
            innerRadius: '60%',
            outerRadius: '100%',
            shape: 'arc'
          }
        ]   
      },

      exporting: {
        enabled: false
      },

      tooltip: {
        enabled: false
      },

      yAxis: [
        {
          stops: [
            [0.1, '#DF5353'], // red
            [0.5, '#DDDF0D'], // yellow
            [0.9, '#55BF3B'], // green
          ],
          lineWidth: 0,
          tickWidth: 0,
          minorTickInterval: 0,
          tickAmount: 0,
          tickInterval: ((tmpThis.indicatorData[0][tmpThis.selectedUIOptions.maxLimit] ?? 200) / 1000),
          title: {
            y: -70
          },
          labels: {
            y: 16,
            formatter: function() {
              return Number(this.value).toFixed(0);
            }
          },
          min: tmpThis.indicatorData[0][tmpThis.selectedUIOptions.minLimit] ?? 0,
          max: tmpThis.indicatorData[0][tmpThis.selectedUIOptions.maxLimit] ?? 200,
        }
      ],
  
      plotOptions: {
        solidgauge: {
          dataLabels: {
            y: -70,
            borderWidth: 0,
            useHTML: true,
            format:
              '<div style="text-align:center">' +
              '<span style="font-size:25px">{y}</span><br/>' +
              '<span style="font-size:12px;opacity:0.4">'+tmpThis.selectedUIOptions.gaugeUnit?.toString() ?? ''+'</span>' +
              '</div>'
          }
        }
      },
      responsive: {
        rules: [{
            condition: {
              minWidth: 1100,
              minHeight: 1200
            },
            chartOptions: {
              pane: {
                center: ['50%', '55%'],
                size: '90%',
              }
            }
          }, {
            condition: {
              minWidth: 601,
              minHeight: 180
            },
            chartOptions: {
              pane: {
                center: ['50%', '95%'],
                size: '185%',
              }
            }
          }, {
            condition: {
              minWidth: 601,
              minHeight: 420
            },
            chartOptions: {
              pane: {
                center: ['50%', '75%'],
                size: '100%',
              }
            }
          }, {
            condition: {
              maxWidth: 600,
              minHeight: 180
            },
            chartOptions: {
              pane: {
                center: ['50%', '95%'],
                size: '185%',
              }
            }
          },{
            condition: {
              maxWidth: 600,
              minHeight: 420
            },
            chartOptions: {
              pane: {
                center: ['50%', '55%'],
                size: '90%',
              }
            }
          }, {
            condition: {
              maxWidth: 480,
              minHeight: 180
            },
            chartOptions: {
              pane: {
                center: ['50%', '75%'],
                size: '140%',
              }
            }
          }, {
            condition: {
              maxWidth: 480,
              minHeight: 420
            },
            chartOptions: {
              pane: {
                center: ['50%', '55%'],
                size: '90%',
              }
            }
          }, {
            condition: {
              maxWidth: 578,
              minHeight: 367
            },
            chartOptions: {
              pane: {
                center: ['50%', '65%'],
                size: '100%',
              }
            }
          }, {
            condition: {
              maxWidth: 310,
              minHeight: 180
            },
            chartOptions: {
              pane: {
                center: ['50%', '75%'],
                size: '120%',
              }
            }
          }, {
            condition: {
              maxWidth: 400,
              minHeight: 130
            },
            chartOptions: {
              pane: {
                center: ['50%', '75%'],
                size: '140%',
              }
            }
          },
          {
            condition: {
              maxWidth: 340,
              minHeight: 200
            },
            chartOptions: {
              pane: {
                center: ['50%', '75%'],
                size: '120%',
              }
            }
          },
          {
            condition: {
              maxWidth: 330,
              minHeight: 200
            },
            chartOptions: {
              pane: {
                center: ['50%', '75%'],
                size: '110%',
              }
            }
          }, {
            condition: {
              maxWidth: 411,
              minHeight: 367
            },
            chartOptions: {
              pane: {
                center: ['50%', '75%'],
                size: '100%',
              }
            }
          }, {
            condition: {
              maxWidth: 400,
              minHeight: 395
            },
            chartOptions: {
              pane: {
                center: ['50%', '75%'],
                size: '100%',
              }
            }
          }, {
            condition: {
              maxWidth: 330,
              minHeight: 421
            },
            chartOptions: {
              pane: {
                center: ['50%', '55%'],
                size: '90%',
              }
            }
          }, {
            condition: {
              maxWidth: 270,
              minHeight: 180
            },
            chartOptions: {
              pane: {
                center: ['50%', '55%'],
                size: '90%',
              }
            }
          }, {
            condition: {
              maxWidth: 260,
              minHeight: 420
            },
            chartOptions: {
              pane: {
                center: ['50%', '55%'],
                size: '70%',
              }
            }
          }
        ]
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
    chart.xAxis[0].update({
      categories: this.data.categories
    }, false);

    this.data.seriesData.forEach(sd => {
      chart.addSeries(sd, false);
    });

    chart.redraw();

  }

  prepareDataFromIndicatorData(data) {
    let seriesData = [];
    let gaugeValueUniqueNames = data.map(im => im[this.selectedUIOptions.gaugeLabel]).filter((v, i, s) => s.indexOf(v) == i);
    let pdata = gaugeValueUniqueNames.map(yn => ({
      "name": yn,
      "data": data.filter(d => d[this.selectedUIOptions.gaugeLabel] == yn).map(r => r[this.selectedUIOptions.gaugeValue]),
      "tooltip": {
        "valueSuffix": ' ' + this.selectedUIOptions.gaugeUnit.toString()
      }
    }));

    seriesData.push(pdata[0]);
    
    return {
      seriesData: seriesData,
    }
  }
}
