import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { param } from 'jquery';
import * as moment from 'moment';
import { UsersService } from '../../../../pages/usermanagement/users/users.service';
import { CommonHelper } from '../../../common-helper';
import { RefType, DataSources, Entity } from '../../../enum';
import { CommonService } from '../../../sharedServices/common.service';
import { DatasourceService } from '../../../sharedServices/datasource.service';
import { ActivityService } from '../activity.service';
import { Activity, EventRelations, Events } from '../common-activity-model';
import { EntityNotificationComponent } from '../../entity-notification/entity-notification/entity-notification.component';
import { EntityNotificationService } from '../../entity-notification/services/entity-notification.service';
import { AppointmentService } from '../../../sharedServices/appointment.service';
// import { CommonService } from '../../../../@core/common.service';

@Component({
  selector: 'app-activity-dialog',
  templateUrl: './activity-dialog.component.html',
  styleUrls: ['./activity-dialog.component.scss']
})
export class ActivityDialogComponent implements OnInit {

  @ViewChild('taskDescription', { static: false }) taskDescriptionRef: ElementRef;

  @Input() title: string;
  @Input() entityTypeId: number;
  @Input() entityId: number;
  @Input() entityRecordTypeID: number;
  @Input() taskType: string;
  @Input() appointmentSubjectName: string = '';
  @Input() assignedTo: number = 0;
  @Input() activityID: number = 0;
  @Input() activitySubTypeID: number = 0;
  @Input() taskMode: string = 'ADD';
  @Input() fromAppointment: boolean = false;

  selectedActivityType: string = '';
  endTimeError: string = '';
  accountManagerList: any;

  //Save Flag
  submitted = false;

  users: any;

  attendees: any [] = [];
  selectedAttendees: any [] = [];

  activityModel: Activity;
  eventModel: Events;

  //appointmentAttendeeUser List
  eventProvidersList: any;
  taskStatusOptions: any;
  eventStatusOptions: any;
  activityDueDateErrorMsg: string = 'Due Date should always greater than Task Date'
  isValidActivityDueDate: boolean = true;

  //next round up time get from uram
  nextRoundUpTime: any;
  roundUpMinDate: Date;

  currentDate = new Date();

  //all popup dialog open option settings
  optionsForPopupDialog: any = {
    size: "md",
    centered: false,
    backdrop: 'static',
    keyboard: false
  };

  //For Model Ref
  modalRef: NgbModalRef | null;
  
  public getCurrentDate() {
    return this.currentDate;
  }
  
  //user detail
  _loggedInUser: any;

  activity_validation_messages = {
    'assignedUserId': [
      { type: 'required', message: 'Assign User is required' },
    ],
    'taskDate': [
      { type: 'required', message: 'Task Date is required' },
    ],
    'description': [
      { type: 'required', message: 'ACTIVITY.TASKS_DIALOG.MESSAGE_NOTE' }
    ],
    'notes': [
      { type: 'required', message: 'ACTIVITY.TASKS_DIALOG.MESSAGE_NOTE' }
    ]
  }

  event_validation_messages = {
    'subject': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_SUBJECT' }
    ],
    'date': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_DATE' }
    ],
    'startTime': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_START_TIME' }
    ],
    'endTime': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_END_TIME' }
    ],
    'ownerId': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_ASSIGN_ACCOUNT_MANAGER' }
    ],
    'providerId': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_PROVIDER' }
    ],
    'relatedto': [
      { type: 'required', message: 'ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_RELATEDTO' }
    ]
  }

  entityNotificationList: any[] = [];
  parentEntityList: any = [];
  selectedEntity:any = null;
  relatedToList: any = [];
  selectRelatedto: any = [];
  showRelatedToLoader: boolean = false;

  constructor(private _ngbActiveModal: NgbActiveModal,
    private _activityService: ActivityService,
    private _appointmentService: AppointmentService,
    public _commonHelper: CommonHelper,
    private _commonService: CommonService,
    private _usersService: UsersService,
    private _datasourceService: DatasourceService,
    private _modalService: NgbModal,
    private _entityNotificationService: EntityNotificationService,
    private _dataSourceService:DatasourceService
  ) {
  }

  ngOnInit() {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();
    this.endTimeError = '';
    if (this.taskType == 'MEETING') {
      this.setInitialEventModel();
      if (this.taskMode === 'ADD') {
        this.setEventModel();
        this.getUserCurrentTimeWithNextRoundUpTime();
      } else if (this.taskMode === 'EDIT') {
        this.getEventDetailById();
        this.getEntityNotifications();
      }

    } else {
      if (this.taskMode === 'ADD') {
        this.setActivityModel();
      } else if (this.taskMode === 'EDIT') {
        this.getTaskDetailById();
      }
      this.getUserCurrentTimeWithNextRoundUpTime();
    }
  }

  //on select event date
  onSelectEventDate($event) {
    let selectedActivityDate = new Date($event);
    this.eventModel.startTime.setFullYear(selectedActivityDate.getFullYear(), selectedActivityDate.getMonth(), selectedActivityDate.getDate());
    this.eventModel.endTime.setFullYear(selectedActivityDate.getFullYear(), selectedActivityDate.getMonth(), selectedActivityDate.getDate());
  }

  //set activity model
  setActivityModel() {
    this.activityModel = new Activity({
      id: 0,
      taskType: this.taskType,
      entityTypeId: this.entityTypeId,
      entityId: this.entityId,
      entityRecordTypeID: this.entityRecordTypeID,
      name: '',
      description: '',
      taskDate: new Date(),
      dueDate: null,
      assignedUserId: null,
      statusId: null,
      notes: '',
      isEditable: this.eventModel?.isEditable
    });
    this.getAssignUsers(null, 0, '');
    this.getTaskStatusRef();
  }

  onSelectDueDate(selectedDueDate) {
    this.isValidActivityDueDate = true;
    if (selectedDueDate != null && this.activityModel.taskDate != null) {
      if (moment(selectedDueDate) <= moment(this.activityModel.taskDate)) {
        this.isValidActivityDueDate = false;
      }
    }
  }

  onCheckTaskDateAndDueDate(selectedTaskDate) {
    this.isValidActivityDueDate = true;
    if (selectedTaskDate != null && this.activityModel.taskDate != null) {
      if (this.activityModel.dueDate != null) {
        if (moment(selectedTaskDate) >= moment(this.activityModel.dueDate)) {
          this.isValidActivityDueDate = false;
        }
      }
    }
  }

  //set event model
  setInitialEventModel(){
    this.eventModel = new Events({
      subject: this.appointmentSubjectName,
    })
  }
  setEventModel() {
    let currentDate = new Date();
    this.eventModel = new Events({
      id: 0,
      taskType: this.taskType,
      entityTypeId: this.entityTypeId,
      entityId: this.entityId,
      entityRecordTypeID: this.entityRecordTypeID,
      attendeeId: 0,
      subject: this.appointmentSubjectName,
      location: '',
      description: '',
      statusId: null,
      activityDate: currentDate,
      startTime: currentDate,
      endTime: currentDate,
      ownerId: null,
      attendeesId: null,
      notes: '',
      isEditable: true
    });
    this.getAssignUsers(null, 0, '');
    this.getAttendees(null, 0, '');
    this.getEventStatusRef();
    this.getRelatedToParentEntity();
  }

  onChangeActivity(event) {
    this.taskType = event.value;
  }

  relatedToOnFilter(e, selecteditemId) {
    let selectEntityId = this.selectedEntity.id;
    let EntityId: any = [];
    if (selectEntityId) {
      EntityId.push(selectEntityId);
    }
    this.getRelatedTo(EntityId,0,e.filter,selecteditemId?.toString());
  }

  assignedToOnFilter(e, selectedUserIds) {
    this.getAssignUsers(selectedUserIds?.toString(), 0, e.filter);
  }

  attendeesOnFilter(e, selectedUserIds) {
    this.getAttendees(selectedUserIds?.toString(), 0, e.filter);
  }

  onClearSelectedAttendees(){
    this.selectedAttendees = [];
  }

  getEventDetailById() {
    return new Promise((resolve, reject) => {
      let params = {
        eventId: this.activityID
      }
      this._commonHelper.showLoader();
      this._appointmentService.getEventDetailById(params).then(
        (reslist: any) => {
          if (reslist) {
            this.eventModel = reslist as Events;
            this.eventModel.id = this.activityID;
            this.eventModel.activityDate = new Date(moment(this.eventModel.activityDate).format("YYYY-MM-DD HH:mm"));
            this.eventModel.startTime = new Date(moment(this.eventModel.startTime).format("YYYY-MM-DD HH:mm"));
            this.eventModel.endTime = new Date(moment(this.eventModel.endTime).format("YYYY-MM-DD HH:mm"));
            this.eventModel.ownerId = reslist.ownerUserId;
            this.eventModel.attendeesId = reslist.attendeeIDs;
            this.eventModel.isEditable = reslist.isEditable;
           
            if(this.eventModel.attendeesId != "" && this.eventModel.attendeesId != null && this.eventModel.attendeesId != undefined)
            {
              this.selectedAttendees = reslist.attendeeIDs.split(",").map(x => Number(x));
            }
            this.getAttendees(this.eventModel.attendeesId, 0, '')
            this.getAssignUsers(this.eventModel.ownerId, 0, '');
            this.getEventStatusRef();
            this.getRelatedToParentEntity().then((res: any) => {
              if (res) {
                this.selectedEntity = this.parentEntityList.find(de => de['id'] == reslist.entityTypeId);
                let selectEntityId = reslist.entityTypeId;
                let EntityIdArray: any = [];
                if (selectEntityId) {
                  EntityIdArray.push(selectEntityId);
                }
                this.getRelatedTo(EntityIdArray,0,"",reslist.entityId).then((res: any) => {
                  if(res){
                    this.selectRelatedto = Number(reslist.entityId);
                  }
                }, (error) => {
                  this._commonHelper.showToastrError(error.message);
                });
              }
            }, (error) => {
              this._commonHelper.showToastrError(error.message);
            });
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error, 'APPOINTMENTS');
          reject(null);
        });
    });
  }


  //on submit save
  onSubmitActivity() {
    this.submitted = true;
    if (this.taskType === 'MEETING') {
      this.saveEvent();
    } else {
      this.saveActivity();
    }
  }

  //save activity call,email,voicemail
  saveActivity() {
    
    if (!this.isValidActivityDueDate) {
      return false;
    }
    if (this.activityModel.description === '') {
      return false;
    }
    if (this.activityModel.assignedUserId == null) {
      return false;
    }
    if (this.activityModel.statusId == null) {
      return false;
    }

    let statusId = this.activityModel.statusId['intValue1'];

    let params = {
      id: this.activityModel.id,
      tenantId: 0,
      entityTypeId: this.activityModel.entityTypeId,
      entityId: this.activityModel.entityId,
      entityRecordTypeID: this.activityModel.entityRecordTypeID,
      name: '',
      description: this.activityModel.description,
      assignedUserId: this.activityModel.assignedUserId,
      taskDate: moment(this.activityModel.taskDate).format("YYYY-MM-DDTHH:mm"),
      dueDate: this.activityModel.dueDate != null ? moment(this.activityModel.dueDate).format("YYYY-MM-DD") : null,
      statusId: statusId
    }

    if (this.taskMode === 'ADD') {
      this._commonHelper.showLoader();
      this._activityService.saveTask(params).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('ACTIVITY.TASKS_DIALOG.MESSAGE_TASK_ADD', {
            taskType:
              this._commonHelper.getInstanceTranlationData(this.title)
          }));

        this._ngbActiveModal.close(response);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error, 'TASKS');
        });
    }
    else if (this.taskMode === 'EDIT') {
      this._commonHelper.showLoader();
      this._activityService.updateTask(params).then(response => {
        this._commonHelper.hideLoader();
        this._commonHelper.showToastrSuccess(
          this._commonHelper.getInstanceTranlationData('ACTIVITY.TASKS_DIALOG.MESSAGE_TASK_UPDATE', {
            taskType:
              this._commonHelper.getInstanceTranlationData(this.title)
          }));

        this._ngbActiveModal.close(response);
      },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error, 'TASKS');
        });
    }
  }

  //save event MEETING
  saveEvent() {
    this.submitted = true;

    if (this.eventModel.subject == '') { return false; }
    if (this.eventModel.startTime == undefined) { return false; }
    if (this.eventModel.endTime == undefined) { return false; }
    if (this.eventModel.ownerId == null) { return false; }
    if (this.fromAppointment)
    {
      if(this.selectRelatedto.length <= 0 || this.selectedEntity.length <= 0){
        return false;
      }
    }

    if (this.eventModel.startTime.getTime() >= this.eventModel.endTime.getTime()) {
      this.endTimeError = this._commonHelper.getInstanceTranlationData('ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_ENDTIME_LATER_STARTTIME');
      return false;
    }
    let statusId = this.eventModel.statusID['intValue1'];
    let entityId = this.fromAppointment ? this.selectRelatedto : this.eventModel.entityId;
    let entityTypeId = this.fromAppointment ? this.selectedEntity?.id : this.eventModel.entityTypeId;

    let data = {
      id: this.eventModel.id,
      entityTypeId: entityTypeId,
      entityId: entityId,
      entityRecordTypeID: this.eventModel.entityRecordTypeID,
      ownerId: this.eventModel.ownerId,
      eventAttendees: this.selectedAttendees != null ? this.selectedAttendees.toString(): null,
      subject: this.eventModel.subject,
      location: this.eventModel.location,
      description: this.eventModel.description,
      statusId: statusId,
      activityDate: moment(new Date(this.eventModel.activityDate.getFullYear(), this.eventModel.activityDate.getMonth(), this.eventModel.activityDate.getDate(), this.eventModel.startTime.getHours(), this.eventModel.startTime.getMinutes())).format("YYYY-MM-DDTHH:mm"),
      startTime: moment(this.eventModel.startTime).format("YYYY-MM-DDTHH:mm"),
      endTime: moment(this.eventModel.endTime).format("YYYY-MM-DDTHH:mm"),
      notes: this.eventModel.notes
    }

    this._commonHelper.showLoader();
    this._appointmentService.saveAppointment(data).then(response => {
      this._commonHelper.hideLoader();
      if (this.taskMode === 'ADD') {
        if (this.entityNotificationList.length > 0) {
          this.activityID = Number(response['id']);
          this.saveEntityNotification(this.entityNotificationList).then(res => {
            this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_APPOINTMENT_ADD'));  
          });
        } else {
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_APPOINTMENT_ADD'));
        }
      }
      else if (this.taskMode === 'EDIT') {
        this.saveEntityNotification(this.entityNotificationList).then(res => {
          this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_APPOINTMENT_UPDATE'));
        });
      }
      this._ngbActiveModal.close(response);
    },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error, 'APPOINTMENTS');
      });
    this.endTimeError = '';
  }

  getUserCurrentTimeWithNextRoundUpTime() {
    this._commonHelper.showLoader();
    const params = { roundUpMin: 15 }
    this._usersService.getUserCurrentTimeWithNextRoundUpTime(params).then(
      (response: any) => {
        if (response != null) {
          if (response != undefined) {
            this.nextRoundUpTime = response.nextRoundUpTime;
            this.roundUpMinDate = new Date(moment(this.nextRoundUpTime).format("YYYY-MM-DD HH:mm"));

            if (this.taskType === 'MEETING') {
              this.eventModel.activityDate = new Date(moment(this.eventModel.activityDate).format("YYYY-MM-DD HH:mm"));
              this.eventModel.startTime = new Date(moment(this.nextRoundUpTime).format("YYYY-MM-DD HH:mm"));
              this.eventModel.endTime = new Date(moment(this.nextRoundUpTime).add(1, 'hours').format("YYYY-MM-DD HH:mm"));
            } else {
              //for activity date time
              if (this.taskMode === 'ADD') {
                this.activityModel.taskDate = new Date(this.nextRoundUpTime);
              }
            }
            this._commonHelper.hideLoader();
          } else {
            this._commonHelper.hideLoader();
            this._commonHelper.showToastrError(
              this._commonHelper.getInstanceTranlationData('ACTIVITY.USER_CURRENT_TIME')
            );
          }
        }
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error, '');
      });
  }

  getTaskDetailById() {
    let params = {
      taskId: this.activityID
    }
    this._commonHelper.showLoader();
    this._activityService.getTaskDetailById(params).then(
      (response: any) => {
        if (response) {
          this.activityModel = response as Activity;
          this.activityModel.id = this.activityID;
          this.activityModel.taskDate = new Date(moment(this.activityModel.taskDate).format("YYYY-MM-DD HH:mm"));
          this.activityModel.dueDate = this.activityModel.dueDate != null ? new Date(moment(this.activityModel.dueDate).format("YYYY-MM-DD HH:mm")) : null;
          this.getAssignUsers(this.activityModel.assignedUserId, 0, '');
          this.getTaskStatusRef();
        }
        this._commonHelper.hideLoader();
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error, 'TASKS');
      });
  }

  getTaskStatusRef() {
    return new Promise((resolve, reject) => {
      let params = { refType: RefType.TaskStatus };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.TaskStatus}`;
      // get data
      const refTypeTaskStatus = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeTaskStatus == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {
            this.taskStatusOptions = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.taskStatusOptions));
          }
          if (this.taskMode === 'ADD') {
            if (this.taskStatusOptions.length > 0) {
              this.activityModel.statusId = this.taskStatusOptions[0]
            }
          }
          else if (this.taskMode === 'EDIT') {
            let statusId = this.activityModel.statusId;
  
            let filteredValue = this.taskStatusOptions.filter(rep => {
              if (rep.intValue1 == statusId) {
                return rep;
              }
            });
            if (filteredValue.length > 0) {
              this.activityModel.statusId = filteredValue[0];
            }
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error, '');
          reject(null);
        });
      }
      else {
        this.taskStatusOptions = refTypeTaskStatus;
        if (this.taskMode === 'ADD') {
          if (this.taskStatusOptions.length > 0) {
            this.activityModel.statusId = this.taskStatusOptions[0]
          }
        }
        else if (this.taskMode === 'EDIT') {
          let statusId = this.activityModel.statusId;

          let filteredValue = this.taskStatusOptions.filter(rep => {
            if (rep.intValue1 == statusId) {
              return rep;
            }
          });
          if (filteredValue.length > 0) {
            this.activityModel.statusId = filteredValue[0];
          }
        }
        resolve(null);
      }
    });
  }

  getEventStatusRef() {
    return new Promise((resolve, reject) => {
      let params = { refType: RefType.EventStatus };
      // storage key
      let storageKey = `${this._commonHelper.referenceTypePrefixKey}${RefType.EventStatus}`;
      // get data
      const refTypeEventStatus = JSON.parse(this._commonHelper.getLocalStorageDecryptData(storageKey));
      if (refTypeEventStatus == null) {
        this._commonHelper.showLoader();
        this._commonService.getActiveReferenceTypeByRefType(params).then(response => {
          if (response) {

            this.eventStatusOptions = response;
            // store in local storage
            this._commonHelper.setLocalStorageEncryptData(storageKey, JSON.stringify(this.eventStatusOptions));
          }
          if (this.taskMode === 'ADD') {
            if (this.eventStatusOptions.length > 0) {
              this.eventModel.statusID = this.eventStatusOptions[3]
            }
          }
          else if (this.taskMode === 'EDIT') {
            let statusId = this.eventModel.statusID;
  
            let filteredValue = this.eventStatusOptions.filter(rep => {
              if (rep.intValue1 == statusId) {
                return rep;
              }
            });
            if (filteredValue.length > 0) {
              this.eventModel.statusID = filteredValue[0];
            }
          }
          this._commonHelper.hideLoader();
          resolve(null);
        },
        (error) => {
          this._commonHelper.hideLoader();
          this.getTranslateErrorMessage(error, '');
          reject(null);
        });
      }
      else {
        this.eventStatusOptions = refTypeEventStatus;
        if (this.taskMode === 'ADD') {
          if (this.eventStatusOptions.length > 0) {
            this.eventModel.statusID = this.eventStatusOptions[3]
          }
        }
        else if (this.taskMode === 'EDIT') {
          let statusId = this.eventModel.statusID;

          let filteredValue = this.eventStatusOptions.filter(rep => {
            if (rep.intValue1 == statusId) {
              return rep;
            }
          });
          if (filteredValue.length > 0) {
            this.eventModel.statusID = filteredValue[0];
          }
        }
        resolve(null);
      }
    });
  }

  getAssignUsers(selectedUserId, includeAllUsers = 1, searchString = null): void {
    this._commonHelper.showLoader();
    const params = this.prepareParamsForEventsAssignedTo(selectedUserId, includeAllUsers, searchString);
    this._datasourceService.getDataSourceDataByCodeAndParams(DataSources.EVENTASSIGNEDTO, params).then(
      (response: any) => {
        if (response) {
          this.users = response;
        }
        if (this.taskMode === 'ADD') {
          let filteredUser = this.users.filter(u => {
            if (u.value == this._loggedInUser.userId) {
              return u;
            }
          });
          if (filteredUser.length > 0) {
            if(this.taskType == 'MEETING')
            {
              this.eventModel.ownerId = filteredUser[0].value;
            }
            else
            {
            this.activityModel.assignedUserId = filteredUser[0].value;
          }
          }
        } else if (this.taskMode === 'EDIT') {
          let filteredUser = this.users.filter(u => {
            if (u.value == selectedUserId) {
              return u;
            }
          });
          if (filteredUser.length > 0) {
            if(this.taskType == 'MEETING')
            {
              this.eventModel.ownerId = filteredUser[0].value;
            }
            else
            {
            this.activityModel.assignedUserId = filteredUser[0].value;
          }
            
          }
        }
        this._commonHelper.hideLoader();
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error, '');
      });
  }

  prepareParamsForEventsAssignedTo(ownerId, includeAllUsers, searchString) {
    const params = [];
    const paramItem = {
      name: 'SelectedUserID',
      type: 'int',
      value: ownerId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'IncludeAllUsers',
      type: 'bit',
      value: includeAllUsers,
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem2);

    return params;
  }

  getAttendees(selectedUserId, includeAllUsers = 1, searchString = null): void {
    this._commonHelper.showLoader();
    if(selectedUserId==null)
    {
      this._commonHelper.hideLoader();
    }
    const params = this.prepareParamsForEventsAttendees(selectedUserId, includeAllUsers, searchString);
    this._datasourceService.getDataSourceDataByCodeAndParams(DataSources.EVENTATTENDEES, params).then(
      (response: any) => {
        if (response) {
          this.attendees = response as [];
        }
          this._commonHelper.hideLoader();
      },
      (error) => {
        this._commonHelper.hideLoader();
        this.getTranslateErrorMessage(error, '');
      });
  }

  prepareParamsForEventsAttendees(attendeesId, includeAllUsers, searchString) {
    const params = [];
    const paramItem = {
      name: 'SelectedUserID',
      type: 'int',
      value: attendeesId,
    };
    params.push(paramItem);

    const paramItem1 = {
      name: 'IncludeAllUsers',
      type: 'bit',
      value: includeAllUsers,
    };
    params.push(paramItem1);

    const paramItem2 = {
      name: 'SearchString',
      type: 'string',
      value: searchString,
    };
    params.push(paramItem2);

    return params;
  }

  onSelectStartTime(ev) {
    if (ev != null && ev != undefined) {
      this.endTimeError = '';
      if (this.eventModel.startTime.getDate() == new Date(moment(ev).add(1, 'hours').format("YYYY-MM-DD HH:mm")).getDate()) {
        this.eventModel.endTime = new Date(moment(ev).add(1, 'hours').format("YYYY-MM-DD HH:mm"));
      } else {
        if (this.eventModel.startTime.getDate() == new Date(moment(ev).add(15, 'minutes').format("YYYY-MM-DD HH:mm")).getDate()) {
          this.eventModel.endTime = new Date(moment(ev).add(15, 'minutes').format("YYYY-MM-DD HH:mm"));
        } else {
          this.endTimeError = this._commonHelper.getInstanceTranlationData('ACTIVITY.APPOINTMENTS_DIALOG.MESSAGE_ENDTIME_LATER_STARTTIME');
          this.eventModel.endTime = this.eventModel.startTime;
        }
      }
    }
  }

  onSelectEndTime(ev) {
    if (ev != null && ev != undefined) {
      this.endTimeError = '';
      if (new Date(moment(this.eventModel.startTime).format("YYYY-MM-DD HH:mm")).getTime() > new Date(moment(ev).format("YYYY-MM-DD HH:mm")).getTime()) {
        this.eventModel.startTime = new Date(moment(ev).add(-1, 'hours').format("YYYY-MM-DD HH:mm"));
      }
    }
  }

  //for close form
  public onCloseForm() {
    this._ngbActiveModal.close();
  }

  getTranslateErrorMessage(error, node) {
    if (error && error.messageCode) {
      if (node.length > 0) { node = node + '.' }
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('ACTIVITY.' + node + error.messageCode.replace('.', '_').toUpperCase()));
    }
  }

  openReminderDialog() {
    this.modalRef = this._modalService.open(EntityNotificationComponent, this.optionsForPopupDialog);
    this.modalRef.componentInstance.existingNotificationLists = this.entityNotificationList;
    this.modalRef.componentInstance.activityId = this.activityID;
    this.modalRef.result.then((response: any[]) => {
      if (response) {
        this.entityNotificationList = response;        
      }
    });
  }

  getRelatedToParentEntity(){
    return new Promise((resolve, reject) => {
      this.parentEntityList = [];
      const entityTypeList = this._commonHelper.entityTypeList;
      const entityType = entityTypeList.find(de => de['id'] == this.entityTypeId);
      if (entityType && entityType.parentEntityTypeIDs) {
        let parentEntityTypeidArray = entityType?.parentEntityTypeIDs?.split(',');
        for(let i=0 ;i<parentEntityTypeidArray.length;i++){
            let entity = entityTypeList.find(de => de['id'] == parentEntityTypeidArray[i]);
            this.parentEntityList.push(entity);
        }
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  private getEntityNotifications() {
    this._commonHelper.showLoader();

    const payload = {
      'entityId' : this.activityID,
      'entityTypeId': Entity.Events
    };

    this._entityNotificationService.getEntityNotificationsByEntityId(payload).then((res : any[]) => {
      this._commonHelper.hideLoader();
      this.entityNotificationList = res;
    }, (err) => {
      this._commonHelper.hideLoader();
    });

  }

  private saveEntityNotification(notificationList: any[]) {

    return new Promise((resolve, reject) => {
      this._commonHelper.showLoader();

      const payload = {
        'entityId': this.activityID,
        'entityTypeId': Entity.Events,
        'entityNotificationDetails': notificationList
      };

      this._entityNotificationService.saveEntityNotification(payload).then((res: any) => {
        this._commonHelper.hideLoader();
        resolve(null);
      }, (err) => {
        this._commonHelper.hideLoader();
        reject(err);
      });
    });
  }

  onRelatedToChange(e) {
    if (e.value) {
      this.getRelatedTo([e['value'].id], 0, e.filter);
    } else {
      this.relatedToList = [];
      this.selectRelatedto = [];
    }
  }

  onRelatedToClear(e) {
    if (e.value) {
      this.getRelatedTo([e['value'].id], 0, e.filter);
    } else {
      this.relatedToList = [];
      this.selectRelatedto = [];
    }
  }

   // get related to entities based on entity type
   private getRelatedTo(selectedEntities: any, includeAllEntities, searchString: any = '', selectedEntityID = null) {
    return new Promise((resolve, reject) => {
      this.showRelatedToLoader = true;
      this.relatedToList = [];
      let params = [{
        name: 'EntityTypeIDs',
        type: 'string',
        value: selectedEntities && selectedEntities.length > 0 ? selectedEntities.toString() : null
      },
      {
        name: 'SelectedEntityID',
        type: 'int',
        value: selectedEntityID
      },
      {
        name: 'IncludeAllEntities',
        type: 'bit',
        value: includeAllEntities
      },
      {
        name: 'SearchString',
        type: 'string',
        value: searchString
      }];

      this._dataSourceService.getDataSourceDataByCodeAndParams(DataSources.ALL_RELATED_ENTITIES, params)
      .then((response: any) => {
        if (response && response.length > 0) {
          let responseList: any = response as [];
          this.relatedToList = responseList.map(x => ({ 'label': x.label, 'value': x.value }));
        }
        this.showRelatedToLoader = false;
        resolve(true);
      }, (error) => {
        this.showRelatedToLoader = false;
        this._commonHelper.showToastrError(error.message);
        reject(false);
      });
    }).catch();
  }

}
