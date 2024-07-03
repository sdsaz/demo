import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HttpHelperService } from '../../@core/http-helper.service';
import { CommonHelper } from '../../@core/common-helper';

@Injectable()

export class ReportsService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "reportservice/"; //api gateway + service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getReportList(groupName: string) {
    const params = {
      'groupName': groupName,
    };
    const url = this.apiGatewayUrl + `GetReportsByGroupName`;
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getReportDetailById(id) {
    const params = {
      'reportId': id,
    };
    const url = this.apiGatewayUrl + 'GetReportDetailByID';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getReportData(id: number, reportParameters: any) {
    const params = {
      id: id,
      reportParameters: reportParameters,
    };
    const url = this.apiGatewayUrl + 'GetReportDataByPermission';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  convertHtmlToPdf(html: string, fileName: string) {
    const params = {
      Html: html,
      FileName: fileName
    };
    const url = this.apiGatewayUrl + 'ConvertHtmlToPdf';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  clearCache() {
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }
}
