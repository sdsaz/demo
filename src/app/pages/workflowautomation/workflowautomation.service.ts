import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../../@core/common-helper';
import { HttpHelperService } from '../../@core/http-helper.service';

@Injectable({
  providedIn: 'root'
})
export class WorkflowautomationService extends HttpHelperService {

  private apiGatewayUrlForApService = environment.apiGatewayUrl + "actionprocessorservice/";
  private apiGatewayUrlForApTaskCompletion = environment.apiGatewayUrl + "actionprocessortaskcompletion/";
  private apiGatewayUrlForApTagAdd = environment.apiGatewayUrl + "actionprocessortagadd/";
  private apiGatewayUrlForApSendEmail = environment.apiGatewayUrl + "actionprocessorsendemail/";
  private apiGatewayUrlForApSendSms = environment.apiGatewayUrl + "actionprocessorsendsms/";
  private apiGatewayUrlForAPEntityFieldChange = environment.apiGatewayUrl + "actionprocessorentityfieldchange/";
  private apiGatewayUrlForApCreateEntity = environment.apiGatewayUrl + "actionprocessorcreateentity/";
  private apiGatewayUrlForEhStageMove = environment.apiGatewayUrl + "eventhandlerstagemove/";
  private apiGatewayUrlForTagHandler = environment.apiGatewayUrl + "eventhandlertaghandler/";
  private apiGatewayUrlForTaskCompletionHandler = environment.apiGatewayUrl + "eventhandlertaskcompletionhandler/";
  private apiGatewayUrlForAddChangeDropEntity = environment.apiGatewayUrl + "eventhandleraddchangedropentity/";
  
  constructor(
    public _httpClient: HttpClient,
    public _router: Router,
    public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  clearCacheForApService(){
    const url = this.apiGatewayUrlForApService + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  clearCacheForApTaskCompletion(){
    const url = this.apiGatewayUrlForApTaskCompletion + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  clearCacheForApTagAdd(){
    const url = this.apiGatewayUrlForApTagAdd + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  clearCacheForApSendEmail(){
    const url = this.apiGatewayUrlForApSendEmail + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  clearCacheForApSendSms(){
    const url = this.apiGatewayUrlForApSendSms + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  clearCacheForApEntityFieldChange(){
    const url = this.apiGatewayUrlForAPEntityFieldChange + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  clearCacheForEhStageMove(){
    const url = this.apiGatewayUrlForEhStageMove + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  clearCacheForEhTagHandler(){
    const url = this.apiGatewayUrlForTagHandler + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  clearCacheForEhTaskCompletionHandler(){
    const url = this.apiGatewayUrlForTaskCompletionHandler + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  clearCacheForEhAddChangeDropEntity(){
    const url = this.apiGatewayUrlForAddChangeDropEntity + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  clearCacheForApCreateEntity(){
    const url = this.apiGatewayUrlForApCreateEntity + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }
}
