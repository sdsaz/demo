import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonHelper } from '../../../@core/common-helper';

@Component({
  selector: 'ngx-formbuilder',
  templateUrl: './formbuilder.component.html',
  styleUrls: ['./formbuilder.component.scss']
})
export class FormbuilderComponent implements OnInit {
  @ViewChild('json') jsonElement?: ElementRef;
  public form: Object = { components: [] };
  public formJson: any;

  isSubmitted: boolean = false;
  guid: any;

  showHideFormBuilder: boolean = false;

  constructor(private _router: Router,
    private commonHelper: CommonHelper,
    public _httpClient: HttpClient) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.commonHelper.showLoader();
    this._httpClient.get("/assets/wizard-default.json")
    .subscribe(data => {
      this.form = data;
      this.formJson = JSON.stringify(this.form, null, 4);
      this.showHideFormBuilder = true;
      this.commonHelper.hideLoader();
    });
    this.showHideFormBuilder = true;
  }

  changeFormType(event) {
    this.commonHelper.showLoader();
    this.showHideFormBuilder = false;
    if (event.target.value == "wizard") {
      this._httpClient.get("/assets/wizard-default.json")
        .subscribe(data => {
          this.form = data;
          this.formJson = JSON.stringify(this.form, null, 4);
          this.showHideFormBuilder = true;
          this.commonHelper.hideLoader();
        });
    }
    else {
      this._httpClient.get("/assets/spa-default.json")
        .subscribe(data => {
          this.form = data;
          this.formJson = JSON.stringify(this.form, null, 4);
          this.showHideFormBuilder = true;
          this.commonHelper.hideLoader();
        });
    }
  }

  onChangeFormBuilder(event) {
    this.formJson = JSON.stringify(event.form, null, 4);
    this.jsonElement.nativeElement.innerHTML = '';
    this.jsonElement.nativeElement.appendChild(document.createTextNode(JSON.stringify(event.form, null, 4)));
  }

  onFormJsonChange(event) {
    this.form = this.commonHelper.tryParseJson(event.target.value);
  }

  onSaveSchema() {
    this.isSubmitted = true;
    // generate guid and store it in the local storage
    this.guid = this.generateGUID();
    this.commonHelper.setLocalStorageEncryptData(this.guid, this.formJson);
  }

  onRenderForm() {
    // save changes
    this.commonHelper.setLocalStorageEncryptData(this.guid, this.formJson);
    // get guid and pass it to form renderer
    this._router.navigate([]).then(result => { window.open('dynamicform/formrenderer/' + this.guid, '_blank'); });
  }

  generateGUID() {
    let u = Date.now().toString(16) + Math.random().toString(16) + '0'.repeat(16);
    let guid = [u.substr(0, 8), u.substr(8, 4), '4000-8' + u.substr(13, 3), u.substr(16, 12)].join('-');
    return guid;
  }
}
