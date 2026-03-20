import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { Link } from 'react-router-dom';
import { } from 'react-bootstrap';
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

const CategoryCarousel = ({ products }) => {
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);

  // Responsive visible count
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 576) {
        setVisibleCount(1); // mobile — 1 card
      } else if (width < 768) {
        setVisibleCount(2); // tablet small — 2 cards
      } else if (width < 992) {
        setVisibleCount(3); // tablet — 3 cards
      } else {
        setVisibleCount(4); // desktop — 4 cards
      }
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  const canPrev = startIndex > 0;
  const canNext = startIndex + visibleCount < products.length;

  const prev = () => {
    if (canPrev) setStartIndex((i) => i - 1);
  };

  const next = () => {
    if (canNext) setStartIndex((i) => i + 1);
  };

  const visibleProducts = products.slice(startIndex, startIndex + visibleCount);

  const cardWidth = `${100 / visibleCount}%`;

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
          width: '32px',
          height: '32px',
          fontSize: '18px',
          cursor: canPrev ? 'pointer' : 'not-allowed',
          flexShrink: 0,
          marginRight: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        ‹
      </button>

      {/* PRODUCT CARDS */}
      <div
        style={{
          display: 'flex',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {visibleProducts.map((product) => (
          <div
            key={product._id}
            style={{
              minWidth: cardWidth,
              maxWidth: cardWidth,
              padding: '0 6px',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box',
            }}
          >
            <Product product={product} />
          </div>
        ))}
      </div>

      {/* RIGHT ARROW */}
      <button
        onClick={next}
        disabled={!canNext}
        style={{
          background: canNext ? '#0d6efd' : '#ccc',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          fontSize: '18px',
          cursor: canNext ? 'pointer' : 'not-allowed',
          flexShrink: 0,
          marginLeft: '6px',
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