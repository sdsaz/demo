import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpHelperService } from '../../http-helper.service';
import { CommonHelper } from '../../common-helper';
import { environment } from '../../../../environments/environment';


@Injectable()

export class ActivityService extends HttpHelperService {

    private apiGatewayUrl = environment.apiGatewayUrl + "activityservice/"; //api gateway + service name

    constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
        super(_httpClient, _router, _commonHelper);
    }

    saveTask(task) {
        const url = this.apiGatewayUrl + 'AddTask';
        return this.getHttpAuthrizedPostRequest(url, task);
    }

    updateTask(task) {
        const url = this.apiGatewayUrl + 'UpdateTask';
        return this.getHttpAuthrizedPutRequest(url, task);
    }

    getTaskDetailById(params){
        const url = this.apiGatewayUrl + 'GetTaskDetailById';
        return this.getHttpAuthrizedGetRequest(url, params);
    }
    
    getActivityList(params) {
        const url = this.apiGatewayUrl + 'GetAllActivities';
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    getActivitiesHistory(params) {
        const url = this.apiGatewayUrl + 'GetActivitiesHistory';
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    clearCache() {
        const url = this.apiGatewayUrl + 'ClearCache';
        return this.getHttpAuthrizedGetRequest(url);
    }

    GetBookmarkById(params) {
        const url = this.apiGatewayUrl + 'GetBookmarkById';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    SaveBookmark(params) {
        const url = this.apiGatewayUrl + 'SaveBookmark';
        return this.getHttpAuthrizedPostRequest(url, params);
    }
}
