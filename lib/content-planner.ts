export type PlannerPlatform = "Instagram" | "TikTok" | "YouTube" | "LinkedIn";
export type PlannerStatus = "Scheduled" | "Draft" | "Backlog";
export type PlannerType = "Reel" | "Carousel" | "Static Post" | "Story" | "Video" | "Short";

export type PlannerItem = {
  id: string;
  title: string;
  caption: string;
  platform: PlannerPlatform;
  status: PlannerStatus;
  type: PlannerType;
  scheduledDate: string;
  time: string;
  createdAt: string;
};

export const plannerPlatforms: PlannerPlatform[] = [
  "Instagram",
  "TikTok",
  "YouTube",
  "LinkedIn",
];

export const plannerStatuses: PlannerStatus[] = ["Scheduled", "Draft", "Backlog"];
export const plannerTypes: PlannerType[] = [
  "Reel",
  "Carousel",
  "Static Post",
  "Story",
  "Video",
  "Short",
];

export const contentPlannerStorageKey = "tucuervo.contentPlanner.items";
export const contentPlannerCommentsStorageKey = "tucuervo.contentPlanner.comments";
