import { Component, Input, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../../@core/common-helper';
import { ProductsService } from '../products.service';
import * as moment from 'moment';

@Component({
  selector: 'ngx-product-import-dialog',
  templateUrl: './product-import-dialog.component.html',
  styleUrls: ['./product-import-dialog.component.scss']
})
export class ProductImportDialogComponent {

  @ViewChild('fileInput', { static: false }) fileInput;
  @ViewChild('labelImport', { static: false }) labelImport;

  @Input() entityWorkflowId: number = 0;

  private fileContents: any[] = [];
  private fileNames: string[] = [];

  hasFilePosted: boolean = false;

  importErrorMessage: string;

  constructor(
    private _ngbActiveModal: NgbActiveModal,
    private _commonHelper: CommonHelper,
    private _produtService: ProductsService) { }

  //#region Events
  onFileUpload(files: FileList): void {
    if (files && files.length > 0) {
      this.importErrorMessage = "";
      //read files
      this.readFile(files[0]);
      this.fileNames.push(files[0].name)
      this.hasFilePosted = this.fileInput ? true : false;
      this.labelImport.nativeElement.innerText = Array.from(files)
        .map(f => {
          if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.IMPORT_DIALOG.FILE_FORMAT_ERROR'));
            this.cancelBulkImport();
          } else {
            return f.name;
          }
        }).join(', ');
    }
  }

  getTemplateFile(): void {
    this._commonHelper.showLoader();
    this._produtService.downloadImportTemplate(this.entityWorkflowId).then((base64String: any) => {
      let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64';
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(this.convertBase64ToBlobData(base64String, contentType));
      link.download = this._commonHelper.getConfiguredEntityName('{{Products_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('PRODUCTS.IMPORT_DIALOG.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + moment().format("YYYY-MM-DDTHH:mm:ss") + '.xlsx';
      link.click();
      this._commonHelper.hideLoader();
    }, error => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  importBulkProducts(): void {
    if (this.fileInput.nativeElement.files.length == 0) {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('PRODUCTS.IMPORT_DIALOG.SELECT_FILE_ERROR'));
      return;
    }
    
    let params: any = {
      fileContent: this.fileContents[0],
      fileName: this.fileNames[0],
      workflowId: this.entityWorkflowId
    }

    this._commonHelper.showLoader();
    this._produtService.importBulkProducts(params)
      .then(() => {
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('PRODUCTS.IMPORT_DIALOG.SUCCESS_MESSAGE'));
        this._commonHelper.hideLoader();
        this.onClose(true);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.cancelBulkImport();        
        if (error.messageCode == 'Import.Validation')
          this.importErrorMessage = error.message;
        else
          this._commonHelper.showToastrError(error.message);
      });
  }

  onClose(status: boolean): void {
    this._ngbActiveModal.close(status);
  }

  //#endregion

  //#region Private methods
  private readFile(file: any): void {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.fileContents.push(reader.result);
    };
  }

  private convertBase64ToBlobData(base64Data: string, contentType: string = 'image/png', sliceSize = 512): Blob {
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

    return new Blob(byteArrays, { type: contentType });
  }

  private cancelBulkImport(): void {
    this.fileInput.nativeElement.value = '';
    this.hasFilePosted = false;
    this.labelImport.nativeElement.innerText = 'No file chosen';
    this.fileContents = [];
    this.fileNames = [];
  }

  private getTranslateErrorMessage(error): void {
    if (error != null && error.messageCode) {
      if (error.messageCode.toLowerCase() == 'products.duplicate') {
        this._commonHelper.showToastrError(error.message);
      }
      else {
        this._commonHelper.showToastrError(
          this._commonHelper.getInstanceTranlationData('PRODUCTS.' + error.messageCode.replace('.', '_').toUpperCase())
        );
      }
    }
  }
  //#endregion
}
