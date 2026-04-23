import { Injectable } from '@angular/core';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
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

  async logout() {
    return signOut(auth);
  }
}
