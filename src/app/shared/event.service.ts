import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {EMPTY, Observable, zip} from 'rxjs';
import {Event} from './model/event';
import {AngularFireAuth} from '@angular/fire/auth';
import {switchMap, tap} from 'rxjs/operators';
import {User} from 'firebase';
import {Participation} from './model/participation';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(
    private db: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
  }

  getEvents(): Observable<Event[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => this.getParticipations(user)),
      switchMap(participations => this.getEventsById(participations.map(participation => participation.eventId))));
  }

  private getParticipations(user: User): Observable<Participation[]> {
    return !user ? EMPTY :
      this.db.collection<Participation>('participations', ref =>
        ref.where('userId', '==', user.uid)).valueChanges().pipe(tap(console.log));
  }

  private getEventsById(ids: string[]): Observable<Event[]> {
    return zip(
      ...ids.map(id => this.db.doc<Event>(`events/${id}`).valueChanges())
    );
  }
}
