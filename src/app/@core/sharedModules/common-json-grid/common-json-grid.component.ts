import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { CommonHelper } from "../../common-helper";
import { 
  AbstractControl, 
  FormGroup, 
  UntypedFormArray, 
  UntypedFormBuilder, 
  UntypedFormControl, 
  UntypedFormGroup, 
  ValidationErrors, 
  ValidatorFn, 
  Validators } from "@angular/forms";


@Component({
  selector: "ngx-common-json-grid",
  templateUrl: "./common-json-grid.component.html",
  styleUrls: ["./common-json-grid.component.scss"]
})
export class CommonJsonGridComponent implements OnInit, OnChanges {

  @Input() customFieldControl: any;
  @Input() isReadOnly: boolean;
  @Input() formGroup: UntypedFormGroup | any; 
  @Input() data: any;
  @Input() submitted: boolean = false;
  @Input() isLoadedData: boolean = false;

  defaultColumnDefinitions: any;
  isAddItemMode: boolean = false;

  constructor(public _commonHelper: CommonHelper, private _formBuilder: UntypedFormBuilder, private ref: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (this.customFieldControl && this.customFieldControl != '') {
      this.defaultColumnDefinitions = JSON.parse(this.customFieldControl.defaultValue);
    }
    
    this.createBlankFormArray();
    this.bindData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes != null && changes.isLoadedData?.currentValue) {
      this.isAddItemMode = false;
      this.createBlankFormArray();
      this.bindData();
    }
  }

  public get jsonGridFormArray() : UntypedFormArray | any {
    return this.formGroup.get(this.customFieldControl.fieldName) as UntypedFormArray
  }

  //add new row in json grid table
  public addNewIem() {
    if(this.jsonGridFormArray?.valid) {
      const formGroup = this.initiateForm();
      if (formGroup != null) {
        this.jsonGridFormArray.push(formGroup);
      }
    }else {
      this.isAddItemMode = true;
    }
  }

  public removeItem(i: number) {
    this.jsonGridFormArray.removeAt(i);
  }

  //allow only 4 digits and '.'(dot)
  public percentEventHandler(event) {
    if (event.keyCode === 46 && event.target.value.split('.').length === 2) {
      return false;
    }
    return event.target.value.length <= 4;
  }


  private createBlankFormArray() {
    this.formGroup.addControl(this.customFieldControl.fieldName, this._formBuilder.array([]));
  }

  private bindData() {
    if (this.data && this.data != '' && this.defaultColumnDefinitions && this.defaultColumnDefinitions != '') {  
      const formArray = <UntypedFormArray>this.jsonGridFormArray;
      this.data.forEach(d => {
        let group = {};
        const jsonKeys = Object.keys(d);

        if (jsonKeys && jsonKeys.length > 0) {
          jsonKeys.forEach(key => {
            
            const columnControl = this.defaultColumnDefinitions?.columns.find(i => i.jsonKey == key);
            
            if (columnControl && columnControl != '') {
              const settingJson = columnControl?.settingJSON;

              let isRequired = settingJson?.isRequired;
              let min = settingJson?.min;
              let max = settingJson?.max;

              if (columnControl.type == "text" && isRequired) {
                group[columnControl.jsonKey] = new UntypedFormControl(d[key], [Validators.required]);
              }
              else if(columnControl.type == "dropdown" && isRequired) {
                group[columnControl.jsonKey] = new UntypedFormControl(d[key], [Validators.required])
              }
              else if (columnControl.type == "percentage" && isRequired) {
                const roundedData = Math.round(d[key] * 100) / 100;
                group[columnControl.jsonKey] = new UntypedFormControl(roundedData, [Validators.required, Validators.min(+min), Validators.max(+max)]);
              } else {
                group[columnControl.jsonKey] = new UntypedFormControl(d[key]);
              }
            }
          });
        }
        formArray.push(new UntypedFormGroup(group));
      });
    }
  }
 
  private initiateForm() {
    if (this.defaultColumnDefinitions && this.defaultColumnDefinitions != '') {
      let group = {};
      this.defaultColumnDefinitions?.columns.forEach((columnControl: any) => {

        const settingJson = columnControl?.settingJSON;

        let isRequired = settingJson?.isRequired;
        let min = settingJson?.min;
        let max = settingJson?.max;
        
        if (columnControl.type == "text" && isRequired) {
          group[columnControl.jsonKey] = new UntypedFormControl("", [Validators.required]);
        }
        else if(columnControl.type == "dropdown" && isRequired) {
          group[columnControl.jsonKey] = new UntypedFormControl("", [Validators.required]);
        }
        else if (columnControl.type == "percentage" && isRequired) {
          group[columnControl.jsonKey] = new UntypedFormControl("", [Validators.required, Validators.min(+min), Validators.max(+max)]);
        } else {
          group[columnControl.jsonKey] = new UntypedFormControl("");
        }
      })
      return new FormGroup(group);
    }
    return null;
  }

  private validateAllFormFields(formGroup: UntypedFormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.validateAllFormFields(control);
      } else if (control instanceof UntypedFormArray) {
        control?.controls?.forEach((i: UntypedFormGroup) => {
          this.validateAllFormFields(i);
        })
      }
    });
  }
  
}
