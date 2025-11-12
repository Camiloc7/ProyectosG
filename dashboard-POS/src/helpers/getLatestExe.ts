export const getLatestReleaseDownloadUrl = async () => {
  const response = await fetch(
    "https://api.github.com/repos/Quality-Soft-Bill/system-gastro-pos/releases/latest"
  );
  const data = await response.json();
  const asset = data.assets.find((asset: { name: string }) =>
    asset.name.endsWith(".exe")
  );
  return asset ? asset.browser_download_url : null;
};
