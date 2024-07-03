import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
    name: 'timeAgoPipe',
    pure: false
})
export class TimeAgoPipe implements PipeTransform {
    transform(valueDate: any, utcDateTime: any): any {
        if (valueDate != undefined && valueDate != null && utcDateTime != undefined && utcDateTime != null) {
            var utcTime = moment.utc(utcDateTime);
            var duration = moment.duration(moment().diff(utcTime));            
            var minutes = duration.asMinutes();
            var hours = duration.asHours();
            var year = duration.asYears();
            
            if (minutes < 0) { minutes = 0; }
            if (minutes < 60) {
                valueDate = `${minutes.toFixed(0)} ${(minutes.toFixed(0) == '1') ? 'min ago' : 'mins ago'}`
            }
            else if (minutes > 60 && hours < 24) {
                valueDate = `${hours.toFixed(0)} ${(hours.toFixed(0) == '1') ? 'hr ago' : 'hrs ago'}`
            }
            else if (hours > 24 && hours < 48) {
              valueDate = 'yesterday'
            }
            else if(year < 1){
              
              valueDate = moment(valueDate).format('MMM DD, hh:mm a');
            }
            else{
              
              valueDate = moment(valueDate).format('MMM DD YYYY, hh:mm a');
            }
            
            return valueDate;
        }
        else {
            return valueDate;
        }
    }
}