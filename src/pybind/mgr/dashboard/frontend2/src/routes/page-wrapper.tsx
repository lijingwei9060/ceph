import { Breadcrumbs } from '@/components/breadcrumb';
import { PlaceholderPage } from './placeholder-page';

interface PageWrapperProps {
  title: string;
  children?: React.ReactNode;
}

export function PageWrapper({ title, children }: PageWrapperProps) {
  return (
    <>
      <div className="mb-4">
        <Breadcrumbs />
      </div>
      {children ?? <PlaceholderPage title={title} />}
    </>
  );
}
