import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookmarkComponent } from './bookmark/bookmark.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    BookmarkComponent
  ],
  imports: [
    CommonModule,
    NgbTooltipModule,
    TranslateModule
  ],
  exports: [
    BookmarkComponent
  ]
})
export class EntityBookmarkModule { }
