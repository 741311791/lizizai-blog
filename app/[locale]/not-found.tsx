import { useTranslations } from 'next-intl';
import NotFoundV2 from '@/components/ui-v2/NotFoundV2';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <NotFoundV2
      title={t('title')}
      description={t('description')}
      backHome={t('backHome')}
      browseArchive={t('browseArchive')}
    />
  );
}
