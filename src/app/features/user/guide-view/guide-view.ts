import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { PageService } from '../../../core/firebase/page.service';
import { ProjectService } from '../../../core/firebase/project.service';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';

@Component({
  selector: 'app-guide-view',
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    @if (page$ | async; as page) {
      <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <!-- Breadcrumbs -->
        <nav class="flex items-center gap-2 mb-8 text-sm text-slate-500">
          <mat-icon class="text-base">home</mat-icon>
          <a routerLink="/" class="hover:text-indigo-600 cursor-pointer">Home</a>
          <mat-icon class="text-xs">chevron_right</mat-icon>
          <span class="text-slate-900 font-medium">{{ page.title }}</span>
        </nav>

        <h1 class="text-4xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">{{ page.title }}</h1>
        <p class="text-lg text-slate-500 mb-10 leading-relaxed">{{ page.description }}</p>
        
        <div class="h-px bg-slate-200 w-full mb-10"></div>

        <!-- Markdown Content -->
        <article 
          class="prose prose-slate prose-lg max-w-none 
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
            prose-pre:bg-slate-900 prose-pre:rounded-xl prose-pre:shadow-lg
            prose-code:text-slate-900 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-img:rounded-2xl prose-img:shadow-xl
            prose-hr:border-slate-200"
          [innerHTML]="renderMarkdown(page.content)"
        ></article>

        <footer class="mt-20 pt-8 border-t border-slate-200">
          <div class="flex items-center justify-between text-sm text-slate-400">
            <span>Last updated: {{ formatDate(page.updatedAt) | date:'mediumDate' }}</span>
            <span class="flex items-center gap-1 group cursor-pointer hover:text-indigo-600">
              <mat-icon class="text-base">edit</mat-icon>
              Suggest improvements
            </span>
          </div>
        </footer>
      </div>
    } @else {
      @if (project$ | async; as project) {
        <div class="flex flex-col items-center justify-center py-24 text-center animate-in zoom-in-95 duration-500">
          <div class="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
            <mat-icon class="text-indigo-600 scale-150">auto_stories</mat-icon>
          </div>
          <h2 class="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Welcome to the {{ project.title }} Guide</h2>
          <p class="text-lg text-slate-500 max-w-md mx-auto leading-relaxed mb-10">
            {{ project.description || 'Explore our comprehensive documentation to understand how to get the most out of this product.' }}
          </p>
          
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full text-left">
            <h4 class="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <mat-icon class="text-indigo-600 text-lg">info</mat-icon>
              Getting Started
            </h4>
            <p class="text-xs text-slate-500 leading-relaxed">
              Use the sidebar on the left to navigate through the available documentation pages. If you can't find what you're looking for, you can always head to the admin panel to add more content.
            </p>
          </div>

          <a routerLink="/admin" class="mt-12 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-lg shadow-slate-200">
            <mat-icon>admin_panel_settings</mat-icon>
            Admin Console
          </a>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-24 text-center">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <mat-icon class="text-slate-400 scale-125">search_off</mat-icon>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Project not found</h2>
          <p class="text-slate-500 max-w-xs mx-auto">The guide you are looking for doesn't seem to exist or has been moved.</p>
          <a routerLink="/" class="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Return Home
          </a>
        </div>
      }
    }
  `,
  styles: [`
    @reference "tailwindcss";
    :host { display: block; }
    /* Injecting Tailwind prose classes as standard doesn't work well without the plugin, 
       so I'll use raw CSS for some specific polished touches if tailwind-typography isn't available. */
    article ::ng-deep h1 { @apply text-3xl font-bold mt-8 mb-4; }
    article ::ng-deep h2 { @apply text-2xl font-bold mt-8 mb-4 border-b border-slate-100 pb-2; }
    article ::ng-deep h3 { @apply text-xl font-bold mt-6 mb-3; }
    article ::ng-deep p { @apply my-4 leading-relaxed text-slate-700; }
    article ::ng-deep ul { @apply list-disc list-inside my-4 space-y-2; }
    article ::ng-deep ol { @apply list-decimal list-inside my-4 space-y-2; }
    article ::ng-deep pre { @apply bg-slate-900 text-slate-100 p-4 rounded-xl my-6 overflow-x-auto font-mono text-sm shadow-inner; }
    article ::ng-deep code { @apply bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-sm; }
    article ::ng-deep pre code { @apply bg-transparent text-slate-100 p-0; }
    article ::ng-deep blockquote { @apply border-l-4 border-indigo-500 pl-4 py-1 my-6 italic text-slate-600 bg-indigo-50/50 rounded-r-lg; }
    article ::ng-deep table { @apply w-full border-collapse my-8 text-left; }
    article ::ng-deep th { @apply bg-slate-50 p-3 border border-slate-200 font-bold; }
    article ::ng-deep td { @apply p-3 border border-slate-200; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuideView {
  private route = inject(ActivatedRoute);
  private pageService = inject(PageService);
  private projectService = inject(ProjectService);
  private sanitizer = inject(DomSanitizer);

  project$ = this.route.params.pipe(
    switchMap(params => {
      const slug = params['projectSlug'];
      if (slug) return this.projectService.getProjectBySlug(slug);
      return of(null);
    })
  );

  page$ = this.route.params.pipe(
    switchMap(params => {
      const id = params['id'];
      if (id) return this.pageService.getPage(id);
      return [null];
    })
  );

  renderMarkdown(content: string): SafeHtml {
    const rawHtml = marked.parse(content || '') as string;
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  formatDate(updatedAt: any): Date | null {
    if (!updatedAt) return null;
    if (updatedAt.toDate) return updatedAt.toDate();
    if (updatedAt instanceof Date) return updatedAt;
    return new Date(updatedAt);
  }
}
