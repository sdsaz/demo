import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';
import { PermissionSet } from '../permissionset.model';
import { PermissionSetService } from '../permissionset.service';
import { LocalStorageKey } from '../../../../@core/enum';

@Component({
  selector: 'permissionsets-form-dialog',
  templateUrl: './permissionset-form.component.html',
  styleUrls: ['./permissionset-form.component.scss']
})

export class PermissionSetFormComponent implements OnInit {

  //Form Group
  permissionSetForm: UntypedFormGroup;

  //PermissionSet/ permission data source
  permissionSet: PermissionSet;
  permissions: any;

  //Form related flag
  permissionSetId: number = 0; // for Edit
  formMode: string; //Form mode
  submitted = false;
  selectedPermissions: any;

  //permission variable 
  hasPermission: boolean = false;
  isViewPermissionSet: boolean = false;
  isAddPermissionSet: boolean = false;
  isEditPermissionSet: boolean = false;
  isDeletePermissionSet: boolean = false;
  isInitialLoading: boolean = true;

  //For Validation    
  permissionSet_validation_messages = {
    'name': [
      { type: 'required', message: 'URAM.PERMISSION_SET.DETAIL.MESSAGE_PERMISSIONSET' },
      { type: 'minlength', message: 'URAM.PERMISSION_SET.DETAIL.MESSAGE_PERMISSIONSET_MIN' },
      { type: 'maxlength', message: 'URAM.PERMISSION_SET.DETAIL.MESSAGE_PERMISSIONSET_MAX' }
    ]
  }

  constructor(private _router: Router,
    private _activeRoute: ActivatedRoute,
    private _formBuilder: UntypedFormBuilder,
    private _permissionsetService: PermissionSetService,
    private _commonHelper: CommonHelper) {
    //If Record Edit then set record edit id
    this._activeRoute.params.subscribe(param => {
      if (param['id'] != undefined) {
        if (param['id'] != null) {
          this.permissionSetId = param['id'];
        }
      }
    });

    //Set Logged user have permission   
    this.isViewPermissionSet = this._commonHelper.havePermission(enumPermissions.ViewPermissionSet);
    this.isAddPermissionSet = this._commonHelper.havePermission(enumPermissions.AddPermissionSet);
    this.isEditPermissionSet = this._commonHelper.havePermission(enumPermissions.EditPermissionSet);
    this.isDeletePermissionSet = this._commonHelper.havePermission(enumPermissions.DeletePermissionSet);
    this.hasPermission = this.isAddPermissionSet || this.isEditPermissionSet || this.isDeletePermissionSet;
  }

  ngOnInit() {
    if (this.permissionSetId > 0) {
      this.formMode = 'EDIT';
      this.getPermissionSetDetail();

    } else {
      this.formMode = 'ADD';
      this.permissionSetForm = this.createPermissionSetForm();
      this.getPermissions();
    }
  }

  getPermissionSetDetail() {
    this._commonHelper.showLoader();
    this.isInitialLoading = true;
    this._permissionsetService.getPermissionSetById(this.permissionSetId).then(response => {
      if (response) {
        this.permissionSet = response as PermissionSet;
        this.permissionSetForm = this.createPermissionSetForm();
        this.getPermissions();
      }
      this._commonHelper.hideLoader();
      this.isInitialLoading = false;
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  getPermissions() {
    const permissionsList = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.AllActivePermissions));
    if (permissionsList == null) {
      this._commonHelper.showLoader();
      this._permissionsetService.getAllActivePermissions().then(response => {
        let permissionsData = response as any;
        // store in local storage
        this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.AllActivePermissions, JSON.stringify(permissionsData));

        this.permissions = [];
        let permissionsGroupWise = new Set(permissionsData.map(item => item.groupName))
        permissionsGroupWise.forEach(g =>
          this.permissions.push({
            name: g,
            values: permissionsData.filter(i => i.groupName === g)
        }));
        
        this.addCheckboxes();
        this._commonHelper.hideLoader();
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
    else {
      let permissionsData = permissionsList;
      this.permissions = [];
      let permissionsGroupWise = new Set(permissionsData.map(item => item.groupName))
      permissionsGroupWise.forEach(g =>
        this.permissions.push({
          name: g,
          values: permissionsData.filter(i => i.groupName === g)
      }));
      this.addCheckboxes();
    }
  }

  checkChange(event) {
    this._commonHelper.showLoader();
    this.permissions.forEach(groupElement => {
      groupElement.values.forEach(item => {
        let controlItem = event.id.split('-');
        if (item.id == controlItem[1]) {
          item.isChecked = event.checked;
        }
      });
    });
    this._commonHelper.hideLoader();
  }

  createPermissionId(permissions) {
    if (permissions.id.length == 0) {
      return "chk-0";
    }
    return "chk-" + permissions.id; //+ "-" + permissions.name.replace(/ +/g, '-').toLowerCase();
  }

  saveForm(formData) {
    this.submitted = true;
    this.selectedPermissions = '';
    this.permissions.forEach(groupElement => {
      groupElement.values.forEach((item, i) => {
        if (item.isChecked) {
          this.selectedPermissions += item.id.toString() + ',';
        }
      });
    });

    if ((this.selectedPermissions.charAt(this.selectedPermissions.length - 1)) == ",") {
      this.selectedPermissions = this.selectedPermissions.substring(0, this.selectedPermissions.length - 1);
    }

    formData.permissionIds = this.selectedPermissions.toString();
    if (this.permissionSetForm.invalid) {
      this.validateAllFormFields(this.permissionSetForm);
      return;
    }
    if (this.selectedPermissions.length == 0) {
      return;
    }


    if (this.formMode == 'ADD') {
      this._commonHelper.showLoader();
      this._permissionsetService.addPermissionSet(formData).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('URAM.PERMISSION_SET.DETAIL.MESSAGE_PERMISSIONSET_ADD')
        );
        this.closeForm();
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    } else if (this.formMode == 'EDIT') {
      this._commonHelper.showLoader();
      this._permissionsetService.updatePermissionSet(formData).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('URAM.PERMISSION_SET.DETAIL.MESSAGE_PERMISSIONSET_UPDATE'));
        this.closeForm();
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
  }

  addCheckboxes() {
    this._commonHelper.showLoader();
    let selectedPermissionsArray = [];

    if (this.permissionSet.permissionId != undefined) {
      let selected = this.permissionSet.permissionId;
      selectedPermissionsArray = selected.split(',');
    }
    this.permissions.map((o, i) => {
      o.values.forEach(pValues => {
        let isChecked = false;
        if (selectedPermissionsArray.length > 0) {
          selectedPermissionsArray.forEach(element => {
            if (pValues.id == element) {
              isChecked = true;
            }
          });
        }
        pValues.isChecked = isChecked;
      });
    });
    this._commonHelper.hideLoader();
  }

  createPermissionSetForm(): UntypedFormGroup {
    if (this.formMode == 'ADD') {
      this.permissionSet = new PermissionSet({});
      return this._formBuilder.group({
        id: [this.permissionSet.id],
        name: [this.permissionSet.name, Validators.compose([Validators.required, Validators.minLength(3), Validators.maxLength(50)])],
        permissionIds: [this.permissionSet.permissionId],
        permissionName: [this.permissionSet.permissionName],
      });
    }
    else if (this.formMode == 'EDIT') {
      return this._formBuilder.group({
        id: [this.permissionSet.id],
        name: [this.permissionSet.name, Validators.compose([Validators.required, Validators.minLength(3), Validators.maxLength(50)])],
        permissionIds: [this.permissionSet.permissionId.toString()],
        permissionName: [this.permissionSet.permissionName],
      });
    }
  }

  closeForm() {
    this._router.navigate(['uram/permissionsets']);
  }

  // convenience getter for easy access to form fields
  get f() { return this.permissionSetForm.controls; }
  validateAllFormFields(formGroup: UntypedFormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('URAM.PERMISSION_SET.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

  onBack() {
    this.closeForm();
  }
}
