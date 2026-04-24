export interface Project {
  id?: string;
  title: string;
  description: string;
  slug: string;
  frontendUrl?: string;
  backendUrl?: string;
  hideWelcomePage?: boolean;
  updatedAt: { toDate: () => Date; seconds: number } | null;
  createdBy: string;
}

export interface Page {
  id?: string;
  projectId: string;
  title: string;
  sequence: number;
  parentId: string | null;
  description: string;
  content: string;
  updatedAt: { toDate: () => Date; seconds: number } | null;
  createdBy: string;
}

export interface PageNode extends Page {
  children?: PageNode[];
}
