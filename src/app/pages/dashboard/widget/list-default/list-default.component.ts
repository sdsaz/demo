import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonHelper } from '../../../../@core/common-helper';
import { PublicTenantSettings } from '../../../../@core/enum';
import { DateFormatPipe } from '../../../../@core/pipes/date-format-pipe/date-format-pipe';
import { ShortNumberPipe } from '../../../../@core/pipes/short-number/short-number.pipe';
import { SettingsService } from '../../../settings/settings.service';


@Component({
  selector: 'ngx-list-default',
  templateUrl: './list-default.component.html',
  styleUrls: ['./list-default.component.scss']
})
export class ListDefaultComponent implements OnInit {

  cols: any[];
  headCols: any[];
  tableData: any[] = null;
  mathInstance = Math;
  
  @Input() indId: number;
  @Input() tableConfig: any;
  @Input() dashboardName: string = '';
  @Input() indicatorName: string = '';
  @Input() displayOrder: number;
  @Input() SCfilterObj;
  @Input() indicatorData: any;
  @Input() widgetTitle: string = '';

  isNaN: Function = Number.isNaN;

  selectedDataView = "Monthly";
  subScriptionList: Subscription = new Subscription();
  selectedId: any;

  //datasource
  currencySymbol:any = null;
  hoursInDay:number = null;

  shortNumberPipe = new ShortNumberPipe();
  dateFormatPipe = new DateFormatPipe();
  mnTablApiData;
  showTableBackBtn = false;
  showHeader = false;

  constructor(
    public _commonHelper: CommonHelper,
    private _settingsService: SettingsService,) { }

  ngOnInit(): void {
    Promise.all([
      this.getCurrencySymbol(),
      this.getHoursInDay()
    ]).then(() => {
      if (this.tableConfig && !this.cols)
      this.cols = this.tableConfig.displayCol;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    //refresh data
    if (changes != null && changes.indicatorData != null && changes.indicatorData.currentValue &&
      JSON.stringify(changes.indicatorData.currentValue) != JSON.stringify(changes.indicatorData.previousValue)) {
      this.mnTablApiData = this.indicatorData;

      this.tableData = this.indicatorData;
      if (this.tableConfig)
        this.cols = this.tableConfig.displayCol;
      if (!this.cols || !this.cols.length) {
        let colName = Object.keys(this.tableData[0]);

        this.getColObjectArray(colName);
      }
      this.showHeader = this.cols.length > 2;
    }
  }
  ngOnDestroy() {
    this.subScriptionList.unsubscribe();
  }

  getCellDisplayText(col, rowData) {
    let displayText = '';
    if (['int', 'decimal'].includes(col.dataType))
      displayText = this.shortNumberPipe.transform(rowData[col.data]);
    else if (col.data == 'MonthYear' || col.data == 'Date') {
      displayText = this.dateFormatPipe.transform(rowData[col.data]);
    }
    else
      displayText = rowData[col.data];

    return displayText;
  }

  getColObjectArray(colNameArray) {
    this.cols = [];
    colNameArray.forEach(col => {
      var colName = col.charAt(0).toUpperCase() + col.slice(1);
      let colTitle = colName;
      let colAlignment = this.getColAlignment(col);
      this.cols.push({
        "data": col,
        "title": colTitle,
        "headerAlign": colAlignment,
        "dataAlign": colAlignment,
        "className": "class" + col,
        "sort": false,
        "dataType": "string",
        "visibility": "visible"
      });
    });

  }

  getColAlignment(colName) {
    let i = 0;
    let character;
    let titleArray = [];

    let colData = this.mnTablApiData.map(mT => mT[colName]);

    let colAlignment = 'left';
    colData.forEach(cd => {
      if (isNaN(cd))
        colAlignment = 'left';
      else
        colAlignment = 'right';
    });


    return colAlignment;
  }

  getColTitle(colName) {
    let i = 0;
    let character;
    let titleArray = [];

    while (i < colName.length) {
      character = colName.charAt(i);

      if (isNaN(character * 1))
        if (character == character.toUpperCase() || i == colName.length - 1) {
          let word = '';
          if (character == character.toUpperCase()) {
            word = colName.slice(0, i);
            colName = colName.slice(i);
            i = 1;
          }
          else
            word = colName;

          word = word[0].toUpperCase() + word.slice(1);

          titleArray.push(word);
        }
      i++;
    }
    return titleArray.join(" ");
  }

  private getCurrencySymbol() {
    const currencySymbol = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL));
    if (currencySymbol == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CURRENCY_SYMBOL).then((response:any) => {
          this.currencySymbol = response.currencySymbol;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL, JSON.stringify(this.currencySymbol));
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      });
    }
    else {
      this.currencySymbol = currencySymbol;
    }
  }

  private getHoursInDay() {
    const hrsInDay = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY));
    if (hrsInDay == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.HOURS_IN_DAY).then((response: any) => {
          this.hoursInDay = (response != null && !isNaN(Number(response))) ? Number(response) : 24;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY, JSON.stringify(this.hoursInDay));
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      });
    }
    else {
      this.hoursInDay = hrsInDay;
    }
  }
}
