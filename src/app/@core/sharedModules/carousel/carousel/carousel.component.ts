import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FileSignedUrlService } from '../../../sharedServices/file-signed-url.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Carousel } from '../../../sharedModels/carousel';

@Component({
  selector: 'ngx-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarouselComponent implements OnInit {

  /**
   * File List
   */
  @Input() fileList: Carousel[] = [];

  /**
   * Selected Index
   */
  @Input() activeIndex: number = 0;

  /**
   * Entity Type ID
   */
  @Input() entityTypeID: number;

  /**
   * Check user has download permission or not
   */
  @Input() isDocumentDownloadPermission: boolean = false;

  totalCount: number = 0;
  showLoader: boolean;

  constructor(private _fileSignedUrlService: FileSignedUrlService,
    private _ngbActiveModal: NgbActiveModal,
    private _cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.fileList.length == 0) return;
    this.totalCount = this.fileList.length;
    this.getFileSignedUrl(this.activeIndex);
  }

  next() {
    if ((this.activeIndex + 1) == this.totalCount) return;

    this.activeIndex = this.activeIndex + 1;
    this.getFileSignedUrl(this.activeIndex);
  }

  prev() {
    if (this.activeIndex == 0) return;

    this.activeIndex = this.activeIndex - 1;
    this.getFileSignedUrl(this.activeIndex);
  }

  close() {
    this._ngbActiveModal.close();
  }

  trackBy(index: number, carousel: Carousel) {
    return carousel.id;
  }

  //#region  Private Methods
  private getFileSignedUrl(index: number) {
    this.showLoader = true;
    this._fileSignedUrlService.getObjectFileSignedUrl(this.fileList[index], this.entityTypeID, 'filePath', 'imageSrc').then(() => {
      this.showLoader = false;
      this._cdr.markForCheck();
    }, () => {
      this.showLoader = false;
      this._cdr.markForCheck();
    });
  }
  //#endregion
}
