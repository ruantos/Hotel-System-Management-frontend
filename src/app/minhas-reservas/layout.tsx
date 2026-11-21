import type { ReactNode } from "react";
import { Workspace } from "@/components/layout/workspace";
export default function Layout({ children }: { children: ReactNode }) { return <Workspace area="reservations">{children}</Workspace>; }
