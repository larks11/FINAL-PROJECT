import { useState } from 'react';
import { Link } from 'react-router-dom';
import Rating from './Rating';

const Product = ({ product }) => {
  const [hoveredColor, setHoveredColor] = useState(null);
  const displayImage = hoveredColor?.image || product.image;

  // NEW badge logic — 2 days = 48 hours
  const isNew = product.createdAt &&
    (new Date() - new Date(product.createdAt)) < 48 * 60 * 60 * 1000;

  return (
    <div
      className='product-card'
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        height: '100%',
        position: 'relative',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-10px)';
        e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)';
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* BADGES */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px',
        zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        {/* NEW BADGE */}
        {isNew && product.countInStock > 0 && (
          <span style={{
            backgroundColor: '#27ae60',
            color: '#fff',
            fontSize: '10px',
            fontWeight: '800',
            padding: '3px 8px',
            borderRadius: '20px',
            letterSpacing: '1px',
            boxShadow: '0 2px 6px rgba(39,174,96,0.5)',
            animation: 'pulse 1.5s infinite',
          }}>
            ✨ NEW
          </span>
        )}
        {product.countInStock === 0 && (
          <span style={{
            backgroundColor: '#e74c3c', color: '#fff',
            fontSize: '10px', fontWeight: '700',
            padding: '3px 8px', borderRadius: '20px', letterSpacing: '0.5px',
          }}>SOLD OUT</span>
        )}
        {product.countInStock > 0 && product.countInStock <= 5 && (
          <span style={{
            backgroundColor: '#e67e22', color: '#fff',
            fontSize: '10px', fontWeight: '700',
            padding: '3px 8px', borderRadius: '20px',
          }}>ONLY {product.countInStock} LEFT</span>
        )}
      </div>

      {/* IMAGE */}
      <Link to={`/product/${product._id}`}>
        <div style={{
          backgroundColor: 'var(--bg-soft)',
          padding: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '200px', overflow: 'hidden',
        }}>
          <img
            src={displayImage}
            alt={product.name}
            style={{
              maxHeight: '160px', maxWidth: '100%',
              objectFit: 'contain',
              opacity: product.countInStock === 0 ? 0.45 : 1,
              transition: 'transform 0.4s ease, opacity 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        </div>
      </Link>

      {/* CONTENT */}
      <div style={{
        padding: '14px 16px 16px',
        display: 'flex', flexDirection: 'column', gap: '8px', flex: 1,
      }}>
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
          <p style={{
            color: 'var(--text-main)', fontWeight: '600', fontSize: '14px',
            lineHeight: '1.4', minHeight: '40px', margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {product.name}
          </p>
        </Link>

        <Rating value={product.rating} text={`${product.numReviews} reviews`} />

        {/* COLOR DOTS */}
        {product.colorVariants && product.colorVariants.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {product.colorVariants.map((variant, i) => (
              <div
                key={i}
                title={variant.colorName}
                onMouseEnter={() => setHoveredColor(variant)}
                onMouseLeave={() => setHoveredColor(null)}
                style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  backgroundColor: variant.colorHex,
                  border: hoveredColor?.colorName === variant.colorName
                    ? '2px solid var(--accent)' : '2px solid var(--border)',
                  cursor: 'pointer', transition: 'transform 0.2s',
                  transform: hoveredColor?.colorName === variant.colorName ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}

        {/* PRICE + VIEW BUTTON */}
        <div style={{
          marginTop: 'auto', paddingTop: '10px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            color: 'var(--accent)', fontWeight: '800',
            fontSize: '18px', letterSpacing: '-0.5px',
          }}>
            ₱{product.price.toLocaleString('en-PH')}
          </span>
          <Link
            to={`/product/${product._id}`}
            className='view-btn'
            style={{
              backgroundColor: 'var(--accent)',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '800',
              textDecoration: 'none',
              display: 'inline-block',
              lineHeight: '1.5',
              transition: 'opacity 0.2s',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Product;