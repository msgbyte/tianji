import React, { useEffect, useState } from 'react';
import { getJWT } from '../api/auth';
import { loginWithToken } from '../api/model/user';
import { Loading } from './Loading';

export const TokenLoginContainer: React.FC<React.PropsWithChildren> =
  React.memo((props) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const token = getJWT();
      if (token) {
        loginWithToken().then(() => {
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
