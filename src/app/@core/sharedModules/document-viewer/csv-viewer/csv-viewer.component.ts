//MODULES
import { Component, Input, OnInit } from '@angular/core';

//COMMON  
import { CommonHelper } from '../../../common-helper';

//THIRD PARTY MODULES
import * as Papa from 'papaparse';

//SERVICES
import { DocumentViewerService } from '../document-viewer.service';

@Component({
  selector: 'ngx-csv-viewer',
  templateUrl: './csv-viewer.component.html',
  styleUrls: ['./csv-viewer.component.scss']
})
export class CsvViewerComponent implements OnInit {

  /***
   * CSV URL.
   */
  @Input() url;

  records: any[] = [];
  headers: any[] = [];
  header = false;

  constructor(private _commonHelper: CommonHelper,
    private _documentViewerService: DocumentViewerService) {

  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    if (!this.url) {
      return;
    }

    this._commonHelper.showLoader();

    this._documentViewerService.getCSVData(this.url).then((data: any) => {
      this._commonHelper.hideLoader();
      if (data && data != '') {
        //Parse Json String
        Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
          complete: (result: any) => {
            const fields = result?.meta?.fields;
            const data = result?.data;

            if (fields && fields?.length > 0) {
              this.headers = [...fields];
            }

            if (this.headers && this.headers.length > 0 && data && data?.length > 0) {

              data.forEach((item: any) => {
                let rowData: any[] = [];
                this.headers.forEach(h => {
                  rowData.push(item[h]);
                })
                this.records.push(rowData);
              });
            }
          }
        });
      }
    }, error => {
      this._commonHelper.hideLoader();
    })
  }

}
