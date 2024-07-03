import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../common-helper';
import { HttpHelperService } from '../http-helper.service';

@Injectable()
export class EntityrequestService extends HttpHelperService{

  private apiGatewayUrl = environment.apiGatewayUrl + "entityrequestservice/"; //api gateway + service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  clearCache() {
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }
}
