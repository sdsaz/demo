import { Injectable } from '@angular/core';
import { CommonHelper } from '../common-helper';
import { SettingsService } from '../../pages/settings/settings.service';
import { LocalStorageKey, PublicTenantSettings } from '../enum';
import { CommonService } from './common.service';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor(private _commonHelper: CommonHelper, private _settingsService: SettingsService,
    private _commonService: CommonService
  ) { }

  public getCurrencySymbol() {
    return new Promise((resolve, reject) => {
      const currencySymbol = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL));
      if (currencySymbol == null) {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.CURRENCY_SYMBOL).then((response: any) => {
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.CURRENCY_SYMBOL, JSON.stringify(response.currencySymbol));
          resolve(response.currencySymbol);
        }, (error) => {
          reject(error);
        });
      } else {
        resolve(currencySymbol);
      }
    });
  }

  public getHoursInDay() {
    return new Promise((resolve, reject) => {
      let hoursInDay = JSON.parse(this._commonHelper.getLocalStorageDecryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY));
      if (hoursInDay == null) {
        this._settingsService.getPublicTenantSettingValueByCode(PublicTenantSettings.HOURS_IN_DAY).then((response: any) => {
          hoursInDay = (response != null && !isNaN(Number(response))) ? Number(response) : 24;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(this._commonHelper.tenantSettingPrefixKey + PublicTenantSettings.HOURS_IN_DAY, JSON.stringify(hoursInDay));
          resolve(hoursInDay);
        }, (error) => {
          reject(error);
        });
      } else {
        resolve(hoursInDay);
      }
    });
  }

  public getEntitySubTypes() {
    return new Promise((resolve, reject) => {
      let storageKey = `${LocalStorageKey.ALLENTITYSUBTYPES}`;
      const allEntitySubTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (allEntitySubTypes == null) {
        this._commonHelper.showLoader();
        this._commonService.getEntitySubTypes().then((response: any) => {
          if (response) {
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
          }
          this._commonHelper.hideLoader();
          resolve(response);
        },
          (error) => {
            this._commonHelper.hideLoader();
            reject(error);
          });
      }
      else {
        resolve(allEntitySubTypes);
      }
    });
  }

  public getEntityHiddenField() {
    return new Promise((resolve, reject) => {
      // storage key
      let storageKey = LocalStorageKey.AllEntityHiddenFieldSettings;
      // get data
      const hiddenFieldSettings = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (hiddenFieldSettings == null) {
        this._commonService.getEntityHiddenFields().then((response: any) => {
          if (response) {
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response as []));
            resolve(response as []);
          }
          resolve(null);
        },
          (error) => {
            reject(error);
          })
      }else {
        resolve(hiddenFieldSettings);
      }
    });
  }
}
