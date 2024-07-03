import { Component, Input, OnInit } from '@angular/core';
import { DocumentMimeType } from '../../../sharedModels/document-mime-type';

@Component({
  selector: 'ngx-video-viewer',
  templateUrl: './video-viewer.component.html',
  styleUrls: ['./video-viewer.component.scss']
})
export class VideoViewerComponent implements OnInit{

  @Input() url;
  @Input() type;
  @Input() thumbnailUrl;

  isVideoPlayable:boolean = false;
  playebleType: string[] = ["video/mp4", 
                            "video/webm", 
                            "video/quicktime",
                            "video/webm",
                            "audio/ogg",
                            "video/ogg",
                            "application/ogg"];
  
  constructor() {}

  ngOnInit(){
    this.isVideoPlayable = this.playebleType.some(x=>x == this.type);
  }
}
