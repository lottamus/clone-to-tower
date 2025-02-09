import { getStorageValue } from "./storage";

/**
 * Extracts the owner and repo from a GitHub URL.
 *
 * @param url - The GitHub URL to extract the owner and repo from.
 * @returns An object containing the HTTPS and SSH clone URLs.
 */
export function getCloneUrlsFromGithubUrl(url: string) {
  if (!url?.includes("github.com")) {
    return {
      https: null,
      ssh: null,
    };
  }

  const pathname = new URL(url).pathname;
  const repoPath = pathname.match(/^\/([^/]+)\/([^/|\.]+).*$/);
  if (!repoPath) {
    return {
      https: null,
      ssh: null,
    };
  }

  const [, owner, repo] = repoPath;

  return {
    https: `https://github.com/${owner}/${repo}.git`,
    ssh: `git@github.com:${owner}/${repo}.git`,
  };
}

/**
 * Extracts the Tower URL from a GitHub URL.
 *
 * @param url - The GitHub URL to extract the Tower URL from.
 * @returns The Tower URL.
 */
export function getTowerUrlFromGithubUrl(url: string) {
  const gitUrl = getCloneUrlsFromGithubUrl(url);

  if (!gitUrl.https && !gitUrl.ssh) {
    return null;
  }

  const protocol = getStorageValue("protocol");
  return getTowerUrlFromCloneUrl(gitUrl[protocol as keyof typeof gitUrl]);
}

/**
 * Appends the Tower protocol to the clone URL
 *
 * @param cloneUrl - The clone URL to append the Tower protocol to.
 * @returns The Tower URL.
 */
export function getTowerUrlFromCloneUrl(cloneUrl: string) {
  return `gittower://openRepo/${encodeURIComponent(cloneUrl)}`;
}
