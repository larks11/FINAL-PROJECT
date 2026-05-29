import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import FormContainer from '../components/FormContainer';
import Loader from '../components/Loader';
import { useForgotPasswordMutation } from '../slices/usersApiSlice';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const submitHandler = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await forgotPassword({ email, name }).unwrap();
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err?.data?.message || err.error || 'Something went wrong');
    }
  };

  return (
    <FormContainer>
      <h1>Forgot Password</h1>

      {submitted ? (
        <Alert variant='success' style={{ borderRadius: '8px' }}>
          ✅ Your password reset request has been submitted. <br />
          The admin will review and reset your password. You will be notified once approved.
          <br /><br />
          <Link to='/login'>← Back to Login</Link>
        </Alert>
      ) : (
        <>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
            Enter your registered <strong>username</strong> and <strong>email address</strong> to request a password reset.
          </p>

          {errorMsg && (
            <Alert variant='danger' style={{ borderRadius: '8px', fontSize: '14px' }}>
              ⚠️ {errorMsg}
            </Alert>
          )}

          <Form onSubmit={submitHandler}>
            <Form.Group className='my-2' controlId='name'>
              <Form.Label>Username / Full Name</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter your registered name'
                value={name}
                onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                required
              />
            </Form.Group>

            <Form.Group className='my-2' controlId='email'>
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type='email'
                placeholder='Enter your registered email'
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                required
              />
            </Form.Group>

            <Button disabled={isLoading} type='submit' variant='primary' className='mt-2'>
              Submit Request
            </Button>
            {isLoading && <Loader />}
          </Form>

          <div style={{ marginTop: '16px' }}>
            <Link to='/login' style={{ fontSize: '13px', color: '#888' }}>
              ← Back to Login
            </Link>
          </div>
        </>
      )}
    </FormContainer>
  );
};

export default ForgotPasswordScreen;