import { useState, useMemo } from 'react';
import {
  Row, Col, Card, Table, Button, Modal, Form,
  InputGroup, Badge, ProgressBar,
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaSync,
  FaBoxOpen, FaExclamationTriangle, FaTimesCircle,
  FaChartBar, FaFilter,
} from 'react-icons/fa';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { toast } from 'react-toastify';
import {
  useGetInventoryQuery,
  useGetInventoryStatsQuery,
  useGetInventoryCategoriesQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useSyncInventoryStockMutation,
} from '../../slices/productsApiSlice';

const formatPeso = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n ?? 0);

const EMPTY_FORM = {
  productName: '', supplier: '', category: '', sku: '',
  stockQty: '', lowStockThreshold: '5',
  retailPrice: '', wholesalePrice: '', costPrice: '',
  notes: '',
};

const InventoryScreen = () => {
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: items = [], isLoading, error, refetch } = useGetInventoryQuery({
    keyword: searchTerm, category: filterCategory,
  });
  const { data: stats }      = useGetInventoryStatsQuery();
  const { data: categories = [] } = useGetInventoryCategoriesQuery();

  const [createItem, { isLoading: creating }] = useCreateInventoryItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateInventoryItemMutation();
  const [deleteItem]                           = useDeleteInventoryItemMutation();
  const [syncStock, { isLoading: syncing }]    = useSyncInventoryStockMutation();

  // ── Handlers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      productName:       item.productName,
      supplier:          item.supplier,
      category:          item.category,
      sku:               item.sku,
      stockQty:          item.stockQty,
      lowStockThreshold: item.lowStockThreshold,
      retailPrice:       item.retailPrice,
      wholesalePrice:    item.wholesalePrice,
      costPrice:         item.costPrice,
      notes:             item.notes,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.productName || form.retailPrice === '') {
      toast.error('Product name and retail price are required');
      return;
    }
    try {
      if (editItem) {
        await updateItem({ id: editItem._id, ...form }).unwrap();
        toast.success('Inventory item updated!');
      } else {
        await createItem(form).unwrap();
        toast.success('Inventory item created!');
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Error saving item');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete "${name}" from inventory?`)) {
      try {
        await deleteItem(id).unwrap();
        toast.success('Item removed');
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || 'Error deleting item');
      }
    }
  };

  const handleSync = async (id) => {
    try {
      await syncStock(id).unwrap();
      toast.success('Stock synced with product!');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Sync failed');
    }
  };

  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // ── Filter by status ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (filterStatus === 'soldout')  return items.filter((i) => i.stockQty === 0);
    if (filterStatus === 'lowstock') return items.filter((i) => i.stockQty > 0 && i.stockQty <= i.lowStockThreshold);
    if (filterStatus === 'ok')       return items.filter((i) => i.stockQty > i.lowStockThreshold);
    return items;
  }, [items, filterStatus]);

  // ── Stock badge ────────────────────────────────────────────────────────
  const StockBadge = ({ item }) => {
    if (item.stockQty === 0)
      return <Badge bg='danger'>Sold Out</Badge>;
    if (item.stockQty <= item.lowStockThreshold)
      return <Badge bg='warning' text='dark'>Low Stock</Badge>;
    return <Badge bg='success'>In Stock</Badge>;
  };

  // ── Stock bar color ────────────────────────────────────────────────────
  const stockBarVariant = (item) => {
    if (item.stockQty === 0) return 'danger';
    if (item.stockQty <= item.lowStockThreshold) return 'warning';
    return 'success';
  };

  return (
    <>
      {/* ── HEADER ── */}
      <Row className='align-items-center mb-3'>
        <Col>
          <h1 style={{ color: 'var(--accent)', fontWeight: '800' }}>
            📦 Inventory
          </h1>
        </Col>
        <Col className='text-end'>
          <Button
            onClick={openCreate}
            style={{
              backgroundColor: 'var(--accent)',
              border: 'none', color: '#000',
              fontWeight: '700', borderRadius: '8px',
            }}
          >
            <FaPlus /> Add Item
          </Button>
        </Col>
      </Row>

      {/* ── STAT CARDS ── */}
      {stats && (
        <Row className='g-3 mb-4'>
          {[
            {
              label: 'Total Items',
              value: stats.totalItems,
              icon: <FaBoxOpen />, color: 'var(--accent)',
            },
            {
              label: 'Low Stock',
              value: stats.lowStockItems,
              icon: <FaExclamationTriangle />, color: '#e67e22',
            },
            {
              label: 'Sold Out',
              value: stats.soldOutItems,
              icon: <FaTimesCircle />, color: '#e74c3c',
            },
            {
              label: 'Stock Value (Cost)',
              value: formatPeso(stats.totalStockValue),
              icon: <FaChartBar />, color: '#2ecc71',
              small: true,
            },
            {
              label: 'Retail Value',
              value: formatPeso(stats.totalRetailValue),
              icon: <FaChartBar />, color: '#3498db',
              small: true,
            },
          ].map(({ label, value, icon, color, small }) => (
            <Col key={label} xs={6} md={4} lg={true}>
              <Card style={{
                border: `1px solid ${color}33`,
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                height: '100%',
              }}>
                <Card.Body style={{ padding: '16px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: '10px', marginBottom: '6px',
                  }}>
                    <span style={{ color, fontSize: '18px' }}>{icon}</span>
                    <span style={{
                      fontSize: '11px', color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {label}
                    </span>
                  </div>
                  <div style={{
                    fontWeight: '800', color,
                    fontSize: small ? '15px' : '26px',
                  }}>
                    {value}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ── FILTERS ── */}
      <Row className='g-2 mb-3'>
        <Col md={5}>
          <InputGroup>
            <InputGroup.Text style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
              <FaSearch style={{ color: 'var(--text-muted)' }} />
            </InputGroup.Text>
            <Form.Control
              placeholder='Search product, supplier, SKU...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            />
            {searchTerm && (
              <Button variant='outline-secondary' onClick={() => setSearchTerm('')}>✕</Button>
            )}
          </InputGroup>
        </Col>

        <Col md={3}>
          <InputGroup>
            <InputGroup.Text style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
              <FaFilter style={{ color: 'var(--text-muted)' }} />
            </InputGroup.Text>
            <Form.Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
            >
              <option value=''>All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Form.Select>
          </InputGroup>
        </Col>

        <Col md={4}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'ok', 'lowstock', 'soldout'].map((s) => (
              <Button
                key={s}
                size='sm'
                onClick={() => setFilterStatus(s)}
                style={{
                  flex: 1,
                  fontWeight: '600',
                  fontSize: '11px',
                  borderRadius: '8px',
                  backgroundColor: filterStatus === s
                    ? (s === 'soldout' ? '#e74c3c' : s === 'lowstock' ? '#e67e22' : s === 'ok' ? '#2ecc71' : 'var(--accent)')
                    : 'transparent',
                  color: filterStatus === s ? '#000' : 'var(--text-muted)',
                  border: `1px solid ${
                    s === 'soldout' ? '#e74c3c' : s === 'lowstock' ? '#e67e22' : s === 'ok' ? '#2ecc71' : 'var(--accent)'
                  }`,
                }}
              >
                {s === 'all' ? 'All' : s === 'ok' ? 'In Stock' : s === 'lowstock' ? 'Low' : 'Sold Out'}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      {/* ── TABLE ── */}
      {isLoading ? <Loader /> : error ? (
        <Message variant='danger'>{error?.data?.message}</Message>
      ) : (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          <Table responsive hover style={{ margin: 0 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-soft)', borderBottom: '2px solid var(--border)' }}>
                {['#', 'Product', 'Supplier', 'Category', 'SKU', 'Stock', 'Retail Price', 'Wholesale', 'Cost', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 14px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--text-muted)',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    border: 'none',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan='11' style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item._id} style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s',
                  }}>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13px' }}>
                        {item.productName}
                      </div>
                      {item.notes && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {item.supplier || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                      {item.category ? (
                        <span style={{
                          backgroundColor: 'rgba(212,175,55,0.12)',
                          color: 'var(--accent)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}>
                          {item.category}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {item.sku || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontWeight: '800', fontSize: '14px',
                          color: item.stockQty === 0 ? '#e74c3c'
                            : item.stockQty <= item.lowStockThreshold ? '#e67e22' : '#2ecc71',
                        }}>
                          {item.stockQty}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          / min {item.lowStockThreshold}
                        </span>
                      </div>
                      <ProgressBar
                        now={Math.min((item.stockQty / Math.max(item.lowStockThreshold * 4, 1)) * 100, 100)}
                        variant={stockBarVariant(item)}
                        style={{ height: '4px', borderRadius: '4px' }}
                      />
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--accent)', fontSize: '13px' }}>
                      {formatPeso(item.retailPrice)}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {item.wholesalePrice ? formatPeso(item.wholesalePrice) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {item.costPrice ? formatPeso(item.costPrice) : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <StockBadge item={item} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                        <Button
                          size='sm' variant='outline-warning'
                          title='Edit'
                          onClick={() => openEdit(item)}
                          style={{ borderRadius: '6px', padding: '4px 8px' }}
                        >
                          <FaEdit />
                        </Button>
                        {item.product && (
                          <Button
                            size='sm' variant='outline-info'
                            title='Sync stock from product'
                            onClick={() => handleSync(item._id)}
                            disabled={syncing}
                            style={{ borderRadius: '6px', padding: '4px 8px' }}
                          >
                            <FaSync />
                          </Button>
                        )}
                        <Button
                          size='sm' variant='outline-danger'
                          title='Delete'
                          onClick={() => handleDelete(item._id, item.productName)}
                          style={{ borderRadius: '6px', padding: '4px 8px' }}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT ── */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size='lg' centered
      >
        <Modal.Header closeButton style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <Modal.Title style={{ color: 'var(--accent)', fontWeight: '700' }}>
            {editItem ? '✏️ Edit Inventory Item' : '➕ Add Inventory Item'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ backgroundColor: 'var(--bg-card)', maxHeight: '70vh', overflowY: 'auto' }}>
          <Row className='g-3'>
            {/* Product Name */}
            <Col md={8}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>
                  Product Name <span style={{ color: '#e74c3c' }}>*</span>
                </Form.Label>
                <Form.Control
                  value={form.productName} onChange={f('productName')}
                  placeholder='Enter product name'
                  style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
              </Form.Group>
            </Col>

            {/* SKU */}
            <Col md={4}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>SKU</Form.Label>
                <Form.Control
                  value={form.sku} onChange={f('sku')}
                  placeholder='e.g. IPH-15-BLK'
                  style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
              </Form.Group>
            </Col>

            {/* Supplier */}
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Supplier</Form.Label>
                <Form.Control
                  value={form.supplier} onChange={f('supplier')}
                  placeholder='e.g. Samsung Philippines'
                  style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
              </Form.Group>
            </Col>

            {/* Category */}
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Category</Form.Label>
                <Form.Control
                  value={form.category} onChange={f('category')}
                  placeholder='e.g. PHONES, LAPTOP'
                  list='category-list'
                  style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
                <datalist id='category-list'>
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </Form.Group>
            </Col>

            {/* Divider */}
            <Col xs={12}>
              <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                📊 STOCK SETTINGS
              </div>
            </Col>

            {/* Stock Qty */}
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>
                  Stock Quantity <span style={{ color: '#e74c3c' }}>*</span>
                </Form.Label>
                <Form.Control
                  type='number' min='0'
                  value={form.stockQty} onChange={f('stockQty')}
                  placeholder='0'
                  style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
              </Form.Group>
            </Col>

            {/* Low Stock Threshold */}
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>
                  Low Stock Warning Threshold
                </Form.Label>
                <Form.Control
                  type='number' min='1'
                  value={form.lowStockThreshold} onChange={f('lowStockThreshold')}
                  placeholder='5'
                  style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
                <Form.Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  Warning badge mag-appear kung stock ≤ kini nga number
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Divider */}
            <Col xs={12}>
              <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '4px' }}>
                💰 PRICING
              </div>
            </Col>

            {/* Retail Price */}
            <Col md={4}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>
                  Retail Price (₱) <span style={{ color: '#e74c3c' }}>*</span>
                </Form.Label>
                <Form.Control
                  type='number' min='0'
                  value={form.retailPrice} onChange={f('retailPrice')}
                  placeholder='0.00'
                  style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
              </Form.Group>
            </Col>

            {/* Wholesale Price */}
            <Col md={4}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Wholesale Price (₱)</Form.Label>
                <Form.Control
                  type='number' min='0'
                  value={form.wholesalePrice} onChange={f('wholesalePrice')}
                  placeholder='0.00'
                  style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
              </Form.Group>
            </Col>

            {/* Cost Price */}
            <Col md={4}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Cost Price (₱)</Form.Label>
                <Form.Control
                  type='number' min='0'
                  value={form.costPrice} onChange={f('costPrice')}
                  placeholder='0.00'
                  style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
                <Form.Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  Used for stock value calculation
                </Form.Text>
              </Form.Group>
            </Col>

            {/* Notes */}
            <Col xs={12}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Notes</Form.Label>
                <Form.Control
                  as='textarea' rows={2}
                  value={form.notes} onChange={f('notes')}
                  placeholder='Optional notes about this item...'
                  style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
          <Button variant='secondary' onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={creating || updating}
            style={{
              backgroundColor: 'var(--accent)',
              border: 'none', color: '#000', fontWeight: '700',
            }}
          >
            {creating || updating ? 'Saving...' : editItem ? 'Update Item' : 'Add Item'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InventoryScreen;