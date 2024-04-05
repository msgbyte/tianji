import React from 'react';
import { Button } from './ui/button';
import { Link } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';

export const DefaultError: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="min-w-[320px] bg-zinc-900">
        <CardHeader>
          <div className="text-center">
            <img className="m-auto h-24 w-24" src="/icon.svg" />
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <div>{t('Sorry, but something went wrong')}</div>
        </CardContent>
        <CardFooter>
          <Link className="ml-auto" to="/">
            <Button>{t('Back to Homepage')}</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
});
DefaultError.displayName = 'DefaultError';
