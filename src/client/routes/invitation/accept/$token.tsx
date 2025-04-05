import { useEffect, useState } from 'react';
import { Result } from 'antd';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/Loading';
import { trpc } from '@/api/trpc';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { setUserInfo } from '@/store/user';

export const Route = createFileRoute('/invitation/accept/$token')({
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { token } = Route.useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading: isLoadingSession } =
    trpc.user.info.useQuery();
  const [acceptStatus, setAcceptStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const trpcUtils = trpc.useUtils();

  const {
    data: invitationInfo,
    isLoading: isLoadingInfo,
    error: queryError,
  } = trpc.workspace.getInvitationInfo.useQuery(
    { token },
    {
      enabled: !!token,
      retry: false,
    }
  );

  const acceptMutation = trpc.workspace.acceptInvitation.useMutation({
    onSuccess: () => {
      trpcUtils.user.info.fetch().then((userInfo) => {
        if (userInfo) {
          setUserInfo(userInfo);
        }
      });
      setAcceptStatus('success');
      setTimeout(() => {
        navigate({
          to: '/',
        });
      }, 3000);
    },
    onError: (error) => {
      setAcceptStatus('error');
    },
  });

  const errorMessage = acceptMutation.error?.message || queryError?.message;

  useEffect(() => {
    if (
      token &&
      session &&
      invitationInfo &&
      !isLoadingSession &&
      acceptStatus === 'idle' &&
      session.email === invitationInfo?.email
    ) {
      setAcceptStatus('loading');
      acceptMutation.mutate({ token });
    }
  }, [token, session, invitationInfo, isLoadingSession, acceptStatus]);

  if (isLoadingInfo || isLoadingSession || acceptStatus === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Loading />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Result
        status="error"
        title="Failed to process invitation"
        subTitle={errorMessage}
        extra={
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        }
      />
    );
  }

  if (!session) {
    return (
      <Result
        status="info"
        title="Please Login First"
        subTitle={`You are invited to join workspace "${invitationInfo?.workspace}". Please login or register to accept the invitation.`}
        extra={
          <Link
            to="/login"
            search={{
              redirect: `/invitation/accept/${token}`,
            }}
          >
            <Button>Login/Register</Button>
          </Link>
        }
      />
    );
  }

  if (acceptStatus === 'success') {
    return (
      <Result
        status="success"
        title="Invitation Accepted"
        subTitle={`You have successfully joined workspace "${invitationInfo?.workspace}". Redirecting...`}
        extra={
          <Link to="/">
            <Button>Access Now</Button>
          </Link>
        }
      />
    );
  }

  return null;
}
