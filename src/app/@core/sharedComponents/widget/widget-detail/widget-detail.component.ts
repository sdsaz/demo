import { Component, OnInit, Input } from '@angular/core';
import { WidgetService } from '../widget.service';
import * as Highcharts from 'highcharts';
import HC_funnel from 'highcharts/modules/funnel';
HC_funnel(Highcharts);
import HC_more from 'highcharts/highcharts-more';
HC_more(Highcharts);
import HC_guage from 'highcharts/modules/solid-gauge';
HC_guage(Highcharts);
import * as moment from 'moment';
import { CommonHelper } from '../../../common-helper';

@Component({
    selector: 'app-widget-detail',
    templateUrl: './widget-detail.component.html',
    styleUrls: ['./widget-detail.component.scss']
})

export class WidgetDetailComponent implements OnInit {



    //highcharts
    highcharts = Highcharts;

    //user detail
    _loggedInUser: any;

    //input params
    @Input() widget: any;
    @Input() startDate: Date;
    @Input() endDate: Date;

    //Save Flag
    submitted = false;

    //widget 1
    chartWidget: any;

    // chart options
    widgetChartOptions = {};

    constructor(private _commonHelper: CommonHelper, private _widgetService: WidgetService) {
        // start and end date
        let date = new Date();
        this.startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        this.endDate = new Date();
    }

    ngOnInit() {
        this._loggedInUser = this._commonHelper.getLoggedUserDetail();
 
        if (ChartType.SolidGuage == this.widget.chartType) {
            this.widgetChartOptions = {
                chart: {
                    type: 'solidgauge',
                    height: '300px',
                    width: 300,
                    events: {
                        load: function () {
                            var chart = this;

                            if (this.chartWidget1GrossLabel) {
                                this.chartWidget1GrossLabel.destroy();
                            }

                            var newX = chart.plotWidth / 2 + chart.plotLeft,
                                newY = chart.plotHeight / 2 + chart.plotTop;

                            this.chartWidget1GrossLabel = chart.renderer.text(this.series[2].data[0].y, newX, newY)
                                .attr({
                                    align: 'center'
                                })
                                .css({
                                    color: Highcharts.getOptions().colors[2],
                                    fontSize: '12pt'
                                }).add();
                        },
                        redraw: function () {
                            var chart = this;

                            if (this.chartWidget1GrossLabel) {
                                this.chartWidget1GrossLabel.destroy();
                            }

                            var newX = chart.plotWidth / 2 + chart.plotLeft,
                                newY = chart.plotHeight / 2 + chart.plotTop;

                            this.chartWidget1GrossLabel = chart.renderer.text(this.series[2].data[0].y, newX, newY)
                                .attr({
                                    align: 'center'
                                })
                                .css({
                                    color: Highcharts.getOptions().colors[2],
                                    fontSize: '16pt'
                                }).add();
                        },
                        render: function () {

                            // Move icon
                            if (!this.series[0].icon) {
                                this.series[0].icon = this.renderer.path(['M', -8, 0, 'L', 8, 0, 'M', 0, -8, 'L', 8, 0, 0, 8])
                                    .attr({
                                        stroke: '#303030',
                                        'stroke-linecap': 'round',
                                        'stroke-linejoin': 'round',
                                        'stroke-width': 2,
                                        zIndex: 10
                                    })
                                    .add(this.series[2].group);
                            }
                            this.series[0].icon.translate(
                                this.chartWidth / 2 - 10,
                                this.plotHeight / 2 - this.series[0].points[0].shapeArgs.innerR -
                                (this.series[0].points[0].shapeArgs.r - this.series[0].points[0].shapeArgs.innerR) / 2
                            );

                            // Exercise icon
                            if (!this.series[1].icon) {
                                this.series[1].icon = this.renderer.path(
                                    ['M', -8, 0, 'L', 8, 0, 'M', 0, -8, 'L', 8, 0, 0, 8,
                                        'M', 8, -8, 'L', 16, 0, 8, 8]
                                )
                                    .attr({
                                        stroke: '#ffffff',
                                        'stroke-linecap': 'round',
                                        'stroke-linejoin': 'round',
                                        'stroke-width': 2,
                                        zIndex: 10
                                    })
                                    .add(this.series[2].group);
                            }
                            this.series[1].icon.translate(
                                this.chartWidth / 2 - 10,
                                this.plotHeight / 2 - this.series[1].points[0].shapeArgs.innerR -
                                (this.series[1].points[0].shapeArgs.r - this.series[1].points[0].shapeArgs.innerR) / 2
                            );

                            // Stand icon
                            if (!this.series[2].icon) {
                                this.series[2].icon = this.renderer.path(['M', 0, 8, 'L', 0, -8, 'M', -8, 0, 'L', 0, -8, 8, 0])
                                    .attr({
                                        stroke: '#303030',
                                        'stroke-linecap': 'round',
                                        'stroke-linejoin': 'round',
                                        'stroke-width': 2,
                                        zIndex: 10
                                    })
                                    .add(this.series[2].group);
                            }

                            this.series[2].icon.translate(
                                this.chartWidth / 2 - 10,
                                this.plotHeight / 2 - this.series[2].points[0].shapeArgs.innerR -
                                (this.series[2].points[0].shapeArgs.r - this.series[2].points[0].shapeArgs.innerR) / 2
                            );
                        }
                    }
                },

                title: {
                    text: '',
                    style: {
                        fontSize: '24px'
                    }
                },

                tooltip: {
                    borderWidth: 0,
                    backgroundColor: 'none',
                    shadow: false,
                    style: {
                        fontSize: '14px',
                        verticalAlign: 'center'
                    },
                    valueSuffix: '',
                    pointFormat: '{series.name}: <span style="font-size:16px; color: {point.color}; font-weight: bold">{point.y}</span>',
                    positioner: function (labelWidth) {
                        return {
                            x: (this.chart.chartWidth - labelWidth) - 90,
                            y: (this.chart.plotHeight / 2) + 140
                        };
                    }
                },

                pane: {
                    startAngle: 0,
                    endAngle: 360,
                    background: [{ // Track for Move
                        outerRadius: '112%',
                        innerRadius: '88%',
                        backgroundColor: Highcharts.color(Highcharts.getOptions().colors[0])
                            .setOpacity(0.3)
                            .get(),
                        borderWidth: 0
                    }, { // Track for Exercise
                        outerRadius: '87%',
                        innerRadius: '63%',
                        backgroundColor: Highcharts.color(Highcharts.getOptions().colors[1])
                            .setOpacity(0.3)
                            .get(),
                        borderWidth: 0
                    }, { // Track for Stand
                        outerRadius: '62%',
                        innerRadius: '38%',
                        backgroundColor: Highcharts.color(Highcharts.getOptions().colors[2])
                            .setOpacity(0.3)
                            .get(),
                        borderWidth: 0
                    }]
                },

                yAxis: {
                    min: 0,
                    max: 100,
                    lineWidth: 0,
                    tickPositions: []
                },

                plotOptions: {
                    solidgauge: {
                        dataLabels: {
                            enabled: false
                        },
                        linecap: 'round',
                        stickyTracking: false,
                        rounded: true
                    }
                },

                series: [{
                    name: '',
                    data: [{
                        color: Highcharts.getOptions().colors[0],
                        radius: '112%',
                        innerRadius: '88%',
                        y: 0
                    }]
                }, {
                    name: '',
                    data: [{
                        color: Highcharts.getOptions().colors[1],
                        radius: '87%',
                        innerRadius: '63%',
                        y: 0
                    }]
                }, {
                    name: '',
                    data: [{
                        color: Highcharts.getOptions().colors[2],
                        radius: '62%',
                        innerRadius: '38%',
                        y: 0
                    }]
                }],

                credits: { enabled: false },
            };
        }
    }

    getInstanceWidgets(chart: any) {
        this.chartWidget = chart;
    }

    getTranslateErrorMessage(error) {
        if (error != null && error.messageCode) {
            this._commonHelper.showToastrError(
                this._commonHelper.getInstanceTranlationData('REPORT.' + error.messageCode.replace('.', '_').toUpperCase())
            );
        }
    }
}

export enum ChartType {
    SolidGuage = "solidgauge",
}
