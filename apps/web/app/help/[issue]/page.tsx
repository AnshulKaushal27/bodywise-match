import { Metadata } from "next";
import { notFound } from "next/navigation";
import { HELP_ISSUES } from "@bodywise/shared";
import { HelpIssueClient } from "./HelpIssueClient";

interface HelpIssuePageProps {
  params: {
    issue: string;
  };
}

export function generateStaticParams() {
  return HELP_ISSUES.map((issue) => ({
    issue: issue.slug,
  }));
}

export function generateMetadata({ params }: HelpIssuePageProps): Metadata {
  const issueConfig = HELP_ISSUES.find((i) => i.slug === params.issue);
  if (!issueConfig) {
    return {
      title: "Help Issue Not Found | Bodywise Match",
      description: "The requested help issue was not found.",
    };
  }

  return {
    title: `${issueConfig.title} Resolution Guide | Bodywise Match Help`,
    description: issueConfig.shortDescription,
  };
}

export default function HelpIssuePage({ params }: HelpIssuePageProps) {
  const issueConfig = HELP_ISSUES.find((i) => i.slug === params.issue);

  if (!issueConfig) {
    notFound();
  }

  return <HelpIssueClient issueSlug={params.issue} />;
}
