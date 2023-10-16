import React, { useEffect, useState } from 'react';
import { getJWT, setJWT } from '../api/auth';
import { Loading } from './Loading';
import { trpc } from '../api/trpc';
import { setUserInfo } from '../store/user';

export const TokenLoginContainer: React.FC<React.PropsWithChildren> =
  React.memo((props) => {
    const [loading, setLoading] = useState(true);
    const mutation = trpc.user.loginWithToken.useMutation();

    useEffect(() => {
      const token = getJWT();
      if (token) {
        mutation
          .mutateAsync({
            token,
          })
          .then((res) => {
            setJWT(res.token);
            setUserInfo(res.info);
          })
          .catch((err) => {})
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }, []);

    if (loading) {
      return <Loading />;
    }

    return <>{props.children}</>;
  });
TokenLoginContainer.displayName = 'TokenLoginContainer';
