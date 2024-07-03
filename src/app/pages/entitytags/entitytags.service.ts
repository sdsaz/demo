import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { identifierModuleUrl } from '@angular/compiler';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../../@core/common-helper';
import { HttpHelperService } from '../../@core/http-helper.service';

@Injectable({
  providedIn: 'root'
})
export class EntitytagsService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "activityservice/"; //api gateway + service name
  private apiGatewayUrlMultipart = environment.apiGatewayUrl + 'multipart/activityservice/'; //api gateway + multipart +service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  //EntityTags
  getEntityTagsCategoriesByEntityTypeId(entityTypeId = null, entityRecordTypeId = null) {
    const url = this.apiGatewayUrl + "GetEntityTagsCategoriesByEntityTypeId";
    let params = null;
    if (entityTypeId != null && entityRecordTypeId != null) {
      params = { "entityTypeId": entityTypeId, "entityRecordTypeId": entityRecordTypeId };
    }
    else if (entityTypeId != null) {
      params = { "entityTypeId": entityTypeId };
    }
    else if (entityRecordTypeId != null) {
      params = { "entityRecordTypeId": entityRecordTypeId };
    }
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getEntityTags(filterParam: any) {
    const url = this.apiGatewayUrl + 'GetEntityTags';
    return this.getHttpAuthrizedPostRequest(url, filterParam);
  }

  getEntityTagById(id) {
    const url = this.apiGatewayUrl + 'GetEntityTagById';
    const params = { "id": id };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getNextDisplayOrderForTagCategory(tagCategoryId) {
    const url = this.apiGatewayUrl + "GetNextDisplayOrderForTagCategory";
    const params = { "TagCategoryId": tagCategoryId };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  saveEntityTag(formData) {
    const url = this.apiGatewayUrlMultipart + 'SaveEntityTags';
    return this.getHttpAuthrizedPostRequest(url, formData, null, true);
  }

  deleteEntityTagById(id) {
    const url = this.apiGatewayUrl + 'DeleteEntityTagById';
    const params = { 'id': id };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  //EntityTag Categories
  getEntityTagsCategories(filterParam: any) {
    const url = this.apiGatewayUrl + 'GetEntityTagsCategories';
    return this.getHttpAuthrizedPostRequest(url, filterParam);
  }

  getTagsCategoryById(Id) {
    const url = this.apiGatewayUrl + "GetTagsCategoryById";
    const params = { "Id": Id };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  saveTagsCategory(param: any) {
    const url = this.apiGatewayUrl + 'SaveTagsCategory';
    return this.getHttpAuthrizedPostRequest(url, param);
  }

  deleteEntityTagCategoryById(id) {
    const url = this.apiGatewayUrl + 'DeleteEntityTagCategoryById';
    const params = { 'id': id };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  saveToEntityTagTracking(params) {
    const url = this.apiGatewayUrl + 'SaveToEntityTagTracking';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  getActiveEntityTagsByEntityTypeId(entityTypeId, entityRecordTypeId?) {
    const url = this.apiGatewayUrl + "GetActiveEntityTagsByEntityTypeId";
    const params = { entityTypeId };
    if (entityRecordTypeId) {
      params['entityRecordTypeId'] = entityRecordTypeId;
    }
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  removeExistingEntityTag(params) {
    const url = this.apiGatewayUrl + "RemoveExistingEntityTag";
    return this.getHttpAuthrizedPutRequest(url, params);
  }
}
