import { Link, useParams } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Card } from 'react-bootstrap';
import Message from '../components/Message';
import Loader from '../components/Loader';
import { useGetOrderDetailsQuery } from '../slices/ordersApiSlice';

const formatPeso = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

const OrderScreen = () => {
  const { id: orderId } = useParams();

  const {
    data: order,
    isLoading,
    error,
  } = useGetOrderDetailsQuery(orderId);

  return isLoading ? (
    <Loader />
  ) : error ? (
    <Message variant='danger'>{error?.data?.message}</Message>
  ) : (
    <>
      <h1>Order Tracking</h1>

      {/* DELIVERY PROGRESS — dynamic based sa actual address */}
      <Card className='mb-4 p-3'>
        <h4>Delivery Progress</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>✅ Order Created – Manila Warehouse</li>
          <li>✅ Picked Up – Parañaque Sorting Center</li>
          <li>✅ Sorting – Cebu Logistics Hub</li>
          <li>✅ Transport – Tacloban Distribution Hub</li>
          <li>✅ Arrived – {order.shippingAddress.city} Delivery Hub</li>
          <li>✅ Out for Delivery – {order.shippingAddress.city}</li>
          <li style={{ color: 'green', fontWeight: 'bold' }}>
            ✔ Delivered – {order.shippingAddress.address},{' '}
            {order.shippingAddress.city}
          </li>
        </ul>
      </Card>

      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>

            <ListGroup.Item>
              <h2>Shipping</h2>
              <p><strong>Name: </strong>{order.user.name}</p>
              <p><strong>Email: </strong>{order.user.email}</p>
              <p>
                <strong>Address: </strong>
                {order.shippingAddress.address},{' '}
                {order.shippingAddress.city},{' '}
                {order.shippingAddress.postalCode},{' '}
                {order.shippingAddress.country}
              </p>
              <Message variant='success'>Delivered ✔</Message>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Payment Method</h2>
              <p><strong>Method: </strong>{order.paymentMethod}</p>
              <Message variant='success'>Paid ✔</Message>
            </ListGroup.Item>

            <ListGroup.Item>
              <h2>Order Items</h2>
              {order.orderItems.length === 0 ? (
                <Message>Order is empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {order.orderItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row>
                        <Col md={1}>
                          <Image src={item.image} alt={item.name} fluid rounded />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>{item.name}</Link>
                        </Col>
                        <Col md={4}>
                          {item.qty} x {formatPeso(item.price)} ={' '}
                          {formatPeso(item.qty * item.price)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>

          </ListGroup>
        </Col>

        <Col md={4}>
          <Card>
            <ListGroup variant='flush'>
              <ListGroup.Item><h2>Order Summary</h2></ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>{formatPeso(order.itemsPrice)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>{formatPeso(order.shippingPrice)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>{formatPeso(order.taxPrice)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Total</Col>
                  <Col>{formatPeso(order.totalPrice)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Message variant='success'>PAYMENT COMPLETED</Message>
                <Message variant='success'>DELIVERY COMPLETED</Message>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OrderScreen;