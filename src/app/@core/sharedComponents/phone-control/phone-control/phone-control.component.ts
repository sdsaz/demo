import { Component, EventEmitter, OnInit, Output, ViewChild, forwardRef } from '@angular/core';
import { CommonService } from '../../../sharedServices/common.service';
import { CommonHelper } from '../../../common-helper';
import { LocalStorageKey } from '../../../enum';
import { ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ngx-phone-control',
  templateUrl: './phone-control.component.html',
  styleUrls: ['./phone-control.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR, 
      useExisting: forwardRef(() => PhoneControlComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneControlComponent),
      multi: true,
    }
  ]
})
export class PhoneControlComponent implements OnInit, ControlValueAccessor  {

  @ViewChild('phoneInput') phoneInput;
  
  @Output() onEnter = new EventEmitter<any>();
  
  bindControlValue: any;
  countries: any[] = [];
  selectedCountry: any;

  /*
  event variables
  */
  value: any = {};
  disabled: boolean = false;
  isReadOnly: boolean = false;

  /*
  onChange event
  */
  onChange = (value: any) => {};
  /*
  onTouched event
  */
  onTouched = () => {};
  /*
  focusout event
  */
  focusout = (value: any) => {};
  /*
  keypress event
  */
  keypress = (value: any) => {};
  /*
  click event
  */
  click = (value: any) => {};

  constructor(public _commonHelper: CommonHelper,
    private _commonService: CommonService) {  }

  ngOnInit(): any {
    this.getCountries();
  }
    
  private getCountries() {
    const countries = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Countries));
    if (countries == null) {
      this._commonHelper.showLoader();
      this._commonService.getCountries().then(response => {
        if (response) {
          this.countries = response as any[];
          // store in local storage
          this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Countries, JSON.stringify(this.countries));
          this._commonHelper.hideLoader();
        }
      },
        (error) => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrError(error);
        });
    }
    else {
      this.countries = countries as any[];
    }
  }

  onCountryCodeChange(e: any): void {
    if (this.disabled || this.isReadOnly) {
      return;
    }
    this.selectedCountry['validMask'] = String(this.selectedCountry.phoneMask).replace(/[#]/g, "0");
    this.value = { countryCode: e.value.phoneCode, phoneNumber: null };
    this.onChange(this.value);
  }

  onPhoneNumberChange(e: any): void {
    if (this.disabled || this.isReadOnly) {
      return;
    }
    this.value = {...this.value, phoneNumber: this.value.phoneNumber};
    this.onChange(this.value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  setIsReadOnlyState(isReadOnly: boolean): void {
    this.isReadOnly = isReadOnly;
  }

  onFocusOut(e: any): void {
    if (this.disabled || this.isReadOnly) {
      return;
    }
    this.value = e;
    this.focusout(this.value);
  }

  registerFocusout(fn: any): void {
    this.focusout = fn;
  }

  onKeyPress(e: any) {
    if (this.disabled || this.isReadOnly) {
      return;
    }

    if (e.key == 'Enter') {
      this.onEnter.emit();
    }
  }

  registerKeyPress(fn: any): void {
    this.keypress = fn;
  }

  onClickEvent(e: any) {
    if(this.disabled || this.isReadOnly) {
      return;
    }
    this.value = e;
    this.click(this.value);
  }

  registerClick(fn: any): void {
    this.click = fn;
  }

  writeValue(value: any): void {
    if (value) {
      this.value = value;
      if (value?.countryCode) {
        //find default country data 
        let filteredData = this.countries?.filter(x => x.phoneCode === value.countryCode && x.twoLetterIsoCode.toLowerCase() == 'us');
        //find other country data 
        let findOtherData = this.countries?.filter(x => x.phoneCode === value.countryCode);
        
        filteredData?.length > 0 ? (this.selectedCountry = filteredData[0]) : (findOtherData.length > 0 ? this.selectedCountry = findOtherData[0] : this.selectedCountry = null);
        
        this.selectedCountry['validMask'] = String(this.selectedCountry?.phoneMask).replace(/[#]/g, "0");
      }
      else if (value?.countryCode == null) {
        this.selectedCountry = this.countries?.find(x => x.name.toLowerCase() == 'united states');
        this.selectedCountry['validMask'] = String(this.selectedCountry?.phoneMask).replace(/[#]/g, "0");
        this.value = { countryCode: this.selectedCountry.phoneCode, phoneNumber: null };
        this.onChange(this.value);
      }
    } else if (value == null) {
      this.selectedCountry = this.countries?.find(x => x.name.toLowerCase() == 'united states');
      this.selectedCountry['validMask'] = String(this.selectedCountry?.phoneMask).replace(/[#]/g, "0");
      this.value = { countryCode: this.selectedCountry.phoneCode, phoneNumber: null };
      this.onChange(this.value);
    }
  }

  markAsTouched(): void {
    this.onTouched();
  }

  public validate(c: FormControl) {
    return c.errors;
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
}
