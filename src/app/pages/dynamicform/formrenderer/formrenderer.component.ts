import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonHelper } from '../../../@core/common-helper';

@Component({
  selector: 'ngx-formrenderer',
  templateUrl: './formrenderer.component.html',
  styleUrls: ['./formrenderer.component.scss']
})
export class FormrendererComponent implements OnInit {
  @ViewChild('json') jsonElement?: ElementRef;
  public formJson: any;
  public formData: any;
  formGuid: any;
  isLoaded: boolean = false;

  constructor(private _activeRoute: ActivatedRoute,
    private _router: Router,
    private commonHelper: CommonHelper) {
    this._router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
    //get dashboard id
    this._activeRoute.params.subscribe(param => {
      if (param['guid'] != undefined) {
        if (param['guid'] != null) {
          this.formGuid = param['guid'];
          // get data using guid
          this.formJson = this.commonHelper.tryParseJson(this.commonHelper.getLocalStorageDecryptData(this.formGuid));
          this.isLoaded = true;
        }
      }
    });
  }

  ngOnInit(): void {
  }

  onSubmitForm(event) {
    this.formData = event.data;
    this.jsonElement.nativeElement.innerHTML = '';
    this.jsonElement.nativeElement.appendChild(document.createTextNode(JSON.stringify(this.formData, null, 4)));
  }
}
