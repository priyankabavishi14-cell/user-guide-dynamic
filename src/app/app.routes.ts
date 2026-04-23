import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/user/home/home').then(m => m.Home)
  },
  {
    path: 'guide/:projectSlug',
    loadComponent: () => import('./features/user/user-layout/user-layout').then(m => m.UserLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/user/guide-view/guide-view').then(m => m.GuideView)
      },
      {
        path: 'page/:id',
        loadComponent: () => import('./features/user/guide-view/guide-view').then(m => m.GuideView)
      }
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'pages',
        loadComponent: () => import('./features/admin/page-list/page-list').then(m => m.PageList)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/admin/project-list/project-list').then(m => m.ProjectList)
      },
      {
        path: 'editor/:id',
        loadComponent: () => import('./features/admin/markdown-editor/markdown-editor').then(m => m.MarkdownEditor)
      }
    ]
  }
];
