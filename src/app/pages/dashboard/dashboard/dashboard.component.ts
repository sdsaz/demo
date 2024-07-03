import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../services/dashboard.service';
import { ResizedEvent } from 'angular-resize-event';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { CommonHelper } from '../../../@core/common-helper';
import { DashboardNamesList } from '../widget/constants/widgetConstants';
declare var $: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  widgetInitialWidth: number = 0;
  widgetSizes = [
    { 'size': "r1c1", 'width': 0, 'tooltip': '1 row X 1 column' },
    { 'size': "r1c2", 'width': 0, 'tooltip': '1 row X 2 columns' },
    { 'size': "r1c4", 'width': 0, 'tooltip': '1 row X 4 columns' },
    { 'size': "r1c6", 'width': 0, 'tooltip': '1 row X 6 columns' },
    { 'size': "r1c8", 'width': 0, 'tooltip': '1 row X 8 columns' },

    { 'size': "r2c2", 'width': 0, 'tooltip': '2 rows X 2 columns' },
    { 'size': "r2c4", 'width': 0, 'tooltip': '2 rows X 4 columns' },
    { 'size': "r2c6", 'width': 0, 'tooltip': '2 rows X 6 columns' },
    { 'size': "r2c8", 'width': 0, 'tooltip': '2 rows X 8 columns' },

    { 'size': "r4c4", 'width': 0, 'tooltip': '4 rows X 4 columns' },
    { 'size': "r4c6", 'width': 0, 'tooltip': '4 rows X 6 columns' },
    { 'size': "r4c8", 'width': 0, 'tooltip': '4 rows X 8 columns' },

    { 'size': "r6c6", 'width': 0, 'tooltip': '6 rows X 6 columns' },
    { 'size': "r6c8", 'width': 0, 'tooltip': '6 rows X 8 columns' },

    { 'size': "r8c8", 'width': 0, 'tooltip': '8 rows X 8 columns' },
  ];

  widgetData: any[] = [];

  dashboardId: number;

  widgetList = [];// widgetData;
  dashboardNamesList = DashboardNamesList;
  
  dashboardName: string;
  dashboardDetails: any;
  isDashboardExists: boolean = true;
  menuItems: any;
  dashboard: any;

  rangeDates: any = [moment().subtract(6, 'days').toDate(), moment().toDate()];

  dateSelectOptionsButtonBar = ['today', 'last7days', 'thisweek', 'thismonth'];

  constructor(private _dashboardService: DashboardService, private _activeRoute: ActivatedRoute,
    private _router: Router, public _commonHelper: CommonHelper) {
    this._router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
    //get dashboard id
    this._activeRoute.params.subscribe(param => {
      if (param['id'] != undefined) {
        if (param['id'] != null) {
          this.dashboardId = param['id'];
        }
      }
    });
  }

  ngOnInit(): void {
    if (this.dashboardId != undefined && this.dashboardId != null) {
      this.getDashboardWidgetDetails();
    }
  }

  prepareWidgetSizeReload() {
    this.prepareWidgetSize();
  }

  private getDashboardWidgetDetails() {

    this.menuItems = this._commonHelper.getUserMenuItemsCache();
    this.dashboard = this.menuItems.find(mI => String(mI['code']).toLowerCase() == 'dashboards');

    if (this.dashboard != undefined) {
      if (this.dashboard.children && this.dashboard.children.length > 0) {
        this.isDashboardExists = this.dashboard.children.map(cd => cd.link.replace('/dashboard/', '')).includes(this.dashboardId);  
      } else {
        this.isDashboardExists = this.dashboard.link.replace('/dashboard/', '').includes(this.dashboardId);
      }

      if (this.isDashboardExists) {
        this._commonHelper.showLoader();
        this._dashboardService.getDashboardDetails().then((dashboards: any) => {
          if (dashboards && dashboards.length) {
            this.dashboardDetails = dashboards.find(d => d['dashboardID'] == this.dashboardId);
            if (this.dashboardDetails) {
              this.dashboardName = this.dashboardDetails.dashboardName;
              this.loadWidgetData();
            }
          }
          this._commonHelper.hideLoader();
        },
          (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.getGeneralTranslateErrorMessage(error);
          }
        );
      }
    } 
  }

  loadWidgetData() {
    this._commonHelper.showLoader();
    this._dashboardService.getDashboardSectionsList(this.dashboardId).then(sectionResponse => {
      this._commonHelper.hideLoader();
      if (sectionResponse) {
        this._commonHelper.showLoader();
        this._dashboardService.getDashboardWidgetsList(this.dashboardId).then(widgetResponse => {
          this._commonHelper.hideLoader();
          if (widgetResponse) {
            (sectionResponse as any[]).forEach(sectionItem => {
              let section: any = {};
              section['sectionid'] = sectionItem.id;
              section['sectionName'] = sectionItem.sectionTitle;

              let widgets: any = [];
              (widgetResponse as any[]).forEach(widgetItem => {
                if (widgetItem.dashboardSectionID == sectionItem.id) {
                  widgetItem["SettingsJson"] = widgetItem.settingsJson.length > 0 ? JSON.parse(widgetItem.settingsJson) : widgetItem.settingsJson
                  widgets.push(widgetItem);
                }
              });
              sectionItem['widgets'] = widgets;
              sectionItem["widgets"].sort((a, b) => (a.displayOrder - b.displayOrder));
              this.widgetData.push(sectionItem);
            });
          }

          setTimeout(() => { this.makeAllSectionsortable(); }, 1000);
          setTimeout(() => { this.prepareWidgetSize(); }, 10);
        }, () => {
          this._commonHelper.hideLoader();
        });
      }
    }, () => {
      this._commonHelper.hideLoader();
    });


  }

  makeAllSectionsortable() {
    const widgetData = this.widgetData;
    const ds = this._dashboardService;
    const dashboard = this.dashboardId;
    const commonHelper = this._commonHelper;

    $('.section-widgets').sortable({
      connectWith: '.section-widgets',
      handle: ".p-card-header",
      opacity: 0.8,
      cursor: 'move',
      placeholder: 'section-widget placeholder',
      start: function (e, ui) {
        ui.placeholder.width(ui.item.width() - 4); //remove 4 pixel of dashed border
        ui.placeholder.height(ui.item.height() - 4); //remove 4 pixel of dashed border
      },
      update: function (event, ui) {
        let str: any = [];
        let widgetsWithDisplayOrderList = [];
        let sectionId = '';
        let displayOrder: number = 0;

        $(this).find('li.section-widget').each(function (index, item) {
          str[index] = $(item).attr('id');
        });

        sectionId = $(this).attr('id');
        (str as any[]).forEach(data => {
          widgetData.forEach(sectionItem => {
            const widgetData = (sectionItem.widgets as any[]).find(widgetItem => widgetItem.id == data);
            if (widgetData) {
              displayOrder = displayOrder + 1;
              widgetsWithDisplayOrderList.push({
                DashboardSectionID: sectionId,
                Id: widgetData['widgetID'],
                DisplayOrder: displayOrder
              })
            }
          });
        });

        let params = {
          DashboardID: dashboard,
          DashboardSectionID: sectionId,
          WidgetsWithDisplayOrder: widgetsWithDisplayOrderList
        }
        commonHelper.showLoader();
        ds.saveUserDashboardWidgetPrefsDisplayOrder(params).then(() => {
          commonHelper.hideLoader();
        },
          (error) => {
            commonHelper.hideLoader();
            this._commonHelper.getGeneralTranslateErrorMessage(error);
          });
      }
    });
  }

  UpdateSectionWidgetSize(event) {
    this.widgetData.forEach(sectionItem => {
      sectionItem.widgets.forEach(widgetItem => {
        if (widgetItem.id == event.widgetId) {
          widgetItem.size = event.widgetSize;
          widgetItem["height"] = this._commonHelper.getSizeFromId(event.widgetSize).height;
        }
      })
    });

  }
  onResized(event: ResizedEvent): void {
    let newWidth = Math.round(event?.newRect?.width);
    let oldWidth = Math.round(event?.oldRect?.width);
    if (newWidth != oldWidth) {
      this.prepareWidgetSize();
    }

  }

  prepareWidgetSize() {
    this.setWidgetInitialWidth();
    let widgetPadding = 20;
    if ($(window).width() <= 400) {
      widgetPadding = 10;
    }

    var icwidth = $(".dashboard-sections").innerWidth(); // - widgetPadding;
    icwidth = Math.floor(icwidth)

    var possibleBlock = Math.floor(icwidth / this.widgetInitialWidth);
    if (possibleBlock > 1) {
      if ((possibleBlock % 2) == 1) {
        possibleBlock = possibleBlock - 1;
      }
    }
    var possibleWidth = (icwidth / possibleBlock) - widgetPadding;

    for (let widgetSize of this.widgetSizes) {
      const width = this.getWidgetColumnWidthBySize(widgetSize.size, possibleWidth, possibleBlock, widgetPadding);
      widgetSize.width = width;
    }
  }

  getWidgetColumnWidthBySize(widgetSize, possibleWidth, possibleColumn, widgetPadding) {
    let expectedColumn = 1;
    if (widgetSize.indexOf("c2") > -1) {
      expectedColumn = 2;
    } else if (widgetSize.indexOf("c4") > -1) {
      expectedColumn = 4;
    }
    else if (widgetSize.indexOf("c6") > -1) {
      expectedColumn = 6;
    }
    else if (widgetSize.indexOf("c8") > -1) {
      expectedColumn = 8;
    }

    if (expectedColumn > possibleColumn) {
      return (possibleWidth * possibleColumn) + widgetPadding * (possibleColumn - 1);
    }
    else {
      return (possibleWidth * expectedColumn) + widgetPadding * (expectedColumn - 1);
    }
  }

  setWidgetInitialWidth() {
    var screenWidth = $(window).width();


    if (screenWidth >= 1800) {
      this.widgetInitialWidth = 180;
    }
    else if (screenWidth >= 1500) {
      this.widgetInitialWidth = 160;
    }
    else if (screenWidth < 400) {
      this.widgetInitialWidth = 150;
    }
    else {
      this.widgetInitialWidth = 160;
    }
  }

  onDateRangeChange($event) {
    if ($event) {
      this.rangeDates[0] = $event[0];
      this.rangeDates[1] = $event[1];
    }
    else {
      //set default
      this.rangeDates = [null, null];
    }
  }
}
