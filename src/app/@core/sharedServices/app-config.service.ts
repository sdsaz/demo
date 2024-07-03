import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CommonHelper } from '../common-helper';
import { LocalStorageKey } from '../enum';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {

  config: any;

  constructor(private http: HttpClient, private _commonHelper: CommonHelper, public _router: Router) { }

  load() {
    const jsonFile = `/assets/config.json?${Date.now()}`;

    return new Promise<void>((resolve, reject) => {
      this.http.get(jsonFile).toPromise().then((response: any) => {
        this.config = response;
        this._commonHelper.globalToastrTimeout = this.config.toaster_timeout;
        this._commonHelper.globalTinymceApiKey = this.config.tinymce_api_key;
        this._commonHelper.attachment_visibility_tenant = this.config.attachment_visibility_tenant;
        this._commonHelper.app_client = this.config.app_client;
        this._commonHelper.app_version = this.config.app_version;
        this._commonHelper.maxFileSizeInMb = this.config.maxFileSizeInMb;
        this._commonHelper.maxAllowedFiles = this.config.maxAllowedFiles;
        this._commonHelper.defaultCountryId = this.config.defaultCountryId;
        this._commonHelper.maxNotification = this.config.maxNotification;
        this._commonHelper.passwordPattern = this.config.passwordPattern;
        this._commonHelper.passwordPatternMessage = this.config.passwordErrorMessage;
        this._commonHelper.localStorageHash = this.config.localStorageHash;
        this._commonHelper.expirationTimeInMins = this.config.expirationTimeInMins;
        this._commonHelper.waitForResponse = this.config.waitForResponse;
        this._commonHelper.userPopOverDebounceTimeinMiliSeconds = this.config.userPopOverDebounceTimeinMiliSeconds;

        let localStorageHash = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.LocalStorageHash);
        if (localStorageHash == null) {
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.LocalStorageHash, this._commonHelper.localStorageHash);
        }
        else if (localStorageHash != this._commonHelper.localStorageHash) {
          this._router.navigateByUrl('auth/logout');
        }

        resolve();
      }, (error) => {
        reject('Could not load the config file');
      }).catch((response: any) => {
        reject('Could not load the config file');
      });
    });
  }
}
