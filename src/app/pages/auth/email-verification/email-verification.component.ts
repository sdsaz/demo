import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../auth.service';
import { CommonHelper } from '../../../@core/common-helper';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ngx-email-verification',
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.scss']
})
export class EmailVerificationComponent implements OnInit {

  isSuccess: boolean;
  isLoading: boolean;
  errorMessage: string;

  constructor(private _authenticationService: AuthenticationService,
    private _commonHelper: CommonHelper,
    private _activatedRoute: ActivatedRoute) {

  }

  ngOnInit(): void {
    this._activatedRoute.queryParams.subscribe(params => {
      this.verifyEmail(params['h']);
    });
  }

  verifyEmail(emailVerifyHash): void {
    this.isLoading = true;
    this._authenticationService.verifyEmail(emailVerifyHash).then((response) => {
      if (response) {
        this.isLoading = false;
        this.isSuccess = true;            
      }
    },
      (error) => {
        this.isLoading = false;            
        this.errorMessage = error.message;
      });
  }

}
