export interface PageError {
  status: number;
  message: string;
  error?: Error;
}

const PAGE_ERROR_GLOBAL = '__MM_PAGE_ERROR__';

export const pageErrorScript = `<script>window.${PAGE_ERROR_GLOBAL}=true</script>`;

export function isPageError(): boolean {
  return PAGE_ERROR_GLOBAL in globalThis;
}
