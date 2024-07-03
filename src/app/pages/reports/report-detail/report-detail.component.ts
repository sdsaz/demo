//https://medium.com/ramsatt/integrate-data-table-with-angular-8-application-with-json-backend-f1071feeb18f
//https://l-lin.github.io/angular-datatables/#/extensions/buttons

import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportsService } from '../reports.service';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import * as moment from 'moment';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { Table } from 'primeng/table';
import { Location } from '@angular/common';
import { ExportService } from '../services/export.service';
import { ExcelJson } from '../interfaces/excel-json.interface';
import { CommonHelper } from '../../../@core/common-helper';
import { PublicTenantSettings } from '../../../@core/enum';
import { SettingsService } from '../../settings/settings.service';
import { CustomPipe } from '../../../@core/pipes/custom-pipe/custom-pipe.pipe';


export interface TreeNode {
  data?: any;
  children?: TreeNode[];
  leaf?: boolean;
  expanded?: boolean;
}


@Component({
  selector: 'app-report-detail',
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.scss'],
})
export class ReportDetailComponent implements OnInit {
  // declare form
  reportFilterForm: UntypedFormGroup;

  reportId: number = 0;
  dataSourceRecordKey: string = '';
  reportDetail: any;
  isSubmitted: boolean = false;
  isInitialLoading: boolean = true;
  hasPermissionsError: boolean = false;
  tableColumn: any = [];

  reportData: TreeNode[] = [];
  tableReportData: [];
  cols: any[];
  defaultSortField: string;
  defaultSortOrder: number;

  hoursInDay:number = null;

  @ViewChild('dt', { static: false }) table: Table;
  totalRecords: number = 0;
  filteredValuesLength: number = 0;

  totalPages: number;
  first: number = 0;
  start: number;
  end: number;
  pageNo: number = 1;
  pageSize: number = this._commonHelper.DefaultPageSize;

  summaryReportData: any = {};
  htmlReportData: string = '';
  hasHtmlReportDataLoaded: boolean = false;

  constructor(private _activatedRoute: ActivatedRoute,
    private _router: Router,
    private _formBuilder: UntypedFormBuilder,
    public _commonHelper: CommonHelper,
    private _reportService: ReportsService,
    private _datasourceService: DatasourceService,
    private _location: Location,
    private _exportService: ExportService,
    private _settingsService: SettingsService,
    private _customPipe: CustomPipe) {
    this.reportId = this._activatedRoute.snapshot.params['id'];

    // check report greater than zero, if not then redirect to report list
    if (this.reportId <= 0) {
      this._router.navigate(['/reports/list']);
    }
  }

  ngOnInit() {
    this.reportFilterForm = this._formBuilder.group({});
    Promise.all([
      this.getHoursInDay()
    ]).then(() => {
      this.getReportDetailById();
    });
    this.cols = [];
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
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      });
    }
    else {
      this.hoursInDay = hrsInDay;
    }
  }

  initTableWithData(data) {
    if (this.cols.length === 0) {
      this.setDefaultTableColumnSort();
    }
    this.prepareTableData(data);
  }

  setDefaultTableColumnSort() {
    this.cols = [];
    if (this.tableColumn && this.tableColumn.length > 0) {
      this.tableColumn.forEach(column => {
        let headerAlign = 'left';
        let dataAlign = 'left';
        if (column.headerAlign && column.headerAlign.length > 0) {
          headerAlign = column.headerAlign;
        }

        if (column.dataAlign && column.dataAlign.length > 0) {
          dataAlign = column.dataAlign;
        }
        const isVisible: boolean = (column.isVisible !== undefined ? column.isVisible : true);

        this.cols.push({
          field: column.data,
          header: column.title,
          width: column.width,
          isVisible: isVisible,
          headerAlign: headerAlign,
          dataAlign: dataAlign,
          dataType: column.dataType,
          format: column.format,
          hyperLink: column.hyperLink,
          hyperLinkParam: column.hyperLinkParam,
        });
        
        if (column.sortorder && column.sortorder.length > 0) {
          this.defaultSortField = column.data;
          if (column.sortorder === 'asc') {
            this.defaultSortOrder = 1;
          } else {
            this.defaultSortOrder = -1;
          }
        }
      });
    }
  }

  prepareTableData(data) {
    if (String(this.reportDetail.reportTypeName).toLowerCase() === 'treetable') {
      this.reportData = data;
    } else if (String(this.reportDetail.reportTypeName).toLowerCase() === 'table') {
      this.tableReportData = data;

      this.totalRecords = data.length;
      this.filteredValuesLength = this.totalRecords;

      this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
      this.end = this.pageNo === this.totalPages ? this.totalRecords : this.pageNo * this.pageSize;
      this.start = this.end === this.totalRecords ? (this.totalRecords - this.tableReportData.length + 1) : (this.end - this.pageSize) + 1;
    } else if (String(this.reportDetail.reportTypeName).toLowerCase() === 'multitable') {
      this.summaryReportData = JSON.parse(data);
    } else if (String(this.reportDetail.reportTypeName).toLowerCase() === 'html') {
      this.hasHtmlReportDataLoaded = true;
      this.htmlReportData = data;
    }
  }

  onGenerateReport() {
    const params = [];
    if (this.reportDetail.reportFilters != null && this.reportDetail.reportFilters !== '') {
      this.isSubmitted = true;
      if (this.reportFilterForm.invalid) {
        this.validateAllFormFields(this.reportFilterForm);
        return;
      }

      this.reportDetail.reportFilters.forEach(filterElement => {
        if (filterElement.type === 'daterange') {
          const rangeParamNames = filterElement.paramname.split('#');

          const paramItem1 = {
            name: rangeParamNames[0],
            type: 'date',
            value: null,
          };
          const paramItem2 = {
            name: rangeParamNames[1],
            type: 'date',
            value: null,
          };

          if (filterElement.value) {
            paramItem1.value = filterElement.value[0] != null ? moment(filterElement.value[0]).format('YYYY-MM-DD HH:mm:ss') : null;
            paramItem2.value = filterElement.value[1] != null ? moment(filterElement.value[1]).format('YYYY-MM-DD HH:mm:ss') : null;
          }
          params.push(paramItem1);
          params.push(paramItem2);

        } else {
          const paramItem = {
            name: filterElement.paramname,
            type: filterElement.type,
            value: filterElement.value,
          };
          if (filterElement.type === 'date' || filterElement.type === 'datetime') {
            if (paramItem.value && paramItem.value !== '') {
              paramItem.value = moment(paramItem.value).format('YYYY-MM-DD HH:mm:ss');
            }
          }
          params.push(paramItem);
        }
      });
    }
    this.getReportData(params);
  }



  getReportDetailById() {
    this._commonHelper.showLoader();
    this.isInitialLoading = true;
    this._reportService.getReportDetailById(this.reportId).then((response: any) => {
      if (response) {
        this.reportDetail = response;
        if (this.reportDetail) {
          this.dataSourceRecordKey = this.reportDetail.dataSourceRecordKey;
          if (this.reportDetail.reportFilters && this.reportDetail.reportFilters.length > 0) {

            this.reportDetail.reportFilters = JSON.parse(this.reportDetail.reportFilters);
            // prepare dynamic form
            if (this.reportDetail.reportFilters.length > 0) {
              this.reportDetail.reportFilters.forEach(reportElement => {
                if (reportElement.type === 'date' || reportElement.type === 'datetime') {
                  if (reportElement.value && reportElement.value != null && reportElement.value.length > 0) {
                    reportElement.value = new Date(reportElement.value);
                  }
                } else if (reportElement.type === 'daterange') {
                  if (reportElement.value && reportElement.value != null && reportElement.value.length > 0) {
                    // set date range - predefined from config
                    const dateRange = JSON.parse(reportElement.value);
                    reportElement.value = [new Date(dateRange[0]), new Date(dateRange[1])];
                  }
                } else if (reportElement.type === 'dropdown') {
                  reportElement.options = JSON.parse(reportElement.options);
                  if (reportElement.options && reportElement.options.length > 0) {
                    reportElement.value = reportElement.options[0].id;
                  }
                }

                if (reportElement.isrequired !== undefined) {
                  if (reportElement.isrequired) {
                    this.reportFilterForm.addControl(reportElement.paramname, new UntypedFormControl('', Validators.compose([Validators.required])));
                  } else {
                    this.reportFilterForm.addControl(reportElement.paramname, new UntypedFormControl(''));
                  }
                } else {
                  this.reportFilterForm.addControl(reportElement.paramname, new UntypedFormControl(''));
                }
              });

            } else {
              this.getReportData(null);
            }

          }
          if (this.reportDetail.reportColumns && this.reportDetail.reportColumns.length > 0) {
            this.tableColumn = JSON.parse(this.reportDetail.reportColumns);
            this.initTableWithData([]);
          }


          if (this.reportDetail.reportConfig && this.reportDetail.reportConfig.length > 0) {
            this.reportDetail.reportConfig = JSON.parse(this.reportDetail.reportConfig);
          }

          // if (this.reportFilterForm.invalid)
          const that = this;
          setTimeout(function () {
            if (!that.reportFilterForm.invalid) {
              that.onGenerateReport();
            }
          }, 500);
        }
      }
      this._commonHelper.hideLoader();
      this.isInitialLoading = false;
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.isInitialLoading = false;
        if (error.messageCode === 'Reports.NotExistOrInsufficientAccess')
          this.hasPermissionsError = true;
        else {
          this.getTranslateErrorMessage(error);
          this.hasPermissionsError = false;
        }
      });
  }

  setReportStyles() {
    let reportStyles;
    if (this.reportDetail && this.reportDetail.reportConfig) {
      reportStyles = {
        'max-width': this.reportDetail.reportConfig.maxWidth ? this.reportDetail.reportConfig.maxWidth : 'auto',
      };
    }
    return reportStyles;
  }

  setReportHeaderColumnStyles(col) {

    let styles;
    styles = {
      'word-break': 'break-word',
      'text-align': col.headerAlign,
      'width': col.width ? col.width : 'auto',
      'min-width': col.width ? col.width : 'auto',
    };
    return styles;
  }

  setReportDataColumnStyles(col) {
    let styles;
    styles = {
      'word-break': 'break-word',
      'text-align': col.dataAlign,
      'width': col.width ? col.width : 'auto',
      'min-width': col.width ? col.width : 'auto',
    };
    return styles;
  }

  prepareHyperlink(link, param) {
    return link + (param !== undefined ? ('/' + param) : '');
  }

  // For date filter
  onFilterDateSelect(dt, value, column) {
    if (value !== '' && this.isValidDateFormat(value)) {
      dt.filter(this.dateFormat(value), column, 'contains');
    } else {
      dt.filter('', column, 'contains');
    }
  }

  dateFormat(selectedDate) {
    if (selectedDate == null) {
      return;
    }
    return moment(selectedDate).format('YYYY-MM-DD');
  }

  // For Duration filter
  onFilterDurationSelect(dt, value, column) {
    if (value !== '') {
      dt.filter(this.durationFormat(value), column, 'contains');
    } else {
      dt.filter('', column, 'contains');
    }
  }

  durationFormat(value) {
    // TODO Need to work on it... Not getting any idea right now.
    return value;
  }

  isValidDateFormat(strDate) {
    if (strDate === null || strDate === '') {
      return false;
    }

    const date = moment(strDate, 'M/D/YYYY', true);
    return date.isValid();
  }

  onFilter(event, dt) {

    this.filteredValuesLength = event.filteredValue.length;
    this.pageNo = 1;
    this.start = 1;
    this.first = 0;
    this.totalRecords = this.filteredValuesLength;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    this.end = (this.totalRecords < this.pageSize) ? this.totalRecords : this.pageSize;
  }

  // change number of rows in table
  paginate(event) {
    this.table.reset();
    this.pageNo = 1;
    this.pageSize = event.rows;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    this.end = this.pageSize;
    this.start = 1;
    this.first = 0;
  }

  // change page according to user setReportDataColumnStyles
  changePage() {
    if (this.pageNo <= this.totalPages && this.pageNo > 0) {
      this.pageNo = this.pageNo > 0 ? this.pageNo : 1;
      this.start = ((this.pageNo - 1) * this.pageSize) + 1;
      this.end = (this.start - 1) === 0 ? this.pageSize : ((this.start - 1) + this.pageSize) > this.totalRecords ? this.totalRecords : ((this.start - 1) + this.pageSize);
      this.first = this.start === 1 ? 0 : this.start;
    }
    else if (this.pageNo > this.totalPages) {
      this.pageNo = this.totalPages;
    }
    else if (this.pageNo <= 0) {
      this.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // shortcut to go to page 1
  resetPaginator() {
    if (this.filteredValuesLength < this.tableReportData.length) {
      return false;
    }
    this.table.reset();
    this.pageNo = 1;
    this.pageSize = this._commonHelper.DefaultPageSize;
    this.end = this.totalRecords < this.pageSize ? this.totalRecords : this.pageSize;
    this.start = 1;
    this.first = 0;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to previous page
  prev() {
    this.pageNo = this.pageNo - 1 > 0 ? this.pageNo - 1 : 1;
    if (this.totalRecords < this.pageSize) {
      return false;
    } else if (this.end === this.pageSize) {
      return false;
    } else {
      this.end = this.pageNo === this.totalPages ? this.totalRecords : this.pageNo * this.pageSize;
      this.start = this.end === this.totalRecords ? (this.totalRecords - this.tableReportData.length + 1) : (this.end - this.pageSize) + 1;
      this.first = this.start === 1 ? 0 : (this.start - 1);
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to next page
  next() {
    this.pageNo = (this.pageNo + 1) <= this.totalPages ? this.pageNo + 1 : this.totalPages;
    this.end = this.pageNo === this.totalPages ? this.totalRecords : this.pageNo * this.pageSize;
    if (this.totalRecords < this.pageSize) {
      return false;
    } else if (this.end === this.totalRecords) {
      this.start = this.totalRecords - (this.totalRecords - (this.pageNo - 1) * this.pageSize) + 1;
      this.first = this.start === 1 ? 0 : (this.start - 1);
      return false;
    } else {
      this.start = this.end === this.totalRecords ? (this.totalRecords - this.tableReportData.length + 1) : (this.end - this.pageSize) + 1;
      this.first = this.start === 1 ? 0 : (this.start - 1);
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  getReportData(params: any) {
    this._commonHelper.showLoader();
    this._datasourceService.getDataSourceDataByRecordKey(this.dataSourceRecordKey, params).then((response: any) => {
      this.initTableWithData(response);
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  // form validation
  validateAllFormFields(formGroup: UntypedFormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('REPORT.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

  backToReportList() {
    this._location.back();
  }


  exportToExcel() {
    const reportColumns = JSON.parse(this.reportDetail['reportColumns']);

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

    let exportData = this.table.filteredValue != null ? this.table.filteredValue : this.tableReportData;

    if (exportData.length == 0) {
      return;
    }

    let data = "[";
    exportData.forEach(obj => {
      colIndx = 65;
      data += "{";
      reportColumns.forEach(key => {
        let colChar = String.fromCharCode(colIndx);
        let val = this._customPipe.transform(obj[key['data']], String(key['dataType']), String(key['format']), this.hoursInDay);
        val = (val == undefined || val == null) ? '' : val;
        data += '"' + colChar + '":"' + val + '",';
        colIndx++;
      });
      data = data.substr(0, data.length - 1) + '},';
    });

    data = data.substr(0, data.length - 1) + ']';
    let jsonData = JSON.parse(data);

    jsonData.forEach(element => {
      udt.data.push(element);
    });
    edata.push(udt);

    let fileName = (this.reportDetail.groupName.replace(/ /g, "_") + '_' + this.reportDetail.name.replace(/ /g, "_"));
    
    this._exportService.exportJsonToExcel(edata, fileName);
  }

  exportToCSV() {
    const reportColumns = JSON.parse(this.reportDetail['reportColumns']);

    let fields = [];
    reportColumns.forEach(obj => { fields.push(obj['data']); });

    let header = [];
    reportColumns.forEach(obj => { header.push(obj['title']); });

    let fileName = (this.reportDetail.groupName.replace(/ /g, "_") + '_' + this.reportDetail.name.replace(/ /g, "_"));

    let exportData = this._commonHelper.cloningArray(this.table.filteredValue != null ? this.table.filteredValue : this.tableReportData);
   
    exportData.forEach(obj =>{
      reportColumns.forEach(col =>{
        let val = this._customPipe.transform(obj[col['data']], String(col['dataType']), String(col['format']), this.hoursInDay);
        obj[col['data']] = (val == undefined || val == null) ? '' : val;
      });
    });

    if (exportData.length == 0) {
      return;
    }

    this._exportService.exportToCsv(exportData, fileName, fields, header);
  }

  exportToPdf() {
    if (this.htmlReportData != null || this.htmlReportData !== '') {
      let fileName = (this.reportDetail.groupName.replace(/ /g, "_") + '_' + this.reportDetail.name.replace(/ /g, "_")) + ".pdf";

      this._commonHelper.showLoader();
      this.isInitialLoading = true;
      this._reportService.convertHtmlToPdf(this.htmlReportData, fileName).then((response: any) => {
        this._commonHelper.hideLoader();
        this.isInitialLoading = false;

        this._commonHelper.downloadFile(fileName, 'application/pdf', response);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.isInitialLoading = false;
          this.getTranslateErrorMessage(error);
          this.hasPermissionsError = false;
        });

    }
  }
}
