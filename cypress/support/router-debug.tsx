/**
 * Debug component to test router context
 */
import React from 'react';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function RouterDebugComponent() {
  const context = React.useContext(AppRouterContext);
  
  console.log('AppRouterContext value:', context);
  
  return (
    <div data-testid="router-debug">
      Router context: {context ? 'Available' : 'NULL'}
    </div>
  );
}