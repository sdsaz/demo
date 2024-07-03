import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-user-assign-dialog',
  templateUrl: './user-assign-dialog.component.html',
  styleUrls: ['./user-assign-dialog.component.scss']
})
/**
 * @description
 * Provide user selection capabilities
 */
export class UserAssignDialogComponent implements OnInit {

  /**
   * Assigned user id
   * If Assigned 
   */
   @Input() assignedUserId: number;
   /**
    * Assignable User List
    */
   @Input() users: any = [];
 
   //#region Dialog Translation Related Properties
   /**
    * For the dialog title
    */
   @Input() dialogTitle: string = '';
   /**
    * For User dropdown label
    */
   @Input() userSelectLabel: string = '';
   /**
    * For User dropdown placeholder
    */
   @Input() userSelectPlaceholder: string = '';
   //#endregion
 
   /**
    It will give call back to the parent component on assign user
    with new AssignedUserId or Selected Id as callback result
    */
   @Output() OnSubmitAssignUser: EventEmitter<any> = new EventEmitter();
 
   userFormGroup: UntypedFormGroup;
 
   constructor(private _ngbActiveModal: NgbActiveModal, private fb: UntypedFormBuilder) { }
 
   ngOnInit() {
     this.userFormGroup = this.fb.group({
       assignUserId: [this.assignedUserId && this.assignedUserId > 0 ? this.assignedUserId : undefined, [Validators.required]]
     });
   }
 
   onSubmitAssign() {
     this.OnSubmitAssignUser.emit(this.userFormGroup.get('assignUserId').value);
   }
 
   public onCloseForm() {
     this._ngbActiveModal.close();
   }
}
