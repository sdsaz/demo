import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ngx-workflow-assign-dialog',
  templateUrl: './workflow-assign-dialog.component.html',
  styleUrls: ['./workflow-assign-dialog.component.scss']
})
export class WorkflowAssignDialogComponent implements OnInit {

    @Input() workflowId: number = null;
    @Input() workflows: any;
    @Input() dialogTitle: string = '';
    @Input() workflowSelectLabel: string = '';
    @Input() workflowSelectPlaceholder: string = '';

    @Output() OnSubmitAssignWorkflow: EventEmitter<any> = new EventEmitter();
  
    workflowFormGroup: UntypedFormGroup;
  
    constructor(private _ngbActiveModal: NgbActiveModal, private fb: UntypedFormBuilder) { }
  
    ngOnInit() {
      this.workflowFormGroup = this.fb.group({
        selectedWorkflowId: [this.workflowId && this.workflowId > 0 ? this.workflowId : undefined, [Validators.required]]
      });
    }
  
    onSubmitChange() {
      this.OnSubmitAssignWorkflow.emit(this.workflowFormGroup.get('selectedWorkflowId').value);
    }
  
    public onCloseForm() {
      this._ngbActiveModal.close();
    }

}
