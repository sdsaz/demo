import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonHelper } from '../../../common-helper';

@Component({
  selector: 'ngx-password-strength',
  templateUrl: './password-strength.component.html',
  styleUrls: ['./password-strength.component.scss']
})
export class PasswordStrengthComponent implements OnInit, OnChanges {

  @Input() value: string;

  @Input() showLabel: boolean = true;

  strength: number = 0;

  isVisible: boolean = false;

  label: string;
  
  colorClass: string;

  constructor(private _commonHelper: CommonHelper) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes != null && changes.value.currentValue == '') {
      this.isVisible = false;
      this.strength = 0;
    }
    else if (changes.value.currentValue != changes.value.previousValue) {
      this.updateStrength(this.value);
    }
  }

  updateStrength(event) {
    this.isVisible = true;
    this.strength = this.getPasswordStrength(event);
  }

  getPasswordStrength(str: string) {
    let grade: number = 0;
    let val: RegExpMatchArray;

    val = str.match('[0-9]');
    grade += this.normalize(val ? val.length : 1 / 4, 1) * 25;

    val = str.match('[a-zA-Z]');
    grade += this.normalize(val ? val.length : 1 / 2, 3) * 10;

    val = str.match('[!@#$%^&*?_~.,;=]');
    grade += this.normalize(val ? val.length : 1 / 6, 1) * 35;

    val = str.match('[A-Z]');
    grade += this.normalize(val ? val.length : 1 / 6, 1) * 30;

    grade *= str.length / 8;

    grade = grade > 100 ? 100 : grade;

    if (grade < 30) {
      this.label = this._commonHelper.getInstanceTranlationData('COMMON.PASSWORD_STRENGTH.WEAK');
      this.colorClass = 'progress-red';
      return 33.33;
    } else if (grade >= 30 && grade < 80) {
      this.label = this._commonHelper.getInstanceTranlationData('COMMON.PASSWORD_STRENGTH.MEDIUM');;
      this.colorClass = 'progress-yellow';
      return 66.66;
    } else if (grade >= 80) {
      this.label = this._commonHelper.getInstanceTranlationData('COMMON.PASSWORD_STRENGTH.STRONG');;
      this.colorClass = 'progress-green';
      return 100;
    }
  }

  normalize(x, y) {
    let diff = x - y;

    if (diff <= 0) return x / y;
    else return 1 + 0.5 * (x / (x + y / 4));
  }
}
