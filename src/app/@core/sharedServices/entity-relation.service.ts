import { Injectable } from '@angular/core';
import { HttpHelperService } from '../http-helper.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonHelper } from '../common-helper';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EntityRelationService extends HttpHelperService {

  private apiGatewayUrlForEntityRelation = environment.apiGatewayUrl + 'entityrelationsservice/'; // api gateway + service name
  
  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getEntityRelationComponents(entityTypeID: number) {
    const url = this.apiGatewayUrlForEntityRelation + "GetEntityRelationComponents";
    return this.getHttpAuthrizedGetRequest(url, { 'entityTypeID': entityTypeID });
  }

  getEntityRelationTypes(payload: any) {
    const url = this.apiGatewayUrlForEntityRelation + "GetEntityRelationTypes";
    return this.getHttpAuthrizedPostRequest(url, payload);
  }

  getEntityRelationCustomField(payload: any) {
    const url = this.apiGatewayUrlForEntityRelation + "GetEntityRelationCustomFields";
    return this.getHttpAuthrizedGetRequest(url, payload);
  }

  getEntityRelationCustomFieldValues(payload: any) {
    const url = this.apiGatewayUrlForEntityRelation + "GetEntityRelationCustomFieldValues";
    return this.getHttpAuthrizedGetRequest(url, payload);
  }

  saveEntityRelation(payload: any) {
    const url = this.apiGatewayUrlForEntityRelation + "SaveEntityRelation";
    return this.getHttpAuthrizedPostRequest(url, payload);
  }

  clearCache() {
    const url = this.apiGatewayUrlForEntityRelation + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }
}
