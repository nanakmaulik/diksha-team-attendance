import { notFound } from "next/navigation";
import { isTeamSlug, SEVA_TEAMS } from "@/lib/sevaExpansion";
import { SevaExpansionForm } from "@/lib/SevaExpansionForm";
export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; if (!isTeamSlug(slug)) notFound();
  return <SevaExpansionForm slug={slug} title={SEVA_TEAMS[slug].title}/>;
}
