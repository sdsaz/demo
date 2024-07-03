import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { HttpHelperService } from '../../../@core/http-helper.service';
import { environment } from '../../../../environments/environment';
import { CommonHelper } from '../../../@core/common-helper';

@Injectable()
export class RolesService extends HttpHelperService {

    private apiGatewayUrl = environment.apiGatewayUrl + "userservice/"; //api gateway + service name

    constructor(public _httpClient: HttpClient, public _router: Router,public _commonHelper: CommonHelper) {
        super(_httpClient, _router,_commonHelper);
    }

    getRoles(pagingParams) {
        let url = this.apiGatewayUrl + "GetAllRolePermissionSets";
        return this.getHttpAuthrizedPostRequest(url, pagingParams);
    }

    getRolesById(roleId) {
        const url = this.apiGatewayUrl + "GetRoleById";
        const params = { 'id': roleId };
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getPermissionSet() {
        const url = this.apiGatewayUrl + "GetPermissionSets";
        return this.getHttpAuthrizedGetRequest(url);
    }

    addNewRole(role) {
        const url = this.apiGatewayUrl + "AddRole";
        return this.getHttpAuthrizedPostRequest(url, role);
    }

    updateRole(role) {
        const url = this.apiGatewayUrl + "UpdateRole";
        return this.getHttpAuthrizedPutRequest(url, role);
    }

    deleteRole(roleId) {
      const url = this.apiGatewayUrl + 'DeleteRole';
      const params = { 'id': roleId };
      return this.getHttpAuthrizedDeleteRequest(url, params);
    }

    getRoleFilter() {
        return this.getHttpAuthrizedGetRequest(this.apiGatewayUrl + "GetRoleFilter");
    }

    getFilterEntities() {
        return this.getHttpAuthrizedGetRequest(this.apiGatewayUrl + "getFilterEntities");
    }
}
