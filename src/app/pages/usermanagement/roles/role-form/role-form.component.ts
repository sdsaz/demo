import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormArray, UntypedFormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CommonHelper, enumPermissions } from '../../../../@core/common-helper';

import { Role } from '../role.model';
import { RolesService } from '../role.service';
import { CommonService } from '../../../../@core/sharedServices/common.service';

@Component({
  selector: 'form-dialog',
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss']
})

export class RoleFormComponent implements OnInit {
  //For Role Form
  roleForm: UntypedFormGroup;

  role: Role;
  roleId: number = 0;
  formMode: string;
  submitted = false;

  permissionSets: any;

  selectedPermissionSet: any;
  isInitialLoading: boolean = true;

  //permission variable
  isListRole: boolean = false;
  isViewRole: boolean = false;
  isAddRole: boolean = false;
  isEditRole: boolean = false;
  isDeleteRole: boolean = false;

  //For Validation
  role_validation_messages = {
    'name': [
      { type: 'required', message: 'URAM.ROLE.DETAIL.MESSAGE_NAME' },
      { type: 'minlength', message: 'URAM.ROLE.DETAIL.MESSAGE_NAME_MIN' },
      { type: 'maxlength', message: 'URAM.ROLE.DETAIL.MESSAGE_NAME_MAX' },
    ]
  }

  roleFilters: any[] = [];
  filterEntities: any[] = [];
  filterDescription: string = '';
  tooltipDataString: string = '';

  constructor(private _router: Router,
    private _formBuilder: UntypedFormBuilder,
    private _activeRoute: ActivatedRoute,
    private _rolesService: RolesService,
    private _commonHelper: CommonHelper,
    private _commonService:CommonService) {
    //If Record Edit then set record edit id
    this._activeRoute.params.subscribe(param => {
      if (param['id'] != undefined) {
        if (param['id'] != null) {
          this.roleId = param['id'];
        }
      }
    });

    //Set Logged user have permission
    this.isListRole = this._commonHelper.havePermission(enumPermissions.ListRoles);
    this.isViewRole = this._commonHelper.havePermission(enumPermissions.ViewRole);
    this.isAddRole = this._commonHelper.havePermission(enumPermissions.AddRole);
    this.isEditRole = this._commonHelper.havePermission(enumPermissions.EditRole);
    this.isDeleteRole = this._commonHelper.havePermission(enumPermissions.DeleteRole);
  }

  ngOnInit() {
    this.getRoleFilter().then(() => {
      if (this.roleId > 0) {
        this.formMode = 'EDIT';
        this.getRoleDetail();
      } else {
        this.formMode = 'ADD';
        this.roleForm = this.createRoleForm();
        this.getPermissionSets();
        this.valueChangeObservable();
      }
    });    
  }

  createRoleForm(): UntypedFormGroup {
    if (this.formMode == 'ADD') {
      this.role = new Role({});
      return this._formBuilder.group({
        id: [this.role.id],
        name: [this.role.name, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(50)])],
        permissionSetFormArray: new UntypedFormArray([]),
        permissionSetId: [this.role.permissionSetId],
        permissionSetName: [this.role.permissionSetName],
        filterId: [undefined]
      });
    }
    else if (this.formMode == 'EDIT') {
      return this._formBuilder.group({
        id: [this.role.id],
        name: [this.role.name, Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(50)])],
        permissionSetFormArray: new UntypedFormArray([]),
        permissionSetId: [this.role.permissionSetId],
        permissionSetName: [this.role.permissionSetName],
        filterId: [this.role.filterId]
      });
    }
  }

  saveForm(formData) {
    this.submitted = true;

    this.selectedPermissionSet = this.roleForm.value.permissionSetFormArray
      .map((v, i) => v ? this.permissionSets[i].id : null)
      .filter(v => v !== null);

    formData.permissionSetId = this.selectedPermissionSet.toString();
    if (this.roleForm.invalid) {
      this.validateAllFormFields(this.roleForm);
      return;
    }
    if (this.selectedPermissionSet.length == 0) {
      return;
    }

    if (this.formMode == 'ADD') {
      this._commonHelper.showLoader();
      this._rolesService.addNewRole(formData).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('URAM.ROLE.DETAIL.MESSAGE_ROLE_ADD')
        );
        this.closeForm();
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
    else if (this.formMode == 'EDIT') {
      this._commonHelper.showLoader();
      this._rolesService.updateRole(formData).then(response => {        
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('URAM.ROLE.DETAIL.MESSAGE_ROLE_UPDATE')
          );
        this.closeForm();
      },
        (error) => {          
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
  }
  
  createPermissionSetId(permissionSetId){
    if(permissionSetId.length == 0){
      return "chk-0";
    }
    return "chk-" + permissionSetId;//permissionSet.replace(/ +/g, '-').toLowerCase();
  }
  getRoleDetail() {
    this._commonHelper.showLoader();
    this.isInitialLoading = true;
    this._rolesService.getRolesById(this.roleId).then(response => {   
      if(response){   
      this.role = response as Role;
      this.roleForm = this.createRoleForm();
      this.showFilterDescription(this.role.filterId);
      this.valueChangeObservable();
      this.getPermissionSets();
    }
      this._commonHelper.hideLoader();
      this.isInitialLoading = false;
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.isInitialLoading = false;
        this.getTranslateErrorMessage(error);
      });
  }

  addCheckboxes() {
    this._commonHelper.showLoader();
    let selectedPermissionSetArray = [];
    if (this.role.permissionSetId != undefined) {
      let selected = this.role.permissionSetId;
      selectedPermissionSetArray = selected.split(',');
    }
    this.permissionSets.map((o, i) => {
      let isChecked = false;
      if (selectedPermissionSetArray.length > 0) {
        selectedPermissionSetArray.forEach(element => {
          if (o.id == element) {
            isChecked = true;
          }
        });
      }
      const control = new UntypedFormControl(isChecked); // if first item set to true, else false              
      (this.roleForm.controls.permissionSetFormArray as UntypedFormArray).push(control);
    });
    this._commonHelper.hideLoader();
  }

  getPermissionSets() {
    this._commonHelper.showLoader();
    this._rolesService.getPermissionSet().then(
      response => {
        this.permissionSets = response;        
        this.addCheckboxes();
        this._commonHelper.hideLoader();
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
  }

  closeForm() {
    this._router.navigate(['uram/roles']);
  }

  // convenience getter for easy access to form fields
  get f() { return this.roleForm.controls; }
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

  getTranslateErrorMessage(error) {
      if (error != null && error.messageCode) {
        this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('URAM.ROLE.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
  }

  onBack(){
    this.closeForm();
  }

  private getRoleFilter() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._rolesService.getRoleFilter().then(res => {
        this._commonHelper.hideLoader();
        if (res) {
          this.roleFilters = (res as any[]).map((x: any) => { return { 'label': x.name, 'value': x.id } });
          if (this.roleFilters.length > 0) {
            this.getFilterEntities().then(data => {
              resolve(this.roleFilters);
            }, err=> {
              reject(err);
            }); 
          } else {
            resolve(null);
          }
        }
      }, err => {
        this._commonHelper.hideLoader();
        reject(err);
      });
    });
  }

  private getFilterEntities() {
    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();
      this._rolesService.getFilterEntities().then(res => {
        this._commonHelper.hideLoader();
        if (res) {
          this.filterEntities = res as any[];
        }
        resolve(null);
      }, err => {
        this._commonHelper.hideLoader();
        reject(err);
      });
    });
  }

  showFilterDescription(filterId?: number) {
    this.filterDescription = '';
    if (filterId && filterId > 0) {
      const descriptionList = this.filterEntities.filter(x => x.filterId == filterId);
      descriptionList.forEach(x => {
        if (x.description) {
          this.filterDescription += x.description + '<br/><br/>';
        }
      });
      if (this.filterDescription) {
        this.filterDescription = this.filterDescription.slice(0,this.filterDescription.lastIndexOf('<br/><br/>'))
      } 
    }
  }

  showTooltipData(filterId: number) {
    this.tooltipDataString = '';
    if (filterId && filterId > 0) {
      const descriptionList = this.filterEntities.filter(x => x.filterId == filterId);
      descriptionList.forEach(x => {
        if (x.description) {
          this.tooltipDataString += x.description + '<br/><br/>';
        }
      }); 
      if (this.tooltipDataString) {
        this.tooltipDataString = this.tooltipDataString.slice(0,this.tooltipDataString.lastIndexOf('<br/><br/>'))
      }
    }
  }

  valueChangeObservable() {
    this.roleForm.get('filterId').valueChanges.subscribe(value => {
      this.showFilterDescription(value);
    });
  }
}
