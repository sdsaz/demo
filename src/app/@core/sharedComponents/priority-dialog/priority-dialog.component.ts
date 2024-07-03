import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ngx-priority-dialog',
  templateUrl: './priority-dialog.component.html',
  styleUrls: ['./priority-dialog.component.scss']
})
export class PriorityDialogComponent implements OnInit {

   /**
   * If PriorityId 
   */
    @Input() priorityId: number;
    /**
     * Assignable User List
     */
    @Input() priorities: any = [];
  
    //#region Dialog Translation Related Properties
    /**
     * For the dialog title
     */
    @Input() dialogTitle: string = '';
    /**
     * For User dropdown label
     */
    @Input() prioritySelectLabel: string = '';
    /**
     * For User dropdown placeholder
     */
    @Input() prioritySelectPlaceholder: string = '';
    //#endregion
  
    /**
     It will give call back to the parent component on assign user
     with new AssignedUserId or Selected Id as callback result
     */
    @Output() OnSubmitChangePriority: EventEmitter<any> = new EventEmitter();
  
    priorityFormGroup: UntypedFormGroup;
  
    constructor(private _ngbActiveModal: NgbActiveModal, private fb: UntypedFormBuilder) { }
  
    ngOnInit() {
      this.priorityFormGroup = this.fb.group({
        selectedpriorityId: [this.priorityId && this.priorityId > 0 ? this.priorityId : undefined, [Validators.required]]
      });
    }
  
    onSubmitChange() {
      this.OnSubmitChangePriority.emit(this.priorityFormGroup.get('selectedpriorityId').value);
    }
  
    public onCloseForm() {
      this._ngbActiveModal.close();
    }
 
}
