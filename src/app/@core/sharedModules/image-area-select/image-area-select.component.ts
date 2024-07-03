import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonHelper } from '../../common-helper';

@Component({
  selector: 'app-image-area-select',
  templateUrl: './image-area-select.component.html',
  styleUrls: ['./image-area-select.component.scss']
})
export class ImageAreaSelectComponent implements OnInit {
  selectedFileName: string = "No image selected";
  imageChangedEvent: any = '';
  croppedImage: any = '';
  dialogTitle: any = 'Select Image';
  kbytes: number;
  imageSize:number;
  base64Str: any;
  params: any;


  constructor(
    //public matDialogRef: MatDialogRef<ImageAreaSelectComponent>,
    //public _matDialog: MatDialog
    private activeModal: NgbActiveModal,
    private _commonHelper: CommonHelper) { 
    }

  ngOnInit() {
  }

  fileChangeEvent(event: any): void {
    if(event.srcElement != null && event.srcElement.files.length > 0){
      this.imageSize= parseInt(((event.target.files[0].size) / (1024*1024)).toFixed(2));
      
      if(this.imageSize > 10)
      {
        this._commonHelper.showToastrWarning(this._commonHelper.getInstanceTranlationData('COMMON.MESSAGE_INVALID_SIZE_IMAGE'));
        return;
      }     
      if(event.srcElement.files[0].type.split('/')[0] != 'image'){
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.MESSAGE_INVALID_IMAGE'));
          return;
      }
    } 
    this.imageChangedEvent = event;
    this.selectedFileName = event.currentTarget.value
    this.selectedFileName = this.selectedFileName.replace("C:\\fakepath\\", "");
  }
  imageCropped(image: string) {
    this.croppedImage = image;
    this.params = {
      fileName: this.selectedFileName,
      imageBase64: image
    }
  }
  imageLoaded() {
    // show cropper
  }
  loadImageFailed() {
    // show message
  }

  saveImage(formData) {
  
   // console.log(this.imageSize);
    // this.matDialogRef.close(formData);
    this.activeModal.close(formData);
  }

  closeForm() {
    this.activeModal.close();
  }
  
}
