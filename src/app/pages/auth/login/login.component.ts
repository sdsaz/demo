import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SettingsService } from '../../settings/settings.service';

import { Entity, LocalStorageKey } from '../../../@core/enum';

import { AuthenticationService } from '../auth.service'
import { UserLoginModel, SingleSignOnModel } from '../../usermanagement/users/user.model';
import { CommonHelper } from '../../../@core/common-helper';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PrivacyPolicyComponent } from '../../../@core/sharedModules/privacy-policy/privacy-policy.component';
import { ProfileService } from '../../usermanagement/profile/profile.service';
import { ProfileChangePassword } from '../../usermanagement/profile/profile.model';
import { MustMatch, MustNotMatch } from '../../../@core/match-password.validator';
import { AppSettings } from '../../../@core/AppSettings';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { DocumentService } from '../../../@core/sharedComponents/documents/document.service';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';

@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    encapsulation: ViewEncapsulation.None,
})

export class LoginComponent extends AppSettings implements OnInit {

    //For Model Ref
    modalRef: NgbModalRef | null;

    @ViewChild('userName') userNameRef: ElementRef;

    loginForm: UntypedFormGroup;
    changePasswordForm: UntypedFormGroup;
    userLoginModel = new UserLoginModel();
    singleSignOnModel = new SingleSignOnModel();

    submitted: boolean = false;
    submittedErrorMsg: string = '';

    //all popup dialog open option settings
    optionsForPopupDialog: any = {
        size: "xl",
        centered: false,
        backdrop: 'static',
        keyboard: false
    };

    //Login validation
    login_validation_messages = {
        'userName': [
            { type: 'required', message: 'LOGIN.MESSAGE_USERNAME' }
        ],
        'password': [
            { type: 'required', message: 'LOGIN.MESSAGE_PASSWORD' }
        ]
    }

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
    }

    returnUrl: string;

    // change password on first login succcessful attemp
    isFirstTimeLogin: boolean = false;
    isMultiTenentLogin: boolean = false;
    multiTenentLoginResponceHolder: boolean = false;
    profileChangePassword: ProfileChangePassword;
    passwordSubmitted: boolean = false;
    userId: any = 0;

    //data sources
    tenantDataSource: any = null;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _activeRoute: ActivatedRoute,
        private _router: Router,
        private _authenticationService: AuthenticationService,
        private _profileService: ProfileService,
        private _modalService: NgbModal,
        public _commonHelper: CommonHelper,
        private _commonService: CommonService,
        private _documentService: DocumentService,
        private _settingsService: SettingsService,
        private _fileSignedUrlService: FileSignedUrlService
    ) {
        super();
        this.profileChangePassword = new ProfileChangePassword();
        this.profileChangePassword.oldPassword = '';
        this.profileChangePassword.newPassword = '';
        this.profileChangePassword.confirmPassword = '';
    }

    ngOnInit(): void {
        this.clearLocalStorage();
        this._commonHelper.assignedEntityCounts = null;
        
        // get return url from route parameters or default to '/'
        this.returnUrl = this._activeRoute.snapshot.queryParams['returnUrl'] || '/';
        // set locale language
        this._commonHelper.setLanguage();
        
        setTimeout(() => { this.userNameRef.nativeElement.focus(); });
        this.crateLoginForm();
    }

    clearLocalStorage() {
        //clear local storage - all keys
        this._commonHelper.clearAllLocalStorageData();
    }

    // convenience getter for easy access to form fields
    get f() { return this.loginForm.controls; }

    crateLoginForm() {
        this.loginForm = this._formBuilder.group({
            userName: ['', Validators.compose([Validators.required])],
            password: ['', Validators.required]
        });
    }

    login(isValid) {
        this.submitted = true;
        this.submittedErrorMsg = '';

        if (!isValid) {
            return;
        }

        this._commonHelper.showLoader();
        this._authenticationService.login(this.loginForm.value).then((response: any) => {
            this._commonHelper.updateLanguage('en');
            this._commonHelper.setLoaderHide();

            //set logged user detail
            this.setLoggedUserDetail(response);

            //Hold the responce value to use it later after first time password reset
            this.multiTenentLoginResponceHolder = response.isUserHaveMultipleTenant
            this.tenantDataSource = response.userTenants;

            //get all the active web accessible reference types once user login success
            this.getAllWebAccessibleReferenceTypes();
            Promise.all([
                this.getS3BucketURL(),
                this.getEntityTypes(),
                this.getS3BucketURLForUser(),
                this.getS3BucketURLForTenants()
            ]).then(() => {
                // check if the user is logged in for the first time, then ask to change password
                if (response.isFirstTimeLogin) {
                    //set user id for password change
                    this.userId = response.userId;
                    //set password as old password
                    this.profileChangePassword.oldPassword = this.loginForm.controls.password.value;
                    //create form
                    this.createChangePasswordForm();
                    //display form
                    this.isMultiTenentLogin = false;
                    this.isFirstTimeLogin = true;
                }
                else if (response.isUserHaveMultipleTenant) {
                    this.userId = response.userId;
                    this.isFirstTimeLogin = false;
                    this.isMultiTenentLogin = true;
                    this._fileSignedUrlService.getFileSingedUrl(this.tenantDataSource,'imagePath','imagePathSignedUrl', 0);
                }
                else {
                    //Get all web accessible public tenant setting value
                    this.getAllWebAccessibleTenantSettingsWithValue();
                    this.getAllWebAccessibleUserTenantSettingsWithValue();
                    this.getEntityHiddenFieldSettings();
                    // login successful so redirect to return url
                    this._router.navigateByUrl(this.returnUrl);
                }
            });
        }, (error) => {
            this._commonHelper.setLoaderHide();
            this.submittedErrorMsg = this.getTranslateErrorMessage(error.messageCode);
        });
        this.submitted = false;
    }

    setLoggedUserDetail(userDetails) {
        //set logged user detail
        this._commonHelper.setLoggedUserDetail(userDetails);
        //set logged user session token in local storage
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.LoginUserSessionToken, userDetails.accessToken);
    }

    //Set tenant local storage
    getAllWebAccessibleTenantSettingsWithValue() {
        this._commonHelper.showLoader();
        //getAllTenantSettingsWithValue API
        this._settingsService.getAllWebAccessibleTenantSettingsWithValue().then((response: any) => {
            this._commonHelper.setTenantSettingInLocalStorage(response);
            this._commonHelper.hideLoader();
        }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error.messageCode);
        });
    }

    //Set user tenant local storage
    getAllWebAccessibleUserTenantSettingsWithValue() {
        this._commonHelper.showLoader();
        //getAllTenantSettingsWithValue API
        this._settingsService.getAllWebAccessibleUserTenantSettingsWithValue().then((response: any) => {
            this._commonHelper.setUserTenantSettingInLocalStorage(response);
            this._commonHelper.hideLoader();
        }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error.messageCode);
        });
    }

    getAllWebAccessibleReferenceTypes() {
        this._commonHelper.showLoader();
        this._commonService.getAllWebAccessibleReferenceTypes().then((responseRefTypesData: any) => {
            this._commonHelper.hideLoader();
            this._commonHelper.setReferenceTypeInLocalStorage(responseRefTypesData);
        }, (error) => {
            this._commonHelper.hideLoader();
        });
    }

    getEntityHiddenFieldSettings() {
        this._commonHelper.showLoader();
        let storageKey = LocalStorageKey.AllEntityHiddenFieldSettings;

        this._commonService.getEntityHiddenFields().then((response: any) => {
            this._commonHelper.hideLoader();
            if (response && response !== null && response !== undefined) {
                this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(response));
            }
        }, (error: any) => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(error);
        })
    }

    openPrivacyPolicy() {
        this.modalRef = this._modalService.open(PrivacyPolicyComponent, this.optionsForPopupDialog);
    }

    getTranslateErrorMessage(messageCode: string): string {
        if (messageCode) {
            return this._commonHelper.getInstanceTranlationData('LOGIN.' + messageCode.replace('.', '_').toUpperCase());
        }
        else {

            return this._commonHelper.getInstanceTranlationData('LOGIN.USERS_UNKNOWNERROR');
        }
    }

    createChangePasswordForm() {
        this.changePasswordForm = null;
        this.changePasswordForm = this._formBuilder.group({
            id: [this.userId],
            oldPassword: [this.profileChangePassword.oldPassword, Validators.compose([Validators.required])],
            newPassword: [this.profileChangePassword.newPassword, Validators.compose([Validators.required, Validators.pattern(this._commonHelper.passwordPattern)])],
            confirmPassword: [this.profileChangePassword.confirmPassword, Validators.compose([Validators.required])]
        }, {
            validator: [MustNotMatch('oldPassword', 'newPassword'), MustMatch('newPassword', 'confirmPassword')]
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

            if (this.multiTenentLoginResponceHolder) {
                this.isFirstTimeLogin = false;
                this.isMultiTenentLogin = true;
            }
            else {
                // login successful so redirect to return url
                this._router.navigateByUrl(this.returnUrl);
            }
        },
            (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error.messageCode);
            });
        this.passwordSubmitted = true;
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

    onResetPasswordForm() {
        this.changePasswordForm.reset();
        this.changePasswordForm.patchValue({ id: this.userId });
        this.changePasswordForm.patchValue({ oldPassword: this.loginForm.controls.password.value });
    }

    getS3BucketURLForUser() {
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
                        this.getTranslateErrorMessage(error.messageCode);
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

    getS3BucketURLForTenants() {
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
                        this.getTranslateErrorMessage(error.messageCode);
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

    onTenantCardClick(tenantID) {
        let accesstoken = this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.LoginUserSessionToken);
        this._commonHelper.showLoader();
        this._authenticationService.switchUserLoginTenant(tenantID, accesstoken).then((response: any) => {
            this._commonHelper.hideLoader();
            this.setLoggedUserDetail(response);
            
            //Get all web accessible public tenant setting value
            this.getAllWebAccessibleTenantSettingsWithValue();
            this.getAllWebAccessibleUserTenantSettingsWithValue();
            this.getEntityHiddenFieldSettings();
            
            this._commonService.getEntityTypes().then(obj => {
                this._commonHelper.hideLoader();
                // login successful so redirect to return url
                this._router.navigateByUrl(this.returnUrl);
            });
        },
            (error) => {
                this._commonHelper.hideLoader();
                this.getTranslateErrorMessage(error.messageCode);
            });
    }

    private getEntityTypes() {
        return new Promise((resolve, reject) => {
            this._commonHelper.showLoader();
            this._commonService.getEntityTypes().then((obj: any[]) => {
                this._commonHelper.hideLoader();
                if (obj) {
                    this._commonHelper.entityTypeList = obj;
                    resolve(obj);
                }
                resolve(null);
            }, err => {
                this._commonHelper.hideLoader();
                reject(null)
            });
        });
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
                        this.getTranslateErrorMessage(error.messageCode);
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