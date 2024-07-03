import { Injectable } from '@angular/core';
import { CommonHelper } from '../common-helper';
import { DocumentService } from '../sharedComponents/documents/document.service';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class FileSignedUrlService {

  constructor(private _commonHelper: CommonHelper, private _documentService: DocumentService) { 
  }

  async getFileSingedUrl(records: any[], filterColumn: string, newColumn: string, entityTypeId: number) {

    if (!records || records.length == 0) {
      return Promise.resolve(null);
    }

    const filterRecord = records.filter(x => x[filterColumn] != null && x[filterColumn] !== '');

    let distinctRecords = [...new Set(filterRecord.map(item => item[filterColumn]))];

    const entity = this._commonHelper.entityTypeList.find(x => x.id == entityTypeId);

    if (!entity) {
      return Promise.resolve(null);
    }

    await distinctRecords.reduce(async (index, fileName) => {
      if (!entity.isStoragePublic) {
        await this.getDistinctFileSignedUrl(entityTypeId, fileName, records,filterColumn, newColumn);
      } else {
        this.getPublicUrl(entity, fileName, records,filterColumn, newColumn);
      }      
    }, Promise.resolve());

  }

  getSingleFileSignedUrl(entityTypeId: number, fileName: string) {

    return new Promise((resolve, reject) => {

      const entity = this._commonHelper.entityTypeList.find(x => x.id == entityTypeId);

      if (!entity) {
        return Promise.resolve(null);
      }

      if (!entity.isStoragePublic) {

        const payload = {
          entityTypeId: entityTypeId,
          fileName: fileName
        };

        const fileInfo = JSON.parse(this._commonHelper.getLocalStorageDecryptData(fileName));

        if (fileInfo && this.getNowUTC() < new Date(moment(fileInfo.expireDate).utc().format('YYYY-MM-DD HH:mm:ss'))) {
          resolve(fileInfo.filePath);
        } else {
          this._documentService.getFileSignedUrl(payload).then((res: any) => {
            if (res) {
              this._commonHelper.setLocalStorageEncryptData(fileName, JSON.stringify(res));
              resolve(res.filePath);
            }
          }, () => {
            resolve(null);
          });
        }
      } else {
        const storagePath = String(entity.storageRelativePath).replace('{{TRK}}',this._commonHelper.loggedUserDetail.tenantRecordKey);
        resolve(this._commonHelper.globalBucketURL.replace(/\/\s*$/, "") + storagePath + fileName);
      }
    });
  }

  getObjectFileSignedUrl(obj: any, entityTypeId: number, columnName: string, signedUrlColumnName: string) {

    return new Promise((resolve, reject) => {

      if (!obj[columnName]) {
        resolve(null);
      }

      const entity = this._commonHelper.entityTypeList.find(x => x.id == entityTypeId);

      if (!entity) {
        return Promise.resolve(null);
      }
      if (!entity.isStoragePublic) {
        const payload = {
          entityTypeId: entityTypeId,
          fileName: obj[columnName]
        };

        const fileInfo = JSON.parse(this._commonHelper.getLocalStorageDecryptData(obj[columnName]));

        if (fileInfo && this.getNowUTC() < new Date(moment(fileInfo.expireDate).utc().format('YYYY-MM-DD HH:mm:ss'))) {
          obj[signedUrlColumnName] = fileInfo.filePath;
          resolve(fileInfo.filePath);
        } else {
          this._documentService.getFileSignedUrl(payload).then((res: any) => {
            if (res) {
              this._commonHelper.setLocalStorageEncryptData(obj[columnName], JSON.stringify(res));
              obj[signedUrlColumnName] = res.filePath;
              resolve(null);
            }
          }, () => {
            resolve(null);
          });
        }
      } else {
        const storagePath = String(entity.storageRelativePath).replace('{{TRK}}',this._commonHelper.loggedUserDetail.tenantRecordKey);
        obj[signedUrlColumnName] = this._commonHelper.globalBucketURL.replace(/\/\s*$/, "") + storagePath + obj[columnName];
        resolve(null);
      }
    });
  }
  
  private async getDistinctFileSignedUrl(entityTypeId: number, fileName: string, records: any[], filterColumn: string, newColumn: string) {
    return new Promise((resolve, reject) => {

      const payload = {
        entityTypeId: entityTypeId,
        fileName: fileName
      };

      const fileInfo = JSON.parse(this._commonHelper.getLocalStorageDecryptData(fileName));

      if (fileInfo && this.getNowUTC() < new Date(moment(fileInfo.expireDate).utc().format('YYYY-MM-DD HH:mm:ss'))) {
        this.updateRecordList(records, filterColumn, fileName, newColumn, fileInfo);
        resolve(null);
      } else {
        this._documentService.getFileSignedUrl(payload).then((res: any) => {
          if (res) {
            this._commonHelper.setLocalStorageEncryptData(fileName, JSON.stringify(res));
            this.updateRecordList(records, filterColumn, fileName, newColumn, res);
            resolve(null);
          }
        }, () => {
          resolve(null);
        });
      }
    });
  }

  private updateRecordList(records: any[], filterColumn: string, fileName: string, newColumn: string, fileInfo: any) {
    records.forEach(x => {
      if (x[filterColumn] != null && x[filterColumn] !== '' && x[filterColumn] === fileName) {
        x[newColumn] = String(fileInfo.filePath);
      }
    });
  }

  private getNowUTC() {
    const now = new Date();
    return new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  }

  private getPublicUrl(entity: any, fileName: string, records: any[], filterColumn: string, newColumn: string) {
    
    const url = this._commonHelper.globalBucketURL.replace(/\/\s*$/, "");

    const storagePath = String(entity.storageRelativePath).replace('{{TRK}}',this._commonHelper.loggedUserDetail.tenantRecordKey);

    records.forEach(x => {
      if (x[filterColumn] != null && x[filterColumn] !== '' && x[filterColumn] === fileName) {
        x[newColumn] = url + storagePath + fileName
      }
    });
  }
}
