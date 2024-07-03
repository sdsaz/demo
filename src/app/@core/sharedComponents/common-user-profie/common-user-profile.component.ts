//ANGULAR
import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

//SERVICES
import { CommonHelper } from '../../common-helper';
import { FileSignedUrlService } from '../../sharedServices/file-signed-url.service';
import { UsersService } from '../../../pages/usermanagement/users/users.service';
//ENUMS
import { Entity, LocalStorageKey } from '../../enum';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';


@Component({
  selector: 'ngx-common-user-profile',
  templateUrl: './common-user-profile.component.html',
  styleUrls: ['./common-user-profile.component.scss']
})
export class CommonUserProfileComponent implements OnInit, OnDestroy, AfterViewInit  {

  @Input() userId: number;
  @Input() userTypeId: number;
  @Input() privacyLevel: number;
  @Input() isItemDisable: boolean = false;
  @Input() isShowName: boolean = false;
  @Input() userLabel: string;
  @Input() hasPopover: boolean = true;

  @Output() clickEvent = new EventEmitter<any>();

  showData: any;
  allProfileData: any;
  showSkeletonLoader: boolean = true;
  private readonly debounceTimeMs = this._commonHelper.userPopOverDebounceTimeinMiliSeconds;
  private popOverSubject = new Subject<boolean>();

  constructor(public _commonHelper: CommonHelper,
    private _fileSignedUrlService: FileSignedUrlService,
    private _userService: UsersService) { }

  ngAfterViewInit(): void {
    if(this.userId !== 0 && this.userId !== null) {
      this.getUserProfileData();
    }
    this.popOverSubject.pipe(debounceTime(this.debounceTimeMs)).subscribe((response: boolean) => {
      if (response == true) {
        this.showSkeletonLoader = true;
        this.GetAllUserProfileData();
      }
    });
  }

  ngOnInit(): void {
    
  }

  ngOnDestroy() {
    this.popOverSubject.complete();
  }

  getUserProfileData() {
    let storageKey;
    if (this.privacyLevel && this.privacyLevel != null) {
      storageKey = `${LocalStorageKey.User_Profile_Details}_PRIVACY-LEVEL _${this.privacyLevel}_USERID_${this.userId}_USERTYPEID_${this.userTypeId}_LOGGED-IN-USERID_${this._commonHelper?.getLoggedUserDetail()?.userId}`;
    } else {
      storageKey = `${LocalStorageKey.User_Profile_Details}_USERID_${this.userId}_LOGGED-IN-USERID_${this._commonHelper?.getLoggedUserDetail()?.userId}`;
    }

    // if session key exists then wait to interval to read key for localstorage
    const keyExists = sessionStorage.getItem(storageKey);
    if (keyExists) {
      setTimeout(() => {
        this.showData = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
        sessionStorage.removeItem(storageKey);
      }, this._commonHelper.waitForResponse);
      return;
    }
    
    // Add key in session storage to identify that, request is already done
    // so can reduce multiple request for same detail
    sessionStorage.setItem(storageKey, storageKey);
    let userProfileDetails: any = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));

    //remove data from the localStorage after 24-Hours
    if ((this._commonHelper.getNowUTC() > new Date(userProfileDetails?.expireDate))) {
      userProfileDetails = null;
    }

    if (userProfileDetails == null) {
      
      this._userService.getUserProfileData(this.userTypeId, this.userId, this.privacyLevel).then((response: any) => {
        if (response && response !== undefined && response !== null && response !== "") {
          this.showData = {
            jsonData: response?.jsonData,
            expireDate: response?.expireDate
          }
          this.getFileSignedUrlImage().then(res => {
            //set data in localStorage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.showData));
          });
        }
      }, (error: any) => {
        this._commonHelper.showToastrError(error.message);
      })
    } else {
      this.showData = userProfileDetails;
      sessionStorage.removeItem(storageKey);
    }
  }

  GetAllUserProfileData() {
    if (this.userId !== 0 && this.userId !== null) {
      this._userService.GetAllUserProfileData(this.userTypeId, this.userId, this.privacyLevel).then((response: any) => {
        if (response) {
          this.showSkeletonLoader = false;
          this.allProfileData = response;
        }
      }, (error: any) => {
        this.showSkeletonLoader = false;
        this._commonHelper.showToastrError(error.message);
      })
    }
  }

  showPopover() {
    this.allProfileData = null;
    this.popOverSubject.next(true);
  }

  dismissPopover() {
    this.popOverSubject.next(false);
  }

  getFileSignedUrlImage() {
    return this._fileSignedUrlService.getObjectFileSignedUrl(this.showData?.jsonData, Entity.Users, 'ImagePath', 'ImagePathBySignedUrl');
  }

  onClickEvent(event: any): any {
    this.clickEvent.emit(event);
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
}
