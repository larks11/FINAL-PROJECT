import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
  const stepStyle = (active) => ({
    padding: '6px 18px',
    borderRadius: '20px',
    fontWeight: active ? '700' : '400',
    backgroundColor: active ? 'var(--accent)' : 'transparent',
    color: active ? 'var(--btn-text)' : 'var(--text-muted)',
    border: active ? '2px solid var(--accent)' : '2px solid var(--border)',
    transition: 'all 0.2s',
    textDecoration: 'none',
    fontSize: '14px',
  });

  return (
    <Nav className='justify-content-center mb-4' style={{ gap: '8px', flexWrap: 'wrap' }}>

      {/* SHIPPING */}
      <Nav.Item>
        {step2 ? (
          <Nav.Link as={Link} to='/shipping' style={stepStyle(step2 && !step3)}>
            📦 Shipping
          </Nav.Link>
        ) : (
          <Nav.Link disabled style={stepStyle(false)}>📦 Shipping</Nav.Link>
        )}
      </Nav.Item>

      {/* PAYMENT */}
      <Nav.Item>
        {step3 ? (
          <Nav.Link as={Link} to='/payment' style={stepStyle(step3 && !step4)}>
            💳 Payment
          </Nav.Link>
        ) : (
          <Nav.Link disabled style={stepStyle(false)}>💳 Payment</Nav.Link>
        )}
      </Nav.Item>

      {/* PLACE ORDER */}
      <Nav.Item>
        {step4 ? (
          <Nav.Link as={Link} to='/placeorder' style={stepStyle(step4)}>
            🛒 Place Order
          </Nav.Link>
        ) : (
          <Nav.Link disabled style={stepStyle(false)}>🛒 Place Order</Nav.Link>
        )}
      </Nav.Item>

    </Nav>
  );
};

export default CheckoutSteps;