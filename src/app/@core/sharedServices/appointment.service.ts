import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpHelperService } from '../http-helper.service';
import { environment } from '../../../environments/environment';
import { CommonHelper } from '../common-helper';
import { AppointmentPagingParams } from '../sharedModels/paging-params.model';

@Injectable({
  providedIn: 'root'
})

export class AppointmentService extends HttpHelperService {

    private apiGatewayUrl = environment.apiGatewayUrl + "appointmentservice/"; //api gateway + service name

    constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
        super(_httpClient, _router, _commonHelper);
    }

    getAllAppointments(pagination: AppointmentPagingParams) {
        const url = this.apiGatewayUrl + 'GetAllAppointments';
        return this.getHttpAuthrizedPostRequest(url, pagination);
    }

    saveAppointment(appointment) {
        const url = this.apiGatewayUrl + 'AddEvent';
        return this.getHttpAuthrizedPostRequest(url, appointment);
    }

    getEventDetailById(params){
        const url = this.apiGatewayUrl + 'GetEventDetailById';
        return this.getHttpAuthrizedGetRequest(url, params);
    }

    deleteAppointment(id: number) {
        let params = { appointmentId: id };
        const url = this.apiGatewayUrl + 'DeleteAppointment'; 
        return this.getHttpAuthrizedDeleteRequest(url, params);
    }
    
    getAppointmentCustomFields(entityTypeId: number, entityId: number) {
        let params = { entityTypeId, entityId };
        let url = this.apiGatewayUrl + 'GetAppointmentCustomFields';
        return this.getHttpAuthrizedGetRequest(url, params);
      }

      updateAppointmentField(appointment) {
        const url = this.apiGatewayUrl + 'UpdateAppointmentField';
        return this.getHttpAuthrizedPostRequest(url, appointment);
      }

    // export Appointments listing
    exportAppointments(params){
    return this.getHttpAuthrizedPostRequest(`${this.apiGatewayUrl}ExportAppointmentsListing`, params);
    }
}
