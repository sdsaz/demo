import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { CommonHelper } from '../../../common-helper';
import { EntityTagsViewService } from '../entity-tags-view.service';
import { FileSignedUrlService } from '../../../sharedServices/file-signed-url.service';
import { Entity } from '../../../enum';

@Component({
  selector: 'entity-tags-view',
  templateUrl: './entity-tags-view.component.html',
  styleUrls: ['./entity-tags-view.component.scss']
})
export class EntityTagsViewComponent implements OnInit {

  @Input() entityId: number;
  @Input() entityTypeId: number;
  @Input() entityRecordTypeId: number;
  @Input() refreshEntityTag: boolean = false;

  tagList: any[] = [];
  constructor(private _entitytagsviewService: EntityTagsViewService,
    private _commonHelper: CommonHelper,
    private _fileSignedUrlService: FileSignedUrlService) { }

  ngOnInit(): void {
    this.getActivatedEntityTagsByAccountId();
    this._commonHelper.entityTagsAsObs.subscribe((isRefreshEntityTags: any) => {
      if(isRefreshEntityTags) {
        this.getActivatedEntityTagsByAccountId();
      }
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.refreshEntityTag?.firstChange) {
      this.getActivatedEntityTagsByAccountId();
    }
  }

  getActivatedEntityTagsByAccountId() {
    let params = {
      entityId: this.entityId,
      entityTypeId: this.entityTypeId,
      entityRecordTypeId: this.entityRecordTypeId
    }

    this._entitytagsviewService.getActivatedEntityTagsByEntityId(params).then((response: any) => {
      if (response) {
        this.tagList = response;
        this.tagList.forEach((data : any) => {
          if (data.tagImage) {
            const pos = String(data.tagImage).lastIndexOf('/');
            const fileName = String(data.tagImage).substr(pos+1,String(data.tagImage).length - pos)
            this._fileSignedUrlService.getSingleFileSignedUrl(Entity.EntityTags, fileName).then(res => {
              if (res) {
                data.imageSignedUrl = res;
              }
            });
          }
        });
      }
    });
  }
  

}
