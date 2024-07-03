export const durationList = ["Daily", "Weekly", "Monthly", "Quaterly", "Yearly", "FromTo"];

export const colors = ['#00A19D', '#FFB344', '#E05D5D', '#EBE645', '#80ED99'];
export const donutChartColors = ['#7CB5EC', '#7f63d4', '#90ED7D', '#F7A35C', '#8085E9']
export const themes = {
    defaultTheme: {
        chart: {
            backgroundColor: '#fff',
        },
        xAxis: {
            title: {
                style: {
                    color: '#666666'
                }
            },
            lineColor: "#666666",
            tickColor: "#666666",
            labels: {
                style: {
                    color: '#666666'
                }
            }
        },
        yAxis: {
            gridLineColor: '#e6e6e6',
            title: {
                style: {
                    color: '#666666'
                }
            },
            lineColor: "#666666",
            tickColor: "#666666",
            labels: {
                style: {
                    color: '#666666'
                }
            }
        },
        legend: {
            itemStyle: {
                color: "#333"
            }
        }

    },
    darkTheme: {
        chart: {
            backgroundColor: '#1f2d40',
        },
        xAxis: {
            title: {
                style: {
                    color: '#fff'
                }
            },
            lineColor: "#fff",
            tickColor: "#fff",
            labels: {
                style: {
                    color: '#fff'
                }
            }
        },
        yAxis: {
            gridLineColor: '#fff',
            title: {
                style: {
                    color: '#fff'
                }
            },
            lineColor: "#fff",
            tickColor: "#fff",
            labels: {
                style: {
                    color: '#fff'
                }
            }
        },
        legend: {
            itemStyle: {
                color: "#fff"
            }
        }
    }
};

export const deductChartHghtBy = 68;


// export const sizeList = [
//     {
//         sizeId: 1,
//         height: "33.33",
//         width: "25"
//     },
//     {
//         sizeId: 2,
//         height: "33.33",
//         width: "50"
//     },
//     {
//         sizeId: 3,
//         height: "33.33",
//         width: "75"
//     },
//     {
//         sizeId: 4,
//         height: "33.33",
//         width: "100"
//     },
//     {
//         sizeId: 5,
//         height: "66.66",
//         width: "66.66"
//     },
//     {
//         sizeId: 6,
//         height: "66.66",
//         width: "75"
//     },
//     {
//         sizeId: 7,
//         height: "66.66",
//         width: "100"
//     },
//     {
//         sizeId: 8,
//         height: "99.99",
//         width: "100"
//     }
// ]

export const indicatorAllViewList = [
    {
        dValue: "List",
        value: "List.Default"
    },
    {
        dValue: "CVDefault",
        value: "CurrentValue.Default"   
    },
    {
        dValue: "Pie",
        value: "Chart.Piechart"
    },
    {
        dValue: "Donut",
        value: "Chart.Donutchart"
    }    ,
    {
        dValue: "Line",
        value: "Chart.Linechart"
    },
    {
        dValue: "Gauge",
        value: "Chart.Gaugechart"
    },
    {
        dValue: "Solid Gauge",
        value: "ProgressBar.HalfCircle"
    },
    {
        dValue: "Bar",
        value: "Chart.Barchart"
    },
    {
        dValue: "Column",
        value: "column"
    }
];

export const IndicatorsAs = {
    Independent: "Independent",
    IndeCommonData: "IndeCommonData",
    RelCommonData: "RelCommonData",
    MasterDetail: "MasterDetail",
};

// Dashboard Names
export const DashboardNamesList = {
    SampleDashboard1: "SampleDashboard1"
}

export const WidgetDisplayType = {
    CVDefault: "CurrentValue.Default",
    CVProgressBar: "CurrentValue.ProgressBar",
    CVContext: "CurrentValue.Context",
    PBHalfCircle: "ProgressBar.HalfCircle",
    PBFullCircle: "ProgressBar.FullCircle",
    ChartForecast: "Chart.Forecast",
    ChartLine: "Chart.Linechart",
    ChartBar: "Chart.Barchart",
    ChartColumn: "Chart.Columnchart",
    ChartArea: "Chart.Areachart",
    ChartPie: "Chart.Piechart",
    ChartDonut: "Chart.Donutchart",
    ListDefault: "List.Default",
    ListFunnel: "List.Funnel",
    AllInOneDefault: "AllInOne.Default",
    SymbolsDefault: "Symbols.Default",
    WorldMapDefault: "WorldMap.Default",
    ChartGauge: "Chart.Gaugechart",
}

// Combo Indicator Filters
export const FilterNameList = {
    QuantityCost: "quantitycost",
    Information: "information",
    RiskText: "risktext",
    DataView: "dataview",
    RiskFactor: "RiskFactor",
    SupplierCompare: "supplierCompare",
    RarEsFsQs: "RARESFSQS",
    Sort: "sort",
    Back: "back",
    Reset: "reset",
    Export: "export",
    DamAvgVariance: "DamAverageVsVariance",
    UserType: "UserType",
    PriorityQueueDownload: "PriorityQueueDownload",
    DateRange: "daterange",
    ChartType: "charttype",
    sizeList: "size"
}