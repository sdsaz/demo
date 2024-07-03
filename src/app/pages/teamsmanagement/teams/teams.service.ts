import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpHelperService } from '../../../@core/http-helper.service';
import { environment } from '../../../../environments/environment';
import { CommonHelper } from '../../../@core/common-helper';

@Injectable({
  providedIn: 'root'
})
export class TeamsService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "userservice/"; //api gateway + service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getTeams(pagingParams) {
    const url = this.apiGatewayUrl + "GetTeams";
    const body = pagingParams;
    return this.getHttpAuthrizedPostRequest(url, body);
  }

  getTeambyId(id) {
    const url = this.apiGatewayUrl + 'GetTeam';
    const params = { 'id': id };
    return this.getHttpAuthrizedGetRequest(url, params);
  }
  addTeam(params) {
    const url = this.apiGatewayUrl + "AddTeam";
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  addTeamMember(params) {
    const url = this.apiGatewayUrl + "AddTeamMember";
    return this.getHttpAuthrizedPostRequest(url, params);
  }
  
  updateTeamMember(params) {
    const url = this.apiGatewayUrl + "UpdateTeamMember";
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateTeam(params) {
    const url = this.apiGatewayUrl + "UpdateTeam";
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  deleteteam(teamId) {
    const url = this.apiGatewayUrl + 'DeleteTeam';
    const params = { 'id': teamId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  deleteteammember(Id) {
    const url = this.apiGatewayUrl + 'DeleteTeamMember';
    const params = { 'Id': Id };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  getTeamMemberbyId(id) {
    const url = this.apiGatewayUrl + 'GetTeamMemberByID';
    const params = { 'Id': id };
    return this.getHttpAuthrizedGetRequest(url, params);
  }
  getMyTeams() {
    const url = this.apiGatewayUrl + 'GetMyTeams';
    return this.getHttpAuthrizedGetRequest(url);
  }
  
  getTeamMembersbyTeamId(teamId) {
    const url = this.apiGatewayUrl + 'GetTeamMembersByTeamId';
    const params = { 'teamId': teamId };
    return this.getHttpAuthrizedGetRequest(url,params);
  }

  downloadImportTeamMembersTemplate() {
    const url = this.apiGatewayUrl + 'DownloadImportTeamMembersTemplate';
    return this.getHttpAuthrizedGetRequest(url);
  }

  importTeamMembers(params) {
    const url = this.apiGatewayUrl + 'ImportTeamMembers';
    return this.getHttpAuthrizedPostRequest(url, params); 
  }
}
