import {
  getCloneUrlsFromGithubUrl,
  getTowerUrlFromGithubUrl,
} from "@/lib/gitUrl";
import { logger } from "@/lib/logger";
import {
  getStorageValue,
  onStorageChanged,
  setupStorageSync,
} from "@/lib/storage";

const CLONE_IN_TOWER_BTN_ID = "clone-in-tower-button";
const CLONE_IN_TOWER_BTN_ICON_ID = "clone-in-tower-button-icon";

const HTTPS_ICON = `<svg aria-hidden="true" focusable="false" viewBox="0 0 640 512" width="16" height="16" fill="currentColor" style="display:inline-block; user-select: none; vertical-align: text-bottom; overflow: visible;"><path d="M0 336c0 79.5 64.5 144 144 144l368 0c70.7 0 128-57.3 128-128c0-61.9-44-113.6-102.4-125.4c4.1-10.7 6.4-22.4 6.4-34.6c0-53-43-96-96-96c-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32C167.6 32 96 103.6 96 192c0 2.7 .1 5.4 .2 8.1C40.2 219.8 0 273.2 0 336z"/></svg>`;
const SSH_ICON = `<svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="display:inline-block; user-select: none; vertical-align: text-bottom; overflow: visible;">
  <path d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25ZM7.25 8a.749.749 0 0 1-.22.53l-2.25 2.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L5.44 8 3.72 6.28a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l2.25 2.25c.141.14.22.331.22.53Zm1.5 1.5h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5Z"></path>
</svg>`;

function isGithubRepoPage(): boolean {
  const cloneUrls = getCloneUrlsFromGithubUrl(window.location.href);
  return !!cloneUrls.https && !!cloneUrls.ssh;
}

// Only execute the injection if we're on a GitHub repository page.
if (isGithubRepoPage()) {
  setupCloneButton();
}

function getCloneButtonIcon() {
  return getStorageValue("protocol") === "https" ? HTTPS_ICON : SSH_ICON;
}

/**
 * Injects the "Clone in Tower" button after the "Code" button.
 */
function injectCloneButton(codeButton: Element) {
  // Create the "Clone in Tower" button.
  const cloneButton =
    document.getElementById("clone-in-tower-btn") ||
    document.createElement("button");
  cloneButton.setAttribute("id", "clone-in-tower-btn");
  cloneButton.setAttribute("type", "button");
  // Copy the styling from the GitHub "Code" button.
  cloneButton.className = codeButton.className;
  cloneButton.style.backgroundColor =
    "var(--button-primary-bgColor-rest,var(--color-btn-primary-bg))";

  // Create the icon element and set its initial content based on stored preference
  const cloneButtonIcon =
    document.getElementById(CLONE_IN_TOWER_BTN_ID) ||
    document.createElement("span");
  cloneButtonIcon.setAttribute("id", CLONE_IN_TOWER_BTN_ICON_ID);
  cloneButtonIcon.innerHTML = getCloneButtonIcon();
  cloneButtonIcon.style.cursor = "pointer";

  // Append the icon element to the button
  cloneButton.appendChild(cloneButtonIcon);

  // Append the label for the button
  const label = document.createElement("span");
  label.textContent = "Clone in Tower";
  cloneButton.appendChild(label);

  // Bind the click event on the button to open Tower with the proper clone URL
  cloneButton.addEventListener("click", () => {
    window.location.href = getTowerUrlFromGithubUrl(window.location.href) || "";
  });

  // Insert the "Clone in Tower" button immediately after the "Code" button.
  codeButton.insertAdjacentElement("afterend", cloneButton);
}

/**
 * Updates the icon of the "Clone in Tower" button based on the stored protocol preference.
 */
function updateCloneButtonIcon() {
  const cloneButtonIcon = document.getElementById(CLONE_IN_TOWER_BTN_ICON_ID);
  if (cloneButtonIcon) {
    cloneButtonIcon.innerHTML = getCloneButtonIcon();
  }
}

function setupCloneButton() {
  // Because GitHub pages can load dynamically (via PJAX), we poll for the presence of the Code button.
  const codeButton = getGithubCodeButton();
  if (!codeButton) {
    setTimeout(setupCloneButton, 50);
    return;
  }

  // Start the storage sync process
  const storagePromise = setupStorageSync();

  // Inject the clone button
  injectCloneButton(codeButton);

  // Ensure storage is ready before updating the icon
  storagePromise
    .then(() => {
      updateCloneButtonIcon();

      onStorageChanged("protocol", () => {
        updateCloneButtonIcon();
      });
    })
    .catch(logger.error);
}

function getGithubCodeButton() {
  // Only show the clone button on the code tab
  const codeTab = document.getElementById("code-tab");
  if (!codeTab) {
    return null;
  }

  // Very brittle, but it works for now.
  const codeButtons = Array.from(
    document.querySelectorAll("button[data-variant='primary']")
  );
  const codeButton = codeButtons.find(
    (button) => button.textContent?.trim() === "Code"
  );

  return codeButton;
}
