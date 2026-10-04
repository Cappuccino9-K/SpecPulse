export type GalleryCard = {
  id: number;
  slug: string;
  name: string;
  description: string;
  postCount: number;
  latestTitle: string | null;
  latestAt: string | null;
};

export type PostSummary = {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  views: number;
  recommends: number;
  commentCount: number;
  comparisonId: string | null;
};

export type PostPage = {
  gallery: GalleryCard;
  posts: PostSummary[];
  page: number;
  size: number;
  total: number;
};

export type CommentView = {
  id: number;
  author: string;
  body: string;
  createdAt: string;
};

export type PostDetail = {
  id: number;
  gallerySlug: string;
  galleryName: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  views: number;
  recommends: number;
  recommended: boolean;
  comments: CommentView[];
  comparisonId: string | null;
};

export type RecommendResult = {
  recommended: boolean;
  count: number;
};
