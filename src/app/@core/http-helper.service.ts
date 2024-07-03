import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoggedUser } from './sharedModels/user';
import { CommonHelper } from './common-helper';

@Injectable()

export abstract class HttpHelperService {

  loggedUserDetail: LoggedUser;

  constructor(public _httpClient: HttpClient, public route: Router, public _commonHelper: CommonHelper) {
  }

  public GetAuthHeader(isMultiPartFormData: boolean = false) {
    // Get login user detail from local storage.
    this.loggedUserDetail = this._commonHelper.getLoggedUserDetail();
    if (this.loggedUserDetail === undefined) {
      this.route.navigate(['/auth/login']);
    }
    // else {
    //   this.loggedUser = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this.UserCookiesName));
    // }

    // Initialize Header with Authorization Token
    let headers = new HttpHeaders();
    if (this.loggedUserDetail != null && this.loggedUserDetail != undefined) {

      headers = headers.set('Accept', 'application/json')
        .set('Authorization', this.loggedUserDetail.accessToken.toString());
      if(!isMultiPartFormData){
        headers = headers.set('Content-Type', 'application/json')
      }
    } else {
      this.route.navigate(['/auth/login']);
    }
    return headers;
  }

  private getHttpRequest(isAuthorizedRequst: boolean, url: string, requestMethod: string, body?: any, param?: any, isMultiPartFormData: boolean = false) {
    return new Promise((resolve, reject) => {
      let requestOptionArgs: any;
      if (param && typeof param === 'object') {
        param = this.prepareQuerystring(param);
      }

      let headers = new HttpHeaders();
      if(!isMultiPartFormData){
        headers.set('Content-Type', 'application/json');
      }
      if (isAuthorizedRequst) {
        headers = this.GetAuthHeader(isMultiPartFormData);
      }
      requestOptionArgs = {
        body: body,
        params: param,
        headers: headers,
        responseType: 'json',
      };

      this._httpClient.request(requestMethod, url, requestOptionArgs)
        .pipe(map(res => res))
        //SDC-56: Common Result object modified to relay response from microservices
        .subscribe((response: any) => {
          if (response && response.statusCode) {
            if (response.statusCode === 200) {
              resolve(response.data);
            } else {
              reject(response);
            }
          }
          else {
            resolve(response.data);
          }
        }, (error) => {
          reject(error);
          if (error.status == 401) {
            //localStorage.clear();
            this.route.navigate(["/auth/login"]);
          }
        });
    });
  }

  private prepareQuerystring(param: any) {
    let queryParam: string = '';

    let keyValue: string;
    Object.keys(param).forEach(key => {
      keyValue = key + '=' + param[key];
      if (queryParam === '') {
        queryParam = keyValue;
      } else {
        queryParam = queryParam + '&' + keyValue;
      }
    });
    if (queryParam !== '') {
      queryParam = encodeURIComponent(queryParam);
      param = { 'parameters': queryParam };
    }
    return param;
  }

  protected getHttpAuthrizedGetRequest(url: string, params?: any) {
    return this.getHttpRequest(true, url, "GET", null, params);
  }

  protected getHttpAuthrizedPostRequest(url: string, body?: any, params?: any, isMultiPartFormData: boolean = false) {
    return this.getHttpRequest(true, url, "POST", body, params, isMultiPartFormData);
  }

  protected getHttpAuthrizedPutRequest(url: string, body?: any, params?: any) {
    return this.getHttpRequest(true, url, "PUT", body, params);
  }

  protected getHttpAuthrizedDeleteRequest(url: string, params?: any) {
    return this.getHttpRequest(true, url, "DELETE", null, params);
  }

  protected getHttpGetRequest(url: string, params?: any) {
    return this.getHttpRequest(false, url, "GET", null, params);
  }

  protected getHttpPostRequest(url: string, body?: any, params?: any) {
    return this.getHttpRequest(false, url, "POST", body, params);
  }

  protected getHttpPutRequest(url: string, body?: any, params?: any) {
    return this.getHttpRequest(false, url, "PUT", body, params);
  }
}
