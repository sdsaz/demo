import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpHelperService } from '../../@core/http-helper.service';
import { CampaignPagingParams } from '../../@core/sharedModels/paging-params.model';

@Injectable({
  providedIn: 'root'
})
export class CampaignsService extends HttpHelperService{

  private apiGatewayUrl = environment.apiGatewayUrl + "CampaignService/";

  getAllCampaigns(pagination: CampaignPagingParams) {
    const url = this.apiGatewayUrl + 'GetAllCampaigns';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  getCampaignByID(params) {
    const url = this.apiGatewayUrl + 'GetCampaignByID';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  saveCampaign(campaign) {
    const url = this.apiGatewayUrl + 'SaveCampaign';
    return this.getHttpAuthrizedPostRequest(url, campaign);
  }

  updateCampaignIsActive(campaign) {
    let url = this.apiGatewayUrl + 'UpdateCampaignIsActive';
    return this.getHttpAuthrizedPutRequest(url, campaign);
  }

  updateCampaignField(workTask) {
    const url = this.apiGatewayUrl + 'UpdateCampaignField';
    return this.getHttpAuthrizedPostRequest(url, workTask);
  }

  getCampaignCustomFields(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    let url = this.apiGatewayUrl + 'GetCampaignCustomFields';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  deleteCampaign(campaignId: number) {
    let params = { campaignId: campaignId };
    const url = this.apiGatewayUrl + 'DeleteCampaign';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  saveCampaignNewsletter(params){
    const url = this.apiGatewayUrl + 'SaveCampaignNewsletter';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  deleteCampaignNewsletter(id: number) {
    let params = { id: id };
    const url = this.apiGatewayUrl + 'DeleteCampaignNewsletter';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  changeCampaignNewsletterDisplayOrder(params){
    const url = this.apiGatewayUrl + 'ChangeCampaignNewsletterDisplayOrder';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  clearCache() {
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }

  // export Campaigns listing
  exportCampaigns(params){
    return this.getHttpAuthrizedPostRequest(`${this.apiGatewayUrl}ExportCampaignsListing`, params);
}
}
