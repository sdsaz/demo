import { Component, OnInit, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { AuthenticationService } from '../auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MustMatch } from '../../../@core/match-password.validator';
import { CommonHelper } from '../../../@core/common-helper';

@Component({
  selector: 'app-user-activation',
  templateUrl: './user-activation.component.html',
  styleUrls: ['./user-activation.component.scss']
})
export class UserActivationComponent implements OnInit {

  //@ViewChild('password', { static: false }) passwordRef: ElementRef;

  userActivationForm: UntypedFormGroup;
  isValidUser: boolean;

  isLoading: boolean = false;
  submitted: boolean = false;

  submittedErrorMsg: string = '';
  submittedSucessMsg: string = '';

  resetPassword_validation_messages = {
    'password': [
      { type: 'required', message: 'Password is required' },
      { type: 'minlength', message: 'Password must be at least 6 characters long' },
      { type: 'maxlength', message: 'Password cannot be more than 20 characters long' },
    ],
    'passwordConfirm': [
      { type: 'required', message: 'Confirm password is required' }
    ]
  }

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private _authenticationService: AuthenticationService,
    private _activatedRoute: ActivatedRoute,
    public _renderer: Renderer2,
    private _router: Router,
    private _commonHelper: CommonHelper) {
    this.isValidUser = false;
  }

  ngOnInit() {
   
    // if(this.passwordRef.nativeElement != undefined){
    //   setTimeout(() => { this.passwordRef.nativeElement.focus(); });
    // }
    this._activatedRoute.queryParams.subscribe(params => {
      this.createUserActivationForm();
      this.checkGuidIdValid(params['d']);
    });


  }

  // convenience getter for easy access to form fields
  get f() { return this.userActivationForm.controls; }
  createUserActivationForm() {
    this.userActivationForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(20)])],
      passwordConfirm: ['', [Validators.required]],
      activationHash: ['']
    }, {
      validator: MustMatch('password', 'passwordConfirm')
    });
  }

  checkGuidIdValid(activationHash): void {
    this.isLoading = true;    
    this._commonHelper.showLoader();
    this._authenticationService.getUserByActivationHash(activationHash).then((response) => {      
      if (response) {
        if (response['email'] != null) {
          this.userActivationForm.patchValue({ email: response['email'] });
        }
        if (response['activationHash'] != null) {
          this.userActivationForm.patchValue({ activationHash: response['activationHash'] });
        }        
        this.isValidUser = true;        
      }
      this._commonHelper.hideLoader();
      this.isLoading = false;
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.isLoading = false;
        this.submittedErrorMsg = error.error.message;
      });
  }

  saveUserActivation(isValid): void {
    this.submitted = true;
    this.submittedErrorMsg = '';
    this.submittedSucessMsg = '';

    if (!isValid) {
      return;
    }
    this.isLoading = true;
    this._commonHelper.showLoader();
    this._authenticationService.updateUserVerification(this.userActivationForm.value).then((response) => {
      this.isLoading = false;
      this._commonHelper.hideLoader();
      if (response) {
        this._commonHelper.showToastrSuccess("Your Password has been set successfully.");
        //navigate to login
        this._router.navigate(['/auth/login']);
      }
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.isLoading = false;
        this.submittedErrorMsg = error.error.message;
      });
  }
}