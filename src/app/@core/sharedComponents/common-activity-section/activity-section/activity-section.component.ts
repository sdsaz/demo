//ANGULAR
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
//COMMON
import { DataSources, UserTypeID, LocalStorageKey, Actions } from '../../../../@core/enum';
import { CommonHelper } from '../../../common-helper';
import { RefType, Entity } from '../../../enum';
import { Appointment } from '../common-activity-model';
//COMPONENTS
import { ActivityDialogComponent } from '../../../../@core/sharedComponents/common-activity-section/activity-dialog/activity-dialog.component';
import { NoteDialogComponent } from '../../notes/note-dialog/note-dialog.component';
import { EntityReviewDialogComponent } from '../../entity-review/entity-review-dialog/entity-review-dialog.component';
//SERVICES
import { EntitytagsService } from '../../../../pages/entitytags/entitytags.service';
import { ConfirmationDialogService } from '../../../sharedModules/confirmation-dialog/confirmation-dialog.service';
import { CommonService } from '../../../sharedServices/common.service';
import { DatasourceService } from '../../../sharedServices/datasource.service';
import { DocumentService } from '../../documents/document.service';
import { NoteService } from '../../notes/notes.service';
import { ActivityService } from '../activity.service';
import { EntityTagsViewService } from '../../entity-tags-view/entity-tags-view.service';
import { FileSignedUrlService } from '../../../sharedServices/file-signed-url.service';
import { EntityReviewsService } from '../../entity-review/entity-reviews.service';
//PRIMNG
import { SelectItemGroup } from 'primeng/api';
//OTHER
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { CarouselComponent } from '../../../sharedModules/carousel/carousel/carousel.component';
import { CarouselAdapterService } from '../../../sharedServices/carousel-adapter.service';
import { Carousel } from '../../../sharedModels/carousel';
import { FileUploadDialogComponent } from '../../file-upload-dialog/file-upload-dialog.component';
import { AppointmentService } from '../../../sharedServices/appointment.service';
import { Router } from '@angular/router';


@Component({
  selector: 'activity-section',
  templateUrl: './activity-section.component.html',
  styleUrls: ['./activity-section.component.scss']
})
export class ActivitySectionComponent implements OnInit, OnChanges {

  //#region INPUT/OUTPUT PARAMETERS

  @Input() refreshActivity: boolean;
  @Input() refreshDocument: boolean;
  @Input('entityId') entityId: number;
  @Input('entityTypeId') entityTypeId: number;
  @Input('entityRecordTypeId') entityRecordTypeId: number;
  @Input('isDocumentRequired') isDocumentRequired: boolean = true;
  @Input('isTagRequired') isTagRequired: boolean = true;
  @Input('hideExpandButton') hideExpandButton: boolean = false;
  @Input('isEditPermission') isEditPermission: boolean = true;
  @Input('isDocumentDownloadPermission') isDocumentDownloadPermission: boolean = false;
  
  @Input('isHideDetailsTab') isHideDetailsTab: boolean = true;
  @Input('isHideActivityTab') isHideActivityTab: boolean = false;
  @Input('isHideDocumentTab') isHideDocumentTab: boolean = false;
  @Input('isHideTasksTab') isHideTasksTab: boolean = false;
  @Input('isHideNotesTab') isHideNotesTab: boolean = false;
  @Input('isHideEntityReviewsTab') isHideEntityReviewsTab: boolean = false;
  @Input('isHideAppointmentsTab') isHideAppointmentsTab: boolean = false;
  @Input('isHideTagsTab') isHideTagsTab: boolean = false;
  @Input('showSubTaskCreateOption') showSubTaskCreateOption: boolean = false;
  @Input('showLinkWorkTaskCreateOption') showLinkWorkTaskCreateOption: boolean = false;
  @Input('addWorkTaskCreateOption') addWorkTaskCreateOption: boolean = false;
  @Input('isAddWorkTask') isAddWorkTask: boolean = false;
  @Input('isAddSubWorkTask') isAddSubWorkTask: boolean = false;
  @Input('currencySymbol') currencySymbol: any = null;
  @Input('hoursInDay') hoursInDay: number = 24;
  
  @Input('entityDetailsData') entityDetailsData: any;
  @Input() createdBy: number;
  @Input() privacyLevel: number;
  @Input('isAddOpportunity') isAddOpportunity: boolean = false;
  @Input('isAddCase') isAddCase: boolean = false;
  @Input() isFromKanbanOrListView:boolean = false;

  @Input() keyfieldResponseData: any;

  @Input() isActive: boolean = true;
  @Input() isPaused: boolean = false;
  @Input() isClosedStage: boolean = false;
  @Input() isCompletedStage: boolean = false;
  @Input() isDefault: boolean = false;
  
  @Output('isTagListUpdated') isTagListUpdated = new EventEmitter<boolean>();
  @Output('isActivityListUpdated') isActivityListUpdated = new EventEmitter<boolean>();
  @Output('isFileDeleted') isFileDeleted = new EventEmitter<void>();
  @Output() saveKeyFieldEvent = new EventEmitter<any>();
  @Output() onEntityStageTasksSelect = new EventEmitter<any>();
  @Output() onSubTaskCreate = new EventEmitter<any>();
  @Output() onLinkWorkTaskCreate = new EventEmitter<any>();
  @Output() onAddWorkTask = new EventEmitter<any>();
  @Output() onAddOpportunity = new EventEmitter<any>();
  @Output() onAddCase = new EventEmitter<any>();
  @Output() onCloseActivitySection = new EventEmitter<any>();
  @Output() raiseHandChange = new EventEmitter<any>();
  @Output() pauseOrResumeChanges = new EventEmitter<any>();
  
  userTypeID = UserTypeID;

  //#endregion

  //#region VARIABLE DECLARATION

  //dialog ng model ref model
  modalRef: NgbModalRef | null;
  entityEnum: typeof Entity = Entity;

  //document detail
  documentModel = {
    entityRecordTypeId: null
  }

  //user detail
  _loggedInUser: any;
  localStorageKeyPrefix: string = '';

  //activity drop-down options
  activityOptions: any;
  activitySelected;
  isActivitySubmitted: boolean = false;
  appointmentSubjectName: string = '';

  //activity quick filter(Timespan) drop-down value
  activityQuickFilterOptions: any[] = [];
  activityQuickFilterSelected: any;
  activityDataSource: any = [];
  activityShowLoadMore: boolean = false;
  activityLastStreamId: number = 0;
  activityLastTaskId: number = 0;
  activityLastNoteId: number = 0;
  activityLastEventId: number = 0;
  activityLastTagId: number = 0;
  activityLastEntityReviewId: number = 0;

  documentQuickFilterOptions: any[] = [];
  documentTypeList: any[] = [];
  documentQuickFilterSelected: string = '';
  documentLastRecordId: number = 0;
  documentDataSource: any[] = [];
  documentShowLoadMore: boolean = true;
  documentTotalRecords: number = 0;

  //note type
  noteOptions: any;
  noteNoteTypeId: number = 0;

  //filter-by type options
  filterTypeOptions = [];
  filterTypeSelected: any

  //appointment
  appointmentOptions: any;
  noteAppointmentId: number;
  appointment: Appointment;
  appointmentSubmitted: boolean = false;

  //count current lead appointment
  countCurrentLeadAppointment: number = 0;

  //Tags
  groupedTags: SelectItemGroup[];
  tagList: any[] = [];
  tagName: any[] = [];
  apiRawResponse: any;
  apiResponse: any;
  allTagsList: any[] = [];
  singularTagsList: any[] = [];
  assignedTagIds: number[] = [];

  //tab variables
  onceActivityTabClicked: boolean = false;
  onceDocumentTabClicked: boolean = false;
  activeTab = '';

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

  showLoadingPanel: number = 0;
  isHandRaised: boolean = false;

  //EntityReviews
  entityReviewRating: number = null;
  //#endregion

  //#region EVENTS & CONSTRUCTOR

  constructor(
    private _modalService: NgbModal,
    private _confirmationDialogService: ConfirmationDialogService,
    public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _activityService: ActivityService,
    private _noteService: NoteService,
    private _documentService: DocumentService,
    private _entitytagsService: EntitytagsService,
    private _dataSourceService: DatasourceService,
    private _entitytagsviewService: EntityTagsViewService,
    private _fileSignedUrlService: FileSignedUrlService,
    private _entityReviewsService: EntityReviewsService,
    private _carouselAdapterService: CarouselAdapterService,
    private _appointmentsService: AppointmentService,
    private _router: Router
  ) {
      
  }

  ngOnChanges(changes: SimpleChanges): void {
    //refresh data
    if (changes != null && changes.entityId != null && changes.entityId.previousValue != undefined && changes.entityId.currentValue != changes.entityId.previousValue) {
      if (changes.entityId.currentValue && changes.entityId.currentValue > 0) {
        this.bindData();
        // Update Active Tab 
        switch (this.activeTab) {
          case 'mainActivity':
            this.loadActivityData(true);
            this.onceActivityTabClicked = true;
            break;
          case 'documents':
            this.loadDocumentData(true);
            this.onceDocumentTabClicked = true;
            break;
          default:
            this.onceDocumentTabClicked = false;
            this.onceActivityTabClicked = false;
            break;
        }
      }
      else{
        if (this.isHideDetailsTab) {
          this.activeTab = 'mainActivity';
        }
        else if (this.isHideDetailsTab && this.isHideActivityTab) {
          this.activeTab = 'documents'
        }
        else{
          this.activeTab = 'mainDetails';
        }

        this.onceDocumentTabClicked = false;
        this.onceActivityTabClicked = false;
      }
    }

    //refresh Activity data
    if (changes != null && changes.refreshActivity != null && changes.refreshActivity.previousValue != undefined && changes.refreshActivity.currentValue != changes.refreshActivity.previousValue && changes.refreshActivity.currentValue) {
      this.bindData();
      this.loadActivityData(true);
    }
    
    //refresh Document data
    if (changes != null && changes.refreshDocument != null && changes.refreshDocument.previousValue != undefined && changes.refreshDocument.currentValue != changes.refreshDocument.previousValue && changes.refreshDocument.currentValue) {
      this.loadDocumentData(true);
    }

    //refresh RecordTypeId
    if (changes != null && changes.entityRecordTypeId?.currentValue != changes.entityRecordTypeId?.previousValue) {
      this.entityRecordTypeId = changes.entityRecordTypeId?.currentValue;
    }
  }

  ngOnInit(): void {
    let keepSectionOpen = this._commonHelper.getCommonActivitySectionState();
    if ($(window).width() > 1200 && !keepSectionOpen) {
      $('#sideActivity').hide();
      $('.details-box').removeClass('col-xl-8 col-lg-12');
      $('.common-box').removeClass('col-xl-4 col-md-12');
      $('.details-box').width('99%');
      $('.common-box').width('1px');
    }
    else if ($(window).width() < 1200) {
      $('#btnToOpenActivity').hide();
      $('#sideActivity').show();
      $('#activityCloseBtn').hide();
      $('.common-box').width('100%');
    }

    this._loggedInUser = this._commonHelper.getLoggedUserDetail();
    
    //Set Local Storage Prefix
    this.localStorageKeyPrefix = `${this._loggedInUser.tenantId}_${this._loggedInUser.userId}`;
    
    if (this.entityRecordTypeId == null || this.entityRecordTypeId == undefined) {
      this.entityRecordTypeId = this.entityDetailsData?.entityRecordTypeId ?? null;
    }

    if (this.entityId && this.entityId > 0) {
      this.appointment = new Appointment({});

      if (this.isHideDetailsTab) {
        this.activeTab = 'mainActivity';
      }
      else if (this.isHideDetailsTab && this.isHideActivityTab) {
        this.activeTab = 'documents'
      }
      else {
        this.activeTab = 'mainDetails';
      }

      this.getDocumentType();
      this.bindData();
    }
  }

  onTagSelectionChange(event): void {
    let singularCatTag = this.singularTagsList.find(stl => stl.id == event.itemValue);
    if (singularCatTag) {
      let alreadyAvailableTagCount = this.singularTagsList.filter(stx => stx.tagCategoryId == singularCatTag.tagCategoryId && stx.id != event.itemValue).filter(stf => this.tagName.includes(stf.id) || this.assignedTagIds.includes(stf.id)).length;

      if (alreadyAvailableTagCount > 0) {
        this._commonHelper.showToastrInfo(this._commonHelper.getInstanceTranlationData('ACTIVITY.TAGS.SINGULAR_CATEGORY_TAG_ALREADYEXISTS', {
          category:
            this._commonHelper.getInstanceTranlationData(singularCatTag.tagCategoryName)
        }));
        this.tagName.pop();
      }
    }
  }
  //#endregion

  //#region DOCUMENT

  loadDocumentData(clearAll) {
    if (clearAll) {
      this.documentDataSource = [];
      this.documentTotalRecords = 0;
      this.documentShowLoadMore = true;
      this.documentLastRecordId = 0;
    }

    this.showLoader();
    let params: any = {
      entityTypeId: this.entityTypeId,
      entityId: this.entityId,
      timespanName: this.documentQuickFilterSelected || 'ALLTIME',
      pageSize: 10,
      lastRecordId: this.documentLastRecordId
    }

    if (this.documentModel.entityRecordTypeId != null) {
      params.entityRecordTypeId = this.documentModel.entityRecordTypeId
    }


    this._documentService.getAllDocuments(params).then(
      (response: any) => {
        if (this.documentDataSource && this.documentDataSource.length > 0) {
          this.documentDataSource = this.documentDataSource.concat(response);
        } else {
          this.documentDataSource = response;
          this.documentTotalRecords = this.documentDataSource.length > 0 ? this.documentDataSource[0].totalRecords : 0;
        }

        this._fileSignedUrlService.getFileSingedUrl(this.documentDataSource,'createdByImage', 'createdBySignedUrl',Entity.Users);
        
        if (response.length > 0) {
          this.documentLastRecordId = this.documentDataSource.map(function (e) { return e.id; }).sort()[0];
        }
        if (response.length > 0 && this.documentDataSource.length == this.documentTotalRecords) {
          this.documentShowLoadMore = false;
        }

        if(clearAll){
          this.isActivityListUpdated.emit();
        }
        
        this.setDocumentData();
        this.hideLoader();
      },
      (error) => {
        this.hideLoader();
        this.getTranslateErrorMessage(error, 'DOCUMENTS');
      });
  }

  setDocumentData() {
    if (this.documentDataSource && this.documentDataSource.length > 0) {
      this.documentDataSource.forEach(item => {        
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

  //open document dialog box for document update
  downloadDocument(documentId) {
    if (this.isDocumentDownloadPermission) {
      this.showLoader();
      let params = { id: documentId };
      this._documentService.DownloadFileById(params).then((response: any) => {
        this.hideLoader();
        if (response && response != '') {
          this._commonHelper.downloadFile(response.fileName, response.mimeType, response.contents);
        }
      }, (error) => {
        this.hideLoader();
        this.getTranslateErrorMessage(error, 'DOCUMENTS');
      });
    }
  }

  //open document dialog box for document update
  openDocumentDialog(documentId: number) {
    this.showLoader();
    this._documentService.getDocumentDetailById({ id: documentId }).then((response: any) => {
      this.hideLoader();
      if (response && response != '') {       
        this.openEditDocumentPopup(response);
      }
    }, (error) => {
      this.hideLoader();
      this.getTranslateErrorMessage(error, 'DOCUMENTS');
      this.loadDocumentData(true);
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

    this._confirmationDialogService.confirm('DOCUMENTS.MESSAGE_CONFIRM_DELETE_DOCUMENTS', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          let params = {
            id: documentId
          }
          this.showLoader();
          this._documentService.deleteDocument(params).then(() => {
            this.hideLoader();
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('DOCUMENTS.MESSAGE_DOCUMENT_DELETE'));
            this.isFileDeleted.emit();
            this.isActivityListUpdated.emit();
            this.loadDocumentData(true);
          }, (error) => {
            this.hideLoader();
            this.getTranslateErrorMessage(error, 'DOCUMENTS');
            this.loadDocumentData(true);
          });
        }
      })
  }

  //#endregion  

  //#region TAGS

  fillIsActiveEntityTagsByTagCategory() {
    this.showLoader();
    this._entitytagsService.getActiveEntityTagsByEntityTypeId(this.entityTypeId, this.entityRecordTypeId).then(
      (response: any) => {
        if (response) {
          this.apiRawResponse = response;
          this.getActivatedEntityTagsByAccountId();
        }
        this.hideLoader();
      }, (error) => {
        this.hideLoader();
        this.getTranslateErrorMessage(error, 'TAGS');
      }
    );
  }

  getActivatedEntityTagsByAccountId() {
    let params = {
      entityId: this.entityId,
      entityTypeId: this.entityTypeId,
      entityRecordTypeId: this.entityRecordTypeId
    }

    this.showLoader();
    this._entitytagsviewService.getActivatedEntityTagsByEntityId(params).then((response: any) => {
      if (response) {
        this.assignedTagIds = response.map(tag => tag['id']);
        this.removedAlreadyAssignedTag();
      }
      this.hideLoader();
    }, (error) => {
      this.hideLoader();
    });
  }

  removedAlreadyAssignedTag() {
    if (this.apiRawResponse) {

      this.apiResponse = JSON.parse(JSON.stringify(this.apiRawResponse));
      this.singularTagsList = [];

      this.apiResponse.forEach(res => {
        if (res.isSingular)
          this.singularTagsList.push(...res.entityTagList);
      });

      if (this.assignedTagIds) {
        this.apiResponse.forEach(res => {
          res.entityTagList = res.entityTagList.filter(etl => !this.assignedTagIds.includes(etl["id"]))
        });
        this.apiResponse = this.apiResponse.filter(ar => ar.entityTagList.length > 0);
      }

      this.allTagsList = [];

      this.apiResponse.forEach(res => {

        this.allTagsList.push(...res.entityTagList);

      });

      this.tagName = this.tagName.filter(tid => this.allTagsList.map(atl => atl['id']).includes(tid));
      this.groupedTags = this.apiResponse.map(this.getTags);
    }

  }

  getTags(element: any) {
    let tagDropDownElement: any = {};
    tagDropDownElement.label = element.tagCategoryName;
    let tagList = [];
    element.entityTagList.forEach(tag => {
      tagList.push({ label: tag.name, value: tag.id , groupLabel : tagDropDownElement.label });
    });
    tagDropDownElement.items = tagList;
    return tagDropDownElement;
  }

  setTag() {
    this.isActivitySubmitted = true;
    if (this.tagName == undefined) { return false; }
    this.showLoader();
    let params = { EntityId: this.entityId, TagIds: this.tagName.join(','), EntityTypeId: this.entityTypeId, EntityRecordTypeId: this.entityRecordTypeId }
    this._entitytagsService.saveToEntityTagTracking(params).then(
      (result: any) => {
        this.hideLoader();
        
        if (result && result.length > 0 && result[0]["id"] != null && result[0]["id"] > 0) {
          this._commonHelper.changeEntityTagsCallback(true)
          this.getActivatedEntityTagsByAccountId();
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ACTIVITY.TAGS.MESSAGE_TAG_ADD'));
        }
        this.loadActivityData(true);
        this.isTagListUpdated.emit();
        this.isActivityListUpdated.emit();
      }, (error) => {
        this.hideLoader();
        this.getTranslateErrorMessage(error, 'TAGS');
      }
    );
  }

  onDeleteTag(tagId) {
    //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };
    this._confirmationDialogService.confirm('ACTIVITY.TAGS.MESSAGE_CONFIRM_DELETE_TAGS', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          let params = {
            EntityTypeId: this.entityTypeId,
            EntityId: this.entityId,
            TagId: tagId
          }
          this.showLoader();
          this._entitytagsService.removeExistingEntityTag(params).then((response: any) => {
            this.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('ACTIVITY.TAGS.MESSAGE_TAG_REMOVE')
            );
            if (response) {
              this.getActivatedEntityTagsByAccountId();
              this._commonHelper.changeEntityTagsCallback(true);
            }

            this.loadActivityData(true);
            this.isTagListUpdated.emit();
            this.isActivityListUpdated.emit();
          }, (error) => {
              this.hideLoader();
              this.getTranslateErrorMessage(error, 'TAGS');
            });
        }
      })
  }

  //#endregion 

  //#region NOTES

  getChildFormNote(value: boolean) {
    if (value) {
      this.loadActivityData(true);
      this.isActivityListUpdated.emit();
    }
  }

  onEditNote(noteId) {
    // avoid multiple popup open
    if (this._modalService.hasOpenModals()) {
      return;
    }

    this.optionsForPopupDialog.size = 'md';
    this.modalRef = this._modalService.open(NoteDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.noteMode = "EDIT";
    this.modalRef.componentInstance.noteId = noteId;
    this.modalRef.result.then(response => {
      if (response != undefined) {
        this.loadActivityData(true);
        this.isActivityListUpdated.emit();
      }
    });
  }

  onDeleteNote(noteId) {
    // //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('ACTIVITY.NOTES.MESSAGE_CONFIRM_DELETE_NOTES', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          const params = { id: noteId };
          this.showLoader();
          this._noteService.deleteNote(params).then(() => {
            this.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('ACTIVITY.NOTES.MESSAGE_NOTE_DELETE')
            );
            this.loadActivityData(true);
            this.isActivityListUpdated.emit();
          },
            (error) => {
              this.hideLoader();
              this.getTranslateErrorMessage(error, 'NOTES');
            });
        }
      })
  }
  
  onEditEvent(entityId){
    let eventTypeId: number = Entity.Events;
    // check logged in user have permission to view related entity details
    if (!this._commonHelper.isUserHaveViewPermissionOfRelatedEntity(eventTypeId)) {
      return;
    }

    // if not undefined then redirect
    if (entityId != undefined) {
      this._router.navigate([this._commonHelper.getRouteNameByEntityTypeId(eventTypeId).toLowerCase() + '/details/' + entityId]);
    }
     
  }

  onDeleteEvent(appointmentId) {
    this._confirmationDialogService.confirm('CRM.APPOINTMENT.DETAIL.MESSAGE_CONFIRM_DELETE', null, null, this.optionsForPopupDialog).then((confirmed) => {
      if (confirmed) {
        this._commonHelper.showLoader();
        this._appointmentsService.deleteAppointment(appointmentId).then(() => {
          this._commonHelper.hideLoader();
          this._commonHelper.showToastrSuccess(
            this._commonHelper.getInstanceTranlationData('CRM.APPOINTMENT.DETAIL.MESSAGE_APPOINTMENT_DELETED')
          ); 
          this.loadActivityData(true);
            this.isActivityListUpdated.emit();
        },
          (error: any) => {
            this._commonHelper.hideLoader();
            this.getTranslateErrorMessage(error, 'Appointment');
          }
        );
      }
    });
  }


  //#endregion 

  //#region TASKS

  onCheckDueDate(taskDate, dueDate): boolean {
    if (taskDate != undefined && dueDate != undefined) {
      if (moment(moment(taskDate).format("YYYY-MM-DD")) >= moment(moment(dueDate).format("YYYY-MM-DD"))) {
        return false;
      } else {
        return true;
      }
    }
  }


  onEditTask(taskType, activityID, entityRecordTypeID, eventTypeId = null) {
    let taskTypeId = entityRecordTypeID;
    let title = '';

    if (taskType == 'ACTIVITY') {
      var taskOption = this.activityOptions.find(item => item.id == entityRecordTypeID);
      title = this._commonHelper.getInstanceTranlationData('ACTIVITY.TASKS_DIALOG.' + taskOption.code + '_TITLE');
      this.optionsForPopupDialog.size = "md";

    } 

    // avoid multiple popup open
    if (this._modalService.hasOpenModals()) {
      return;
    }

    this.modalRef = this._modalService.open(ActivityDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.entityId = this.entityId;
    this.modalRef.componentInstance.taskTypeId = taskTypeId;
    this.modalRef.componentInstance.taskType = taskType;
    this.modalRef.componentInstance.title = title;
    this.modalRef.componentInstance.activityID = activityID;
    this.modalRef.componentInstance.activitySubTypeID = entityRecordTypeID;
    this.modalRef.componentInstance.taskMode = "EDIT";
    this.modalRef.componentInstance.eventTypeId = eventTypeId;
    this.modalRef.result.then(response => {
      if (response != undefined) {
        this.loadActivityData(true);
        this.isTagListUpdated.emit();
        this.isActivityListUpdated.emit();
      }
    });
  }

  //custom dialog open for task and appointments(MEETING)
  openActivityTaskDialog(taskType) {
    this.isActivitySubmitted = true;
    if (taskType === 'ACTIVITY') {
      if (this.activitySelected == undefined) {
        return false;
      } else {

        let selectedEntityRecordTypeID = this.activitySelected['id'];
        let selectedEntityRecordTypeName = this.activitySelected['name'];
        this.optionsForPopupDialog.size = "md";

        // avoid multiple popup open
        if (this._modalService.hasOpenModals()) {
          return;
        }

        this.modalRef = this._modalService.open(ActivityDialogComponent, this.optionsForPopupDialog);
        this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
        this.modalRef.componentInstance.entityId = this.entityId;
        this.modalRef.componentInstance.taskType = taskType;
        this.modalRef.componentInstance.entityRecordTypeID = selectedEntityRecordTypeID;
        this.modalRef.componentInstance.title = selectedEntityRecordTypeName;
        this.modalRef.componentInstance.isActivityDropdownReadOnly = false;
        this.modalRef.result.then(response => {
          if (response != undefined) {
            this.loadActivityData(true);
            this.isActivityListUpdated.emit();
          }
        });
      }
    } else if (taskType === 'MEETING') {
      if (this.appointmentSubjectName == '') {
        return false;
      }

      this.optionsForPopupDialog.size = "xl";

      // avoid multiple popup open
      if (this._modalService.hasOpenModals()) {
        return;
      }

      this.modalRef = this._modalService.open(ActivityDialogComponent, this.optionsForPopupDialog);
      this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
      this.modalRef.componentInstance.entityId = this.entityId;
      this.modalRef.componentInstance.taskType = taskType;
      this.modalRef.componentInstance.entityRecordTypeID = this.noteAppointmentId;
      this.modalRef.componentInstance.appointmentSubjectName = this.appointmentSubjectName;
      this.modalRef.componentInstance.title = this._commonHelper.getInstanceTranlationData('ACTIVITY.APPOINTMENTS_DIALOG.TITLE');
      this.modalRef.componentInstance.isActivityDropdownReadOnly = false;
      this.modalRef.result.then(response => {
        this.appointmentSubjectName = '';
        if (response != undefined) {
          this.loadActivityData(true);
          this.isActivityListUpdated.emit();
        }
      });
    }
    this.isActivitySubmitted = false;
  }

  //#endregion 

  //#region EntityReviews
  onAddEditEntityReview(formMode, entityReviewId) {
    // avoid multiple popup open
    if (this._modalService.hasOpenModals()) {
      return;
    }

    this.isActivitySubmitted = true;

    if (formMode == 'Add') {
      //If user has not Selected Ratings then return
      if (!this.entityReviewRating) {
        return;
      }

      this._commonHelper.showLoader();
      this._entityReviewsService.isEntityReviewExistsForEntity(this.entityTypeId, this.entityId).then(response => {
        this._commonHelper.hideLoader();
        if (response) {
          this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ACTIVITY.ENTITYREVIEWS.ENTITYREVIEW_ENTITYREVIEWALREADYEXISTS'));
          this.entityReviewRating = null;
        }
        else {
          this.openEntityReviewDialog();
        }
        this.isActivitySubmitted = false;
      }, (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error, 'ENTITYREVIEWS');
      });
    }
    else {
      this.openEntityReviewDialog(entityReviewId);
      this.isActivitySubmitted = false;
    }
  }

  openEntityReviewDialog(entityReviewId = 0) {
    this.optionsForPopupDialog.size = 'md';
    this.modalRef = this._modalService.open(EntityReviewDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.entityReviewId = entityReviewId;
    this.modalRef.componentInstance.entityTypeId = this.entityTypeId;
    this.modalRef.componentInstance.entityId = this.entityId;
    this.modalRef.componentInstance.rating = this.entityReviewRating;

    this.modalRef.result.then(response => {
      this.entityReviewRating = null;
      if (response != undefined) {
        this.loadActivityData(true);
        this.isActivityListUpdated.emit();
        this._commonHelper.changeEntityReviewDataCallback();
      }
    });
  }

  onDeleteEntityReview(entityReviewId) {
    // //option for confirm dialog settings
    let optionsForConfirmDialog = {
      size: "md",
      centered: false,
      backdrop: 'static',
      keyboard: false
    };

    this._confirmationDialogService.confirm('ACTIVITY.ENTITYREVIEWS.MESSAGE_CONFIRM_DELETE_ENTITYREVIEWS', null, null, optionsForConfirmDialog)
      .then((confirmed) => {
        if (confirmed) {
          this.showLoader();
          this._entityReviewsService.deleteEntityReview(entityReviewId).then(() => {
            this.hideLoader();
            this._commonHelper.showToastrSuccess(
              this._commonHelper.getInstanceTranlationData('ACTIVITY.ENTITYREVIEWS.MESSAGE_ENTITYREVIEW_DELETE')
            );
            this.loadActivityData(true);
            this.isActivityListUpdated.emit();
            this._commonHelper.changeEntityReviewDataCallback();
          },
            (error) => {
              this.hideLoader();
              this.getTranslateErrorMessage(error, 'ENTITYREVIEWS');
            });
        }
      });
  }


  //#endregion 

  //#region HELPER

  bindData() {
    Promise.all([
      this.getActivityOptionsRef(),
      this.getNoteOptionsRef(),
      this.getEventOptionsRef(),
      this.getActivityTimeSpanRef(),
      this.getEntityTimeSpanRef(),
      this.getActivityFilter()
    ]).then(() => {
      if(this.activeTab === 'mainActivity' && !this.onceActivityTabClicked){
        this.loadActivityData(true);
        this.onceActivityTabClicked = true;
      }
      else if (this.activeTab === 'documents' && !this.onceDocumentTabClicked)
      {
        this.loadDocumentData(true);
        this.onceDocumentTabClicked = true;
      }
    });

    if (this.isTagRequired) {
      this.fillIsActiveEntityTagsByTagCategory();
    }
  }

  getActivityOptionsRef(): any {
    return new Promise((resolve, reject) => {
      // prepare param
      let params = { entityTypeId: Entity.Tasks };
      // get data
      const entityRecordTypeForTasks = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.TaskRecordTypeKey));
      if (entityRecordTypeForTasks == null) {
        this.showLoader();
        this._commonService.getEntityRecordTypesByEntityTypeId(params).then(response => {
          if (response) {
            this.activityOptions = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.TaskRecordTypeKey, JSON.stringify(this.activityOptions));
          }
          this.hideLoader();
          resolve(null);
        },
          (error) => {
            this.hideLoader();
            this.getTranslateErrorMessage(error, '');
            reject(null);
          });
      }
      else {
        this.activityOptions = entityRecordTypeForTasks;
        resolve(null);
      }
    });
  }

  getNoteOptionsRef(): any {
    return new Promise((resolve, reject) => {
      let params = { entityTypeId: Entity.Notes };
      // get data
      const entityRecordTypeForNotes = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.NoteRecordTypeKey));
      if (entityRecordTypeForNotes == null) {
        this.showLoader();
        this._commonService.getEntityRecordTypesByEntityTypeId(params).then((response: any) => {
          if (response) {
            this.noteOptions = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.NoteRecordTypeKey, JSON.stringify(this.noteOptions));
            this.noteNoteTypeId = this.noteOptions.find(item => item.code == 'NOTE').id;
          }
          this.hideLoader();
          resolve(null);
        },
          (error) => {
            this.hideLoader();
            this.getTranslateErrorMessage(error, '');
            reject(null);
          });
      }
      else {
        this.noteOptions = entityRecordTypeForNotes;
        this.noteNoteTypeId = this.noteOptions.find(item => item.code == 'NOTE').id;
        resolve(null);
      }
    });
  }

  getEventOptionsRef(): any {
    return new Promise((resolve, reject) => {
      let params = { entityTypeId: Entity.Events };
      // get data
      const entityRecordTypeForEvents = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.EventRecordTypeKey));
      if (entityRecordTypeForEvents == null) {
        this.showLoader();
        this._commonService.getEntityRecordTypesByEntityTypeId(params).then((response: any) => {
          if (response) {
            this.appointmentOptions = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.EventRecordTypeKey, JSON.stringify(this.appointmentOptions));
            this.noteAppointmentId = this.appointmentOptions.find(item => item.code == 'APPOINTMENT').id;
          }
          this.hideLoader();
          resolve(null);
        },
          (error) => {
            this.hideLoader();
            this.getTranslateErrorMessage(error, '');
            reject(null);
          });
      }
      else {
        this.appointmentOptions = entityRecordTypeForEvents;
        this.noteAppointmentId = this.appointmentOptions.find(item => item.code == 'APPOINTMENT').id;
        resolve(null);
      }
    });
  }

  getActivityTimeSpanRef() {
    return new Promise((resolve, reject) => {
      // prepare dynamic storage key
      let params = { refType: RefType.ActivityTimespan };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.ActivityTimespan}`;
      // get data
      const refTypeActivityTimespan = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeActivityTimespan == null) {
        this.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then((response: any[]) => {
          if (response) {
            this.activityQuickFilterOptions = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.activityQuickFilterOptions));
            this.activityQuickFilterSelected = this.activityQuickFilterOptions[3].strValue1;
          }
          this.hideLoader();
          resolve(null);
        }, (error) => {
          this.hideLoader();
          this.getTranslateErrorMessage(error, '');
          reject(null);
        });
      }
      else {
        this.activityQuickFilterOptions = refTypeActivityTimespan;
        this.activityQuickFilterSelected = this.activityQuickFilterOptions[3].strValue1;
        resolve(null);
      }
    });
  }

  getEntityTimeSpanRef() {
    return new Promise((resolve, reject) => {
      // prepare dynamic storage key
      let params = { refType: RefType.EntityTimespan };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.EntityTimespan}`;
      // get data
      const refTypeEntityTimespan = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeEntityTimespan == null) {
        this.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then((response: any) => {
          if (response) {
            this.documentQuickFilterOptions = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.documentQuickFilterOptions));
            this.documentQuickFilterSelected = this.documentQuickFilterOptions[5].strValue1;
          }
          this.hideLoader();
          resolve(null);
        }, (error) => {
          this.hideLoader();
          this.getTranslateErrorMessage(error, '');
          reject(null);
        });
      }
      else {
        this.documentQuickFilterOptions = refTypeEntityTimespan;
        this.documentQuickFilterSelected = this.documentQuickFilterOptions[5].strValue1;
        resolve(null);
      }
    });
  }
  // prepare params for datasource with required fields
  prepareParamsForDocumentType() {
    const params = [];
    const paramItem = {
      name: 'EntityTypeID',
      type: 'int',
      value: Entity.Files,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'ParentEntityTypeID',
      type: 'int',
      value: this.entityTypeId
    };
    params.push(paramItem1);

    return params;
  }

  getDocumentType() {
    return new Promise((resolve, reject) => {
      //storage key
      let storageKey = `${LocalStorageKey.DocumentTypeKey}_${this.entityTypeId}`;

      // get data
      const dataSourceDataForDocumentType = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (dataSourceDataForDocumentType == null) {
        // prepare params
        var params = this.prepareParamsForDocumentType();
        this.showLoader();
        this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.DOCUMENTTYPE, params).then((response: any) => {
          if (response) {
            this.documentTypeList = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.documentTypeList));
            this.documentTypeList.push({ label: this._commonHelper.getInstanceTranlationData('DOCUMENTS.TYPEDEFAULTVALUE'), value: null });
          }
          this.hideLoader();
          resolve(null);
        }, (error) => {
          this.hideLoader();
          this.getTranslateErrorMessage(error, '');
          reject(null);
        });
      }
      else {
        this.documentTypeList = dataSourceDataForDocumentType;
        this.documentTypeList.push({ label: this._commonHelper.getInstanceTranlationData('DOCUMENTS.TYPEDEFAULTVALUE'), value: null });
        resolve(null);
      }
    });
  }

  loadActivityData(clearAll) {
    if (clearAll) {
      this.activityDataSource = [];
      this.activityLastStreamId = 0;
      this.activityLastTaskId = 0;
      this.activityLastNoteId = 0;
      this.activityLastEventId = 0;
      this.activityLastTagId = 0;
      this.activityLastEntityReviewId = 0;
    }

    let params = {
      entityTypeId: this.entityTypeId,
      entityId: this.entityId,
      filterByEntity: this.filterTypeSelected.entityId,
      entityRecordTypeID: this.filterTypeSelected.id,
      timespanName: this.activityQuickFilterSelected || 'LAST7DAYS',
      pageSize: 10,
      streamLastRecordID: this.activityLastStreamId,
      taskLastRecordID: this.activityLastTaskId,
      noteLastRecordID: this.activityLastNoteId,
      eventLastRecordID: this.activityLastEventId,
      tagLastRecordID: this.activityLastTagId.toString(), // Not allow to pass big value to API as Long / Number so conver to string and from SQL convert to BIGINT by removing 000 again....
      entityReviewLastRecordID: this.activityLastEntityReviewId
    }

    this.showLoader();
    this._activityService.getActivityList(params).then(
      (response: any) => {
        if (response.activities != null && response.activities.length > 0) {
          this.activityShowLoadMore = true;
          this.setLastRecordIds(response.activities);
          this.activityDataSource = this.activityDataSource.concat(response.activities)

          this._fileSignedUrlService.getFileSingedUrl(this.activityDataSource,'createdByImage','createdBySignedUrl', Entity.Users);
        }
        this.activityShowLoadMore = response.activities.length >= params.pageSize;
        this.hideLoader();
      },
      (error) => {
        this.hideLoader();
        this.getTranslateErrorMessage(error, '');
      });
  }

  setLastRecordIds(dataSource) {
    if (dataSource != null && dataSource.length > 0) {
      let filteredSource = null;

      //stream last record id
      filteredSource = dataSource.filter(x => x.activityType == Entity.ActivityStream)
      if (filteredSource != null && filteredSource.length > 0) {
        this.activityLastStreamId = filteredSource.sort((a, b) => a.id - b.id).filter((item, index, array) => item.id === array[0].id)[0].id;
      }

      //Task last record id
      filteredSource = dataSource.filter(x => x.activityType == Entity.Tasks)
      if (filteredSource != null && filteredSource.length > 0) {
        this.activityLastTaskId = filteredSource.sort((a, b) => a.id - b.id).filter((item, index, array) => item.id === array[0].id)[0].id;
      }

      //Note last record id
      filteredSource = dataSource.filter(x => x.activityType == Entity.Notes)
      if (filteredSource != null && filteredSource.length > 0) {
        this.activityLastNoteId = filteredSource.sort((a, b) => a.id - b.id).filter((item, index, array) => item.id === array[0].id)[0].id;
      }

      //Event last record id
      filteredSource = dataSource.filter(x => x.activityType == Entity.Events)
      if (filteredSource != null && filteredSource.length > 0) {
        this.activityLastEventId = filteredSource.sort((a, b) => a.id - b.id).filter((item, index, array) => item.id === array[0].id)[0].id;
      }

      //Entity Review last record id
      filteredSource = dataSource.filter(x => x.activityType == Entity.EntityReviews)
      if (filteredSource != null && filteredSource.length > 0) {
        this.activityLastEntityReviewId = filteredSource.sort((a, b) => a.id - b.id).filter((item, index, array) => item.id === array[0].id)[0].id;
      }

      //Tag last record id
      filteredSource = dataSource.filter(x => x.activityType == Entity.EntityTags);
      let mapUID = filteredSource.map(f => f.uid);
      if (filteredSource != null && filteredSource.length > 0 && mapUID.sort((a, b) => a - b).length > 0) {
        this.activityLastTagId = mapUID.sort((a, b) => a - b)[0] // Sort the numbers in ascending order
      }
      else {
        /**
         *  Moksh Dhameliya : 22 May, 2023  SDC-1822
        * Checking it again because e.g we have 3 pages in a load-more but on page 1 only one tag record is found so it is set into activityLastTagId 
        * but at 2-page load-more we haven't found any tag data so to prevent this duplicate records insteand of setting it as 0 we continue with the last previous value ( page one 1 tag value)
        * otherwise page 3 loads more results page one tag will be duplicated.....
        */
        this.activityLastTagId = this.activityLastTagId?.toString() != '0' ? this.activityLastTagId : 0;
      }
    }
  }

  getActivityFilter() {
    return new Promise((resolve, reject) => {
      // get data
      const entityFilter = JSON.parse(this._commonHelper.getLocalStorageDecryptData(LocalStorageKey.Filters_Activity, this.localStorageKeyPrefix));
      if (entityFilter == null) {
        this.showLoader();
        this._dataSourceService.getDataSourceDataByCode("GET_ACTIVITY_FILTER").then((response: any) => {
          if (response) {
            this.filterTypeOptions = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(LocalStorageKey.Filters_Activity, JSON.stringify(this.filterTypeOptions), this.localStorageKeyPrefix);
            this.filterTypeSelected = this.filterTypeOptions[0];
          }
          this.hideLoader();
          resolve(null);
        },
          (error) => {
            this.hideLoader();
            this.getTranslateErrorMessage(error, '');
            reject(null);
          });
      }
      else {
        this.filterTypeOptions = entityFilter;
        this.filterTypeSelected = this.filterTypeOptions[0];
        resolve(null);
      }
    });
  }

  // set current active tab
  setTab(activeTab) {
    this.activeTab = activeTab;

    if (!this.onceActivityTabClicked && this.activeTab == 'mainActivity') {
      this.loadActivityData(true);
      this.onceActivityTabClicked = true;
    }

    if (!this.onceDocumentTabClicked && this.activeTab == 'documents') {
      this.loadDocumentData(true);
      this.onceDocumentTabClicked = true;
    }
  }

  openActivity() {
    $('#sideActivity').show();
    $('#btnToOpenActivity').hide();
    $('#activityCloseBtn').css('display', 'flex');
    if ($('.details-box')) {
      $('.details-box').addClass('col-xl-8');
    }
    if ($('.common-box')) {
      $('.common-box').addClass('col-xl-4');
    }
    $('.details-box').addClass('col-lg-12');
    $('.details-box').removeClass('slide-animation');
    $('.common-box').addClass('col-md-12');
    $('.details-box').width('auto');
    $('.common-box').width('auto');
    $('.common-box').css('max-width', '33.33333333%');
    $('.details-box.col-xl-8').css('flex', '0 0 66.66666667%');
    $('.common-box.col-xl-4').css('flex', '0 0 33.33333333%');
    this._commonHelper.setCommonActivitySectionState('OPEN');

  }

  closeActivity() {
    $('#sideActivity').hide();
    $('#btnToOpenActivity').show();
    $('#activityCloseBtn').css('display', 'none');
    if ($('.details-box').hasClass('col-xl-8')) {
      $('.details-box').removeClass('col-xl-8');
    }
    if ($('.common-box').hasClass('col-xl-4')) {
      $('.common-box').removeClass('col-xl-4');
    }
    $('.details-box').removeClass('col-lg-12');
    $('.details-box').addClass('slide-animation');
    $('.common-box').removeClass('col-md-12');
    $('.details-box').width('99%');
    $('.common-box').width('1px');
    this._commonHelper.setCommonActivitySectionState('CLOSE');
  }

  getTranslateErrorMessage(error, node) {
    if (error && error.messageCode) {
      if (node.length > 0) { node = node + '.' }
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ACTIVITY.' + node + error.messageCode.replaceAll('.', '_').toUpperCase()));
    }
  }

  copyURL(val: string) {
    this._commonHelper.copyURL(val);
  }

  getTaskLabel(entityRecordTypeID) {
    var taskOption = this.activityOptions.find(item => item.id == entityRecordTypeID);
    return this._commonHelper.getInstanceTranlationData('ACTIVITY.TASKS_DIALOG.' + taskOption.code + '_TITLE');
  }

  getTaskClass(entityRecordTypeID) {
    var taskOption = this.activityOptions.find(item => item.id == entityRecordTypeID);
    if (taskOption.code == 'CALL') {
      return 'fas fa-phone-alt font-12';
    } else if (taskOption.code == 'EMAIL') {
      return 'far fa-envelope font-12';
    } else if (taskOption.code == 'VOICEMAIL') {
      return 'fas fa-voicemail font-12';
    } else {
      return 'task-followup';
    }
  }

  onClickActivityTab() {
    this.isActivitySubmitted = false;
  }

  viewDocument(documentID: number) {

    this.showLoader();

    const payload: any = {
      entityTypeId: this.entityTypeId,
      entityId: this.entityId,
      timespanName: 'ALLTIME',
      pageSize: 100000,
      lastRecordId: 0
    }

    this._documentService.getAllDocuments(payload).then((files: any[]) => {
      this.hideLoader();
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
        this.modalRef.componentInstance.entityTypeID = this.entityTypeId;
        }
      } else {
        this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('COMMON.FILE_NOT_EXISTS'));
      }
    }, (error) => {
      this.hideLoader();
      this.getTranslateErrorMessage(error, 'DOCUMENTS');
    });
  }
  
  //#endregion

  //#region private methods

  private openEditDocumentPopup(documentResponse: any) {
    this.optionsForPopupDialog.size = 'lg';
    this.modalRef = this._modalService.open(FileUploadDialogComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.action = Actions.Edit;
    this.modalRef.componentInstance.fileDto = documentResponse;
    this.modalRef.componentInstance.documentTypeList = this.documentTypeList?.filter(x => x.value);

    this.modalRef.result.then((response: any[]) => {
      if (response) {
        this.loadDocumentData(true);
      }
    });
  }

  showLoader() {
    this.showLoadingPanel++;
  }

  hideLoader() {
    if (this.showLoadingPanel > 0) {
      this.showLoadingPanel--;
    }
  }
  //#endregion private methods

  onEntityStagesTasksClick(event: any) {
    this.onEntityStageTasksSelect.emit(event)
  }

  onSaveKeyFieldEvent(event){
    this.saveKeyFieldEvent.emit(event)
  }

  onClickSubTaskCreate(event: any) {
    this.onSubTaskCreate.emit(event);
  }

  onClickLinkWorkTaskCreate(event: any) {
    this.onLinkWorkTaskCreate.emit(event);
  }

  onClickAddWorkTaskCreate(event: any){
   this.onAddWorkTask.emit(event);
  }

  onAddOpportunityCreate(event: any) {
    this.onAddOpportunity.emit(event);
  }

  onAddCaseCreate(event: any) {
    this.onAddCase.emit(event);
  }

  onActivitySectionClose(){
    this.onCloseActivitySection.emit();
  }

  onRaiseHandChangeEvent(event: any): void {
    this.raiseHandChange.emit(event);
  }

  onPauseOrResumeChangesEvent(event: any): void {
    this.pauseOrResumeChanges.emit(event);
  }

  convertArrayToCarouselModel(arr: any[]): Carousel[] {
    arr.forEach(x => x.filePath = x.fileName);
    return arr.map(item => this._carouselAdapterService.adapt(item));
  }
}
