import { queryCalculatorUrl } from '#flib/trpcCalls';

export function preloadMundialCalculator() {
  queryCalculatorUrl();
}
