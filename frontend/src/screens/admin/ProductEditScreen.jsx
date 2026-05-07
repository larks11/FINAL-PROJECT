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
  // ✅ Default color name
  const [defaultColorName, setDefaultColorName] = useState('');
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
      setDefaultColorName(product.defaultColorName || '');
      setColorVariants(product.colorVariants || []);
    }
  }, [product]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await updateProduct({
        productId, name, price, image, brand,
        category, description, countInStock,
        defaultColorName: defaultColorName || 'Default',
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

  const addColorVariant = () => {
    setColorVariants([...colorVariants, { colorName: '', colorHex: '#000000', image: '' }]);
  };

  const removeColorVariant = (index) => {
    setColorVariants(colorVariants.filter((_, i) => i !== index));
  };

  const updateColorVariant = (index, field, value) => {
    setColorVariants(colorVariants.map((v, i) => i === index ? { ...v, [field]: value } : v));
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
      <Link to='/admin/productlist' className='btn btn-light my-3'>Go Back</Link>
      <FormContainer>
        <h1>Edit Product</h1>
        {loadingUpdate && <Loader />}
        {isLoading ? <Loader /> : error ? (
          <Message variant='danger'>{error.data.message}</Message>
        ) : (
          <Form onSubmit={submitHandler}>

            <Form.Group controlId='name' className='mb-3'>
              <Form.Label>Name</Form.Label>
              <Form.Control type='text' placeholder='Enter name' value={name} onChange={(e) => setName(e.target.value)} />
            </Form.Group>

            <Form.Group controlId='price' className='mb-3'>
              <Form.Label>Price</Form.Label>
              <Form.Control type='number' placeholder='Enter price' value={price} onChange={(e) => setPrice(e.target.value)} />
            </Form.Group>

            <Form.Group controlId='image' className='mb-3'>
              <Form.Label>Image</Form.Label>
              <Form.Control type='text' placeholder='Enter image url' value={image} onChange={(e) => setImage(e.target.value)} />
              <Form.Control type='file' onChange={uploadFileHandler} className='mt-2' />
              {loadingUpload && <Loader />}
              {image && (
                <img src={image} alt='preview' style={{ marginTop: '8px', height: '80px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '6px' }} />
              )}
            </Form.Group>

            <Form.Group controlId='brand' className='mb-3'>
              <Form.Label>Brand</Form.Label>
              <Form.Control type='text' placeholder='Enter brand' value={brand} onChange={(e) => setBrand(e.target.value)} />
            </Form.Group>

            <Form.Group controlId='countInStock' className='mb-3'>
              <Form.Label>Count In Stock</Form.Label>
              <Form.Control type='number' placeholder='Enter countInStock' value={countInStock} onChange={(e) => setCountInStock(e.target.value)} />
            </Form.Group>

            <Form.Group controlId='category' className='mb-3'>
              <Form.Label>Category</Form.Label>
              <Form.Control type='text' placeholder='Enter category' value={category} onChange={(e) => setCategory(e.target.value)} />
            </Form.Group>

            <Form.Group controlId='description' className='mb-3'>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as='textarea' rows={6}
                placeholder={'Enter product description...\n\nExample:\nDisplay: 6.5 inch AMOLED\nRAM: 8GB\nStorage: 256GB\nBattery: 5000mAh'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}
              />
              <Form.Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                💡 Mag-Enter para mag-line break. Matag spec sa lain-laing linya para limpyo ang display.
              </Form.Text>
            </Form.Group>

            {/* ✅ COLOR VARIANTS SECTION */}
            <div style={{
              border: '1px solid var(--accent-dark)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '20px',
              backgroundColor: 'rgba(212,175,55,0.04)',
            }}>
              <h5 style={{ color: 'var(--accent)', marginBottom: '14px' }}>🎨 Color Variants</h5>

              {/* ✅ DEFAULT COLOR NAME */}
              <Form.Group className='mb-3'>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                  Main / Default Color Name
                </Form.Label>
                <Form.Control
                  type='text'
                  placeholder='e.g. Titanium Grey, Midnight Black, Starlight...'
                  value={defaultColorName}
                  onChange={(e) => setDefaultColorName(e.target.value)}
                />
                <Form.Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  💡 Kini ang pangalan sa main image / default color sa product.
                </Form.Text>
              </Form.Group>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <Button
                  type='button' size='sm' onClick={addColorVariant}
                  style={{ backgroundColor: 'var(--accent)', border: 'none', color: '#000', fontWeight: '600' }}
                >
                  + Add Color Variant
                </Button>
              </div>

              {colorVariants.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                  Walay additional color variants.
                </p>
              )}

              {colorVariants.map((variant, index) => (
                <Card key={index} style={{ marginBottom: '12px', backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
                  <Card.Body>
                    <Row className='align-items-center'>
                      <Col md={1}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: variant.colorHex, border: '2px solid var(--border)' }} />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          type='text' placeholder='Color name (e.g. Black)'
                          value={variant.colorName}
                          onChange={(e) => updateColorVariant(index, 'colorName', e.target.value)}
                          size='sm'
                        />
                      </Col>
                      <Col md={2}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type='color' value={variant.colorHex}
                            onChange={(e) => updateColorVariant(index, 'colorHex', e.target.value)}
                            style={{ width: '36px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          />
                          <Form.Control
                            type='text' value={variant.colorHex}
                            onChange={(e) => updateColorVariant(index, 'colorHex', e.target.value)}
                            size='sm' style={{ width: '90px' }}
                          />
                        </div>
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          type='text' placeholder='Image URL'
                          value={variant.image}
                          onChange={(e) => updateColorVariant(index, 'image', e.target.value)}
                          size='sm'
                        />
                        <Form.Control
                          type='file'
                          onChange={(e) => uploadColorImageHandler(e, index)}
                          size='sm' className='mt-1'
                        />
                      </Col>
                      <Col md={2}>
                        {variant.image && (
                          <img src={variant.image} alt={variant.colorName} style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '6px', border: '1px solid var(--border)' }} />
                        )}
                      </Col>
                      <Col md={1}>
                        <Button type='button' variant='danger' size='sm' onClick={() => removeColorVariant(index)}>✕</Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>

            <Button type='submit' variant='primary' style={{ width: '100%', fontWeight: '700' }}>
              Update Product
            </Button>
          </Form>
        )}
      </FormContainer>
    </>
  );
};

export default ProductEditScreen;