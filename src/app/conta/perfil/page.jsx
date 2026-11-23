import { AccountPage } from "@/features/auth/account-page";
import { RequireAuth } from "@/features/auth/require-auth";
export default function Page() { return <RequireAuth role="CLIENT"><AccountPage profileOnly /></RequireAuth>; }
