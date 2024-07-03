import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CommonJsonGridComponent } from "./common-json-grid.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TabLevelLoaderModule } from "../../sharedComponents/tab-level-loader/tab-level-loader.module";
import { TranslateModule } from "@ngx-translate/core";
import { ConfiguredEntityNamePipeModule } from "../../pipes/configured-entity-name-pipe/configured-entity-name-pipe.module";
import { NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { TrimValueModule } from "../../sharedDirective/trim-value/trim-value.module";
import { NgxMaskDirective } from 'ngx-mask';
import { DropdownModule } from "primeng/dropdown";
import { DisplayValueFinderModule } from "../../pipes/display-value-finder/display-value-finder.module";

@NgModule({
  declarations: [CommonJsonGridComponent],
  exports: [CommonJsonGridComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TranslateModule,
    TabLevelLoaderModule,
    ConfiguredEntityNamePipeModule,
    NgbTooltipModule,
    NgxMaskDirective,
    TrimValueModule,
    DropdownModule,
    DisplayValueFinderModule
  ],
})
export class CommonJsonGridModule {}
