import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { UserLoginModel, SingleSignOnModel } from '../usermanagement/users/user.model';
import { HttpHelperService } from '../../@core/http-helper.service';
import { ResetPasswordModel } from './reset-password/reset-password.model';
import { CommonHelper } from '../../@core/common-helper';
import { LocalStorageKey } from '../../@core/enum';

@Injectable()
export class AuthenticationService extends HttpHelperService {

    private apiGatewayUrl = environment.apiGatewayUrl + "userservice/"; //api gateway + service name

    constructor(public _httpClient: HttpClient,
        public _router: Router,
        public _commonHelper: CommonHelper) {
        super(_httpClient, _router, _commonHelper);
    }

    login(userLoginModel: UserLoginModel) {
        let url = this.apiGatewayUrl + "LoginUser";
        return this.getHttpPostRequest(url, userLoginModel);
    }

    switchUserLoginTenant(tenantID, accessToken) {
        let url = this.apiGatewayUrl + "SwitchUserLoginTenant";
        const params = { 'tenantID': tenantID, 'accessToken': accessToken };
        return this.getHttpGetRequest(url, params);
    }

    logout() {
        let url = this.apiGatewayUrl + "LogoutUser";
        //get logged user detail
        let localStorageData = this._commonHelper.getLoggedUserDetail();

        let accessToken = "";
        if (localStorageData != null) {
            accessToken = localStorageData.accessToken;
        } else {
            accessToken = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.LoginUserSessionToken);
        }

        let params = { accessToken: accessToken }
        this._commonHelper.showLoader();
        return this.getHttpGetRequest(url, params).then(response => {
            //clear local storage - all keys
            this._commonHelper.clearAllLocalStorageData();
            this._commonHelper.assignedEntityCounts = null;
            this._commonHelper.hideLoader();
        },
            (error) => {
                this._commonHelper.hideLoader();
            });
    }

    forgotPassword(userName) {
        const url = this.apiGatewayUrl + "sendForgetEmail";
        const params = { 'userName': userName };
        return this.getHttpGetRequest(url, params);
    }


    getUserDetailByPasswordResetHash(passwordResetHash) {
        const url = this.apiGatewayUrl + "verifyUserByPasswordResetHash";
        const params = { 'passwordResetHash': passwordResetHash };
        return this.getHttpGetRequest(url, params);
    }

    resetPassword(resetModel: ResetPasswordModel) {
        const url = this.apiGatewayUrl + "resetUserPassword";
        const body = resetModel;
        return this.getHttpPutRequest(url, body);
    }

    validateUserAccessToken(data) {
        const url = this.apiGatewayUrl + "ValidateUserAccessToken";
        const params = { 'accessToken': data.accessToken };
        return this.getHttpGetRequest(url, params);
    }

    //GetUserByActivationHash
    getUserByActivationHash(activationHash) {
        const url = this.apiGatewayUrl + "GetUserByActivationHash";
        const params = { 'activationHash' : activationHash };
        return this.getHttpGetRequest(url, params);
    }

    updateUserVerification(data) {
        const url = this.apiGatewayUrl + "UpdateUserVerification";
        const body = data;
        return this.getHttpPutRequest(url, body);
    }

    verifyEmail(emailVerificationHash: string) {
        return this.getHttpGetRequest(this.apiGatewayUrl + "EmailVerification", { 'emailVerificationHash': emailVerificationHash });
    }
}
