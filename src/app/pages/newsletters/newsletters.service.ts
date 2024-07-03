import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpHelperService } from '../../@core/http-helper.service';
import { NewsletterPagingParams } from '../../@core/sharedModels/paging-params.model';

@Injectable({
  providedIn: 'root'
})
export class NewslettersService extends HttpHelperService{

  private apiGatewayUrl = environment.apiGatewayUrl + "NewsletterService/";

  getAllNewsletters(pagination: NewsletterPagingParams) {
    const url = this.apiGatewayUrl + 'GetAllNewsletters';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  exportNewsletters(pagination: NewsletterPagingParams) {
    const url = this.apiGatewayUrl + 'ExportNewsletters';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  getNewsletterByID(params) {
    const url = this.apiGatewayUrl + 'GetNewsletterByID';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  saveNewsletter(workTask) {
    const url = this.apiGatewayUrl + 'SaveNewsletter';
    return this.getHttpAuthrizedPostRequest(url, workTask);
  }

  updateNewsletterIsActive(account) {
    let url = this.apiGatewayUrl + 'UpdateNewsletterIsActive';
    return this.getHttpAuthrizedPutRequest(url, account);
  }

  updateNewsletterField(workTask) {
    const url = this.apiGatewayUrl + 'UpdateNewsletterField';
    return this.getHttpAuthrizedPostRequest(url, workTask);
  }

  getNewsletterCustomFields(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    let url = this.apiGatewayUrl + 'GetNewsletterCustomFields';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  deleteNewsletter(newsletterId: number) {
    let params = { newsletterId: newsletterId };
    const url = this.apiGatewayUrl + 'DeleteNewsletter';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  clearCache() {
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }
}
