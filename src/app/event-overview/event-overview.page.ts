import {Component} from '@angular/core';
import {Observable} from 'rxjs';
import {Event} from '../shared/model/event';
import {EventService} from '../shared/event.service';

@Component({
  selector: 'mt-event-overview',
  templateUrl: 'event-overview.page.html'
})
export class EventOverviewPage {

  events: Observable<Event[]>;

  constructor(eventService: EventService) {
    this.events = eventService.getEvents();
  }

}
