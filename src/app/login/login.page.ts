import {Component} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {auth} from 'firebase';

@Component({
  selector: 'mt-login',
  templateUrl: './login.page.html'
})
export class LoginPage {

  constructor(public afAuth: AngularFireAuth) {
  }

  promptLogin() {
    this.afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
  }
}
