import { useState } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Rating from './Rating';

const Product = ({ product }) => {
  const [hoveredColor, setHoveredColor] = useState(null);

  // Use hovered color image or default
  const displayImage = hoveredColor?.image || product.image;

  return (
    <Card
      className='my-3 p-3 rounded product-card'
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        height: '100%',
        position: 'relative',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* SOLD OUT BADGE */}
      {product.countInStock === 0 && (
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
          <Badge bg='danger' style={{ fontSize: '11px', padding: '5px 8px' }}>
            SOLD OUT
          </Badge>
        </div>
      )}

      {/* PRODUCT IMAGE */}
      <Link to={`/product/${product._id}`}>
        <Card.Img
          src={displayImage}
          variant='top'
          style={{
            height: '200px',
            objectFit: 'contain',
            opacity: product.countInStock === 0 ? 0.5 : 1,
            transition: 'opacity 0.2s ease',
          }}
        />
      </Link>

      <Card.Body className='d-flex flex-column justify-content-between'>
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
          <Card.Title
            as='div'
            className='product-title'
            style={{ color: 'var(--text-main)', minHeight: '48px' }}
          >
            <strong>{product.name}</strong>
          </Card.Title>
        </Link>

        <Card.Text as='div'>
          <Rating value={product.rating} text={`${product.numReviews} reviews`} />
        </Card.Text>

        {/* COLOR VARIANTS */}
        {product.colorVariants && product.colorVariants.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {product.colorVariants.map((variant, i) => (
              <div
                key={i}
                title={variant.colorName}
                onMouseEnter={() => setHoveredColor(variant)}
                onMouseLeave={() => setHoveredColor(null)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: variant.colorHex,
                  border: hoveredColor?.colorName === variant.colorName
                    ? '2px solid var(--accent)'
                    : '2px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, border-color 0.2s',
                  transform: hoveredColor?.colorName === variant.colorName
                    ? 'scale(1.3)'
                    : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}

        <Card.Text as='h3' style={{ color: 'var(--accent)', fontWeight: 'bold', marginTop: '8px' }}>
          ₱{product.price.toLocaleString('en-PH')}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default Product;