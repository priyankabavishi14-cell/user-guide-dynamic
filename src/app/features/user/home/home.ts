import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../../core/firebase/project.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col">
      <!-- Navbar -->
      <nav class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
        <a [routerLink]="['/']" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
            <mat-icon class="text-white scale-75">book</mat-icon>
          </div>
          <span class="font-bold text-xl tracking-tight text-slate-900">Guide<span class="text-indigo-600">Manager</span></span>
        </a>
        
        <a routerLink="/admin" class="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-md">
          <mat-icon class="text-lg">admin_panel_settings</mat-icon>
          Admin Console
        </a>
      </nav>

      <!-- Hero Section -->
      <section class="relative py-20 px-6 overflow-hidden">
        <div class="absolute inset-0 z-0">
          <div class="absolute top-0 right-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
          <div class="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div class="max-w-5xl mx-auto text-center relative z-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-700">
            <mat-icon class="text-sm">verified</mat-icon>
            Professional Documentation Engine
          </div>
          
          <h1 class="text-5xl md:text-7xl font-bold text-slate-900 mb-8 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Beautifully Structured<br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">User Guides</span>
          </h1>
          
          <p class="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Centralize your product documentation with a unified platform for multi-project management, hierarchical guide pages, and markdown support.
          </p>

          <div class="flex flex-wrap items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
             <button (click)="scrollToProjects()" class="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2 group">
                Browse Guides
                <mat-icon class="group-hover:translate-x-1 transition-transform">arrow_forward</mat-icon>
             </button>
             <a routerLink="/admin" class="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                Manage Content
                <mat-icon>settings</mat-icon>
             </a>
          </div>
        </div>
      </section>

      <!-- Projects Section -->
      <section id="projects" class="py-20 px-6 bg-white border-t border-slate-100">
        <div class="max-w-6xl mx-auto">
          <div class="flex items-center justify-between mb-12">
            <div>
              <h2 class="text-3xl font-bold text-slate-900 tracking-tight">Active Repositories</h2>
              <p class="text-slate-500 mt-2">Explore documentation for our various products and tools.</p>
            </div>
            <div class="hidden sm:block">
              <div class="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                <div class="px-3 py-1.5 bg-white shadow-sm rounded-lg text-xs font-bold text-slate-900">All Projects</div>
                <div class="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">Recently Updated</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (project of projects$ | async; track project.id) {
              <a 
                [routerLink]="['/guide', project.slug]" 
                class="group bg-white p-8 rounded-3xl border border-slate-200 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100 transition-all flex flex-col h-full relative"
              >
                <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mb-6 shadow-sm">
                  <mat-icon class="scale-110">menu_book</mat-icon>
                </div>
                
                <h3 class="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors">{{ project.title }}</h3>
                <p class="text-slate-500 text-sm leading-relaxed mb-8 flex-1">
                  {{ project.description || 'No description provided for this project.' }}
                </p>

                <div class="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                  <span class="text-xs font-mono text-slate-400 uppercase tracking-widest">{{ project.slug }}.guide</span>
                  <div class="p-2 bg-slate-50 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <mat-icon class="text-lg">arrow_forward</mat-icon>
                  </div>
                </div>
              </a>
            } @empty {
              <div class="col-span-full py-20 text-center">
                <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <mat-icon class="text-slate-300 scale-150">search_off</mat-icon>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-2">No projects found</h3>
                <p class="text-slate-500 mb-8">Ready to start? Head over to the admin panel to create your first documentation project.</p>
                <a routerLink="/admin" class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                  Go to Admin Panel
                </a>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="mt-auto py-12 px-6 border-t border-slate-100 bg-slate-50/50">
        <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div class="flex items-center gap-2 opacity-50">
            <mat-icon class="text-slate-900">book</mat-icon>
            <span class="font-bold text-slate-900 tracking-tight">GuideManager</span>
          </div>
          
          <div class="flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#" class="hover:text-indigo-600 transition-colors">Documentation</a>
            <a href="#" class="hover:text-indigo-600 transition-colors">API Status</a>
            <a href="#" class="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" class="hover:text-indigo-600 transition-colors">Privacy Policy</a>
          </div>

          <div class="text-xs text-slate-400">
            © 2026 GuideManager System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slide-in-from-bottom { from { transform: translateY(1rem); } to { transform: translateY(0); } }
    @keyframes slide-in-from-top { from { transform: translateY(-1rem); } to { transform: translateY(0); } }
    @keyframes zoom-in { from { transform: scale(0.95); } to { transform: scale(1); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {
  private projectService = inject(ProjectService);
  projects$ = this.projectService.getProjects();

  scrollToProjects() {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
  }
}
