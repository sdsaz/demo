import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'avatarPersonName'
})
export class AvatarPersonNamePipe implements PipeTransform {

  transform(firstNameValue: any,lastNameValue: any): any {
    let firstNameChar = '';
    let lastNameChar = '';    
    if (firstNameValue != null && firstNameValue != '') {
      firstNameChar = firstNameValue.charAt(0).toUpperCase();
    }
    if (lastNameValue != null && lastNameValue != '') {
      lastNameChar = lastNameValue.charAt(0).toUpperCase();
    }
    return `${firstNameChar} ${lastNameChar}`;
  }
}
