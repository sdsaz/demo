import { Component, OnInit,Input} from '@angular/core';

@Component({
  selector: 'ngx-audio-viewer',
  templateUrl: './audio-viewer.component.html',
  styleUrls: ['./audio-viewer.component.scss']
})
export class AudioViewerComponent implements OnInit {
    @Input() url;
    @Input() type;
   // @Input() thumbnailUrl;

    isAudioPlayable:boolean = false;
    playebleType: string[] = [
                        "audio/wav",
                        "audio/mpeg",
                        "audio/mp4",
                        "audio/ogg",
                        "audio/webm",
                        "audio/flac",
                        "audio/mp3"
                      ];
    
    constructor() {}

    ngOnInit(){
      this.isAudioPlayable = this.playebleType.some(x=>x == this.type);
    }
    
}
