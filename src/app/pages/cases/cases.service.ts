import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpHelperService } from '../../@core/http-helper.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonHelper } from '../../@core/common-helper';

@Injectable()
export class CasesService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "CaseService/";

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getCaseByID(id, entityWorkflowId) {
    let params = null;
    if (entityWorkflowId) {
      params = { id, entityWorkflowId };
    }
    else {
      params = { id };
    }
    const url = this.apiGatewayUrl + 'GetCaseByID';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getCaseList(params: any) {
    const url = this.apiGatewayUrl + 'GetCaseList';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  getCaseCustomFields(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    let url = this.apiGatewayUrl + 'GetCaseCustomFields';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getCasesByWorkflowIDWithPagination(params) {
    const url = this.apiGatewayUrl + 'GetCasesByWorkflowIDWithPagination';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  getCasesByWorkflowIDAndStageID(params) {
    const url = this.apiGatewayUrl + 'GetCasesByWorkflowIDAndStageID';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  exportCases(params) {
    return this.getHttpAuthrizedPostRequest(`${this.apiGatewayUrl}ExportCases`, params);
  }

  saveCase(caseItem) {
    const url = this.apiGatewayUrl + 'SaveCase';
    return this.getHttpAuthrizedPostRequest(url, caseItem);
  }

  updateCaseAssignedToUsers(params) {
    let url = this.apiGatewayUrl + 'UpdateCaseAssignedToUsers';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateCaseAssignedTo(params) {
    let url = this.apiGatewayUrl + 'UpdateCaseAssignedTo';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateCaseField(params) {
    let url = this.apiGatewayUrl + 'UpdateCaseField';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  updateCasePriority(params) {
    let url = this.apiGatewayUrl + 'UpdateCasePriority';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateCaseSeverity(params) {
    let url = this.apiGatewayUrl + 'UpdateCaseSeverity';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateCaseDueDate(params) {
    let url = this.apiGatewayUrl + 'UpdateCaseDueDate';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateCaseVerifiedBy(params) {
    let url = this.apiGatewayUrl + 'UpdateCaseVerifiedBy';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateEntityRecordType(caseIds, workflowId) {
    let params = { 'caseIds': caseIds, 'entityWorkflowId': workflowId };
    const url = this.apiGatewayUrl + 'UpdateEntityRecordType';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  updateDefaultEstimatedTimeAndPoint(caseIds, workflowId) {
    let params = { caseIds, workflowId };
    const url = this.apiGatewayUrl + 'UpdateDefaultEstimatedTimeAndPoint';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  isSubCaseExist(id) {
    let params = { id };
    const url = this.apiGatewayUrl + 'IsSubCaseExist';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  deleteCase(caseId) {
    const url = this.apiGatewayUrl + 'DeleteCase';
    const params = { 'id': caseId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  updateCase(cases) {
    const url = this.apiGatewayUrl + 'UpdateCase';
    return this.getHttpAuthrizedPostRequest(url, cases);
  }

  changeEntityRecordType(caseIds, entityRecordTypeId) {
    let params = null;
    if (entityRecordTypeId) {
      params = { caseIds, entityRecordTypeId };
    }
    else {
      params = { caseIds };
    }
    const url = this.apiGatewayUrl + 'ChangeEntityRecordType';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  changeCaseEntityType(caseIds, workflowId) {
    let params = { 'caseIds': caseIds, 'entityWorkflowId': workflowId };
    const url = this.apiGatewayUrl + 'ChangeCaseEntityType';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  // import cases
  importBulkCases(params) {
    const url = this.apiGatewayUrl + 'ImportData';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  // download cases template
  downloadImportTemplate(entityWorkflowId, parentEntityTypeId) {
    let params: any = {};

    if (parentEntityTypeId) {
      params.parentEntityTypeId = parentEntityTypeId;
    }

    if (entityWorkflowId) {
      params.entityWorkflowId = entityWorkflowId;
    }
    
    const url = this.apiGatewayUrl + 'DownloadImportTemplate';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  clearCache() {
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  //export Cases List
  exportCasesList(params: any) {
    const url = this.apiGatewayUrl + 'ExportCaseList';
    return this.getHttpAuthrizedPostRequest(url, params);
  }
}
