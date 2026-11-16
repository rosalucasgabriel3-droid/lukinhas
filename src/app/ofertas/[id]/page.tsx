import { MinerApp } from "@/components/miner-app";
export default async function OfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MinerApp initialId={id} />;
}
