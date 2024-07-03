import { Component, Input, OnInit, SimpleChanges, ViewEncapsulation } from "@angular/core";
import { SafehtmlPipe } from "../../../../@core/pipes/safehtml/safehtml.pipe";

@Component({
  selector: "ngx-current-value-default",
  templateUrl: "./current-value-default.component.html",
  styleUrls: ["./current-value-default.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class CurrentValueDefaultComponent implements OnInit {
  @Input() indicatorData: any;
  @Input() selectedUIOptions: any;
  indicatorDataHTML: any;

  constructor(private safeHtml: SafehtmlPipe) {}

  ngOnInit(): void {
    if (this.indicatorData != null && this.indicatorData.length > 0 && this.selectedUIOptions.data != null && this.selectedUIOptions.data != "") {
      this.indicatorDataHTML = this.safeHtml.transform(this.indicatorData[0][this.selectedUIOptions.data]);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    //refresh data
    if (changes != null && changes.indicatorData != null && changes.indicatorData.currentValue &&
      JSON.stringify(changes.indicatorData.currentValue) != JSON.stringify(changes.indicatorData.previousValue)) {
        if (this.indicatorData.length > 0 && this.selectedUIOptions.data != null && this.selectedUIOptions.data != "") {
          this.indicatorDataHTML = this.safeHtml.transform(this.indicatorData[0][this.selectedUIOptions.data]);
        }
      }
    }
}
