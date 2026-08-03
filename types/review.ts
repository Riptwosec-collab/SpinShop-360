export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userAvatarUrl?: string | null;
  rating: number;
  title: string;
  content: string;
  images: string[];
  variantLabel?: string;
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  helpfulCount: number;
  createdAt: string;
}
