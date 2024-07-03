import { Injectable } from '@angular/core';
import { HttpHelperService } from '../../../http-helper.service';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonHelper } from '../../../common-helper';

@Injectable({
  providedIn: 'root'
})
export class EntityNotificationService extends HttpHelperService {

  private apiGatewayUrlForEntityNotification = environment.apiGatewayUrl + 'entitynotificationservice/'; // api gateway + service name
  
  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getEntityNotificationsById(id: number) {
    const url = this.apiGatewayUrlForEntityNotification + "GetEntityNotificationsById";
    return this.getHttpAuthrizedGetRequest(url, { 'id': id });
  }

  getEntityNotificationsByEntityId(payload: any) {
    const url = this.apiGatewayUrlForEntityNotification + "GetEntityNotificationsByEntityId";
    return this.getHttpAuthrizedGetRequest(url, payload);
  }

  saveEntityNotification(payload: any) {
    const url = this.apiGatewayUrlForEntityNotification + "SaveEntityNotifications";
    return this.getHttpAuthrizedPostRequest(url, payload);
  }

  clearCache(){
    const url = this.apiGatewayUrlForEntityNotification + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }
}
