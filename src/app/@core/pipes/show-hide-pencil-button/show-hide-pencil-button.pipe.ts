import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'showHidePencilButton'
})
export class ShowHidePencilButtonPipe implements PipeTransform {

  transform(currentTab:string[] = [], activeTab: string = ''): any {
    if(currentTab.find(el => el == activeTab)) {
      return true;
    }
  }
}
