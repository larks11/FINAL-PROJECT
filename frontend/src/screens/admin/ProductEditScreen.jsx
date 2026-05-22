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

// ✅ Predefined color palette
const COLOR_PALETTE = [
  { name: 'Black', hex: '#1L1E1E' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Titanium Gray', hex: '#7A7A7A' },
  { name: 'Red', hex: '#E53935' },
  { name: 'Blue', hex: '#1E88E5' },
  { name: 'Sky Blue', hex: '#A8C3D8' },
  { name: 'Navy Blue', hex: '#1A237E' },
  { name: 'Green', hex: '#43A047' },
  { name: 'Mint Green', hex: '#A8D5BA' },
  { name: 'Yellow', hex: '#FDD835' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Pink Gold', hex: '#E5B0A3' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Purple', hex: '#8E24AA' },
  { name: 'Lavender', hex: '#D1C4E9' },
  { name: 'Orange', hex: '#FB8C00' },
  { name: 'Coral', hex: '#FF6F61' },
  { name: 'Midnight Black', hex: '#0D0D0D' },
  { name: 'Starlight', hex: '#F5F0EB' },
  { name: 'Deep Purple', hex: '#311B92' },
  { name: 'Graphite', hex: '#4A4A4A' },
  { name: 'Phantom Black', hex: '#1C1C1E' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Brown', hex: '#795548' },
  { name: 'Lime', hex: '#C6EF3D' },
  { name: 'Cyan', hex: '#00BCD4' },
];

// ✅ Color Picker Modal Component
const ColorPickerModal = ({ show, onSelect, onClose }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', padding: '20px',
        width: '360px', maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h6 style={{ margin: 0, fontWeight: '700' }}>🎨 Select Color</h6>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {COLOR_PALETTE.map((color) => (
            <div
              key={color.hex}
              onClick={() => { onSelect(color); onClose(); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '4px' }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                backgroundColor: color.hex,
                border: '2px solid #ddd',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
              <span style={{ fontSize: '10px', textAlign: 'center', color: '#555', lineHeight: '1.2' }}>{color.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductEditScreen = () => {
  const { id: productId } = useParams();

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState('');
  const [defaultColorName, setDefaultColorName] = useState('');
  const [colorVariants, setColorVariants] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(null); // index or null

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

      {/* ✅ Color Picker Modal */}
      <ColorPickerModal
        show={showColorPicker !== null}
        onSelect={(color) => {
          updateColorVariant(showColorPicker, 'colorName', color.name);
          updateColorVariant(showColorPicker, 'colorHex', color.hex);
        }}
        onClose={() => setShowColorPicker(null)}
      />

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
                    <Row className='align-items-center g-2'>

                      {/* ✅ Color Circle — click to open picker */}
                      <Col xs='auto'>
                        <div
                          onClick={() => setShowColorPicker(index)}
                          title='Click to change color'
                          style={{
                            width: '44px', height: '44px', borderRadius: '50%',
                            backgroundColor: variant.colorHex || '#ccc',
                            border: '3px solid var(--accent)',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            transition: 'transform 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                        <div style={{ fontSize: '9px', textAlign: 'center', color: 'var(--text-muted)', marginTop: '2px' }}>tap to pick</div>
                      </Col>

                      {/* ✅ Color Name (auto-filled, also editable) */}
                      <Col md={3}>
                        <Form.Control
                          type='text' placeholder='Color name'
                          value={variant.colorName}
                          onChange={(e) => updateColorVariant(index, 'colorName', e.target.value)}
                          size='sm'
                        />
                      </Col>

                      {/* ✅ Image URL + Upload */}
                      <Col md={4}>
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

                      {/* ✅ Image Preview */}
                      <Col xs='auto'>
                        {variant.image && (
                          <img src={variant.image} alt={variant.colorName} style={{
                            width: '50px', height: '50px', objectFit: 'contain',
                            borderRadius: '6px', border: '1px solid var(--border)'
                          }} />
                        )}
                      </Col>

                      {/* ✅ Remove Button */}
                      <Col xs='auto'>
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