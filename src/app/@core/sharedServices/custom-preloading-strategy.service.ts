import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, mergeMap, of, timer } from 'rxjs';

@Injectable()
export class CustomPreloadingStrategyService implements PreloadingStrategy {

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (route.data && route.data['preload']) {
      if (route.data['delay'] && Number(route.data['delay']) > 0) {
        return timer(Number(route.data['delay'])).pipe(mergeMap(() => load()));
      }
      return load();
    } else {
      return of(null);
    }
  }
}
