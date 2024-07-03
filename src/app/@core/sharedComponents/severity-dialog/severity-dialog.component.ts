import { Component, OnInit, Input ,Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ngx-severity-dialog',
  templateUrl: './severity-dialog.component.html',
  styleUrls: ['./severity-dialog.component.scss']
})
export class SeverityDialogComponent implements OnInit {
 /**
   * If PriorityId 
   */
  @Input() severityId: number;
  /**
   * Assignable User List
   */
  @Input() severities: any = [];

  //#region Dialog Translation Related Properties
  /**
   * For the dialog title
   */
  @Input() dialogTitle: string = '';
  /**
   * For User dropdown label
   */
  @Input() severitySelectLabel: string = '';
  /**
   * For User dropdown placeholder
   */
  @Input() severitySelectPlaceholder: string = '';
  //#endregion

  /**
   It will give call back to the parent component on assign user
   with new AssignedUserId or Selected Id as callback result
   */
  @Output() OnSubmitChangeSeverity: EventEmitter<any> = new EventEmitter();

  severityFormGroup: UntypedFormGroup;

  constructor(private _ngbActiveModal: NgbActiveModal, private fb: UntypedFormBuilder) { }

  ngOnInit() {
    this.severityFormGroup = this.fb.group({
      selectedseverityId: [this.severityId && this.severityId > 0 ? this.severityId : undefined, [Validators.required]]
    });
  }

  onSubmitChange() {
    this.OnSubmitChangeSeverity.emit(this.severityFormGroup.get('selectedseverityId').value);
  }

  public onCloseForm() {
    this._ngbActiveModal.close();
  }

}
