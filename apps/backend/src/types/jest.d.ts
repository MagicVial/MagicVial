// Jest global type definitions
declare global {
  namespace jest {
    interface Matchers<R> {
      toContainElement(element: HTMLElement): R;
      toBeDisabled(): R;
      toBeEmpty(): R;
      toBeInTheDocument(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeVisible(): R;
      toContainHTML(htmlText: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveFocus(): R;
      toHaveFormValues(expectedValues: { [name: string]: any }): R;
      toHaveStyle(css: string): R;
      toHaveTextContent(text: string | RegExp, options?: { normalizeWhitespace: boolean }): R;
      toHaveValue(value?: string | string[] | number): R;
      toBeChecked(): R;
    }
  }
}

// Jest global functions
declare const describe: (name: string, fn: () => void) => void;
declare const beforeAll: (fn: () => void) => void;
declare const afterAll: (fn: () => void) => void;
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const test: typeof it;
declare const expect: any; 