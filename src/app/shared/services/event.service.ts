import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {combineLatest, Observable} from 'rxjs';
import {Event} from '../model/event';
import {map, switchMap} from 'rxjs/operators';
import {Participation} from '../model/participation';
import {UserService} from './user.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  constructor(
    private db: AngularFirestore,
    private userService: UserService
  ) {
  }

  getFollowingEvents(): Observable<Event[]> {
    return this.userService.getFollowedUsers().pipe(
      switchMap(userIds => this.getEventIdsWithParticipatingUserIds(userIds)),
      switchMap(eventIdsWithParticipatingUserIds => this.getEventsWithParticipatingUserIds(eventIdsWithParticipatingUserIds)));
  }

  private getEventIdsWithParticipatingUserIds(userIds: string[]): Observable<[string, string[]][]> {
    return combineLatest(userIds.map(userId => this.getParticipations(userId))).pipe(
      map(userIdsWithParticipations => this.getEventIdsWithUserIds(userIdsWithParticipations))
    );
  }

  private getParticipations(userId: string): Observable<{ userId: string, participations: Participation[] }> {
    return this.db.collection<{ eventId: string }>(`users/${userId}/participations`).valueChanges().pipe(
      map(participations => ({userId, participations}))
    );
  }

  private getEventIdsWithUserIds(userIdsWithParticipations: { userId: string, participations: Participation[] }[]): [string, string[]][] {
    const result = new Map<string, string[]>();
    for (const {userId, participations} of userIdsWithParticipations) {
      for (const participation of participations) {
        result.set(participation.eventId, [...(result.get(participation.eventId) || []), userId]);
      }
    }
    return [...result];
  }

  private getEventsWithParticipatingUserIds(eventIdsWithParticipatingUserIds: [string, string[]][]): Observable<Event[]> {
    return combineLatest(
      eventIdsWithParticipatingUserIds.map(eventIdWithParticipatingUserIds => this.getEvent(eventIdWithParticipatingUserIds))
    );
  }

  private getEvent([eventId, participatingUserIds]: [string, string[]]): Observable<Event> {
    return this.db.doc<Event>(`events/${eventId}`).valueChanges().pipe(map(event => ({...event, participatingUserIds})));
  }
}
