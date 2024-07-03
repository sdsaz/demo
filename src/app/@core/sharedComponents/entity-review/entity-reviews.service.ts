import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CommonHelper } from '../../common-helper';
import { HttpHelperService } from '../../http-helper.service';
import { param } from 'jquery';

@Injectable({
  providedIn: 'root'
})
export class EntityReviewsService extends HttpHelperService  {

  private apiGatewayUrl = environment.apiGatewayUrl + "activityservice/"; //api gateway + service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getEntityReviewDetailsById(id) {
    let params = {id}
    const url = this.apiGatewayUrl + 'GetEntityReviewDetailsById';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  isEntityReviewExistsForEntity(entityTypeId, entityId) {
    let params = {entityTypeId, entityId}
    const url = this.apiGatewayUrl + 'IsEntityReviewExistsForEntity';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  saveEntityReview(params) {
    const url = this.apiGatewayUrl + 'SaveEntityReview';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  deleteEntityReview(id) {
    let params = {id}
    const url = this.apiGatewayUrl + 'DeleteEntityReview';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }
}
