import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router';

import { HttpHelperService } from '../../@core/http-helper.service';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../../@core/common-helper';

@Injectable({
  providedIn: 'root'
})
export class SettingsService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "userservice/"; //api gateway + service name
  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
      super(_httpClient, _router, _commonHelper);
  }

  getTenantSettings() {
    let url = this.apiGatewayUrl + "GetTenantSettings";
    return this.getHttpAuthrizedGetRequest(url);
  }

  saveTenantSettings(ringCentralForm) {
    let url = this.apiGatewayUrl + "Save";
    return this.getHttpAuthrizedPostRequest(url, ringCentralForm);
  }

  getPublicTenantSettingValueByCode(code) {
    let url = this.apiGatewayUrl + "GetPublicTenantSettingValueByCode";
    return this.getHttpAuthrizedGetRequest(url, { code });
  }
  
  getAllWebAccessibleTenantSettingsWithValue() {
    const url = this.apiGatewayUrl + "GetAllWebAccessibleTenantSettingsWithValue";
    return this.getHttpAuthrizedGetRequest(url);
  }

  getUserTenantSettings() {
    let url = this.apiGatewayUrl + "GetUserTenantSettings";
    return this.getHttpAuthrizedGetRequest(url);
  }

  saveUserTenantSettings(ringCentralForm) {
    let url = this.apiGatewayUrl + "SaveUserTenantSettingValue";
    return this.getHttpAuthrizedPostRequest(url, ringCentralForm);
  }

  getPublicUserTenantSettingValueByCode(code) {
    let url = this.apiGatewayUrl + "GetPublicUserTenantSettingValueByCode";
    return this.getHttpAuthrizedGetRequest(url, { code });
  }
  
  getAllWebAccessibleUserTenantSettingsWithValue() {
    const url = this.apiGatewayUrl + "GetAllWebAccessibleUserTenantSettingsWithValue";
    return this.getHttpAuthrizedGetRequest(url);
  }
}
