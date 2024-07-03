import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastContainerDirective, ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AbstractControl, FormArray, UntypedFormControl, UntypedFormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
// import heic2any from 'heic2any';
import * as moment from 'moment';
import { DocumentViewerType, FieldNames, LocalStorageKey, PublicTenantSettings, RefType, SectionCodes } from './enum';
import { htmlToText } from 'html-to-text';
import { BehaviorSubject } from 'rxjs';
import * as clone from 'clone';
import { Entity } from '../@core/enum'
import { DocumentMimeType } from './sharedModels/document-mime-type';
import { NbMenuItem } from '@nebular/theme';

//dashboard sizList
const screenwidth = window.screen.width;
let widgetContainer = screenwidth - 200;
let r1 = widgetContainer / 12;

if (screenwidth < 1439) {
  widgetContainer = screenwidth - 160;
  r1 = widgetContainer / 12;
}

export const sizeList = [
  { size: "r1c1", width: 'col-md-1', height: r1 },
  { size: "r1c2", width: 'col-md-2', height: r1 },
  { size: "r1c4", width: 'col-md-4', height: r1 },
  { size: "r1c6", width: 'col-md-6', height: r1 },
  { size: "r1c8", width: 'col-md-8', height: r1 },
  { size: "r2c2", width: 'col-md-2', height: r1 * 2 },
  { size: "r2c4", width: 'col-md-4 size-2by4', height: r1 * 2 },
  { size: "r2c6", width: 'col-md-6', height: r1 * 2 },
  { size: "r2c8", width: 'col-md-8', height: r1 * 2 },
  { size: "r4c4", width: 'col-md-4 size-4by4', height: r1 * 4 + 6 },
  { size: "r4c6", width: 'col-md-6', height: r1 * 4 },
  { size: "r4c8", width: 'col-md-8', height: r1 * 4 },
  { size: "r6c6", width: 'col-md-6', height: r1 * 6 },
  { size: "r8c8", width: 'col-md-8 size-8by8', height: r1 * 8 + 19 },
];
@Injectable()

export class CommonHelper {
  permissions: string;
  showLoadingPanel: number = 0;
  loggedUserDetail: any;
  config: any;

  private userDetails = new BehaviorSubject<any>(null);
  loggedUserDetailAsObs = this.userDetails.asObservable();

  private entitiesTags = new BehaviorSubject<any>(null);
  entityTagsAsObs = this.entitiesTags.asObservable();

  private entitiesReviewsChange = new BehaviorSubject<boolean>(true);
  entityReviewsChangeAsObs = this.entitiesReviewsChange.asObservable();

  constructor(public _httpClient: HttpClient,
    public _router: Router,
    private _toastrService: ToastrService,
    private _translateService: TranslateService
  ) {
  }

  fileTypeswithExt = {
    'heic': 'image',
    'jpg': 'image',
    'jpeg': 'image',
    'tif': 'image',
    'psd': 'image',
    'bmp': 'image',
    'png': 'image',
    'nef': 'image',
    'tiff': 'image',
    'cr2': 'image',
    'dwg': 'image',
    'cdr': 'image',
    'ai': 'image',
    'indd': 'image',
    'pin': 'image',
    'cdp': 'image',
    'skp': 'image',
    'stp': 'image',
    '3dm': 'image',
    'mp3': 'audio',
    'wav': 'audio',
    'wma': 'audio',
    'mod': 'audio',
    'm4a': 'audio',
    'compress': 'compress',
    'zip': 'compress',
    'rar': 'compress',
    '7z': 'compress',
    'lz': 'compress',
    'z01': 'compress',
    'bz2': 'compress',
    'gz': 'compress',
    'pdf': 'pdf',
    'xls': 'xls',
    'xlsx': 'xls',
    'ods': 'xls',
    'mp4': 'video',
    'avi': 'video',
    'wmv': 'video',
    'mpg': 'video',
    'mts': 'video',
    'flv': 'video',
    '3gp': 'video',
    'vob': 'video',
    'm4v': 'video',
    'mpeg': 'video',
    'm2ts': 'video',
    'mov': 'video',
    'doc': 'doc',
    'docx': 'doc',
    'eps': 'doc',
    'txt': 'doc',
    'odt': 'doc',
    'rtf': 'doc',
    'ppt': 'ppt',
    'pptx': 'ppt',
    'pps': 'ppt',
    'ppsx': 'ppt',
    'odp': 'ppt',
  };

  workFlowCode: any;
  globalMinDate: Date = new Date('01/01/1900');
  globalMaxDate: Date = new Date('12/31/2100');
  globalDateFormate: string = 'MM/DD/YYYY';
  globalDateFormateWithTime: string = 'MM/DD/YY hh:mm a';
  globalSQLDateFormateWithTime: string = 'MM/dd/yy hh:mm ttt';
  globalSQLDateFormate: string = 'MM/dd/yyyy';
  globalDatePickerFormate: string = 'mm/dd/yy';
  globalLongDateFormate: string = 'MMM DD, YYYY hh:mm a';
  globalLongDateFormateWithoutTime: string = 'MMM DD, YYYY';
  globalDownloadFileDateFormatWithTime: string = 'YYYY_MM_DD_HH_mm_ss';
  globalTimeFormate: string = 'hh:mm a';
  globalDateMask: string = '99/99/9999';
  globalDateMaskWithTime: string = '99/99/9999 99:99 (\\P\\M)|(\\A\\M)|(\\p\\m)|(\\a\\m)';
  globalTimeMask: string = '99:99 (\\P\\M)|(\\A\\M)|(\\p\\m)|(\\a\\m)';
  globalDateRangeMaskWithTime: string = '00/00/0000 - 00/00/0000';
  globalDatePlaceholder: string = 'MM/DD/YYYY';
  globalTimePlaceholder: string = 'HH:MM TT';
  globalDatePlaceholderWithTime: string = 'MM/DD/YYYY HH:MM TT';
  globalDateRangePlaceholder: string = 'MM/DD/YYYY - MM/DD/YYYY';
  globalYearRange: string = "1900:2100";
  globalPhoneFormate: string = '+0 (000) 000-0000';
  globalInputPhoneFormate: string = '(000)-000-0000';
  globalSsnFormate: string = '000-00-0000';
  DefaultPageSize: number = 50;
  DefaultPageSizeForKanban: number = 25;
  globalRowsPerPageOptions: number[] = [5, 10, 20, 50, 100];
  globalBucketURL: string = this.getS3BucketURL();
  globalAvatarRelativePath: string = this.getUserS3BucketURL();
  globalTenantRelativePath: string = this.getTenantS3BucketURL();
  globalMultiselectMaxSelectedLabels: number = 100;
  globalInputPostalCodeFormate: string = '00000-0000||00000';
  globalInputEinFormate: string = '00-0000000';
  globalToastrTimeout = 3000;
  globalTinymceApiKey: string = '';
  attachment_visibility_tenant: string;
  app_client: string; //To show client name in sidenav footer
  app_version: string; //To show app version in sidenav footer
  maxFileSizeInMb: number;
  maxAllowedFiles: number;
  defaultCountryId: number;
  maxNotification: number;
  passwordPattern: string;
  passwordPatternMessage: string;
  localStorageHash: string;

  entityTokenRegEx = new RegExp(/{{([a-z]|[A-Z]|[_])+}}/, 'gm');

  referenceTypePrefixKey = 'refType_';
  tenantSettingPrefixKey = 'TS_';
  userTenantSettingPrefixKey = 'UTS_';
  indicatorViewTypeList = [];//Chart type list
  entityTypeList = [];//Entity type list
  globalTextAreaCharacterLimit: any = 25;
  assignedEntityCounts: any[] = [];
  expirationTimeInMins: number;
  waitForResponse: number;  
  userPopOverDebounceTimeinMiliSeconds: number;
  globalVirtualScrollItemSize: number = 10;
  globalTextCharSize: number = 40;

  setRatingOptions() {
    return new Promise((resolve, reject) => {
      const ratingOptions = [];
      this.getTranlationData('COMMON.RATINGOPTIONS').then((response) => {
        if (response) {
          ratingOptions.push({ label: response.RATING_OPTION2, value: 1 });
          ratingOptions.push({ label: response.RATING_OPTION3, value: 2 });
          ratingOptions.push({ label: response.RATING_OPTION4, value: 3 });
          ratingOptions.push({ label: response.RATING_OPTION5, value: 4 });
          resolve(ratingOptions);
        }
      });
    });
  }

  validateAllFormFields(formGroup: UntypedFormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      } else if (control instanceof FormArray) {
        for (const subControl of control.controls) {
          this.validateAllFormFields(subControl as UntypedFormGroup);
        }
      }
    });
  }

  // check if the user have required permission to access dashboard
  havePermission(enumVal: any): boolean {
    let currentPermissionHash = [];
    if (Array.isArray(enumVal)) {
      currentPermissionHash = enumVal;
    } else {
      currentPermissionHash.push(enumVal);
    }

    // get logged in user information
    const user = this.loggedUserDetail;
    if (user !== undefined) {
      this.permissions = user.userPermissionHash;
      if (this.permissions === undefined || this.permissions.length === 0) {
        return false;
      }

      const per: any[] = this.permissions.match(/.{1,4}/g);
      per.push('0000'); // Inject Login Only Permission
      let ans: boolean = false;
      for (const p of per) {
        currentPermissionHash.forEach(element => {
          if (p === element) {
            return ans = true;
          }
        });
      }
      return ans;
    }
  }

  setLoggedUserDetail(val: any) {
    if (val) {
      this.loggedUserDetail = val;
    } else {
      this.loggedUserDetail = undefined;
    }
  }

  getLoggedUserDetail() {
    return this.loggedUserDetail;
  }

  getTenantId(): number {
    const loggedInUser = this.getLoggedUserDetail();
    return loggedInUser?.tenantId || 0;
  }

  // Compare two values for validation
  compareValues(firstControl, secondControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const first = control.get(firstControl).value;
      const second = control.get(secondControl).value;
      if (first === second) {
        return { 'Match': true };
      }
      return null;
    };
  }

  //#region Spin Loader

  hideLoader() {
    if (this.showLoadingPanel > 0) {
      this.showLoadingPanel--;
    }
  }

  showLoader() {
    this.showLoadingPanel++;
  }

  setLoaderHide() {
    this.showLoadingPanel = 0;
  }

  getS3BucketURL() {
    return JSON.parse(this.getLocalStorageDecryptData(LocalStorageKey.S3BucketURL));
  }

  getUserS3BucketURL()
  {
    let url = JSON.parse(this.getLocalStorageDecryptData(LocalStorageKey.UserS3BucketURL))
    return url;
  }

  getTenantS3BucketURL()
  {
    let url = JSON.parse(this.getLocalStorageDecryptData(LocalStorageKey.TenantS3BucketURL))
    return url;
  }

  getUserMenuItemsCache<T>(): Array<T> {
    const storedMenus = this.getLocalStorageDecryptData(LocalStorageKey.UsrMenuItemsKey);
    if (storedMenus) {
      try {
        return JSON.parse(storedMenus);
      } catch (error) {
        return [];
      }
    } else {
      return [];
    }
  }

  setUserMenuItemsCache<T>(menuItems: Array<T>): Array<T> {
    this.removeLocalStorageEncryptData(LocalStorageKey.UsrMenuItemsKey);
    this.setLocalStorageEncryptData(LocalStorageKey.UsrMenuItemsKey, JSON.stringify(menuItems));
    return menuItems;
  }

  prepareMenus(menus: Array<NbMenuItem>): Array<NbMenuItem> {
    const loggedInUser = this.getLoggedUserDetail();

    menus.forEach(f => {
      if (f.title.toLowerCase() === 'return') {
        f.hidden = !loggedInUser.impersonateAccessToken;
        f.title = loggedInUser.impersonateAccessToken
          ? f.title + " to " + loggedInUser.impersonateSessionBy
          : f.title;
      }
    });
    return menus;
  }

  //#endregion

  //#region Toastr Message

  showToastrSuccess(message: string) {
    let configurableTokens = message.match(this.entityTokenRegEx);
    if (configurableTokens)
      message = this.getConfiguredEntityName(message);

    this._toastrService.success(message, "", { timeOut: this.globalToastrTimeout });
  }
  overLayContnr;
  showToastrInfo(message: string, elementRef?) {
    //this.overLayContnr = this._toastrService["overlay"]._overlayContainer;
    //let toasterContainerDirective = new ToastContainerDirective($('.importWizard .modal-dialog')[0]);
    if (elementRef) {
      let toasterContainerDirective = new ToastContainerDirective(elementRef);
      this._toastrService.overlayContainer = toasterContainerDirective;
    }

    let configurableTokens = message.match(this.entityTokenRegEx);
    if (configurableTokens)
      message = this.getConfiguredEntityName(message);

    //this._toastrService["overlay"]._overlayContainer = $('.importWizard .modal-dialog')[0];
    this._toastrService.info(message, "", { timeOut: this.globalToastrTimeout });
    //this._toastrService["overlay"]._overlayContainer = this.overLayContnr;
  }

  showToastrWarning(message: string) {
    let configurableTokens = message.match(this.entityTokenRegEx);
    if (configurableTokens)
      message = this.getConfiguredEntityName(message);

    this._toastrService.warning(message, "", { timeOut: this.globalToastrTimeout });
  }

  showToastrError(message: string) {
    let configurableTokens = message.match(this.entityTokenRegEx);
    if (configurableTokens)
      message = this.getConfiguredEntityName(message);

    this._toastrService.error(message, "", { timeOut: this.globalToastrTimeout });
  }

  copyURL(val: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  //#endregion

  //#region Translation Locale related function

  setLanguage() {
    let lang: string = this.getLocalStorageDecryptData(LocalStorageKey.LocaleLang);
    if (lang === null || lang === undefined) {
      lang = 'en';
      this.setLocalStorageEncryptData(LocalStorageKey.LocaleLang, lang);
    }

    this._translateService.setDefaultLang(lang);
    this._translateService.use(lang);
  }

  updateLanguage(lang: string) {
    this.setLocalStorageEncryptData(LocalStorageKey.LocaleLang, lang);
    this.setLanguage();
  }

  getTranlationData(key: string) {
    return this._translateService.get(key).toPromise();
  }

  getInstanceTranlationData(key: string, interpolateParams?: Object) {
    if (key == null || key === "") {
      return key;
    }
    return this._translateService.instant(key, interpolateParams);
  }

  createDynamicControlId(idPrefixValue, idName) {

    if (idPrefixValue.length === 0) {
      idPrefixValue = 'txt-';
    }
    if (idName.length === 0) {
      return idPrefixValue + '-0';
    }
    return idPrefixValue + '-' + idName.replace('-', '').replace(/ +/g, '-').toLowerCase();
  }

  // cloning object1
  cloningObject(object: any): any {
    return Object.assign({}, object);
  }

  cloningArray(values: Array<any>): Array<any> {
    const items = [];
    values.forEach(item => {
      items.push(Object.assign({}, item));
    });
    return items;
  }

  //#endregion

  //#region clone data function

  cloneObject(obj: any) {
    return JSON.parse(JSON.stringify(obj));
  }

  deepClone(object: any): any {
    return clone(object);
  }

  //#endregion

 // get phone number add prefix country code
 getPhoneNoPrefixCountryCode(phoneValue) {
  // check phone empty or null
  if (phoneValue === undefined || phoneValue == null || phoneValue.length === 0 || phoneValue.toString().trim() === '') {
    return "";
  }

  
  phoneValue = phoneValue.replace('-', '').replace('-', '');

  // check phone isNan
  if (isNaN(phoneValue)) {
    return null;
  }
  
  // check phone 10 digit
  // if (phoneValue.length != 10) {
  //     return null
  // }
  return phoneValue;
}
 

  // get phone number with hyper link
  getPhoneNoWithHyperLink(phoneValue) {
    const phone = this.getPhoneNoPrefixCountryCode(phoneValue);
    if (phone != null) {
      return 'tel:' + phone;
    }
    return null;
  }
  allowOnlyNumericValues(event) {
    if ((event.which < 48 || event.which > 57)) {
      event.preventDefault();
    }
  }

  getDefaultTagColor(entityTag, size = 6) {
    let style = '';
    entityTag.forEach(tag => {
      if (tag.isDefault) {
        style = `${size}px solid ${tag.color}`;
      }
    });
    return style;
  }

  blobToFile = (theBlob: Blob, fileName: string): File => {
    const b: any = theBlob;
    // A Blob() is almost a File() - it's just missing the two properties below which we will add
    b.lastModified = new Date();
    b.name = fileName;
    // Cast to a File() type
    return <File>theBlob;
  }

  // ConvertImagetoJpeg(event: any): File {
  //     if (event.currentTarget && event.currentTarget.files && event.currentTarget.files[0]) {
  //         //let fileext = event.currentTarget.files[0].name.split('.').reverse()[0];
  //         //if (fileext == 'heic' || fileext == 'heif') {
  //         let f: File;
  //         //RECEIVE IMAGE
  //         f = event.currentTarget.files[0];
  //         if (!f) {
  //             return;
  //         }

  //         let blob: Blob = f;
  //         let file: File = f;
  //         let convProm: Promise<any>;
  //         //CONVERT HEIC TO JPG
  //         convProm = heic2any({ blob, toType: "image/jpeg" }).then((jpgBlob: any): File => {
  //             //Change the name of the file according to the new format
  //             let newName = f.name.replace(/\.[^/.]+$/, ".jpeg");
  //             //Convert blob back to file
  //             return this.blobToFile(jpgBlob, newName);
  //             // this.uploader.queue = [];
  //             // this.uploader.addToQueue([file]);
  //             // this.UploadFiles(fileext);
  //         })
  //             .catch(err => {
  //                 console.log("Upload Images : " + err);
  //             });

  //         //ADD IMAGE FILE TO CROPPERJS EDITOR
  //         convProm.then(() => {
  //             let reader = new FileReader();
  //             //Add file to FileReader
  //             if (file) {
  //                 reader.readAsDataURL(file);
  //             }
  //             //Listen for FileReader to get ready
  //             reader.onload = () => {
  //                 return reader.result;
  //             }
  //         });
  //         //}  
  //     }
  //     return;
  // }

  getGeneralTranslateErrorMessage(error) {
    if (error.error != null && error.error.message) {
      console.log(error.error);
      console.log(this.getInstanceTranlationData(error.error.message));
      this.showToastrError(
        this.getInstanceTranlationData(error.error.message)
      );
    }
  }

  getConfiguredEntityName(value: string, args: any[] = null): string {
    let finalText = value;
    let displayEntityTypeList: any[] = this.entityTypeList;
    if (value?.length > 0 && displayEntityTypeList) {
      let configurableTokens: string[] = finalText.match(this.entityTokenRegEx);
      if (configurableTokens) {
        configurableTokens = configurableTokens.filter((v, i, s) => s.indexOf(v) == i);
        configurableTokens.forEach(ct => {
          let replaceRegEx = new RegExp(ct, 'g');
          let actualToken = ct.replace('{{', '').replace('}}', '');
          let tokenParts = actualToken.split('_');
          let entityPart = tokenParts[0]; // Entity like Accounts, Contacts, WorkTask
          let nounPart = tokenParts[1] == "plural" ? tokenParts[1] : null; // Noun like default is singualr else plural.
          let casePart = tokenParts[1] == "plural" ? tokenParts[2] : tokenParts[1]; // Case like p= Pascal Case, l = lower case

          let foundRecord = displayEntityTypeList.find(de => de['name'] == entityPart);
          let configuredText = '';
          if (foundRecord) {
            configuredText = nounPart && nounPart == 'plural' ? foundRecord['pluralDisplayName'].trim() : foundRecord['displayName'].trim();

            if (casePart == 'p') // Pascal case
              configuredText = configuredText[0].toUpperCase() + configuredText.slice(1);
            else // lower case
              configuredText = configuredText.toLowerCase();

            finalText = finalText.replace(replaceRegEx, configuredText);
          }
        });
      }
    }
    return finalText;
  }

  isNullBlankUndefined(value) {
    return value == undefined || value == null || value.length == 0;
  }

  compare(leftVal: number, rightVal: number): number {
    if (leftVal < rightVal) {
      return -1;
    }

    if (leftVal > rightVal) {
      return 1;
    }

    return 0;
  }
  // method will remove timezone stamp of json date object and return it
  getJSONWithoutTimezone(objectJSON: any) {
    for (let key in objectJSON) {
      if (Object.prototype.toString.call(objectJSON[key]) === '[object Date]') {
        objectJSON[key] = moment(objectJSON[key]).format("YYYY-MM-DDTHH:mm");
      }
      else if (Object.prototype.toString.call(objectJSON[key]) === '[object Object]') {
        objectJSON[key] = this.getJSONWithoutTimezone(objectJSON[key]);
      }
      else if (Object.prototype.toString.call(objectJSON[key]) === '[object Array]') {
        objectJSON[key] = this.getJSONWithoutTimezone(objectJSON[key]);
      }
    }
    return objectJSON;
  }

  //#region localstorage
  setLocalStorageEncryptData(key: any, data: any, prefix: string = null, encryptedKey: boolean = null) {
    if (key != null && key != '' && data != null && data != '') {
      key = prefix && prefix != '' ? `${prefix}_${key}` : key;

      if (encryptedKey != null && encryptedKey == true)
        // encode 
        localStorage.setItem(btoa(unescape(encodeURIComponent(key))), btoa(unescape(encodeURIComponent(data))));
      else
        // endoe
        localStorage.setItem(key, btoa(unescape(encodeURIComponent(data))));
    }
  }

  getLocalStorageDecryptData(key: any, prefix: string = null, encryptedKey: boolean = null) {
    if (key != null && key != '') {
      // encode
      key = prefix && prefix != '' ? `${prefix}_${key}` : key;
      let decryptedData: any = encryptedKey != null && encryptedKey == true ? localStorage.getItem(btoa(unescape(encodeURIComponent(key)))) : localStorage.getItem(key);
      if (decryptedData != null && decryptedData != '')
        // decode
        return decodeURIComponent(escape(atob(decryptedData)));
      else
        return null
    }
  }

  removeLocalStorageEncryptData(key: any, encryptedKey: boolean = null) {
    if (key != null && key != '') {
      if (encryptedKey != null && encryptedKey == true)
        localStorage.removeItem(btoa(unescape(encodeURIComponent(key))));
      else
        localStorage.removeItem(key);
    }
  }

  //#region: Public Tenant Setting Add & Remove from Local Storage
  setTenantSettingInLocalStorage(tenantSettings: any[]) {
    if (tenantSettings && tenantSettings.length > 0) {
      tenantSettings.forEach(element=> {
        this.setLocalStorageEncryptData(`${this.tenantSettingPrefixKey}${element.tenantSettingCode}`, JSON.stringify(element.value));
      })
    }
  }

  removeLocalStorageTenantSetting() {
    for (let key in localStorage) {
      if (key && key.startsWith(this.tenantSettingPrefixKey)) {
        localStorage.removeItem(key);
      }
    }
  }
 
  //#endregion: Public Tenant Setting Add & Remove from Local Storage

  //#region: Public User Tenant Setting Add & Remove from Local Storage
  setUserTenantSettingInLocalStorage(userTenantSettings: any[]) {
    if (userTenantSettings && userTenantSettings.length > 0) {
      userTenantSettings.forEach(element=> {
        this.setLocalStorageEncryptData(`${this.userTenantSettingPrefixKey}${element.tenantSettingCode}`, JSON.stringify(element.value));
      })
    }
  }

  removeLocalStorageUserTenantSetting() {
    for (let key in localStorage) {
      if (key && key.startsWith(this.userTenantSettingPrefixKey)) {
        localStorage.removeItem(key);
      }
    }
  }
  //#endregion: Public User Tenant Setting Add & Remove from Local Storage

  //#region: Reference Types Add & Remove from Local Storage
  setReferenceTypeInLocalStorage(referenceTypes: any[]) {
    if (referenceTypes && referenceTypes.length > 0) {
        let uniqueRefType = [...new Set(referenceTypes.map(i=> i.refType))];
        
        uniqueRefType.forEach(refTypeKey => {
          this.setLocalStorageEncryptData(`${this.referenceTypePrefixKey}${refTypeKey}`, JSON.stringify(referenceTypes.filter(x => x.refType == refTypeKey) || []));
        });  
    }
  }

  removeLocalStorageReferenceType() {
    for (let key in localStorage) {
      if (key && key.startsWith(this.referenceTypePrefixKey)) {
        localStorage.removeItem(key);
      }
    }
  }
  //#endregion: Reference Types Add & Remove from Local Storage

  clearAllLocalStorageData(isClearUserLoginSession: boolean = true) {
    if (isClearUserLoginSession) {
      localStorage.removeItem(LocalStorageKey.LoginUserSessionToken);
      localStorage.removeItem(LocalStorageKey.LocaleLang);
    }
    
    localStorage.removeItem(LocalStorageKey.LocalStorageHash);
    localStorage.removeItem(LocalStorageKey.DisplayEntityTypeKey);
    localStorage.removeItem(LocalStorageKey.UsrMenuItemsKey);
    localStorage.removeItem(LocalStorageKey.ProfileTimeZonesKey);
    localStorage.removeItem(LocalStorageKey.Countries);
    localStorage.removeItem(LocalStorageKey.DashboardWidgetStartDateAndEndDateKey);
    localStorage.removeItem(LocalStorageKey.AllActivePermissions);
    localStorage.removeItem(LocalStorageKey.TaskRecordTypeKey);
    localStorage.removeItem(LocalStorageKey.EventRecordTypeKey);
    localStorage.removeItem(LocalStorageKey.NoteRecordTypeKey);
    localStorage.removeItem(LocalStorageKey.VisibleEntityWithRecordTypes);
    localStorage.removeItem(LocalStorageKey.WorkTaskWorkFlowStageList);
    localStorage.removeItem(LocalStorageKey.S3BucketURL);
    localStorage.removeItem(LocalStorageKey.UserS3BucketURL);
    localStorage.removeItem(LocalStorageKey.TenantS3BucketURL);
    localStorage.removeItem(LocalStorageKey.UsersPermissionsSetListKey);
    localStorage.removeItem(LocalStorageKey.ProductImageRecordTypeKey);
    localStorage.removeItem(LocalStorageKey.UOM_TypeKey);
    localStorage.removeItem(LocalStorageKey.NativeTabList_Accounts);
    localStorage.removeItem(LocalStorageKey.NativeTabList_Campaigns);
    localStorage.removeItem(LocalStorageKey.NativeTabList_Contacts);
    localStorage.removeItem(LocalStorageKey.NativeTabList_Newsletters);
    localStorage.removeItem(LocalStorageKey.NativeTabList_Opportunities);
    localStorage.removeItem(LocalStorageKey.NativeTabList_Orders);
    localStorage.removeItem(LocalStorageKey.NativeTabList_PriceBooks);
    localStorage.removeItem(LocalStorageKey.NativeTabList_Products);
    localStorage.removeItem(LocalStorageKey.NativeTabList_ProductCategories);
    localStorage.removeItem(LocalStorageKey.NativeTabList_ProductSkus);
    localStorage.removeItem(LocalStorageKey.NativeTabList_WorkTasks);
    localStorage.removeItem(LocalStorageKey.Accounts_Workflow_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Contacts_Workflow_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Products_Workflow_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Orders_Workflow_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Worktasks_Workflow_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Opportunities_Workflow_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Cases_Workflow_SelectedItem);
    localStorage.removeItem(LocalStorageKey.AllEntityRecordTypes);
    localStorage.removeItem(LocalStorageKey.ALLENTITYSUBTYPES);
    localStorage.removeItem(LocalStorageKey.AllEntityHiddenFieldSettings);
    localStorage.removeItem(LocalStorageKey.Accounts_List_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Contacts_List_SelectedItem);
    localStorage.removeItem(LocalStorageKey.ProductCategories_List_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Products_List_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Pricebooks_List_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Orders_List_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Cases_List_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Worktasks_List_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Campaigns_List_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Newsletters_List_SelectedItem);
    localStorage.removeItem(LocalStorageKey.Opportunities_List_SelectedItem);

    this.removeLocalStorageReferenceType();
    this.removeLocalStorageTenantSetting();
    this.removeLocalStorageUserTenantSetting();
    this.removeDynamicLocalStorageKeys();    
  }

  removeDynamicLocalStorageKeys() {
    for (let key in localStorage) {
      if (key && (key.startsWith(LocalStorageKey.AccountEntityStagesWithTasks) 
              || key.startsWith(LocalStorageKey.ContactEntityStageWithTasksKey)
              || key.startsWith(LocalStorageKey.WorkTaskEntityStageWithTasksKey)
              || key.startsWith(LocalStorageKey.ProductEntityStageTaskKey)
              || key.startsWith(LocalStorageKey.OpportunityEntityStageWithTasksKey)
              || key.startsWith(LocalStorageKey.OrderEntityStageWithTasksKey)
              || key.startsWith(LocalStorageKey.AccountWorkflowDetailsKey)
              || key.startsWith(LocalStorageKey.ContactWorkflowDetailsKey)
              || key.startsWith(LocalStorageKey.OpportunityWorkflowDetailKey)
              || key.startsWith(LocalStorageKey.OrderWorkflowDetailKey)
              || key.startsWith(LocalStorageKey.ProductWorkflowDetailsKey)
              || key.startsWith(LocalStorageKey.WorkTaskWorkflowDetailsKey)
              || key.startsWith(LocalStorageKey.Workflow_ListKey)
              || key.startsWith(LocalStorageKey.DocumentTypeKey))
              || key.startsWith(LocalStorageKey.User_Profile_Details)) {
        localStorage.removeItem(key);       
      }
    }
  }

  //#endregion localstorage

  tryParseJson(val: string): any {
    try {
      return JSON.parse(val);
    } catch {
      return '';
    }
  }

  htmlToPlainText(html) {
    return htmlToText(html, {
      singleNewLineParagraphs: true,
      ignoreImage: true,
      formatters: {
        anchor: (el, walk, builder, opts) => {
          builder.openBlock();
          walk(el.children, builder);
          builder.closeBlock();
        },
      },
    });
  }
  
  getRouteNameByEntityTypeId(entityTypeId: number): string {
    switch(entityTypeId){
      case Entity.Accounts: return'accounts'
      case Entity.Contacts: return'contacts'
      case Entity.Products: return'products'
      case Entity.Cases: return'cases'
      case Entity.ProductCategories: return'productcategories'
      case Entity.PriceBooks: return'pricebooks'
      case Entity.ProductSkus: return'productskus'
      case Entity.WorkTasks: return'worktasks'
      case Entity.Orders: return'orders'
      case Entity.Campaigns: return'campaigns'
      case Entity.Newsletters: return'newsletters'
      case Entity.Opportunities: return'opportunities'
      case Entity.Users: return'uram'
      case Entity.Events: return'appointments'
      default: return ''
     }
  }

  isUserHaveViewPermissionOfRelatedEntity(entityTypeId: number):boolean {
    switch(entityTypeId){
      case Entity.Accounts: return this.havePermission(enumPermissions.ViewAccount);
      case Entity.Contacts: return this.havePermission(enumPermissions.ViewContact);
      case Entity.Products: return this.havePermission(enumPermissions.ViewProduct);
      case Entity.Cases: return this.havePermission(enumPermissions.ViewCase);
      case Entity.ProductCategories: return this.havePermission(enumPermissions.ViewProductCategory);
      case Entity.PriceBooks: return this.havePermission(enumPermissions.ViewPriceBook);
      case Entity.ProductSkus: return this.havePermission(enumPermissions.ViewProductSku);
      case Entity.WorkTasks: return this.havePermission(enumPermissions.ViewWorkTask);
      case Entity.Orders: return this.havePermission(enumPermissions.ViewOrder);
      case Entity.Campaigns: return this.havePermission(enumPermissions.ViewCampaign);
      case Entity.Newsletters: return this.havePermission(enumPermissions.ViewNewsletter);
      case Entity.Opportunities: return this.havePermission(enumPermissions.ViewOpportunity);
      case Entity.Users: return this.havePermission(enumPermissions.ViewUser);
      case Entity.Events: return this.havePermission(enumPermissions.ViewAppointment);
      default: return false
     }
  }

  getEntityIconClass(entityTypeId: number): string {
    switch(entityTypeId){
      case Entity.Accounts: return'fas fa-building'
      case Entity.Contacts: return'fas fa-address-card'
      case Entity.Products: return'fas fa-boxes'
      case Entity.Cases: return'fas fa-file-invoice'
      case Entity.WorkTasks: return'fas fa-tasks'
      case Entity.Orders: return'fas fa-shopping-cart'
      case Entity.Opportunities: return'fas fa-hand-holding-usd'
      case Entity.ProductSkus: return'fas fa-receipt'
      case Entity.ProductCategories: return'fas fa-inbox'
      case Entity.Campaigns: return'fas fa-bullhorn'
      case Entity.Newsletters: return'fas fa-newspaper'
      case Entity.PriceBooks: return'fas fas fa-book'
      default: return ''
    }
  }

  //#region dashboard
  getSizeFromId(size: string) {
    return sizeList.find(sl => sl.size == size);
  }
  //#endregion

  changeLoggedInProfileCallback(loggedUserProfileData: any) {
    this.userDetails.next(loggedUserProfileData);
  }

  convertToCamalize(value:string ): string{
    return value
    .replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
    .replace(/\s/g, '')
    .replace(/^(.)/, function($1) { return $1.toLowerCase(); });
  }

  downloadFile(fileName: string, contentType: string, base64String: any) {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(this.convertBase64ToBlobData(base64String, contentType));
    link.download = fileName;
    link.click();
  }

  convertBase64ToBlobData(base64Data: string, contentType: string = 'image/png', sliceSize = 512): Blob {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  /***
   * Validate Document is valid for generic Document Viewer.
   */
  hasValidDocumentForPreview(mimeType: string): boolean {
    if (this.getDocumentViewerType(mimeType) != '')
      return true;

    return false;    
  }

  /***
   * Get Document Type for the Document Viewer.
   */
  getDocumentViewerType(mimeType: string): string {
    let documentType: string = "";
    if (mimeType && mimeType != '') {
      if (DocumentMimeType.mime_img.includes(mimeType))
        documentType = DocumentViewerType.Image;
      else if (DocumentMimeType.mime_doc.includes(mimeType))
        documentType = DocumentViewerType.Word;
      else if (DocumentMimeType.mime_excel.includes(mimeType))
        documentType = DocumentViewerType.Excel;
      else if (DocumentMimeType.mime_ppt.includes(mimeType))
        documentType = DocumentViewerType.PowerPoint;
      else if (DocumentMimeType.mime_pdf.includes(mimeType))
        documentType = DocumentViewerType.Pdf;
      else if (DocumentMimeType.mime_csv.includes(mimeType))
        documentType = DocumentViewerType.Csv;
      else if (DocumentMimeType.mime_video.includes(mimeType))
        documentType = DocumentViewerType.Video;
      else if (DocumentMimeType.mime_audio.includes(mimeType))
        documentType = DocumentViewerType.Audio;
    }
    return documentType;
  }

  setCommonActivitySectionState(action: string) {
    sessionStorage.setItem(LocalStorageKey.ActivityStateKey, action);
  }

  getCommonActivitySectionState() {
    return sessionStorage.getItem(LocalStorageKey.ActivityStateKey) ? sessionStorage.getItem(LocalStorageKey.ActivityStateKey) == 'OPEN' ? true : false : false;
  }

  /**
   * START Event For Tabs
   */
  autoTabEventEvent = new BehaviorSubject({});
  /**
   * END Event For Tabs
   */

  changeEntityTagsCallback(entityTagsData: any) {
    this.entitiesTags.next(entityTagsData);
  }

  changeEntityReviewDataCallback() {
    this.entitiesReviewsChange.next(true);
  }

  getEntityTitleFromMenuItemByUrl(url: string): string {
    let menuItems = this.getUserMenuItemsCache();
    let model = { title: "" };
    this.findTitle(url, menuItems, model);
    return model.title;
  }

  private findTitle(url, menuItems: any, model): void {
    if (menuItems && menuItems.length > 0) {
      menuItems.forEach((x: any) => {
        if (x?.children?.length > 0)
          this.findTitle(url, x.children, model);
        else if (x.link.toLowerCase() == url.toLowerCase())
          model.title = x.title;
      });
    }
    else
      return;
  }

  getNowUTC() {
    const now = new Date();
    return new Date(now.getTime() + (now.getTimezoneOffset() * this.expirationTimeInMins));
  }

  isEntityFieldHidden(hiddenFieldSettings: any, entityTypeId: number, sectionCodes: string, fieldName: any, entityWorkflowId: number = null): boolean {
    if (hiddenFieldSettings && hiddenFieldSettings?.length > 0 && entityTypeId && sectionCodes != null && sectionCodes != '' && fieldName != null && fieldName != '') {
      return hiddenFieldSettings?.some((x: any) => x.entityTypeId == entityTypeId && x.fieldName == fieldName && (x.sectionCodes?.includes(sectionCodes)) && (x.entityWorkflowId == entityWorkflowId  || x.entityWorkflowId == null)); 
    }
    return false;
  }

  replaceValue(value: any, convertValue: any): any {
    if(value && value !== null && value !== undefined && value != '' && convertValue !== null && convertValue !== undefined && convertValue !== '' && convertValue) {
      return value.replaceAll(value, convertValue);
    }
  }

  getMimeTypes(fileType: string): string[] {
    let mimeTypes: string[] = [];
    if (fileType && fileType != '') {
      switch (fileType) {
        case "doc":
          mimeTypes = DocumentMimeType.mime_doc;
          break;
        case "excel":
          mimeTypes = DocumentMimeType.mime_excel;
          break;
        case "csv":
          mimeTypes = DocumentMimeType.mime_csv;
          break;
        case "image":
          mimeTypes = DocumentMimeType.mime_img;
          break;
        case "ppt":
          mimeTypes = DocumentMimeType.mime_ppt;
          break;
        case "compress":
          mimeTypes = DocumentMimeType.mime_compress;
          break
        case "pdf":
          mimeTypes = DocumentMimeType.mime_pdf;
          break;
        case "video":
          mimeTypes = DocumentMimeType.mime_video;
          break;
        case "audio":
            mimeTypes = DocumentMimeType.mime_audio;
            break;
        default:
          mimeTypes = [];
          break;
      }
    }
    return mimeTypes;
  }

  getFileNameOrExtension(value: string, isFileExtensionOnly?: boolean) {
    if(value && value !== null && value !== undefined && value !== '') {
      var fileName = value.trim().split('.');
      return isFileExtensionOnly ? fileName[1] : fileName[0];
    }
  }

  /**
   * 
   * @param arr Array List to find index
   * @param key Search column name
   * @param value Value to compare with column
   * @returns index of find element otherwise -1
   */
  findIndex(arr: any[], key: string, value: any): number {
    return arr.findIndex(item => item[key] == value);
  }

}

export enum enumPermissions {

  //Dashboard
  SuperAdminDashboard = 'sad1',

  // Account
  ListAccounts = 'la01',
  ViewAccount = 'va02',
  AddAccount = 'aa03',
  EditAccount = 'ea04',
  DeleteAccount = 'da05',
  ImportAccount = 'ia05',
  SendDocumentsForEsign = 'sd07',
  Prepare941x = "px08",
  ChangeAccountStage = 'as09',
  CalculateERC = 'ce10',
  DownloadAccountDocument = 'dacd',
  BulkAssignAccounts = 'baac',
  ExportAccount='ea07',  
  // Tag Management
  ListTags = 'lt01',
  ViewTag = 'vt02',
  AddTag = 'at03',
  EditTag = 'et04',
  DeleteTag = 'dt05',

  // Tag Category Management
  ListTagCategories = 'ltc1',
  ViewTagCategory = 'vtc2',
  AddTagCategory = 'atc3',
  EditTagCategory = 'etc4',
  DeleteTagCategory = 'dtc5',

  // Work Tasks
  DeleteSubWorkTask = "dsw1",
  AddSubWorkTask = "asw0",
  BulkAssignWorkTasks = 'baw9',
  AssignWorkTask = 'asw8',
  ExportWorkTasks = 'ew07',
  ImportWorkTasks = 'iw06',
  DeleteWorkTask = 'dw05',
  EditWorkTask = 'ew04',
  AddWorkTask = 'aw03',
  ViewWorkTask = 'vw02',
  ListWorkTasks = 'lw01',
  ChangeWorkTaskStage = 'cs10',
  ViewAllMiscTasks = 'vamt',
  DownloadWorkTaskDocument = 'dwtd',

  // User
  ListUsers = 'lu01',
  ViewUser = 'vu02',
  AddUser = 'au03',
  EditUser = 'eu04',
  DeleteUser = 'du05',
  LoginImpersonate = 'im01',

  // Role
  ListRoles = 'lr01',
  ViewRole = 'vr02',
  AddRole = 'ar03',
  EditRole = 'er04',
  DeleteRole = 'dr05',

  // PermissionSets
  ListPermissionSets = 'lps1',
  ViewPermissionSet = 'vps2',
  AddPermissionSet = 'aps3',
  EditPermissionSet = 'eps4',
  DeletePermissionSet = 'dps5',

  // Permissions
  ListPermissions = 'lprs',

  // Entity Record Types
  ListEntityRecordTypes = 'lert',

  // Profile

  EditProfile = 'eprf',

  // Teams 
  ListTeams = 'lte1',
  ViewTeam = 'vte2',
  AddTeam = 'ate3',
  EditTeam = 'ete4',
  DeleteTeam = 'dte5',
  ImportTeamMembers = 'itm6',

  //General Settings
  GeneralSettings = "gs01",

  //Reports
  RoleList = "rp01",
  SummaryTableReport = "rp02",
  TreeTableReport = "rp03",

  //Workflow Management
  ListEntityWorkflows = "lwf1",
  ViewEntityWorkflows = "vwf2",
  EditEntityWorkflow = "awf3",
  AddEntityWorkflow = "ewf4",
  DeleteEntityWorkflow = "dwf5",
  AssignWorkflow = "awf6",
  ResumeTask = "rtwf",
  AllowToReopen = "atro",

  // Impersonate Login (dont delete need to check with user list)
  DealerLoginImpersonate = 'id01',
  CustomerLoginImpersonate = 'ic01',
  ProductsLoginImpersonate = 'ip01',
  MarketingLoginImpersonate = 'im01',
  SalesLoginImpersonate = 'is01',
  WarrantyLoginImpersonate = 'iw01',

  // Contact
  ListContacts = 'lc01',
  ViewContact = 'vc02',
  AddContact = 'ac03',
  EditContact = 'ec04',
  DeleteContact = 'dc05',
  ImportContact = 'ic05',
  ChangeContactStage = 'cs06',
  DownloadContactDocument = 'dctd',
  BulkAssignContacts = 'bact',
  ExportConact='ec07',

  // Product
  ListProducts = 'lp01',
  ViewProduct = 'vp02',
  AddProduct = 'ap03',
  EditProduct = 'ep04',
  DeleteProduct = 'dp05',
  ImportProduct = 'ip05',
  ChangeProductStage = 'ps06',
  DownloadProductDocument = 'dprd',
  BulkAssignProducts = 'bapr',
  ExportProduct ='ep07',

  // Product Category
  ListProductCategories = 'lpc1',
  ViewProductCategory = 'vpc2',
  AddProductCategory = 'apc3',
  EditProductCategory = 'epc4',
  DeleteProductCategory = 'dpc5',
  ImportProductCategories = 'ipc6',
  DownloadProductCategoryDocument = 'dpcd',
  ExportProductCategorys='epc7',

  // Product Sku
  ListProductSkus = 'lsk1',
  ViewProductSku = 'vsk2',
  AddProductSku = 'ask3',
  EditProductSku = 'esk4',
  DeleteProductSku = 'dsk5',
  DownloadProductSkuDocument = 'dpsd',

  // Order
  ListOrder = 'lo01',
  ViewOrder = 'vo02',
  AddOrder = 'ao03',
  EditOrder = 'eo04',
  DeleteOrder = 'do05',
  ImportOrders = 'io06',
  ExportOrders = 'eo07',
  AssignOrders = 'aso8',
  BulkAssignOrders = 'bao9',
  ChangeOrderStage = 'os10',
  DownloadOrderDocument = 'dord',

  // Campaign
  ListCampaign = 'lcm1',
  ViewCampaign = 'vcm2',
  AddCampaign = 'acm3',
  EditCampaign = 'ecm4',
  DeleteCampaign = 'dcm5',
  ImportCampaign = 'icm6',
  ExportCampaign='ecm7',
  DownloadCampaignDocument = 'dcmd',

  // Newsletters
  ListNewsletter = 'lnl1',
  ViewNewsletter = 'vnl2',
  AddNewsletter = 'anl3',
  EditNewsletter = 'enl4',
  DeleteNewsletter = 'dnl5',
  ImportNewsletter = 'inl6',
  DownloadNewsletterDocument = 'dnld',
  ExportNewsletter='enl7',

  // Appointment
  ListAppointment = 'lap1',
  ViewAppointment = 'vap2',
  AddAppointment = 'aap3',
  EditAppointment = 'eap4',
  DeleteAppointment = 'dap5',
  ExportAppointment = 'eap6',
  DownloadAppointmentDocument = 'dapd',

  //Opportunities
  ListOpportunities = 'lop1',
  ViewOpportunity = 'vop2',
  AddOpportunity = 'aop3',
  EditOpportunity = 'eop4',
  DeleteOpportunity = 'dop5',
  ImportOpportunities = 'iop6',
  ExportOpportunities = 'eop7',
  AssignOpportunity = 'aop8',
  BulkAssignOpportunity = 'baop',
  ChangeOpportunityStage = 'csop',
  DownloadOpportunityDocument = 'dopd',

  // PriceBook
  ListPriceBooks = 'lpb1',
  ViewPriceBook = 'vpb2',
  AddPriceBook = 'apb3',
  EditPriceBook = 'epb4',
  DeletePriceBook = 'dpb5',
  DownloadPriceBookDocument = 'dpbd',
  ExportPriceBooks ='epb7',

  // Cases
  ListCases = 'lcs1',
  ViewCase = 'vcs2',
  AddCase = 'acs3',
  EditCase = 'ecs4',
  DeleteCase = 'dcs5',
  ImportCases = 'ics6',
  ExportCases = 'ecs7',
  AssignCase = 'acs8',
  BulkAssignCases = 'bcs9',
  AddSubCase = 'scs0',
  DeleteSubCase = 'dscs',
  ChangeCaseStage = 'ccs1',
  DownloadCaseDocument = 'dcsd'
}