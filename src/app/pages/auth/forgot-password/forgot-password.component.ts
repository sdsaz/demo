import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { Router } from '@angular/router';
import { AuthenticationService } from '../auth.service';
import { CommonHelper } from '../../../@core/common-helper';
import { AppSettings } from '../../../@core/AppSettings';

@Component({
    selector     : 'forgot-password',
    templateUrl  : './forgot-password.component.html',
    styleUrls    : ['./forgot-password.component.scss']
})

export class ForgotPasswordComponent extends AppSettings implements OnInit
{
    @ViewChild('userName') userNameRef: ElementRef;
    
    forgotPasswordForm: UntypedFormGroup;
    
    isLoading: boolean = false;
    submitted: boolean = false;
    submittedErrorMsg: string = '';
    submittedSucessMsg: string = '';
    userDetail: any;

    sendResetLinkButtonName = 'FORGOT_PASSWORD_DIALOG.BUTTON_RESET_LINK';

    //Login validation
    forgot_validation_messages = {
        'userName': [
            { type: 'required', message: 'FORGOT_PASSWORD_DIALOG.MESSAGE_USERNAME' }
        ]
    }

    constructor(private _formBuilder: UntypedFormBuilder,
        private _authenticationService: AuthenticationService,
        private _router: Router,
        private _commonHelper: CommonHelper)
    {
        super();
    }

    ngOnInit()
    {
        // set locale language
        this._commonHelper.setLanguage();
        setTimeout(() => {this.userNameRef.nativeElement.focus();});
        
        this.forgotPasswordForm = this._formBuilder.group({
            userName: ['', Validators.required]
        });
    }

    onBackspaceKeydown(ev){
        if(this.forgotPasswordForm.value){
            if(this.forgotPasswordForm.value.length == 0){
                setTimeout(() => {this.userNameRef.nativeElement.focus();});
            }
        }
    }

    onCancel(){
        this._router.navigate(['/auth/login']);
    }

     // convenience getter for easy access to form fields
     get f() { return this.forgotPasswordForm.controls; }

    forgotPassword(isValid) {
        this.submitted = true;
        this.submittedErrorMsg = "";
        this.submittedSucessMsg = "";
        if (!isValid) {
            setTimeout(() => {this.userNameRef.nativeElement.focus();});
            return;
        }
        this.isLoading = true;
        this._commonHelper.showLoader();
        this._authenticationService.forgotPassword(this.forgotPasswordForm.controls.userName.value).then((response) => {
            this.isLoading = false;
            if (response != null) {
                this.userDetail = response;
                this.sendResetLinkButtonName = 'FORGOT_PASSWORD_DIALOG.BUTTON_RESEND_RESET_LINK';
                this.submittedSucessMsg = this._commonHelper.getInstanceTranlationData('FORGOT_PASSWORD_DIALOG.MESSAGE_INSTRUNCTION_RESET_PASSWORD')+this.userDetail.email;
            } else {
                this.submittedErrorMsg = 'FORGOT_PASSWORD_DIALOG.MESSAGE_USERNAME_NOT_EXISTS';
            }
            this._commonHelper.hideLoader();
        },
        (error) => {
            this.isLoading = false;
            this._commonHelper.hideLoader();
            this.submittedErrorMsg = this.getTranslateErrorMessage(error.messageCode);
        });
        this.submitted = false;
    }

    getTranslateErrorMessage(messageCode: string): string {
        return this._commonHelper.getInstanceTranlationData('LOGIN.' + messageCode.replace('.', '_').toUpperCase());
    }
}
