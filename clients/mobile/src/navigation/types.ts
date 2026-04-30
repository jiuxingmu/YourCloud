export type RootStackParamList = {
  MainTabs: undefined;
  FilePreview: { fileId: number; filename: string; mimeType?: string };
  ShareAccess: undefined;
};

export type MainTabParamList = {
  Cloud: undefined;
  Local: undefined;
  Shares: undefined;
  Profile: undefined;
};
