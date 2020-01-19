import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable, zip} from 'rxjs';
import {Event} from './model/event';
import {AngularFireAuth} from '@angular/fire/auth';
import {map, switchMap} from 'rxjs/operators';
import {Participation} from './model/participation';
import {Following} from './model/following';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(
    private db: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
  }

  getUserEvents(): Observable<Event[]> {
    return this.withUserId(userId => this.getEventsByUser(userId));
  }

  getFollowingEvents(): Observable<Event[]> {
    return this.withUserId(userId =>
      this.getFollowingByUser(userId).pipe(
        map(followings => [userId, ...followings.map(following => following.targetId)]),
        switchMap(userIds => this.getEventsByUser(...userIds))));
  }

  private getEventsByUser(...userIds: string[]): Observable<Event[]> {
    return this.getParticipationsByUser(...userIds).pipe(
      map(participations => [...new Set(participations.map(participation => participation.eventId))]),
      switchMap(eventIds => this.getEventsById(...eventIds)));
  }

  private getParticipationsByUser(...userIds: string[]): Observable<Participation[]> {
    return this.db.collection<Participation>('participations', ref =>
      ref.where('userId', 'in', userIds)).valueChanges();
  }

  private getEventsById(...ids: string[]): Observable<Event[]> {
    return zip(
      ...ids.map(id => this.db.doc<Event>(`events/${id}`).valueChanges())
    );
  }

  private getFollowingByUser(userId: string): Observable<Following[]> {
    return this.db.collection<Following>(`users/${userId}/following`).valueChanges();
  }

  private withUserId<T>(func: (userId: string) => Observable<T[]>): Observable<T[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => user ? func(user.uid) : [])
    );
  }
}
