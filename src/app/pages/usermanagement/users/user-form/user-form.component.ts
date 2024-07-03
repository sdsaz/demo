import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl } from '@angular/forms';
import { MustMatch } from '../../../../@core/match-password.validator';
import { ImageAreaSelectComponent } from '../../../../@core/sharedModules/image-area-select/image-area-select.component';
import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { UsersService } from '../users.service';
import { User, UserChangePassword } from '../user.model';
import { ConfirmationDialogService } from '../../../../@core/sharedModules/confirmation-dialog/confirmation-dialog.service';
import { fromEvent, Subject } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Entity, LocalStorageKey } from '../../../../@core/enum';
import { FileSignedUrlService } from '../../../../@core/sharedServices/file-signed-url.service';
import { Location } from '@angular/common';
import { CommonService } from '../../../../@core/sharedServices/common.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {

  searchTextInput: ElementRef;

  @ViewChild('searchTextInput', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.searchTextInput = content;
    }
  }

  // modelChanged: Subject<string> = new Subject<string>(); // serach modelChange Event publisher

  //For Model Ref
  modalRef: NgbModalRef | null;

  //For User Form
  userForm: UntypedFormGroup;
  changePasswordForm: UntypedFormGroup;
  imageBase64String: string = '';
  isImageRemove: boolean = false;

  //User/Role Model
  user: User;
  copyOfUser: User;
  roles: any;
  permissions: any;
  selectedPermissions: any;
  userChangePassword: UserChangePassword;
  loggedUserDetail: any;
  userImageName: any;

  //Cropped Image base64String
  croppedImage: any = '';

  userId: number = 0;
  formMode: string;
  submitted: boolean = false;
  isChangePassword: boolean = false;
  isInitialLoading: boolean = true;

  //permission variable
  isViewUser: boolean = false;
  isAddUser: boolean = false;
  isEditUser: boolean = false;
  isDeleteUser: boolean = false;
  isEditProfile: boolean = false;

  //time zone
  timeZoneList: any;

  //search veriables
  searchData: any[] = [];
  searchElement: string = '';
  permissionsData: any;

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };
  selectedRoleIds: any[] = [];
  //For Validation
  isPhoneInvalid: boolean = false;

  //password strength
  isPasswordStrengthVisible: boolean = false;

  countries: any;

  user_validation_messages = {
    'firstName': [
      { type: 'required', message: 'URAM.USER.DETAIL.MESSAGE_FIRSTNAME' },
      { type: 'maxlength', message: 'URAM.USER.DETAIL.MESSAGE_FIRSTNAME_MAX' }
    ],
    'lastName': [
      { type: 'maxlength', message: 'URAM.USER.DETAIL.MESSAGE_LASTNAME_MAX' }
    ],
    'userName': [
      { type: 'required', message: 'URAM.USER.DETAIL.MESSAGE_USERNAME' },
      { type: 'maxlength', message: 'URAM.USER.DETAIL.MESSAGE_USERNAME_MAX' }
    ],
    'password': [
      { type: 'required', message: 'URAM.USER.DETAIL.MESSAGE_PASSWORD' },
      { type: 'pattern', message: this._commonHelper.passwordPatternMessage }
    ],
    'confirmPassword': [
      { type: 'required', message: 'URAM.USER.DETAIL.MESSAGE_CONFIRM_PASSWORD' }
    ],
    'email': [
      { type: 'required', message: 'URAM.USER.DETAIL.MESSAGE_EMAIL' },
      { type: 'email', message: 'URAM.USER.DETAIL.MESSAGE_INVALID_EMAIL' }
    ],
    'roleId': [
      { type: 'required', message: 'URAM.USER.DETAIL.MESSAGE_ROLE_SELECT' },
    ],
    'timezone': [
      { type: 'required', message: 'URAM.USER.DETAIL.MESSAGE_TIMEZONE_SELECT' },
    ],
    'title': [
      { type: 'minlength', message: 'URAM.USER.DETAIL.MESSAGE_TITLE_MIN' },
      { type: 'maxlength', message: 'URAM.USER.DETAIL.MESSAGE_TITLE_MAX' }
    ],
    'website': [
      { type: 'minlength', message: 'URAM.USER.DETAIL.MESSAGE_WEBSITE_MIN' },
      { type: 'maxlength', message: 'URAM.USER.DETAIL.MESSAGE_WEBSITE_MAX' }
    ],
    'linkedInProfile': [
      { type: 'minlength', message: 'URAM.USER.DETAIL.MESSAGE_LINKEDIN_PROFILE_MIN' },
      { type: 'maxlength', message: 'URAM.USER.DETAIL.MESSAGE_LINKEDIN_PROFILE_MAX' }
    ],
    'facebookProfile': [
      { type: 'minlength', message: 'URAM.USER.DETAIL.MESSAGE_FACEBOOK_PROFILE_MIN' },
      { type: 'maxlength', message: 'URAM.USER.DETAIL.MESSAGE_FACEBOOK_PROFILE_MAX' }
    ],
    'twitterProfile': [
      { type: 'minlength', message: 'URAM.USER.DETAIL.MESSAGE_TWITTER_PROFILE_MIN' },
      { type: 'maxlength', message: 'URAM.USER.DETAIL.MESSAGE_TWITTER_PROFILE_MAX' }
    ],
    'qualifications': [
      { type: 'minlength', message: 'URAM.USER.DETAIL.MESSAGE_QUALIFICATIONS_MIN' },
      { type: 'maxlength', message: 'URAM.USER.DETAIL.MESSAGE_QUALIFICATIONS_MAX' }
    ]
  }

  constructor(private _router: Router,
    private _formBuilder: UntypedFormBuilder,
    private _modalService: NgbModal,
    private _activeRoute: ActivatedRoute,
    private _commonHelper: CommonHelper,
    private _usersService: UsersService,
    private _location: Location,
    private _confirmationDialogService: ConfirmationDialogService,
    private _fileSignedUrlService: FileSignedUrlService,
    private _commonService: CommonService) {
    //If Record Edit then set record edit id
    this._activeRoute.params.subscribe(param => {
      if (param['id'] != undefined) {
        if (param['id'] != null) {
          this.userId = param['id'];
        }
      }
    });

    //Set Logged user have permission
    this.isViewUser = this._commonHelper.havePermission(enumPermissions.ViewUser);
    this.isAddUser = this._commonHelper.havePermission(enumPermissions.AddUser);
    this.isEditUser = this._commonHelper.havePermission(enumPermissions.EditUser);
    this.isDeleteUser = this._commonHelper.havePermission(enumPermissions.DeleteUser);
    this.isEditProfile = this._commonHelper.havePermission(enumPermissions.EditProfile);
  }

  ngOnInit() {
    this.loggedUserDetail = this._commonHelper.getLoggedUserDetail();
    
    this.getAllTimeZone();

    Promise.all([
      this.getRoles(),
      this.getCountries()
    ]).then(() => {
      if (this.userId > 0) {
        this.formMode = 'EDIT';
        this.getUserDetail();
      } else {
        this.formMode = 'ADD';
        this.croppedImage = "assets/images/default/users/no-image.jpg";
        this.user = new User({});
        this.user.isActive = true;
        this.userForm = this.createUserForm();
        //this.userForm.patchValue({'phoneMobile' : { countryCode: null, phoneNumber: null }});
        this.userChangePassword = new UserChangePassword({});
        this.changePasswordForm = this.createChangePasswordForm();
        
        this.userForm = new UntypedFormGroup({ basicInfoForm: this.userForm, changePassForm: this.changePasswordForm });

        this.getPermissions();
      }
    });
  }

  ngAfterViewInit() {
    this.subscribeSearchboxEvent();
  }

  subscribeSearchboxEvent(): void {
    fromEvent(this.searchTextInput.nativeElement, 'keyup')
    .pipe(
      map((event: any) => event.target.value),
      filter(res => res.length >= 0 || res == null || res === ''),
      debounceTime(1000)
    ).subscribe((val) => {
      this.onSearchPermissions(this.searchElement);
    });
  }

  getUserDetail() {
    //this.isLoading = true;
    this._commonHelper.showLoader();
    this.isInitialLoading = true;
    this._usersService.getUserById(this.userId).then(response => {
      if (response) {
        this.user = response as User;
        if (this.user.imagePath != null) {
          this._fileSignedUrlService.getSingleFileSignedUrl(Entity.Users, this.user.imagePath).then(res => {
            if (res) {
              this.croppedImage = res;
             
            } 
          });
        }

        

        if (this.userForm == null) {
          this.userForm = this.createUserForm();
          this.userForm = new UntypedFormGroup({ basicInfoForm: this.userForm });
          this.userChangePassword = new UserChangePassword({});
          this.userChangePassword.userId = this.user.id;
          this.changePasswordForm = this.createChangePasswordForm();

          //set role selected in dropdown
          var rlsIds = this.user.roleIds.split(',') as [];
          if (this.user.roleIds.length > 0) {
            rlsIds.forEach((element: string) => {
              const obj = this.roles.find(x => x.value === parseInt(element.trim()))
              this.selectedRoleIds.push(obj.value);
            });
          }
          this.getPermissions();
        }

        this.copyOfUser = this._commonHelper.cloningObject(this.user);

        //find countryCode
        if (this.user.phoneMobile) {
          const phoneDetail = String(this.user.phoneMobile).split('|');
          if (phoneDetail.length == 2) {
            this.userForm.controls.basicInfoForm.patchValue({ 'phoneMobile': { countryCode: phoneDetail[0], phoneNumber: phoneDetail[1] } });
            this.user['countryCode'] = phoneDetail[0];
            this.user['phoneNumber'] = phoneDetail[1];
            this.user['phoneMask'] = String(this.countries?.find((x: any) => x.phoneCode == phoneDetail[0])?.phoneMask).replace(/[#]/g, "0");
          }
        } else {
          this.userForm.controls.basicInfoForm.patchValue({ 'phoneMobile': { countryCode: null, phoneNumber: null } });
        }
      };
      this._commonHelper.hideLoader();
      this.isInitialLoading = false;
    }, (error) => {
      this._commonHelper.hideLoader();
      this.isInitialLoading = false;
      this.getTranslateErrorMessage(error);
    });
  }

  saveForm(formData) {
    this.submitted = true;

    if (this.userForm.invalid) {
      this.validateAllFormFields(this.userForm);
      return;
    }
    if (this.croppedImage.includes('no-image') === true || this.croppedImage.includes('avatars')) {
      formData.basicInfoForm.imageBase64 = '';
    }
    else {
      formData.basicInfoForm.imageBase64 = this.croppedImage;
    }

    //permission data
    this.selectedPermissions = '';
    this.permissions.forEach(groupElement => {
      groupElement.values.forEach((item, i) => {
        if (item.isChecked && !item.isTempChecked) {
          this.selectedPermissions += item.id.toString() + ',';
        }
      });
    });

    if ((this.selectedPermissions.charAt(this.selectedPermissions.length - 1)) == ",") {
      this.selectedPermissions = this.selectedPermissions.substring(0, this.selectedPermissions.length - 1);
    }

    formData.permissionId = this.selectedPermissions.toString();

    let strSelectedRoleIds = '';
    formData.basicInfoForm.roleId.forEach(x => {
      strSelectedRoleIds += x + ",";
    });
    strSelectedRoleIds = strSelectedRoleIds.substring(0, strSelectedRoleIds.length - 1);
    if (this.formMode == 'ADD') {
      //concat country code with phone number;

      if(formData.basicInfoForm?.phoneMobile) {
        if(formData.basicInfoForm?.phoneMobile.countryCode && formData.basicInfoForm?.phoneMobile.countryCode != "" && formData.basicInfoForm?.phoneMobile.phoneNumber != "") {
          formData.basicInfoForm.phoneMobile = formData.basicInfoForm?.phoneMobile.countryCode +  '|' +  String(formData.basicInfoForm?.phoneMobile.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
        }else {
          formData.basicInfoForm.phoneMobile = null;
        }
      }

      let params = {
        id: formData.basicInfoForm.id,
        firstName: formData.basicInfoForm.firstName,
        lastName: formData.basicInfoForm.lastName,
        userName: formData.basicInfoForm.userName,
        email: formData.basicInfoForm.email,
        phoneMobile: formData.basicInfoForm.phoneMobile,
        roleIds: strSelectedRoleIds,
        timezone: formData.basicInfoForm.timezone,
        isActive: formData.basicInfoForm.isActive,
        imagePath: formData.basicInfoForm.imagePath,
        imageBase64: formData.basicInfoForm.imageBase64,
        password: formData.changePassForm.password,
        permissionId: formData.permissionId,
        fileName: this.userImageName,
        title: formData.basicInfoForm.title,
        website: formData.basicInfoForm.website,
        linkedInProfile: formData.basicInfoForm.linkedInProfile,
        facebookProfile: formData.basicInfoForm.facebookProfile,
        twitterProfile: formData.basicInfoForm.twitterProfile,
        qualifications: formData.basicInfoForm.qualifications
      }
      this._commonHelper.showLoader();
      
      this._usersService.addUsers(params).then((response: any) => {
        this._commonHelper.hideLoader();
          let usertenantparams = {
            userId: response.id,
            roleIds: strSelectedRoleIds,
            permissionId: formData.permissionId
          }
          if (response.tenantId != 0) {
          if (this.loggedUserDetail.tenantId != response.tenantId) {
            this.optionsForPopupDialog.size = "md";
            this._confirmationDialogService.confirm('URAM.USER.DETAIL.MESSAGE_CONFIRM_ADD', null, null, this.optionsForPopupDialog).then((confirmed) => {
              if (confirmed) {  
                this._commonHelper.showLoader();
                this._usersService.addUserTenant(usertenantparams).then((response: any) => {
                  if (response) {
                    this._commonHelper.hideLoader();
                    this._commonHelper.showToastrSuccess(
                      this._commonHelper.getInstanceTranlationData('URAM.USER.DETAIL.MESSAGE_USER_ADD')
                    );
                    this.closeForm();
                  }
                },
                  (error) => {
                    this._commonHelper.hideLoader();
                    this.getTranslateErrorMessage(error);
                  });
              }
            });
          }
        }
        else {
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('URAM.USER.DETAIL.MESSAGE_USER_ADD')
          );
          this.closeForm();
        }
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    } else if (this.formMode == 'EDIT') {
      //find countryCode
      if (formData.basicInfoForm.phoneMobile != '') {
        const phoneDetail = String(formData.basicInfoForm.phoneMobile).split('|');
        if (phoneDetail.length == 2) {
          formData.basicInfoForm.phoneMobile = { 'phoneMobile': { countryCode: phoneDetail[0], phoneNumber: phoneDetail[1] } };
        }
      } else {
        formData.basicInfoForm.phoneMobile = { 'phoneMobile': { countryCode: null, phoneNumber: null } };
      }

      //save updated data
      if(formData.basicInfoForm?.phoneMobile) {
        if(formData.basicInfoForm?.phoneMobile.countryCode && formData.basicInfoForm?.phoneMobile.countryCode != "" && formData.basicInfoForm?.phoneMobile.phoneNumber != "") {
          formData.basicInfoForm.phoneMobile = formData.basicInfoForm?.phoneMobile.countryCode +  '|' +  String(formData.basicInfoForm?.phoneMobile.phoneNumber).replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, "");
        }else {
          formData.basicInfoForm.phoneMobile = null;
        }
      }
      
      let params = {
        id: formData.basicInfoForm.id,
        firstName: formData.basicInfoForm.firstName,
        lastName: formData.basicInfoForm.lastName,
        userName: formData.basicInfoForm.userName,
        email: formData.basicInfoForm.email,
        phoneMobile: formData.basicInfoForm.phoneMobile,
        roleIds: strSelectedRoleIds,
        timezone: formData.basicInfoForm.timezone,
        isActive: formData.basicInfoForm.isActive,
        imagePath: formData.basicInfoForm.imagePath,
        imageBase64: this.imageBase64String != formData.basicInfoForm.imageBase64 ? formData.basicInfoForm.imageBase64 : '',
        isImageRemove: this.isImageRemove ? true : false,
        permissionId: formData.permissionId,
        fileName: this.userImageName,
        title: formData.basicInfoForm.title,
        website: formData.basicInfoForm.website,
        linkedInProfile: formData.basicInfoForm.linkedInProfile,
        facebookProfile: formData.basicInfoForm.facebookProfile,
        twitterProfile: formData.basicInfoForm.twitterProfile,
        qualifications: formData.basicInfoForm.qualifications
      }

      this._commonHelper.showLoader();
      this._usersService.updateUser(params).then(response => {
        if (response != null) {
          //update local storage
          const localStorageData = this._commonHelper.getLoggedUserDetail();
          if (localStorageData != null && localStorageData !== undefined && localStorageData.userId == this.user.id) {
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
        }
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('URAM.USER.DETAIL.MESSAGE_USER_UPDATE')
        );
        this.closeForm();
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
  }

  onSetUserPassword(formData) {
    this.isChangePassword = true;
    if (this.changePasswordForm.invalid) {
      this.validateAllFormFields(this.changePasswordForm);
      return;
    }

    let params = {
      id: formData.userId,
      Password: formData.password
    }

    this._commonHelper.showLoader();
    this._usersService.resetPasswordByAdmin(params).then(response => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('MYPROFILE_DIALOG.TAB_CHANGE_PASSWORD.MESSAGE_PASSAWORD_CHAGE')
      );

      this.changePasswordForm.reset();
      this.changePasswordForm.patchValue({ userId: formData.userId });
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    this.isChangePassword = false;
  }

  onSendReactivation() {
    let params = {
      userId: this.user.id
    }
    this._commonHelper.showLoader();
    this._usersService.sendUserActivationEmail(params).then(response => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(
        this._commonHelper.getInstanceTranlationData('URAM.USER.DETAIL.MESSAGE_FOR_USER_REACTIVATION_SUCCESSFULLY') + this.user.email
      );
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  //Open Image selection dialog with cropped, If image is selected then return base64String, If image is not selected it return undefined
  openProfileCropper(): void {
    this.modalRef = this._modalService.open(ImageAreaSelectComponent, this.optionsForPopupDialog);
    this.modalRef.result.then(imageData => {
      if (imageData != undefined) {
        if (imageData != '') {
          this.croppedImage = imageData.imageBase64;
          this.userImageName = imageData.fileName;
        }
      }
    });
  }

  createUserForm(): UntypedFormGroup {

    if (this.formMode == 'ADD') {
      return this._formBuilder.group({
        id: [this.user.id],
        firstName: [this.user.firstName, Validators.compose([Validators.required, Validators.maxLength(100)])],
        lastName: [this.user.lastName, Validators.compose([Validators.maxLength(100)])],
        userName: [this.user.userName, Validators.compose([Validators.required, Validators.maxLength(100)])],
        email: [this.user.email, [Validators.required, Validators.email]],
        phoneMobile: [],
        roleId: [this.selectedRoleIds, Validators.compose([Validators.required])],
        timezone: [this.user.timezone, Validators.compose([Validators.required])],
        isActive: [this.user.isActive],
        imagePath: [this.croppedImage],
        imageBase64: [this.croppedImage],
        permissionId: [this.user.permissionId],
        permissionName: [this.user.permissionName],
        fileName: [this.userImageName],
        title: [this.user.title, Validators.compose([Validators.minLength(5), Validators.maxLength(200)])],
        website: [this.user.website, Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
        linkedInProfile: [this.user.linkedInProfile, Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
        facebookProfile: [this.user.facebookProfile, Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
        twitterProfile: [this.user.twitterProfile, Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
        qualifications: [this.user.qualifications, Validators.compose([Validators.minLength(5), Validators.maxLength(500)])]
      });
    }
    else if (this.formMode == 'EDIT') {
      this.imageBase64String = this.croppedImage;
      return this._formBuilder.group({
        id: [this.user.id],
        firstName: [this.user.firstName, Validators.compose([Validators.required, Validators.maxLength(100)])],
        lastName: [this.user.lastName, Validators.compose([Validators.maxLength(100)])],
        userName: [this.user.userName, Validators.compose([Validators.required, Validators.maxLength(100)])],
        email: [this.user.email, [Validators.required, Validators.email]],
        phoneMobile: [this.user.phoneMobile],
        roleId: [this.selectedRoleIds, Validators.compose([Validators.required])],
        timezone: [this.user.timezone, Validators.compose([Validators.required])],
        isActive: [this.user.userTenantsIsActive],
        imagePath: [this.croppedImage],
        permissionId: [this.user.permissionId],
        permissionName: [this.user.permissionName],
        imageBase64: [this.croppedImage],
        fileName: [this.userImageName],
        title: [this.user.title, Validators.compose([Validators.minLength(5), Validators.maxLength(200)])],
        website: [this.user.website, Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
        linkedInProfile: [this.user.linkedInProfile, Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
        facebookProfile: [this.user.facebookProfile, Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
        twitterProfile: [this.user.twitterProfile, Validators.compose([Validators.minLength(5), Validators.maxLength(500)])],
        qualifications: [this.user.qualifications, Validators.compose([Validators.minLength(5), Validators.maxLength(500)])]
      });
    }
  }

  createChangePasswordForm() {
    return this._formBuilder.group({
      userId: [this.userChangePassword.userId],
      password: [this.userChangePassword.password, Validators.compose([Validators.required, Validators.pattern(this._commonHelper.passwordPattern)])],
      confirmPassword: [this.userChangePassword.confirmPassword, Validators.compose([Validators.required])]
    }, {
      validator: MustMatch('password', 'confirmPassword')
    });
  }

  getPermissions() {
    const permissionsList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.AllActivePermissions));
    if (permissionsList == null) {
      this._commonHelper.showLoader();
      this._usersService.getAllActivePermissions().then(response => {
        this.permissionsData = response as any;
        // store in local storage
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.AllActivePermissions, JSON.stringify(this.permissionsData));
        this.permissions = [];
        let permissionsGroupWise = new Set(this.permissionsData.map(item => item.groupName))
        permissionsGroupWise.forEach(g =>
          this.permissions.push({
            name: g,
            values: this.permissionsData.filter(i => i.groupName === g)
          }
          ));
        this.addCheckboxes();
        this.searchData = this.permissions;
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else {
      this.permissionsData = permissionsList;
      this.permissions = [];
      let permissionsGroupWise = new Set(this.permissionsData.map(item => item.groupName))
      permissionsGroupWise.forEach(g =>
        this.permissions.push({
          name: g,
          values: this.permissionsData.filter(i => i.groupName === g)
      }));
      this.addCheckboxes();
      this.searchData = this.permissions;
    }
  }

  addCheckboxes() {
    this._commonHelper.showLoader();
    let selectedPermissionsArray = [];
    let rolePermissions: any;
    let strSelectedRoleIds = '';
    if (this.userForm.get('basicInfoForm')['controls'].roleId.value != null)
      this.userForm.get('basicInfoForm')['controls'].roleId.value.forEach(x => {
        strSelectedRoleIds += x + ",";
      });
    strSelectedRoleIds = strSelectedRoleIds.substring(0, strSelectedRoleIds.length - 1);

    this._usersService.getPermissionsByUserRole(strSelectedRoleIds).then((response: any) => {
      rolePermissions = response;

      if (this.user.permissionId) {
        let selected = this.user.permissionId;
        selectedPermissionsArray = selected.split(',');
      }
      this.permissions.map((o, i) => {
        o.values.forEach(pValues => {
          let isChecked = false;
          if (rolePermissions && rolePermissions.filter(rp => rp.id == pValues.id).length > 0) {
            pValues.isDisabled = true; // disable the checkbox if role has already permission
            pValues.isChecked = true;
            pValues.isTempChecked = true;
          }
          else {
            if (selectedPermissionsArray.length > 0) {
              selectedPermissionsArray.forEach(element => {
                if (pValues.id == element) {
                  isChecked = true;
                }
              });
            }
            pValues.isChecked = isChecked;
            pValues.isDisabled = false;
            pValues.isTempChecked = false;
          }
        });
        //check if all checkbox is checked or not
        if (o.values.filter(pv => pv.isChecked).length == o.values.length)
          o.isAllChecked = true;
        else
          o.isAllChecked = false;
        //check if all disabled checkbox is checked or not
        if (o.values.filter(pv => pv.isTempChecked).length == o.values.length)
          o.isGroupDisabled = true;
        else
          o.isGroupDisabled = false;
        this.mapSearchdataWithPermissions();
      });
    });
    this._commonHelper.hideLoader();
  }
  
  checkChange(event) {
    this._commonHelper.showLoader();
    this.permissions.forEach(groupElement => {
      groupElement.values.forEach(item => {
        let controlItem = event.id.split('-');
        if (item.id == controlItem[1]) {
          item.isChecked = event.checked;
        }
      });
      if (groupElement.values.filter(pv => pv.isChecked).length == groupElement.values.length)
        groupElement.isAllChecked = true;
      else
        groupElement.isAllChecked = false;
    });
    this.mapSearchdataWithPermissions();
    this._commonHelper.hideLoader();
  }

  checkAll(name, event) {
    this._commonHelper.showLoader();
    this.permissions.filter(p => p.name == name).forEach(groupElement => {
      groupElement.values.forEach(item => {
        if (!item.isDisabled)
          item.isChecked = event.checked;
      });
      groupElement.isAllChecked = event.checked;
    });
    this.mapSearchdataWithPermissions();
    this._commonHelper.hideLoader();
  }


  mapSearchdataWithPermissions() {
    this.searchData.map(sd => {
      this.permissions.forEach(p => {
        if (p.name == sd.name) {
          sd.isAllChecked = p.isAllChecked;
          sd.isGroupDisabled = p.isGroupDisabled;
        }
      });
    });
  }

  createPermissionId(permissions) {
    if (permissions.id.length == 0) {
      return "chk-0";
    }
    return "chk-" + permissions.id;
  }

  onSearchPermissions(searchText: string) {
    let filterData = this.permissionsData.filter(x => x.groupName.toLowerCase().includes(searchText.toLowerCase())
      || x.name.toLowerCase().includes(searchText.toLowerCase())
    );

    let permissionsGroupWise = new Set(filterData.map(item => item.groupName));
    this.searchData = [];

    permissionsGroupWise.forEach(g => {
      this.permissions.filter(x => x.name == g).forEach(ele => {
        this.searchData.push({
          name: ele.name,
          isAllChecked: ele.isAllChecked,
          isGroupDisabled: ele.isGroupDisabled,
          values: filterData.filter(i => i.groupName === g)
        });
      });
    });

  }

  getRoles() {
    return new Promise((resolve, reject) =>{
    this._commonHelper.showLoader();
    this._usersService.getRoles().then(response => {
      this.roles = response;
      this._commonHelper.hideLoader();
      resolve(null);
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        reject(null);
      });
  });
}

  getAllTimeZone() {
    this._commonHelper.showLoader();
    this._usersService.getAllTimeZone().then(response => {
      this.timeZoneList = response;
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  inputPhoneMaskValid() {
    this.isPhoneInvalid = this.userForm.get('basicInfoForm')['controls'].phoneMobile.invalid;
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

  onResetUserDetail() {
    if (this.formMode === 'ADD') {
      this.userForm.reset();
      this.removeImage();
      this.userForm.patchValue({
        basicInfoForm: {
          isActive: this.user.isActive,
          id: this.user.id,
        }
      });
    } else if (this.formMode === 'EDIT') {
      this.userForm.reset();
      this.user = this._commonHelper.cloningObject(this.copyOfUser);

      if (this.user.imagePath != null) {
        this._fileSignedUrlService.getSingleFileSignedUrl(Entity.Users, this.user.imagePath).then(res => {
          if (res) {
            this.croppedImage = res;
          } 
        });
      }

      this.userForm.patchValue({
        basicInfoForm: {
          id: this.user.id,
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          userName: this.user.userName,
          email: this.user.email,
          phoneMobile: this.user.phoneMobile,
          roleId: this.selectedRoleIds,
          timezone: this.user.timezone,
          isActive: this.user.isActive,
          imagePath: this.croppedImage,
          imageBase64: this.croppedImage,
          title: this.user.title,
          website: this.user.website,
          linkedInProfile: this.user.linkedInProfile,
          facebookProfile: this.user.facebookProfile,
          twitterProfile: this.user.twitterProfile,
          qualifications: this.user.qualifications,
        }
      });
    }
    this.addCheckboxes();
  }

  removeImage() {
    this.croppedImage = "";
    this.isImageRemove = true;
    this.userForm.controls.basicInfoForm.patchValue({ imagePath: "" });
    this.user.imagePath = "";
  }

  onResetPasswordForm() {
    this.changePasswordForm.reset();
    this.changePasswordForm.patchValue({ userId: this.user.id });
  }

  onBack() {
    this._location.back();
  }

  closeForm() {
    this._router.navigate(['uram/users']);
  }

  onfocusPassword(){
    this.isPasswordStrengthVisible=true;
  }
  
  onblurPassword(){
    this.isPasswordStrengthVisible=false;
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('URAM.USER.' + error.messageCode.replace('.', '_').toUpperCase())
      );
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
        },
        (error) => {
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
}
