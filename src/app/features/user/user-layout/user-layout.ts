import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PageService } from '../../../core/firebase/page.service';
import { ProjectService } from '../../../core/firebase/project.service';
import { map, switchMap, combineLatest, of, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Page, PageNode, Project } from '../../../core/models/page.model';

@Component({
  selector: 'app-user-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Header -->
      <header class="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 justify-between sticky top-0 z-30">
        <div class="flex items-center gap-4">
          <button (click)="toggleSidebar()" class="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
            <mat-icon>menu</mat-icon>
          </button>
          <a [routerLink]="['/']" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <mat-icon class="text-white scale-75">book</mat-icon>
            </div>
            <span class="font-bold text-xl tracking-tight">GuideManager</span>
          </a>
          @if (project(); as projectData) {
            <div class="h-6 w-px bg-slate-200 mx-2"></div>
            <span class="text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 text-sm animate-in fade-in">
              {{ projectData.title }}
            </span>
          } @else if (projectLoading()) {
            <div class="h-6 w-32 bg-slate-50 rounded-lg animate-pulse ml-4"></div>
          }
        </div>
        
        <div class="flex items-center gap-4">
        </div>
      </header>

      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar -->
        <aside 
          [class.translate-x-0]="isSidebarOpen()"
          [class.-translate-x-full]="!isSidebarOpen()"
          class="fixed inset-y-0 left-0 z-20 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-0 lg:block overflow-y-auto"
        >
          <div class="p-4">
            <nav class="space-y-1">
              @if (projectLoading()) {
                <div class="space-y-4 animate-pulse px-2">
                  <div class="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div class="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div class="h-4 bg-slate-100 rounded w-2/3"></div>
                </div>
              } @else if (tree$ | async; as nodes) {
                <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: nodes, project: project() }"></ng-container>
                @if (nodes.length === 0) {
                  <div class="p-4 text-center">
                    <mat-icon class="text-slate-200 scale-150 mb-2">library_books</mat-icon>
                    <p class="text-xs text-slate-400 font-medium">This project has no documentation yet.</p>
                  </div>
                }
              }
            </nav>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto bg-slate-50 relative">
          <div class="max-w-4xl mx-auto p-6 md:p-12">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      <!-- Mobile Overlay -->
      @if (isSidebarOpen()) {
        <div 
          (click)="toggleSidebar()"
          (keyup.enter)="toggleSidebar()"
          tabindex="0"
          role="button"
          aria-label="Close sidebar"
          class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-10 lg:hidden"
        ></div>
      }
    </div>

    <!-- Recursive Tree Template -->
    <ng-template #nodeTemplate let-nodes let-project="project">
      <ul class="space-y-1">
        @for (node of nodes; track node.id) {
          <li>
            <div class="flex flex-col">
              <a 
                [routerLink]="project ? ['/guide', project.slug, 'page', node.id] : ['/page', node.id]" 
                routerLinkActive="bg-indigo-50 text-indigo-700 font-medium border-indigo-200"
                [routerLinkActiveOptions]="{exact: true}"
                (click)="closeSidebarOnMobile()"
                class="group flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all border border-transparent"
              >
                <mat-icon class="text-lg opacity-60 group-hover:opacity-100">article</mat-icon>
                {{ node.title }}
              </a>
              
              @if (node.children && node.children.length > 0) {
                <div class="ml-4 mt-1 border-l border-slate-100">
                  <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: node.children, project: project }"></ng-container>
                </div>
              }
            </div>
          </li>
        }
      </ul>
    </ng-template>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserLayout {
  private pageService = inject(PageService);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  
  isSidebarOpen = signal(false);
  projectLoading = signal(true);

  project = toSignal(this.route.params.pipe(
    switchMap(params => {
      const slug = params['projectSlug'];
      if (slug) {
        this.projectLoading.set(true);
        return this.projectService.getProjectBySlug(slug).pipe(
          tap(() => this.projectLoading.set(false))
        );
      }
      this.projectLoading.set(false);
      return of(null);
    })
  ));

  tree$ = this.route.params.pipe(
    switchMap(() => {
      const p = this.project();
      if (!p) return of([]);
      return this.pageService.getPages(p.id).pipe(
        map(pages => this.buildTree(pages))
      );
    })
  );

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebarOnMobile() {
    if (window.innerWidth < 1024) {
      this.isSidebarOpen.set(false);
    }
  }

  private buildTree(pages: Page[]): PageNode[] {
    const map = new Map<string, PageNode>();
    const roots: PageNode[] = [];

    pages.forEach(p => map.set(p.id!, { ...p, children: [] }));
    
    pages.forEach(p => {
      if (p.parentId && map.has(p.parentId)) {
        map.get(p.parentId)!.children!.push(map.get(p.id!)!);
      } else {
        roots.push(map.get(p.id!)!);
      }
    });

    return roots;
  }
}
