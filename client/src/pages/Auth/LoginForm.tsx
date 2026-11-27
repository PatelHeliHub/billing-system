import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      handleAuthSuccess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/google', { idToken: credentialResponse.credential });
      handleAuthSuccess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (data: { user: any, token: string }) => {
    login(data.user, data.token);
    navigate('/');
  };

  return (
    <AuthLayout>
      <div className="auth-avatar">
        <div className="auth-avatar-inner">
          <User size={38} color="#90ebd8" strokeWidth={1.5} />
        </div>
      </div>
      
      <div className="auth-content">
        <h2>Sign In</h2>
        
        {error && <div style={{ color: '#ffb3b3', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form-body">
          <div className="input-group">
            <div className="input-icon">
              <User size={18} />
            </div>
            <input 
              type="email" 
              placeholder="Username" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <div className="input-icon">
              <Lock size={18} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="•••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>

          <div className="form-actions">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password" title="Forgot Password">Forgot password?</Link>
          </div>

          <div className="auth-divider">
            <div className="auth-divider-text">Or sign in with</div>
            <div className="google-auth">
              <GoogleLogin 
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Failed')}
                useOneTap
                theme="outline"
                shape="pill"
              />
            </div>
            
            <div className="auth-footer-link">
              Don't have an account? <Link to="/register">Register</Link>
            </div>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default LoginForm;
