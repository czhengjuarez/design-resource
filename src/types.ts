export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  parentId: number | null;
  sortOrder: number;
  resourceCount: number;
  children: CategoryNode[];
}

export interface Resource {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  categoryId: number | null;
  type: string;
  author: string | null;
  tags: string[] | null;
  imageUrl: string | null;
  source: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourcePage {
  items: Resource[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
