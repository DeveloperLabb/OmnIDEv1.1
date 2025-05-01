interface ElectronAPI {
  selectFile: (options: { filters: { name: string; extensions: string[] }[] }) => Promise<string | undefined>;
  selectDirectory: () => Promise<string | undefined>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};