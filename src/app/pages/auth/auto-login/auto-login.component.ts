import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbMenuItem } from '@nebular/theme';
import { CommonHelper } from '../../../@core/common-helper';
import { UsersService } from '../../usermanagement/users/users.service';
import { AuthenticationService } from '../auth.service';
import { LocalStorageKey } from '../../../@core/enum';
import { DocumentService } from '../../../@core/sharedComponents/documents/document.service';
import { Entity } from '../../../@core/enum';

@Component({
  selector: 'app-auto-login',
  templateUrl: './auto-login.component.html',
  styleUrls: ['./auto-login.component.scss']
})
export class AutoLoginComponent implements OnInit {

  kParam: string = null;
  menuItems: Array<NbMenuItem> = [];
  private _loggedInUser: any;
  private url: string;

  constructor(private _activatedRoute: ActivatedRoute,
    private _commonHelper: CommonHelper,
    private _router: Router,
    private _authenticationService: AuthenticationService,
    private _usersService: UsersService,
    private _documentService: DocumentService) {

    this._activatedRoute.queryParams.subscribe(params => {
      this.kParam = params['k'];
    });
  }
  ngOnInit() {
    if (this.kParam == null || this.kParam.length == 0) {
      this._router.navigate(['/auth/login']);
    }

    const params = {
      accessToken: this.kParam,
      userHash: ''
    };

    this._commonHelper.showLoader();
    this._authenticationService.validateUserAccessToken(params).then((response: any) => {
      this._commonHelper.setLoaderHide();
      if (response != null) {
        this._loggedInUser = response;
        //set logged user detail
        this._commonHelper.setLoggedUserDetail(response);
        this._commonHelper.changeLoggedInProfileCallback(response);
        //set logged user session token in local storage
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.LoginUserSessionToken, response.accessToken);

        this._commonHelper.updateLanguage('en');

        this.getS3BucketURL();
        this.getUserMenuItems();
        this.getS3BucketURLForTenants();
        this.getS3BucketURLForUser();
      } else {
        this._commonHelper.setLoggedUserDetail(null);
        this._router.navigate(['/auth/login']);
      }
    }, (error) => {
      this._commonHelper.setLoaderHide();
      this._commonHelper.setLoggedUserDetail(null);
      //logged user session token remove local storage remove
      if (this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.LoginUserSessionToken) != null) {
        this._commonHelper.removeLocalStorageEncryptData(LocalStorageKey.LoginUserSessionToken);
      }
      this._router.navigate(['/auth/login']);
    });
  }

  //#region Private methods
  private getUserMenuItems(): void {
    this._commonHelper.showLoader();
    this._usersService.getUserMenuItems()
      .then((response: Array<NbMenuItem>) => {
        this.menuItems = this._commonHelper.prepareMenus(response || []);

        this.navigateFirstOrDefaultDashboardPage(this.menuItems);

        this._commonHelper.setUserMenuItemsCache(this.menuItems);
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
      });
  }

  private getS3BucketURLForUser() {
    return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        let s3BucketURL = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.UserS3BucketURL))
        if (s3BucketURL == null || s3BucketURL == '' || s3BucketURL == undefined) {
            this._documentService.getS3BucketURLByEntityID(Entity.Users).then((response: any) => {
                if (response) {
                    this._commonHelper.hideLoader();
                    s3BucketURL = response.url;
                    this._commonHelper.globalAvatarRelativePath = s3BucketURL;
                }
                this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.UserS3BucketURL, JSON.stringify(s3BucketURL));
                resolve(response);
            },
                (error) => {
                    this._commonHelper.hideLoader();
                    resolve(null);
                }).catch(() => {
                    resolve(null);
                });
        }
        else {
            this._commonHelper.hideLoader();
            resolve(null);
        }
    });
}

private getS3BucketURLForTenants() {
    return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        let s3BucketURL = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.UserS3BucketURL))
        if (s3BucketURL == null || s3BucketURL == '' || s3BucketURL == undefined) {
            this._documentService.getS3BucketURLByEntityID(0).then((response: any) => {
                if (response) {
                    this._commonHelper.hideLoader();
                    s3BucketURL = response.url;
                    this._commonHelper.globalTenantRelativePath = s3BucketURL;
                }
                this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.TenantS3BucketURL, JSON.stringify(s3BucketURL));
                resolve(response);
            },
                (error) => {
                    this._commonHelper.hideLoader();
                    resolve(null);
                }).catch(() => {
                    resolve(null);
                });
        }
        else {
            this._commonHelper.hideLoader();
            resolve(null);
        }
    });
}

  private navigateFirstOrDefaultDashboardPage(menus: Array<NbMenuItem>) {
    //Navigate to first or default dashboard SDC-712 with return url condition
    let keepGoing = true;
    menus.forEach((menuitem: any) => {
      if (keepGoing) {
        if (menuitem['code']  && String(menuitem['code']).toLowerCase() == 'dashboards') {
          if (!menuitem.children || menuitem.children.length == 0) {
            this._router.navigateByUrl(menuitem.link);
            keepGoing = false;
          } else {
            this._router.navigateByUrl(menuitem.children[0].link);
            keepGoing = false;
          }
        }
      }
    });

    //if no dashboard is found then simple redirect to dashboard page with no quarry parameter
    if (keepGoing) {
      this._router.navigate(['/dashboard'])
    }
  }

  getS3BucketURL() {
    return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        const s3BucketURL = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.S3BucketURL))
        if (s3BucketURL == null || s3BucketURL == '' || s3BucketURL == undefined) {
            this._documentService.getS3BucketURL().then((response: any) => {
                if (response) {
                    this._commonHelper.hideLoader();
                    this._commonHelper.globalBucketURL = response.url;
                    this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.S3BucketURL, JSON.stringify(response.url));
                }
                resolve(response);
            },
                (error) => {
                    this._commonHelper.hideLoader();
                    resolve(null);
                });
        }
        else {
            this._commonHelper.hideLoader();
            resolve(null);
        }
    });
}
}
