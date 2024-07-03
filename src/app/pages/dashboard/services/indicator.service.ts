import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CommonHelper } from '../../../@core/common-helper';
import { HttpHelperService } from '../../../@core/http-helper.service';


@Injectable({
  providedIn: 'root'
})
export class IndicatorService extends HttpHelperService  {

  private apiGatewayUrlForDashboardService = environment.apiGatewayUrl + 'dashboardservice/'; //api gateway + multipart +service name

  selectedData = new Subject();
  IndicatorSize = new Subject();
  indicatorData = new BehaviorSubject({});
  filterConfig = new Subject<{ filterName: string, filterValue: string, indicatorId: number }>();
  showBackBtn = new BehaviorSubject({});
  showCheckBoxCol = new Subject();
  isAscending = new Subject();
  exportTableData = new Subject();
  displayActionRecomm = new Subject();

  constructor(public _httpClient: HttpClient, public _router: Router, public _commonHelper: CommonHelper) {
    super(_httpClient, _router, _commonHelper);
  }

}
