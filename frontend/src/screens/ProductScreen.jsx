import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Row, Col, Image, ListGroup, Card, Button, Form, Modal,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import {
  useGetProductDetailsQuery,
  useCreateReviewMutation,
  useSubmitRequestMutation,
  useCheckUserOrderQuery,
} from '../slices/productsApiSlice';
import Rating from '../components/Rating';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Meta from '../components/Meta';
import { addToCart } from '../slices/cartSlice';

const ProductScreen = () => {
  const { id: productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const {
    data: product, isLoading, refetch, error,
  } = useGetProductDetailsQuery(productId);

  const { userInfo } = useSelector((state) => state.auth);

  const [createReview, { isLoading: loadingProductReview }] =
    useCreateReviewMutation();

  const [submitRequest, { isLoading: loadingRequest }] =
    useSubmitRequestMutation();

  const { data: orderCheck } = useCheckUserOrderQuery(productId, {
    skip: !userInfo || userInfo?.isAdmin,
  });
  const hasPurchased = orderCheck?.hasPurchased;

  const addToCartHandler = () => {
    dispatch(addToCart({ ...product, qty }));
    navigate('/cart');
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await createReview({ productId, rating, comment }).unwrap();
      refetch();
      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleRequestSubmit = async () => {
    if (!requestMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    try {
      await submitRequest({
        productId: product._id,
        productName: product.name,
        message: requestMessage,
      }).unwrap();
      toast.success('Request sent successfully!');
      setShowRequestModal(false);
      setRequestMessage('');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <>
      <Link to='/' style={{ textDecoration: 'none', color: '#0d6efd' }}>
        ← Go Back
      </Link>

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error?.data?.message || error.error}</Message>
      ) : (
        <>
          <Meta title={product.name} description={product.description} />

          <Row className='mt-4'>
            {/* PRODUCT IMAGE */}
            <Col md={6}>
              <Image
                src={product.image}
                alt={product.name}
                fluid
                style={{
                  borderRadius: '10px',
                  border: '1px solid #eee',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                }}
              />
            </Col>

            {/* PRODUCT INFO */}
            <Col md={3}>
              <ListGroup variant='flush'>
                <ListGroup.Item>
                  <h3 style={{ fontWeight: '600' }}>{product.name}</h3>
                </ListGroup.Item>
                <ListGroup.Item>
                  <Rating
                    value={product.rating}
                    text={`${product.numReviews} reviews`}
                  />
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>
                    {new Intl.NumberFormat('en-PH', {
                      style: 'currency', currency: 'PHP',
                    }).format(product.price)}
                  </strong>
                </ListGroup.Item>
                <ListGroup.Item>{product.description}</ListGroup.Item>
              </ListGroup>
            </Col>

            {/* CARD: ADMIN vs USER */}
            <Col md={3}>
              <Card style={{
                border: 'none',
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                borderRadius: '10px',
              }}>
                <ListGroup variant='flush'>

                  <ListGroup.Item>
                    <Row>
                      <Col>Price:</Col>
                      <Col>
                        <strong>
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency', currency: 'PHP',
                          }).format(product.price)}
                        </strong>
                      </Col>
                    </Row>
                  </ListGroup.Item>

                  <ListGroup.Item>
                    <Row>
                      <Col>Status:</Col>
                      <Col>
                        <span style={{
                          color: product.countInStock > 0 ? 'green' : 'red',
                          fontWeight: 'bold',
                        }}>
                          {product.countInStock > 0
                            ? `In Stock (${product.countInStock} left)`
                            : 'Out Of Stock'}
                        </span>
                      </Col>
                    </Row>
                  </ListGroup.Item>

                  {/* ===== ADMIN VIEW ===== */}
                  {userInfo && userInfo.isAdmin ? (
                    <ListGroup.Item>
                      <Button
                        type='button'
                        className='w-100'
                        onClick={() => navigate(`/admin/product/${product._id}/edit`)}
                        style={{
                          backgroundColor: '#198754',
                          border: 'none',
                          fontWeight: 'bold',
                        }}
                      >
                        ➕ Add Stocks
                      </Button>
                    </ListGroup.Item>

                  ) : (
                    /* ===== USER VIEW ===== */
                    <>
                      {product.countInStock > 0 && (
                        <ListGroup.Item>
                          <Row>
                            <Col>Qty</Col>
                            <Col>
                              <Form.Select
                                value={qty}
                                onChange={(e) => setQty(Number(e.target.value))}
                              >
                                {[...Array(product.countInStock).keys()].map((x) => (
                                  <option key={x + 1} value={x + 1}>{x + 1}</option>
                                ))}
                              </Form.Select>
                            </Col>
                          </Row>
                        </ListGroup.Item>
                      )}

                      <ListGroup.Item>
                        <Button
                          type='button'
                          className='w-100'
                          disabled={product.countInStock === 0}
                          onClick={addToCartHandler}
                          style={{ backgroundColor: '#0d6efd', border: 'none' }}
                        >
                          Add To Cart
                        </Button>
                      </ListGroup.Item>

                      {/* REQUEST BUTTON — Out of Stock + logged in user only */}
                      {product.countInStock === 0 && userInfo && (
                        <ListGroup.Item>
                          <Button
                            type='button'
                            className='w-100'
                            onClick={() => setShowRequestModal(true)}
                            style={{
                              backgroundColor: '#ff6b35',
                              border: 'none',
                              fontWeight: 'bold',
                            }}
                          >
                            🔔 Request this Item
                          </Button>
                        </ListGroup.Item>
                      )}

                      {product.countInStock === 0 && !userInfo && (
                        <ListGroup.Item>
                          <Message variant='warning'>
                            <Link to='/login'>Sign in</Link> to request this item
                          </Message>
                        </ListGroup.Item>
                      )}
                    </>
                  )}

                </ListGroup>
              </Card>
            </Col>
          </Row>

          {/* REVIEWS */}
          <Row className='mt-5'>
            <Col md={6}>
              <h2>Reviews</h2>
              {product.reviews.length === 0 && <Message>No Reviews</Message>}
              <ListGroup variant='flush'>
                {product.reviews.map((review) => (
                  <ListGroup.Item key={review._id}>
                    <strong>{review.name}</strong>
                    <Rating value={review.rating} />
                    <p>{review.createdAt.substring(0, 10)}</p>
                    <p>{review.comment}</p>
                  </ListGroup.Item>
                ))}

                <ListGroup.Item>
                  <h4>Write a Customer Review</h4>
                  {loadingProductReview && <Loader />}

                  {!userInfo && (
                    <Message>
                      Please <Link to='/login'>sign in</Link> to write a review
                    </Message>
                  )}

                  {userInfo && !userInfo.isAdmin && hasPurchased === false && (
                    <Message variant='warning'>
                      🛒 You can only review products you have ordered.
                    </Message>
                  )}

                  {userInfo && !userInfo.isAdmin && hasPurchased === true && (
                    <Form onSubmit={submitHandler}>
                      <Form.Group className='my-2'>
                        <Form.Label>Rating</Form.Label>
                        <Form.Select
                          required
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                        >
                          <option value=''>Select...</option>
                          <option value='1'>1 - Poor</option>
                          <option value='2'>2 - Fair</option>
                          <option value='3'>3 - Good</option>
                          <option value='4'>4 - Very Good</option>
                          <option value='5'>5 - Excellent</option>
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className='my-2'>
                        <Form.Label>Comment</Form.Label>
                        <Form.Control
                          as='textarea'
                          rows='3'
                          required
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                      </Form.Group>
                      <Button
                        type='submit'
                        disabled={loadingProductReview}
                        style={{ backgroundColor: '#0d6efd', border: 'none' }}
                      >
                        Submit Review
                      </Button>
                    </Form>
                  )}
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>

          {/* REQUEST MODAL */}
          <Modal
            show={showRequestModal}
            onHide={() => setShowRequestModal(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>🔔 Request this Item</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p style={{ color: '#555' }}>
                Product: <strong>{product.name}</strong>
              </p>
              <Form.Group>
                <Form.Label>Your Message</Form.Label>
                <Form.Control
                  as='textarea'
                  rows={4}
                  placeholder='e.g. Please restock this item, or I want to request a new product...'
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant='secondary'
                onClick={() => setShowRequestModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestSubmit}
                disabled={loadingRequest}
                style={{ backgroundColor: '#ff6b35', border: 'none' }}
              >
                {loadingRequest ? 'Sending...' : 'Send Request'}
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </>
  );
};

export default ProductScreen;