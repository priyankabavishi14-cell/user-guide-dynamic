import { Injectable } from '@angular/core';
import { db } from './firebase.config';
import { Project } from '../models/page.model';
import { 
  collection as fsCollection, 
  query as fsQuery, 
  orderBy as fsOrderBy, 
  onSnapshot, 
  doc as fsDoc, 
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
  deleteDoc as fsDeleteDoc,
  serverTimestamp as fsServerTimestamp,
  getDoc
} from 'firebase/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projectsCollection = fsCollection(db, 'projects');
  private currentProjectSub = new BehaviorSubject<Project | null>(null);
  currentProject$ = this.currentProjectSub.asObservable();
  currentProject = toSignal(this.currentProject$, { initialValue: null as Project | null });

  getProjects(): Observable<Project[]> {
    const q = fsQuery(this.projectsCollection, fsOrderBy('updatedAt', 'desc'));
    return new Observable<Project[]>(subscriber => {
      return onSnapshot(q, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project));
        subscriber.next(projects);
      }, (error: Error) => subscriber.error(error));
    });
  }

  async getProjectBySlug(slug: string): Promise<Project | null> {
    // Note: In a real app we'd use a query, but since slug is often the ID here...
    const docRef = fsDoc(db, 'projects', slug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Project;
    }
    return null;
  }

  async createProject(project: Omit<Project, 'id' | 'updatedAt'>): Promise<void> {
    const docRef = fsDoc(db, 'projects', project.slug);
    await fsSetDoc(docRef, {
      ...project,
      updatedAt: fsServerTimestamp()
    });
  }

  async updateProject(id: string, project: Partial<Project>): Promise<void> {
    const docRef = fsDoc(db, 'projects', id);
    await fsUpdateDoc(docRef, {
      ...project,
      updatedAt: fsServerTimestamp()
    });
  }

  async deleteProject(id: string): Promise<void> {
    const docRef = fsDoc(db, 'projects', id);
    await fsDeleteDoc(docRef);
  }

  setCurrentProject(project: Project | null) {
    this.currentProjectSub.next(project);
    if (project?.id) {
      localStorage.setItem('selectedProjectId', project.id);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  }

  async initDefaultProject(userId: string) {
    const defaultSlug = 'sellsync-website';
    const docRef = fsDoc(db, 'projects', defaultSlug);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) {
      await this.createProject({
        title: 'Sellsync Website',
        description: 'Documentation for Sellsync website frontend & backend',
        slug: defaultSlug,
        createdBy: userId
      });
    }
    
    const savedId = localStorage.getItem('selectedProjectId') || defaultSlug;
    const project = await this.getProjectBySlug(savedId);
    this.setCurrentProject(project);
  }
}
