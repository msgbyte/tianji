import { message } from 'antd';
import axios from 'axios';
import { get } from 'lodash-es';
import { getJWT } from './authjs';

class RequestError extends Error {}

function createRequest() {
  const ins = axios.create();

  ins.interceptors.request.use(async (val) => {
    if (!val.headers.Authorization) {
      val.headers.Authorization = `Bearer ${getJWT()}`;
    }

    return val;
  });

  ins.interceptors.response.use(
    (val) => {
      return val;
    },
    (err) => {
      console.log(err);
      const responseData = get(err, 'response.data') ?? {};
      let errorMsg: string = responseData.message;
      const code: number = responseData.code;

      const statusCode = get(err, 'response.header.code');
      if (
        statusCode === 401 // Unauthorized (jwt expired)
      ) {
        backToLoginPage();

        return { data: { result: false, msg: errorMsg, code } };
      }

      throw new RequestError(errorMsg ?? err.message);
    }
  );

  return ins;
}

const backToLoginPage = (() => {
  let timer: number;

  return () => {
    if (timer) {
      // Skip if existed
      return;
    }

    if (
      window.location.pathname.startsWith('/login') ||
      window.location.pathname.startsWith('/register')
    ) {
      // Skip login page
      return;
    }

    message.warning(
      'The account authorization has expired. It will automatically jump to the login page in 2 seconds.'
    );

    timer = window.setTimeout(() => {
      window.clearTimeout(timer);
      window.location.href = '/login';
    }, 2000);
  };
})();

export const request = createRequest();
