import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../components/Loader';
import FormContainer from '../components/FormContainer';
import { useLoginMutation, useGoogleLoginMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lockError, setLockError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();

  const { userInfo } = useSelector((state) => state.auth);

  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const redirect = sp.get('redirect') || '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, redirect, userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLockError('');
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ ...res }));
      navigate(redirect);
    } catch (err) {
      const message = err?.data?.message || err.error || 'Login failed';
      // Check if it's a lockout error (status 423)
      if (err?.status === 423 || message.toLowerCase().includes('locked')) {
        setLockError(message);
      } else {
        toast.error(message);
      }
    }
  };

  const googleSuccessHandler = async (credentialResponse) => {
    try {
      const res = await googleLogin({
        credential: credentialResponse.credential,
      }).unwrap();
      dispatch(setCredentials({ ...res }));
      navigate(redirect);
      toast.success(`Welcome, ${res.name}!`);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <FormContainer>
      <h1>Sign In</h1>

      {/* LOCKOUT WARNING */}
      {lockError && (
        <Alert variant='danger' style={{ borderRadius: '8px', fontSize: '14px' }}>
          🔒 {lockError}
        </Alert>
      )}

      <Form onSubmit={submitHandler}>
        <Form.Group className='my-2' controlId='email'>
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type='email'
            placeholder='Enter email'
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setLockError('');
            }}
          />
        </Form.Group>

        <Form.Group className='my-2' controlId='password'>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type='password'
            placeholder='Enter password'
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setLockError('');
            }}
          />
        </Form.Group>

        {/* FORGOT PASSWORD LINK */}
        <div style={{ textAlign: 'right', marginBottom: '8px' }}>
          <Link
            to='/forgot-password'
            style={{ fontSize: '13px', color: '#888', textDecoration: 'none' }}
          >
            Forgot Password?
          </Link>
        </div>

        <Button disabled={isLoading} type='submit' variant='primary'>
          Sign In
        </Button>

        {isLoading && <Loader />}
      </Form>

      {/* DIVIDER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '20px 0',
        gap: '10px',
      }}>
        <hr style={{ flex: 1 }} />
        <span style={{ color: '#888', fontSize: '14px' }}>or</span>
        <hr style={{ flex: 1 }} />
      </div>

      {/* GOOGLE LOGIN BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin
          onSuccess={googleSuccessHandler}
          onError={() => toast.error('Google login failed')}
          useOneTap
          theme='outline'
          size='large'
          text='signin_with'
          shape='rectangular'
        />
      </div>

      {isGoogleLoading && <Loader />}

      <Row className='py-3'>
        <Col>
          New Customer?{' '}
          <Link to={redirect ? `/register?redirect=${redirect}` : '/register'}>
            Register
          </Link>
        </Col>
      </Row>
    </FormContainer>
  );
};

export default LoginScreen;