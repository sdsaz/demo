import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../../@core/common-helper';
import { HttpHelperService } from '../../@core/http-helper.service';
import { PagingParams, BasicPagingParams, AccountPagingParams } from '../../@core/sharedModels/paging-params.model';

@Injectable()
export class AccountsService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "AccountService/";

  private apiWorkTaskGatewayUrl = environment.apiGatewayUrl + "WorkTaskService/"; //api gateway + service name

  constructor(
    public _httpClient: HttpClient,
    public _router: Router,
    public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getAccounts(pagination: AccountPagingParams) {
    const url = this.apiGatewayUrl + 'GetAccounts';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  getAccountCustomFields(entityTypeId: number, entityId: number) {
    let params = { entityTypeId, entityId };
    let url = this.apiGatewayUrl + 'GetAccountCustomFields';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getAccountById(accountId: number) {
    let params = { accountId };
    const url = this.apiGatewayUrl + 'GetAccount';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  updateAccount(account: any) {
    const url = this.apiGatewayUrl + 'UpdateAccount';
    return this.getHttpAuthrizedPostRequest(url, account);
  }

  deleteAccount(accountId: number) {
    let params = { accountId };
    const url = this.apiGatewayUrl + 'DeleteAccount';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  deleteAccountWithRelatedWorkTasks(accountId: number) {
    let params = { accountId };
    const url = this.apiGatewayUrl + 'DeleteAccountWithRelatedWorkTasks';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  downloadImportTemplate(entityWorkflowId) {
    let params: any = {};
        
    if(entityWorkflowId){
      params.entityWorkflowId = entityWorkflowId;
    }

    const url = this.apiGatewayUrl + 'DownloadImportTemplate';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  downloadKanbanImportTemplate(entityWorkflowId) {
    let params = { 'entityWorkflowId': entityWorkflowId };
    const url = this.apiGatewayUrl + 'DownloadKanbanImportTemplate';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  importBulkAccounts(params) {
    const url = this.apiGatewayUrl + 'ImportData';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  getWorkFlowAccounts(pagination: BasicPagingParams) {
    const url = this.apiGatewayUrl + 'GetAccountsByWorkflowIDWithPagination';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  getEntityStagesWithTask(entityWorkflowId) {
    let params = { 'entityWorkflowId': entityWorkflowId };
    const url = this.apiWorkTaskGatewayUrl + 'GetEntityStagesWithTask';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  getAccountsByStage(params) {
    const url = this.apiGatewayUrl + 'GetAccountsByWorkflowIDAndStageID';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  // update account assigned to
  updateAccountAssignedTo(account) {
    let url = this.apiGatewayUrl + 'UpdateAccountAssignedTo';
    return this.getHttpAuthrizedPutRequest(url, account);
  }

  // update account key/custom field
  updateAccountField(params) {
    let url = this.apiGatewayUrl + 'UpdateAccountField';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  updateAccountAssignedToUsers(params) {
    let url = this.apiWorkTaskGatewayUrl + 'updateWorkTaskAssignedToUsers';
    return this.getHttpAuthrizedPutRequest(url, params);
  }

  //Account Contacts
  saveAccountContact(accountContact: any) {
    const url = this.apiGatewayUrl + 'SaveAccountContacts';
    return this.getHttpAuthrizedPostRequest(url, accountContact);
  }

  deleteAccountContact(Id: number) {
    let params = { Id };
    const url = this.apiGatewayUrl + 'DeleteAccountContacts';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  clearCache(){
    const url = this.apiGatewayUrl + 'ClearCache';
    return this.getHttpAuthrizedGetRequest(url);
  }
   // update IsActive
   updateAccountIsActive(account) {
    let url = this.apiGatewayUrl + 'UpdateAccountIsActive';
    return this.getHttpAuthrizedPutRequest(url, account);
  }

  //Account Products
  saveAccountProducts(accountProduct: any) {
    const url = this.apiGatewayUrl + 'SaveAccountProducts';
    return this.getHttpAuthrizedPostRequest(url, accountProduct);
  }

  deleteAccountProducts(id: number) {
    let params = { id };
    const url = this.apiGatewayUrl + 'DeleteAccountProducts';
    return this.getHttpAuthrizedDeleteRequest(url, params);
  }

  getAccountProductById(id: number) {
    let params = { id };
    const url = this.apiGatewayUrl + 'GetAccountProductByID';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  //generate 941x files - quarter wise
  generate941xFiles(accountId: any) {
    const url = this.apiGatewayUrl + 'Generate941xFiles';
    let params = { 'accountId': accountId };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  send941xDocumentsForSignature(accountId:any) {
    const url = this.apiGatewayUrl + 'Send941xDocumentsForSignature';
    let params = { 'accountId': accountId };
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  calculateErc(accountId: number, entityRecordTypeId: number, fileRecordTypeId: number) {
    const url = this.apiGatewayUrl + 'CalculateErc';

    let params: any = { 'accountId': accountId, 'fileRecordTypeId': fileRecordTypeId };
    if(entityRecordTypeId){
      params.entityRecordTypeId = entityRecordTypeId;
    }

    return this.getHttpAuthrizedGetRequest(url, params);
  }

  updateBulkAssignedToUsers(param: any) {
    return this.getHttpAuthrizedPutRequest(this.apiGatewayUrl + 'UpdateBulkAssignedToUsers', param);
  }

  //Export Account Listing
  exportAccountList(pagination: AccountPagingParams) {
    const url = this.apiGatewayUrl + 'ExportAccountsListing';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }

  //Export Account
  exportAccount(pagination: AccountPagingParams) {
    const url = this.apiGatewayUrl + 'ExportAccount';
    return this.getHttpAuthrizedPostRequest(url, pagination);
  }
}
