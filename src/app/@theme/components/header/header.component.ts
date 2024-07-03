import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';

import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as $ from "jquery";

import { ThemeService } from '../../../@core/sharedServices/theme.service';
import { CommonHelper } from '../../../@core/common-helper';
import { Entity, LocalStorageKey } from '../../../@core/enum';
import { CommonService } from '../../../@core/sharedServices/common.service';
import { Router } from '@angular/router';
import { FileSignedUrlService } from '../../../@core/sharedServices/file-signed-url.service';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

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
  onWindowResize() {
    this.windowWidth = window.innerWidth;
  }

  //global search
  searchResult: any;
  searchText: string = '';
  showSearchbarSpinner: boolean = false;
  bodyElement: any;
  isMouseOverSearchResult:boolean = false;
  @ViewChild('txtGlobalSearch') globalSearchTextBox:ElementRef;

  constructor(private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private primeNgThemeService: ThemeService,
    private breakpointService: NbMediaBreakpointsService,
    public commonHelper: CommonHelper,
    private cdref: ChangeDetectorRef,
    private commonService: CommonService,
    private _router: Router,
    private _fileSignedUrlService: FileSignedUrlService
  ) {
    this.selectedLanguage =  this.commonHelper.getLocalStorageDecryptData(LocalStorageKey.LocaleLang);
    this.bodyElement = document.body;
    this._router.routeReuseStrategy.shouldReuseRoute = function() { return false; };
  }

  ngOnInit() {
    //get loggedIn user details
    this.loggedInUserDetails = this.commonHelper.getLoggedUserDetail();
    //set local Storage prefix
    this.localStorageKeyPrefix = `${this.loggedInUserDetails.tenantId}_${this.loggedInUserDetails.userId}`
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
    this.loggedInUserName = this.commonHelper.getLoggedUserDetail().name;
    this.currentTheme = this.themeService.currentTheme;
    this.loggedInUserTenantName = this.commonHelper.getLoggedUserDetail().tenantName;

    if(this.commonHelper.getLoggedUserDetail().tenantImagePath) {
      this.setTenantSignedUrl(this.commonHelper.getLoggedUserDetail().tenantImagePath);
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
    
    if (this.commonHelper.getLoggedUserDetail().imagePath) {
      this.setFileSignedUrl(this.commonHelper.getLoggedUserDetail().imagePath);
    }
    
    this.loggedInUserShortName = this.loggedInUserDetails.shortName;
    this.loggedInUserAvatarBGColor = this.loggedInUserDetails.avatarBGColor;

    this.commonHelper.loggedUserDetailAsObs.subscribe(user => {
      if(user) {
        this.loggedInUserName = user.name;
        this.loggedInUserProfile = user.imagePath;
        if (user.imagePath) {
          this.setFileSignedUrl(user.imagePath);
        }
      }
    })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  changeTheme(enableDarkMode: any) {
    this.applyTheme(enableDarkMode.checked);
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

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }
  changeLanguage(){ 
    this.commonHelper.updateLanguage(this.selectedLanguage);
    this.commonHelper.setLanguage(); 
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

  private setTenantSignedUrl(image: string) {
    if (image) {
      this._fileSignedUrlService.getSingleFileSignedUrl(0, image).then(res => {
        if (res) {
          this.loggedInUserTenantImagePath = res;
        } 
      });
    }
  }

  //#region Global Search
  globalSearch(event) {
      let params:any;
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
            this.bodyElement.classList.add('overlay-search-body');
            this.globalSearchTextBox.nativeElement.classList.add('txt-focus-in');
          } 
      }

      if (event && event instanceof PointerEvent) {
        if(this.searchText.trim().length > 0) {
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
          this.bodyElement.classList.add('overlay-search-body');
          this.globalSearchTextBox.nativeElement.classList.add('txt-focus-in');
        }
      }
  }
  
  dismissGlobalSearch(){
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
  //#endregion
}
