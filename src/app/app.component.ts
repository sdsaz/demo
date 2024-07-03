/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, HostListener, OnInit } from '@angular/core';
import { NbIconLibraries } from '@nebular/theme';
import { CommonHelper } from './@core/common-helper';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterEvent } from '@angular/router';

@Component({
  selector: 'ngx-app',
  template: `<div ngxNoRightClick ngxPreventScreenshot ngxPreventPrintWithInspectElement *ngIf="this.commonHelper.showLoadingPanel > 0;" id="global-spinner" class="spinner-wrapper user-select-none">
              <div class="bounce-spinner">
                <div class="bounce1"></div>
                <div class="bounce2"></div>
                <div class="bounce3"></div>
              </div>
            </div>
            <router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit {

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    if (window.innerWidth < 576) {
      $('nb-sidebar').removeClass('compacted');
    }
  }

  constructor(
    public commonHelper: CommonHelper,
    private iconLibrary: NbIconLibraries,
    private router: Router
  ) {
    this.iconLibrary.registerFontPack('fas', { packClass: 'fas', iconClassPrefix: 'fa' });
    this.iconLibrary.registerFontPack('fab', { packClass: 'fab', iconClassPrefix: 'fa' });
    this.iconLibrary.registerFontPack('pi', { packClass: 'pi', iconClassPrefix: 'pi' });
    this.iconLibrary.setDefaultPack('fas');
  }

  ngOnInit() {
    this.commonHelper.hideLoader();
    this.navigationInterceptor();
  }


  private navigationInterceptor() {
    this.router.events.subscribe((routerEvent: RouterEvent) => {
      // if route change started
      if (routerEvent instanceof NavigationStart) {
        this.commonHelper.showLoader();
      }
      // if route change ended
      if (routerEvent instanceof NavigationEnd ||
        routerEvent instanceof NavigationCancel ||
        routerEvent instanceof NavigationError
      ) {
        this.commonHelper.hideLoader();
      }
    });
  }
}
