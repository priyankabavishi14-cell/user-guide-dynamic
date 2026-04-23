import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProjectService } from '../../../core/firebase/project.service';
import { AuthService } from '../../../core/firebase/auth.service';
import { Project } from '../../../core/models/page.model';

@Component({
  selector: 'app-project-list',
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Project Management</h1>
          <p class="text-slate-500 mt-1">Create and manage documentation scopes for different product URLs.</p>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Project List -->
        <div class="space-y-4">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <mat-icon class="text-indigo-600">book</mat-icon>
            Existing Projects
          </h2>
          <div class="space-y-3">
            @for (project of projects$ | async; track project.id) {
              <div 
                [class]="'p-4 rounded-2xl border transition-all group flex items-center justify-between cursor-pointer ' + 
                          (editingProjectId() === project.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm')"
                (click)="editProject(project)"
              >
                <div>
                  <div class="font-bold text-slate-900">{{ project.title }}</div>
                  <div class="text-xs text-indigo-600 font-mono">{{ project.slug }}.guide</div>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button (click)="$event.stopPropagation(); selectProject(project)" class="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Activate Project">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                  <button (click)="$event.stopPropagation(); editProject(project)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit Project">
                    <mat-icon>edit</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Add/Edit Project Form -->
        <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 flex flex-col h-fit sticky top-24">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
              <mat-icon class="text-indigo-600">{{ editingProjectId() ? 'edit' : 'add_circle' }}</mat-icon>
              {{ editingProjectId() ? 'Edit Project' : 'Add New Project' }}
            </h2>
            @if (editingProjectId()) {
              <button (click)="cancelEdit()" class="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 uppercase tracking-widest">
                <mat-icon class="text-sm">close</mat-icon>
                Cancel
              </button>
            }
          </div>
          <form (submit)="saveProject()" class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Project Title</label>
              <input 
                type="text" 
                [(ngModel)]="newProject.title" 
                name="title"
                placeholder="e.g. Sellsync App" 
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                required
              >
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unique Slug (URL prefix)</label>
              <input 
                type="text" 
                [(ngModel)]="newProject.slug" 
                name="slug"
                placeholder="e.g. sellsync-app" 
                [disabled]="editingProjectId() !== null"
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white outline-none transition-all font-mono text-sm disabled:opacity-50"
                required
              >
              @if (!editingProjectId()) {
                <p class="mt-1 text-[10px] text-slate-400">Result: <span class="text-indigo-600">{{ newProject.slug || '...' }}.guide</span></p>
              } @else {
                <p class="mt-1 text-[10px] text-slate-400 font-mono">Slug cannot be changed after creation.</p>
              }
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
              <textarea 
                [(ngModel)]="newProject.description" 
                name="description"
                rows="2"
                placeholder="Briefly describe what this project covers..." 
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
               <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Frontend URL</label>
                  <input 
                    type="text" 
                    [(ngModel)]="newProject.frontendUrl" 
                    name="frontendUrl"
                    placeholder="e.g. project.web.guide" 
                    class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  >
               </div>
               <div>
                  <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Backend URL</label>
                  <input 
                    type="text" 
                    [(ngModel)]="newProject.backendUrl" 
                    name="backendUrl"
                    placeholder="e.g. project.web.admin" 
                    class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  >
               </div>
            </div>
            
            <button 
              type="submit" 
              [disabled]="loading()"
              class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              @if (loading()) {
                <mat-icon class="animate-spin">sync</mat-icon>
                Saving...
              } @else {
                <mat-icon>{{ editingProjectId() ? 'update' : 'save' }}</mat-icon>
                {{ editingProjectId() ? 'Update Project' : 'Create Project' }}
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectList {
  private projectService = inject(ProjectService);
  private auth = inject(AuthService);

  projects$ = this.projectService.getProjects();
  loading = signal(false);
  editingProjectId = signal<string | null>(null);

    newProject = {
    title: '',
    slug: '',
    description: '',
    frontendUrl: '',
    backendUrl: ''
  };

  async saveProject() {
    if (!this.newProject.title || !this.newProject.slug) return;
    
    const user = this.auth.currentUser;
    if (!user) return;

    this.loading.set(true);
    try {
      const slug = this.newProject.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      
      if (this.editingProjectId()) {
        await this.projectService.updateProject(this.editingProjectId()!, {
          title: this.newProject.title,
          description: this.newProject.description,
          frontendUrl: this.newProject.frontendUrl,
          backendUrl: this.newProject.backendUrl
        });
      } else {
        await this.projectService.createProject({
          ...this.newProject,
          slug,
          createdBy: user.uid
        });
      }
      this.cancelEdit();
    } finally {
      this.loading.set(false);
    }
  }

  editProject(project: Project) {
    this.editingProjectId.set(project.id!);
    this.newProject = {
      title: project.title,
      slug: project.slug,
      description: project.description,
      frontendUrl: project.frontendUrl || '',
      backendUrl: project.backendUrl || ''
    };
  }

  cancelEdit() {
    this.editingProjectId.set(null);
    this.newProject = { title: '', slug: '', description: '', frontendUrl: '', backendUrl: '' };
  }

  selectProject(project: Project) {
    this.projectService.setCurrentProject(project);
  }
}
