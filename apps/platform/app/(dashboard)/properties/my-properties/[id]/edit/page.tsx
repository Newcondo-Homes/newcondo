import { use } from 'react';
import EditPropertyContent from './_components/EditPropertyContent';
 
type Props = {
  params: Promise<{ id: string }>;
};
 
export default function EditPropertyPage({ params }: Props) {
  const { id } = use(params);
  return (
    <div className="container mx-auto p-6">
      <EditPropertyContent propertyId={id} />
    </div>
  );
}