import { notFound } from "next/navigation";
import { RequestWizard } from "@/components/request-wizard";
import { getPerformerByUsername } from "@/lib/performers";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function PerformerRequestPage({ params }: PageProps) {
  const { username } = await params;
  const performer = await getPerformerByUsername(username);

  if (!performer) {
    notFound();
  }

  return <RequestWizard performer={performer} />;
}
