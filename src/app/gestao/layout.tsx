import type { ReactNode } from "react";
import { Workspace } from "@/components/layout/workspace";
export default function ManagementLayout({ children }: { children: ReactNode }) { return <Workspace area="management">{children}</Workspace>; }
