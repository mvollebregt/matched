import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable, of, zip} from 'rxjs';
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
      this.getFollowsUserIdsForUserId(userId).pipe(
        switchMap(followsUserIds => this.filterUserIdsByGrantedUserIds(userId, followsUserIds)),
        switchMap(userIds => this.getParticipationsForUserIds(userIds)),
        switchMap(participations => this.getEventsForParticipations(participations))));
  }

  private withUserId<T>(func: (userId: string) => Observable<T[]>): Observable<T[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => user ? func(user.uid) : [])
    );
  }

  private getFollowsUserIdsForUserId(userId: string): Observable<string[]> {
    return this.getUser(userId).pipe(
      map(user => [userId, ...(user && user.followsUserIds || [])])
    );
  }

  private filterUserIdsByGrantedUserIds(userId: string, followsUserIds: string[]): Observable<string[]> {
    return zip(...followsUserIds.map(followsUserId => this.hasGranted(followsUserId, userId).pipe(
      map(granted => granted ? [followsUserId] : [])
    ))).pipe(
      map(userIds => [].concat(...userIds))
    );
  }

  private hasGranted(userId: string, grantedUserId: string): Observable<boolean> {
    return of(userId === grantedUserId).pipe(
      switchMap(granted => granted ? of(granted) : this.grantExists(userId, 'public')),
      switchMap(granted => granted ? of(granted) : this.grantExists(userId, grantedUserId)),
    );
  }

  private grantExists(userId: string, grantedUserId: string): Observable<boolean> {
    return this.db.doc<any>(`users/${userId}/grants/${grantedUserId}`).valueChanges().pipe(
      map(grant => !!grant)
    );
  }

  private getParticipationsForUserIds(userIds: string[]): Observable<Participation[]> {
    const user = userIds[0];
    this.db.collection<Participation>(`users/${user}/participations`).valueChanges().subscribe(console.log);
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

  private getUser(userId: string): Observable<User> {
    return this.db.doc<User>(`users/${userId}`).valueChanges();
  }

  private partitionedByEvent(participations: Participation[]): [string, string[]][] {
    const result = new Map<string, string[]>();
    for (const participation of participations) {
      result.set(participation.eventId, [...(result.get(participation.eventId) || []), null/*participation.userId*/]);
    }
    return [...result.entries()];
  }
}
