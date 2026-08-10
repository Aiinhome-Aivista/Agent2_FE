import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { routesConfig } from './routes.config';
import { PrivateRoute } from './PrivateRoute';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';

const NotFound = lazy(() => import('@/pages/NotFound'));

export function AppRouter() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSpinner label="Loading…" />}>
        <Routes>
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          
          {/* Public Routes */}
          {routesConfig.filter(r => r.isPublic).map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}

          {/* Private Routes */}
          <Route element={<AppLayout />}>
            {routesConfig.filter(r => !r.isPublic).map(({ path, Component, roles }) => (
              <Route
                key={path}
                path={path}
                element={
                  <PrivateRoute roles={roles}>
                    <Component />
                  </PrivateRoute>
                }
              />
            ))}
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
