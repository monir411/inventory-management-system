import { CollectionDetailsPage } from '@/components/collections/collection-details-page';

type CollectionDetailsRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CollectionDetailsRoutePage({
  params,
}: CollectionDetailsRoutePageProps) {
  const { id } = await params;

  return <CollectionDetailsPage collectionId={id} />;
}
