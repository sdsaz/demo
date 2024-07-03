import { Pipe, PipeTransform } from '@angular/core';
import { KanbanStage } from '../../sharedModels/kanban-board.model';

@Pipe({
  name: 'stageCss'
})
export class StageCssPipe implements PipeTransform {

  transform(stage: KanbanStage, activeStage: KanbanStage): string {
    let css = '';
    if (!stage) {
      return css;
    }

    if (stage.isCompleted) {
      if (activeStage.id === stage.id) {
        css = 'menu-btn-orange';
      } else if (stage.displayOrder < activeStage.displayOrder) {
        css = 'menu-btn-done';
      }
    } else if (stage.isClosed) {
      if (stage.id === activeStage.id) {
        css = 'menu-btn-error';
      }
    } else {
      if (stage.displayOrder <= activeStage.displayOrder) {
        css = 'menu-btn-done';
      }
    }
    return css;
  }
}
