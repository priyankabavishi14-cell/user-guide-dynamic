import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { PageService } from '../../../core/firebase/page.service';
import { ProjectService } from '../../../core/firebase/project.service';
import { map, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="p-6 md:p-10 max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <mat-icon class="text-indigo-600">domain</mat-icon>
            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ (currentProject$ | async)?.title || '...' }} Project</span>
          </div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h1>
          <p class="text-slate-500 mt-1">Manage documentation for <span class="text-indigo-600 font-semibold">{{ (currentProject$ | async)?.slug || '...' }}</span> from this console.</p>
        </div>
        <div class="text-sm text-slate-400 font-medium bg-white px-4 py-2 rounded-full border border-slate-200">
          Session Active • {{ today | date:'mediumTime' }}
        </div>
      </header>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500 opacity-60"></div>
          <div class="relative">
            <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm mb-4">
              <mat-icon class="text-indigo-600">article</mat-icon>
            </div>
            <div class="text-4xl font-bold text-slate-900 mb-1">{{ (pages$ | async)?.length || 0 }}</div>
            <div class="text-sm font-semibold text-slate-500 uppercase tracking-widest">Total Pages</div>
          </div>
        </div>

        @if (currentProject$ | async; as project) {
          @if (project.frontendUrl || project.backendUrl) {
            <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between">
              <div class="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500 opacity-60"></div>
              <div class="relative space-y-4">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-widest">Project Links</div>
                <div class="space-y-2">
                  @if (project.frontendUrl) {
                    <a [href]="project.frontendUrl.startsWith('http') ? project.frontendUrl : 'https://' + project.frontendUrl" target="_blank" class="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 font-semibold text-sm group/link">
                      <span class="flex items-center gap-2">
                        <mat-icon class="text-indigo-500 scale-75">public</mat-icon>
                        Frontend
                      </span>
                      <mat-icon class="text-base opacity-0 group-hover/link:opacity-100 transition-opacity">open_in_new</mat-icon>
                    </a>
                  }
                  @if (project.backendUrl) {
                    <a [href]="project.backendUrl.startsWith('http') ? project.backendUrl : 'https://' + project.backendUrl" target="_blank" class="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all border border-slate-100 font-semibold text-sm group/link">
                      <span class="flex items-center gap-2">
                        <mat-icon class="text-slate-400 scale-75">terminal</mat-icon>
                        Backend
                      </span>
                      <mat-icon class="text-base opacity-0 group-hover/link:opacity-100 transition-opacity">open_in_new</mat-icon>
                    </a>
                  }
                </div>
              </div>
            </div>
          } @else {
            <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500 opacity-60"></div>
              <div class="relative">
                <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm mb-4">
                  <mat-icon class="text-emerald-600">update</mat-icon>
                </div>
                <div class="text-4xl font-bold text-slate-900 mb-1">{{ today | date:'MMM d' }}</div>
                <div class="text-sm font-semibold text-slate-500 uppercase tracking-widest">System Operational</div>
              </div>
            </div>
          }
        }

        <div class="bg-indigo-600 p-8 rounded-3xl border border-indigo-700 shadow-lg shadow-indigo-100 relative overflow-hidden group cursor-pointer" routerLink="/admin/editor/new">
          <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div class="relative text-white">
            <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shadow-sm mb-4">
              <mat-icon class="text-white">add</mat-icon>
            </div>
            <div class="text-xl font-bold mb-1">Create Page</div>
            <div class="text-sm font-medium text-white/80">Add new content to your guide.</div>
          </div>
        </div>
      </div>

      <!-- Recent Content Table -->
      <section class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 class="font-bold text-lg text-slate-900">Recently Updated Pages</h2>
          <a routerLink="/admin/pages" class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all
            <mat-icon class="text-lg">arrow_forward</mat-icon>
          </a>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Title</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Parent</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (page of (recentPages$ | async); track page.id) {
                <tr class="group hover:bg-slate-50/80 transition-colors">
                  <td class="px-6 py-4">
                    <div class="font-semibold text-slate-900">{{ page.title }}</div>
                    <div class="text-xs text-slate-500 truncate max-w-xs">{{ page.description }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold" [class.bg-slate-100]="!page.parentId" [class.text-slate-600]="!page.parentId" [class.bg-indigo-50]="page.parentId" [class.text-indigo-600]="page.parentId">
                      {{ page.parentId ? 'Sub-page' : 'Root' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-500">
                    {{ page.updatedAt?.toDate() | date:'shortTime' }}, {{ page.updatedAt?.toDate() | date:'MMM d' }}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <a [routerLink]="['/admin/editor', page.id]" class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
                      <mat-icon class="text-lg">edit</mat-icon>
                    </a>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td colspan="4" class="px-6 py-12 text-center">
                    <div class="text-slate-400 font-medium">No pages created yet.</div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard {
  private pageService = inject(PageService);
  private projectService = inject(ProjectService);
  today = new Date();

  currentProject$ = this.projectService.currentProject$;

  pages$ = this.currentProject$.pipe(
    switchMap(project => {
      if (!project?.id) return of([]);
      return this.pageService.getPages(project.id);
    })
  );

  recentPages$ = this.pages$.pipe(
    map(pages => [...pages].sort((a, b) => {
      const timeA = a.updatedAt?.seconds || 0;
      const timeB = b.updatedAt?.seconds || 0;
      return timeB - timeA;
    }).slice(0, 5))
  );
}
