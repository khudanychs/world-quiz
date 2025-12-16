import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'login' ? 'login' : 'register';
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Update mode when URL parameter changes
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'login') {
      setMode('login');
    } else if (urlMode === 'register') {
      setMode('register');
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        setError('Password must contain uppercase, lowercase, and number');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        await register(username, email, password);
        setSuccess('✅ Registration successful! Please check your email and click the verification link. Then you can log in.');
        // Clear form after successful registration
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setEmail('');
      } else {
        await login(email, password);
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{mode === 'register' ? 'Join World Quiz' : 'Welcome Back'}</h2>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                placeholder="johndoe"
                pattern="[a-zA-Z0-9_\-]+"
                title="Only letters, numbers, underscores, and hyphens"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 8 : undefined}
              placeholder="••••••••"
            />
            {mode === 'register' && (
              <small>Min 8 chars, uppercase, lowercase, number</small>
            )}
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading 
              ? (mode === 'register' ? 'Creating account...' : 'Logging in...') 
              : (mode === 'register' ? 'Sign Up' : 'Login')
            }
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button onClick={handleGoogleLogin} className="btn-google">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        {mode === 'register' && (
          <p className="privacy-consent">
            By continuing, you agree to our{' '}
            <Link to="/terms">Terms of Service</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </p>
        )}

        <p className="auth-footer">
          {mode === 'register' ? (
            <>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setMode('login');
                  setSearchParams({ mode: 'login' });
                  setError('');
                  setSuccess('');
                }}
                className="auth-link"
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => {
                  setMode('register');
                  setSearchParams({ mode: 'register' });
                  setError('');
                  setSuccess('');
                }}
                className="auth-link"
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
