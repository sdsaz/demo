import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../../@core/common-helper';
import { UsersService } from '../users.service';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MustMatch } from '../../../../@core/match-password.validator';

@Component({
  selector: 'app-user-reset-password-dialog',
  templateUrl: './user-reset-password-dialog.component.html',
  styleUrls: ['./user-reset-password-dialog.component.scss']
})
export class UserResetPasswordDialogComponent implements OnInit {

  //user id
  userId: number = 0;

  //loading flag
  isLoading: boolean = false;
  submitted: boolean = false;

  //password strength
  isPasswordStrengthVisible: boolean = false;

  //reset password model
  resetPasswordModel = {
    id: 0,
    name: '',
    email: '',
    password: null,
    confirmPassword: null
  }

  user_validation_messages = {
    'password': [
      { type: 'required', message: 'URAM.USER.USER_RESET_PASSWORD_DIALOG.MESSAGE_PASSWORD' },
      { type: 'pattern', message: this._commonHelper.passwordPatternMessage },
    ],
    'confirmPassword': [
      { type: 'required', message: 'URAM.USER.USER_RESET_PASSWORD_DIALOG.MESSAGE_CONFIRM_PASSWORD' }
    ]
  }

  constructor(private _ngbActiveModal: NgbActiveModal,
    private _usersService: UsersService,
    public _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
  ) { }

  ngOnInit() {
    if (this.userId == 0) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('URAM.USER.USER_RESET_PASSWORD_DIALOG.MESSAGE_USER_NOT_EXIST')
      );
      this.onCloseForm();
    } else {
      this.getUserDetail();
    }
  }

  getUserDetail() {
    this.isLoading = true;
    this._commonHelper.showLoader();
    this._usersService.getUserById(this.userId).then(response => {
      if (response != null) {
        this.resetPasswordModel.id = response['id'];
        this.resetPasswordModel.name = response['name'];
        this.resetPasswordModel.email = response['email'];
      }
      this._commonHelper.hideLoader();
      this.isLoading = false;
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }
  createResetPasswordForm() {
    return this._formBuilder.group({
      id: [this.resetPasswordModel.id],
      name: [this.resetPasswordModel.name],
      email: [this.resetPasswordModel.name],
      password: [this.resetPasswordModel.password, Validators.compose([Validators.required, Validators.pattern(this._commonHelper.passwordPattern)])],
      confirmPassword: [this.resetPasswordModel.confirmPassword, Validators.compose([Validators.required])]
    }, {
      validator: MustMatch('password', 'confirmPassword')
    });
  }

  onSubmitResetPassword() {
    this.submitted = true;
    if (this.resetPasswordModel.password == '') {
      return;
    }
    if (this.resetPasswordModel.confirmPassword == '') {
      return;
    }
    if (this.resetPasswordModel.password != this.resetPasswordModel.confirmPassword) {
      return;
    }
    if ((this.resetPasswordModel.password === this.resetPasswordModel.confirmPassword) && this.resetPasswordModel?.password?.length >= 6) {
      let resetPassword = this.createResetPasswordForm();
      if (resetPassword.invalid) {
        this._commonHelper.validateAllFormFields(resetPassword);
        return;
      }
      let params = {
        Id: this.resetPasswordModel.id,
        email: this.resetPasswordModel.email,
        password: this.resetPasswordModel.password,
      };

      this._commonHelper.showLoader();
      this._usersService.resetPasswordByAdmin(params).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('URAM.USER.USER_RESET_PASSWORD_DIALOG.MESSAGE_USER_PASSWORD_RESET')
        );
        this._ngbActiveModal.close(response);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
  }

  //for close form
  public onCloseForm() {
    this._ngbActiveModal.close();
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

}
