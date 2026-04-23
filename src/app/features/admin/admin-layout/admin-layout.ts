import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/firebase/auth.service';

import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/firebase/project.service';
import { Project } from '../../../core/models/page.model';

@Component({
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50 font-sans">
      <!-- Navbar -->
      <nav class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
        <div class="flex items-center gap-8">
          <a routerLink="/" class="flex items-center gap-2 group transition-all">
            <div class="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 group-hover:bg-indigo-600 transition-colors">
              <mat-icon class="text-white scale-90">admin_panel_settings</mat-icon>
            </div>
            <span class="font-bold text-slate-800 tracking-tight text-lg">Admin<span class="text-indigo-600">Console</span></span>
          </a>
          
          <div class="h-6 w-px bg-slate-200 mx-2"></div>
          
          <div class="hidden md:flex items-center gap-1 nav-grid">
            @if (projectService.currentProject$ | async; as currentProject) {
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold text-slate-900 border-l border-slate-200 pl-4 ml-4 flex items-center gap-2">
                  <mat-icon class="text-indigo-600 text-lg">folder</mat-icon>
                  {{ currentProject.title }}
                </span>
                <a [routerLink]="['/guide', currentProject.slug]" target="_blank" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all">
                  <mat-icon class="text-base">open_in_new</mat-icon>
                  View Live Site
                </a>
              </div>
            }
          </div>
        </div>

        <div class="flex items-center gap-4">
          @if (auth.user$ | async; as user) {
            <div class="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div class="hidden sm:flex flex-col items-end text-right">
                <span class="text-sm font-semibold text-slate-900 leading-tight">{{ user.displayName }}</span>
                <span class="text-xs text-slate-500">{{ user.email }}</span>
              </div>
              <img [src]="user.photoURL" [alt]="user.displayName" class="w-8 h-8 rounded-full border border-slate-200 shadow-sm" referrerpolicy="no-referrer" />
              <button (click)="logout()" class="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                <mat-icon>logout</mat-icon>
              </button>
            </div>
          } @else {
            <button (click)="login()" class="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2">
              <mat-icon class="text-lg">login</mat-icon>
              Admin Login
            </button>
          }
        </div>
      </nav>

      <div class="flex-1 flex flex-col md:flex-row">
        <!-- Sidebar Navigation (Desktop) -->
        <aside class="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white p-4 space-y-1 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          <!-- Project Switcher -->
          <div class="mb-6">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Switch Project</div>
            <div class="relative group">
              <select 
                [value]="(projectService.currentProject$ | async)?.id" 
                (change)="onProjectChangeSelect($event)"
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm appearance-none cursor-pointer font-semibold text-slate-900"
              >
                @for (project of projects$ | async; track project.id) {
                  <option [value]="project.id">{{ project.title }}</option>
                }
              </select>
              <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 text-lg">folder</mat-icon>
              <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">expand_more</mat-icon>
            </div>
            <button [routerLink]="['/admin/projects']" class="mt-2 w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-indigo-100 border-dashed justify-center">
              <mat-icon class="text-sm">add_box</mat-icon>
              MANAGE ALL PROJECTS
            </button>
          </div>

          <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Management</div>
          <a routerLink="/admin" routerLinkActive="bg-indigo-50 text-indigo-700 border-indigo-100" [routerLinkActiveOptions]="{exact: true}" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-transparent">
            <mat-icon>dashboard</mat-icon>
            Dashboard
          </a>
          <a routerLink="/admin/pages" routerLinkActive="bg-indigo-50 text-indigo-700 border-indigo-100" class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-transparent">
            <mat-icon>list_alt</mat-icon>
            Manage Pages
          </a>
          
          <div class="pt-6 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Content</div>
          <button (click)="createNewPage()" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200 focus:ring-4 focus:ring-indigo-100 mb-4">
            <mat-icon>add_circle</mat-icon>
            Create New Page
          </button>
        </aside>

        <!-- Main Workspace -->
        <div class="flex-1 min-w-0 flex flex-col">
          @if ((auth.user$ | async) === null) {
            <div class="flex-1 flex items-center justify-center bg-slate-50 p-6">
              <div class="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 p-8 border border-slate-100 text-center animate-in zoom-in-95 duration-300">
                <div class="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <mat-icon class="text-indigo-600 scale-150">lock</mat-icon>
                </div>
                <h1 class="text-2xl font-bold text-slate-900 mb-3">Admin Access Only</h1>
                <p class="text-slate-500 mb-8 leading-relaxed">Please sign in with your administrator account to manage guide content and application settings.</p>
                <button (click)="login()" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 group">
                  <mat-icon class="text-xl">login</mat-icon>
                  Sign in with Google
                </button>
              </div>
            </div>
          } @else {
            <div class="flex-1 overflow-y-auto">
              <router-outlet></router-outlet>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .nav-grid { display: flex; align-items: center; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminLayout {
  auth = inject(AuthService);
  projectService = inject(ProjectService);
  private router = inject(Router);

  projects$ = this.projectService.getProjects();

  onProjectChangeSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const projectId = select.value;
    this.projects$.subscribe(projects => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        this.projectService.setCurrentProject(project);
      }
    });
  }

  login() {
    this.auth.login();
  }

  logout() {
    this.auth.logout().then(() => this.router.navigate(['/']));
  }

  createNewPage() {
    this.router.navigate(['/admin/editor/new']);
  }
}
