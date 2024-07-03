import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpHelperService } from '../../@core/http-helper.service';
import { CommonHelper } from '../../@core/common-helper';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { OpportunityItemsPagingParams } from '../../@core/sharedModels/paging-params.model';

@Injectable({
  providedIn: 'root'
})
export class OpportunitiesService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "Opportunityservice/"; //api gateway + service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getOpportunityById(id, entityWorkflowId) {
    let params = null;
    if (entityWorkflowId) {
      params = { id, entityWorkflowId };
    }
    else {
      params = { id };
    }
    const url = this.apiGatewayUrl + 'GetOpportunityById';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getOpportunityCustomFields(params) {
    const url = this.apiGatewayUrl + 'GetOpportunityCustomFields'
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getOpportunitiesByWorkFlowIDWithPagination(params) {
    const url = this.apiGatewayUrl + 'GetOpportunitiesByWorkFlowIDWithPagination'
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  GetOpportunitiesListWithPagination(params) {
    const url = this.apiGatewayUrl + 'GetOpportunitiesListWithPagination'
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  /**
    * Generate Excel for Opportunities
    * @param params Pagination Payload
    * @returns
    */
  exportOpportunities(params) {
    return this.getHttpAuthrizedPostRequest(`${this.apiGatewayUrl}ExportOpportunities`, params);
  }

  getOpportunitiesByWorkFlowIDAndStageID(params) {
    const url = this.apiGatewayUrl + 'GetOpportunitiesByWorkFlowIDAndStageID'
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  saveOpportunity(params) {
    const url = this.apiGatewayUrl + 'SaveOpportunity'
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  deleteOpportunity(opportunityId) {
    const url = this.apiGatewayUrl + 'DeleteOpportunity';
    const params = { 'id': opportunityId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  updateOpportunityAssignedToUsers(params) {
    let url = this.apiGatewayUrl + 'UpdateOpportunityAssignedToUsers';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateOpportunityAssignedTo(params) {
    let url = this.apiGatewayUrl + 'UpdateOpportunityAssignedTo';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateOpportunityPriority(params) {
    let url = this.apiGatewayUrl + 'UpdateOpportunityPriority';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateOpportunitySeverity(params) {
    let url = this.apiGatewayUrl + 'UpdateOpportunitySeverity';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateOpportunityDueDate(params) {
    let url = this.apiGatewayUrl + 'UpdateOpportunityDueDate';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateOpportunityOwner(params) {
    let url = this.apiGatewayUrl + 'UpdateOpportunityOwner';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  updateOpportunityField(params) {
    let url = this.apiGatewayUrl + 'UpdateOpportunityField';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  // download template
  downloadImportTemplate(entityWorkflowId, parentEntityTypeId) {
    let params: any = {};

    if (parentEntityTypeId) {
      params.parentEntityTypeId = parentEntityTypeId;
    }

    if (entityWorkflowId) {
      params.entityWorkflowId = entityWorkflowId;
    }
    return this.getHttpAuthrizedGetRequest(this.apiGatewayUrl + 'DownloadImportTemplate', params);
  }

  // import Opportunities
  importBulkOpportunities(params) {
    return this.getHttpAuthrizedPostRequest(this.apiGatewayUrl + 'ImportData', params);
  }

  changeOpportunityPriceBook(params) {
    let url = this.apiGatewayUrl + 'ChangeOpportunityPriceBook';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  getOpportunityItems(pagination: OpportunityItemsPagingParams) {
    const url = this.apiGatewayUrl + 'GetOpportunityItems';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  saveOpportunityItems(opportunityItems: any) {
    const url = this.apiGatewayUrl + 'SaveOpportunityItems';
    return this.getHttpAuthrizedPostRequest(url, opportunityItems);
  }

  deleteOpportunityItem(opportunityItemId) {
    const url = this.apiGatewayUrl + 'DeleteOpportunityItem';
    const params = { 'opportunityItemId': opportunityItemId };
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  changeEntityRecordType(opportunityIds, entityRecordTypeId) {
    let params = null;
    if (entityRecordTypeId) {
      params = { opportunitiesIds: opportunityIds, entityRecordTypeId };
    } else {
      params = { opportunitiesIds: opportunityIds };
    }
    const url = this.apiGatewayUrl + 'ChangeEntityRecordType';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  changeOpportunityEntityType(opportunityIds, workflowId) {
    let params = { 'opportunitiesIds': opportunityIds, 'entityWorkflowId': workflowId };
    const url = this.apiGatewayUrl + 'ChangeOpportunityEntityType';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  clearCache() {
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  // export Opportunity listing
  exportOpportunity(params){
    return this.getHttpAuthrizedPostRequest(`${this.apiGatewayUrl}ExportOpportunitiesListing`, params);
}
}
