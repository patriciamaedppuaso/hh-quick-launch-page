import { useEffect, useState } from "react";
import type { AppTile } from "../types";
import { Icon } from "../icons";
import { brandLogoSources, initialOf } from "../utils";

interface Props {
  app: AppTile;
}

export function AppLogo({ app }: Props) {
  const domain = app.type === "link" ? (app.logoDomain ?? app.url) : "";
  const sources = app.type === "link" && app.useBrandLogo ? brandLogoSources(domain) : [];
  const [srcIndex, setSrcIndex] = useState(0);
  const key = domain;

  useEffect(() => {
    setSrcIndex(0);
  }, [key]);

  if (sources.length > 0 && srcIndex < sources.length) {
    return <img className="badge-logo" src={sources[srcIndex]} alt="" onError={() => setSrcIndex((i) => i + 1)} />;
  }

  if (app.icon) {
    return <Icon name={app.icon} />;
  }

  return <span className="badge-letter">{app.initial || initialOf(app.name)}</span>;
}
