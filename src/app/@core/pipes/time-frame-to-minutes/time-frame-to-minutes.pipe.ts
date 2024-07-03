import { Pipe, PipeTransform } from '@angular/core';
import { isNumber } from 'highcharts';

@Pipe({
  name: 'timeFrameToMinutes'
})
export class TimeFrameToMinutesPipe implements PipeTransform {

  transform(durationString: string, hrsInDay: number = 24): number {
    if (durationString && durationString.length > 0) {
      hrsInDay = hrsInDay && hrsInDay == 0 ? 24 : hrsInDay;

      let durationsplit = durationString.trim().split(' ');
      var weeks: number = 0;
      var days: number = 0;
      var hours: number = 0;
      var minute: number = 0;

      durationsplit.find(element => {
        if (element.includes('w') || element.includes('W')) {
          if (element.match(/\d+/)?.length > 0) {
            weeks = parseInt(element.match(/\d+/)[0]);
          }
          else {
            weeks = 0
          }
        }
        if (element.includes('d') || element.includes('D')) {
          if (element.match(/\d+/)?.length > 0) {
            days = parseInt(element.match(/\d+/)[0]);
          }
          else {
            days = 0
          }
        }
        if (element.includes('h') || element.includes('H')) {
          if (element.match(/\d+/)?.length > 0) {
            hours = parseInt(element.match(/\d+/)[0]);
          }
          else {
            hours = 0
          }
        }
        if (element.includes('m') || element.includes('M')) {
          if (element.match(/\d+/)?.length > 0) {
            minute = parseInt(element.match(/\d+/)[0]);
          }
          else {
            minute = 0
          }
        }
      });

      minute += (weeks * (hrsInDay * 60 * 7)) + (days * (hrsInDay * 60)) + (hours * 60);

      return minute;
    }
    else {
      return 0;
    }
  }
}
