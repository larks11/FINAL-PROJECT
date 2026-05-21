import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from '../../slices/productsApiSlice';

const AdminSettingsScreen = () => {
  const { data: settings, isLoading, refetch } = useGetSettingsQuery();
  const [updateSettings, { isLoading: loadingUpdate }] = useUpdateSettingsMutation();

  const [visayas,  setVisayas]  = useState('');
  const [mindanao, setMindanao] = useState('');
  const [luzon,    setLuzon]    = useState('');
  const [def,      setDef]      = useState('');
  const [vatRate,  setVatRate]  = useState('');

  useEffect(() => {
    if (settings) {
      setVisayas(settings.shippingFees?.visayas  ?? 80);
      setMindanao(settings.shippingFees?.mindanao ?? 150);
      setLuzon(settings.shippingFees?.luzon    ?? 200);
      setDef(settings.shippingFees?.default  ?? 150);
      setVatRate(settings.vatRate ?? 0);
    }
  }, [settings]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({
        shippingFees: {
          visayas:  Number(visayas),
          mindanao: Number(mindanao),
          luzon:    Number(luzon),
          default:  Number(def),
        },
        vatRate: Number(vatRate),
      }).unwrap();
      toast.success('Settings updated successfully!');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--bg-soft)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-main)',
    padding: '10px 14px',
    fontSize: '15px',
    fontWeight: '600',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const SectionCard = ({ title, icon, children }) => (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'var(--bg-soft)',
        borderBottom: '2px solid var(--accent)',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--accent)' }}>
          {icon} {title}
        </h3>
      </div>
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </div>
  );

  if (isLoading) return <Loader />;

  return (
    <div style={{ maxWidth: '600px' }}>

      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '24px', margin: 0 }}>
          ⚙️ Store Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Manage shipping fees and VAT rate
        </p>
      </div>

      <form onSubmit={submitHandler}>

        {/* SHIPPING FEES */}
        <SectionCard title='Shipping Fees' icon='🚚'>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            <div>
              <label style={labelStyle}>Within Visayas (₱)</label>
              <input
                type='number'
                min='0'
                value={visayas}
                onChange={(e) => setVisayas(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                Cebu, Ormoc, Iloilo, Bacolod...
              </small>
            </div>

            <div>
              <label style={labelStyle}>Visayas → Mindanao (₱)</label>
              <input
                type='number'
                min='0'
                value={mindanao}
                onChange={(e) => setMindanao(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                Davao, CDO, Zamboanga...
              </small>
            </div>

            <div>
              <label style={labelStyle}>Visayas → Luzon (₱)</label>
              <input
                type='number'
                min='0'
                value={luzon}
                onChange={(e) => setLuzon(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                Manila, Quezon, Cavite...
              </small>
            </div>

            <div>
              <label style={labelStyle}>Default / Others (₱)</label>
              <input
                type='number'
                min='0'
                value={def}
                onChange={(e) => setDef(e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                Fallback for unrecognized cities
              </small>
            </div>

          </div>
        </SectionCard>

        {/* VAT */}
        <SectionCard title='VAT Rate' icon='📊'>
          <div style={{ maxWidth: '260px' }}>
            <label style={labelStyle}>VAT Percentage (%)</label>
            <input
              type='number'
              min='0'
              max='100'
              step='0.01'
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              Set to 0 to disable VAT. e.g. 12 = 12% VAT
            </small>
          </div>

          {/* VAT PREVIEW */}
          {Number(vatRate) > 0 && (
            <div style={{
              marginTop: '16px',
              backgroundColor: 'var(--bg-soft)',
              border: '1px solid var(--accent)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}>
              <strong style={{ color: 'var(--accent)' }}>Preview:</strong>
              <p style={{ margin: '6px 0 0', color: 'var(--text-main)' }}>
                On a ₱10,000 order:
              </p>
              <p style={{ margin: '4px 0 0', color: 'var(--text-main)', fontWeight: '700' }}>
                VAT = ₱{(10000 * Number(vatRate) / 100).toLocaleString('en-PH')}
              </p>
              <p style={{ margin: '4px 0 0', color: 'var(--accent)', fontWeight: '800' }}>
                Total = ₱{(10000 + (10000 * Number(vatRate) / 100)).toLocaleString('en-PH')}
              </p>
            </div>
          )}
        </SectionCard>

        {/* SAVE BUTTON */}
        <button
          type='submit'
          disabled={loadingUpdate}
          style={{
            width: '100%',
            backgroundColor: 'var(--accent)',
            color: 'var(--btn-text)',
            border: 'none',
            borderRadius: '10px',
            padding: '14px',
            fontWeight: '800',
            fontSize: '15px',
            cursor: loadingUpdate ? 'not-allowed' : 'pointer',
            opacity: loadingUpdate ? 0.7 : 1,
            transition: 'opacity 0.2s',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={(e) => { if (!loadingUpdate) e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={(e) => { if (!loadingUpdate) e.currentTarget.style.opacity = '1'; }}
        >
          {loadingUpdate ? '⏳ Saving...' : '💾 Save Settings'}
        </button>

        {loadingUpdate && <Loader />}
      </form>
    </div>
  );
};

export default AdminSettingsScreen;