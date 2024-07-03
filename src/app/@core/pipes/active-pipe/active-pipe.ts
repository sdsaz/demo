import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'active'})
export class ActivePipe implements PipeTransform
{
    /**
     * Transform
     *
     * @param value
     * @param {string[]} args
     * @returns {any}
     */
    transform(value: boolean): any
    {   
        if(value){
            return "Active";
        }else{
            return "Inactive";
        }
    }
}
