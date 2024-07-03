import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, OnDestroy, SimpleChanges } from '@angular/core';
import * as moment from 'moment';
import { SelectItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { CommonHelper } from '../../../@core/common-helper';
import { CustomPipe } from '../../../@core/pipes/custom-pipe/custom-pipe.pipe';
import { ExcelJson } from '../../../@core/sharedModels/excel-json.interface';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { ExportService } from '../../../@core/sharedServices/export.service';
import { DashboardService } from '../services/dashboard.service';
import { IndicatorService } from '../services/indicator.service';
import { DashboardNamesList, FilterNameList, indicatorAllViewList, WidgetDisplayType } from './constants/widgetConstants';
import { IdGeneratorPipe } from '../pipes/id-generator.pipe';
import { PublicTenantSettings } from '../../../@core/enum';
declare var jQuery: any;
import {  LocalStorageKey } from '../../../@core/enum';

@Component({
  selector: 'ngx-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input() selectedTSValue: number;
  @Input() selectedDuration: number;
  @Input() selectedBuyerId: string;
  @Input() selectedSupplierId: string;
  @Input() selectedPartName: string = "";
  @Input() selectedStartDate: Date;
  @Input() selectedEndDate: Date;
  @Input() selectedCommodity: string;
  @Input() selectedPOLine: string;
  @Input() SCfilterObj;
  @Input() height;
  @Input() widthClass;
  @Input() rangeDates: any[];
  @Input() widgetId: number;

  @Input() widget: any;
  @Input() widgetSizes: any;
  @Output() UpdateWidgetSize = new EventEmitter<any>();
  
  widgetSize!: string;

  titleHeaderFilter: any = {};
  subTitleHeaderFilter: any = {};
  totalHeaderHeight: number = 0;
  subTitleHeaderHeight: number = 76;
  title: string = '';
  selectedUIOptions: any;
  chart: any;
  table: any;
  icon: any;
  text: any;
  indicatorData: any = null;
  indicatorAllViewList = indicatorAllViewList;
  viewList = [];
  sizeList: any;
  size: string;
  selectedView = { label: 'Monthly', value: 'Monthly' };
  selectedRiskFilter = { label: 'RAR', value: 'RAR' };
  dataDurationList = [
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Quarterly', value: 'Quarterly' },
  ];
  riskProfileFilterOptions: SelectItem[] = [
    { label: 'RAR', value: 'RAR' },
    { label: 'ES FS QS', value: 'EFQ' }
  ];
  selectedRiskFactor: any = { label: 'REL', value: 'Rel', caption: "Reliability" };
  riskFactorOptions = [
    { label: 'REL', value: 'Rel', caption: "Reliability" },
    { label: 'RES', value: 'Res', caption: "Responsiveness" },
    { label: 'AGL', value: 'Agl', caption: "Agility" },
    { label: 'ES', value: 'ES', caption: "ES" },
    { label: 'FS', value: 'FS', caption: "FS" },
    { label: 'QS', value: 'QS', caption: "QS" },
  ];
  
  dashboardNamesList = DashboardNamesList;
  widgetDisplayType = WidgetDisplayType;
  filterNameList = FilterNameList;
  isQueryDataCalled = false;
  subScriptionList: Subscription = new Subscription();
  selectedOrder: any;
  selectedSuppliersForCompareLength = 0;
  selectedSuppliersForCompare;
  dri;
  transportRisk;
  weatherRisk;
  lifeRisk;
  moneyRisk;
  locationRisk;
  documentRisk;
  totalRisk;
  poParamaterList = ['ItemsAtRisk', 'ItemsDeliveredOnTime'];
  headerItems = '';
  isShowHeaderElement = false;
  headerElement: string = '';
  showTableBackBtn: boolean = false;
  showCheckBoxColumn: boolean = false;
  riskTrendSID = 0;
  riskTrendIndex = -1;
  isAscending = true;
  displayActionRecomm = false;
  displayType;
  widthclass: string;

  riskDisplayName;
  paramDataType = {
    int: "int",
    string: "string"
  }

  rangeDatesDefault: any = [moment().subtract(6, 'days').toDate(), moment().toDate()];

  widetSearchFilter = {
    startDate: this.rangeDatesDefault[0],
    endDate: this.rangeDatesDefault[1]
  }

  dateSelectOptionsButtonBar = ['today', 'last7days', 'thisweek', 'thismonth'];

  selectedIndicatorView: any;
  isSizeMenuOpen: boolean = false;
  isTypeMenuOpen: boolean = false;
  
  refreshTime: Date = new Date();  

  globalSizeBoxMultiplier: number = 30;
  hasBigSize: boolean = false;
  
  constructor(
    private _indicatorService: IndicatorService,
    public _commonHelper: CommonHelper,
    private cdRef: ChangeDetectorRef,
    private _dataSourceService: DatasourceService,
    private _dashboardService: DashboardService,
    private _exportService: ExportService,
    private _customPipe: CustomPipe,
    private _idGenerator: IdGeneratorPipe
  ) { 
  }

  ngOnChanges(changes: SimpleChanges): void {
    //refresh data
    if (changes != null && changes.rangeDates != null && changes.rangeDates.previousValue != undefined && changes.rangeDates.currentValue != changes.rangeDates.previousValue) {
      if (this.rangeDates) {
        this.widetSearchFilter.startDate = this.rangeDates[0];
        this.widetSearchFilter.endDate = this.rangeDates[1];
      }
      else {
        this.widetSearchFilter.startDate = null;
        this.widetSearchFilter.endDate = null;
      }
      this.getQueryData();
    }
  }
  
  ngOnInit(): void {
    if (this.widget) {
      this.widgetSize = this.widget.size;
      this.displayType = this.widget.displayType;
      let displayTypeIDList = [...this.widget.possibleDisplayTypeIDs.split(',').map(s => Number(s)), this.widget.displayTypeID];
      this.prepareViewListDropdown(displayTypeIDList);
      if (this.widget.SettingsJson) {
        this.titleHeaderFilter = this.widget.SettingsJson.WidgetHeader.TitleFilters;
        this.subTitleHeaderFilter = this.widget.SettingsJson.WidgetHeader.SubTitlefilters;
        this.selectedUIOptions = this.widget.SettingsJson.UIOptions[this.displayType];
        
        if (!this.selectedUIOptions)
        {
          this.chart = this.widget.SettingsJson.WidgetBody.chart;
          this.table = this.widget.SettingsJson.WidgetBody.table;
        }

        this.size = this.widget.size;
        this.totalHeaderHeight += this.subTitleHeaderFilter && Object.keys(this.subTitleHeaderFilter).length ? this.subTitleHeaderHeight : 0;
      }
      this.title = this.widget.widgetTitle;
      
      this.prepareSizeListDropdown();
    }
    this.setLastSearchFilterFromStorage();
    this.getQueryData();
  }

  changeWidgetSize(size) {
     //prepare params
     let params = {
      id: 0,
      dashboardId: this.widget.dashboardID,
      dashboardSectionId: this.widget.dashboardSectionID,
      widgetId: this.widget.widgetID,
      size: size
    }
    this.showLoader(this.widget.widgetTitle);
    this._dashboardService.saveWidgetDisplaySize(params).then(() => {
      this.size = size;
      this.UpdateWidgetSize.emit({ 'widgetId': this.widget.id, 'widgetSize': size });
      setTimeout(() => {this.hideLoader(this.widget.widgetTitle)},300);
    },
      (error) => {
        this.hideLoader(this.widget.widgetTitle);
        this._commonHelper.getGeneralTranslateErrorMessage(error);
      });
  }

  prepareParamsForWidgetSize(displayTypeID) {
    const params = [];
    const paramItem1 = {
      name: 'IntValue1',
      type: 'int',
      value: this.widget.displayTypeID
    };
    params.push(paramItem1);
    return params;
  }

  ngAfterViewInit() {
    if (this.title)
      this.setHeaderTitle();
  }

  ngOnDestroy() {
    this.subScriptionList.unsubscribe();
  }

  private setLastSearchFilterFromStorage(): void {
    const searchFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.DashboardWidgetStartDateAndEndDateKey));
    if (searchFilter != null) {
      this.widetSearchFilter = searchFilter;
    }
    else {
      this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.DashboardWidgetStartDateAndEndDateKey, JSON.stringify(this.widetSearchFilter));
    }
  }

  createParameterObject(_name: string, _type: string, _value: any, _objectValue = undefined) {
    return {
      Name: _name,
      Type: _type,
      Value: _value.toString(),
      ObjectValue: _objectValue
    }
  }

  getQueryData(isForceRefreshCache:boolean = false) {
    this.showLoader(this.widget.widgetTitle);
    let parameters = [
      {
        name: '@EntityWorkflowIDs',
        type: 'string',
        value: null
      },
      {
        name: '@StartDate',
        type: 'date',
        value: this.widetSearchFilter.startDate ? moment(this.widetSearchFilter.startDate).format('YYYY-MM-DD') : null
      },
      {
        name: '@EndDate',
        type: 'date',
        value: this.widetSearchFilter.endDate ? moment(this.widetSearchFilter.endDate).format('YYYY-MM-DD') : null
      }];

    this._dataSourceService.getDataSourceDataByRecordKey(this.widget.dataSourceRecordKey, parameters, isForceRefreshCache).then((wdgtsData: any) => {
      if (wdgtsData) {
        this.indicatorData = JSON.parse(JSON.stringify(wdgtsData));
        this.cdRef.detectChanges();

        this._indicatorService.indicatorData.next({
          indicatorId: this.widget.widgetID,
          indicatorData: this.indicatorData
        });
        if (this.isQueryDataCalled) this.isQueryDataCalled = false;
      }
      setTimeout(() => {this.hideLoader(this.widget.widgetTitle)},300);
      this.refreshTime=new Date();
    },
      (error) => {
        this.hideLoader(this.widget.widgetTitle);
        this._commonHelper.getGeneralTranslateErrorMessage(error);
        if (this.isQueryDataCalled) this.isQueryDataCalled = false;
      }
    );
  }

  setHeaderTitle() {
    let headerText = this.title;
    let fixedText = ' <span class="datatitle">' + headerText + '</span>';
    this.headerElement = fixedText;
    this.cdRef.detectChanges();
  }

  onDateRangeChange($event) {
    if ($event) {
      this.widetSearchFilter.startDate = $event[0];
      this.widetSearchFilter.endDate = $event[1];
    }
    else {
      this.widetSearchFilter.startDate = null;
      this.widetSearchFilter.endDate = null;
    }

    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.DashboardWidgetStartDateAndEndDateKey, JSON.stringify(this.widetSearchFilter));
    this.getQueryData();
  }

  changeView(view, displayTypeID) {
    this.displayType = view;
    this.selectedUIOptions = this.widget.SettingsJson.UIOptions[this.displayType];
    this.prepareSizeListDropdown();

    let params = {
      id: 0,
      dashboardId: this.widget.dashboardID,
      dashboardSectionId: this.widget.dashboardSectionID,
      widgetId: this.widget.widgetID,
      displayTypeID: displayTypeID
    }

    this.showLoader(this.widget.widgetTitle);
    this._dashboardService.saveUserDashboardWidgetPrefsDisplayType(params).then(() => {
      setTimeout(() => {this.hideLoader(this.widget.widgetTitle)},300);
    },
      (error) => {
        this.hideLoader(this.widget.widgetTitle);
        this._commonHelper.getGeneralTranslateErrorMessage(error);
      });
  }

  onFilterSize(event) {
    //prepare params
    let params = {
      id: 0,
      dashboardId: this.widget.dashboardID,
      dashboardSectionId: this.widget.dashboardSectionID,
      widgetId: this.widget.widgetID,
      size: event.value
    }
    this.showLoader(this.widget.widgetTitle);
    this._dashboardService.saveWidgetDisplaySize(params).then(() => {
      this._indicatorService.IndicatorSize.next({
        widgetId: this.widget.widgetID,
        size: event.value
      });
      setTimeout(() => {this.hideLoader(this.widget.widgetTitle)},300);
      this.size = event.value;
    },
      (error) => {
        this.hideLoader(this.widget.widgetTitle);
        this._commonHelper.getGeneralTranslateErrorMessage(error);
      });
  }

  prepareViewListDropdown(displayTypeIds) {
    this.viewList = this._commonHelper.indicatorViewTypeList.filter(vt => displayTypeIds.includes(vt.intValue1))
      .map(ft => ({ dValue: this.indicatorAllViewList.find(il => il.value == ft.name).dValue, value: ft.name, possibleSize: ft.strValue2, displayTypeID: ft.intValue1 }));
  }

  prepareSizeListDropdown() {
    this.sizeList = this._commonHelper.indicatorViewTypeList.find(vt => vt.name == this.displayType)['strValue2'].split(',').map(s => ({ value: s }));
    this.hasBigSize = this.sizeList.some(x => x.value.toLowerCase() == "r8c8");
  }

  getSizeDdDispTxt(svgId, width, displayWidth, height, displayHeight, fontname, fontsize) {

    if ($('#' + svgId + ' > text').length <= 0) {
      let svg = document.getElementById(svgId);
      let txtElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      let wholeTxtArry = [displayHeight, ' X ', displayWidth];
      let maxWidth = 0;
      let curWidth = 0;
      let totalHeight = 0;
      let cText = "";

      wholeTxtArry.forEach(t => {
        let txtWidth = this.getTextWidth(t, fontname, fontsize);
        let newW = curWidth + txtWidth;
        let newFt = cText + t;

        if (newW <= width) {
          curWidth = newW;
          cText = newFt;
        }
        else {

          let tSpanElmnt = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tSpanElmnt.setAttribute('x', ((width / 2) - (curWidth / 2)).toString());
          tSpanElmnt.setAttribute('dy', totalHeight.toString());
          tSpanElmnt.textContent = cText;
          txtElement.appendChild(tSpanElmnt);

          cText = t;
          curWidth = txtWidth;
          totalHeight += 40;
        }

        if (maxWidth < curWidth)
          maxWidth = curWidth;

      });

      totalHeight = this.getTextHeight(cText, fontname, fontsize);
      let tSpanElmnt = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tSpanElmnt.setAttribute('x', ((width / 2) - (curWidth / 2)).toString());
      tSpanElmnt.setAttribute('dy', totalHeight.toString());
      tSpanElmnt.textContent = cText;
      txtElement.appendChild(tSpanElmnt);

      txtElement.setAttribute('font-family', fontname);
      txtElement.setAttribute('font-size', fontsize);
      txtElement.setAttribute('fill', 'black');
      txtElement.setAttribute('x', ((width / 2) - (maxWidth / 2)).toString());
      txtElement.setAttribute('y', this.getY(height, totalHeight).toString());

      svg.appendChild(txtElement);
    }
  }

  getX(width, txt, fontname, fontsize) {
    let x = (width / 2) - (this.getTextWidth(txt, fontname, fontsize) / 2);
    x = x < 0 ? 0 : x;
    return x;
  }

  getY(height, totalHeight) {
    let y = (height / 2) - (totalHeight / 2);
    y = y < 0 ? 0 : y;
    return y;
  }

  getTextWidth(txt, fontname, fontsize) {
    let c = document.createElement('canvas');
    var ctx = c.getContext("2d");
    ctx.font = fontsize + "px " + fontname;
    let width = ctx.measureText(txt).width;
    return width;
  }
  
  getTextHeight(txt, fontname, fontsize) {
    let c = document.createElement('canvas');
    var ctx = c.getContext("2d");
    ctx.font = fontsize + "px " + fontname;
    let textMetrics = ctx.measureText(txt);
    let height = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
    return height;
  }

  dragStartEvent(id) {
    if (id) {
      jQuery("#drp-" + id).dropdown('hide');
    }
  }

  showLoader(widgetName) {
    jQuery("#widget-loader-"+ this._idGenerator.transform(widgetName)).removeClass('hide-widget-loader');
    jQuery("#widget-loader-"+ this._idGenerator.transform(widgetName)).addClass('show-widget-loader');
  }

  hideLoader(widgetName) {
    jQuery("#widget-loader-"+ this._idGenerator.transform(widgetName)).removeClass('show-widget-loader');
    jQuery("#widget-loader-"+ this._idGenerator.transform(widgetName)).addClass('hide-widget-loader');
  }

  exportToExcel() {
       
    const exportData = this.indicatorData as any[];

    if (exportData.length == 0) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('DASHBOARD.WIDGET.MESSAGE_NO_DATA_TO_EXPORT')
      );
      return;
    }

    let hrsInDay = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY));
    if (!hrsInDay) {
      hrsInDay = 24;
    }

    let displayCols = this.selectedUIOptions.displayCol;
    if (!displayCols || Object.keys(displayCols).length == 0) {
      displayCols = this.widget.SettingsJson.UIOptions[WidgetDisplayType.ListDefault];
      if (displayCols && displayCols.hasOwnProperty('displayCol') && Object.keys(displayCols.displayCol).length > 0) {
        displayCols = displayCols.displayCol;
      } else {
        displayCols = null;
      }
    }

    let reportColumns;
    if (displayCols && Object.keys(displayCols).length > 0) {
       reportColumns = (displayCols as any[]).filter(x => x['visibility'] === 'visible');
    } else {
        let colName = Object.keys(this.indicatorData[0]);
        reportColumns = this.getColObjectArray(colName);
    }
   
    let headerData = '[{';
    let colIndx = 65;
    reportColumns.forEach(obj => {
      let colChar = String.fromCharCode(colIndx);
      headerData += '"' + colChar + '":"' + obj['title'] + '",';
      colIndx++;
    });

    headerData = headerData.substr(0, headerData.length - 1) + '}]';

    let headerJson = JSON.parse(headerData);
    const edata: Array<ExcelJson> = [];
    const udt: ExcelJson = {
      data: headerJson,
      skipHeader: true
    };

    let data = "[";
    exportData.forEach(obj => {
      colIndx = 65;
      data += "{";
      reportColumns.forEach(key => {
        let colChar = String.fromCharCode(colIndx);
        if(String(key['dataType']).toLowerCase() == 'duration' || String(key['dataType']).toLowerCase() == 'workingduration' || String(key['dataType']).toLowerCase() == 'numeric' || String(key['dataType']).toLowerCase() == 'datetime') {
          let val = this._customPipe.transform(obj[key['data']],String(key['dataType']), null, hrsInDay);
          val = (val == undefined || val == null) ? '' : val;
          data += '"' + colChar + '":"' + val + '",';
        } else {
          let val = obj[key['data']];
          val = (val == undefined || val == null) ? '' : val;
          data += '"' + colChar + '":"' + val + '",';
        }
        colIndx++;
      });
      data = data.substr(0, data.length - 1) + '},';
    });

    data = data.substr(0, data.length - 1) + ']';
    const jsonData = JSON.parse(data);

    jsonData.forEach(element => {
      udt.data.push(element);
    });
    edata.push(udt);

    let fileName = this.title.replace(/[ &\/\\#,+()$~%.'":*?<>{}/[\]']/g, "_");

    if (fileName.slice(-1) == '_') {
      fileName = fileName.substring(0, fileName.length - 1);
    }

    this._exportService.exportJsonToExcel(edata, fileName);;
  }

  getColObjectArray(colNameArray): any[] {
    let cols = [];
    colNameArray.forEach(col => {
      const colName = col.charAt(0).toUpperCase() + col.slice(1);
      let colTitle = colName;
      cols.push({
        "data": col,
        "title": colTitle,
        "headerAlign": null,
        "dataAlign": null,
        "className": null,
        "sort": false,
        "dataType": "string",
        "visibility": "visible"
      });
    });

    return cols;
  }
}
