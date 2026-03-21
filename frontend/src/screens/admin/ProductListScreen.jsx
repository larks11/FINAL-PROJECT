import { useState } from 'react';
import { Table, Button, Row, Col, Modal, Form, InputGroup } from 'react-bootstrap';
import { FaEdit, FaPlus, FaTrash, FaSearch } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import Paginate from '../../components/Paginate';
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImageMutation,
} from '../../slices/productsApiSlice';
import { toast } from 'react-toastify';

const ProductListScreen = () => {
  const { pageNumber } = useParams();

  const { data, isLoading, error } = useGetProductsQuery({ pageNumber });

  const [deleteProduct, { isLoading: loadingDelete }] =
    useDeleteProductMutation();
  const [createProduct, { isLoading: loadingCreate }] =
    useCreateProductMutation();
  const [updateProduct, { isLoading: loadingUpdate }] =
    useUpdateProductMutation();
  const [uploadProductImage, { isLoading: loadingUpload }] =
    useUploadProductImageMutation();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setName('');
    setPrice('');
    setImage('');
    setBrand('');
    setCategory('');
    setCountInStock('');
    setDescription('');
  };

  const uploadFileHandler = async (e) => {
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    try {
      const res = await uploadProductImage(formData).unwrap();
      toast.success('Image uploaded!');
      setImage(res.image);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const createProductHandler = async () => {
    if (!name || !price || !image || !brand || !category || !countInStock || !description) {
      toast.error('Please fill up all fields');
      return;
    }
    try {
      const created = await createProduct().unwrap();
      await updateProduct({
        productId: created._id,
        name,
        price: Number(price),
        image,
        brand,
        category,
        countInStock: Number(countInStock),
        description,
      }).unwrap();
      toast.success('Product created successfully!');
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  // Filter products based on search term
  const filteredProducts = data?.products?.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <>
      <Row className='align-items-center'>
        <Col>
          <h1>Products</h1>
        </Col>
        <Col className='text-end'>
          <Button className='my-3' onClick={() => setShowModal(true)}>
            <FaPlus /> Create Product
          </Button>
        </Col>
      </Row>

      {/* SEARCH BAR */}
      <Row className='mb-3'>
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type='text'
              placeholder='Search by name, category, or brand...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant='outline-secondary'
                onClick={() => setSearchTerm('')}
              >
                Clear
              </Button>
            )}
          </InputGroup>
        </Col>
        <Col md={6} className='d-flex align-items-center'>
          {searchTerm && (
            <span style={{ color: '#666', fontSize: '14px' }}>
              {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} found
            </span>
          )}
        </Col>
      </Row>

      {(loadingCreate || loadingUpdate || loadingDelete) && <Loader />}

      {isLoading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error.data.message}</Message>
      ) : (
        <>
          <Table striped bordered hover responsive className='table-sm'>
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>PRICE</th>
                <th>CATEGORY</th>
                <th>BRAND</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td>{product._id}</td>
                    <td>{product.name}</td>
                    <td>₱{product.price.toLocaleString('en-PH')}</td>
                    <td>{product.category}</td>
                    <td>{product.brand}</td>
                    <td>
                      <Button
                        as={Link}
                        to={`/admin/product/${product._id}/edit`}
                        variant='light'
                        className='btn-sm mx-2'
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        variant='danger'
                        className='btn-sm'
                        onClick={() => deleteHandler(product._id)}
                      >
                        <FaTrash style={{ color: 'white' }} />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan='6' className='text-center'>
                    No products found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Hide pagination when searching */}
          {!searchTerm && (
            <Paginate pages={data.pages} page={data.page} isAdmin={true} />
          )}
        </>
      )}

      {/* CREATE PRODUCT MODAL */}
      <Modal
        show={showModal}
        onHide={() => { setShowModal(false); resetForm(); }}
        size='lg'
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title><FaPlus /> Create New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className='mb-3' controlId='name'>
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='Enter product name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className='mb-3' controlId='price'>
                  <Form.Label>Price (₱)</Form.Label>
                  <Form.Control
                    type='number'
                    placeholder='Enter price'
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className='mb-3' controlId='image'>
              <Form.Label>Image</Form.Label>
              <Form.Control
                type='text'
                placeholder='Image URL'
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className='mb-2'
              />
              <Form.Control type='file' onChange={uploadFileHandler} />
              {loadingUpload && <Loader />}
              {image && (
                <img
                  src={image}
                  alt='preview'
                  style={{
                    marginTop: '10px',
                    height: '100px',
                    objectFit: 'contain',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    padding: '4px',
                  }}
                />
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className='mb-3' controlId='brand'>
                  <Form.Label>Brand</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='Enter brand'
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className='mb-3' controlId='category'>
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='e.g. PHONES, LAPTOP'
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className='mb-3' controlId='countInStock'>
              <Form.Label>Count In Stock</Form.Label>
              <Form.Control
                type='number'
                placeholder='Enter stock quantity'
                value={countInStock}
                onChange={(e) => setCountInStock(e.target.value)}
              />
            </Form.Group>

            <Form.Group className='mb-3' controlId='description'>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as='textarea'
                rows={3}
                placeholder='Enter product description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant='secondary'
            onClick={() => { setShowModal(false); resetForm(); }}
          >
            Cancel
          </Button>
          <Button
            variant='primary'
            onClick={createProductHandler}
            disabled={loadingCreate || loadingUpdate || loadingUpload}
          >
            {loadingCreate || loadingUpdate ? 'Creating...' : 'Create Product'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProductListScreen;