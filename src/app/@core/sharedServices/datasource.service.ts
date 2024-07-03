import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../common-helper';
import { HttpHelperService } from '../http-helper.service';

@Injectable()

export class DatasourceService extends HttpHelperService {

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  private apiGatewayUrlForDataSourceService = environment.apiGatewayUrl + 'datasourceservice/'; // api gateway + service name

  getDataSourceByID(dataSourceID) {
    const url = this.apiGatewayUrlForDataSourceService + "GetDataSourceByID";
    const params = { 'dataSourceID': dataSourceID };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getDataSourceDataByCode(code, isForceRefreshCache = false) {
    const url = this.apiGatewayUrlForDataSourceService + "GetDataSourceDataByCode";
    const params = { 'Code': code, 'IsForceRefreshCache': isForceRefreshCache };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getDataSourceDataByCodeAndParams(code, dataSourceParameters, isForceRefreshCache = false) {
    const url = this.apiGatewayUrlForDataSourceService + "GetDataSourceDataByCodeAndParams";
    const body = { 'code': code, 'DataSourceParameters': dataSourceParameters, 'IsForceRefreshCache': isForceRefreshCache };

    return this.getHttpAuthrizedPostRequest(url, body);
  }

  getDataSourceDataByRecordKey(recordKey, dataSourceParameters, isForceRefreshCache = false) {
    const url = this.apiGatewayUrlForDataSourceService + "GetDataSourceDataByRecordKey";
    const body = { 'recordKey': recordKey, 'DataSourceParameters': dataSourceParameters, 'IsForceRefreshCache': isForceRefreshCache };

    return this.getHttpAuthrizedPostRequest(url, body);
  }

  getDataSourceDataExcelByRecordKey(recordKey, dataSourceParameters, isForceRefreshCache = false) {
    const url = this.apiGatewayUrlForDataSourceService + "GetDataSourceDataExcelByRecordKey";
    const body = { 'recordKey': recordKey, 'DataSourceParameters': dataSourceParameters, 'IsForceRefreshCache': isForceRefreshCache };
    return this.getHttpAuthrizedPostRequest(url, body);
  }

  getDataSourceDataByID(id, isForceRefreshCache = false) {
    const url = this.apiGatewayUrlForDataSourceService + "GetDataSourceDataByID";
    const params = { 'id': id, 'IsForceRefreshCache': isForceRefreshCache };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getDataSourceDataByIDAndParams(id, dataSourceParameters, isForceRefreshCache = false) {
    const url = this.apiGatewayUrlForDataSourceService + "GetDataSourceDataByIDAndParams";
    const body = { 'ID': id, 'DataSourceParameters': dataSourceParameters, 'IsForceRefreshCache': isForceRefreshCache };

    return this.getHttpAuthrizedPostRequest(url, body);
  }

  clearCache() {
    const url = this.apiGatewayUrlForDataSourceService + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }
}
