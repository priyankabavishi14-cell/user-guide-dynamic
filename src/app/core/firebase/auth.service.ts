import { Injectable } from '@angular/core';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase.config';
import { BehaviorSubject, Observable } from 'rxjs';
import { ProjectService } from './project.service';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private projectService = inject(ProjectService);
  private userSub = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSub.asObservable();

  constructor() {
    onAuthStateChanged(auth, (user: User | null) => {
      this.userSub.next(user);
      if (user) {
        this.projectService.initDefaultProject(user.uid);
      }
    });
  }

  get currentUser() {
    return this.userSub.value;
  }

  async login() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  async loginWithEmail(email: string, pass: string) {
    return signInWithEmailAndPassword(auth, email, pass);
  }

  async signupWithEmail(email: string, pass: string, name: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    return cred;
  }

  async logout() {
    return signOut(auth);
  }
}
