import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable, zip} from 'rxjs';
import {Event} from './model/event';
import {AngularFireAuth} from '@angular/fire/auth';
import {map, switchMap} from 'rxjs/operators';
import {Participation} from './model/participation';
import {User} from './model/user';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(
    private db: AngularFirestore,
    private afAuth: AngularFireAuth
  ) {
  }

  getFollowingEvents(): Observable<Event[]> {
    return this.withUserId(userId =>
      this.getFollowedUserIdsForUserId(userId).pipe(
        switchMap(userIds => this.getParticipationsForUserIds(userIds)),
        switchMap(participations => this.getEventsForParticipations(participations))));
  }

  private withUserId<T>(func: (userId: string) => Observable<T[]>): Observable<T[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => user ? func(user.uid) : [])
    );
  }

  private getFollowedUserIdsForUserId(userId: string): Observable<string[]> {
    return this.db.doc<User>(`users/${userId}`).valueChanges().pipe(
      map(user => [userId, ...(user && user.followingUserIds || [])])
    );
  }

  private getParticipationsForUserIds(userIds: string[]): Observable<Participation[]> {
    return zip(
      ...userIds.map(userId => this.db.collection<Participation>(`users/${userId}/participations`).valueChanges())
    ).pipe(
      map(participations => [].concat(...participations))
    );
  }
  private getEventsForParticipations(participations: Participation[]): Observable<Event[]> {
    return zip(...this.partitionedByEvent(participations).map(eventIdWithParticipations => this.getEvent(eventIdWithParticipations)));
  }

  private getEvent([eventId, participatingUserIds]: [string, string[]]): Observable<Event> {
    return this.db.doc<Event>(`events/${eventId}`).valueChanges().pipe(map(event => ({...event, participatingUserIds})));
  }

  private partitionedByEvent(participations: Participation[]): [string, string[]][] {
    const result = new Map<string, string[]>();
    for (const participation of participations) {
      result.set(participation.eventId, [...(result.get(participation.eventId) || []), participation.userId]);
    }
    return [...result.entries()];
  }
}
