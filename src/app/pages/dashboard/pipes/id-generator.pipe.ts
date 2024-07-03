import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'idGenerator'
})
export class IdGeneratorPipe implements PipeTransform {

  transform(value: string): string {
    if (value) {
      return String(value).replace(/[ &\/\\#,+()$~%.'":*?<>{}/[\]']/g, "").toLowerCase()
    }
    return ''
  }
}
