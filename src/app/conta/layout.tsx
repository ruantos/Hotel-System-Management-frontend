import type { ReactNode } from "react";
import { Workspace } from "@/components/layout/workspace";
export default function AccountLayout({ children }: { children: ReactNode }) { return <Workspace area="account">{children}</Workspace>; }
