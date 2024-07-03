import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../@core/common-helper';
import { WorkTasksService } from '../worktasks.service';
import * as moment from 'moment';
import { Entity } from '../../../@core/enum';

@Component({
  selector: 'ngx-work-task-import-dialog',
  templateUrl: './work-task-import-dialog.component.html',
  styleUrls: ['./work-task-import-dialog.component.scss']
})
export class WorkTaskImportDialogComponent implements OnInit {

  @ViewChild('fileInput', { static: false }) fileInput;
  @ViewChild('labelImport', { static: false }) labelImport;

  @Input() entityWorkflowId: number;
  @Input() isShowParentEntityDropdown: boolean = true;

  fileContents: any[] = [];
  fileNames: any[] = [];

  hasFilePosted: boolean = false;

  importErrorMessage: string;

  coreEntities: any[] = [];
  selectedCoreEntity: any = null;

  submitted: boolean = false;
  constructor(
    private _ngbActiveModal: NgbActiveModal,
    private _commonHelper: CommonHelper,
    private _workTaskService: WorkTasksService) { }

  ngOnInit(): void {
    if (this.isShowParentEntityDropdown) {
      this.coreEntities = this._commonHelper.entityTypeList.filter(x => x.isCoreEntity && x.id != Entity.WorkTasks).map(x => ({ 'label': x.displayName, 'value': x.id }));

      //hide dropdown if there is only one entity
      if(this.coreEntities != null && this.coreEntities.length == 1){
        this.selectedCoreEntity = this.coreEntities[0];
        this.isShowParentEntityDropdown = false;
      }
    }
  }

  onFileUpload(files: FileList) {
    if (files && files.length > 0) {
      this.importErrorMessage = "";
      //read files
      this.readFile(files[0]);
      this.fileNames.push(files[0].name)
      this.hasFilePosted = this.fileInput == null ? false : true;
      this.labelImport.nativeElement.innerText = Array.from(files)
        .map((f) => {
          if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.IMPORT_DIALOG.FILE_FORMAT_ERROR'));
            this.cancelBulkImport();
          }
          else {
            return f.name;
          }
        })
        .join(', ');
    }
  }

  //read file
  readFile(file: any) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.fileContents.push(reader.result);
    };
  }

  // download import template
  getTemplateFile() {
    this.submitted = true;

    if(this.isShowParentEntityDropdown && this.selectedCoreEntity == null){
      return;
    }
    this._commonHelper.showLoader();
    this._workTaskService.downloadImportTemplate(this.entityWorkflowId, this.selectedCoreEntity).then((base64String: any) => {
      let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64';
      const blobData = this.convertBase64ToBlobData(base64String, contentType);
      let filename = this._commonHelper.getConfiguredEntityName('{{WorkTasks_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('WORKTASK.IMPORT_DIALOG.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + moment().format("YYYY-MM-DDTHH:mm:ss") + '.xlsx';
      const blob = new Blob([blobData], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      // window.open(url);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      this._commonHelper.hideLoader();
    }, error => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  // convert base 64 string to BLOB
  convertBase64ToBlobData(base64Data: string, contentType: string = 'image/png', sliceSize = 512) {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }


  importBulkWorkTasks(importOption: string): void {
    this.submitted = true;

    if(this.isShowParentEntityDropdown && this.selectedCoreEntity == null){
      return;
    }

    this._commonHelper.showLoader();
    // check if file is selected or not
    if (this.fileInput.nativeElement.files.length == 0) {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('WORKTASK.IMPORT_DIALOG.SELECT_FILE_ERROR'));
      return;
    }

    //prepare parameters with file name and content
    let params: any = {
      entityWorkflowId: this.entityWorkflowId,
      parentEntityTypeId: this.selectedCoreEntity,
      fileContent: this.fileContents[0],
      fileName: this.fileNames[0]
    }

    this._workTaskService.importBulkworkTasks(params).then((response: any) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('WORKTASK.IMPORT_DIALOG.SUCCESS_MESSAGE'));
      this.onCloseForm(true);
    },
      (error) => {
        this.cancelBulkImport();
        this._commonHelper.hideLoader();
        if (error.messageCode == 'Import.Validation')
          this.importErrorMessage = error.message;
        else
          this._commonHelper.showToastrError(error.message);
      });
  }

  cancelBulkImport() {
    this.fileInput.nativeElement.value = '';
    this.hasFilePosted = false;
    this.labelImport.nativeElement.innerText = 'No file chosen';
    this.fileContents = [];
    this.fileNames = [];
  }

  //for close form
  onCloseForm(status: boolean) {
    this._ngbActiveModal.close(status);
  }

  getTranslateErrorMessage(error) {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('WORKTASKS.' + error.messageCode.replace('.', '_').toUpperCase())
      );
    }
  }

}
