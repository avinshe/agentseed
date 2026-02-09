import { createSpinner } from "nanospinner";

export function withSpinner<T>(text: string, fn: () => Promise<T>): Promise<T> {
  const spinner = createSpinner(text).start();
  return fn().then(
    (result) => {
      spinner.success();
      return result;
    },
    (err) => {
      spinner.error();
      throw err;
    }
  );
}
