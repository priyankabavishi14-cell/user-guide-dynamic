import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PageService } from '../../../core/firebase/page.service';
import { ProjectService } from '../../../core/firebase/project.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Page } from '../../../core/models/page.model';
import { switchMap, of } from 'rxjs';

interface PageDisplayRow extends Page {
  id: string;
  level: number;
  showExpand: boolean;
  isExpanded: boolean;
}

@Component({
  selector: 'app-page-list',
  imports: [CommonModule, RouterLink, MatIconModule, FormsModule],
  template: `
    <div class="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Content Inventory</h1>
          <p class="text-slate-500 mt-1">Manage, sort, and organize all your guide pages.</p>
        </div>
        <button [routerLink]="['/admin/editor/new']" class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
          <mat-icon>add</mat-icon>
          Create Page
        </button>
      </header>

      <!-- Advanced Controls -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div class="relative flex-1 group w-full">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">search</mat-icon>
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            placeholder="Search by title or description..." 
            class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white outline-none transition-all text-sm"
          >
        </div>
        
        <div class="flex items-center gap-4 w-full md:w-auto">
          <div class="relative flex-1 md:w-48">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">filter_list</mat-icon>
            <select 
              [(ngModel)]="parentFilter"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="all">Hierarchy View</option>
              <option value="root">Root Only (Flat)</option>
              <option value="sub">Sub-pages Only (Flat)</option>
            </select>
          </div>

          <div class="text-sm font-medium text-slate-400 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 whitespace-nowrap">
            {{ displayRows().length }} rows
          </div>
        </div>
      </div>

      <!-- Content Table -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/50">
                <th (click)="toggleSort('title')" class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group">
                  <div class="flex items-center gap-2">
                    Title
                    <mat-icon class="text-sm opacity-0 group-hover:opacity-100" [class.opacity-100]="sortField() === 'title'">
                      {{ sortDir() === 'asc' ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                  </div>
                </th>
                <th (click)="toggleSort('sequence')" class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group">
                  <div class="flex items-center gap-2">
                    Seq
                    <mat-icon class="text-sm opacity-0 group-hover:opacity-100" [class.opacity-100]="sortField() === 'sequence'">
                      {{ sortDir() === 'asc' ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                  </div>
                </th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID / Parent</th>
                <th (click)="toggleSort('updatedAt')" class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors group">
                   <div class="flex items-center gap-2">
                    Updated
                    <mat-icon class="text-sm opacity-0 group-hover:opacity-100" [class.opacity-100]="sortField() === 'updatedAt'">
                      {{ sortDir() === 'asc' ? 'expand_less' : 'expand_more' }}
                    </mat-icon>
                  </div>
                </th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (page of displayRows(); track page.id) {
                <tr class="group hover:bg-slate-50/80 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3" [style.padding-left.px]="page.level * 24">
                      @if (page.showExpand) {
                        <button (click)="toggleExpand(page.id, $event)" class="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-indigo-600">
                          <mat-icon class="text-lg leading-none">{{ page.isExpanded ? 'expand_more' : 'chevron_right' }}</mat-icon>
                        </button>
                      } @else if (page.level > 0) {
                         <div class="w-7 h-7 flex items-center justify-center opacity-20">
                           <div class="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                         </div>
                      } @else {
                         <div class="w-7 h-7"></div>
                      }
                      <div>
                        <div class="font-semibold text-slate-900">{{ page.title }}</div>
                        <div class="text-[10px] text-slate-400 truncate max-w-xs">{{ page.description }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-900 font-mono text-xs font-bold ring-2 ring-white shadow-sm border border-slate-200">
                      {{ page.sequence }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-col gap-1">
                      <span class="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit">
                        {{ page.id }}
                      </span>
                      @if (page.parentId) {
                        <span class="text-[9px] font-mono text-slate-400 px-2">
                          ↳ {{ page.parentId }}
                        </span>
                      }
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                    {{ page.updatedAt?.toDate() | date:'shortTime' }}, {{ page.updatedAt?.toDate() | date:'MMM d' }}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a [routerLink]="['/admin/editor', page.id]" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all" title="Edit">
                        <mat-icon>edit</mat-icon>
                      </a>
                      <button (click)="confirmDelete(page)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all" title="Delete">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @empty {
                <tr>
                  <td colspan="5" class="px-6 py-24 text-center">
                    <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <mat-icon class="text-slate-300 scale-125">search_off</mat-icon>
                    </div>
                    <div class="text-lg font-bold text-slate-900">No pages found</div>
                    <div class="text-slate-500">Try adjusting your search or filters</div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Delete Confirmation (Simplified) -->
    @if (pageToDelete(); as page) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div class="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-slate-100 animate-in zoom-in-95 duration-300">
          <div class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
            <mat-icon class="text-red-600 scale-125">delete_forever</mat-icon>
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">Delete Page?</h3>
          <p class="text-slate-500 mb-8 leading-relaxed">Are you sure you want to delete <span class="font-bold text-slate-900">"{{ page.title }}"</span>? This action cannot be undone.</p>
          <div class="flex gap-3">
            <button (click)="pageToDelete.set(null)" class="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all">Cancel</button>
            <button (click)="deleteCurrentPage()" class="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-200">Delete</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageList {
  private pageService = inject(PageService);
  private projectService = inject(ProjectService);
  
  currentProject$ = this.projectService.currentProject$;

  pages = toSignal(this.currentProject$.pipe(
    switchMap(project => {
      if (!project?.id) return of([]);
      return this.pageService.getPages(project.id);
    })
  ), { initialValue: [] as Page[] });
  
  searchQuery = signal('');
  parentFilter = signal('all');
  sortField = signal('sequence');
  sortDir = signal<'asc' | 'desc'>('asc');
  pageToDelete = signal<Page | null>(null);
  
  expandedIds = signal<Set<string>>(new Set());

  toggleExpand(id: string, event: Event) {
    event.stopPropagation();
    this.expandedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  hasChildren(id: string): boolean {
    return this.pages().some(p => p.parentId === id);
  }

  // Flattened tree for display
  displayRows = computed(() => {
    const allPages = [...this.pages()];
    const query = this.searchQuery().toLowerCase();
    const filter = this.parentFilter();
    
    // If searching or filtering specifically, use flat list
    if (query || filter !== 'all') {
      let result = allPages;
      if (query) {
        result = result.filter(p => 
          p.title.toLowerCase().includes(query) || 
          p.description.toLowerCase().includes(query)
        );
      }
      if (filter === 'root') {
        result = result.filter(p => p.parentId === null || p.parentId === undefined || p.parentId === '');
      } else if (filter === 'sub') {
        result = result.filter(p => p.parentId !== null && p.parentId !== undefined && p.parentId !== '');
      }
      
      // Sort the flat list
      return this.sortPages(result)
        .filter(p => !!p.id)
        .map(p => ({ 
          ...p, 
          id: p.id!,
          level: 0, 
          showExpand: false,
          isExpanded: false
        } as PageDisplayRow));
    }

    // Hierarchical view (tree)
    const buildTree = (parentId: string | null = null, level = 0): PageDisplayRow[] => {
      const children = allPages
        .filter(p => {
          if (parentId === null) {
            return p.parentId === null || p.parentId === undefined || p.parentId === '';
          }
          return p.parentId === parentId;
        })
        .sort((a, b) => a.sequence - b.sequence);

      let rows: PageDisplayRow[] = [];
      for (const child of children) {
        if (!child.id) continue;
        
        const hasSub = allPages.some(p => p.parentId === child.id);
        rows.push({
          ...child,
          level,
          showExpand: hasSub,
          isExpanded: this.isExpanded(child.id)
        } as PageDisplayRow);

        if (hasSub && this.isExpanded(child.id)) {
          rows = [...rows, ...buildTree(child.id, level + 1)];
        }
      }
      return rows;
    };

    return buildTree();
  });

  private sortPages(pages: Page[]): Page[] {
    const field = this.sortField();
    const dir = this.sortDir();
    return [...pages].sort((a, b) => {
      const fieldKey = field as keyof Page;
      let valA: string | number | null = a[fieldKey] as string | number | null;
      let valB: string | number | null = b[fieldKey] as string | number | null;
      
      if (field === 'updatedAt') {
        valA = a.updatedAt?.seconds || 0;
        valB = b.updatedAt?.seconds || 0;
      }
      
      if (valA === null || valB === null) return 0;
      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  toggleSort(field: string) {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  confirmDelete(page: Page) {
    this.pageToDelete.set(page);
  }

  async deleteCurrentPage() {
    const page = this.pageToDelete();
    if (page?.id) {
      await this.pageService.deletePage(page.id);
      this.pageToDelete.set(null);
    }
  }
}
