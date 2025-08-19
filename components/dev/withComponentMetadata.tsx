"use client";

import React from 'react';
import { ComponentOverlay } from './ComponentOverlay';
import { ComponentMetadata } from '@/types/component-registry';

/**
 * Higher-Order Component for automatic component registration and identification
 */
export const withComponentMetadata = <P extends object>(
  Component: React.ComponentType<P>,
  metadata: ComponentMetadata
) => {
  const WrappedComponent = (props: P) => {
    const isDev = process.env.NODE_ENV === 'development';
    
    return (
      <ComponentOverlay componentId={metadata.id} metadata={metadata}>
        <div 
          data-component-id={metadata.id}
          data-component-category={metadata.category}
          data-testid={metadata.id}
          className={isDev ? 'dev-component-boundary' : ''}
        >
          <Component {...props} />
        </div>
      </ComponentOverlay>
    );
  };
  
  WrappedComponent.displayName = `WithMetadata(${metadata.name})`;
  return WrappedComponent;
};

/**
 * Simple component wrapper for components that don't need HOC pattern
 */
export const ComponentWrapper = ({ 
  componentId, 
  metadata, 
  children,
  className = ''
}: {
  componentId: string;
  metadata: ComponentMetadata;
  children: React.ReactNode;
  className?: string;
}) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  return (
    <ComponentOverlay componentId={componentId} metadata={metadata}>
      <div 
        data-component-id={componentId}
        data-component-category={metadata.category}
        data-testid={componentId}
        className={`${className} ${isDev ? 'dev-component-boundary' : ''}`.trim()}
      >
        {children}
      </div>
    </ComponentOverlay>
  );
};