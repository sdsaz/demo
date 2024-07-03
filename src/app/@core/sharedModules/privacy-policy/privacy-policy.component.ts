import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss']
})
export class PrivacyPolicyComponent implements OnInit {

  constructor(private _ngbActiveModal: NgbActiveModal) { }

  ngOnInit() {
  }
  
  //for close form
  public onCloseForm() {
    this._ngbActiveModal.close();
  }
}
