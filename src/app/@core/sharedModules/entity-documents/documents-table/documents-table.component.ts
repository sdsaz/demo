import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonHelper } from '../../../common-helper';
import { DocumentService } from '../../../sharedComponents/documents/document.service';
import { Table } from 'primeng/table';
import { ConfirmationDialogService } from '../../confirmation-dialog/confirmation-dialog.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Actions, UserTypeID } from '../../../enum';
import { CarouselComponent } from '../../carousel/carousel/carousel.component';
import { CarouselAdapterService } from '../../../sharedServices/carousel-adapter.service';
import { Carousel } from '../../../sharedModels/carousel';
import { FileUploadDialogComponent } from '../../../sharedComponents/file-upload-dialog/file-upload-dialog.component';

@Component({
  selector: 'ngx-documents-table',
  templateUrl: './documents-table.component.html',
  styleUrls: ['./documents-table.component.scss']
})
export class DocumentsTableComponent implements OnInit, OnChanges {

  @ViewChild('pTable') private dt: Table;

  @Input() entityTypeID: number = 0;
  @Input() entityID: number = 0;
  @Input() enableSearch: boolean = true;
  @Input() documentTypeList: any[] = [];
  @Input() isEditPermission: boolean = false;
  @Input() privacyLevel?: number;
  @Input() entityRecordTypeId?: number = null;
  @Input() entityRecordTypeHeader: string;
  @Input() refreshFileList: boolean = false;

  @Input('isDocumentDownloadPermission') isDocumentDownloadPermission: boolean = false;

  @Output('isRefreshDocumentList') isRefreshDocumentList = new EventEmitter<any>();

  _loggedInUser: any;
  entityFileList: any[] = [];
  cols: any[];
  tableData: any[];
  totalRecords: number;

  documentLoader: boolean = false;
  userTypeID = UserTypeID;

  rowActionButtonMouseHoverFlag: boolean = false;

  //paginator
  totalPages: number;
  start: number;
  end = 0;
  first = 0;

  dataSearch = {
    params: {
      "entityTypeID": this.entityTypeID,
      "entityID": this.entityID,
      "pageNo": 1,
      "pageSize": 20,
      "searchString": "",
      "sortColumn": "Created",
      "sortOrder": "DESC",
      "entityRecordTypeId":  this.entityRecordTypeId 
    }
  }


  //subcriptions
  private searchValueChanged: Subject<string> = new Subject<string>();
  private searchBoxSubscription: Subscription;

  //dialog ng model ref model
  modalRef: NgbModalRef | null;

  //option for confirm dialog settings
  optionsForConfirmDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  isAllSelectedItems: boolean = false;
  isItemSelected: boolean = false;
  isShowEntityRecordSubTypeColumn: boolean;

  // isDocumentDownloadPermission: any;
  constructor(public _commonHelper: CommonHelper,
    private _documentService: DocumentService,
    private _confirmationDialogService: ConfirmationDialogService,
    private _modalService: NgbModal,
    private _carouselAdapterService: CarouselAdapterService
  ) {
    this.setColumns(); 
  }
  

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.documentTypeList && changes.documentTypeList.currentValue != changes.documentTypeList.previousValue) {
      this.cols.find(x => x.field == 'entityRecordSubTypeName').visible = this.documentTypeList.length > 0;
    }

    if (changes.refreshFileList && !changes.refreshFileList.firstChange && changes.refreshFileList.currentValue != changes.refreshFileList.previousValue) {
      this.getEntityFileList();
    }

  }
  ngOnInit(): void {
    this.subscribeSearchBoxEvent();
    
    this.getEntityFileList();
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    //set Action column show/hide dynamically
    if(!this.isDocumentDownloadPermission && !this.isEditPermission)
      {
        let entityNameColumn = this.cols.find(c => c.field == 'id');
        entityNameColumn.visible = false;
        console.log(entityNameColumn.visible);
      }
  }

  setColumns(): void {
    //table layout fields set
    this.cols = [
      { field: 'fileIcon', header: '', visible: true, sort: false, class: "action", display: 'td-display' },
      { field: 'name', header: 'COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.FILE_NAME', visible: true, sort: true },
      { field: 'entityRecordSubTypeName', header: 'COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.SUB_TYPE_NAME', visible: true, sort: true },
      { field: 'description', header: 'COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.DESCRIPTION', visible: true, sort: false },
      { field: 'created', header: 'COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.UPLOADED_ON', visible: true, sort: true },
      { field: 'createdBy', header: 'COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.UPLOADED_BY', visible: true, sort: true },
      { field: 'id', header: '', visible: true, sort: false, class: "action" },
    ];
    this._commonHelper.getTranlationData('dummyKey')
      .then(() => {
        this.cols.forEach(item => {
          item.header = this._commonHelper.getInstanceTranlationData(item.header);
        });
      });
  }

  private getEntityFileList() {
    this.documentLoader = true;
    this.dataSearch.params.entityID = this.entityID !== 0 ? this.entityID : this.entityID;
    this.dataSearch.params.entityTypeID = this.entityTypeID !== 0 ? this.entityTypeID : this.entityTypeID;
    this.dataSearch.params.entityRecordTypeId = this.entityRecordTypeId !== 0 ? this.entityRecordTypeId : this.entityRecordTypeId;
    this._documentService.getEntityFileList(this.dataSearch.params).then((response: any[]) => {
      this.entityFileList = response;
      this.totalRecords = this.entityFileList.length > 0 ? response[0].totalRecords : 0;
      this.dt.rows = this.dataSearch.params.pageSize;
      this.totalPages = Math.ceil(this.totalRecords / this.dataSearch.params.pageSize);
      this.end = this.dataSearch.params.pageNo == this.totalPages ? this.totalRecords : this.dataSearch.params.pageNo * this.dataSearch.params.pageSize;
      this.start = this.end == this.totalRecords ? (this.totalRecords - this.entityFileList.length + 1) : (this.end - this.dataSearch.params.pageSize) + 1;

      this.setDocumentData();
      this.documentLoader = false;
      this.isAllSelectedItems = false;
      this.entityFileList.forEach(x => x.isSelected = false);
    }, (error) => {
      this.documentLoader = false;
      this._commonHelper.showToastrError(error.message);
    });
  };

  private setDocumentData() {
    if (this.entityFileList && this.entityFileList.length > 0) {
      this.entityFileList.forEach(item => {
        if (item?.filePath) {
          item.iconName = this.getDocumentIcon(item.filePath);
        }
      });
    }
  }

  //Find document extension and return document icon class
  getDocumentIcon(documentName): string {
    let iconName = 'far fa-file-alt';
    let fileExtension = documentName.substr((documentName.lastIndexOf('.') + 1)).toLowerCase();
    if (fileExtension == 'jpg' || fileExtension == 'jpeg' || fileExtension == 'png' || fileExtension == 'bmp' || fileExtension == 'gif') {
      iconName = 'far fa-file-image';
    } else if (fileExtension == 'pdf') {
      iconName = 'far fa-file-pdf';
    } else if (fileExtension == 'doc' || fileExtension == 'docx') {
      iconName = 'far fa-file-word';
    } else if (fileExtension == 'xls' || fileExtension == 'xlsx') {
      iconName = 'far fa-file-excel';
    } else if (fileExtension == 'zip' || fileExtension == 'rar') {
      iconName = 'fas fa-file-archive';
    } else if (fileExtension == 'ppt' || fileExtension == 'pptx') {
      iconName = 'fas fa-file-powerpoint';
    } else if (fileExtension == 'csv') {
      iconName = 'fas fa-file-csv';
    } else if (fileExtension == 'avi' || fileExtension == 'wmv' || fileExtension == 'mov' || fileExtension == 'mp4' || fileExtension == 'webm' || fileExtension == 'ogg' || fileExtension == '3gp') {
      iconName = 'fa-solid fa-file-video';
    }
    else if (fileExtension == 'wav' || fileExtension == 'mpeg' || fileExtension == 'mp3' || fileExtension == 'mp4' || fileExtension == 'ogg' || fileExtension == 'webm' || fileExtension == 'flac') {
      iconName = 'fa-regular fa-file-audio';
    }

    return iconName;
  }

  viewDocument(documentID: number) {

    this.documentLoader = true;

    const payload = {
      entityID : this.entityID,
      entityTypeID : this.entityTypeID,
      entityRecordTypeId : this.entityRecordTypeId,
      pageNo : 1,
      pageSize: 100000,
      searchString: this.dataSearch.params.searchString,
      sortColumn: this.dataSearch.params.sortColumn,
      sortOrder: this.dataSearch.params.sortOrder
    };

    this._documentService.getEntityFileList(payload).then((files: any[]) => {
      this.documentLoader = false;
      if (files && files.length > 0) {
        const index = this._commonHelper.findIndex(files, 'id', documentID);
        if (index < 0) {
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.FILE_NOT_EXISTS'));
        } else {
        this.optionsForPopupDialog.size = 'xl';
        this.optionsForPopupDialog.windowClass = "document-viewer-dialog carousel-dialog";
        this.modalRef = this._modalService.open(CarouselComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.fileList = this.convertArrayToCarouselModel(files);
        this.modalRef.componentInstance.activeIndex = index;
        this.modalRef.componentInstance.isDocumentDownloadPermission = this.isDocumentDownloadPermission;
        this.modalRef.componentInstance.entityTypeID = this.entityTypeID;
        }
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.FILE_NOT_EXISTS'));
      }
    }, (error) => {
      this.documentLoader = false;
      this.getTranslateErrorMessage(error);
    });
  }

  //open document dialog box for document update
  openDocumentDialog(documentId: number) {
    this._commonHelper.showLoader();
    this._documentService.getDocumentDetailById({ id: documentId }).then((response: any) => {
      this._commonHelper.hideLoader();
      if (response && response != '') {
        this.openEditDocumentPopup(documentId, response);
      }
    }, (error) => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
      this.getEntityFileList();
    });
  }

  private openEditDocumentPopup(documentId: number, documentResponse: any) {
    this.optionsForPopupDialog.size = 'lg';
    this.modalRef = this._modalService.open(FileUploadDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.action = Actions.Edit;
    this.modalRef.componentInstance.fileDto = documentResponse;
    this.modalRef.componentInstance.documentTypeList = this.documentTypeList;

    this.modalRef.result.then((response: any[]) => {
      if (response) {
        this.isRefreshDocumentList.emit(response);
      }
    });
  }

  //delete document file
  deleteDocument(documentId) {
    //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.MESSAGE_CONFIRM_DELETE_DOCUMENTS', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          let params = {
            id: documentId
          }
          this._commonHelper.showLoader();
          this._documentService.deleteDocument(params).then(() => {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.MESSAGE_DOCUMENT_DELETE'));
            this.isRefreshDocumentList.emit({ 'sourceEntityRecordType' : this.entityRecordTypeId });
          }, (error) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error);
            this.getEntityFileList();
          });
        }
      })
  }

  downloadDocument(documentId) {
    if (this.isDocumentDownloadPermission) {
      this._commonHelper.showLoader();
      let params = { id: documentId };
      this._documentService.DownloadFileById(params).then((response: any) => {
        this._commonHelper.hideLoader();
        if (response && response != '') {
          this._commonHelper.downloadFile(response.fileName, response.mimeType, response.contents);
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.MESSAGE_DOCUMENT_DOWNLOAD'));
        }
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error);
      });
    }
  }

  getTranslateErrorMessage(error) {
    if (error && error.messageCode) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ENTITY_DOCUMENTS.DOCUMENT_TABLE.' + error.messageCode.replaceAll('.', '_').toUpperCase()));
    }
  }

  paginate(event) {
    this.dataSearch.params.pageNo = (event.first / event.rows) + 1;
    this.dataSearch.params.pageSize = event.rows;
    this.getEntityFileList();
  }

  ChangeOrder(column) {
    if (column.sort) {
      if (this.dt.sortOrder == 1) {
        this.dataSearch.params.sortOrder = "ASC";
      }
      else {
        this.dataSearch.params.sortOrder = "DESC";
      }
      this.dataSearch.params.sortColumn = this.dt.sortField;
      this.getEntityFileList();
    }
  }

  // go to previous page
  prev() {
    this.dataSearch.params.pageNo = this.dataSearch.params.pageNo - 1 > 0 ? this.dataSearch.params.pageNo - 1 : 1;
    if (this.end == this.dataSearch.params.pageSize) {
      return false;
    }
    this.getEntityFileList();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  changePage() {
    if (this.dataSearch.params.pageNo <= this.totalPages && this.dataSearch.params.pageNo > 0) {
      this.dataSearch.params.pageNo = this.dataSearch.params.pageNo > 0 ? this.dataSearch.params.pageNo : 1;
      this.getEntityFileList();
    }
    else if (this.dataSearch.params.pageNo > this.totalPages) {
      this.dataSearch.params.pageNo = this.totalPages;
    }
    else if (this.dataSearch.params.pageNo <= 0) {
      this.dataSearch.params.pageNo = 1;
    }
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  // go to next page
  next() {
    this.dataSearch.params.pageNo = (this.dataSearch.params.pageNo + 1) <= this.totalPages ? this.dataSearch.params.pageNo + 1 : this.totalPages;
    if (this.end == this.totalRecords) {
      return false;
    }
    this.getEntityFileList();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  resetPaginator() {
    this.dataSearch.params.pageNo = 1;
    if (this.end == this.dataSearch.params.pageSize) {
      return false;
    }
    this.getEntityFileList();
    $('.p-datatable-wrapper').animate({ scrollTop: 0 }, 'fast');
  }

  onRowActionButtonMouseEnter() {
    this.rowActionButtonMouseHoverFlag = true;
  }

  onRowActionButtonMouseLeave() {
    this.rowActionButtonMouseHoverFlag = false;
  }

  search(val: string): void {
    this.searchValueChanged.next(val || '');
  }

  private subscribeSearchBoxEvent(): void {
    this.searchBoxSubscription = this.searchValueChanged
      .pipe(
        debounceTime(1000),
        distinctUntilChanged()
      ).subscribe((val) => {
        this.dataSearch.params.pageNo = 1;
        this.dataSearch.params.searchString = val;
        this.getEntityFileList();
      });
  }

  isAllSelected() {
    const selectedDocumentListCount = this.entityFileList.filter(x => x.isSelected).length;
    if (this.entityFileList.length == selectedDocumentListCount) {
      this.isAllSelectedItems = true;
    } else {
      this.isAllSelectedItems = false;
    }
  }

  checkUncheckAll() {
    if(this.entityFileList.length > 0) {
      this.entityFileList.forEach(item => {
        item.isSelected = this.isAllSelectedItems;
      });
    }
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }

  bulkDownload() {
    if (this.entityFileList.filter(x => x.isSelected).length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.MESSAGE_SELECT_DOCUMENT_DOWNLOAD'));
      return;
    }

    if (!this.isDocumentDownloadPermission) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.MESSAGE_DOCUMENT_DOWNLOAD_PERMISSION'));
      return;
    }
    
    const distinctDocument = [...new Set(this.entityFileList.filter(x => x.isSelected).map((x: any) => (x.id)))];

    if (this.isDocumentDownloadPermission) {
      //added property name of file id 
      distinctDocument.forEach((el: any) => {
        distinctDocument.push({ 'fileId': el });
      });

      //pass file id
      distinctDocument.forEach((fileId: any) => {
        if (fileId) {
          this.downloadDocument(fileId);
        }
      })
    }
    this.entityFileList.forEach(x => x.isSelected = false);
    this.isAllSelectedItems = false;
  }

  bulkEdit() {
    if (this.entityFileList.filter(x => x.isSelected).length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.MESSAGE_SELECT_DOCUMENT'));
      return;
    }
    //find out selected record
    let distinctDocument: any = [...new Set(this.entityFileList.filter(x => x.isSelected))];
    let selectedRecords = distinctDocument.map((item: any) => ({
      fileId: item?.id,
      entityRecordTypeID: item?.entityRecordTypeID,
      entityRecordSubTypeID: item?.entityRecordSubTypeID,
      entityID: item?.entityID,
      entityTypeID: item?.entityTypeID,
      name: item?.name,
      isPrivate: item?.isPrivate
    }));
    
    this.optionsForPopupDialog.size = 'lg';
    this.modalRef = this._modalService.open(FileUploadDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.action = Actions.BulkEdit;
    this.modalRef.componentInstance.bulkData = selectedRecords;
    this.modalRef.componentInstance.documentTypeList = this.documentTypeList;

    this.modalRef.result.then((response: any) => {
      if (response) {
        this.isRefreshDocumentList.emit(response);
      }
    });
    this.entityFileList.forEach(x => x.isSelected = false);
    this.isAllSelectedItems = false;
  }

  bulkDelete() {
    if (this.entityFileList.filter(x => x.isSelected).length == 0) {
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.MESSAGE_SELECT_DOCUMENT_DELETE'));
      return;
    }

    //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._commonHelper.showLoader();
    this._confirmationDialogService.confirm(this._commonHelper.getInstanceTranlationData("COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.MESSAGE_BULK_DELETE"), null, null, optionsForConfirmDialog).then((confirmed) => {
      if (confirmed) {
        let params;
        //find out selected record
        const distinctDocument = [...new Set(this.entityFileList.filter(x => x.isSelected).map((x: any) => x.id))];
        params = distinctDocument.toString();
        this._documentService.bulkDeleteFiles(params).then((response: any) => {
          if(response) {
            this.isRefreshDocumentList.emit({ 'sourceEntityRecordType' : this.entityRecordTypeId });
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('COMMON.ENTITY_DOCUMENTS.DOCUMENT_TABLE.MESSAGE_DOCUMENT_DELETE'));
          }
        }, (error: any) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error);
        })
      }
    })
    this._commonHelper.hideLoader();
  }

  //#region Private Methods
  convertArrayToCarouselModel(arr: any[]): Carousel[] {
    return arr.map(item => this._carouselAdapterService.adapt(item));
  }
  //#endregion
}
