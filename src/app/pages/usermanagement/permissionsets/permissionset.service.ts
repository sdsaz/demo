import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { HttpHelperService } from '../../../@core/http-helper.service';
import { environment } from '../../../../environments/environment';
import { CommonHelper } from '../../../@core/common-helper';

@Injectable()
export class PermissionSetService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "userservice/"; //api gateway + service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getPermissionSets(pagingParams) {
    const url = this.apiGatewayUrl + "GetAllPermissionSetPermission";
    const body=pagingParams;
    return this.getHttpAuthrizedPostRequest(url, body);
  }

  getAllActivePermissions() {
    const url = this.apiGatewayUrl + "GetAllActivePermissions";
    return this.getHttpAuthrizedGetRequest(url);
  }

  getPermissionSetById(permissionSetId) {
    const url = this.apiGatewayUrl + "GetPermissionSetById";
    const params = { 'id': permissionSetId };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  addPermissionSet(permissionset) {
    const url = this.apiGatewayUrl + "AddPermissionSet";
    const body=permissionset;
    return this.getHttpAuthrizedPostRequest(url, body);
  }

  updatePermissionSet(permissionset) {
    const url = this.apiGatewayUrl + "UpdatePermissionSet";
    const body= permissionset;
    return this.getHttpAuthrizedPutRequest(url, body);
  }

  delete(permissionsetId) {
    const url = this.apiGatewayUrl + 'DeletePermissionSet';
    const params = { 'id': permissionsetId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }
}
