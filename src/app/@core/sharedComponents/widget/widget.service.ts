import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { HttpHelperService } from '../../http-helper.service';
import { CommonHelper } from '../../common-helper';

@Injectable()

export class WidgetService extends HttpHelperService {

    private apiGatewayUrlForDashboardService = environment.apiGatewayUrl + 'dashboardservice/'; //api gateway + multipart +service name

    constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
        super(_httpClient, _router, _commonHelper);
    }

    getWidgetData(id: number, parameters: any) {
        let params = {
            id: id,
            widgetParameters: parameters
        }
        const url = this.apiGatewayUrlForDashboardService + 'Reports/GetWidgetData';
        return this.getHttpAuthrizedPostRequest(url, params);
    }
}
