import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaTrash, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import { addToCart, removeFromCart } from '../slices/cartSlice';

const formatPeso = (amount) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const CartScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);

  const addToCartHandler = (product, qty) => dispatch(addToCart({ ...product, qty }));
  const removeFromCartHandler = (id) => dispatch(removeFromCart(id));
  const checkoutHandler = () => navigate('/login?redirect=/shipping');

  const totalQty = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);
  const shippingFee = Number((subtotal * 0.01 * totalQty).toFixed(2));
  const total = subtotal + shippingFee;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <Link to='/' style={{
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          fontWeight: '600',
          textDecoration: 'none',
        }}>
          <FaArrowLeft /> Continue Shopping
        </Link>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaShoppingCart style={{ color: 'var(--accent)', fontSize: '20px' }} />
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'var(--accent)' }}>
            Shopping Cart
          </h1>
          {cartItems.length > 0 && (
            <span style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--btn-text)',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '13px',
              fontWeight: '700',
            }}>
              {totalQty}
            </span>
          )}
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Your cart is empty</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Looks like you haven't added anything yet.
          </p>
          <Link to='/' style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--btn-text)',
            padding: '10px 24px',
            borderRadius: '8px',
            fontWeight: '700',
            textDecoration: 'none',
            fontSize: '14px',
          }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>

          {/* CART ITEMS */}
          <div style={{ flex: '1 1 600px' }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}>
              {/* TABLE HEADER */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                padding: '14px 20px',
                backgroundColor: 'var(--bg-soft)',
                borderBottom: '2px solid var(--accent)',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--accent)',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                <span>Product</span>
                <span style={{ textAlign: 'center' }}>Price</span>
                <span style={{ textAlign: 'center' }}>Qty</span>
                <span style={{ textAlign: 'center' }}>Total</span>
                <span></span>
              </div>

              {/* ITEMS */}
              {cartItems.map((item, index) => (
                <div
                  key={item._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    padding: '16px 20px',
                    alignItems: 'center',
                    borderBottom: index < cartItems.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-soft)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* PRODUCT */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: 'var(--bg-soft)',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                      />
                    </div>
                    <div>
                      <Link to={`/product/${item._id}`} style={{
                        color: 'var(--text-main)',
                        fontWeight: '600',
                        fontSize: '14px',
                        textDecoration: 'none',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {item.name}
                      </Link>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Stock: {item.countInStock} available
                      </p>
                    </div>
                  </div>

                  {/* PRICE */}
                  <div style={{ textAlign: 'center', color: 'var(--text-main)', fontWeight: '600', fontSize: '14px' }}>
                    {formatPeso(item.price)}
                  </div>

                  {/* QTY */}
                  <div style={{ textAlign: 'center' }}>
                    <select
                      value={item.qty}
                      onChange={(e) => addToCartHandler(item, Number(e.target.value))}
                      style={{
                        backgroundColor: 'var(--bg-soft)',
                        border: '1px solid var(--accent-dark)',
                        color: 'var(--text-main)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        width: '60px',
                      }}
                    >
                      {[...Array(item.countInStock).keys()].map((x) => (
                        <option key={x + 1} value={x + 1}>{x + 1}</option>
                      ))}
                    </select>
                  </div>

                  {/* TOTAL */}
                  <div style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: '700', fontSize: '15px' }}>
                    {formatPeso(item.qty * item.price)}
                  </div>

                  {/* REMOVE */}
                  <button
                    onClick={() => removeFromCartHandler(item._id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #e74c3c',
                      color: '#e74c3c',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e74c3c';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#e74c3c';
                    }}
                  >
                    <FaTrash size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ORDER SUMMARY */}
          <div style={{ flex: '0 0 300px' }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              position: 'sticky',
              top: '20px',
            }}>
              {/* HEADER */}
              <div style={{
                padding: '16px 20px',
                backgroundColor: 'var(--bg-soft)',
                borderBottom: '2px solid var(--accent)',
              }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1px' }}>
                  ORDER SUMMARY
                </h3>
              </div>

              <div style={{ padding: '20px' }}>
                {/* ROWS */}
                {[
                  { label: `Items (${totalQty} pcs)`, value: formatPeso(subtotal) },
                  { label: `Shipping Fee (1% × ${totalQty})`, value: formatPeso(shippingFee), accent: true },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '14px',
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ color: row.accent ? 'var(--accent)' : 'var(--text-main)', fontWeight: '600' }}>
                      {row.value}
                    </span>
                  </div>
                ))}

                {/* TOTAL */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0 8px',
                }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '15px' }}>Total</span>
                  <span style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '20px' }}>
                    {formatPeso(total)}
                  </span>
                </div>

                {/* CHECKOUT BTN */}
                <button
                  onClick={checkoutHandler}
                  disabled={cartItems.length === 0}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--accent)',
                    color: 'var(--btn-text)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '13px',
                    fontWeight: '800',
                    fontSize: '15px',
                    cursor: 'pointer',
                    marginTop: '8px',
                    transition: 'opacity 0.2s',
                    letterSpacing: '0.5px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Proceed to Checkout →
                </button>

                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>
                  🔒 Secure Checkout via PayPal
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default CartScreen;