import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import FormContainer from '../../components/FormContainer';
import { toast } from 'react-toastify';
import {
  useGetProductDetailsQuery,
  useUpdateProductMutation,
  useUploadProductImageMutation,
} from '../../slices/productsApiSlice';

const ProductEditScreen = () => {
  const { id: productId } = useParams();

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState('');

  // ===== COLOR VARIANTS STATE =====
  const [colorVariants, setColorVariants] = useState([]);

  const { data: product, isLoading, refetch, error } = useGetProductDetailsQuery(productId);
  const [updateProduct, { isLoading: loadingUpdate }] = useUpdateProductMutation();
  const [uploadProductImage, { isLoading: loadingUpload }] = useUploadProductImageMutation();

  const navigate = useNavigate();

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price);
      setImage(product.image);
      setBrand(product.brand);
      setCategory(product.category);
      setCountInStock(product.countInStock);
      setDescription(product.description);
      setColorVariants(product.colorVariants || []);
    }
  }, [product]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await updateProduct({
        productId,
        name,
        price,
        image,
        brand,
        category,
        description,
        countInStock,
        colorVariants,
      }).unwrap();
      toast.success('Product updated');
      refetch();
      navigate('/admin/productlist');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const uploadFileHandler = async (e) => {
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    try {
      const res = await uploadProductImage(formData).unwrap();
      toast.success(res.message);
      setImage(res.image);
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  // ===== COLOR VARIANT HANDLERS =====
  const addColorVariant = () => {
    setColorVariants([...colorVariants, { colorName: '', colorHex: '#000000', image: '' }]);
  };

  const removeColorVariant = (index) => {
    setColorVariants(colorVariants.filter((_, i) => i !== index));
  };

  const updateColorVariant = (index, field, value) => {
    const updated = colorVariants.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    setColorVariants(updated);
  };

  const uploadColorImageHandler = async (e, index) => {
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    try {
      const res = await uploadProductImage(formData).unwrap();
      updateColorVariant(index, 'image', res.image);
      toast.success('Color image uploaded!');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <>
      <Link to='/admin/productlist' className='btn btn-light my-3'>
        Go Back
      </Link>
      <FormContainer>
        <h1>Edit Product</h1>
        {loadingUpdate && <Loader />}
        {isLoading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error.data.message}</Message>
        ) : (
          <Form onSubmit={submitHandler}>

            {/* NAME */}
            <Form.Group controlId='name' className='mb-3'>
              <Form.Label>Name</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter name'
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>

            {/* PRICE */}
            <Form.Group controlId='price' className='mb-3'>
              <Form.Label>Price</Form.Label>
              <Form.Control
                type='number'
                placeholder='Enter price'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Form.Group>

            {/* IMAGE */}
            <Form.Group controlId='image' className='mb-3'>
              <Form.Label>Image</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter image url'
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
              <Form.Control
                type='file'
                onChange={uploadFileHandler}
                className='mt-2'
              />
              {loadingUpload && <Loader />}
            </Form.Group>

            {/* BRAND */}
            <Form.Group controlId='brand' className='mb-3'>
              <Form.Label>Brand</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter brand'
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </Form.Group>

            {/* COUNT IN STOCK */}
            <Form.Group controlId='countInStock' className='mb-3'>
              <Form.Label>Count In Stock</Form.Label>
              <Form.Control
                type='number'
                placeholder='Enter countInStock'
                value={countInStock}
                onChange={(e) => setCountInStock(e.target.value)}
              />
            </Form.Group>

            {/* CATEGORY */}
            <Form.Group controlId='category' className='mb-3'>
              <Form.Label>Category</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter category'
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </Form.Group>

            {/* DESCRIPTION */}
            <Form.Group controlId='description' className='mb-3'>
              <Form.Label>Description</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            {/* ===== COLOR VARIANTS ===== */}
            <div style={{
              border: '1px solid var(--accent-dark)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '20px',
              backgroundColor: 'rgba(212,175,55,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h5 style={{ color: 'var(--accent)', margin: 0 }}>🎨 Color Variants</h5>
                <Button
                  type='button'
                  size='sm'
                  onClick={addColorVariant}
                  style={{
                    backgroundColor: 'var(--accent)',
                    border: 'none',
                    color: 'var(--btn-text)',
                    fontWeight: '600',
                  }}
                >
                  + Add Color
                </Button>
              </div>

              {colorVariants.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                  Walay color variants. Click "Add Color" para magdugang.
                </p>
              )}

              {colorVariants.map((variant, index) => (
                <Card key={index} style={{
                  marginBottom: '12px',
                  backgroundColor: 'var(--bg-soft)',
                  border: '1px solid var(--border)',
                }}>
                  <Card.Body>
                    <Row className='align-items-center'>

                      {/* COLOR PREVIEW */}
                      <Col md={1}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: variant.colorHex,
                          border: '2px solid var(--border)',
                        }} />
                      </Col>

                      {/* COLOR NAME */}
                      <Col md={3}>
                        <Form.Control
                          type='text'
                          placeholder='Color name (e.g. Black)'
                          value={variant.colorName}
                          onChange={(e) => updateColorVariant(index, 'colorName', e.target.value)}
                          size='sm'
                        />
                      </Col>

                      {/* COLOR HEX */}
                      <Col md={2}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type='color'
                            value={variant.colorHex}
                            onChange={(e) => updateColorVariant(index, 'colorHex', e.target.value)}
                            style={{
                              width: '36px',
                              height: '36px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: 'transparent',
                            }}
                          />
                          <Form.Control
                            type='text'
                            value={variant.colorHex}
                            onChange={(e) => updateColorVariant(index, 'colorHex', e.target.value)}
                            size='sm'
                            style={{ width: '90px' }}
                          />
                        </div>
                      </Col>

                      {/* COLOR IMAGE URL */}
                      <Col md={3}>
                        <Form.Control
                          type='text'
                          placeholder='Image URL'
                          value={variant.image}
                          onChange={(e) => updateColorVariant(index, 'image', e.target.value)}
                          size='sm'
                        />
                        <Form.Control
                          type='file'
                          onChange={(e) => uploadColorImageHandler(e, index)}
                          size='sm'
                          className='mt-1'
                        />
                      </Col>

                      {/* IMAGE PREVIEW */}
                      <Col md={2}>
                        {variant.image && (
                          <img
                            src={variant.image}
                            alt={variant.colorName}
                            style={{
                              width: '50px',
                              height: '50px',
                              objectFit: 'contain',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                            }}
                          />
                        )}
                      </Col>

                      {/* REMOVE BUTTON */}
                      <Col md={1}>
                        <Button
                          type='button'
                          variant='danger'
                          size='sm'
                          onClick={() => removeColorVariant(index)}
                        >
                          ✕
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>

            {/* UPDATE BUTTON */}
            <Button
              type='submit'
              variant='primary'
              style={{ marginTop: '0.5rem', width: '100%', fontWeight: '700' }}
            >
              Update Product
            </Button>

          </Form>
        )}
      </FormContainer>
    </>
  );
};

export default ProductEditScreen;