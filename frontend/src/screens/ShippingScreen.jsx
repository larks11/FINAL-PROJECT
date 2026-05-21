import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FormContainer from '../components/FormContainer';
import CheckoutSteps from '../components/CheckoutSteps';
import { saveShippingAddress } from '../slices/cartSlice';

const PSGC = 'https://psgc.gitlab.io/api';

const ShippingScreen = () => {
  const cart = useSelector((state) => state.cart);
  const { shippingAddress } = cart;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Address fields
  const [houseStreet, setHouseStreet] = useState(shippingAddress.houseStreet || '');
  const [postalCode, setPostalCode]   = useState(shippingAddress.postalCode || '');

  // Dropdown data
  const [regions, setRegions]         = useState([]);
  const [provinces, setProvinces]     = useState([]);
  const [cities, setCities]           = useState([]);
  const [barangays, setBarangays]     = useState([]);

  // Selected values
  const [selectedRegion, setSelectedRegion]     = useState(shippingAddress.regionCode || '');
  const [selectedProvince, setSelectedProvince] = useState(shippingAddress.provinceCode || '');
  const [selectedCity, setSelectedCity]         = useState(shippingAddress.cityCode || '');
  const [selectedBarangay, setSelectedBarangay] = useState(shippingAddress.barangayCode || '');

  // Selected labels
  const [regionName, setRegionName]     = useState(shippingAddress.region || '');
  const [provinceName, setProvinceName] = useState(shippingAddress.province || '');
  const [cityName, setCityName]         = useState(shippingAddress.city || '');
  const [barangayName, setBarangayName] = useState(shippingAddress.barangay || '');

  const [loading, setLoading] = useState(false);

  // Load regions on mount
  useEffect(() => {
    fetch(`${PSGC}/regions/`)
      .then((r) => r.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setRegions(sorted);
      })
      .catch(() => setRegions([]));
  }, []);

  // Load provinces when region changes
  useEffect(() => {
    if (!selectedRegion) { setProvinces([]); setCities([]); setBarangays([]); return; }
    setLoading(true);
    fetch(`${PSGC}/regions/${selectedRegion}/provinces/`)
      .then((r) => r.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setProvinces(sorted);
        setCities([]);
        setBarangays([]);
      })
      .catch(() => setProvinces([]))
      .finally(() => setLoading(false));
  }, [selectedRegion]);

  // Load cities when province changes
  useEffect(() => {
    if (!selectedProvince) { setCities([]); setBarangays([]); return; }
    setLoading(true);
    // Try cities-municipalities endpoint
    fetch(`${PSGC}/provinces/${selectedProvince}/cities-municipalities/`)
      .then((r) => r.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setCities(sorted);
        setBarangays([]);
      })
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, [selectedProvince]);

  // Load barangays when city changes
  useEffect(() => {
    if (!selectedCity) { setBarangays([]); return; }
    setLoading(true);
    fetch(`${PSGC}/cities-municipalities/${selectedCity}/barangays/`)
      .then((r) => r.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setBarangays(sorted);
      })
      .catch(() => setBarangays([]))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  const handleRegionChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setSelectedRegion(code);
    setRegionName(name);
    setSelectedProvince(''); setProvinceName('');
    setSelectedCity(''); setCityName('');
    setSelectedBarangay(''); setBarangayName('');
  };

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setSelectedProvince(code);
    setProvinceName(name);
    setSelectedCity(''); setCityName('');
    setSelectedBarangay(''); setBarangayName('');
  };

  const handleCityChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setSelectedCity(code);
    setCityName(name);
    setSelectedBarangay(''); setBarangayName('');
  };

  const handleBarangayChange = (e) => {
    const code = e.target.value;
    const name = e.target.options[e.target.selectedIndex].text;
    setSelectedBarangay(code);
    setBarangayName(name);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!selectedRegion || !selectedProvince || !selectedCity || !selectedBarangay) {
      alert('Please complete your address selection.');
      return;
    }

    // Full address string para sa display
    const fullAddress = `${houseStreet}, ${barangayName}, ${cityName}, ${provinceName}, ${regionName}`;

    dispatch(saveShippingAddress({
      // For display
      address: houseStreet,
      city: cityName,
      postalCode,
      country: 'Philippines',
      // Full address parts
      houseStreet,
      barangay: barangayName,
      province: provinceName,
      region: regionName,
      fullAddress,
      // Codes (for re-loading dropdowns)
      regionCode: selectedRegion,
      provinceCode: selectedProvince,
      cityCode: selectedCity,
      barangayCode: selectedBarangay,
    }));

    navigate('/payment');
  };

  const selectStyle = {
    backgroundColor: 'var(--bg-soft)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-main)',
    padding: '10px 12px',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'auto',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 />

      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '28px 24px',
        marginTop: '16px',
      }}>
        <h2 style={{
          color: 'var(--accent)',
          fontWeight: '800',
          fontSize: '22px',
          marginBottom: '24px',
          paddingBottom: '12px',
          borderBottom: '2px solid var(--border)',
        }}>
          📦 Shipping Address
        </h2>

        <Form onSubmit={submitHandler}>

          {/* HOUSE / STREET */}
          <Form.Group className='mb-3'>
            <label style={labelStyle}>House No. / Street</label>
            <Form.Control
              type='text'
              placeholder='e.g. 123 Rizal St.'
              value={houseStreet}
              required
              onChange={(e) => setHouseStreet(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                padding: '10px 12px',
                fontSize: '14px',
              }}
            />
          </Form.Group>

          {/* REGION */}
          <Form.Group className='mb-3'>
            <label style={labelStyle}>Region</label>
            <select
              value={selectedRegion}
              onChange={handleRegionChange}
              required
              style={selectStyle}
            >
              <option value=''>— Select Region —</option>
              {regions.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </Form.Group>

          {/* PROVINCE */}
          <Form.Group className='mb-3'>
            <label style={labelStyle}>Province</label>
            <select
              value={selectedProvince}
              onChange={handleProvinceChange}
              required
              disabled={!selectedRegion || loading}
              style={{ ...selectStyle, opacity: !selectedRegion ? 0.5 : 1 }}
            >
              <option value=''>— Select Province —</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </Form.Group>

          {/* CITY / MUNICIPALITY */}
          <Form.Group className='mb-3'>
            <label style={labelStyle}>City / Municipality</label>
            <select
              value={selectedCity}
              onChange={handleCityChange}
              required
              disabled={!selectedProvince || loading}
              style={{ ...selectStyle, opacity: !selectedProvince ? 0.5 : 1 }}
            >
              <option value=''>— Select City / Municipality —</option>
              {cities.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </Form.Group>

          {/* BARANGAY */}
          <Form.Group className='mb-3'>
            <label style={labelStyle}>Barangay</label>
            <select
              value={selectedBarangay}
              onChange={handleBarangayChange}
              required
              disabled={!selectedCity || loading}
              style={{ ...selectStyle, opacity: !selectedCity ? 0.5 : 1 }}
            >
              <option value=''>— Select Barangay —</option>
              {barangays.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </Form.Group>

          {/* POSTAL CODE */}
          <Form.Group className='mb-4'>
            <label style={labelStyle}>Postal Code</label>
            <Form.Control
              type='text'
              placeholder='e.g. 6541'
              value={postalCode}
              required
              onChange={(e) => setPostalCode(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                padding: '10px 12px',
                fontSize: '14px',
              }}
            />
          </Form.Group>

          {/* PREVIEW */}
          {selectedBarangay && (
            <div style={{
              backgroundColor: 'var(--bg-soft)',
              border: '1px solid var(--accent)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}>
              <strong style={{ color: 'var(--accent)' }}>📍 Full Address Preview:</strong>
              <p style={{ margin: '6px 0 0', color: 'var(--text-main)', fontSize: '14px' }}>
                {houseStreet && `${houseStreet}, `}
                {barangayName}, {cityName}, {provinceName}, {regionName}, Philippines {postalCode}
              </p>
            </div>
          )}

          {loading && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              ⏳ Loading address data...
            </p>
          )}

          <button
            type='submit'
            style={{
              width: '100%',
              backgroundColor: 'var(--accent)',
              color: 'var(--btn-text)',
              border: 'none',
              borderRadius: '10px',
              padding: '13px',
              fontWeight: '800',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              letterSpacing: '0.5px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Continue →
          </button>
        </Form>
      </div>
    </FormContainer>
  );
};

export default ShippingScreen;