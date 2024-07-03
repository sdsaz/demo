import { AfterViewInit, ChangeDetectorRef, Component, HostListener, NgZone, OnInit } from '@angular/core';
import { CommonHelper } from '../@core/common-helper';
import { NbMenuItem } from '@nebular/theme';
import { UsersService } from './usermanagement/users/users.service';
import * as $ from "jquery";
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menuItems" id="sectionMenu" class="section-menu" (click)="toggleSidebarSmall()"></nb-menu>
      <router-outlet>
        <div id="sidebarOverlay" class="sidebar-overlay" (click)="toggleSidebar()"></div>  
      </router-outlet>
    </ngx-one-column-layout>
  `,
})
export class PagesComponent implements OnInit, AfterViewInit {
  windowWidth: number;
  menuState: any = {};

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.windowWidth = window.innerWidth;
  }

  private _loggedInUser: any;
  menuItems: Array<NbMenuItem> = [];
  url: string;
  assignedEntityCounts: any;

  constructor(
    private _commonHelper: CommonHelper,
    private _usersService: UsersService,
    private _router: Router,
    private _activeRoute: ActivatedRoute,
    public zone: NgZone,
    private cdref: ChangeDetectorRef
  ) {
    this._loggedInUser = this._commonHelper.getLoggedUserDetail();

    setTimeout(() => {
      // Kanban view - Avoid page vertical scroll start
      $('.desktop-overflow-hidden').closest('nb-layout.window-mode').find('.scrollable-container').addClass("overflow-y-hidden");
      // Kanban view - Avoid page vertical scroll end

      // SDC-836: Form.io - form builder
      $('.custom-form-builder .form-builder-panel .builder-group-button').click(function () {
        $('.custom-form-builder .form-builder-panel').find('.collapse[ref="sidebar-group"]').removeClass("show");
        $(this).closest('.custom-form-builder .form-builder-panel').find('.collapse[ref="sidebar-group"]').toggleClass("show");
      });

      //Remove tooltip from menu items
      $("nb-sidebar .menu-items .menu-item a").attr("title", "");
    }, 500);

    setInterval(() => {
      // Menu bar icon alignment start
      $('nb-sidebar .menu-items .menu-item .menu-items.collapsed').closest('nb-sidebar .menu-items .menu-item').find('a nb-icon.expand-state').addClass("menu-collapsed-icon");
      $('nb-sidebar .menu-items .menu-item .menu-items.collapsed').closest('nb-sidebar .menu-items .menu-item').find('a nb-icon.expand-state').removeClass("menu-expanded-icon");
      $('nb-sidebar .menu-items .menu-item .menu-items.expanded').closest('nb-sidebar .menu-items .menu-item').find('a nb-icon.expand-state').addClass("menu-expanded-icon");
      $('nb-sidebar .menu-items .menu-item .menu-items.expanded').closest('nb-sidebar .menu-items .menu-item').find('a nb-icon.expand-state').removeClass("menu-collapsed-icon");

      $('nb-sidebar .menu-items .menu-item .menu-items .menu-item .menu-items.collapsed').closest('nb-sidebar .menu-items .menu-item').find('a nb-icon.expand-state').addClass("menu-collapsed-icon");
      $('nb-sidebar .menu-items .menu-item .menu-items .menu-item .menu-items.collapsed').closest('nb-sidebar .menu-items .menu-item').find('a nb-icon.expand-state').removeClass("menu-expanded-icon");
      $('nb-sidebar .menu-items .menu-item .menu-items .menu-item .menu-items.expanded').closest('nb-sidebar .menu-items .menu-item').find('a nb-icon.expand-state').addClass("menu-expanded-icon");
      $('nb-sidebar .menu-items .menu-item .menu-items .menu-item .menu-items.expanded').closest('nb-sidebar .menu-items .menu-item').find('a nb-icon.expand-state').removeClass("menu-collapsed-icon");
      // Menu bar icon alignment end

      // Menu bar - Parent menu background color start
      $('nb-sidebar .menu-items .menu-item .menu-items.expanded').prev('a').addClass("menu-opacity");
      $('nb-sidebar .menu-items .menu-item .menu-items .menu-item .menu-items.expanded').prev('a').addClass("menu-opacity");
      $('nb-sidebar .menu-items .menu-item .menu-items.collapsed').prev('a').removeClass("menu-opacity");
      $('nb-sidebar .menu-items .menu-item .menu-items .menu-item .menu-items.collapsed').prev('a').removeClass("menu-opacity");
      // Menu bar - Parent menu background color end

      var docWidth = $(document).width();
      if (docWidth > 1140) {
        // Sidenav hover effect
        $('nb-sidebar.compacted').mouseenter(function () {
          $("body").addClass("sidebar-hover");
        });

        $('nb-sidebar').mouseleave(function () {
          $("body").removeClass("sidebar-hover");
        });

        $('nb-sidebar.expanded').mouseenter(function () {
          $("body").removeClass("sidebar-hover");
        });

        $('nb-sidebar.expanded').mouseleave(function () {
          $("body").removeClass("sidebar-hover");
        });

        $("body.expanded").removeClass("sidebar-hover");
        $("body.compacted").find("nb-sidebar").removeClass("expanded").addClass("compacted");
      }

      if ((docWidth < 1139) && (docWidth > 575)) {
        $("body:not(.expanded)").removeClass("expanded").removeClass("collapsed").addClass("compacted");
        $("body:not(.expanded)").find("nb-sidebar").removeClass("expanded").removeClass("collapsed").addClass("compacted");
        $("nb-sidebar:not(.expanded)").closest("body").removeClass("expanded").removeClass("collapsed").addClass("compacted");
        $("nb-sidebar:not(.expanded)").removeClass("expanded").removeClass("collapsed").addClass("compacted");
      }

      if (docWidth < 1139) {
        $("body").removeClass("sidebar-hover");
      }

      $("body.expanded").find("nb-sidebar").removeClass("compacted").addClass("expanded");

      if (docWidth < 575) {
        $("body.expanded.collapsed").removeClass("expanded").removeClass("compacted");
        $("body.collapsed").find("nb-sidebar.collapsed.expanded").removeClass("expanded").removeClass("compacted");
        $("nb-sidebar.collapsed").closest("body").removeClass("expanded").removeClass("compacted");
        $("nb-sidebar.collapsed").removeClass("expanded").removeClass("compacted");
      }

      var lessFilterCount = $(".filters-four .basic-filter").length;
      if (lessFilterCount == 5) {
        $(".filters-custom").addClass("five-basic-filters");
      }
      var basicFilterCount = $(".filters-five .basic-filter").length;
      if (basicFilterCount == 7) {
        $(".filters-five .basic-filter").addClass("filters-7");
      }
      else if (basicFilterCount == 6) {
        $(".filters-five .basic-filter").addClass("filters-6");
      } else if (basicFilterCount == 4) {
        $(".filters-five .basic-filter").addClass("filters-4");
        $(".filters-custom").addClass("four-basic-filters");
      }
      // Remove extra space from Worktask filters in workflows where "Related to" dropdown doesn't exist
      $('#drp-assignedToIDs').closest(".filter-width").addClass("filter-assignedToIDs");
      $('#drp-tagIDs').closest(".filter-width").addClass("filter-tagIDs");
      $('.four-basic-filters #drp-verifiedByIDs').closest(".filter-width").addClass("filter-verifiedByIDs");

      // Activity Center Tags Dropdown height start
      var tagDropdownHeight = $('.tag-multiselect .p-multiselect-trigger').outerHeight();
      $('.tag-multiselect .p-overlay.p-component').css("top", tagDropdownHeight + 1);
      // Activity Center Tags Dropdown height end
    }, 500);
  }

  //#region Events
  ngOnInit(): void {
    this.menuItems = this._commonHelper.getUserMenuItemsCache();
    if (!this.menuItems || this.menuItems.length <= 0) {
      this.menuItems = this._activeRoute.snapshot.data['menuItemResolver'];
      this._commonHelper.setUserMenuItemsCache(this.menuItems);
      this.navigateFirstOrDefaultDashboardPage(this.menuItems);
    }
    
    if (this._commonHelper.assignedEntityCounts && this._commonHelper.assignedEntityCounts.length > 0) {
      this.assignedEntityCounts = this._commonHelper.assignedEntityCounts;
      this.recursiveMenu(this.menuItems);
      return;
    }

    this._usersService.getAssignedEntityCounts().then((response: any[]) => {
      if (response) {
        this.assignedEntityCounts = response;
        this._commonHelper.assignedEntityCounts = this.assignedEntityCounts;
        this.recursiveMenu(this.menuItems);
      }
    });
  }
  //#endregion

  recursiveMenu(menuItem: NbMenuItem[]) {
    menuItem.forEach(menuItem => {
      if (menuItem.children && menuItem.children.length > 0) {
        this.recursiveMenu(menuItem.children);
      } else {
        const obj = this.assignedEntityCounts.find(x => x.entityWorkflowID == menuItem['entityWorkflowID'] && x.entityTypeID == menuItem['entityTypeID'] && menuItem['isCountRequired']);
        if (obj) {
          menuItem.badge = {
            text: obj.entityCount,
            status: "danger"
          };
        }
      }
    });
  }

  ngAfterViewInit(): void {
    if (window.innerWidth > 575) {
      switch ($('body').hasClass('compacted')) {
        case (true):
          $('nb-sidebar').removeClass('expanded');
          $('nb-sidebar').addClass('compacted');
          break;
        case (false):
          $('nb-sidebar').removeClass("compacted").removeClass("collapsed");
          $('nb-sidebar').addClass('expanded');
          $("body").removeClass("sidebar-hover");
          break;
      }
    }
    setTimeout(() => {
      //Menu bar id assignment start            
      $('nb-sidebar > .main-container > .scrollable > nb-menu > .menu-items > .menu-item > a > .menu-title').each(function (index) {
        $(this).parent().attr('id', 'menu' + $(this).text().replace(/ /g, ""));
      });

      $('nb-sidebar > .main-container > .scrollable > nb-menu > .menu-items > .menu-item .menu-items .menu-item .menu-title').each(function (index) {
        $(this).parent().attr('id', 'submenu' + $(this).text().replace(/ /g, ""));
      });
      //Menu bar id assignment end
    }, 1);
    this.cdref.detectChanges();
  }

  ngAfterContentInit(): void {
    if (window.innerWidth > 1139) {
      $('nb-sidebar').mouseenter(function (e) {
        if ($('nb-sidebar').hasClass('compacted')) {
          if (!$('nb-sidebar').hasClass('expanded')) {
            $('nb-sidebar').addClass("compacted");
          }
        }
        e.stopPropagation();
      }).mouseleave(function () {
        if (!$('nb-sidebar').hasClass('compacted')) {
          if (!$('nb-sidebar').hasClass('expanded')) {
            $('nb-sidebar').addClass("compacted");
          }
        }
      });
    }
    this.cdref.detectChanges();
  }

  //#region Private methods
 
  private navigateFirstOrDefaultDashboardPage(menus: Array<NbMenuItem>) {
    //Navigate to first or default dashboard SDC-712 with return url condition
    this.url = this._router.url.toString();
    let keepGoing = true;
    if (this.url.toLowerCase().includes('dashboard')) {
      menus.forEach((menuitem: any) => {
        if (keepGoing) {
          if (menuitem['code']  && String(menuitem['code']).toLowerCase() == 'dashboards') {
            if (!menuitem.children || menuitem.children.length == 0) {
              this._router.navigateByUrl(menuitem.link);
              keepGoing = false;
            } else {
              this._router.navigateByUrl(menuitem.children[0].link);
              keepGoing = false;
            }
          }
        }
      });
    }
  }

  toggleSidebar() {
    if (window.innerWidth > 575) {
      switch ($('nb-sidebar').hasClass('expanded')) {
        case (true):
          $('nb-sidebar').removeClass('expanded');
          $('nb-sidebar').addClass('compacted');
          $('body').addClass('compacted');
          $('body').removeClass('expanded');
          break;
        case (false):
          $('nb-sidebar').removeClass("compacted").removeClass("collapsed");
          $('nb-sidebar').addClass('expanded');
          $('body').addClass('expanded');
          $('body').removeClass('compacted').removeClass("sidebar-hover");
          break;
      }
    } else {
      switch ($('nb-sidebar').hasClass('expanded')) {
        case (true):
          $('nb-sidebar').removeClass('expanded');
          $('nb-sidebar').addClass('collapsed');
          $('body').addClass('collapsed');
          $('body').removeClass('expanded');
          $('body').removeClass('compacted');
          break;
        case (false):
          $('nb-sidebar').removeClass("compacted").removeClass("collapsed");
          $('nb-sidebar').addClass('expanded');
          $('body').addClass('expanded');
          $('body').removeClass('collapsed');
          $('body').removeClass('compacted');
          break;
      }
    }
    this.cdref.detectChanges();
  }

  toggleSidebarSmall() {
    if (window.innerWidth < 576) {
      this.zone.run(() => {
        this.menuState = this.menuState === 'out' ? 'in' : 'out';
      });
    }
  }

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  ngAfterViewChecked() {
    this.cdref.detectChanges();
  }
  //#endregion
}
