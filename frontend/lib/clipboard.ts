import { useToast } from '#providers/ToastProvider';

export function useCopyToClipboard(): (
  text: string,
  label: string,
) => Promise<void> {
  const [, actions] = useToast();

  return async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);

      actions.success(`${label} copied to clipboard`);
    } catch (err) {
      actions.error(`Failed to copy ${label} to clipboard`);
      console.error('Clipboard copy error:', err);
    }
  };
}
