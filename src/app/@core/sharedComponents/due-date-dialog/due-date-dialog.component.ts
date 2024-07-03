import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { CommonHelper } from '../../common-helper';
import * as moment from 'moment';

@Component({
  selector: 'ngx-due-date-dialog',
  templateUrl: './due-date-dialog.component.html',
  styleUrls: ['./due-date-dialog.component.scss']
})
export class DueDateDialogComponent implements OnInit {

  /**
   * If DueDate 
   */
   @Input() dueDate: Date;
 
   //#region Dialog Translation Related Properties
   /**
    * For the dialog title
    */
   @Input() dialogTitle: string = '';
   /**
    * For User dropdown label
    */
   @Input() dueDateSelectLabel: string = '';
   /**
    * For User dropdown placeholder
    */
   @Input() dueDateSelectPlaceholder: string = '';
   //#endregion
 
   /**
    It will give call back to the parent component on assign user
    with new AssignedUserId or Selected Id as callback result
    */
   @Output() OnSubmitChangeDueDate: EventEmitter<any> = new EventEmitter();
 
   dueDateFormGroup: UntypedFormGroup;
 
   constructor(private _ngbActiveModal: NgbActiveModal, private fb: UntypedFormBuilder, public _commonHelper: CommonHelper) { }
   private currentDate = new Date();
   public getCurrentDate() {
    return this.currentDate;
}
 
   ngOnInit() {
     this.dueDateFormGroup = this.fb.group({
      selectedDueDate: [this.dueDate!=null? moment(new Date(this.dueDate)).toDate(): this.dueDate, [Validators.required]]
     });
   }
 
   onSubmitChange() {
     this.OnSubmitChangeDueDate.emit(this.dueDateFormGroup.get('selectedDueDate').value);
   }
 
   public onCloseForm() {
     this._ngbActiveModal.close();
   }
 

}
