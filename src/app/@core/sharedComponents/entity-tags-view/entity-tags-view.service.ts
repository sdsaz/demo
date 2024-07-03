import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CommonHelper } from '../../common-helper';
import { HttpHelperService } from '../../http-helper.service';

@Injectable()
export class EntityTagsViewService extends HttpHelperService {
  private apiGatewayUrl = environment.apiGatewayUrl + "activityservice/"; //api gateway + service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getActivatedEntityTagsByEntityId(params) {
    const url = this.apiGatewayUrl + "GetActivatedEntityTagsByEntityId";
    return this.getHttpAuthrizedGetRequest(url, params);
  }
}
