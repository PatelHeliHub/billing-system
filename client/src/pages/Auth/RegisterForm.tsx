import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { name, email, password });
      handleAuthSuccess(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register');
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

  const { login } = useAuth();

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
        <h2>Sign Up</h2>
        
        {error && <div style={{ color: '#ffb3b3', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form-body">
          <div className="input-group">
            <div className="input-icon">
              <User size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <Mail size={18} />
            </div>
            <input 
              type="email" 
              placeholder="Email address" 
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
              minLength={6}
            />
            <div className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'CREATING...' : 'REGISTER'}
          </button>

          <div className="auth-divider">
            <div className="auth-divider-text">Or register with</div>
            <div className="google-auth">
              <GoogleLogin 
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Registration Failed')}
                useOneTap
                theme="outline"
                shape="pill"
              />
            </div>
            
            <div className="auth-footer-link">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default RegisterForm;
