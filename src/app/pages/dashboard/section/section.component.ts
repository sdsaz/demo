import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'ngx-section',
  templateUrl: './section.component.html',
  styleUrls: ['./section.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SectionComponent implements OnInit {

  @Input() section: any;
  @Input() widgetSizes: any;
  @Input() rangeDates: any[];
  
  @Output() UpdateSectionWidgetSize = new EventEmitter<any>();

  constructor() { }

  ngOnInit(): void {
  }

  getWidgetWidth(size) {
    if (this.section) {
      for (let widgetSize of this.widgetSizes) {
        if (size == widgetSize.size) {
          return widgetSize.width;
        }
      }
    }
    return 0;
  }

  UpdateWidgetSize(event) {
    this.UpdateSectionWidgetSize.emit(event);
  }
}
