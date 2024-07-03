//MODULES
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class DocumentViewerService  {

  constructor(private _httpClient: HttpClient, private _route: Router) {
  }

  getCSVData (url: string) {
    return new Promise((resolve, reject) => {   
      this._httpClient.request('GET', url, { responseType: 'text' })
        .pipe(map(res => res))
        .subscribe((response: any) => {
          resolve(response);
        }, (error) => {
          reject(error);
          if (error.status == 401) {
            this._route.navigate(["/auth/login"]);
          }
        });
    });
  }
}
