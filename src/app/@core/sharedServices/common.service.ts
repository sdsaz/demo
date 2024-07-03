import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpHelperService } from '../../@core/http-helper.service';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../../@core/common-helper';
@Injectable()

export class CommonService extends HttpHelperService {
    private apiGatewayUrlForCommonService = environment.apiGatewayUrl + 'commonservice/'; //api gateway + multipart +service name

    constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
        super(_httpClient, _router, _commonHelper);
    }

    //Common Service Methods
    getStates() {
        const url = this.apiGatewayUrlForCommonService + "GetStates";
        return this.getHttpAuthrizedGetRequest(url)
    }

    getCountries() {
        const url = this.apiGatewayUrlForCommonService + "GetCountries";
        return this.getHttpAuthrizedGetRequest(url)
    }

    // get all
    getEntityTypes() {
        return new Promise((resolve, reject) => {
            const url = this.apiGatewayUrlForCommonService + "GetEntityTypes";
            this.getHttpAuthrizedGetRequest(url).then((displayEntityList: any) => {
                if (displayEntityList) {
                    resolve(displayEntityList);
                }
            },
                (error) => {
                    reject(error);
                });
        });
    }

    // get only those whose isDisplay is true
    getDisplayEntityType() {
        return new Promise((resolve, reject) => {
            const url = this.apiGatewayUrlForCommonService + "GetDisplayEntityType";
            this.getHttpAuthrizedGetRequest(url).then((displayEntityList: any) => {
                if (displayEntityList) {
                    resolve(displayEntityList);
                }
            },
                (error) => {
                    reject(error);
                });
        });
    }

    getEntityWithRecordType() {
        const url = this.apiGatewayUrlForCommonService + "GetEntityWithRecordType";
        return this.getHttpAuthrizedGetRequest(url);

    }

    getDisplayEntityWithRecordType() {
        const url = this.apiGatewayUrlForCommonService + "GetDisplayEntityWithRecordType";
        return this.getHttpAuthrizedGetRequest(url);

    }

    getActiveReferenceTypeByRefType(params) {
        const url = this.apiGatewayUrlForCommonService + "GetActiveReferenceTypeByRefType";
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getAllWebAccessibleReferenceTypes() {
        const url = this.apiGatewayUrlForCommonService + "GetAllWebAccessibleReferenceTypes";
        return this.getHttpAuthrizedGetRequest(url);
    }

    getEntityRecordTypesByEntityTypeId(params) {
        let url = this.apiGatewayUrlForCommonService + "GetEntityRecordTypesByEntityTypeId";
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getEntityRecordTypesByCode(params) {
        let url = this.apiGatewayUrlForCommonService + "GetEntityRecordTypesByCode";
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getDynamicComponentDetailsByCode(code: string) {
        let url = this.apiGatewayUrlForCommonService + "GetDynamicComponentDetailsByCode";
        return this.getHttpAuthrizedGetRequest(url, { code });
    }

    clearCache() {
        const url = this.apiGatewayUrlForCommonService + 'ClearCache';
        return this.getHttpAuthrizedGetRequest(url);
    }

    getActiveShipingMethods() {
        let url = this.apiGatewayUrlForCommonService + "GetActiveShipingMethods";
        return this.getHttpAuthrizedGetRequest(url);
    }

    getCustomFieldsForList(params) {
        let url = this.apiGatewayUrlForCommonService + "GetCustomFieldValuesForList";
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    getCustomFields(params) {
        let url = this.apiGatewayUrlForCommonService + "GetCustomFields";
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getEntityReferences(params) {
        let url = this.apiGatewayUrlForCommonService + "GetEntityReferences";
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    getEntityRecordTypes() {
        const url = this.apiGatewayUrlForCommonService + "GetRecordTypes";
        return this.getHttpAuthrizedGetRequest(url);
    }

    getEntitiesBySearchText(params) {
        const url = this.apiGatewayUrlForCommonService + "GetEntitiesBySearchText";
        return this.getHttpAuthrizedGetRequest(url,params);
    }

    getNativeTabDetailsByEntityTypeId(entityTypeId) {
        const url = this.apiGatewayUrlForCommonService + "GetNativeTabDetailsByEntityTypeId";
        const params = { 'entityTypeId': entityTypeId }
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    getEntityKeyFields(params) {
        let url = this.apiGatewayUrlForCommonService + "GetEntityKeyFields";
        return this.getHttpAuthrizedPostRequest(url, params);
    }

    getEntitySubTypes() {
        const url = this.apiGatewayUrlForCommonService + "GetEntitySubTypes";
        return this.getHttpAuthrizedGetRequest(url);
    }

    getEntitySubTypesByEntityTypeId(entityTypeId) {
        const url = this.apiGatewayUrlForCommonService + "GetEntitySubTypesByEntityTypeId";
        const params = { 'entityTypeId': entityTypeId }
        return this.getHttpAuthrizedGetRequest(url);
    }

    getEntityHiddenFields() {
        const url = this.apiGatewayUrlForCommonService + 'GetEntityHiddenFields';
        return this.getHttpAuthrizedGetRequest(url);
    }

    GetEntityStageTeamOwnerWithPrivacy(payload: any) {
        const url = this.apiGatewayUrlForCommonService + 'GetEntityStageTeamOwner';
        return this.getHttpAuthrizedPostRequest(url, payload);
    }
}
