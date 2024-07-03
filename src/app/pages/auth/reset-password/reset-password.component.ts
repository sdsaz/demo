import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthenticationService } from '../auth.service';
import { MustMatch } from '../../../@core/match-password.validator';
import { CommonHelper } from '../../../@core/common-helper';
import { UserLoginModel } from '../../usermanagement/users/user.model';


@Component({
    selector: 'reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
    @ViewChild('password') passwordRef: ElementRef;

    resetPasswordForm: UntypedFormGroup;
    isValidUser: boolean;

    isLoading: boolean = false;
    submitted: boolean = false;
    submittedErrorMsg: string = '';
    submittedSucessMsg: string = '';
    userName: string='';
    isPasswordReset: boolean = true;

    //for login
    userLoginModel: UserLoginModel;

    //password strength
    isPasswordStrengthVisible: boolean = false;

    resetPassword_validation_messages = {
        'password': [
            { type: 'required', message: 'RESET_PASSWORD_DIALOG.MESSAGE_NEW_PASSWORD_REQUIRED' },
            { type: 'pattern', message: this._commonHelper.passwordPatternMessage }
        ],
        'passwordConfirm': [
            { type: 'required', message: 'RESET_PASSWORD_DIALOG.MESSAGE_CONFIRM_PASSWORD_REQUIRED' }
        ]
    }

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _authenticationService: AuthenticationService,
        private _activatedRoute: ActivatedRoute,
        private _commonHelper: CommonHelper,
        private _router: Router,
        public _renderer: Renderer2) {
        this.isValidUser = false;
    }

    ngOnInit() {
        this._commonHelper.setLanguage();
        setTimeout(() => { if(this.passwordRef != undefined) this.passwordRef.nativeElement.focus(); });

        this.buildForm();
        this._activatedRoute.queryParams.subscribe(params => {
            this.checkPasswodRestHashValid(params['h']);
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.resetPasswordForm.controls; }

    buildForm(): void {
        this.resetPasswordForm = this._formBuilder.group({
            password: ['', Validators.compose([Validators.required, Validators.pattern(this._commonHelper.passwordPattern)])],
            passwordConfirm: ['', [Validators.required]],
            passwordResetHash: ['']
        }, {
            validator: MustMatch('password', 'passwordConfirm')
        });
    }

    checkPasswodRestHashValid(passwordResetHash): void {
        this.isLoading = true;
        this._commonHelper.showLoader();
        this._authenticationService.getUserDetailByPasswordResetHash(passwordResetHash).then((response) => {
            if (response) {
                this.isLoading = false;
                this.userName = response['userName'];
                if (response['passwordResetHash'] != null) {
                    this.resetPasswordForm.controls.passwordResetHash.setValue(response['passwordResetHash']);
                }
                this.isValidUser = true;
            }
            this._commonHelper.hideLoader();
        },
            (error) => {
                this.isLoading = false;
                this._commonHelper.hideLoader();
                this.submittedErrorMsg = error.error.message;
            });
    }

    resetPassword(isValid): void {
        this.submitted = true;
        this.submittedErrorMsg = '';
        this.submittedSucessMsg = '';

        if (!isValid) {
            this.validateAllFormFields(this.resetPasswordForm);
            return;
        }
        this.isLoading = true;

        let params = this.resetPasswordForm.value;

        this._commonHelper.showLoader();
        this._authenticationService.resetPassword(params).then((response) => {
            this._commonHelper.hideLoader();
            this.isLoading = false;
            if (response != null) {     
                this.isPasswordReset = false;           
                this.submittedSucessMsg = 'RESET_PASSWORD_DIALOG.MESSAGE_PASSWORD_RESET';
                
            }
        },
            (error) => {
                this._commonHelper.hideLoader();
                this.isLoading = false;
                this.submittedErrorMsg = error.message;
            });
    }

    onfocusPassword(){
        this.isPasswordStrengthVisible=true;
      }
      
      onblurPassword(){
        this.isPasswordStrengthVisible=false;
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

}