import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { CommonHelper } from '../../../common-helper';
import { DynamicTableColumnType, Entity, PublicTenantSettings, SectionCodes, UserTypeID } from '../../../enum';
import { DynamicTableColumn, DynamicTableDataSource, DynamicTableParameter } from '../../../sharedModels/dynamic-table.model';
import { PagingParams } from '../../../sharedModels/paging-params.model';
import { CommonService } from '../../../sharedServices/common.service';
import { DatasourceService } from '../../../sharedServices/datasource.service';
import { enumPermissions } from '../../../common-helper';
import { ConfirmationDialogService } from '../../../sharedModules/confirmation-dialog/confirmation-dialog.service';
import { SettingsService } from '../../../../pages/settings/settings.service';
import { Router } from '@angular/router';
import { FileSignedUrlService } from '../../../sharedServices/file-signed-url.service';

@Component({
  selector: 'app-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss']
})


export class DynamicTableComponent implements OnInit, OnDestroy {

  @Input() code: string;
  @Input() enableSearch: boolean = true;
  @Input() parameters: Array<DynamicTableParameter> = [];
  @Input() deleteParamJson: any = {};
  @Input() privacyLevel: number;
  @Input() entityHiddenFieldSettings: any;
  @Input() parentEntityTypeId: number;
  @Input() sectionCodes: any;

  @Output() onDeleteClick = new EventEmitter<any>();
  @Output() onDeleteWithDataClick = new EventEmitter<any>();
  @Output() onEditClick = new EventEmitter<any>();
  @Output() onDownloadClick = new EventEmitter<any>();
  @Output() onPreviewClick = new EventEmitter<any>();

  @Output() button1 = new EventEmitter<any>();
  @Output() button2 = new EventEmitter<any>();
  @Output() button3 = new EventEmitter<any>();
  @Output() button4 = new EventEmitter<any>();

  @Output() data = new EventEmitter<any>();

  // search and table element
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  userTypeID = UserTypeID;

  // component specific
  dataSource: DynamicTableDataSource = {};
  // pagination
  paginationEnabled: boolean = true;
  pagingParams: PagingParams;
  totalRecords: number = 0;
  start: number = 0;
  end: number = 0;
  first: number = 0;
  totalPages: number = 0;

  //datasource
  currencySymbol: any = null;
  hoursInDay:number = null;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: 'md',
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  showLoadingBar: boolean = false;

  // subcriptions
  private searchValueChanged: Subject<string> = new Subject<string>();
  private searchBoxSubscription: Subscription;

  imageTypeColumns: any[] = [];

  constructor(
    public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _settingsService: SettingsService,
    private _datasourceService: DatasourceService,
    private _router: Router,
    private _fileSignedUrlService: FileSignedUrlService) {
    this.initializePagination();

    this._router.routeReuseStrategy.shouldReuseRoute = function() { return false; };
  }

  //#region ng page events
  ngOnInit(): void {
    Promise.all([
      this.getCurrencySymbol(),
      this.getHoursInDay()
    ]).then(() => {
      this.getDynamicComponentDetails();
      this.subscribeSearchBoxEvent();
    });
  }

  ngOnDestroy(): void {
    if (this.searchBoxSubscription) {
      this.searchBoxSubscription.unsubscribe();
    }
  }
  //#endregion

  //#region pagination methods
  search(val: string): void {
    this.searchValueChanged.next(val || '');
  }

  paginate(event: any): void {
    this.pagingParams.pageNo = (event.first / event.rows) + 1;
    this.pagingParams.pageSize = event.rows;
    this.getData();
  }

  changeOrder(column: DynamicTableColumn): void {
    if (column.sortable) {
      this.pagingParams.sortOrder = this.pTable.sortOrder == 1 ? 'ASC' : 'DESC';
      this.pagingParams.sortColumn = column.field;
      this.getData();
    }
  }

  changePage(): void {
    if (this.pagingParams.pageNo <= this.totalPages && this.pagingParams.pageNo > 0) {
      this.pagingParams.pageNo = this.pagingParams.pageNo > 0 ? this.pagingParams.pageNo : 1;
      this.getData();
    } else if (this.pagingParams.pageNo > this.totalPages) {
      this.pagingParams.pageNo = this.totalPages;
    } else if (this.pagingParams.pageNo <= 0) {
      this.pagingParams.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  resetPaginator(): any {
    this.pagingParams.pageNo = 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.getData();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  prev(): any {
    this.pagingParams.pageNo = this.pagingParams.pageNo - 1 > 0
      ? this.pagingParams.pageNo - 1 : 1;
    if (this.end == this.pagingParams.pageSize) {
      return false;
    }
    this.getData();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  next(): any {
    this.pagingParams.pageNo = (this.pagingParams.pageNo + 1) <= this.totalPages
      ? this.pagingParams.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getData();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  onActionClick(recordId, type, rowData) {
    if (recordId && recordId > 0) {
      if (type == 'Delete') {
        if (this.onDeleteClick.observers.length > 0) {
          this.onDeleteClick.emit(recordId);
        }
        //As per discussion we re not going to use DynamicComponents table's DeleteDataSourceID Column so commentout code. - PN 29-06-2022
        // else {
        //   this.optionsForPopupDialog.size = 'md';
        //   this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData('CRM.DYNAMIC_COMPONENTS.TABLE.DELETE_CONFIRMATION_DIALOG_TEXT'), null, null, this.optionsForPopupDialog)
        //     .then((confirmed) => {
        //       if (confirmed) {
        //         const deleteParam = {
        //           Code: this.code,
        //           FieldJSONData: JSON.stringify({ ID: recordId })
        //         };

        //         if (this.deleteParamJson.hasOwnProperty('entityID')) {
        //           this.deleteParamJson.entityID = recordId;
        //           deleteParam.FieldJSONData = JSON.stringify(this.deleteParamJson);
        //         }
        //         this._commonHelper.showLoader();
        //         this._dynamicComponentsService.deleteRecordByCode(deleteParam).then(response => {
        //           this._commonHelper.hideLoader();
        //           this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('CRM.DYNAMIC_COMPONENTS.TABLE.DELETE_SUCCESS'));
        //           this.getData();
        //         }, (error) => {
        //           this._commonHelper.hideLoader();
        //           this._commonHelper.showToastrError(error.error.Message);
        //         });
        //       }
        //     });
        // }
      }
      else if (type == 'DeleteWithData') {
        if (this.onDeleteWithDataClick.observers.length > 0) {
          this.onDeleteWithDataClick.emit(rowData);
        }
      }
        else if (type == 'Download') {
          if (this.onDownloadClick.observers.length > 0) {
            this.onDownloadClick.emit(recordId);
          }
        }
      else if (type == 'Edit') {
        if (this.onEditClick.observers.length > 0) {
          this.onEditClick.emit(recordId);
        }
      }
      else if (type == 'button1') {
        if (this.button1.observers.length > 0) {
          this.button1.emit(recordId);
        }
      }
      else if (type == 'button2') {
        if (this.button2.observers.length > 0) {
          this.button2.emit(recordId);
        }
      }
      else if (type == "button3") {
        if (this.button3.observers.length > 0) {
          this.button3.emit(recordId);
        }
      }
      else if (type == "button4") {
        if (this.button4.observers.length > 0) {
          this.button4.emit(rowData);
        }
      }
    }
  }
  //#endregion

  //#region enum accessor
  get dynamicTableColumnType(): typeof DynamicTableColumnType {
    return DynamicTableColumnType;
  }
  //#endregion

  //#region private methods
  private initializePagination(): void {
    this.pagingParams = new PagingParams();
    this.pagingParams.searchString = '';
    this.pagingParams.sortOrder = 'ASC';
    this.pagingParams.pageNo = 1;
    this.pagingParams.pageSize = this._commonHelper.DefaultPageSize;
  }

  private refreshPagination(): void {
    this.totalRecords = this.dataSource.data && this.dataSource.data.length > 0
      ? this.dataSource.data[0][this.dataSource.columnSchema.totalRecordsKey] : 0;
    this.totalPages = Math.ceil(this.totalRecords / this.pagingParams.pageSize);
    this.end = this.pagingParams.pageNo == this.totalPages ? this.totalRecords : this.pagingParams.pageNo * this.pagingParams.pageSize;
    this.start = this.end == this.totalRecords ? (this.totalRecords - this.dataSource.data.length + 1) : (this.end - this.pagingParams.pageSize) + 1;
  }

  private getDynamicComponentDetails(): void {
    if (this.code) {
      this.showLoadingBar = true;
      this._commonService.getDynamicComponentDetailsByCode(this.code)
        .then((response: DynamicTableDataSource) => {
          this.showLoadingBar = false;
          this.dataSource = response || {};
          this.dataSource.columnSchema = this._commonHelper.tryParseJson(this.dataSource.listColumnSettings);
          this.dataSource.formControlSchema = this._commonHelper.tryParseJson(this.dataSource.formColumnSettings);
          this.getImageColumnFields();
          this.getData();

          if (this.dataSource.columnSchema?.fields != null) {
            for (let i = 0; i <= this.dataSource.columnSchema?.fields?.length; i++) {
              if (this._commonHelper.isEntityFieldHidden(this.entityHiddenFieldSettings, this.parentEntityTypeId, this.sectionCodes, this.dataSource.columnSchema?.fields[i]?.hiddenFieldName)) {
                this.dataSource.columnSchema?.fields?.splice(i, 1);
              }
            }
          }

        }, (error) => {
          this.showLoadingBar = false;
          this._commonHelper.showToastrError(error.message);
        });
    }
  }

  private getData(): void {
    if (this.dataSource.listDatasourceRecordKey) {
      this.showLoadingBar = true;      
      this._datasourceService.getDataSourceDataByRecordKey(this.dataSource.listDatasourceRecordKey, this.dataApiParams())
        .then((response: Array<any>) => {
          this.dataSource.data = response || [];
          if (this.data.observers.length > 0) {
            this.data.emit(this.dataSource.data);
          }
          this.refreshPagination();
          this.showHideColumns();
          this.showLoadingBar = false;
          this.setSignedImageUrl();
        }, (error) => {
          this.showLoadingBar = false;
          this._commonHelper.showToastrError(error.message);
        });
    }
  }

  private dataApiParams(): any {
    let params: Array<DynamicTableParameter> = this.parameters
      ? this._commonHelper.cloningArray(this.parameters) : [];

    if (this.enableSearch) {
      params.push({
        name: 'SearchString',
        type: 'string',
        value: this.pagingParams.searchString
      });
    }

    params = params.concat(...[{
      name: 'PageNo',
      type: 'int',
      value: this.pagingParams.pageNo
    }, {
      name: 'PageSize',
      type: 'int',
      value: this.pagingParams.pageSize
    }, {
      name: 'SortColumn',
      type: 'string',
      value: this.pagingParams.sortColumn
    }, {
      name: 'SortOrder',
      type: 'string',
      value: this.pagingParams.sortOrder
    }]);
    return params;
  }

  private getCurrencySymbol() {
    const currencySymbol = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL));
    if (currencySymbol == null) {
      return new Promise((resolve, reject) => {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CURRENCY_SYMBOL).then((response: any) => {
          this.currencySymbol = response.currencySymbol;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL, JSON.stringify(this.currencySymbol));
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
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
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.HOURS_IN_DAY).then((response: any) => {
          this.hoursInDay = (response != null && !isNaN(Number(response))) ? Number(response) : 24;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY, JSON.stringify(this.hoursInDay));
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.showToastrError(error.message);
            reject(null);
          });
      });
    }
    else {
      this.hoursInDay = hrsInDay;
    }
  }

  private subscribeSearchBoxEvent(): void {
    this.searchBoxSubscription = this.searchValueChanged
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      ).subscribe((val) => {
        this.pagingParams.pageNo = 1;
        this.pagingParams.searchString = val;
        this.getData();
      });
  }

  showHideColumns() {
    if (this.dataSource.columnSchema && this.dataSource.columnSchema?.fields && this.dataSource.columnSchema?.fields.length > 0) {
      let firstData = null;

      if (this.dataSource?.data && this.dataSource?.data.length > 0)
        firstData = this.dataSource?.data[0];

      this.dataSource.columnSchema?.fields.forEach(column => {
        if (!column.hasOwnProperty("isVisible") || column.isVisible)
          column.isVisible = true;

        if (firstData) {
          if ((column.visibilityExpression || "") && firstData.hasOwnProperty(column.visibilityExpression) && firstData[column.visibilityExpression] === false)
            column.isVisible = false;
          else
            column.isVisible = true;
        }

      });
    }
  }
  //#endregion

  onPreviewButtonClick(data) {
    if (this.onPreviewClick.observers.length > 0) {
      this.onPreviewClick.emit(data);
    }
  }

  private getImageColumnFields()  {
    this.imageTypeColumns = this.dataSource.columnSchema.fields.filter((field : any) => field.type === 'person');
    this.imageTypeColumns.forEach((x : any) => {
      if (x.person) {
        x.person['imageSignedUrl'] = x.person.image + 'SignedUrl';
      }
    });
  }

  private setSignedImageUrl() {
    this.imageTypeColumns.forEach((x : any) => {
      if (x.person) {
        this._fileSignedUrlService.getFileSingedUrl(this.dataSource.data, x.person.image, x.person.imageSignedUrl, Entity.Users);
      }
    });
  }
}
