import { Link } from 'react-router-dom';
import { Carousel, Image } from 'react-bootstrap';
import Message from './Message';
import { useGetTopProductsQuery } from '../slices/productsApiSlice';

const ProductCarousel = () => {
  const { data: products, isLoading, error } = useGetTopProductsQuery();

  return isLoading ? null : error ? (
    <Message variant='danger'>{error?.data?.message || error.error}</Message>
  ) : (
    <Carousel
      pause='hover'
      className='mb-4'
      style={{
        border: '3px solid #0099ff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
        backgroundColor: '#176bcc',
      }}
    >
      {products.map((product) => (
        <Carousel.Item key={product._id} style={{ padding: '20px' }}>
          <Link to={`/product/₱{product._id}`}>
            <Image
              src={product.image}
              alt={product.name}
              fluid
              style={{
                maxHeight: '450px',
                objectFit: 'contain',
                margin: '0 auto',
              }}
            />

            <Carousel.Caption className='carousel-caption'>
              <h4 className='text-white'>
                {product.name} (₱{product.price.toLocaleString('en-PH')})
              </h4>
            </Carousel.Caption>
          </Link>
        </Carousel.Item>
      ))}
    </Carousel>
  );
};

export default ProductCarousel;