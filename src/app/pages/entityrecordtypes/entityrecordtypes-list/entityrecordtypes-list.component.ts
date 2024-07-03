import { OnInit, ViewChild, Component } from '@angular/core';
import { Table } from 'primeng/table';
import { Paginator } from 'primeng/paginator';
import { CommonHelper, enumPermissions } from '../../../@core/common-helper';
import { CommonService } from '../../../@core/sharedServices/common.service';

@Component({
  selector: 'entityrecordtypes-list',
  templateUrl: './entityrecordtypes-list.component.html',
  styleUrls: ['./entityrecordtypes-list.component.scss']
})
export class EntityRecordTypesListComponent implements OnInit {
  //Form View child
  @ViewChild('pTable') private pTable: Table;
  @ViewChild('paginator') paginator: Paginator;

  //entity record type list data source
  dataSource: any[] = [];

  isListEntityRecordTypes: boolean = false;
  
  //Table Column
  cols: any[];
  totalRecords: number;
  isShowActionColumn: boolean = false;

  constructor(private _commonHelper: CommonHelper,
    private _commonService: CommonService) {
      this.isListEntityRecordTypes = this._commonHelper.havePermission(enumPermissions.ListEntityRecordTypes);

    this.cols = [
      { field: 'name', header: 'Record Type', sort: true },
      { field: 'isActive', header: 'Active', sort: false }
    ];

    this._commonHelper.getTranlationData('dummyKey').then(result => {
      this.cols.forEach(item => {
        item.header = _commonHelper.getInstanceTranlationData(item.header);
      });
    });
  }

  ngOnInit(): void {
    this.getEntityRecordTypes();
  }

  getEntityRecordTypes() {    
    this._commonHelper.showLoader();
    this._commonService.getEntityRecordTypes().then(
      response => {        
        setTimeout(() => {
          if (response) {
            this.dataSource = response as any[];

            if (this.dataSource.length > 0) {
              this.totalRecords = response[0]['totalRecords'];
            } else {
              this.totalRecords = 0;
            }            
          }
          this._commonHelper.hideLoader();
        }, 200);
        
      },
      (error) => {
        this._commonHelper.hideLoader();
        if (error != null && error.messageCode) {
          this._commonHelper.showToastrError(
              this._commonHelper.getInstanceTranlationData('ENTITYRECORDTYPES.' + error.messageCode.replace('.', '_').toUpperCase())
          );
        }
      });
  }
}