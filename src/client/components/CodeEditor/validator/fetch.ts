export type ValidatorFn = (code: string) => ValidatorResult;

export interface ValidatorResult {
  isValid: boolean;
  errors: string[];
}

export function fetchValidator(code: string): ValidatorResult {
  const errors: string[] = [];

  // Check for fetch function declaration using multiple patterns
  const fetchPatterns = [
    /function\s+fetch\s*\(/, // function fetch(
    /const\s+fetch\s*=\s*function/, // const fetch = function
    /const\s+fetch\s*=\s*\(/, // const fetch = (
    /let\s+fetch\s*=\s*function/, // let fetch = function
    /let\s+fetch\s*=\s*\(/, // let fetch = (
    /var\s+fetch\s*=\s*function/, // var fetch = function
    /var\s+fetch\s*=\s*\(/, // var fetch = (
    /export\s+function\s+fetch\s*\(/, // export function fetch(
    /export\s+const\s+fetch\s*=/, // export const fetch =
  ];

  const hasFetchFunction = fetchPatterns.some((pattern) => pattern.test(code));

  if (!hasFetchFunction) {
    errors.push(
      'A fetch function must be declared. Example: function fetch() { ... }'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
