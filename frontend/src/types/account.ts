export type GalleryRole = "USER" | "MODERATOR" | "ADMIN";

export type AuthConfig = {
  googleEnabled: boolean;
  loginUrl: string;
};

export type Member = {
  id: number;
  email: string;
  name: string;
  picture: string | null;
  role: GalleryRole;
  createdAt?: string;
};

export type GalleryRequestItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requesterName: string;
  requesterEmail: string;
  reviewNote: string | null;
  createdAt: string;
};

export type GalleryDraft = {
  name: string;
  slug: string;
  description: string;
};
