import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { HttpHelperService } from '../../../@core/http-helper.service';
import { environment } from '../../../../environments/environment';
import { CommonHelper } from '../../../@core/common-helper';

@Injectable()
export class PermissionsService extends HttpHelperService {

    private apiGatewayUrl = environment.apiGatewayUrl + "userservice/"; //api gateway + service name

    constructor(public _httpClient: HttpClient, public _router: Router,public _commonHelper: CommonHelper) {
        super(_httpClient, _router,_commonHelper);
    }

    getPermissions(pagingParams) {
        const url = this.apiGatewayUrl + "GetAllActivePermissions";
        return this.getHttpAuthrizedGetRequest(url, pagingParams);
    }
}