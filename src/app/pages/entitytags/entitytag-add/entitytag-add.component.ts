import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { Entity, LocalStorageKey, ReferenceType, RefType } from '../../../@core/enum';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { ValidateDropdown } from '../../../@core/sharedValidators/entities-Dropdown.validator';
import { EntitytagCategories, Entitytags } from '../entitytags.model';
import { EntitytagsService } from '../entitytags.service';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';

@Component({
  selector: 'entitytag-add',
  templateUrl: './entitytag-add.component.html',
  styleUrls: ['./entitytag-add.component.scss']
})
export class EntitytagAddComponent implements OnInit {
  private entityTagNameRef: ElementRef;
  @ViewChild('entityTagName', { static: false }) set content(content: ElementRef) {
    if (content) { // initially setter gets called with undefined
      this.entityTagNameRef = content;
    }
  }
  @ViewChild('entityDropdown', { static: false }) entityDropdownRef;

  //declare form variable
  entityTagForm: UntypedFormGroup;

  entityTagId: number = 0;
  formMode: string;
  submitted = false;
  //declare datasource
  entityTags: Entitytags;
  entityTagCategories: EntitytagCategories;
  entities: any = [];
  entityRecordTypes: any = [];
  filteredentityRecordTypes: any = [];

  //permissions
  isAddTag: boolean = false;
  isEditTag: boolean = false;
  hasPermission: boolean = false;
  isInitialLoading: boolean = true;

  //Drop-down DataSource
  tagCategoryList: any;

  // ref types
  tagShapes: ReferenceType[] = null;

  selectedFile: File;
  imagePreview: any = '../assets/images/default/entityTags/default-image.jpg';

  selectedColor: any;
  isImageRemove: boolean = false;

  addentitytag_validation_messages = {
    "tagCategoryId": [
      { type: 'required', message: "ENTITYTAGS.ENTITYTAGS.ADD.BASIC_INFORMATION.MESSAGE_CATEGORY_REQUIRED" }
    ],
    "name": [
      { type: 'required', message: "ENTITYTAGS.ENTITYTAGS.ADD.BASIC_INFORMATION.MESSAGE_NAME_REQUIRED" },
      { type: 'maxlength', message: 'ENTITYTAGS.ENTITYTAGS.ADD.BASIC_INFORMATION.MESSAGE_NAME_MAX' }
    ],
    "displayOrder": [
      { type: 'required', message: "ENTITYTAGS.ENTITYTAGS.ADD.BASIC_INFORMATION.MESSAGE_DISPLAY_ORDER_REQUIRED" },
      { type: 'min', message: "ENTITYTAGS.ENTITYTAGS.ADD.BASIC_INFORMATION.MESSAGE_DISPLAY_ORDER_MINIMUM" },
      { type: 'max', message: "ENTITYTAGS.ENTITYTAGS.ADD.BASIC_INFORMATION.MESSAGE_DISPLAY_ORDER_MAXIMUM" }
    ],
    "entityDropDown": [
      { type: 'required', message: "ENTITYTAGS.ENTITYTAGS.ADD.BASIC_INFORMATION.MESSAGE_ENTITY_NAME_REQUIRED" }
    ]
  }


  constructor(private _activeRoute: ActivatedRoute,
    private _router: Router,
    private _formBuilder: UntypedFormBuilder,
    private _entityTagsService: EntitytagsService,
    private _commonService: CommonService,
    private _commonHelper: CommonHelper,
    private _fileSignedUrlService: FileSignedUrlService
  ) {

    //initiate Permissions
    this.isEditTag = this._commonHelper.havePermission(enumPermissions.EditTag);
    this.isAddTag = this._commonHelper.havePermission(enumPermissions.AddTag);
    this.hasPermission = this.isEditTag || this.isAddTag;

    //If Record Edit then set record edit id
    this._activeRoute.params.subscribe(param => {
      if (param['id'] != undefined) {
        if (param['id'] != null) {
          this.entityTagId = param['id'];
          if (this.entityTagId <= 0) {
            this._router.navigate(['..'], { relativeTo: this._activeRoute });
          }
        }
      }
    });
  }

  ngOnInit(): void {
    if (this.hasPermission) {
      if (this.entityTagId > 0) {
        this.formMode = 'EDIT';
        Promise.all([
          this.getTagShapesFromReferenceType(),
          this.getEntities()
        ]).then(() => this.getEntityTagById());
      } else {
        this.formMode = 'ADD';
        this.entityTagForm = this.createEntityTagAddForm(false);
        setTimeout(() => { this.entityDropdownRef.applyFocus(); });
        this.getTagShapesFromReferenceType();
        this.getEntities();
      }
    }
  }

  // convenience getter for easy access to form fields
  get etfrm() { return this.entityTagForm.controls; }
  //Create Form
  createEntityTagAddForm(isDisableControl: boolean): UntypedFormGroup {
    if (this.formMode == 'ADD') {
      this.entityTags = new Entitytags({});
    }

    return this._formBuilder.group({
      id: [this.entityTags.id],
      entityDropDown: [{ value: this.entityTags.entityTypeId, disabled: isDisableControl}, Validators.compose([Validators.required])],
      entityRecordTypeDropDown: [{ value: this.entityTags.entityRecordTypeId, disabled: isDisableControl}],
      tagCategoryId: [{ value: this.entityTags.tagCategoryId, disabled: isDisableControl}, Validators.compose([Validators.required])],
      name: [this.entityTags.name, Validators.compose([Validators.required, Validators.maxLength(100)])],
      displayOrder: [this.entityTags.displayOrder, Validators.compose([Validators.required,Validators.min(1),Validators.max(100)])],
      shape: [this.entityTags.shapeID],
      color: [this.entityTags.tagFontColor],
      image: [this.entityTags.tagImage],
      tagIsActive: [this.entityTags.tagIsActive]
    });
  }

  getEntities() {
    return new Promise((resolve, reject) => {
      const entityWithRecordTypes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.VisibleEntityWithRecordTypes));
      if (entityWithRecordTypes == null) {
        this._commonHelper.showLoader();
        this._commonService.getDisplayEntityWithRecordType().then((entitylist: any) => {
          if (entitylist) {
            this.processEntities(entitylist);
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.VisibleEntityWithRecordTypes, JSON.stringify(entitylist));
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
          (error) => {
            this._commonHelper.hideLoader();
            reject(null);
            this.getTranslateErrorMessage(error);
          });
      }
      else {
        this.processEntities(entityWithRecordTypes);
        resolve(null);
      }
    });
  }

  private processEntities(entitylist: any) {
    entitylist.forEach(element => {
      this.entities.push({ label: element.displayName, value: element.id });
      if (element.entityRecordTypes) {
        element.entityRecordTypes.forEach(recordType => {
          this.entityRecordTypes.push({ label: recordType.name, value: recordType.id, entityTypeID: element.id });
        });
      }
    });
    this.filteredentityRecordTypes = this.entityRecordTypes;
  }

  getTagShapesFromReferenceType() {
    return new Promise((resolve, reject) => {
      let params = { refType:  RefType.TagShapes};
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.TagShapes}`;
      // get data
      const refTypeTagShapes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeTagShapes == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.tagShapes = response as ReferenceType[];
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.tagShapes));
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
        this.tagShapes = refTypeTagShapes;
        resolve(null);
      }
    });
  }

  onFileUpload(event) {
    this.selectedFile = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(this.selectedFile);
    reader.onload = (_event) => {
      this.imagePreview = reader.result;
    };
  }

  removeImage() {
    this.imagePreview = "";
    this.isImageRemove = true;
  }

  getEntityTagById(): void {
    this._commonHelper.showLoader();
    this.isInitialLoading = true;
    this._entityTagsService.getEntityTagById(this.entityTagId).then((response: any) => {
      if (response) {
        this.entityTags = response;
        this.entityTags.shapeID = this.tagShapes.find(x => x.intValue1 == response.shapeID).intValue1;
        //this.imagePreview = response.tagImage != null && response.tagImage !== "" ? response.tagImage : '../assets/images/default/entityTags/default-image.jpg';
        if (response.tagImage) {
          const pos = String(response.tagImage).lastIndexOf('/');
          const fileName = String(response.tagImage).substr(pos+1,String(response.tagImage).length - pos)
          this._fileSignedUrlService.getSingleFileSignedUrl(Entity.EntityTags, fileName).then(res => {
            if (res) {
              this.imagePreview = res;
            }
          });
        }
        this.selectedColor = response.tagFontColor;
        this.entityTagForm = this.createEntityTagAddForm(true);
        setTimeout(() => { this.entityTagNameRef.nativeElement.focus(); });
        this._commonHelper.showLoader();
        this._entityTagsService.getEntityTagsCategoriesByEntityTypeId(this.entityTags.entityTypeId, this.entityTags.entityRecordTypeId).then((res: any) => {
          if (res) {
            this.tagCategoryList = res.map((i: any) =>
              ({ label: i.text, value: i.value })
            );
          }
          this._commonHelper.hideLoader();
        },
          (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
          });
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

  // convenience getter for easy access to form fields
  get f() { return this.entityTagForm.controls; }
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

  saveForm(submitedData) {
    if (submitedData.color == "null" || submitedData.color == null || submitedData.color == "") {
      submitedData.color = "#000000";
    }

    this.submitted = true;

    if (this.entityTagForm.invalid) {
      this.validateAllFormFields(this.entityTagForm);
      return;
    }

    if (this.formMode == 'ADD') {
      this._commonHelper.showLoader();
      submitedData['image'] = submitedData['image'] != null ? submitedData['image'].replace("C:\\fakepath\\", "") : "";
      let formData = new FormData();
      formData.set("Id", submitedData['id']);
      formData.set("TagCategoryId", submitedData['tagCategoryId']);
      formData.set("Name", submitedData['name']);
      formData.set("DisplayOrder", submitedData['displayOrder']);
      if (!(submitedData.shape == "null" || submitedData.shape == null)) {
        formData.set("Shape", submitedData['shape']);
      }
      formData.set('Color', submitedData['color']);
      formData.set('Image', submitedData['image']);
      formData.set('file', this.selectedFile);
      this._entityTagsService.saveEntityTag(formData).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('ENTITYTAGS.ENTITYTAGS.ADD.BASIC_INFORMATION.MESSAGE_ENTITYTAG_ADDED')
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
      submitedData['image'] = submitedData['image'] != null ? submitedData['image'].replace("C:\\fakepath\\", "") : "";
      let formData = new FormData();
      formData.set("Id", submitedData['id']);
      formData.set("TagCategoryId", submitedData['tagCategoryId']);
      formData.set("Name", submitedData['name']);
      formData.set("DisplayOrder", submitedData['displayOrder']);
      if (!(submitedData.shape == "null" || submitedData.shape == null)) {
        formData.set("Shape", submitedData['shape']);
      }
      formData.set('Color', submitedData['color']);
      formData.set('Image', submitedData['image']);
      formData.set('IsRemoveImage', this.isImageRemove ? "True" : "False");
      formData.set('file', this.selectedFile);
      formData.set('IsActive', submitedData['tagIsActive']);

      this._entityTagsService.saveEntityTag(formData).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('ENTITYTAGS.ENTITYTAGS.ADD.BASIC_INFORMATION.MESSAGE_ENTITYTAG_UPDATED')
        );
        this.closeForm();
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
  }

  displayOrderInputHandler(event) {
    if (event.key === "." || event.key === "-") {
      return false;
    }
  }

  onOptionsSelected(event) {
    const value = event.value;
    this.entityTags.tagCategoryId = value;
    if (this.entityTags.tagCategoryId) {
      this._commonHelper.showLoader();
      this._entityTagsService.getNextDisplayOrderForTagCategory(this.entityTags.tagCategoryId).then((response: any) => {
        this.entityTagForm.get("displayOrder").setValue(response + 1);
        this._commonHelper.hideLoader();
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        });
    }
    else {
      this.entityTagForm.get("displayOrder").setValue(1);
    }
  }

  onEntitySelectionChange(event) {
    this.filteredentityRecordTypes = this.entityRecordTypes;
    if(event != null){
        this.filteredentityRecordTypes = this.filteredentityRecordTypes.filter(x=>x.entityTypeID == event);
    }

    this.entityTags.entityTypeId = event;
    if (this.filteredentityRecordTypes.filter(x => x.value == this.entityTags.entityRecordTypeId).length <= 0) {
      this.entityTags.entityRecordTypeId = null;
    }

    this.getEntityTagsCategoriesByEntityTypeId(this.entityTags.entityTypeId,this.entityTags.entityRecordTypeId);
  }

  onEntityRecordTypeSelectionChange(value) {
    this.entityTags.entityRecordTypeId = value;
    this.getEntityTagsCategoriesByEntityTypeId(this.entityTags.entityTypeId,this.entityTags.entityRecordTypeId);
}

  private getEntityTagsCategoriesByEntityTypeId(entityTypeID,entityRecordTypeId): void {
    this._commonHelper.showLoader();
    this._entityTagsService.getEntityTagsCategoriesByEntityTypeId(entityTypeID, entityRecordTypeId).then((response: any) => {
        if (response) {
            this.tagCategoryList = response.map((i: any) =>
                ({ label: i.text, value: i.value })
            );
        }
        this._commonHelper.hideLoader();
    }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
    });
}

  getChangedCode(e) {
    this.selectedColor = e.target.value;
  }

  onBack() {
    this.closeForm();
  }

  closeForm() {
    this._router.navigate(['tagmanagement/tags']);
  }

  getTranslateErrorMessage(error) {
    if (error && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('ENTITYTAGS.ENTITYTAGS.ADD.BASIC_INFORMATION.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }
}
