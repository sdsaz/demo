export abstract class AbstractChart {
   public indId:number;
   public indicatorName:string;
   public dashboardName:string;
   public chart;
   public selectedView;
   public indicatorData;
   public selectedUIOptions;
   abstract loadChart();
}

