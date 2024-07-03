import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DatasourceService } from '../../../sharedServices/datasource.service';
import { DataSources } from '../../../enum';
import { CommonHelper } from '../../../common-helper';

@Component({
  selector: 'ngx-entity-stages-dialog',
  templateUrl: './entity-stages-dialog.component.html',
  styleUrls: ['./entity-stages-dialog.component.scss']
})
export class EntityStagesDialogComponent implements OnInit {
  /**
   * Assigned user id
   * If Assigned 
   */
  @Input() entityStageId: number;
  /**
   * Assignable User List
   */
  @Input() entityStages: any = [];

  //#region Dialog Translation Related Properties
  /**
   * For the dialog title
   */
  @Input() dialogTitle: string = '';
  /**
   * For User dropdown label
   */
  @Input() entityStageSelectLabel: string = '';
  /**
   * For User dropdown placeholder
   */
  @Input() entityStageSelectPlaceholder: string = '';
  /**
   * For reason label
   */
   @Input() entityStageChangeSelectReasonLabel: string = '';
  @Input() entityStageChangeReasonLabel: string = '';
  /**
   * For reason placeholder
   */
  @Input() entityStageChangeReasonPlaceholder: string = '';
  @Input() entityWorkflowId: number;
  @Input() dropWorkTaskStageId: number;
  //#endregion

  /**
   It will give call back to the parent component on change of Entity Stage
   with new Entity Stage or Selected Id as callback result
   */
  @Output() OnChangeEntityStage: EventEmitter<any> = new EventEmitter();

  entityStageChangeReason: string;
  isNoteRequired: boolean = false;
  isDescriptionShow: boolean = false;
  stagereasons: any;
  selectedStageId: number;
  //save flag
  submitted = false;

  entityStageFormGroup: UntypedFormGroup;
  constructor(private _ngbActiveModal: NgbActiveModal, private fb: UntypedFormBuilder,
    private _dataSourceService: DatasourceService,
    private _commonHelper: CommonHelper) {
   }

  ngOnInit(): void {
    this.entityStageFormGroup = this.fb.group({
      entityStageId: [this.entityStageId && this.entityStageId > 0 ? this.entityStageId : undefined, [Validators.required]],
      stageReason: [this.fb.control["stageReason"]],
      entityStageChangeReason: [this.entityStageChangeReason],
    });
  }
  bindStageReasons() {
    return new Promise((resolve, reject) =>{
    this._commonHelper.showLoader();
    let params = this.prepareParamsForStageReasons();
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ENTITYSTAGEREASONS, params).then((response: any) => {
      if (response.length>0) {
        this.stagereasons = response;
        this.stagereasons.push({ label: this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.OTHER_REASON') });
      }   
      this._commonHelper.hideLoader();
      resolve(null);
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
        reject(null);
      }
    );
    });
  }
  prepareParamsForStageReasons() {
    const params = [];
    const paramItem = {
      name: 'EntityWorkflowId',
      type: 'int',
      value: this.entityWorkflowId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'StageId',
      type: 'int',
      value: this.selectedStageId
    };
    params.push(paramItem1);

    return params;
  }
  showHideDescription(formData){
    let other = this._commonHelper.getInstanceTranlationData('ACTIVITY.REASON_DIALOG.OTHER_REASON');
    if (formData.stageReason.label === other) {
      this.isDescriptionShow = true;
      this.entityStageFormGroup.get('entityStageChangeReason').setValidators([Validators.required]);
      this.entityStageFormGroup.get('entityStageChangeReason').updateValueAndValidity();
    }
    else
      {
        this.isDescriptionShow = false;
        this.entityStageFormGroup.get('entityStageChangeReason').clearValidators();
        this.entityStageFormGroup.get('entityStageChangeReason').updateValueAndValidity();
      }
  }
  onChangeEntityStage() {
    this.submitted = true;
    if (this.entityStageFormGroup.invalid) {
      this.validateAllFormFields(this.entityStageFormGroup);
      return;
    }

    this.OnChangeEntityStage.emit(this.entityStageFormGroup.value);
  }

  checkNoteIsRequired(formdata) {
    this.isDescriptionShow = false;
    this.entityStageFormGroup.get('entityStageChangeReason').clearValidators();
    this.entityStageFormGroup.get('entityStageChangeReason').updateValueAndValidity();
    let stage = this.entityStages.find(s => s.value == formdata.entityStageId);
    if (stage.isNoteRequired) {
      this.isNoteRequired = true;
      this.selectedStageId = formdata.entityStageId;
      Promise.all([
        this.bindStageReasons(),
      ]).then(() => {
      if (this.stagereasons!=undefined && this.stagereasons.length>0) {
        this.entityStageFormGroup.get('stageReason').setValidators([Validators.required]);
        this.entityStageFormGroup.get('stageReason').updateValueAndValidity();
      }
      else if(this.stagereasons == undefined || this.stagereasons == null)
      {
        this.isDescriptionShow = true;
      this.entityStageFormGroup.get('entityStageChangeReason').setValidators([Validators.required]);
      this.entityStageFormGroup.get('entityStageChangeReason').updateValueAndValidity();
      }
    });
  }
    else {
      this.stagereasons = null;
      this.entityStageFormGroup.controls.stageReason.reset();
      this.entityStageFormGroup.get('stageReason').clearValidators();
      this.entityStageFormGroup.get('stageReason').updateValueAndValidity();
      this.isNoteRequired = false;
      this.isDescriptionShow = false;
      this.entityStageFormGroup.get('entityStageChangeReason').clearValidators();
        this.entityStageFormGroup.get('entityStageChangeReason').updateValueAndValidity();
    }
  }

  get f() { return this.entityStageFormGroup.controls; }
  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('WORKTASK.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }
  validateAllFormFields(formGroup: UntypedFormGroup): void {
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

  public onCloseForm() {
    this._ngbActiveModal.close();
  }
}
