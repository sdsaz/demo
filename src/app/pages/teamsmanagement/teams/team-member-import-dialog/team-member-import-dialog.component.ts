import { Component, ViewChild } from '@angular/core';
import { CommonHelper } from '../../../../@core/common-helper';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { TeamsService } from '../teams.service';
import { DownloadFileMimeType } from '../../../../@core/enum';

@Component({
  selector: 'ngx-team-member-import-dialog',
  templateUrl: './team-member-import-dialog.component.html',
  styleUrls: ['./team-member-import-dialog.component.scss']
})
export class TeamMemberImportDialogComponent {

  @ViewChild('fileInput', { static: false }) fileInput;
  @ViewChild('labelImport', { static: false }) labelImport;

  private fileContents: any[] = [];
  private fileNames: string[] = [];

  hasFilePosted: boolean = false;

  importErrorMessage: string;

  constructor(
    private _ngbActiveModal: NgbActiveModal,
    private _commonHelper: CommonHelper,
    private _teamService: TeamsService) { }
    
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
            this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('TEAMS.TEAM_MEMBERS_IMPORT.FILE_FORMAT_ERROR'));
            this.cancelBulkImport();
          } else {
            return f.name;
          }
        }).join(', ');
    }
  }

  downloadImportTeamMemberTemplate(): void {

    this._commonHelper.showLoader();
    this._teamService.downloadImportTeamMembersTemplate().then((base64String: any) => {
      this._commonHelper.downloadFile(this._commonHelper.getConfiguredEntityName('{{TeamMembers_plural_p}}') + '_' + this._commonHelper.getInstanceTranlationData('TEAMS.TEAM_MEMBERS_IMPORT.DOWNLOAD_ENTITY_FILE_POSTFIX') + '_' + `${moment().format("YYYY-MM-DDTHH:mm:ss")}.xlsx`, DownloadFileMimeType.Excel, base64String);
      this._commonHelper.hideLoader();
    }, error => {
      this._commonHelper.hideLoader();
      this.getTranslateErrorMessage(error);
    });
  }

  importBulkTeamMembers(): void {
    if (this.fileInput.nativeElement.files.length == 0) {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(this._commonHelper.getInstanceTranlationData('TEAMS.TEAM_MEMBERS_IMPORT.SELECT_FILE_ERROR'));
      return;
    }

    let params: any = {
      fileContent: this.fileContents[0],
      fileName: this.fileNames[0]      
    }

    this._commonHelper.showLoader();
    this._teamService.importTeamMembers(params)
      .then(() => {
        this._commonHelper.showToastrSuccess(this._commonHelper.getInstanceTranlationData('TEAMS.TEAM_MEMBERS_IMPORT.SUCCESS_MESSAGE'));
        this._commonHelper.hideLoader();
        this.onClose(true);
      }, (error) => {
        this._commonHelper.hideLoader();
        this.cancelBulkImport();
        if (error.messageCode == 'Import.Validation')
          this.importErrorMessage = error.message;
        else
          this.getTranslateErrorMessage(error);          
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

  private cancelBulkImport(): void {
    this.fileInput.nativeElement.value = '';
    this.hasFilePosted = false;
    this.labelImport.nativeElement.innerText = this._commonHelper.getInstanceTranlationData('TEAMS.TEAM_MEMBERS_IMPORT.NOFILE_ERROR');
    this.fileContents = [];
    this.fileNames = [];
  }

  private getTranslateErrorMessage(error): void {
    if (error != null && error.messageCode) {
      this._commonHelper.showToastrError(
        this._commonHelper.getInstanceTranlationData('TEAMS.' + error.messageCode.replaceAll('.', '_').toUpperCase())
      );
    }
  }
  //#endregion Private methods

}
