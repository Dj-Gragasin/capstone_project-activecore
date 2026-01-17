// src/components/PrivateRoute.tsx
import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';

interface PrivateRouteProps extends RouteProps {
  role?: 'admin' | 'member';
  component: React.ComponentType<any>;
}

function readRole(): 'admin' | 'member' | undefined {
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('currentUser');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    const role = (parsed?.role ?? parsed?.user?.role ?? parsed?.data?.role) as unknown;
    const norm = String(role || '').trim().toLowerCase();
    if (norm === 'admin' || norm === 'member') return norm as 'admin' | 'member';
    return undefined;
  } catch {
    return undefined;
  }
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ role, component: Component, ...rest }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  const currentRole = readRole();

  return (
    <Route
      {...rest}
      render={props => {
        if (!isAuthenticated) {
          return <Redirect to="/home" />;
        }

        if (role && currentRole && currentRole !== role) {
          return <Redirect to={currentRole === 'admin' ? '/admin' : '/member'} />;
        }

        // If we have a token but can't determine role, send the user home to re-auth.
        if (role && !currentRole) {
          return <Redirect to="/home" />;
        }

        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;