import { ChangeDetectionStrategy, Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PageService } from '../../../core/firebase/page.service';
import { ProjectService } from '../../../core/firebase/project.service';
import { AuthService } from '../../../core/firebase/auth.service';
import { Page } from '../../../core/models/page.model';
import { marked } from 'marked';
import { DomSanitizer } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-markdown-editor',
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  template: `
    <div class="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      <!-- Toolbar -->
      <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div class="flex items-center gap-4">
          <a routerLink="/admin/pages" class="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <div class="h-6 w-px bg-slate-200"></div>
          <div class="flex flex-col">
            <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none mb-1">{{ (currentProject$ | async)?.title || 'Project' }}</span>
            <span class="text-sm font-bold text-slate-900 leading-none truncate max-w-[200px]">{{ form().title || 'Untitled Page' }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="hidden md:flex bg-slate-100 p-1 rounded-xl mr-4">
            <button 
              (click)="viewMode.set('edit')" 
              [class.bg-white]="viewMode() === 'edit'" [class.text-indigo-600]="viewMode() === 'edit'" [class.shadow-sm]="viewMode() === 'edit'"
              class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
            >
              <mat-icon class="text-base">code</mat-icon> Editor
            </button>
            <button 
              (click)="viewMode.set('preview')" 
              [class.bg-white]="viewMode() === 'preview'" [class.text-indigo-600]="viewMode() === 'preview'" [class.shadow-sm]="viewMode() === 'preview'"
              class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
            >
              <mat-icon class="text-base">visibility</mat-icon> Preview
            </button>
            <button 
              (click)="viewMode.set('split')" 
              [class.bg-white]="viewMode() === 'split'" [class.text-indigo-600]="viewMode() === 'split'" [class.shadow-sm]="viewMode() === 'split'"
              class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
            >
              <mat-icon class="text-base">vertical_split</mat-icon> Split
            </button>
          </div>

          <button 
            (click)="save()" 
            [disabled]="isSaving() || !isFormValid()"
            class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            @if (!isSaving()) { <mat-icon>save</mat-icon> }
            @if (isSaving()) { <mat-icon class="animate-spin text-lg">sync</mat-icon> }
            {{ isSaving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </header>

      <div class="flex-1 flex overflow-hidden">
        <!-- Forms Panel (Left Sidebar) -->
        <aside class="w-80 border-r border-slate-200 bg-white overflow-y-auto p-6 hidden lg:block shrink-0">
          <div class="space-y-6">
            <div>
              <label for="page-title" class="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Page Title</label>
              <input id="page-title" type="text" [(ngModel)]="form().title" placeholder="e.g. Getting Started" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="page-sequence" class="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sequence</label>
                <input id="page-sequence" type="number" [(ngModel)]="form().sequence" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all">
              </div>
              <div>
                <span class="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Icon</span>
                <div class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                  <mat-icon class="text-slate-400">article</mat-icon>
                </div>
              </div>
            </div>

            <div>
              <label for="page-parent" class="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Parent Page</label>
              <select id="page-parent" [(ngModel)]="form().parentId" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm appearance-none cursor-pointer">
                <option [value]="null">No Parent (Root)</option>
                @for (p of allPages(); track p.id) {
                  <option [value]="p.id">{{ p.title }}</option>
                }
              </select>
            </div>

            <div>
              <label for="page-desc" class="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Short Description</label>
              <textarea id="page-desc" [(ngModel)]="form().description" rows="3" placeholder="Brief summary for the guide listing..." class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all resize-none text-sm"></textarea>
            </div>
            
            <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100">
               <div class="flex gap-3">
                 <mat-icon class="text-amber-500">lightbulb</mat-icon>
                 <div>
                   <div class="text-sm font-bold text-amber-900 mb-1">Markdown Tip</div>
                   <p class="text-xs text-amber-700 leading-relaxed">Use # for Header 1, ## for Header 2, and [Title](URL) for links.</p>
                 </div>
               </div>
            </div>
          </div>
        </aside>

        <!-- Editor/Preview Dual Pane -->
        <main class="flex-1 flex overflow-hidden bg-white">
          <!-- Raw Editor -->
          @if (viewMode() !== 'preview') {
            <div class="flex-1 flex flex-col border-r border-slate-100 relative">
              <div class="absolute top-4 right-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest pointer-events-none z-10">MD-EDITOR</div>
              <textarea 
                [(ngModel)]="form().content" 
                class="flex-1 w-full p-8 md:p-12 pb-24 outline-none resize-none font-mono text-sm leading-relaxed text-slate-700 selection:bg-indigo-100"
                placeholder="# Start writing your awesome guide content here..."
              ></textarea>
            </div>
          }

          <!-- Preview Pane -->
          @if (viewMode() !== 'edit') {
            <div class="flex-1 overflow-y-auto p-8 md:p-12 pb-24 bg-slate-50/30 prose-container relative">
              <div class="absolute top-4 right-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest pointer-events-none z-10">RENDERED VIEW</div>
              <div 
                class="prose prose-slate prose-lg max-w-none 
                  prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
                  prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                  prose-pre:bg-slate-900 prose-pre:rounded-xl
                  prose-code:text-slate-900 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                  prose-img:rounded-2xl"
                [innerHTML]="renderedContent()"
              ></div>
              @if (!form().content) {
                <div class="h-full flex flex-col items-center justify-center text-center py-24 grayscale opacity-20 select-none pointer-events-none">
                  <mat-icon class="text-8xl mb-4">preview</mat-icon>
                  <div class="text-xl font-bold">Nothing to preview</div>
                </div>
              }
            </div>
          }
        </main>
      </div>

      <!-- Toast Notification (Simplified) -->
      @if (showToast()) {
        <div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <mat-icon class="text-emerald-400">check_circle</mat-icon>
          <span class="font-bold text-sm">Changes saved successfully!</span>
        </div>
      }
    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    :host { display: block; }
    .prose-container ::ng-deep h1 { @apply text-3xl font-bold mt-8 mb-4; }
    .prose-container ::ng-deep h2 { @apply text-2xl font-bold mt-8 mb-4 border-b border-slate-100 pb-2; }
    .prose-container ::ng-deep p { @apply my-4 leading-relaxed text-slate-700; }
    .prose-container ::ng-deep pre { @apply bg-slate-900 text-slate-100 p-4 rounded-xl my-6 overflow-x-auto; }
    .prose-container ::ng-deep code { @apply bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-sm; }
    .prose-container ::ng-deep pre code { @apply bg-transparent text-slate-100 p-0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarkdownEditor {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pageService = inject(PageService);
  private projectService = inject(ProjectService);
  private auth = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  viewMode = signal<'edit' | 'preview' | 'split'>('split');
  isSaving = signal(false);
  showToast = signal(false);
  
  currentProject$ = this.projectService.currentProject$;

  allPages = toSignal(this.currentProject$.pipe(
    switchMap(project => {
      if (!project?.id) return of([]);
      return this.pageService.getPages(project.id);
    })
  ), { initialValue: [] });

  form = signal<Omit<Page, 'id' | 'updatedAt'>>({
    title: '',
    sequence: 0,
    parentId: null,
    projectId: '',
    description: '',
    content: '',
    createdBy: ''
  });

  pageId: string | null = null;

  constructor() {
    this.route.params.subscribe(params => {
      this.pageId = params['id'] === 'new' ? null : params['id'];
      if (this.pageId) {
        this.pageService.getPage(this.pageId).subscribe(page => {
          if (page) {
            this.form.set({
              title: page.title,
              sequence: page.sequence,
              parentId: page.parentId,
              projectId: page.projectId,
              description: page.description,
              content: page.content,
              createdBy: page.createdBy
            });
          }
        });
      }
    });

    // Sync with current project
    effect(() => {
      const project = this.projectService.currentProject();
      if (project && !this.pageId && !this.form().projectId) {
        this.form.update(f => ({ ...f, projectId: project.id! }));
      }
    }, { allowSignalWrites: true });

    // Set createdBy if not set
    effect(() => {
      const user = this.auth.currentUser;
      if (user && !this.form().createdBy) {
        this.form.update(f => ({ ...f, createdBy: user.uid }));
      }
    }, { allowSignalWrites: true });
  }

  renderedContent = computed(() => {
    const rawHtml = marked.parse(this.form().content || '') as string;
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  });

  isFormValid() {
    const f = this.form();
    return f.title.trim() && f.createdBy && f.projectId;
  }

  async save() {
    if (!this.isFormValid()) return;
    
    this.isSaving.set(true);
    try {
      if (this.pageId) {
        await this.pageService.updatePage(this.pageId, this.form());
      } else {
        await this.pageService.createPage(this.form());
        // Simple success path: redirect to pages
        this.router.navigate(['/admin/pages']);
        return;
      }
      this.showToast.set(true);
      setTimeout(() => this.showToast.set(false), 3000);
    } catch (error) {
      console.error('Save failed', error);
      alert('Failed to save changes. Check console for details.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
