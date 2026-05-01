import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import Product from '../components/Product';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import ProductCarousel from '../components/ProductCarousel';

const CATEGORIES_PER_PAGE = 4;

const HomeScreen = () => {
  const { pageNumber, keyword } = useParams();
  const { data, isLoading, error } = useGetProductsQuery({ keyword, pageNumber });

  const [categoryPage, setCategoryPage] = useState(1);

  const groupByCategory = (products) => {
    return products.reduce((groups, product) => {
      const cat = product.category || 'Others';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
      return groups;
    }, {});
  };

  const categoryIcons = {
    PHONES: '📱',
    LAPTOP: '💻',
    TABLET: '📟',
    AIRPODS: '🎧',
    'POWER BANK': '🔋',
    HEADPHONES: '🎵',
    ACCESSORIES: '🛍️',
    Others: '📦',
  };

  // Reset to page 1 when keyword changes
  useEffect(() => {
    setCategoryPage(1);
  }, [keyword]);

  return (
    <>
      {!keyword ? (
        <ProductCarousel />
      ) : (
        <Link
          to='/'
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--accent)',
            fontWeight: '600',
            marginBottom: '20px',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          ← Go Back
        </Link>
      )}

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : (
        <>
          <Meta />

          {/* SECTION HEADER */}
          <div style={{ textAlign: 'center', margin: '40px 0 32px' }}>
            <h1 style={{
              color: 'var(--accent)',
              fontWeight: '800',
              fontSize: '28px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Latest Products
            </h1>
            <div style={{
              width: '60px',
              height: '3px',
              backgroundColor: 'var(--accent)',
              margin: '0 auto',
              borderRadius: '2px',
            }} />
          </div>

          {/* CATEGORY PAGINATION */}
          {(() => {
            const grouped = groupByCategory(data.products);
            const allCategories = Object.entries(grouped);
            const totalCategoryPages = Math.ceil(allCategories.length / CATEGORIES_PER_PAGE);
            const startIdx = (categoryPage - 1) * CATEGORIES_PER_PAGE;
            const visibleCategories = allCategories.slice(startIdx, startIdx + CATEGORIES_PER_PAGE);

            return (
              <>
                {/* CATEGORY SECTIONS */}
                {visibleCategories.map(([category, products]) => (
                  <div key={category} style={{ marginBottom: '48px' }}>
                    {/* CATEGORY LABEL */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '20px',
                      paddingBottom: '12px',
                      borderBottom: '2px solid var(--border)',
                    }}>
                      <span style={{ fontSize: '22px' }}>
                        {categoryIcons[category] || '📦'}
                      </span>
                      <h4 style={{
                        margin: 0,
                        fontWeight: '800',
                        fontSize: '16px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                      }}>
                        {category}
                      </h4>
                      <div style={{
                        flex: 1,
                        height: '1px',
                        backgroundColor: 'var(--border)',
                        marginLeft: '8px',
                      }} />
                    </div>

                    <CategoryCarousel category={category} currentProducts={products} />
                  </div>
                ))}

                {/* CATEGORY PAGE CONTROLS */}
                {totalCategoryPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '32px 0 48px',
                  }}>
                    <button
                      onClick={() => {
                        setCategoryPage((p) => p - 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={categoryPage === 1}
                      style={{
                        background: categoryPage === 1 ? 'var(--border)' : 'var(--accent)',
                        color: categoryPage === 1 ? 'var(--text-muted)' : 'var(--btn-text)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 20px',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: categoryPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: categoryPage === 1 ? 0.5 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      ← Prev
                    </button>

                    {/* PAGE NUMBER BUTTONS */}
                    {Array.from({ length: totalCategoryPages }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => {
                          setCategoryPage(num);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          background: categoryPage === num ? 'var(--accent)' : 'transparent',
                          color: categoryPage === num ? 'var(--btn-text)' : 'var(--accent)',
                          border: '2px solid var(--accent)',
                          borderRadius: '8px',
                          padding: '8px 14px',
                          fontWeight: '700',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          minWidth: '40px',
                        }}
                      >
                        {num}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        setCategoryPage((p) => p + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={categoryPage === totalCategoryPages}
                      style={{
                        background: categoryPage === totalCategoryPages ? 'var(--border)' : 'var(--accent)',
                        color: categoryPage === totalCategoryPages ? 'var(--text-muted)' : 'var(--btn-text)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 20px',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: categoryPage === totalCategoryPages ? 'not-allowed' : 'pointer',
                        opacity: categoryPage === totalCategoryPages ? 0.5 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}
    </>
  );
};

const CategoryCarousel = ({ category, currentProducts }) => {
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [allProducts, setAllProducts] = useState(currentProducts);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`/api/products/category/${encodeURIComponent(category)}`);
        const data = await res.json();
        if (Array.isArray(data)) setAllProducts(data);
      } catch (err) {
        console.error('Failed to fetch category products', err);
      }
    };
    fetchAll();
  }, [category]);

  useEffect(() => {
    const updateVisible = () => {
      const w = window.innerWidth;
      if (w < 576) setVisibleCount(1);
      else if (w < 768) setVisibleCount(2);
      else if (w < 992) setVisibleCount(3);
      else setVisibleCount(4);
    };
    updateVisible();
    window.addEventListener('resize', updateVisible);
    return () => window.removeEventListener('resize', updateVisible);
  }, []);

  const canPrev = startIndex > 0;
  const canNext = startIndex + visibleCount < allProducts.length;
  const prev = () => { if (canPrev) setStartIndex((i) => i - 1); };
  const next = () => { if (canNext) setStartIndex((i) => i + 1); };
  const visibleProducts = allProducts.slice(startIndex, startIndex + visibleCount);
  const cardWidth = `${100 / visibleCount}%`;

  const ArrowBtn = ({ onClick, disabled, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? 'var(--border)' : 'var(--accent)',
        color: disabled ? 'var(--text-muted)' : 'var(--btn-text)',
        border: 'none',
        borderRadius: '50%',
        width: '36px',
        height: '36px',
        fontSize: '20px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        opacity: disabled ? 0.4 : 1,
        boxShadow: disabled ? 'none' : '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <ArrowBtn onClick={prev} disabled={!canPrev}>‹</ArrowBtn>
      <div style={{ display: 'flex', overflow: 'hidden', width: '100%', gap: '0' }}>
        {visibleProducts.map((product) => (
          <div
            key={product._id}
            style={{
              minWidth: cardWidth,
              maxWidth: cardWidth,
              padding: '0 8px',
              boxSizing: 'border-box',
              transition: 'all 0.3s ease',
            }}
          >
            <Product product={product} />
          </div>
        ))}
      </div>
      <ArrowBtn onClick={next} disabled={!canNext}>›</ArrowBtn>
    </div>
  );
};

export default HomeScreen;