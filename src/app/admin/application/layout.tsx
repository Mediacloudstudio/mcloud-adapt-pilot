import type { ReactNode } from "react";
import { ApplicationTabs } from "./application-tabs";

export default function ApplicationLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <ApplicationTabs />
      {children}
    </div>
  );
}
