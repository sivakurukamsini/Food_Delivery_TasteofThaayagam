import { useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../Context/StoreContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const LoginPopup = ({ setShowLogin, isAdminAdd }) => {
  const { setToken, url, loadCartData } = useContext(StoreContext);
  const [currState, setCurrState] = useState(isAdminAdd ? 'Add User' : 'Login');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [data, setData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    // Protect reserved admin credentials from being registered accidentally.
    const RESERVED_ADMIN_EMAIL = 'admin@gmail.com';
    const RESERVED_ADMIN_PASSWORD = 'Admin@123';

    // If user is trying to register/create an account using the reserved admin email,
    // block the registration and inform them. This prevents saving the admin creds
    // into the users table from the public signup flow.
    if (!isAdminAdd && currState !== 'Login' && data.email && data.email.toLowerCase() === RESERVED_ADMIN_EMAIL.toLowerCase()) {
      toast.error('This email address is reserved and cannot be used to create an account');
      return;
    }

    // If the reserved admin credentials are entered, force a login call rather than register.
    let new_url = url;
    if (data.email && data.password && data.email.toLowerCase() === RESERVED_ADMIN_EMAIL.toLowerCase() && data.password === RESERVED_ADMIN_PASSWORD) {
      // Ensure we call the login endpoint
      new_url += '/api/users/login';
    } else if (isAdminAdd) {
      new_url += '/api/users';
    } else if (currState === 'Login') {
      new_url += '/api/users/login';
    } else {
      new_url += '/api/users/register';
    }

    try {
      const response = await axios.post(new_url, data);
      if (response.data.success) {
        if (!isAdminAdd) {
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
          if (response.data.user) localStorage.setItem('user', JSON.stringify(response.data.user));
          loadCartData({ token: response.data.token });
          if (response.data.user && response.data.user.isAdmin) {
            try {
              const adminUrl = `http://localhost:5174/?adminToken=${encodeURIComponent(response.data.token)}&adminUser=${encodeURIComponent(JSON.stringify(response.data.user))}`;
              window.location.assign(adminUrl);
              return;
            } catch (e) {
              console.warn('Admin redirect failed', e);
            }
          }
          setShowLogin(false);
        } else {
          toast.success('User added successfully');
          setData({ firstName: '', lastName: '', email: '', password: '', phone: '' });
        }
      } else {
        toast.error(response.data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error('Auth error:', err.response?.data || err.message);
      toast.error('Error connecting to server');
    }
  };

  // Inline reset: no email code will be sent. User fills email + new passwords and submits.

  const onForgotEmailBlur = () => { /* no-op */ };

  const submitReset = async () => {
    if (!forgotEmail) return toast.error('Please enter your email');
    if (!forgotNewPassword || forgotNewPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (forgotNewPassword !== forgotConfirmPassword) return toast.error('Passwords do not match');
    try {
      setIsResetting(true);
      const res = await axios.post(`${url}/api/users/reset-password-no-code`, { email: forgotEmail, password: forgotNewPassword });
      if (res.data?.success) {
        toast.success('Password reset successful — logging you in');
        // if we received token+user, auto-login
        if (res.data.token) {
          try {
            setToken(res.data.token);
            localStorage.setItem('token', res.data.token);
            if (res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user));
            loadCartData({ token: res.data.token });
          } catch (e) { /* ignore */ }
        }
  setForgotMode(false);
  setForgotEmail(''); setForgotNewPassword(''); setForgotConfirmPassword('');
      } else {
        toast.error(res.data?.message || 'Could not reset password');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setIsResetting(false);
    }
  };

  const close = useCallback(() => {
    try { if (typeof setShowLogin === 'function') setShowLogin(false); } catch (e) { /* ignore */ }
  }, [setShowLogin]);

  return (
    <div className='login-popup'>
      <form onSubmit={onSubmit} className='login-popup-container'>
        <div className='login-popup-title'>
          <h2>{currState}</h2>
          <img className='login-close-img' onClick={close} src={assets.cross_icon} alt='close' style={{ width: 16 }} role='button' tabIndex={0} />
        </div>
        <div className='login-popup-inputs'>
          {(currState === 'Sign Up' || currState === 'Add User') && (
            <>
              <input name='firstName' onChange={onChangeHandler} value={data.firstName} type='text' placeholder='First name' required />
              <input name='lastName' onChange={onChangeHandler} value={data.lastName} type='text' placeholder='Last name' />
            </>
          )}
          {(currState === 'Sign Up' || currState === 'Add User') && (
            <input name='phone' onChange={onChangeHandler} value={data.phone} type='text' placeholder='Phone number' />
          )}
          <input name='email' onChange={onChangeHandler} value={data.email} type='email' placeholder='Your email' required />
          <input name='password' onChange={onChangeHandler} value={data.password} type='password' placeholder='Password' required />
        </div>

        {!forgotMode && (
          <button>
            {currState === 'Login' ? 'Login' : currState === 'Add User' ? 'Add User' : 'Create Account'}
          </button>
        )}

        {currState === 'Login' && !forgotMode && (
          <p>
            <a href='#forgot' onClick={(e) => { e.preventDefault(); setForgotMode(true); }}>Forgot password?</a>
          </p>
        )}

        {forgotMode && (
          <div className='forgot-inline'>
            <div>
              <input className='forgot-input' type='email' placeholder='Enter your email' required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} onBlur={onForgotEmailBlur} />
              <input className='forgot-input' type='password' placeholder='New password (min 6 chars)' required value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} />
              <input className='forgot-input' type='password' placeholder='Confirm new password' required value={forgotConfirmPassword} onChange={(e) => setForgotConfirmPassword(e.target.value)} />
              <div className='forgot-actions'>
                <button type='button' onClick={submitReset} disabled={isResetting}>{isResetting ? 'Setting...' : 'Reset password'}</button>
                <button type='button' onClick={() => { setForgotMode(false); setForgotEmail(''); setForgotNewPassword(''); setForgotConfirmPassword(''); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {!isAdminAdd && !forgotMode && (
          <div className='login-popup-condition'>
            <input type='checkbox' required={currState !== 'Login'} />
            <p>By continuing, I agree to the terms of use & privacy policy.</p>
          </div>
        )}

        {!isAdminAdd && !forgotMode && (
          currState === 'Login'
            ? <p>Create a new account? <span onClick={() => setCurrState('Sign Up')}>Click here</span></p>
            : <p>Already have an account? <span onClick={() => setCurrState('Login')}>Login here</span></p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;

LoginPopup.propTypes = {
  setShowLogin: PropTypes.func,
  isAdminAdd: PropTypes.bool,
};

