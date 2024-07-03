import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../@core/common-helper';
import { DataSources, ReferenceType, RefType } from '../../../@core/enum';
import { Validators, UntypedFormBuilder, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { DatasourceService } from '../../../@core/sharedServices/datasource.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { Dropdown } from 'primeng/dropdown';
import { WorkTasksService } from '../worktasks.service';

@Component({
  selector: 'ngx-link-work-task-dialog',
  templateUrl: './link-work-task-dialog.component.html',
  styleUrls: ['./link-work-task-dialog.component.scss']
})
export class LinkWorkTaskDialogComponent implements OnInit {

  @ViewChild('workTasksDropdown', { static: false }) workTasksDropdownRef: Dropdown;

  @Input() title: string;
  @Input() id: number = 0;
  @Input() workTaskId: number;
  @Input() entityWorkFlowId: any;
  @Input() relatedTo: any;
  @Input() relationTypeId: number;
  @Input() isEdit: boolean = false;

  form: UntypedFormGroup;
  copyOfFormValue:any;

  submitted = false;

  relationTypes: any[] = [];
  workTasks: any[] = [];
  
  relatedWorkTask: any;

  validation_messages = {
    'relationTypeId': [
      { type: 'required', message: 'WORKTASK.DETAIL.LINKED_WORK_TASKS_TAB.RELATION_TYPE_REQUIRED' }
    ],
    'relatedTo': [
      { type: 'required', message: 'WORKTASK.DETAIL.LINKED_WORK_TASKS_TAB.RELATED_WORKTASK_REQUIRED' }
    ]
  }

  constructor(private _ngbActiveModal: NgbActiveModal,
    private _commonHelper: CommonHelper,
    private _formBuilder: UntypedFormBuilder,
    private _dataSourceService: DatasourceService,
    private _commonService: CommonService,
    private _workTasksService: WorkTasksService) { }

  ngOnInit(): void {
    this.createForm();
    Promise.all([
      this.getWorkTaskRelationTypeFromReferenceType(),
      this.getWorkTaskPromise()
    ]).then(() => {
      this._commonHelper.hideLoader();
    });
  }

  createForm() {
    this.form = this._formBuilder.group({
      id: this.id,
      workTaskId: +this.workTaskId,
      relationTypeId: [this.relationTypeId, Validators.compose([Validators.required])],
      relatedTo: [this.relatedTo, Validators.compose([Validators.required])],
      entityWorkFlowId: this.entityWorkFlowId ? +this.entityWorkFlowId : null
    });
    this.copyOfFormValue = this.form.value;
  }

  get f() { return this.form.controls; }

  //for close form
  onCloseForm(status: boolean) {
    this._ngbActiveModal.close(status);
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('WORKTASK.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
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

  getWorkTaskRelationTypeFromReferenceType() {
    return new Promise((resolve, reject) => {
      let params = { refType: RefType.WorkTaskRelationType };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.WorkTaskRelationType}`;
      // get data
      const refTypeWorkTaskRelationType = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeWorkTaskRelationType == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.relationTypes = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.relationTypes));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            reject(null);
          });
      }
      else {
        this.relationTypes = refTypeWorkTaskRelationType;
        resolve(null);
      }
    });
  }


  prepareParamsForWorkTasksDropdown(searchString: any) {
    const params = [];
    const paramItem = {
      name: 'WorkTaskID',
      type: 'int',
      value: this.workTaskId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'SelectedEntityID',
      type: 'int',
      value: this.relatedTo,
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem2);

    return params;
  }

  getWorkTaskPromise() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();

      let params = this.prepareParamsForWorkTasksDropdown('');

      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.AVAILABLEWORKTASKSFORLINK, params).then((response: any) => {
        this.workTasks = response as any[];
        this._commonHelper.hideLoader();
        resolve(null);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrError(error.message);
          //this.getTranslateErrorMessage(error);
          reject(null);
        });

    });
  }

  private getWorkTasks(searchString: any) {
    let params = this.prepareParamsForWorkTasksDropdown(searchString);
    this._commonHelper.showLoader();
    // get datasource details
    
    this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.AVAILABLEWORKTASKSFORLINK, params).then((response: any) => {
      this.workTasks = response as any[];
      this._commonHelper.hideLoader();
    },
      (error) => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrError(error.message);
      });
  }

  onFilterWorkTasks(e) {
    if (e.filter != null) {
      if (e.filter.trim().length > 2) {
        this.getWorkTasks(e.filter.trim());
      }
    }
    else {
      this.getWorkTasks('');
    }
  }

  onChangeWorkTask(e) {
    this.workTasksDropdownRef.resetFilter();
  }

  linkWorkTask(formData) {
    this.submitted = true;

    if (this.form.invalid) {
      this.validateAllFormFields(this.form);
      return;
    }

    if(JSON.stringify(this.copyOfFormValue) == JSON.stringify(formData)){
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.LINKED_WORK_TASKS_TAB.MESSAGE_EDIT_LINKEDWORKTASK_SUCCESS'));
      this.onCloseForm(true);
      return;
    }

    const params = formData;

    this._commonHelper.showLoader();
    this._workTasksService.linkWorkTask(params).then((response: any) => {
      this._commonHelper.hideLoader();
      if (params.id > 0) {
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.LINKED_WORK_TASKS_TAB.MESSAGE_EDIT_LINKEDWORKTASK_SUCCESS'));
      }
      else {
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.DETAIL.LINKED_WORK_TASKS_TAB.MESSAGE_ADD_LINKEDWORKTASK_SUCCESS'));
      }
      this.onCloseForm(true); //Refresh the Linked Work Task.
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }



}
