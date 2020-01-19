import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable, of, zip} from 'rxjs';
import {User} from '../model/user';
import {map, switchMap} from 'rxjs/operators';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private authService: AuthService,
    private db: AngularFirestore,
  ) {
  }

  getFollowedUsers(): Observable<string[]> {
    return this.authService.withUserId(userId => this.getFollowsUserIdsForUserId(userId).pipe(
      switchMap(followsUserIds => this.filterUserIdsByGrantedUserIds(userId, followsUserIds))));
  }

  private getFollowsUserIdsForUserId(userId: string): Observable<string[]> {
    return this.getUser(userId).pipe(
      map(user => [userId, ...(user && user.followsUserIds || [])])
    );
  }

  private getUser(userId: string): Observable<User> {
    return this.db.doc<User>(`users/${userId}`).valueChanges();
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
}
