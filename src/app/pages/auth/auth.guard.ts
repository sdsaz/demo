import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CommonHelper } from '../../@core/common-helper';
import { LocalStorageKey, RefType } from '../../@core/enum';
import { CommonService } from '../../@core/sharedServices/common.service';

import { AuthenticationService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    promiseRequestArray = [];
    requestKeyArray = [];
    requestKeys = {
        displayEntityType: "displayEntityType",
        displayChartType: "displayChartType",

    };

    constructor(
        private _router: Router,
        private _authenticationService: AuthenticationService,
        private _commonHelper: CommonHelper,
        private _commonService: CommonService
    ) {
    }

    canActivate(activatedRouteSnapshot: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.isUserUserAuthorized(activatedRouteSnapshot, state);
    }

    async isUserUserAuthorized(activatedRouteSnapshot: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.getUserAuthDetail().then(response => {
            if (response) {
                const loggedUserDetail = this._commonHelper.getLoggedUserDetail();
                // set app language
                this._commonHelper.setLanguage();
                let returnValue: boolean;
                //check logged user permission
                if (activatedRouteSnapshot.data.permission != undefined) {
                    if (this._commonHelper.havePermission(activatedRouteSnapshot.data.permission)) {
                        returnValue = true;
                    } else {
                        this._router.navigate(['/error']);
                        returnValue = false;
                    }
                } else if (loggedUserDetail) {
                    // if logged user valid then true
                    if (loggedUserDetail.isSuperAdmin) {
                        // role not authorised so redirect to home page
                        if (state.url == '/dashboard/superadmin')
                            returnValue = true;
                        else {
                            this._router.navigate(['/dashboard/superadmin']);
                            returnValue = false;
                        }

                    }
                    returnValue = true;
                }

                this.promiseRequestArray = [];
                this.requestKeyArray = [];

                const widgetDisplayTypeKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.WidgetDisplayType}`;

                this._commonHelper.indicatorViewTypeList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(widgetDisplayTypeKey));
                this._commonHelper.entityTypeList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.DisplayEntityTypeKey));
                
                if (!this._commonHelper.entityTypeList) {
                    const getDisplayEntityType = this._commonService.getEntityTypes();

                    this.requestKeyArray.push(this.requestKeys.displayEntityType);
                    this.promiseRequestArray.push(getDisplayEntityType);
                }


                if (!this._commonHelper.indicatorViewTypeList) {
                    const params = { refType: RefType.WidgetDisplayType };
                    const getDisplayChartType = this._commonService.getActiveReferenceTypeByRefType(params);

                    this.requestKeyArray.push(this.requestKeys.displayChartType);
                    this.promiseRequestArray.push(getDisplayChartType);
                }

                if (this.promiseRequestArray.length > 0) {
                    this._commonHelper.showLoader();
                    return Promise.all(this.promiseRequestArray).then((results) => {
                        if (results && results.length) {
                            this._commonHelper.hideLoader();
                            results.forEach((rs, i) => {
                                let requestKey = this.requestKeyArray[i];
                                if (requestKey == this.requestKeys.displayEntityType) {
                                    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.DisplayEntityTypeKey, JSON.stringify(rs));
                                    this._commonHelper.entityTypeList = rs;
                                }
                                else if (requestKey == this.requestKeys.displayChartType) {
                                    // store in local storage
                                    this._commonHelper.setLocalStorageEncryptData(widgetDisplayTypeKey, JSON.stringify(rs));
                                }
                            });
                            return returnValue;
                        }
                        else {
                            this._commonHelper.hideLoader();
                            return false;
                        }
                    }, (reject) => {
                        this._commonHelper.hideLoader();
                        return false;
                    });
                }
                else
                {
                    return returnValue;
                }
            }
            else {
                // if logged in not valid then redirect to login page with the return url
                this._commonHelper.setLoggedUserDetail(null);
                this._router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
                return false;
            }
        });
    }

    async getUserAuthDetail() {
        //get local temp store logged user detail
        let loggedUserDetail = this._commonHelper.getLoggedUserDetail();
        //get logged user session token
        const loggedUserSessionToken = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.LoginUserSessionToken);
        if (loggedUserSessionToken != null && loggedUserSessionToken !== undefined) {
            const token = loggedUserSessionToken;
            //If exists logged user detail user hash
            let userHash = "";
            if (loggedUserDetail != undefined) {
                userHash = loggedUserDetail.userHash
            }
            //create 
            const params = {
                accessToken: token,
                userHash: userHash
            };
            //check user validate user access token 
            this._commonHelper.showLoader();
            return this._authenticationService.validateUserAccessToken(params).then((response) => {
                if (response != null && response['hashChange'] === true) {
                    this._commonHelper.setLoggedUserDetail(response);
                }

                loggedUserDetail = this._commonHelper.getLoggedUserDetail();
                this._commonHelper.hideLoader();
                return true;
            }, (error) => {
                this._commonHelper.hideLoader();
                this._commonHelper.setLoggedUserDetail(null);
                this._router.navigate(['/auth/login']);
                return false;
            });
        }
    }
}