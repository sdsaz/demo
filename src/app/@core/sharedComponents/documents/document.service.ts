import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpHelperService } from '../../http-helper.service';
import { CommonHelper } from '../../common-helper';
import { environment } from '../../../../environments/environment';

@Injectable()

export class DocumentService extends HttpHelperService {

    private apiGatewayUrl = environment.apiGatewayUrl + "documentservice/"; //api gateway + service name
    private apiGatewayUrlMultipart = environment.apiGatewayUrl + 'multipart/documentservice/'; //api gateway + multipart +service name

    constructor(public _httpClient: HttpClient, public _router: Router,public _commonHelper: CommonHelper) {
        super(_httpClient, _router,_commonHelper);
    }

    getAddDocumentUrl() {
        return this.apiGatewayUrlMultipart + 'SaveFile';
    }

    getAllDocuments(params) {
        const url = this.apiGatewayUrl + 'GetFilesByEntityId';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getDocumentDetailById(params) {
        const url = this.apiGatewayUrl + 'GetFileById';
        return this.getHttpAuthrizedGetRequest(url, params);
    }
    
    updateDocument(data) {
        const url = this.apiGatewayUrl + 'UpdateFile';
        return this.getHttpAuthrizedPutRequest(url, data);
    }

    deleteDocument(params) {
        const url = this.apiGatewayUrl + 'DeleteFileById';
        return this.getHttpAuthrizedDeleteRequest(url, params);
    }
    
    DownloadFileById(params) {
        const url = this.apiGatewayUrl + 'DownloadFileById';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    clearCache() {
        const url = this.apiGatewayUrl + 'ClearCache';
        return this.getHttpAuthrizedGetRequest(url);
    }

    saveFileCustomFieldData(params) {
        const url = this.apiGatewayUrl + 'SaveFileCustomField';
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    getS3BucketURLByEntityID(entityID){
    
        const url = this.apiGatewayUrl + 'GetS3BucketURLByEntityID';
        const params = { 'entityID': entityID };
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getFileSignedUrl(params: any) {
        return this.getHttpAuthrizedPostRequest(this.apiGatewayUrl + 'GetFileSignedUrl', params);
    }

    getEntityFileList(params) {
        const url = this.apiGatewayUrl + 'GetEntityFileList';
        return this.getHttpAuthrizedPostRequest(url,params);
    }

    bulkDeleteFiles(params) {
        const url = this.apiGatewayUrl + 'BulkDeleteFiles';
        const fileIds = { 'ids': params  }
        return this.getHttpAuthrizedPostRequest(url, fileIds);
    }

    bulkEditFiles(params) {
        const url = this.apiGatewayUrl + 'BulkEditFiles';
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    getS3BucketURL() {
        return this.getHttpAuthrizedGetRequest(this.apiGatewayUrl + 'GetS3BucketURL');
    }
}