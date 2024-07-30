import React, { useEffect, useState } from 'react';
import { Loading } from './Loading';
import { trpc } from '../api/trpc';
import { setUserInfo } from '../store/user';

export const TokenLoginContainer: React.FC<React.PropsWithChildren> =
  React.memo((props) => {
    const [loading, setLoading] = useState(true);
    const trpcUtils = trpc.useUtils();

    useEffect(() => {
      trpcUtils.user.info
        .fetch()
        .then((userInfo) => {
          if (userInfo) {
            setUserInfo(userInfo);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }, []);

    if (loading) {
      return <Loading />;
    }

    return <>{props.children}</>;
  });
TokenLoginContainer.displayName = 'TokenLoginContainer';
