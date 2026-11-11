import { BuildChannelEnum, BuildInfo } from '#frontend/types';

export function getBuildInfo(): BuildInfo | null {
  const buildInfo = BuildInfo.safeParse({
    channel: import.meta.env.VITE_BUILD_CHANNEL,
    commitSha: import.meta.env.VITE_BUILD_COMMIT_SHA,
    date: import.meta.env.VITE_BUILD_DATE,
    tags: import.meta.env.VITE_BUILD_TAGS,

    runner: import.meta.env.VITE_BUILD_RUNNER,
    runNumber: import.meta.env.VITE_BUILD_RUN_NUMBER,
  });

  return buildInfo.success ? buildInfo.data : null;
}

export const prereleaseBuildInfo = () => {
  const buildInfo = getBuildInfo();

  if (buildInfo?.channel === BuildChannelEnum.RELEASE) {
    return null;
  }

  return buildInfo;
};
