import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CommonHelper } from '../../common-helper';
import { HttpHelperService } from '../../http-helper.service';

@Injectable({
  providedIn: 'root'
})

export class NoteService extends HttpHelperService {

  private apiGatewayUrl = environment.apiGatewayUrl + "activityservice/"; //api gateway + service name

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

  getNoteDetailById(params) {
    const url = this.apiGatewayUrl + 'GetNoteDetailsById';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

  addNewNote(params) {
    const url = this.apiGatewayUrl + 'AddNote';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  updateNote(params) {
    const url = this.apiGatewayUrl + 'UpdateNote';
    return this.getHttpAuthrizedPostRequest(url, params);
  }

  deleteNote(params) {
    const url = this.apiGatewayUrl + 'DeleteNote';
    return this.getHttpAuthrizedGetRequest(url, params);
  }

}
