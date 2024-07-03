import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../auth.service';
import { CommonHelper } from '../../../@core/common-helper';

@Component({
  selector: 'app-logout',  
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

  constructor(private authenticationService: AuthenticationService, private _commonHelper: CommonHelper,
    private _router: Router) { }

  ngOnInit() {
    this._commonHelper.clearAllLocalStorageData();
    this.authenticationService.logout();
    this._router.navigateByUrl('auth/login');
  }
}
