import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Rating from './Rating';

const Product = ({ product }) => {
  return (
    <Card
      className='my-3 p-3 rounded product-card'
      style={{
        backgroundColor: '#fff',
        border: 'none',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* SOLD OUT LABEL */}
      {product.countInStock === 0 && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 10,
        }}>
          <Badge bg='danger' style={{ fontSize: '11px', padding: '5px 8px' }}>
            SOLD OUT
          </Badge>
        </div>
      )}

      <Link to={`/product/${product._id}`}>
        <Card.Img
          src={product.image}
          variant='top'
          style={{
            height: '200px',
            objectFit: 'contain',
            opacity: product.countInStock === 0 ? 0.6 : 1,
          }}
        />
      </Link>

      <Card.Body className='d-flex flex-column justify-content-between'>
        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
          <Card.Title
            as='div'
            className='product-title'
            style={{ color: '#000', minHeight: '48px' }}
          >
            <strong>{product.name}</strong>
          </Card.Title>
        </Link>

        <Card.Text as='div'>
          <Rating
            value={product.rating}
            text={`${product.numReviews} reviews`}
          />
        </Card.Text>

        <Card.Text
          as='h3'
          style={{ color: '#0d6efd', fontWeight: 'bold' }}
        >
          ₱{product.price.toLocaleString('en-PH')}
        </Card.Text>
      </Card.Body>
    </Card>
  );
};

export default Product;