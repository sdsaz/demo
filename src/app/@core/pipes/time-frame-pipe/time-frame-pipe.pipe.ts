import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFramePipe'
})
export class TimeFramePipe implements PipeTransform {

  transform(minutes: number, hrsInDay: number = 24): string {
    // SDC-1961 issue solved
    //Both Min and Hours couldn't be 0 at same time
    if (minutes >= 0 && (minutes != 0 && hrsInDay != 0 )) {
      hrsInDay = hrsInDay && hrsInDay == 0 ? 24 : hrsInDay;

      const weeks = Math.floor(minutes / (hrsInDay * 60 * 7));
      const aboveWeeks = Math.floor(minutes % (hrsInDay * 60 * 7));
      const days = Math.floor(aboveWeeks / (hrsInDay * 60));
      const aboveDays = Math.floor(aboveWeeks % (hrsInDay * 60));
      const hours = Math.floor(aboveDays / 60);
      const aboveHours = aboveDays % 60;
      const minute = aboveHours;

      var result = "";

      if (weeks != 0) {
        result += weeks.toString();
        result += "w ";
      }

      if (days != 0) {
        result += days.toString();
        result += "d ";
      }

      if (hours != 0) {
        result += hours.toString();
        result += "h ";
      }

      if (minute != 0) {
        result += minute.toString();
        result += "m";
      }
      return result == '' ? "0m" : result.trim();
    }
    else
    {
      return "0m"
    }
  }
}