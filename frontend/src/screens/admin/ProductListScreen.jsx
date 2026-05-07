import { useState } from 'react';
import { Table, Button, Row, Col, Modal, Form, InputGroup, Badge, Card } from 'react-bootstrap';
import { FaEdit, FaPlus, FaSearch, FaArchive, FaBoxOpen } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import Message from '../../components/Message';
import Loader from '../../components/Loader';
import Paginate from '../../components/Paginate';
import {
  useGetAdminProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadProductImageMutation,
  useToggleArchiveProductMutation,
} from '../../slices/productsApiSlice';
import { toast } from 'react-toastify';

const ProductListScreen = () => {
  const { pageNumber } = useParams();
  const { data, isLoading, error, refetch } = useGetAdminProductsQuery({ pageNumber });

  const [createProduct, { isLoading: loadingCreate }] = useCreateProductMutation();
  const [updateProduct, { isLoading: loadingUpdate }] = useUpdateProductMutation();
  const [uploadProductImage, { isLoading: loadingUpload }] = useUploadProductImageMutation();
  const [toggleArchive, { isLoading: loadingArchive }] = useToggleArchiveProductMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [countInStock, setCountInStock] = useState('');
  const [description, setDescription] = useState('');
  // ✅ Default color name field
  const [defaultColorName, setDefaultColorName] = useState('');
  const [colorVariants, setColorVariants] = useState([]);

  const resetForm = () => {
    setName(''); setPrice(''); setImage('');
    setBrand(''); setCategory('');
    setCountInStock(''); setDescription('');
    setDefaultColorName('');
    setColorVariants([]);
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

  const addColorVariant = () => {
    setColorVariants([...colorVariants, { colorName: '', colorHex: '#000000', image: '' }]);
  };

  const removeColorVariant = (index) => {
    setColorVariants(colorVariants.filter((_, i) => i !== index));
  };

  const updateColorVariant = (index, field, value) => {
    setColorVariants(colorVariants.map((v, i) => i === index ? { ...v, [field]: value } : v));
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
        name, price: Number(price), image, brand,
        category, countInStock: Number(countInStock),
        description,
        defaultColorName: defaultColorName || 'Default',
        colorVariants,
      }).unwrap();
      toast.success('Product created successfully!');
      setShowModal(false);
      resetForm();
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const archiveHandler = async (id, isArchived, productName) => {
    const action = isArchived ? 'unarchive' : 'archive';
    if (window.confirm(`Are you sure you want to ${action} "${productName}"?`)) {
      try {
        await toggleArchive(id).unwrap();
        toast.success(`Product ${action}d successfully`);
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const allProducts = data?.products || [];
  const filteredProducts = allProducts
    .filter((p) => showArchived ? p.isArchived : !p.isArchived)
    .filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const soldOutCount = allProducts.filter((p) => p.countInStock === 0).length;
  const archivedCount = allProducts.filter((p) => p.isArchived).length;

  return (
    <>
      <Row className='align-items-center'>
        <Col>
          <h1>
            Products{' '}
            {soldOutCount > 0 && (
              <Badge bg='danger' style={{ fontSize: '13px', marginLeft: '8px' }}>
                {soldOutCount} Sold Out
              </Badge>
            )}
          </h1>
        </Col>
        <Col className='text-end'>
          <Button className='my-3' onClick={() => setShowModal(true)}>
            <FaPlus /> Create Product
          </Button>
        </Col>
      </Row>

      <Row className='mb-3'>
        <Col>
          <Button
            variant={showArchived ? 'warning' : 'outline-secondary'}
            size='sm'
            onClick={() => setShowArchived(!showArchived)}
            style={{ marginRight: '10px' }}
          >
            {showArchived
              ? <><FaBoxOpen /> Show Active</>
              : <><FaArchive /> Show Archived ({archivedCount})</>
            }
          </Button>
          {showArchived && (
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Viewing archived/sold-out products — hidden from homepage
            </span>
          )}
        </Col>
      </Row>

      <Row className='mb-3'>
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              type='text'
              placeholder='Search by name, category, or brand...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button variant='outline-secondary' onClick={() => setSearchTerm('')}>Clear</Button>
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

      {(loadingCreate || loadingUpdate || loadingArchive) && <Loader />}

      {isLoading ? <Loader /> : error ? (
        <Message variant='danger'>{error?.data?.message}</Message>
      ) : (
        <>
          <Table striped bordered hover responsive className='table-sm'>
            <thead>
              <tr>
                <th>#</th>
                <th>NAME</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>CATEGORY</th>
                <th>BRAND</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <tr key={product._id} style={{ opacity: product.isArchived ? 0.6 : 1 }}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>
                      {index + 1}
                    </td>
                    <td>{product.name}</td>
                    <td>₱{product.price.toLocaleString('en-PH')}</td>
                    <td>
                      <span style={{
                        fontWeight: '700',
                        color: product.countInStock === 0 ? '#e74c3c'
                          : product.countInStock <= 5 ? '#e67e22' : '#2ecc71',
                      }}>
                        {product.countInStock === 0 ? 'SOLD OUT' : product.countInStock}
                      </span>
                    </td>
                    <td>{product.category}</td>
                    <td>{product.brand}</td>
                    <td>
                      {product.isArchived ? (
                        <Badge bg='secondary'>Archived</Badge>
                      ) : product.countInStock === 0 ? (
                        <Badge bg='danger'>Sold Out</Badge>
                      ) : product.countInStock <= 5 ? (
                        <Badge bg='warning' text='dark'>Low Stock</Badge>
                      ) : (
                        <Badge bg='success'>Active</Badge>
                      )}
                    </td>
                    <td>
                      <Button as={Link} to={`/admin/product/${product._id}/edit`}
                        variant='light' className='btn-sm mx-1' title='Edit'>
                        <FaEdit />
                      </Button>
                      <Button
                        variant={product.isArchived ? 'outline-success' : 'outline-warning'}
                        className='btn-sm mx-1'
                        onClick={() => archiveHandler(product._id, product.isArchived, product.name)}
                        title={product.isArchived ? 'Unarchive' : 'Archive'}
                      >
                        {product.isArchived ? <FaBoxOpen /> : <FaArchive />}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan='8' className='text-center'>
                    {searchTerm ? `No products found matching "${searchTerm}"` : 'No products'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {!searchTerm && (
            <Paginate pages={data.pages} page={data.page} isAdmin={true} />
          )}
        </>
      )}

      {/* CREATE PRODUCT MODAL */}
      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size='lg' centered>
        <Modal.Header closeButton>
          <Modal.Title><FaPlus /> Create New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className='mb-3'>
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control type='text' placeholder='Enter product name' value={name} onChange={(e) => setName(e.target.value)} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className='mb-3'>
                  <Form.Label>Price (₱)</Form.Label>
                  <Form.Control type='number' placeholder='Enter price' value={price} onChange={(e) => setPrice(e.target.value)} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className='mb-3'>
              <Form.Label>Image</Form.Label>
              <Form.Control type='text' placeholder='Image URL' value={image} onChange={(e) => setImage(e.target.value)} className='mb-2' />
              <Form.Control type='file' onChange={uploadFileHandler} />
              {loadingUpload && <Loader />}
              {image && (
                <img src={image} alt='preview' style={{ marginTop: '10px', height: '100px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px' }} />
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className='mb-3'>
                  <Form.Label>Brand</Form.Label>
                  <Form.Control type='text' placeholder='Enter brand' value={brand} onChange={(e) => setBrand(e.target.value)} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className='mb-3'>
                  <Form.Label>Category</Form.Label>
                  <Form.Control type='text' placeholder='e.g. PHONES, LAPTOP' value={category} onChange={(e) => setCategory(e.target.value)} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className='mb-3'>
              <Form.Label>Count In Stock</Form.Label>
              <Form.Control type='number' placeholder='Enter stock quantity' value={countInStock} onChange={(e) => setCountInStock(e.target.value)} />
            </Form.Group>

            <Form.Group className='mb-3'>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as='textarea' rows={4}
                placeholder={'Enter product description...\n\nTip: Press Enter para ma-separate ang bawat spec line.'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
              <Form.Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                💡 Pwede mag-Enter para mag-line break. Example: "Display: 6.5 inch\nRAM: 8GB\nStorage: 256GB"
              </Form.Text>
            </Form.Group>

            {/* ✅ COLOR VARIANTS SECTION */}
            <div style={{
              border: '1px solid var(--accent-dark)',
              borderRadius: '10px',
              padding: '16px',
              backgroundColor: 'rgba(212,175,55,0.04)',
            }}>
              <h6 style={{ color: 'var(--accent)', marginBottom: '14px' }}>
                🎨 Color Variants <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(optional)</span>
              </h6>

              {/* ✅ DEFAULT COLOR NAME FIELD */}
              <Form.Group className='mb-3'>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                  Main / Default Color Name
                </Form.Label>
                <Form.Control
                  type='text'
                  size='sm'
                  placeholder='e.g. Titanium Grey, Midnight Black, Starlight...'
                  value={defaultColorName}
                  onChange={(e) => setDefaultColorName(e.target.value)}
                />
                <Form.Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  💡 Kini ang pangalan sa main image / default na makita sa product.
                </Form.Text>
              </Form.Group>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <Button
                  type='button' size='sm'
                  onClick={addColorVariant}
                  style={{ backgroundColor: 'var(--accent)', border: 'none', color: '#000', fontWeight: '600' }}
                >
                  + Add Color Variant
                </Button>
              </div>

              {colorVariants.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', margin: 0 }}>
                  Walay additional color variants.
                </p>
              )}

              {colorVariants.map((variant, index) => (
                <Card key={index} style={{ marginBottom: '10px', backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
                  <Card.Body className='py-2'>
                    <Row className='align-items-center g-2'>
                      <Col md={1}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: variant.colorHex, border: '2px solid var(--border)' }} />
                      </Col>
                      <Col md={3}>
                        <Form.Control
                          type='text' size='sm'
                          placeholder='Color name'
                          value={variant.colorName}
                          onChange={(e) => updateColorVariant(index, 'colorName', e.target.value)}
                        />
                      </Col>
                      <Col md={2}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type='color'
                            value={variant.colorHex}
                            onChange={(e) => updateColorVariant(index, 'colorHex', e.target.value)}
                            style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          />
                          <Form.Control
                            type='text' size='sm'
                            value={variant.colorHex}
                            onChange={(e) => updateColorVariant(index, 'colorHex', e.target.value)}
                            style={{ width: '80px' }}
                          />
                        </div>
                      </Col>
                      <Col md={4}>
                        <Form.Control
                          type='text' size='sm'
                          placeholder='Image URL'
                          value={variant.image}
                          onChange={(e) => updateColorVariant(index, 'image', e.target.value)}
                          className='mb-1'
                        />
                        <Form.Control
                          type='file' size='sm'
                          onChange={(e) => uploadColorImageHandler(e, index)}
                        />
                      </Col>
                      <Col md={1}>
                        {variant.image && (
                          <img src={variant.image} alt='preview' style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)' }} />
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
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
          <Button variant='primary' onClick={createProductHandler} disabled={loadingCreate || loadingUpdate || loadingUpload}>
            {loadingCreate || loadingUpdate ? 'Creating...' : 'Create Product'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProductListScreen;