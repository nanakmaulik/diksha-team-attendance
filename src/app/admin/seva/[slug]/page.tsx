import { notFound } from "next/navigation";
import { isTeamSlug, SEVA_TEAMS } from "@/lib/sevaExpansion";
import { SevaExpansionAdmin } from "@/lib/SevaExpansionAdmin";
export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; if (!isTeamSlug(slug)) notFound();
  return <SevaExpansionAdmin slug={slug} title={SEVA_TEAMS[slug].title}/>;
}
