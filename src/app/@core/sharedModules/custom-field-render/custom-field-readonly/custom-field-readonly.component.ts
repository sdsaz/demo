import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../common-helper';
import { CommonService } from '../../../sharedServices/common.service';

@Component({
  selector: 'ngx-custom-field-readonly',
  templateUrl: './custom-field-readonly.component.html',
  styleUrls: ['./custom-field-readonly.component.scss']
})
export class CustomFieldReadOnlyComponent implements OnInit {

  @Input() entityTypeId: number;
  @Input() entityRecordTypeId: number;
  @Input() entityId: number;

  customFieldsJson: any;
  customFields: any[] = [];

  isLoaded: boolean = false;
  
  constructor(private _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _ngbActiveModal: NgbActiveModal) { }

  ngOnInit(): void {
    //get work task custom fields
    this.getCustomFields();
  }

  getCustomFields() {
    this._commonHelper.showLoader();
    let params = {
      entityTypeId: this.entityTypeId,
      entityRecordTypeId: this.entityRecordTypeId,
      entityId: this.entityId
    };
    
    this._commonService.getCustomFieldsForList(params).then((response: any) => {
      if (response.length > 0) {
        this.customFieldsJson = response[0].customFieldsJson;
        //custom fields
        let customFieldsJson = this._commonHelper.tryParseJson(this.customFieldsJson);
        if (customFieldsJson.length > 0) {
          this.customFieldsJson = customFieldsJson[0];
          Object.keys(this.customFieldsJson).forEach(property => {
            this.customFields.push(property)
          });
        }
        this.isLoaded = true;
      }
      this._commonHelper.hideLoader();
    }, (error) => {
      this._commonHelper.hideLoader();
    });
  }

  //for close form
  public onCloseForm() {
    this._ngbActiveModal.close();
  }
}
