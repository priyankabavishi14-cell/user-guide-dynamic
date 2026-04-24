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
  private userSub = new BehaviorSubject<User | null | undefined>(undefined);
  user$: Observable<User | null | undefined> = this.userSub.asObservable();

  constructor() {
    onAuthStateChanged(auth, (user: User | null) => {
      this.userSub.next(user);
      // Still init project with a stable ID even if not logged in to Firebase
      this.projectService.initDefaultProject(user?.uid || 'guest-admin');
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
