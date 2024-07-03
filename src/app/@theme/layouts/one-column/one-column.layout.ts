import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { CommonHelper } from '../../../@core/common-helper';
import {  Entity, LocalStorageKey } from '../../../@core/enum';
import { Subject, map, takeUntil } from 'rxjs';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';
import { ThemeService } from '../../../@core/sharedServices/theme.service';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { Router } from '@angular/router';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';
import { UsersService } from '../../../pages/usermanagement/users/users.service';
import { ProfileService } from '../../../pages/usermanagement/profile/profile.service';
import { AuthenticationService } from '../../../pages/auth/auth.service';

@Component({
  selector: 'ngx-one-column-layout',
  styleUrls: ['./one-column.layout.scss'],
  templateUrl: './one-column.layout.html' 
})
export class OneColumnLayoutComponent implements OnInit {

  @Input() username: any;
  private destroy$: Subject<void> = new Subject<void>();
  userPictureOnly: boolean = false;
  user: any;
  enableDarkMode: boolean = false;
  loggedInUserName: any;
  loggedInUserTenantImagePath: any;
  environmentInstance: any;
  selectedLanguage=null;
  themes = [
    {
      value: 'default',
      name: 'Light'
    },
    {
      value: 'dark',
      name: 'Dark'
    }
  ];

  currentTheme = 'default';
  windowWidth: number;
  loggedInUserTenantName: any;
  loggedInUserProfile: any;
  loggedInUserShortName: string;
  loggedInUserAvatarBGColor: string;

  loggedInUserDetails: any;
  localStorageKeyPrefix: string = '';

  @HostListener('window:resize', ['$event'])
  // onWindowResize() {
  //   this.windowWidth = window.innerWidth;
  // }

  //global search
  searchResult: any;
  searchText: string = '';
  showSearchbarSpinner: boolean = false;
  bodyElement: any;
  isMouseOverSearchResult:boolean = false;
  @ViewChild('txtGlobalSearch') globalSearchTextBox: ElementRef;
  menuExpanded: boolean = true;
  menuItems?: any;
  userProfileLink?: any; 
  userLogoutLink?: any;
  userReturnToUser?: any;

  public currentYear = new Date().getUTCFullYear();
  public client: string;
  public version: string;
  isImpersonateLoginUser: boolean;

  //user details
  loggedInTenantUserId: number;
  loggedInUserId: number;

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.windowWidth = window.innerWidth;
    if (window.innerWidth > 1139) {
      if ($('nb-sidebar').hasClass('collapsed')) {
        $('nb-sidebar').removeClass('collapsed');
        $('nb-sidebar').removeClass('expanded');
        $('nb-sidebar').addClass("compacted");
      }

      if ($('body').hasClass('collapsed')) {
        $('body').removeClass('collapsed');
        $('body').removeClass('expanded');
        $('body').addClass("compacted");
      }

      if ($('body').hasClass('compacted')) {
        $('nb-sidebar').removeClass('collapsed');
        $('nb-sidebar').removeClass('expanded');
      }
      
      if ($('nb-sidebar.compacted').hasClass('expanded')) {
        $('nb-sidebar').removeClass('collapsed');
        $('nb-sidebar').removeClass('expanded');
      }
    }

    this.getSideBarState();
  }

  constructor(private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private primeNgThemeService: ThemeService,
    private breakpointService: NbMediaBreakpointsService,
    private commonService: CommonService,
    private _router: Router,
    private _fileSignedUrlService: FileSignedUrlService,
    private commonHelper: CommonHelper,
    private cdref: ChangeDetectorRef,
    public _commonHelper: CommonHelper,
    private _profileService: ProfileService,
    private _userService: UsersService,
    public _authService: AuthenticationService, 
    @Inject(DOCUMENT) _document?: any) {

       //get loggedIn user details
    this.loggedInUserDetails = this.commonHelper.getLoggedUserDetail();
    
    //set local storage prefix
    this.localStorageKeyPrefix = `${this.loggedInUserDetails?.tenantId}_${this.loggedInUserDetails?.userId}`;
    this.getSideBarState();

    this.selectedLanguage =  this.commonHelper.getLocalStorageDecryptData(LocalStorageKey.LocaleLang);
    this.bodyElement = document.body;
    this._router.routeReuseStrategy.shouldReuseRoute = function() { return false; };

  }

  ngOnInit() {
    // get current environment
    this.environmentInstance = null;
    if (window.location.hostname.startsWith("qa")) {
      this.environmentInstance = "QA";
    }
    else if (window.location.hostname.startsWith("beta")) {
      this.environmentInstance = "BETA";
    }
    else if (window.location.hostname.startsWith("localhost")) {
      this.environmentInstance = "DEV"
    }

    this.windowWidth = window.innerWidth;
    this.loggedInUserTenantName = this.loggedInUserDetails?.tenantName;

    this.client = this.commonHelper.app_client;
    this.version = this.commonHelper.app_version;

    this.loggedInUserName = this.loggedInUserDetails?.name;
    this.currentTheme = this.themeService.currentTheme;
    this.loggedInUserTenantName = this.loggedInUserDetails?.tenantName;

    if (this.loggedInUserDetails?.tenantImagePath) {
      this.setTenantSignedUrl(this.loggedInUserDetails?.tenantImagePath);
    }

    const { xl } = this.breakpointService.getBreakpointsMap();
    this.themeService.onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$),
      )
      .subscribe((isLessThanXl: boolean) => this.userPictureOnly = isLessThanXl);

    this.themeService.onThemeChange()
      .pipe(
        map(({ name }) => name),
        takeUntil(this.destroy$),
      )
      .subscribe(themeName => this.currentTheme = themeName);

    this.enableDarkMode = this.getSelectedTheme();
    this.applyTheme(this.enableDarkMode);

    if (this.loggedInUserDetails?.imagePath) {
      this.setFileSignedUrl(this.loggedInUserDetails?.imagePath);
    }

    this.loggedInUserShortName = this.loggedInUserDetails?.shortName;
    this.loggedInUserAvatarBGColor = this.loggedInUserDetails?.avatarBGColor;

    this.commonHelper.loggedUserDetailAsObs.subscribe(user => {
      if (user) {
        this.loggedInUserName = user.name;
        this.loggedInUserProfile = user.imagePath;
        if (user.imagePath) {
          this.setFileSignedUrl(user.imagePath);
        }
      }
    })

    this.isImpersonateLoginUser = this.loggedInUserDetails?.isImpersonateSession;

    // if(this.isImpersonateLoginUser) {
    //   window.location.href = "auth/autologin?k=" + this.loggedInUserDetails?.accessToken;
    // }
    
  }
  
  getSideBarState() {
    if (window.innerWidth > 1139) {
      this.menuExpanded = JSON.parse(this.commonHelper.getLocalStorageDecryptData(LocalStorageKey.SidebarStateKey, this.localStorageKeyPrefix));
      if (!this.menuExpanded) {
          $('nb-sidebar').removeClass("expanded");
          $('nb-sidebar').addClass("compacted");
          $('body').addClass('compacted');
          $('body').removeClass('expanded').removeClass("sidebar-hover");
      }
      else {
          $('nb-sidebar').addClass('expanded');
          $('nb-sidebar').removeClass('compacted');
          $('body').removeClass('compacted').removeClass("sidebar-hover");
          $('body').addClass('expanded');
      }
    }
  }

  ngAfterViewInit(): void {
    if (window.innerWidth > 1139) {
      switch ($('body').hasClass('compacted')) {
        case (true):
          $('nb-sidebar').removeClass('expanded');
          $('nb-sidebar').addClass('compacted');
          this.menuExpanded = false;
          this.commonHelper.setLocalStorageEncryptData(LocalStorageKey.SidebarStateKey, JSON.stringify(this.menuExpanded), this.localStorageKeyPrefix);
          break;
        case (false):
          $('nb-sidebar').removeClass("compacted").removeClass("collapsed");
          $('nb-sidebar').addClass('expanded');
          $("body").removeClass("sidebar-hover");
          this.menuExpanded = true;
          this.commonHelper.setLocalStorageEncryptData(LocalStorageKey.SidebarStateKey, JSON.stringify(this.menuExpanded), this.localStorageKeyPrefix);
          break;
      }
    }
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

  toggleSidebar() {
    if (window.innerWidth > 1139) {
      switch ($('nb-sidebar').hasClass('expanded')) {
        case (true):
          $('nb-sidebar').removeClass('expanded');
          $('nb-sidebar').addClass('compacted');
          $('body').addClass('compacted');
          $('body').removeClass('expanded');
          this.menuExpanded = false;
          this.commonHelper.setLocalStorageEncryptData(LocalStorageKey.SidebarStateKey, JSON.stringify(this.menuExpanded), this.localStorageKeyPrefix);          
          break;
        case (false):
          $('nb-sidebar').removeClass("compacted").removeClass("collapsed");
          $('nb-sidebar').addClass('expanded');
          $('body').addClass('expanded');
          $('body').removeClass('compacted').removeClass("sidebar-hover");
          this.menuExpanded = true;
          this.commonHelper.setLocalStorageEncryptData(LocalStorageKey.SidebarStateKey, JSON.stringify(this.menuExpanded), this.localStorageKeyPrefix);
          break;
      }
    } else{
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

  ngAfterContentChecked() {
    this.cdref.detectChanges();
  }

  ngAfterViewChecked() {
    this.cdref.detectChanges();
  }

  changeTheme(enableDarkMode: any) {
    this.applyTheme(enableDarkMode.checked);
  }

  private setFileSignedUrl(image: string) {
    if (image) {
      this._fileSignedUrlService.getSingleFileSignedUrl(Entity.Users, image).then(res => {
        if (res) {
          this.loggedInUserProfile = res;
        } 
      });
    }
  }

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }
  changeLanguage(){ 
    this.commonHelper.updateLanguage(this.selectedLanguage);
    this.commonHelper.setLanguage(); 
  }

  private setTenantSignedUrl(image: string) {
    if (image) {
      this._fileSignedUrlService.getSingleFileSignedUrl(0, image).then(res => {
        if (res) {
          this.loggedInUserTenantImagePath = res;
        } 
      });
    }
  }

  applyTheme(enableDarkMode: boolean) {
    if (enableDarkMode) {
      this.themeService.changeTheme('dark');
      this.primeNgThemeService.switchTheme('dark');
      this.primeNgThemeService.highChartTheme.next('dark');
    }
    else {
      this.themeService.changeTheme('default');
      this.primeNgThemeService.switchTheme('default');
      this.primeNgThemeService.highChartTheme.next('default');
    }
    this.setSelectedTheme(enableDarkMode);
  }

  setSelectedTheme(theme) {
    localStorage.setItem(this.localStorageKeyPrefix + "_" + LocalStorageKey.SelectedThemeKey, theme);
  }

  getSelectedTheme() {
    if (localStorage.getItem(this.localStorageKeyPrefix + "_" + LocalStorageKey.SelectedThemeKey)) {
      return localStorage.getItem(this.localStorageKeyPrefix + "_" + LocalStorageKey.SelectedThemeKey) == 'true';
    }
    return false;
  }

  //#region Global Search
  globalSearch(event) {
    let params: any;
    if (event && event instanceof KeyboardEvent) {
      if (event.key == 'Enter' && this.searchText.trim().length > 0) {
        this.searchResult = null;
        this.showSearchbarSpinner = true;
        params = { searchText: this.searchText.trim() };
        this.commonService.getEntitiesBySearchText(params).then((response) => {
          this.searchResult = response as [];
          this.showSearchbarSpinner = false;
          this.isMouseOverSearchResult = false;
        }, (error) => {
          this.searchResult = null;
          this.showSearchbarSpinner = false;
        });
        // this.bodyElement.classList.add('overlay-search-body');
        this.globalSearchTextBox.nativeElement.classList.add('txt-focus-in');
      }
    }

    if (event && event instanceof PointerEvent) {
      if (this.searchText.trim().length > 0) {
        this.searchResult = null;
        this.showSearchbarSpinner = true;
        params = { searchText: this.searchText.trim() };
        this.commonService.getEntitiesBySearchText(params).then((response) => {
          this.searchResult = response as [];
          this.showSearchbarSpinner = false;
          this.isMouseOverSearchResult = false;
        }, (error) => {
          this.searchResult = null;
          this.showSearchbarSpinner = false;
        });
        // this.bodyElement.classList.add('overlay-search-body');
        this.globalSearchTextBox.nativeElement.classList.add('txt-focus-in');
      }
    }
  }

  dismissGlobalSearch() {
    this.showSearchbarSpinner = false;
    this.isMouseOverSearchResult = false;
    this.searchText = '';
    this.searchResult = null;
    this.bodyElement.classList.remove('overlay-search-body');
    this.globalSearchTextBox.nativeElement.classList.remove('txt-focus-in');
  }

  navigateToSearchUrl(url: string) {
    if (url) {
      this._router.navigateByUrl(url);
    }
  }

  onGlobalSearchKeydown(event) {
    if (event.key == 'Escape' || event.key == 'Tab') {
      this.dismissGlobalSearch();
    } else if (this.isMouseOverSearchResult && (event.key == 'Meta' || event.key == 'Alt' || event.key == 'Tab')) {
      this.dismissGlobalSearch();
    }
  }

  onGlobalSearchFocusOut(event) {
    if (this.isMouseOverSearchResult) {
      event.preventDefault();
      this.globalSearchTextBox.nativeElement.classList.add('txt-focus-in');
    } else {
      this.dismissGlobalSearch();
    }
  }

  preventSearchbarCollapse(event){
    event.preventDefault();
  }

  overlayClose() {
    this.dismissGlobalSearch();
  }

  setMouseOverOutFlag(value) {
  this.isMouseOverSearchResult = value; 
  }
  
  getUserProfile() {
    this._commonHelper.showLoader();
    this._profileService.getProfileDetail().then((response: any) => {
      if(response && response !== null && response !== undefined) {
        
      }
      this._commonHelper.hideLoader();
    }, (error: any) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(error.message);
    })
  }

  getLogoutUser() {
    this._commonHelper.showLoader();
    this._authService.logout().then((response: any) => {
      if(response) {

      }
      this._commonHelper.hideLoader();
    }, (error: any) => {
      this._commonHelper.hideLoader();
      this._commonHelper.showToastrError(error.message);
    })
  }
  
  redirectToReturnLogin() {
    this._router.navigate([`auth/returnlogin`]);
  }

  redirectToProfile() {
    this._router.navigate([`/profile`]);
  }

  redirectToLoginFromLogout() {
    this._router.navigate([`/auth/login`]);
  }
  
}
