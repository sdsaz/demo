import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
  ActivatedRoute
} from '@angular/router';
import { NbMenuItem } from '@nebular/theme';
import { CommonHelper } from '../common-helper';
import { UsersService } from '../../pages/usermanagement/users/users.service';

export interface menuItem {
  menuItems: any[];
}

@Injectable({
  providedIn: 'root'
})
export class UserMenuItemsResolver implements Resolve<menuItem[]> {

  menuItems: Array<NbMenuItem> = [];

  constructor(private _commonHelper: CommonHelper,
    private _usersService: UsersService,
    private _router: Router) { }

  resolve(route: ActivatedRouteSnapshot): Promise<menuItem[]> {
    return new Promise((resolve: any, reject: any) => {

      this.menuItems = this._commonHelper.getUserMenuItemsCache();
      if (!this.menuItems || this.menuItems.length == 0) {
        this._commonHelper.showLoader();
        this._usersService.getUserMenuItems().then((response: Array<NbMenuItem>) => {
          if (response) {
            this.menuItems = this._commonHelper.prepareMenus(response);
            this._commonHelper.hideLoader();
            resolve(this.menuItems);
          }
        }, (error: any) => {
          this._commonHelper.hideLoader();
          this._router.navigate(['/auth/login'])
        })
      } else {
        resolve(this.menuItems);
      }

    });
  }
}
