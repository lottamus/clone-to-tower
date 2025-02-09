import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getCloneUrlsFromGithubUrl,
  getTowerUrlFromCloneUrl,
} from "@/lib/gitUrl";
import { getStorageValue, setStorageValue } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";
import { type FormEvent, useEffect, useRef, useState } from "react";

export default function Popup() {
  const [protocol, setProtocol] = useState(getStorageValue("protocol"));
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [gitUrl, setGitUrl] = useState<{
    https: string | null;
    ssh: string | null;
  }>({
    https: "",
    ssh: "",
  });

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setGitUrl(getCloneUrlsFromGithubUrl(tabs[0].url));
      }
    });
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateProtocol(protocol);
  };

  function updateProtocol(value: string) {
    setProtocol(value);
    setStorageValue("protocol", value);
    setShowSuccess(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => setShowSuccess(false), 2000);
  }

  const cloneUrl = gitUrl[protocol as keyof typeof gitUrl];

  return (
    <div className="p-4 h-65 w-75">
      <h1 className="text-xl mb-4">Clone in Tower</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <p className="mb-2 font-medium">
            Select your preferred clone protocol:
          </p>

          <RadioGroup value={protocol} onValueChange={updateProtocol}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="https" id="r1" />
              <Label htmlFor="r1">
                {gitUrl.https || "https://github.com/username/repo.git"}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ssh" id="r2" />
              <Label htmlFor="r2">
                {gitUrl.ssh || "git@github.com:username/repo.git"}
              </Label>
            </div>
          </RadioGroup>
        </div>
      </form>

      <p
        className={cn(
          "my-4 text-success transition-opacity ease-out duration-500",
          showSuccess && "opacity-100",
          !showSuccess && "opacity-0"
        )}
      >
        Settings saved.
      </p>

      {cloneUrl ? (
        <Button
          className="bg-success absolute bottom-4 right-4"
          onClick={() => {
            chrome.tabs.create({
              url: getTowerUrlFromCloneUrl(cloneUrl),
            });
          }}
        >
          <CloneIcon protocol={protocol} />
          Clone in Tower
        </Button>
      ) : null}
    </div>
  );
}

const CloneIcon = ({ protocol }: { protocol: string }) => {
  if (protocol === "https") {
    return (
      <svg
        className="inline-block select-none align-text-bottom overflow-visible"
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 640 512"
        width="16"
        height="16"
        fill="currentColor"
      >
        <path d="M0 336c0 79.5 64.5 144 144 144l368 0c70.7 0 128-57.3 128-128c0-61.9-44-113.6-102.4-125.4c4.1-10.7 6.4-22.4 6.4-34.6c0-53-43-96-96-96c-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32C167.6 32 96 103.6 96 192c0 2.7 .1 5.4 .2 8.1C40.2 219.8 0 273.2 0 336z" />
      </svg>
    );
  }

  return (
    <svg
      className="inline-block select-none align-text-bottom overflow-visible"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="currentColor"
    >
      <path d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25ZM7.25 8a.749.749 0 0 1-.22.53l-2.25 2.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L5.44 8 3.72 6.28a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l2.25 2.25c.141.14.22.331.22.53Zm1.5 1.5h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5Z" />
    </svg>
  );
};
