import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CommonHelper } from '../../../@core/common-helper';
import { HttpHelperService } from '../../../@core/http-helper.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService extends HttpHelperService {

  selectedTimeSpan = new Subject();
  selectedBuyerId = new Subject();
  selectedSupplierId = new Subject();
  selectedPartName = new Subject();
  selectedDates = new Subject();

  private apiGatewayUrlForDashboardService = environment.apiGatewayUrl + 'dashboardservice/'; //api gateway + multipart +service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getDashboardDetails() {
    const url = this.apiGatewayUrlForDashboardService + 'GetDashboardDetails';
    return this.getHttpAuthrizedGetRequest(url);
  }

  getDashboardSectionsList(dashboardId: number) {
    let params = {
      dashboardId: dashboardId
    }
    const url = this.apiGatewayUrlForDashboardService + 'GetDashboardSections';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getDashboardWidgetsList(dashboardId: number) {
    let params = {
      dashboardId: dashboardId
    }
    const url = this.apiGatewayUrlForDashboardService + 'GetDashboardWidgets';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  //For Superadmin related
  getUsersByTenant(pagingParams) {
    let url = this.apiGatewayUrlForDashboardService + "Users/GetAllUserByTenantForSA";
    return this.getHttpAuthrizedPostRequest(url, pagingParams);
  }

  getAllTenants() {
    let url = this.apiGatewayUrlForDashboardService + "Tenants/GetAllTenantForSA";
    return this.getHttpAuthrizedGetRequest(url);
  }

  impersonateLogin(userId: number) {
    let params = { userId: userId };
    let url = this.apiGatewayUrlForDashboardService + "Users/ImpersonateLogin";
    return this.getHttpAuthrizedGetRequest(url, params);
  }


  clearCache() {
    const url = this.apiGatewayUrlForDashboardService + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  saveWidgetDisplaySize(widget: any) {
    const url = this.apiGatewayUrlForDashboardService + 'SaveUserDashboardWidgetPrefsSize';
    return this.getHttpAuthrizedPostRequest(url, widget);
  }

  saveUserDashboardWidgetPrefsDisplayOrder(params) {
    const url = this.apiGatewayUrlForDashboardService + 'SaveUserDashboardWidgetPrefsDisplayOrder';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  saveUserDashboardWidgetPrefsDisplayType(widget: any) {
    const url = this.apiGatewayUrlForDashboardService + 'SaveUserDashboardWidgetPrefsDisplayType';
    return this.getHttpAuthrizedPostRequest(url, widget);
  }
}
