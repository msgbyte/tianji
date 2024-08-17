import { TRPCClientError } from '@trpc/client';
import { toast } from 'sonner';

/**
 * Show common error toast with auto process error object
 */
export function showErrorToast(err: any) {
  console.error(err);

  if (err instanceof TRPCClientError) {
    try {
      const json = JSON.parse(err.message);
      toast.error(json[0].message);
    } catch {
      toast.error(err.message);
    }

    return;
  }

  if (err instanceof Error) {
    toast.error(err.message);
    return;
  }

  toast.error(String(err));
}
