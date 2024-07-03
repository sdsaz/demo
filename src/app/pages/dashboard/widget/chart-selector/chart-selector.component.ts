import { Component, ComponentFactoryResolver, ComponentRef, Input, OnInit, SimpleChanges, ViewChild, ViewContainerRef } from '@angular/core';
import { IndicatorService } from '../../services/indicator.service';
import { AbstractChart } from '../abstract-chart';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { IndicatorsAs } from '../constants/widgetConstants';
import { DonutChartComponent } from '../donut-chart/donut-chart.component';
import { GaugeChartComponent } from '../gauge-chart/gauge-chart.component';
import { LineChartComponent } from '../line-chart/line-chart.component';
import { PieChartComponent } from '../pie-chart/pie-chart.component';
import { SolidGaugeChartComponent } from '../solid-gauge-chart/solid-gauge-chart.component';

@Component({
  selector: 'ngx-chart-selector',
  templateUrl: './chart-selector.component.html',
  styleUrls: ['./chart-selector.component.scss']
})
export class ChartSelectorComponent implements OnInit {

  @Input() indId: number;
  @Input() selectedView: string;
  @Input() height: number;
  @Input() decreaseHeightBy: number;
  @Input() width: number;
  @Input() iOrder: number;
  @Input() apiUrl: string;
  @Input() indicatorsAs = IndicatorsAs.Independent;
  @Input() data = 'dynamic';
  @Input() groupByData: string;
  @Input() displayData: string;
  @Input() yAxisCol: string;
  @Input() xAxisCol: string;
  @Input() legendCol: string;
  @Input() subLegendCol: string;
  @Input() parentCol: string;
  @Input() apiData: any = null;
  @Input() xAxisTitle: string;
  @Input() yAxisTitle: string;
  @Input() customColor: any;
  @Input() seriesCol: any;
  @Input() indicatorName: string;
  @Input() dashboardName: any;
  @Input() indicatorData: any;
  @Input() settingsJson: any;
  @Input() selectedUIOptions: any;

  @ViewChild('chartViewStyle', { read: ViewContainerRef, static: true }) chartViewContainer: ViewContainerRef;

  chartObj: AbstractChart;
  selectedData = undefined;

  private componentReference: ComponentRef<{}>;

  private viewStyles = {
    'Chart.Piechart': PieChartComponent,
    'Chart.Linechart': LineChartComponent,
    'Chart.Gaugechart': GaugeChartComponent,
    'ProgressBar.HalfCircle': SolidGaugeChartComponent,
    'Chart.Barchart': BarChartComponent,
    'Chart.Donutchart': DonutChartComponent,
  };

  constructor(private factoryResolver: ComponentFactoryResolver,
    private _indicatorService: IndicatorService
  ) { }

  ngOnInit(): void {
    this.selectedData = this.indicatorsAs == IndicatorsAs.RelCommonData ? "Oceania" : "";
    this.instantiateViewComponent(this.selectedView);

    this._indicatorService.selectedData.subscribe((obj: any) => {
      this.selectedData = obj.selectedData;
    });
  }

  ngOnDestroy() {
    this.destroyChildComponent();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes.decreaseHeightBy && (changes.decreaseHeightBy.previousValue != changes.decreaseHeightBy.currentValue)) ||
      (changes.width && (changes.width.previousValue != changes.width.currentValue)) ||
      (changes.height && (changes.height.previousValue != changes.height.currentValue))) {
      if (this.chartObj) {
        this.chartObj.chart.setSize(null, null);
      }
    }
    if ((changes.selectedView && !changes.selectedView.firstChange) || (changes.indicatorsAs && !changes.indicatorsAs.firstChange)) {
      this.destroyChildComponent();
      this.instantiateViewComponent(this.selectedView.toLowerCase());
    }

    if (changes != null && changes.indicatorData != null && changes.indicatorData.currentValue &&
      JSON.stringify(changes.indicatorData.currentValue) != JSON.stringify(changes.indicatorData.previousValue)) {
      if (this.chartObj) {
        this.chartObj.indicatorData = this.indicatorData;
        this.chartObj.loadChart();
      }
    }
  }

  private destroyChildComponent() {
    if (this.componentReference) {
      this.componentReference.destroy();
      this.componentReference = null;
    }
  }

  instantiateViewComponent(viewStyles) {
    const componentType = this.provideListComponent(viewStyles);
    const factoryInstance = this.factoryResolver.resolveComponentFactory(componentType);
    this.componentReference = this.chartViewContainer.createComponent(factoryInstance);
    this.chartObj = this.componentReference.instance as AbstractChart;
    this.chartObj.indId = this.indId;
    this.chartObj.selectedView = this.selectedView;
    this.chartObj.indicatorName = this.indicatorName;
    this.chartObj.dashboardName = this.dashboardName;
    this.chartObj.indicatorData = this.indicatorData;
    this.chartObj.selectedUIOptions = this.selectedUIOptions;
  }

  provideListComponent(viewStyles: any) {
    return this.viewStyles[viewStyles];
  }
}
