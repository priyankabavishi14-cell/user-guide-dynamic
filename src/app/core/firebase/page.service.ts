import { Injectable } from '@angular/core';
import { db } from './firebase.config';
import { Page } from '../models/page.model';
import { 
  collection as fsCollection, 
  query as fsQuery, 
  orderBy as fsOrderBy, 
  where as fsWhere,
  onSnapshot, 
  doc as fsDoc, 
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
  deleteDoc as fsDeleteDoc,
  serverTimestamp as fsServerTimestamp
} from 'firebase/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PageService {
  private pagesCollection = fsCollection(db, 'pages');

  getPages(projectId?: string): Observable<Page[]> {
    const constraints: any[] = [];
    if (projectId) {
      constraints.push(fsWhere('projectId', '==', projectId));
    }
    constraints.push(fsOrderBy('sequence', 'asc'));
    
    const q = fsQuery(this.pagesCollection, ...constraints);
    
    return new Observable<Page[]>(subscriber => {
      return onSnapshot(q, (snapshot) => {
        const pages = snapshot.docs.map(pageDoc => {
          const data = pageDoc.data() as any;
          return {
            id: pageDoc.id,
            ...data,
            // Fallback for existing data without projectId
            projectId: data.projectId || 'sellsync-website'
          } as Page;
        });
        subscriber.next(pages);
      }, (error: Error) => subscriber.error(error));
    });
  }

  getPage(id: string): Observable<Page | undefined> {
    const docRef = fsDoc(db, 'pages', id);
    return new Observable<Page | undefined>(subscriber => {
      return onSnapshot(docRef, (pageDoc) => {
        if (pageDoc.exists()) {
          const data = pageDoc.data() as any;
          subscriber.next({ 
            id: pageDoc.id, 
            ...data,
            projectId: data.projectId || 'sellsync-website'
          } as Page);
        } else {
          subscriber.next(undefined);
        }
      }, (error: Error) => subscriber.error(error));
    });
  }

  async createPage(page: Omit<Page, 'id' | 'updatedAt'>): Promise<void> {
    const pageId = page.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const docRef = fsDoc(db, 'pages', pageId);
    await fsSetDoc(docRef, {
      ...page,
      updatedAt: fsServerTimestamp()
    });
  }

  async updatePage(id: string, page: Partial<Page>): Promise<void> {
    const docRef = fsDoc(db, 'pages', id);
    await fsUpdateDoc(docRef, {
      ...page,
      updatedAt: fsServerTimestamp()
    });
  }

  async deletePage(id: string): Promise<void> {
    const docRef = fsDoc(db, 'pages', id);
    await fsDeleteDoc(docRef);
  }
}
