import React from 'react';
import './Auth.css';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-container">
      <div className="auth-bg-shape shape-1"></div>
      <div className="auth-bg-shape shape-2"></div>
      
      <div className="auth-card-wrapper">
        <div className="auth-card-bg"></div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
