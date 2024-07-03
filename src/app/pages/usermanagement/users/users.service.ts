import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { HttpHelperService } from '../../../@core/http-helper.service';
import { environment } from '../../../../environments/environment';
import { CommonHelper } from '../../../@core/common-helper';

@Injectable()
export class UsersService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "userservice/"; //api gateway + service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getUsers(pagingParams) {
    const url = this.apiGatewayUrl + "GetUsers";
    const body = pagingParams;
    return this.getHttpAuthrizedPostRequest(url, body);
  }

  loginImpersonate(userId){
    const url = this.apiGatewayUrl + 'ImpersonateLogin';
    const params = { 'userId': userId };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getUserById(userId) {
    const url = this.apiGatewayUrl + 'GetUser';
    const params = { 'id': userId };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getRoles() {
    const url = this.apiGatewayUrl + "GetRoles";
    return this.getHttpAuthrizedGetRequest(url);
  }

  getAllActivePermissions() {
    const url = this.apiGatewayUrl + "GetAllActivePermissions";
    return this.getHttpAuthrizedGetRequest(url);
  }

  getPermissionsByUserRole(roleIds) {
    const url = this.apiGatewayUrl + 'getPermissionsByUserRole';
    const params = { 'roleIds': roleIds };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  addUsers(user) {
    const url = this.apiGatewayUrl + "AddUser";
    const body = user;
    return this.getHttpAuthrizedPostRequest(url, body);
  }

  addUserTenant(user) {
    const url = this.apiGatewayUrl + "AddUserTenant";
    const body = user;
    return this.getHttpAuthrizedPostRequest(url, body);
  }

  updateUser(user) {
    let url = this.apiGatewayUrl + "UpdateUser";
    const body = user;
    return this.getHttpAuthrizedPutRequest(url, body);
  }

  delete(userId) {
    const url = this.apiGatewayUrl + 'DeleteUser';
    const params = { 'id': userId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  resetPasswordByAdmin(user) {
    const url = this.apiGatewayUrl + "ResetPasswordByAdmin";
    const body = user;
    return this.getHttpAuthrizedPutRequest(url, body);
  }

  getAllTimeZone() {
    const url = this.apiGatewayUrl + "GetAllTimeZone";
    return this.getHttpAuthrizedGetRequest(url);
  }

  sendUserActivationEmail(params) {
    const url = this.apiGatewayUrl + "SendUserActivationEmail";
    return this.getHttpAuthrizedGetRequest(url, params);
  }


  getUserMenuItems() {
    const url = this.apiGatewayUrl + 'GetUserMenuItems';
    return this.getHttpAuthrizedGetRequest(url);
  }

  getAssignedEntityCounts() {
    const url = this.apiGatewayUrl + 'GetAssignedEntityCounts';
    return this.getHttpAuthrizedGetRequest(url);
  }

  getUserCurrentTimeWithNextRoundUpTime(params) {
    const url = this.apiGatewayUrl + "GetUserCurrentTimeWithNextRoundUpTime";
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getUserProfileData(userTypeId: number, userId: number, privacyLevel?: number) {

    let params: any = {
      userTypeId: userTypeId,
      userId: userId
    }

    if (privacyLevel) {
      params.privacyLevel = privacyLevel;
    }

    const url = this.apiGatewayUrl + "GetUserProfileData";
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  GetAllUserProfileData(userTypeId: number, userId: number, privacyLevel?: number) {

    let params: any = {
      userTypeId: userTypeId,
      userId: userId
    }

    if (privacyLevel) {
      params.privacyLevel = privacyLevel;
    }

    const url = this.apiGatewayUrl + "GetAllUserProfileData";
    return this.getHttpAuthrizedGetRequest(url, params);
  }
  

  clearCache() {
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  changeUserStatus(userId, status) {
    const url = this.apiGatewayUrl + 'ChangeUserStatus';
    const params = {
      'userId': userId,
      'status': status
    };
    return this.getHttpAuthrizedPostRequest(url, params);
  }
}
