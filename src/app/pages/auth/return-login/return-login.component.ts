import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../auth.service';
import { CommonHelper } from '../../../@core/common-helper';

@Component({
  selector: 'app-return-login',
  templateUrl: './return-login.component.html',
  styleUrls: ['./return-login.component.scss']
})
export class ReturnLoginComponent implements OnInit {
    loggedInUser: any;

    constructor(private authenticationService: AuthenticationService,
        private _router: Router,
        private _commonHelper: CommonHelper) { }

    ngOnInit() {
        this.loggedInUser = this._commonHelper.getLoggedUserDetail();
        let impersonateAccessToken = null;
        if (this.loggedInUser && this.loggedInUser.impersonateAccessToken && this.loggedInUser.impersonateAccessToken.length > 0) {
            impersonateAccessToken = this.loggedInUser.impersonateAccessToken;
        }
        this.authenticationService.logout();
        if (impersonateAccessToken) {
            this._router.navigateByUrl(`auth/autologin?k=${impersonateAccessToken}`);
        }
        else {
            this._router.navigateByUrl('auth/login');
        }
    }
}
