import { notFound } from "next/navigation";
import { UserDetail } from "@/features/users/user-pages";
import { numericId } from "@/lib/routing";
export default async function Page({ params }) { const id = numericId((await params).id); if (!id) notFound(); return <UserDetail id={id} />; }
