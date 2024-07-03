import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonHelper } from '../../../common-helper';
import { CommonService } from '../../../sharedServices/common.service';
import { DocumentService } from '../document.service';


@Component({
    selector: 'document-list',
    templateUrl: './document-list.component.html',
    styleUrls: ['./document-list.component.scss']
})

export class DocumentListComponent implements OnInit {

    @Input() entityTypeId: number;
    @Input() entityId: number;
    @Input() uid: number;
    @Input() event: Event;

    documentQuickFilterOptions: any[] = [];
    documentQuickFilterSelected: string = '';
    documentDataSource: any;

    constructor(public _route: Router,
        public _commonHelper: CommonHelper,
        private _commonService: CommonService,
        private _documentService: DocumentService) { }

    ngOnInit() {
        this.getEntityTimespanRef();
    }

    loadDocumentData() {
        if (this.documentQuickFilterSelected != undefined && this.documentQuickFilterSelected != '') {
            this._commonHelper.showLoader();
            let params = {
                entityTypeId: this.entityTypeId,
                entityId: this.entityId,
                //timespanName: this.documentQuickFilterSelected['strValue1']
            }

            this._documentService.getAllDocuments(params).then(
                response => {
                    this._commonHelper.hideLoader();
                    this.documentDataSource = response;
                },
                (error) => {
                    this._commonHelper.hideLoader();
                    this._commonHelper.showToastrError(this.getTranslateErrorMessage(error.messageCode));
                });
        }
    }

    //get entity time span from reference types
    getEntityTimespanRef() {
        // this._commonHelper.showLoader();
        // this._commonService.fillReferenceTypesByRefType(RefType.EntityTimespan).subscribe((response: any) => {
        //     if (response) {
        //         this.documentQuickFilterOptions = response;
        //         this.documentQuickFilterSelected = this.documentQuickFilterOptions[5];
        //         this._commonHelper.hideLoader();
        //         //load first time data
        //         this.loadDocumentData();
        //     }

        // },
        //     (error) => {
        //         this._commonHelper.hideLoader();
        //         this._commonHelper.showToastrError(this.getTranslateErrorMessage(error.messageCode));
        //     });
    }

    getTranslateErrorMessage(messageCode: string): string {
        return this._commonHelper.getInstanceTranlationData('DOCUMENTS.' + messageCode.replace('.', '_').toUpperCase());
    }
}
