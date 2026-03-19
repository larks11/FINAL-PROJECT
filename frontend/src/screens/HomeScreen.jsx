import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { Link } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap';
import Product from '../components/Product';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Paginate from '../components/Paginate';
import ProductCarousel from '../components/ProductCarousel';
import Meta from '../components/Meta';

const HomeScreen = () => {
  const { pageNumber, keyword } = useParams();

  const { data, isLoading, error } = useGetProductsQuery({
    keyword,
    pageNumber,
  });

  // Group products by category
  const groupByCategory = (products) => {
    return products.reduce((groups, product) => {
      const cat = product.category || 'Others';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
      return groups;
    }, {});
  };

  return (
    <>
      {!keyword ? (
        <ProductCarousel />
      ) : (
        <Link to='/' className='btn btn-light mb-4'>
          Go Back
        </Link>
      )}

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>
          {error?.data?.message || error.error}
        </Message>
      ) : (
        <>
          <Meta />
          <h1 className='neon-text text-center my-4'>Latest Products</h1>

          {Object.entries(groupByCategory(data.products)).map(
            ([category, products]) => (
              <div key={category} className='mb-5'>
                {/* Category Title */}
                <h4
                  style={{
                    fontWeight: 'bold',
                    borderLeft: '4px solid #0d6efd',
                    paddingLeft: '10px',
                    marginBottom: '16px',
                    color: '#333',
                  }}
                >
                  {category}
                </h4>

                {/* Category Row Carousel */}
                <CategoryCarousel products={products} />
              </div>
            )
          )}

          <Paginate
            pages={data.pages}
            page={data.page}
            keyword={keyword ? keyword : ''}
          />
        </>
      )}
    </>
  );
};

// ─── Category Carousel Component ─────────────────────────────────────────────
const CategoryCarousel = ({ products }) => {
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 4; // how many cards visible at once

  const canPrev = startIndex > 0;
  const canNext = startIndex + visibleCount < products.length;

  const prev = () => {
    if (canPrev) setStartIndex((i) => i - 1);
  };

  const next = () => {
    if (canNext) setStartIndex((i) => i + 1);
  };

  const visibleProducts = products.slice(startIndex, startIndex + visibleCount);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      
      {/* LEFT ARROW */}
      <button
        onClick={prev}
        disabled={!canPrev}
        style={{
          background: canPrev ? '#0d6efd' : '#ccc',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          fontSize: '20px',
          cursor: canPrev ? 'pointer' : 'not-allowed',
          flexShrink: 0,
          marginRight: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        ‹
      </button>

      {/* PRODUCT CARDS */}
      <Row className='flex-nowrap w-100' style={{ overflow: 'hidden', margin: 0 }}>
        {visibleProducts.map((product) => (
          <Col
            key={product._id}
            style={{
              minWidth: '23%',
              maxWidth: '23%',
              padding: '0 6px',
              transition: 'all 0.3s ease',
            }}
          >
            <Product product={product} />
          </Col>
        ))}
      </Row>

      {/* RIGHT ARROW */}
      <button
        onClick={next}
        disabled={!canNext}
        style={{
          background: canNext ? '#0d6efd' : '#ccc',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          fontSize: '20px',
          cursor: canNext ? 'pointer' : 'not-allowed',
          flexShrink: 0,
          marginLeft: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        ›
      </button>
    </div>
  );
};

export default HomeScreen;