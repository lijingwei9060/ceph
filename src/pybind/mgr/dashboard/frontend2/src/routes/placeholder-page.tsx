import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage: FC<PlaceholderPageProps> = ({ title }) => {
  const { t } = useTranslation();
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-muted-foreground">{t('common.noData')}</p>
      </div>
    </div>
  );
};
