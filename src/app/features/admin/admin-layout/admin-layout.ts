import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/firebase/auth.service';

import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/firebase/project.service';

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
              @if (auth.user$ | async) {
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
            }
          </div>
        </div>

        <div class="flex items-center gap-4">
          @if (auth.user$ | async; as user) {
            <div class="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div class="hidden sm:flex flex-col items-end text-right">
                <span class="text-sm font-semibold text-slate-900 leading-tight">{{ user.displayName || user.email?.split('@')?.at(0) }}</span>
                <span class="text-xs text-slate-500">{{ user.email }}</span>
              </div>
              @if (user.photoURL) {
                <img [src]="user.photoURL" [alt]="user.displayName || 'User'" class="w-8 h-8 rounded-full border border-slate-200 shadow-sm" referrerpolicy="no-referrer" />
              } @else {
                <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center border border-indigo-200 shadow-sm">
                   <mat-icon class="text-sm">person</mat-icon>
                </div>
              }
              <button (click)="logout()" class="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                <mat-icon>logout</mat-icon>
              </button>
            </div>
          }
        </div>
      </nav>

      <div class="flex-1 flex flex-col md:flex-row shadow-inner">
        <!-- Sidebar Navigation (Desktop) - ONLY SHOW IF AUTHENTICATED -->
        @if (auth.user$ | async) {
          <aside class="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white p-4 space-y-1 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto animate-in slide-in-from-left duration-500">
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
        }

        <!-- Main Workspace -->
        <div class="flex-1 min-w-0 flex flex-col text-left">
          @if ((auth.user$ | async) === null) {
            <div class="flex-1 flex items-center justify-center bg-slate-50 p-6">
              <div class="max-w-md w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200 p-8 md:p-10 border border-slate-100 animate-in zoom-in-95 duration-500">
                <div class="text-center mb-8">
                  <div class="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 transform hover:rotate-12 transition-transform duration-300">
                    <mat-icon class="text-indigo-600 scale-150">{{ authMode() === 'login' ? 'lock' : 'person_add' }}</mat-icon>
                  </div>
                  <h1 class="text-3xl font-bold text-slate-900 mb-2">
                    {{ authMode() === 'login' ? 'Welcome Back' : 'Create Admin' }}
                  </h1>
                  <p class="text-slate-500 leading-relaxed">
                    {{ authMode() === 'login' ? 'Sign in to manage your guides' : 'Register a new administrator account' }}
                  </p>
                </div>

                <form (submit)="onAuthSubmit($event)" class="space-y-4">
                  @if (authMode() === 'signup') {
                    <div>
                      <label for="displayName" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                      <input id="displayName" type="text" [(ngModel)]="displayName" name="displayName" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all" placeholder="John Doe" required>
                    </div>
                  }
                  
                  <div>
                    <label for="email" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                    <input id="email" type="email" [(ngModel)]="email" name="email" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all" placeholder="admin@example.com" required>
                  </div>

                  <div>
                    <label for="password" class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                    <input id="password" type="password" [(ngModel)]="password" name="password" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all" placeholder="••••••••" required>
                  </div>

                  @if (error()) {
                    <div class="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                      <mat-icon class="text-sm">error</mat-icon>
                      {{ error() }}
                    </div>
                  }

                  <button 
                    type="submit" 
                    [disabled]="loading()"
                    class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 group disabled:opacity-50"
                  >
                    @if (loading()) {
                      <mat-icon class="animate-spin">sync</mat-icon>
                      Processing...
                    } @else {
                      <mat-icon>{{ authMode() === 'login' ? 'login' : 'how_to_reg' }}</mat-icon>
                      {{ authMode() === 'login' ? 'Sign In' : 'Create Account' }}
                    }
                  </button>
                </form>

                <div class="relative my-8 text-center">
                  <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-100"></div></div>
                  <span class="relative px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
                </div>

                <button (click)="loginWithGoogle()" class="w-full py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 mb-6">
                  <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google Account
                </button>

                <p class="text-center text-sm text-slate-500">
                  {{ authMode() === 'login' ? 'First time here?' : 'Already have an account?' }}
                  <button (click)="toggleAuthMode()" class="text-indigo-600 font-bold hover:underline ml-1">
                    {{ authMode() === 'login' ? 'Sign up' : 'Sign in' }}
                  </button>
                </p>
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

  // Auth form state
  authMode = signal<'login' | 'signup'>('login');
  email = '';
  password = '';
  displayName = '';
  error = signal<string | null>(null);
  loading = signal(false);

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

  toggleAuthMode() {
    this.authMode.update(m => m === 'login' ? 'signup' : 'login');
    this.error.set(null);
    this.email = '';
    this.password = '';
    this.displayName = '';
  }

  async onAuthSubmit(event: Event) {
    event.preventDefault();
    if (!this.email || !this.password) return;
    if (this.authMode() === 'signup' && !this.displayName) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      if (this.authMode() === 'login') {
        await this.auth.loginWithEmail(this.email, this.password);
      } else {
        await this.auth.signupWithEmail(this.email, this.password, this.displayName);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.error.set(err.message);
      } else {
        this.error.set('An error occurred during authentication');
      }
    } finally {
      this.loading.set(false);
    }
  }

  loginWithGoogle() {
    this.error.set(null);
    this.auth.login().catch(err => {
      this.error.set(err.message);
    });
  }

  logout() {
    this.auth.logout().then(() => this.router.navigate(['/']));
  }

  createNewPage() {
    this.router.navigate(['/admin/editor/new']);
  }
}
