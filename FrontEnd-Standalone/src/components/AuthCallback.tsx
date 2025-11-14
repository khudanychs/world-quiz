import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      const needsNickname = searchParams.get('needsNickname') === 'true';
      const error = searchParams.get('error');

      if (error) {
        navigate('/login?error=' + encodeURIComponent(error), { replace: true });
        return;
      }

      if (token) {
        try {
          apiService.setToken(token);
          await refreshUser();
          
          // Navigate based on whether user needs to set nickname
          if (needsNickname) {
            navigate('/set-nickname', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } catch (err) {
          console.error('OAuth callback error:', err);
          apiService.clearToken();
          navigate('/login?error=Authentication failed', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#0b1020',
      color: '#fff',
      fontSize: '1.2rem'
    }}>
      Completing authentication...
    </div>
  );
};
