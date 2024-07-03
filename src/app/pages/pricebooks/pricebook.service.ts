import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../../@core/common-helper';
import { HttpHelperService } from '../../@core/http-helper.service';
import { BasicPagingParams, PriceBookItemsForOpportunityPagingParams, PriceBookItemsPagingParams, PriceBookPagingParams } from '../../@core/sharedModels/paging-params.model';

@Injectable({
  providedIn: 'root'
})

export class PricebookService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "PriceBookService/";

  constructor(
    public _httpClient: HttpClient,
    public _router: Router,
    public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getPriceBooks(pagination: PriceBookPagingParams) {
    const url = this.apiGatewayUrl + 'GetPriceBooks';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  exportPriceBooks(pagination: PriceBookPagingParams) {
    const url = this.apiGatewayUrl + 'ExportPriceBooks';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  getPriceBookById(priceBookId) {
    const url = this.apiGatewayUrl + 'GetPriceBookDetailsWithCustomFieldsById';
    let params = { priceBookId: priceBookId };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getPriceBookCustomFields(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    let url = this.apiGatewayUrl + 'GetPriceBookCustomFields';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  savePriceBook(priceBook: any) {
    const url = this.apiGatewayUrl + 'SavePriceBook';
    return this.getHttpAuthrizedPostRequest(url, priceBook);
  }

  updatePriceBookField(workTask) {
    const url = this.apiGatewayUrl + 'UpdatePriceBookField';
    return this.getHttpAuthrizedPostRequest(url, workTask);
  }

  copyPriceBook(priceBook: any) {
    const url = this.apiGatewayUrl + 'CopyPriceBook';
    return this.getHttpAuthrizedPostRequest(url, priceBook);
  }

  deletePriceBook(priceBookId: number) {
    const params = { priceBookId };
    const url = this.apiGatewayUrl + 'DeletePriceBook';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  changePriceBookStatus(priceBookId, status) {
    const url = this.apiGatewayUrl + 'ChangePriceBookStatus';
    const params = {
      'priceBookId': priceBookId,
      'status': status
    };
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  getPriceBookItems(pagination: PriceBookItemsPagingParams) {
    const url = this.apiGatewayUrl + 'GetPriceBookItems';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  getDefaultPriceBookAddItems(pagination: BasicPagingParams) {
    const url = this.apiGatewayUrl + 'GetDefaultPriceBookItems';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  savePriceBookItems(priceBook: any) {
    const url = this.apiGatewayUrl + 'SavePriceBookItems';
    return this.getHttpAuthrizedPostRequest(url, priceBook);
  }

  getPriceBookItemsForOpportunity(pagination: PriceBookItemsForOpportunityPagingParams) {
    const url = this.apiGatewayUrl + 'GetPriceBookItemsForOpportunity';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  deletePriceBookItem(priceBookItemId: number) {
    const params = { priceBookItemId: priceBookItemId };
    const url = this.apiGatewayUrl + 'DeletePriceBookItem';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  clearCache() {
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }
}