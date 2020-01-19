import {Component, Input} from '@angular/core';
import {Event} from '../../shared/model/event';

@Component({
  selector: 'mt-event-list',
  templateUrl: './event-list.component.html'
})
export class EventListComponent  {

  @Input() events: Event[];

}
