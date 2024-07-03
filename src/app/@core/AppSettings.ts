// For Application level Global Settings
export class AppSettings {
   MaxLength = {
      ZipCode: 8,
      Email: 65,
      Name: 50,
      PhoneNumber: 16,
      Address: 1000,
   };
    DefaultCountry: string = 'United States';

   CheckNullOrUndefined(data):boolean
   {
      if(data != undefined && data != null && data != ''){
         return true;
      }
      return false;
   }
}
