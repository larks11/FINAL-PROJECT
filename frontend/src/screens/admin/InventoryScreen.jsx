import { useState, useMemo } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, InputGroup, Badge, ProgressBar } from 'react-bootstrap';
import { FaSearch, FaSync, FaBoxOpen, FaExclamationTriangle, FaTimesCircle, FaChartBar, FaFilter, FaHistory, FaEdit } from 'react-icons/fa';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { toast } from 'react-toastify';
import {
  useGetInventoryQuery,
  useGetInventoryStatsQuery,
  useGetInventoryCategoriesQuery,
  useUpdateInventoryItemMutation,
  useSyncInventoryStockMutation,
  useRestockItemMutation,
  useGetStockHistoryQuery,
} from '../../slices/productsApiSlice';

const formatPeso = (n) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n ?? 0);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', {
  month: 'short', day: 'numeric', year: 'numeric',
}) : '—';

const InventoryScreen = () => {
  const [searchTerm,      setSearchTerm]      = useState('');
  const [filterCategory,  setFilterCategory]  = useState('');
  const [filterStatus,    setFilterStatus]    = useState('all');

  // Restock modal
  const [showRestock,     setShowRestock]     = useState(false);
  const [restockItem,     setRestockItemSel]  = useState(null);
  const [restockQty,      setRestockQty]      = useState('');
  const [restockNote,     setRestockNote]     = useState('');
  const [restockSupplier, setRestockSupplier] = useState('');

  // Edit modal
  const [showEdit,  setShowEdit]  = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [editForm,  setEditForm]  = useState({});

  // History modal
  const [showHistory,   setShowHistory]   = useState(false);
  const [historyItemId, setHistoryItemId] = useState(null);

  const { data: items = [], isLoading, error, refetch } = useGetInventoryQuery({
    keyword: searchTerm, category: filterCategory,
  });
  const { data: stats }           = useGetInventoryStatsQuery();
  const { data: categories = [] } = useGetInventoryCategoriesQuery();
  const { data: history = [] }    = useGetStockHistoryQuery(historyItemId, { skip: !historyItemId });

  const [updateItem,  { isLoading: updating }]  = useUpdateInventoryItemMutation();
  const [syncStock,   { isLoading: syncing }]   = useSyncInventoryStockMutation();
  const [doRestock,   { isLoading: restocking }] = useRestockItemMutation();

  // ── Restock ────────────────────────────────────────────────────────────
  const openRestock = (item) => {
    setRestockItemSel(item);
    setRestockQty('');
    setRestockNote('');
    setRestockSupplier(item.supplier || '');
    setShowRestock(true);
  };

  const handleRestock = async () => {
    if (!restockQty || Number(restockQty) <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    try {
      await doRestock({
        id:       restockItem._id,
        qty:      Number(restockQty),
        note:     restockNote,
        supplier: restockSupplier,
      }).unwrap();
      toast.success(`+${restockQty} stock added to ${restockItem.productName}`);
      setShowRestock(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Restock failed');
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────
  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({
      supplier:          item.supplier          || '',
      sku:               item.sku               || '',
      lowStockThreshold: item.lowStockThreshold || 5,
      retailPrice:       item.retailPrice       || 0,
      wholesalePrice:    item.wholesalePrice    || 0,
      costPrice:         item.costPrice         || 0,
      notes:             item.notes             || '',
    });
    setShowEdit(true);
  };

  const handleEditSave = async () => {
    try {
      await updateItem({ id: editItem._id, ...editForm }).unwrap();
      toast.success('Inventory updated!');
      setShowEdit(false);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed');
    }
  };

  const ef = (field) => (e) => setEditForm({ ...editForm, [field]: e.target.value });

  // ── Delete ─────────────────────────────────────────────────────────────
  

  // ── Sync ───────────────────────────────────────────────────────────────
  const handleSync = async (id) => {
    try {
      await syncStock(id).unwrap();
      toast.success('Stock synced!');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Sync failed');
    }
  };

  // ── Status badge ───────────────────────────────────────────────────────
  const StatusBadge = ({ item }) => {
    const avail = Math.max(0, item.stockQty - (item.reservedStock || 0));
    if (item.stockQty === 0 && (item.reservedStock || 0) === 0)
      return <Badge bg='danger' style={{ fontSize: '11px' }}>Sold Out</Badge>;
    if ((item.reservedStock || 0) > 0 && avail === 0)
      return <Badge bg='warning' text='dark' style={{ fontSize: '11px' }}>Reserved</Badge>;
    if (item.stockQty <= item.lowStockThreshold)
      return <Badge bg='warning' text='dark' style={{ fontSize: '11px' }}>Low Stock</Badge>;
    return <Badge bg='success' style={{ fontSize: '11px' }}>In Stock</Badge>;
  };

  // ── Filter ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = items;
    if (filterStatus === 'soldout')  list = list.filter((i) => i.stockQty === 0);
    if (filterStatus === 'lowstock') list = list.filter((i) => i.stockQty > 0 && i.stockQty <= i.lowStockThreshold);
    if (filterStatus === 'ok')       list = list.filter((i) => i.stockQty > i.lowStockThreshold);
    return list;
  }, [items, filterStatus]);

  const inputStyle = {
    backgroundColor: 'var(--bg-soft)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: 'var(--accent)', fontWeight: '800', margin: 0 }}>📦 Inventory</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>
            Stock management — create products in Products page
          </p>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      {stats && (
        <Row className='g-3 mb-4'>
          {[
            { label: 'Total Items',       value: stats.totalItems,                  icon: <FaBoxOpen />,            color: 'var(--accent)' },
            { label: 'Low Stock',         value: stats.lowStockItems,               icon: <FaExclamationTriangle />, color: '#e67e22' },
            { label: 'Sold Out',          value: stats.soldOutItems,                icon: <FaTimesCircle />,         color: '#e74c3c' },
            { label: 'Stock Value (Cost)',value: formatPeso(stats.totalStockValue),  icon: <FaChartBar />,            color: '#2ecc71', small: true },
            { label: 'Retail Value',      value: formatPeso(stats.totalRetailValue), icon: <FaChartBar />,           color: '#3498db', small: true },
          ].map(({ label, value, icon, color, small }) => (
            <Col key={label} xs={6} md={4} lg={true}>
              <Card style={{ border: `1px solid ${color}33`, backgroundColor: 'var(--bg-card)', borderRadius: '12px', height: '100%' }}>
                <Card.Body style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ color, fontSize: '16px' }}>{icon}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                  </div>
                  <div style={{ fontWeight: '800', color, fontSize: small ? '14px' : '24px' }}>{value}</div>
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
              style={inputStyle}
            />
            {searchTerm && <Button variant='outline-secondary' onClick={() => setSearchTerm('')}>✕</Button>}
          </InputGroup>
        </Col>
        <Col md={3}>
          <InputGroup>
            <InputGroup.Text style={{ backgroundColor: 'var(--bg-soft)', border: '1px solid var(--border)' }}>
              <FaFilter style={{ color: 'var(--text-muted)' }} />
            </InputGroup.Text>
            <Form.Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={inputStyle}>
              <option value=''>All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Form.Select>
          </InputGroup>
        </Col>
        <Col md={4}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'ok', 'lowstock', 'soldout'].map((s) => (
              <Button key={s} size='sm' onClick={() => setFilterStatus(s)} style={{
                flex: 1, fontWeight: '600', fontSize: '11px', borderRadius: '8px',
                backgroundColor: filterStatus === s
                  ? (s === 'soldout' ? '#e74c3c' : s === 'lowstock' ? '#e67e22' : s === 'ok' ? '#2ecc71' : 'var(--accent)')
                  : 'transparent',
                color: filterStatus === s ? '#000' : 'var(--text-muted)',
                border: `1px solid ${s === 'soldout' ? '#e74c3c' : s === 'lowstock' ? '#e67e22' : s === 'ok' ? '#2ecc71' : 'var(--accent)'}`,
              }}>
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
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <Table responsive hover style={{ margin: 0 }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-soft)', borderBottom: '2px solid var(--border)' }}>
                {['#', 'Product', 'SKU', 'Stock', 'Reserved', 'Available', 'Supplier', 'Last Restock', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{
                    padding: '12px 14px', fontSize: '11px',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    color: 'var(--text-muted)', fontWeight: '700',
                    whiteSpace: 'nowrap', border: 'none',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan='10' style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const reserved  = item.reservedStock || 0;
                  const available = Math.max(0, item.stockQty - reserved);
                  return (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '13px' }}>{idx + 1}</td>

                      {/* Product Name */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13px' }}>
                          {item.productName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px' }}>
                          {item.category || '—'}
                        </div>
                      </td>

                      {/* SKU */}
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {item.sku || '—'}
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '12px 14px', minWidth: '100px' }}>
                        <div style={{
                          fontWeight: '800', fontSize: '16px',
                          color: item.stockQty === 0 ? '#e74c3c'
                            : item.stockQty <= item.lowStockThreshold ? '#e67e22' : '#2ecc71',
                        }}>
                          {item.stockQty}
                        </div>
                        <ProgressBar
                          now={Math.min((item.stockQty / Math.max(item.lowStockThreshold * 4, 1)) * 100, 100)}
                          variant={item.stockQty === 0 ? 'danger' : item.stockQty <= item.lowStockThreshold ? 'warning' : 'success'}
                          style={{ height: '4px', borderRadius: '4px', marginTop: '4px' }}
                        />
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          min {item.lowStockThreshold}
                        </div>
                      </td>

                      {/* Reserved */}
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: reserved > 0 ? '#e67e22' : 'var(--text-muted)', fontWeight: reserved > 0 ? '700' : '400' }}>
                        {reserved > 0 ? `🔒 ${reserved}` : '—'}
                      </td>

                      {/* Available */}
                      <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: '700', color: available === 0 ? '#e74c3c' : '#2ecc71' }}>
                        {available}
                      </td>

                      {/* Supplier */}
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {item.supplier || '—'}
                      </td>

                      {/* Last Restock */}
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(item.lastRestockDate)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge item={item} />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                          {/* Restock */}
                          <Button size='sm' title='Restock / Add Stock'
                            onClick={() => openRestock(item)}
                            style={{ backgroundColor: '#2ecc71', border: 'none', color: '#000', borderRadius: '6px', padding: '4px 8px', fontWeight: '700', fontSize: '11px' }}>
                            +Stock
                          </Button>
                          {/* Edit */}
                          <Button size='sm' variant='outline-warning' title='Edit Details'
                            onClick={() => openEdit(item)}
                            style={{ borderRadius: '6px', padding: '4px 8px' }}>
                            <FaEdit />
                          </Button>
                          {/* History */}
                          <Button size='sm' variant='outline-info' title='Stock History'
                            onClick={() => { setHistoryItemId(item._id); setShowHistory(true); }}
                            style={{ borderRadius: '6px', padding: '4px 8px' }}>
                            <FaHistory />
                          </Button>
                          {/* Sync */}
                          <Button size='sm' variant='outline-secondary' title='Sync from Product'
                            onClick={() => handleSync(item._id)}
                            disabled={syncing}
                            style={{ borderRadius: '6px', padding: '4px 8px' }}>
                            <FaSync />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* ── RESTOCK MODAL ── */}
      <Modal show={showRestock} onHide={() => setShowRestock(false)} centered>
        <Modal.Header closeButton style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <Modal.Title style={{ color: 'var(--accent)', fontWeight: '700' }}>
            📦 Restock — {restockItem?.productName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: 'var(--bg-card)' }}>
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-soft)', borderRadius: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Current Stock: </span>
            <strong style={{ color: 'var(--accent)', fontSize: '16px' }}>{restockItem?.stockQty}</strong>
            {restockQty && Number(restockQty) > 0 && (
              <span style={{ fontSize: '13px', color: '#2ecc71', marginLeft: '8px' }}>
                → {(restockItem?.stockQty || 0) + Number(restockQty)} after restock
              </span>
            )}
          </div>
          <Form.Group className='mb-3'>
            <Form.Label style={{ fontWeight: '600', fontSize: '13px' }}>
              Add Quantity <span style={{ color: '#e74c3c' }}>*</span>
            </Form.Label>
            <Form.Control
              type='number' min='1'
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              placeholder='Enter quantity to add'
              style={inputStyle}
              autoFocus
            />
          </Form.Group>
          <Form.Group className='mb-3'>
            <Form.Label style={{ fontWeight: '600', fontSize: '13px' }}>Supplier</Form.Label>
            <Form.Control
              type='text'
              value={restockSupplier}
              onChange={(e) => setRestockSupplier(e.target.value)}
              placeholder='e.g. Samsung Philippines'
              style={inputStyle}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label style={{ fontWeight: '600', fontSize: '13px' }}>Note (optional)</Form.Label>
            <Form.Control
              as='textarea' rows={2}
              value={restockNote}
              onChange={(e) => setRestockNote(e.target.value)}
              placeholder='e.g. Delivery from supplier, batch 001'
              style={inputStyle}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
          <Button variant='secondary' onClick={() => setShowRestock(false)}>Cancel</Button>
          <Button onClick={handleRestock} disabled={restocking}
            style={{ backgroundColor: '#2ecc71', border: 'none', color: '#000', fontWeight: '700' }}>
            {restocking ? 'Restocking...' : `✅ Confirm Restock`}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} size='lg' centered>
        <Modal.Header closeButton style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <Modal.Title style={{ color: 'var(--accent)', fontWeight: '700' }}>
            ✏️ Edit — {editItem?.productName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: 'var(--bg-card)' }}>
          <Row className='g-3'>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Supplier</Form.Label>
                <Form.Control value={editForm.supplier || ''} onChange={ef('supplier')} style={inputStyle} placeholder='e.g. Samsung Philippines' />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>SKU</Form.Label>
                <Form.Control value={editForm.sku || ''} onChange={ef('sku')} style={inputStyle} placeholder='e.g. SAM-A55-BLK' />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Low Stock Threshold</Form.Label>
                <Form.Control type='number' min='1' value={editForm.lowStockThreshold || 5} onChange={ef('lowStockThreshold')} style={inputStyle} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Retail Price (₱)</Form.Label>
                <Form.Control type='number' min='0' value={editForm.retailPrice || 0} onChange={ef('retailPrice')} style={inputStyle} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Wholesale Price (₱)</Form.Label>
                <Form.Control type='number' min='0' value={editForm.wholesalePrice || 0} onChange={ef('wholesalePrice')} style={inputStyle} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Cost Price (₱)</Form.Label>
                <Form.Control type='number' min='0' value={editForm.costPrice || 0} onChange={ef('costPrice')} style={inputStyle} />
                <Form.Text style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Used for stock value calculation</Form.Text>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label style={{ fontSize: '13px', fontWeight: '600' }}>Notes</Form.Label>
                <Form.Control as='textarea' rows={2} value={editForm.notes || ''} onChange={ef('notes')} style={inputStyle} placeholder='Optional notes...' />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
          <Button variant='secondary' onClick={() => setShowEdit(false)}>Cancel</Button>
          <Button onClick={handleEditSave} disabled={updating}
            style={{ backgroundColor: 'var(--accent)', border: 'none', color: '#000', fontWeight: '700' }}>
            {updating ? 'Saving...' : '💾 Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── HISTORY MODAL ── */}
      <Modal show={showHistory} onHide={() => { setShowHistory(false); setHistoryItemId(null); }} centered size='md'>
        <Modal.Header closeButton style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <Modal.Title style={{ color: 'var(--accent)', fontWeight: '700' }}>📋 Stock History</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: 'var(--bg-card)', maxHeight: '60vh', overflowY: 'auto' }}>
          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No history yet.</p>
          ) : (
            history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <span style={{
                    fontWeight: '700', fontSize: '13px',
                    color: h.type === 'restock' ? '#2ecc71' : h.type === 'sold' ? '#e74c3c' : '#e67e22',
                  }}>
                    {h.type === 'restock' ? `+${h.qty}` : `-${h.qty}`}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    {h.type.toUpperCase()}
                  </span>
                  {h.note && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{h.note}</div>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(h.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>
            ))
          )}
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
          <Button variant='secondary' onClick={() => { setShowHistory(false); setHistoryItemId(null); }}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InventoryScreen;