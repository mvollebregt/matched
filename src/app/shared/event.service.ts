import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {Event} from './model/event';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(private db: AngularFirestore) {
  }

  getEvents(): Observable<Event[]> {
    return this.db.collection<Event>('events').valueChanges();
  }
}


