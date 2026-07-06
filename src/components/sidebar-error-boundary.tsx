import * as React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

/**
 * Catches the transient "useSidebar must be used within a SidebarProvider"
 * error that occasionally surfaces during development (HMR / React StrictMode
 * remounts) or when a portaled sidebar consumer briefly renders outside the
 * provider. Recovers on the next render instead of unmounting the route.
 */
export class SidebarErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    if (
      error?.message?.includes(
        'useSidebar must be used within a SidebarProvider'
      )
    ) {
      return { hasError: true };
    }
    // Re-throw any unrelated error so route-level errorElement still handles it.
    throw error;
  }

  componentDidCatch() {
    // Retry on the next frame once the provider has re-mounted.
    requestAnimationFrame(() => this.setState({ hasError: false }));
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
