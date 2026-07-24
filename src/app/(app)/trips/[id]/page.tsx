import { TripDetail } from "@/components/TripDetail";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TripDetail tripId={id} />;
}
