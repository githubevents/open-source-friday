import React from "react";
import { Composition } from "remotion";
import { GuestPromo, type GuestPromoProps } from "./GuestPromo/GuestPromo";

const DEFAULT_PROPS: GuestPromoProps = {
  guest_name: "Guest Name",
  github_handle: "githubhandle",
  project_name: "Open Source Project",
  project_url: "",
  bio: "",
  stream_date: "May 22, 2026",
  stream_time: "1 PM ET",
  host_name: "Andrea Griffiths",
  has_audio: false,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="GuestPromo"
      component={GuestPromo}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1080}
      defaultProps={DEFAULT_PROPS}
    />
  );
};
