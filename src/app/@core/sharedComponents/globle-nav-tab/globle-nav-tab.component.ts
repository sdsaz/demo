import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonHelper } from '../../common-helper';

@Component({
  selector: 'ngx-globle-nav-tab',
  templateUrl: './globle-nav-tab.component.html',
  styleUrls: ['./globle-nav-tab.component.scss']
})
export class GlobleNavTabComponent {

  @Input() navTabs: any;
  @Input() isAdditionalTab: boolean = false;
  @Input() isNativeTab: boolean = true;
  @Input() selectedTabLink: string = '';
  @Output() setTab = new EventEmitter<any>();
  @Output() closeTab = new EventEmitter<any>();
  navTabsMore: any = [];
  selectedTab: any

  constructor(public _commonHelper: CommonHelper) {
  }

  ngOnInit() {
    //Make tab active base on Addition tab
    this._commonHelper.autoTabEventEvent.subscribe((tab: any) => {
      this.selectedTab = tab.tabLink;
     
    });
    //After On Init
  }

  //Call on Tab click so set active tabs also loading tabs contents....
  callSetTab(tab) {
    this.selectedTab = tab.tabLink;
    let param: any = {};
    param.isAdditionalTab = tab.tabLink === "additionalTabs";
    param.isNativeTab = true; // always true
    param.tab = tab;
    this.setTab.emit(param);
  }

  callCloseTab(tab) {
    let param: any = {};
    param.tab = tab;
    this.closeTab.emit(param)
  }

}
