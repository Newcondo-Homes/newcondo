import { ConfirmationSkeleton } from '@/components/payments/ConfirmationSkeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ConfirmationSkeleton />
    </div>
  );
}