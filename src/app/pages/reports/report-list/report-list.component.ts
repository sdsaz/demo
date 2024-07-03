import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Table } from 'primeng/table';
import { Paginator } from 'primeng/paginator';
import { ReportsService } from '../reports.service';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { PagingParams } from '../../../@core/sharedModels/paging-params.model';

@Component({
    selector: 'app-report-list',
    templateUrl: './report-list.component.html',
    styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent implements OnInit {

    //Form View child
    @ViewChild('searchTextInput', { static: true }) searchTextInput: ElementRef;
    @ViewChild('pTable', { static: false }) private pTable: Table;
    @ViewChild('paginator', { static: true }) paginator: Paginator;

    reportDataSource: any = [];

    pagingParams: PagingParams;
    totalRecords: number;

    filteredValuesLength: number = 0;

    totalPages: number;
    first: number = 0;
    start: number;
    end: number;
    pageNo: number = 1;
    pageSize: number = this._commonHelper.DefaultPageSize;

    cols: any[];

    reportSearchFilter = {
        searchText: ''
    }

    loggedUserDetail: any;

    reportGroup: string = '';

    //permission variable
    isRoleList: boolean = false;
    isSummaryTableReport: boolean = false;
    isTreeTableReport: boolean = false;

    constructor(private _router: Router,
        public _commonHelper: CommonHelper,
        private _reportService: ReportsService,
        private _activatedRoute: ActivatedRoute) {

        //Set Logged user have permission
        this.isRoleList = this._commonHelper.havePermission(enumPermissions.RoleList);
        this.isSummaryTableReport = this._commonHelper.havePermission(enumPermissions.SummaryTableReport);
        this.isTreeTableReport = this._commonHelper.havePermission(enumPermissions.TreeTableReport);

        //Set column  name json
        this.cols = [
            // { field: 'imagePath', header: '', sort: false, class: "user-img" },
            { field: 'category', header: 'REPORT.LIST.TABLE_HEADER_CATEGORY', sort: true },
            { field: 'name', header: 'REPORT.LIST.TABLE_HEADER_NAME', sort: true },
            { field: 'description', header: 'REPORT.LIST.TABLE_HEADER_DESCRIPTION', sort: false }
        ];

        this._commonHelper.getTranlationData('dummyKey').then(result => {
            this.cols.forEach(item => {
                item.header = _commonHelper.getInstanceTranlationData(item.header);
            });
        });
    }

    ngOnInit() {

        this.loggedUserDetail = this._commonHelper.getLoggedUserDetail();

        this._activatedRoute.params.subscribe(routeParams => {
            if (this.pTable) {
                this.onResetAllFilters();
            }
            if (routeParams && Object.keys(routeParams).length > 0) {
                this.reportGroup = routeParams['group'];
            }
            this.getReports();
        });
    }

    onResetAllFilters() {
        this.reportSearchFilter = {
            searchText: ''
        }
        this.pTable.filterGlobal("", 'contains')
    }

    getReports() {
        this._commonHelper.showLoader();
        this._reportService.getReportList(this.reportGroup).then(
            response => {
                this.reportDataSource = response;

                this.totalRecords = this.reportDataSource.length;
                this.filteredValuesLength = this.totalRecords;

                this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
                this.end = this.pageNo == this.totalPages ? this.totalRecords : this.pageNo * this.pageSize;
                this.start = this.end == this.totalRecords ? (this.totalRecords - this.reportDataSource.length + 1) : (this.end - this.pageSize) + 1;
                this._commonHelper.hideLoader();
            },
            (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error);
            });
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
        this.pTable.reset();
        this.pageNo = 1;
        this.pageSize = event.rows;
        this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.end = this.pageSize;
        this.start = 1;
        this.first = 0;
    }

    // change page according to user input
    changePage() {
        if (this.pageNo <= this.totalPages && this.pageNo > 0) {
            this.pageNo = this.pageNo > 0 ? this.pageNo : 1;
            this.start = ((this.pageNo - 1) * this.pageSize) + 1;
            this.end = (this.start - 1) == 0 ? this.pageSize : ((this.start - 1) + this.pageSize) > this.totalRecords ? this.totalRecords : ((this.start - 1) + this.pageSize);
            this.first = this.start == 1 ? 0 : this.start;
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
        if (this.filteredValuesLength < this.reportDataSource.length) {
            return false;
        }
        this.pTable.reset();
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
        }
        else if (this.end == this.pageSize) {
            return false;
        }
        else {
            this.end = this.pageNo == this.totalPages ? this.totalRecords : this.pageNo * this.pageSize;
            this.start = this.end == this.totalRecords ? (this.totalRecords - this.reportDataSource.length + 1) : (this.end - this.pageSize) + 1;
            this.first = this.start == 1 ? 0 : this.start;
        }
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }

    // go to next page
    next() {
        this.pageNo = (this.pageNo + 1) <= this.totalPages ? this.pageNo + 1 : this.totalPages;
        this.end = this.pageNo == this.totalPages ? this.totalRecords : this.pageNo * this.pageSize;
        if (this.totalRecords < this.pageSize) {
            return false;
        }
        else if (this.end == this.totalRecords) {
            this.start = this.totalRecords - (this.totalRecords - (this.pageNo - 1) * this.pageSize) + 1;
            this.first = this.start == 1 ? 0 : this.start;
            return false;
        }
        else {
            this.start = this.end == this.totalRecords ? (this.totalRecords - this.reportDataSource.length + 1) : (this.end - this.pageSize) + 1;
            this.first = this.start == 1 ? 0 : this.start;
        }
        $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
    }

    getTranslateErrorMessage(error) {
        if (error != null && error.messageCode) {
            this._commonHelper.showToastrError(
                this._commonHelper.getInstanceTranlationData('REPORT.' + error.messageCode.replace('.', '_').toUpperCase())
            );
        }
    }

    //Call to edit form
    viewReport(reportId) {
        this._router.navigate([`reports/detail/${reportId}`]);
    }
}
