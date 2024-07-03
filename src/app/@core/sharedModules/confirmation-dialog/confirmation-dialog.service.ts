import { Injectable } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ConfirmationDialogComponent } from './confirmation-dialog.component';

@Injectable()
export class ConfirmationDialogService {

  title: string = 'COMMON.CONFIRMATION_DIALOG.TITLE';
  //Confirm Deletion
  btnOkDefaultText: string = 'COMMON.CONFIRMATION_DIALOG.BUTTON_CONFIRM';
  btnCancelDefaultText: string = 'COMMON.CONFIRMATION_DIALOG.BUTTON_CANCEL';

  constructor(private modalService: NgbModal) { }

  public confirm(
    message: string, 
    btnOkText:string,  
    btnCancelText:string,
    optionsForPopupDialog: any,
    hasHtmlMessageText: boolean = false): Promise<boolean> {
    const modalRef = this.modalService.open(ConfirmationDialogComponent, optionsForPopupDialog);
    modalRef.componentInstance.title = this.title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.btnOkText = btnOkText != null ? btnOkText : this.btnOkDefaultText;
    modalRef.componentInstance.btnCancelText = btnCancelText != null ? btnCancelText : this.btnCancelDefaultText;
    modalRef.componentInstance.hasHtmlMessageText = hasHtmlMessageText;
    //modalRef.componentInstance.backdrop ='static'
    return modalRef.result;
  }
}
