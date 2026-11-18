import type { Metadata } from "next";
import { StatementCollection } from "@/components/storefront/StatementCollection";

export const metadata: Metadata = {
  title: "Statement Trees — Noble Star Forest",
};

export default function StatementTreesPage() {
  return <StatementCollection />;
}
