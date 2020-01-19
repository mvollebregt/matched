import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Observable} from 'rxjs';
import {switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private afAuth: AngularFireAuth
  ) {
  }

  withUserId<T>(func: (userId: string) => Observable<T[]>): Observable<T[]> {
    return this.afAuth.authState.pipe(
      switchMap(user => user ? func(user.uid) : [])
    );
  }
}
