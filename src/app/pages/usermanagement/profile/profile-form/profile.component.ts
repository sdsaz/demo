//ANGULAR
import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';

//COMMON
import { Profile, ProfileChangePassword, ProfileAddress } from '../profile.model';
import { AppSettings } from '../../../../@core/AppSettings';
import { CommonHelper } from '../../../../@core/common-helper';
import { DataSources, Entity, FieldTypesFromReferenceType, LocalStorageKey } from '../../../../@core/enum';

//PRIMENG
import { Table } from 'primeng/table';

//Components
import { MustMatch, MustNotMatch } from '../../../../@core/match-password.validator';
import { ImageAreaSelectComponent } from '../../../../@core/sharedModules/image-area-select/image-area-select.component';

//SERVICES
import { ProfileService } from '../profile.service';
import { TeamsService } from '../../../teamsmanagement/teams/teams.service';
import { CommonService } from '../../../../@core/sharedServices/common.service';
import { DatasourceService } from '../../../../@core/sharedServices/datasource.service';
import { SettingsService } from '../../../settings/settings.service';

//OTHER
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationService } from '../../../auth/auth.service';
import { NbMenuItem } from '@nebular/theme';
import { UsersService } from '../../users/users.service';
import { FileSignedUrlService } from '../../../../@core/sharedServices/file-signed-url.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})

export class ProfileComponent extends AppSettings implements OnInit {

  //Form View child
  @ViewChild('pTable') private pTable: Table;

  //For Model Ref
  modalRef: NgbModalRef | null;

  basicInfoForm: UntypedFormGroup;
  addressForm: UntypedFormGroup;
  changePasswordForm: UntypedFormGroup;
  detailsForm: UntypedFormGroup;
  matchValueError: boolean;

  profile: Profile;
  copyOfProfile: Profile;
  teams: any = null;
  isImageRemove: boolean = false;
  imageBase64String: string = '';
  userImageName: any;

  states: any;
  countries: any;
  isDefaultCountryId: boolean = false;
  copyOfIsDefaultCountryId: boolean = false;

  croppedImage: any = '';
  dialogRef: any;

  submitted: boolean = false;
  addresssubmitted: boolean = false;
  passwordSubmitted: boolean = false;
  detailSubmitted: boolean = false;

  profileChangePassword: ProfileChangePassword;

  addressId: any;
  detailId: any;
  tinyMceApiKey: string = '';

  //Table Column
  cols: any[];
  totalRecords: number;

  //For Validation
  isPhoneInvalid: boolean = false;

  //time zone
  timeZoneList: any;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //user tenant settings
  fieldTypesFromReferenceType = FieldTypesFromReferenceType;
  userTenantSettingForm: UntypedFormGroup[] = [];
  userTenantSettingGroupsArray: any[];
  userTenantSettingsArray: any[];

  //password strength
  isPasswordStrengthVisible: boolean = false;

  basicInfo_validation_messages = {
    'firstName': [
      { type: 'required', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_FIRSTNAME' }
    ],
    'lastName': [
      { type: 'required', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_LASTNAME' }
    ],
    'email': [
      { type: 'required', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_EMAIL' },
      { type: 'email', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_INVALID_EMAIL' }
    ],
    'timezone': [
      { type: 'required', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_TIMEZONE_SELECT' },
    ],
    'title': [
      { type: 'minlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_TITLE_MIN' },
      { type: 'maxlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_TITLE_MAX' }
    ],
    'website': [
      { type: 'minlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_WEBSITE_MIN' },
      { type: 'maxlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_WEBSITE_MAX' }
    ],
    'linkedInProfile': [
      { type: 'minlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_LINKEDIN_PROFILE_MIN' },
      { type: 'maxlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_LINKEDIN_PROFILE_MAX' }
    ],
    'facebookProfile': [
      { type: 'minlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_FACEBOOK_PROFILE_MIN' },
      { type: 'maxlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_FACEBOOK_PROFILE_MAX' }
    ],
    'twitterProfile': [
      { type: 'minlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_TWITTER_PROFILE_MIN' },
      { type: 'maxlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_TWITTER_PROFILE_MAX' }
    ],
    'qualifications': [
      { type: 'minlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_QUALIFICATIONS_MIN' },
      { type: 'maxlength', message: 'MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_QUALIFICATIONS_MAX' }
    ]
  };

  address_validation_messages = {
    'address1': [
      { type: 'required', message: 'MYPROFILE_DIALOG.TAB_ADDRES.MESSAGE_ADDRESS_REQUIRED' }
    ]
  };

  changePassword_validation_messages = {
    'oldPassword': [
      { type: 'required', message: 'MYPROFILE_DIALOG.TAB_CHANGE_PASSWORD.MESSAGE_OLDPASSWORD' }
    ],
    'newPassword': [
      { type: 'required', message: 'MYPROFILE_DIALOG.TAB_CHANGE_PASSWORD.MESSAGE_NEWPASSWORD' },
      { type: 'mustNotMatch', message: 'MYPROFILE_DIALOG.TAB_CHANGE_PASSWORD.MESSAGE_OLDPASSWORD_NEWPASSWORD_NOTSAME' },
      { type: 'pattern', message: this._commonHelper.passwordPatternMessage }
    ],
    'confirmPassword': [
      { type: 'required', message: 'MYPROFILE_DIALOG.TAB_CHANGE_PASSWORD.MESSAGE_CONFIRMPASSWORD' }
    ]
  };

  private _loggedInUser: any;

  constructor(private _modalService: NgbModal,
    private _formBuilder: UntypedFormBuilder,
    private _profileService: ProfileService,
    private _router: Router,
    public _commonHelper: CommonHelper,
    private _teamsService: TeamsService,
    private _dataSourceService: DatasourceService,
    private _commonService: CommonService,
    private _authenticationService: AuthenticationService,
    private _usersService: UsersService,
    private _settingsService: SettingsService,
    private _fileSignedUrlService: FileSignedUrlService) {
    super();
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();
    this.matchValueError = false;
    //this.croppedImage = "assets/images/default/users/no-image.jpg";
    this.profileChangePassword = new ProfileChangePassword();
    this.tinyMceApiKey = this._commonHelper.globalTinymceApiKey;
    //Set column  name json
    this.cols = [
      { field: 'teamName', header: 'MYPROFILE_DIALOG.TEAMS.LIST.TABLE_HEADER_TEAMS', sort: true },
      { field: 'teamMemberRoleName', header: 'MYPROFILE_DIALOG.TEAMS.LIST.TABLE_HEADER_MEMBER_ROLE', sort: true }
    ];

    this.getAllTimeZone();
    this.countries = [{
      id: "US",
      name: "US"
    }]
  }

  ngOnInit() {
    Promise.all([
      this.getCountries()
    ]).then(() => { this.getProfileDetail(); });
  }

  getMyTeams() {
    this._teamsService.getMyTeams().then((response: any) => {
      this.teams = response.filter(ele => ele.memberId == this.profile.id)
      this.totalRecords = this.teams.length;
    }, (error) => {
      this.getTranslateErrorMessage(error);
    });
  }

  onCountrySelectionChange(value, addressFormGroup: AbstractControl) {
    this.isDefaultCountryId = false;
    this.onAddressChangeValidation(addressFormGroup);

    this.getStatesByCountryId(value, null).then((response) => {
      this.states = response
    });
    this.addressForm.controls['stateId'].setValue(null);
  }

  onAddressChangeValidation(addressFormGroup: AbstractControl) {
    if ((addressFormGroup.get('city').value == null || addressFormGroup.get('city').value == '')
      && (addressFormGroup.get('stateId').value == null || addressFormGroup.get('stateId').value == '')
      && (addressFormGroup.get('postalCode').value == null || addressFormGroup.get('postalCode').value == '')
      && (this.isDefaultCountryId ? true : (addressFormGroup.get('countryId').value == null || addressFormGroup.get('countryId').value == ''))
    ) {
      addressFormGroup.get('address1').removeValidators([Validators.required]);
      addressFormGroup.get('address1').updateValueAndValidity();
    }
    else {
      addressFormGroup.get('address1').setValidators([Validators.required]);
      addressFormGroup.get('address1').updateValueAndValidity();
    }
  }

  private getCountries() {
    const countries = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Countries));
    if (countries == null) {
      return new Promise((resolve, reject) => {
        this._commonHelper.showLoader();
        this._commonService.getCountries().then(response => {
          this.countries = response;
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Countries, JSON.stringify(this.countries));
          this._commonHelper.hideLoader();
          resolve(null);
        }, (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
          reject(null);
        });
      });
    }
    else {
      this.countries = countries;
    }
  }

  private prepareParamsForStatesDropdown(countryId: number, stateId: number) {
    const params = [];
    const paramItem = {
      name: 'CountryID',
      type: 'int',
      value: countryId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'SelectedStateID',
      type: 'int',
      value: stateId,
    };
    params.push(paramItem1);

    return params;
  }

  private getStatesByCountryId(countryId: number, stateId: number) {
    return new Promise((resolve, reject) => {
      let params = this.prepareParamsForStatesDropdown(countryId, stateId);
      this._commonHelper.showLoader();
      // get datasource details
      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.STATESBYCOUNTRY, params).then(response => {
        this._commonHelper.hideLoader();
        resolve(response);
      }, (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(error.message);
        reject(null);
      }).catch(() => {
        resolve(null);
      });
    });
  }


  getAllTimeZone() {
    const timeZones = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.ProfileTimeZonesKey));
    if (timeZones == null) {
      this._commonHelper.showLoader();
      this._profileService.getAllTimeZone().then(response => {
        this.timeZoneList = response;
        this._commonHelper.hideLoader();
        // store in local storage
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.ProfileTimeZonesKey, JSON.stringify(this.timeZoneList));
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
    else {
      this.timeZoneList = timeZones;
    }
  }

  allowOnlyNumericValues(event) {
    this._commonHelper.allowOnlyNumericValues(event);
  }

  getProfileDetail() {
    this._commonHelper.showLoader();
    this._profileService.getProfileDetail().then(response => {
      this.profile = new Profile({});
      this.addressId = response['addressId'];
      this.profile = response as Profile;

      if (this.profile?.addresses == null) {
        this.profile.addresses = new ProfileAddress({});
      }

      if (this.profile?.addresses?.countryId == null) {
        this.profile.addresses.countryId = this._commonHelper.defaultCountryId;
        this.isDefaultCountryId = true;
      }
      else {
        this.isDefaultCountryId = false;
      }

      Promise.all([
        this.getStatesByCountryId(this.profile.addresses.countryId, this.profile.addresses.stateId).then((response) => {
          this.states = response
        }),
      ]).then(() => {
        this.getMyTeams();
        this.getUserTenantSettings();
        this.copyOfProfile = this._commonHelper.cloningObject(this.profile);
        this.copyOfIsDefaultCountryId = this.isDefaultCountryId;
        this.createBasicInfoForm();
        this.createAddressForm();
        this.createChangePasswordForm();
        this.createDetailForm();
        this.onAddressChangeValidation(this.addressForm);
        //find countryCode
        if(this.profile.phone !== '') {
          const phoneDetail = String(this.profile.phone).split('|');
          if (phoneDetail.length == 2) {
            this.basicInfoForm.patchValue({'phone' : { countryCode : phoneDetail[0], phoneNumber : phoneDetail[1]}});
          }
        } else {
          this.basicInfoForm.patchValue({ 'phone': { countryCode: null, phoneNumber: null } });
        }
      });
      this._commonHelper.hideLoader();
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  saveBasicInfo(basicInfoFormData) {
    this.submitted = true;
    if (this.basicInfoForm.invalid) {
      this.validateAllFormFields(this.basicInfoForm);
      return;
    }

    if (this.croppedImage.includes('no-image') === true || this.croppedImage.includes('avatars')) {
      basicInfoFormData.imageBase64 = '';
    }
    else {
      basicInfoFormData.imageBase64 = this.imageBase64String != this.croppedImage ? this.croppedImage : '';
    }
    basicInfoFormData.isImageRemove = this.isImageRemove ? true : false;
    basicInfoFormData.fileName = this.userImageName;

    //concat country code with phone number;
    if(basicInfoFormData.phone) {
      if(basicInfoFormData.phone.countryCode && basicInfoFormData.phone.phoneNumber) {
        basicInfoFormData.phone = basicInfoFormData.phone.countryCode +  '|' +  String(basicInfoFormData.phone.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
      }else {
        basicInfoFormData.phone = null;
      }
    }else {
      basicInfoFormData.phone = null;
    }

    this._commonHelper.showLoader();
    this._profileService.saveBasicInfo(basicInfoFormData).then((response: any) => {
      if (response != null) {
        //update local storage
        const localStorageData = this._commonHelper.getLoggedUserDetail();
        if (localStorageData != null && localStorageData !== undefined) {
          localStorageData.name = response['name'];
          localStorageData.firstName = response['firstName'];
          localStorageData.lastName = response['lastName'];
          localStorageData.imagePath = response['imagePath'];
          localStorageData.timezone = response['timezone'];
          localStorageData.title = response['title'];
          localStorageData.website = response['website'];
          localStorageData.linkedInProfile = response['linkedInProfile'];
          localStorageData.facebookProfile = response['facebookProfile'];
          localStorageData.twitterProfile = response['twitterProfile'];
          localStorageData.qualifications = response['qualifications'];
          this._commonHelper.setLoggedUserDetail(localStorageData);
          this._commonHelper.changeLoggedInProfileCallback(localStorageData)
        }
        //this.basicInfoForm.patchValue({phone: response['phone']});

        this.profile.firstName = response.firstName;
        this.profile.lastName = response.lastName;
        this.profile.email = response.email;
        this.profile.imagePath = response.imagePath;
        this.profile.phone = response.phone;
        this.profile.timezone = response.timezone;
        this.profile.isActive = response.isActive;
        this.copyOfProfile = this._commonHelper.cloningObject(this.profile);
        this.profile.title = response.title;
        this.profile.website = response.website;
        this.profile.linkedInProfile = response.linkedInProfile;
        this.profile.facebookProfile = response.facebookProfile;
        this.profile.twitterProfile = response.twitterProfile;
        this.profile.qualifications = response.qualifications;

        // "Profile updated successfully"
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_PROFILE_UPDATE'));
        //this.getProfileDetail();        
      }
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    this.submitted = false;
  }

  saveAddress(addressFormData) {
    this.addresssubmitted = true;
    if (this.addressForm.invalid) {
      this.validateAllFormFields(this.addressForm);
      return;
    }

    let params = {
      id: this.addressId,
      address1: addressFormData.address1,
      address2: addressFormData.address2,
      city: addressFormData.city,
      countryId: addressFormData.countryId,
      postalCode: addressFormData.postalCode,
      stateId: addressFormData.stateId,
      stateOrProvince: addressFormData.stateId != '' ? this.states.filter(c => c.value == addressFormData.stateId).map(e => { return e.label })[0] : ''
    }

    this._commonHelper.showLoader();
    this._profileService.saveAddress(params).then((response: any) => {
      if (response) {
        this.profile.addresses.address1 = response.address1;
        this.profile.addresses.address2 = response.address2;
        this.profile.addresses.city = response.city;
        this.profile.addresses.stateId = response.stateId;
        this.profile.addresses.postalCode = response.postalCode;
        this.profile.addresses.countryId = response.countryId;
        this.profile.addresses.stateOrProvince = response.stateOrProvince;
        this.copyOfProfile = this._commonHelper.cloningObject(this.profile);
        this.copyOfIsDefaultCountryId = this.isDefaultCountryId;
      }
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('MYPROFILE_DIALOG.TAB_ADDRES.MESSAGE_ADDRESS_UPDATE')
      );
      this.addresssubmitted = false;
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        this.addresssubmitted = false;
      });
  }

  saveChangePasswordForm(changePasswordFormData) {
    this.passwordSubmitted = true;

    if (this.changePasswordForm.invalid) {
      this.validateAllFormFields(this.changePasswordForm);
      return;
    }

    this._commonHelper.showLoader();
    this._profileService.saveChangePasswordForm(changePasswordFormData).then((response: any) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('MYPROFILE_DIALOG.TAB_CHANGE_PASSWORD.MESSAGE_PASSAWORD_CHAGE')
      );
      this.changePasswordForm.reset();
      this.changePasswordForm.patchValue({ id: changePasswordFormData.id });
      this.passwordSubmitted = false;
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.changePasswordForm.reset();
        this.changePasswordForm.patchValue({ id: changePasswordFormData.id });
        this.getTranslateErrorMessage(error);
      });
    this.passwordSubmitted = false;
  }

  saveDetailForm(detailsForm) {
    this.detailSubmitted = true;
    let params = {
      id: this.detailId,
      aboutMe: detailsForm.aboutMe,
      achievements: detailsForm.achievements
    }

    this._commonHelper.showLoader();
    this._profileService.saveProfileAboutMe(params).then((response: any) => {
      if (response != null) {
        //update local storage
        const localStorageData = this._commonHelper.getLoggedUserDetail();
        if (localStorageData != null && localStorageData !== undefined) {
          localStorageData.aboutMe = response['aboutMe'];
          localStorageData.achievements = response['achievements'];
        }
      }
    this._commonHelper.hideLoader();
    this._commonHelper.showToastrSuccess(
      this._commonHelper.getInstanceTranlationData('MYPROFILE_DIALOG.TAB_ADDRES.MESSAGE_DETAILS_UPDATE')
    );
    this.detailSubmitted = false;
    })
  }

  inputPhoneMaskValid() {
    if (this.basicInfoForm) {
      this.isPhoneInvalid = this.basicInfoForm.controls.phone.invalid;
    }
  }
  // convenience getter for easy access to form fields
  get bf() { return this.basicInfoForm.controls; }
  get af() { return this.addressForm.controls; }
  get cpf() { return this.changePasswordForm.controls; }
  get df() { return this.detailsForm.controls; }

  createBasicInfoForm() {
    if (this.profile.imagePath !== null && this.profile.imagePath !== '') {
      //this.croppedImage = this._commonHelper.globalAvatarRelativePath + this.profile.imagePath;

      this._fileSignedUrlService.getSingleFileSignedUrl(Entity.Users, this.profile.imagePath).then(res => {
        if (res) {
          this.croppedImage = res;
        }
      });

      this.imageBase64String = this.profile.imagePath;
    } else {
      this.profile.imagePath = this.croppedImage;
    }
    this.basicInfoForm = null;
    this.basicInfoForm = this._formBuilder.group({
      firstName: [this.profile.firstName, Validators.compose([Validators.required])],
      lastName: [this.profile.lastName, Validators.compose([Validators.required])],
      email: [this.profile.email, [Validators.required, Validators.email]],
      imagePath: [this.croppedImage],
      phone: [this.profile.phone],
      timezone: [this.profile.timezone, Validators.compose([Validators.required])],
      phoneMobile: [this.profile.phoneMobile],
      fileName: [this.userImageName],
      title: [this.profile.title,Validators.compose([Validators.minLength(5), Validators.maxLength(200)])],
      website: [this.profile.website,Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
      linkedInProfile: [this.profile.linkedInProfile,Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
      facebookProfile: [this.profile.facebookProfile,Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
      twitterProfile: [this.profile.twitterProfile,Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
      qualifications: [this.profile.qualifications,Validators.compose([Validators.minLength(5), Validators.maxLength(500)])]
    });
  }

  createAddressForm() {
    this.addressForm = null;
    if (this.profile.addresses == null) {
      this.profile.addresses = new ProfileAddress({});
      this.profile.addresses.id = 0;
    }
    this.addressForm = this._formBuilder.group({
      address1: [this.profile.addresses.address1],
      address2: [this.profile.addresses.address2],
      city: [this.profile.addresses.city],
      stateId: [this.profile.addresses.stateId],
      postalCode: [this.profile.addresses.postalCode],
      countryId: [this.profile.addresses.countryId],
      stateOrProvince: [this.profile.addresses.stateOrProvince]
    });
  }

  createChangePasswordForm() {
    this.changePasswordForm = null;
    this.changePasswordForm = this._formBuilder.group({
      oldPassword: [this.profileChangePassword.oldPassword, Validators.compose([Validators.required])],
      newPassword: [this.profileChangePassword.newPassword, Validators.compose([Validators.required, Validators.pattern(this._commonHelper.passwordPattern)])],
      confirmPassword: [this.profileChangePassword.confirmPassword, Validators.compose([Validators.required])]
    }, {
      validator: [MustNotMatch('oldPassword', 'newPassword'), MustMatch('newPassword', 'confirmPassword')]
    },
    );
  }

  createDetailForm(): any {
    this.detailsForm = this._formBuilder.group({
      aboutMe: [this.profile?.aboutMe],
      achievements: [this.profile?.achievements]
    });
  }

  openProfileCropper(): void {
    this.modalRef = this._modalService.open(ImageAreaSelectComponent, this.optionsForPopupDialog);
    // this.modalRef.componentInstance.dialogTitle = "Select Profile Photo";
    this.modalRef.componentInstance.dialogTitle =
      this._commonHelper.getInstanceTranlationData('MYPROFILE_DIALOG.TAB_BASIC.MESSAGE_PROFILE_PHOTO_SELECT');

      this.modalRef.result.then(imageData => {
        if (imageData != undefined) {
          if (imageData != '') {
            this.croppedImage = imageData.imageBase64;
            this.userImageName = imageData.fileName;
          }
        }
      });
  }

  //For Form Validate
  validateAllFormFields(formGroup: UntypedFormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      }
      else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  //For password and Confirm Password Validate
  passwordValidate(changePassFrm: UntypedFormGroup) {
    let newPassword = changePassFrm.controls.newPassword.value;
    let confirmPassword = changePassFrm.controls.confirmPassword.value;

    if (confirmPassword.length <= 0) {
      return null;
    }

    if (confirmPassword !== newPassword) {
      return {
        doesMatchPassword: true
      };
    }
    return null;
  }

  onResetBasicInfoForm() {
    this.basicInfoForm.reset();
    this.getProfileDetail();
    this.profile = this._commonHelper.cloningObject(this.copyOfProfile);

    if (this.profile.imagePath !== null) {
      if (this.profile.imagePath !== '') {
        this._fileSignedUrlService.getSingleFileSignedUrl(Entity.Users, this.profile.imagePath).then(res => {
          if (res) {
            this.croppedImage = res;
          } 
        });
      } else {
        this.profile.imagePath = this.croppedImage;
      }
    } else {
      this.profile.imagePath = this.croppedImage;
    }

    this.basicInfoForm.patchValue({ id: this.profile.id });
    this.basicInfoForm.patchValue({ firstName: this.profile.firstName });
    this.basicInfoForm.patchValue({ lastName: this.profile.lastName });
    this.basicInfoForm.patchValue({ email: this.profile.email });
    this.basicInfoForm.patchValue({ phone: this.profile.phone });
    this.basicInfoForm.patchValue({ phoneMobile: this.profile.phoneMobile });
    this.basicInfoForm.patchValue({ imagePath: this.croppedImage });
    this.basicInfoForm.patchValue({ timezone: this.profile.timezone });
    this.basicInfoForm.patchValue({ title: this.profile.title });
    this.basicInfoForm.patchValue({ website: this.profile.website });
    this.basicInfoForm.patchValue({ linkedInProfile: this.profile.linkedInProfile });
    this.basicInfoForm.patchValue({ facebookProfile: this.profile.facebookProfile });
    this.basicInfoForm.patchValue({ twitterProfile: this.profile.twitterProfile });
    this.basicInfoForm.patchValue({ qualifications: this.profile.qualifications });
  }

  onResetAddressForm() {
    this.addressForm.reset();
    this.addresssubmitted = false;
    this.profile = this._commonHelper.cloningObject(this.copyOfProfile);

    this.addressForm.patchValue({ id: this.profile.addresses.id });
    this.addressForm.patchValue({ address1: this.profile.addresses.address1 });
    this.addressForm.patchValue({ address2: this.profile.addresses.address2 });
    this.addressForm.patchValue({ city: this.profile.addresses.city });
    this.addressForm.patchValue({ stateId: this.profile.addresses.stateId });
    this.addressForm.patchValue({ postalCode: this.profile.addresses.postalCode });
    this.addressForm.patchValue({ countryId: this.profile.addresses.countryId });

    this.isDefaultCountryId = this.copyOfIsDefaultCountryId;
    //set address validators
    this.onAddressChangeValidation(this.addressForm);

    if (this.states.filter(x => x.value == this.profile.addresses.stateId).length <= 0) {
      this.getStatesByCountryId(this.profile.addresses.countryId, this.profile.addresses.stateId).then((response) => {
        this.states = response
      });
    }
  }

  onResetPasswordForm() {
    this.changePasswordForm.reset();
    this.changePasswordForm.patchValue({ id: this.profile.id });
  }

  onResetDetailsForm() {
    this.detailsForm.reset();
    this.getProfileDetail();
    this.profile = this._commonHelper.cloningObject(this.copyOfProfile);
    this.detailsForm.patchValue({ aboutMe: this.profile.aboutMe });
    this.detailsForm.patchValue({ achievements: this.profile.achievements });
  }

  removeImage() {
    this.croppedImage = "";
    this.isImageRemove = true;
    this.basicInfoForm.patchValue({ imagePath: "" });
    this.profile.imagePath = "";
  }

  onBack() {
    this._router.navigate(['/']);
  }

  onfocusPassword() {
    this.isPasswordStrengthVisible = true;
  }

  onblurPassword() {
    this.isPasswordStrengthVisible = false;
  }

  getTranslateErrorMessage(error, interpolateParams?: Object) {
    if (error != null && error.messageCode) {
      if (interpolateParams) {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('MYPROFILE_DIALOG.' + error.messageCode.replace('.', '_').toUpperCase(), { groupName: interpolateParams })
        );
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('MYPROFILE_DIALOG.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }

  //Clear local Cache
  onClearLocalCache() {
    this._commonHelper.showLoader();

    //Clear Existing Local Storage Data
    this._commonHelper.clearAllLocalStorageData(false);

    Promise.all([
      this.getAllWebAccessibleTenantSettingsWithValue(),
      this.getAllWebAccessibleUserTenantSettingsWithValue(),
      this.getUserMenuItems(),
      this.getAllWebAccessibleReferenceTypes()
    ]).then((result: any) => {
      this._commonHelper.hideLoader();
      const responseOfTenantSetting = result[0];
      const responseOfMenuItems = result[1];
      const responseOfReferenceTypes = result[2];

      //Tenant Setting
      if (responseOfTenantSetting && responseOfTenantSetting != '') {
        this._commonHelper.setTenantSettingInLocalStorage(responseOfTenantSetting);
      }

      //User Menu Items
      if (responseOfMenuItems && responseOfMenuItems != '') {
        this._commonHelper.setUserMenuItemsCache(this._commonHelper.prepareMenus(responseOfMenuItems || []));        
      }

      // Reference Type
      if (responseOfReferenceTypes && responseOfReferenceTypes != '') {
        this._commonHelper.setReferenceTypeInLocalStorage(responseOfReferenceTypes);
      }

      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('MYPROFILE_DIALOG.MESSAGE_LOCAL_CACHECLEAR')
      );
    }, (error => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('MYPROFILE_DIALOG.MESSAGE_UNKNOWN_ERROR_CLEARCACHE')
      );
    }));
  }

  saveUserTenantSettingsForm(formData: UntypedFormGroup) {
    this.submitted = true;
    if (formData.invalid) {
      return;
    }
    this._commonHelper.showLoader();
    let saveGroupName = formData.value.groupName;

    //convert to comma saperated string from object if there is dropdown
    for (const key in formData.value) {
      if (Array.isArray(formData.value[key])) {
        let strSelectedIds = '';
          formData.value[key].forEach(x => {
            strSelectedIds += x + ",";
          });
          strSelectedIds = strSelectedIds.substring(0, strSelectedIds.length - 1);
          formData.value[key] = strSelectedIds;
      }
    }

    this._settingsService.saveUserTenantSettings(formData.value).then(response => {
      this._commonHelper.hideLoader();
      if (response != undefined) {
        this.getAllWebAccessibleUserTenantSettingsWithValue().then((res:any) => {
          this._commonHelper.setUserTenantSettingInLocalStorage(res);
        });
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('MYPROFILE_DIALOG.USER_TENANT_SETTING.MESSAGE_SETTINGS_SAVE', { groupName: saveGroupName}) );
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error, saveGroupName);
      });
  }

  private getUserTenantSettings() {
    this._settingsService.getUserTenantSettings().then((response: any[]) => {
      if (response != undefined) {
        this.userTenantSettingsArray = response;
        let groups = new Set(this.userTenantSettingsArray.map(item => item['groupName']));
        this.userTenantSettingGroupsArray = [];
        let index = 0;
        groups.forEach((grp) => {
          this.userTenantSettingGroupsArray.push({
            groupName: grp,
            values: this.userTenantSettingsArray.filter(i => i['groupName'] === grp)
          });
          this.userTenantSettingForm[index] = this._formBuilder.group({});
          this.userTenantSettingForm[index] = this.createControl(this.userTenantSettingGroupsArray[index]['values']);
          index++;
        });
      }
    }, (error) => {
      this.getTranslateErrorMessage(error);
    });
  }

  private createControl(fields) {
    const group = this._formBuilder.group({});

    const control = this._formBuilder.control(fields[0]['groupName']);
    group.addControl('groupName', control);
    fields.forEach(field => {
      if (field.fieldType == this.fieldTypesFromReferenceType.MULTISELECT && field.dataSource ? field.dataSource.length > 0 : false) {
        let selectedValues: any[] = [];
        if (field.dataSource.length > 0) {
          if (field.value != "") {
            var values = field.value.split(',') as [];
            if (values.length > 0) {
              values.forEach((_value) => {
                const obj = field.dataSource.find(x => x.value == _value)
                selectedValues.push(obj.value);
              });
            }
          }

          field.value = selectedValues;
        }
      }

      let control;
      if (field.settingsJson && JSON.parse(field.settingsJson)) {
        let settingsJson = JSON.parse(field.settingsJson);
        field.min = +settingsJson.min;
        field.max = +settingsJson.max;
        field.minValMessage = settingsJson.minValMessage;
        field.maxValMessage = settingsJson.maxValMessage;
      }

      if (field.isRequired) {
        if (field.fieldType == this.fieldTypesFromReferenceType.NUMBER.toString() && field?.min >= 0 && field?.max) {
          control = this._formBuilder.control(field.value, Validators.compose([Validators.required,
            Validators.min(field.min),
            Validators.max(field.max)
            ]));
        }
        else {
          control = this._formBuilder.control(field.value, Validators.compose([Validators.required]));
        }
        group.addControl(field.code, control);
      }
      else {
        if (field.fieldType == this.fieldTypesFromReferenceType.NUMBER.toString() && field?.min >= 0 && field?.max) {
          control = this._formBuilder.control(field.value, Validators.compose([
            Validators.min(field.min),
            Validators.max(field.max)
            ]));
        }
        else {
          control = this._formBuilder.control(field.value);
        }
        group.addControl(field.code, control);
      }
      
      if (field.isDisplayTextRequired) {
        control = this._formBuilder.control(field.displayText, Validators.compose([Validators.maxLength(500)]));
        group.addControl(field.code + "_DT", control);
      }
    });
    
    return group;
  }

  private getUserMenuItems() {
    return new Promise((resolve, reject) => {
      if (this._loggedInUser) {
        this._usersService.getUserMenuItems()
          .then((response: Array<NbMenuItem>) => {
            resolve(response);
          }, (error) => {
            resolve(null);
          });
      } else {
        resolve(null);
      }
    });
  }

  private getAllWebAccessibleTenantSettingsWithValue() {
    return new Promise((resolve, reject) => {
      this._settingsService.getAllWebAccessibleTenantSettingsWithValue().then((response: any) => {
        resolve(response);
      }, (error) => {
        resolve(null);
      });
    });
  }

  private getAllWebAccessibleUserTenantSettingsWithValue() {
    return new Promise((resolve, reject) => {
      this._settingsService.getAllWebAccessibleUserTenantSettingsWithValue().then((response: any) => {
        resolve(response);
      }, (error) => {
        resolve(null);
      });
    });
  }

  private getAllWebAccessibleReferenceTypes() {
    return new Promise((resolve, reject) => {
      this._commonService.getAllWebAccessibleReferenceTypes().then((response: any) => {
        resolve(response);
      }, (error) => {
        resolve(null);
      });
    });
  }
}
