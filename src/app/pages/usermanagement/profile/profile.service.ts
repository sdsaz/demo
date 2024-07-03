import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { HttpHelperService } from '../../../@core/http-helper.service';
import { environment } from '../../../../environments/environment';
import { CommonHelper } from '../../../@core/common-helper';
import { CommonService } from '../../../@core/sharedServices/common.service';

@Injectable()
export class ProfileService extends HttpHelperService {

    private apiGatewayUrl = environment.apiGatewayUrl + "userservice/"; //api gateway + service name

    constructor(public _httpClient: HttpClient, public _router: Router,public _commonHelper: CommonHelper) {
        super(_httpClient, _router,_commonHelper);
    }

    getProfileDetail() {
        let url = this.apiGatewayUrl + "GetMyProfile";
        return this.getHttpAuthrizedGetRequest(url);
    }

    saveBasicInfo(profile) {
        let url = this.apiGatewayUrl + "SaveMyProfile";
        return this.getHttpAuthrizedPostRequest(url, profile);
    }

    saveProfileAboutMe(profile) {
        let url = this.apiGatewayUrl + "SaveProfileAboutMe";
        return this.getHttpAuthrizedPostRequest(url, profile);
    }

    saveAddress(address) {
        let url = this.apiGatewayUrl + "SaveMyAddress";
        return this.getHttpAuthrizedPostRequest(url, address);
    }

    saveChangePasswordForm(changePassword) {
        let url = this.apiGatewayUrl + "ChangeMyPassword";
        return this.getHttpAuthrizedPostRequest(url, changePassword);
    }

    getAllTimeZone() {
        let url = this.apiGatewayUrl + "GetAllTimeZone";
        return this.getHttpAuthrizedGetRequest(url);
    }  
}
