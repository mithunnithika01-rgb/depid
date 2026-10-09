import { useState, useEffect, useRef } from 'react';
import { brandApi } from '../utils/api';
import { HiCamera, HiCheckCircle, HiExclamationCircle, HiShieldCheck, HiPencilSquare, HiTrash, HiGlobeAlt, HiBuildingOffice, HiEye } from 'react-icons/hi2';
import { FaTwitter, FaInstagram, FaYoutube, FaFacebook, FaLinkedin, FaGooglePlay, FaApple } from 'react-icons/fa6';

export default function BrandProfile() {
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [form, setForm] = useState({
    brand_name: '',
    developer_name: '',
    website_url: '',
    twitter_handle: '',
    instagram_handle: '',
    youtube_channel: '',
    facebook_page: '',
    linkedin_page: '',
    play_store_link: '',
    app_store_link: '',
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  const loadBrands = async () => {
    try {
      const data = await brandApi.list();
      setBrands(data.brands || []);
      if (data.brands && data.brands.length > 0 && !selectedBrand) {
        selectBrand(data.brands[0]);
      }
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const selectBrand = (b) => {
    setSelectedBrand(b);
    setForm({
      brand_name: b.brand_name || '',
      developer_name: b.developer_name || '',
      website_url: b.website_url || '',
      twitter_handle: b.twitter_handle || '',
      instagram_handle: b.instagram_handle || '',
      youtube_channel: b.youtube_channel || '',
      facebook_page: b.facebook_page || '',
      linkedin_page: b.linkedin_page || '',
      play_store_link: b.play_store_link || '',
      app_store_link: b.app_store_link || '',
    });
    setLogoPreview(b.logo_path ? `http://localhost:8000${b.logo_path}` : null);
    setSaved(false);
  };

  const startNew = () => {
    setSelectedBrand(null);
    setForm({
      brand_name: '',
      developer_name: '',
      website_url: '',
      twitter_handle: '',
      instagram_handle: '',
      youtube_channel: '',
      facebook_page: '',
      linkedin_page: '',
      play_store_link: '',
      app_store_link: '',
    });
    setLogo(null);
    setLogoPreview(null);
    setSaved(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
    setSaved(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.brand_name.trim()) errs.brand_name = 'Brand name is required';
    if (form.website_url && !form.website_url.match(/^https?:\/\/.+\..+/)) {
      errs.website_url = 'Enter a valid URL (e.g., https://nike.com)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      let result;
      if (selectedBrand?.id) {
        result = await brandApi.update(selectedBrand.id, form);
      } else {
        result = await brandApi.create(form);
      }
      
      const bId = selectedBrand?.id || result.brand?.id;
      if (logo && bId) {
        await brandApi.uploadLogo(bId, logo);
      }
      setSaved(true);
      await loadBrands();
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this brand profile?')) return;
    try {
      await brandApi.delete(id);
      startNew();
      await loadBrands();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '960px' }}>
      <div className="page-header">
        <h1 className="page-title">Brand Profiles & Ground Truth</h1>
        <p className="page-subtitle">
          Define and inspect official brand properties. Touching any brand card displays its complete ground truth dataset.
        </p>
      </div>

      {/* Existing Brand Profiles Cards (Touch to select & inspect) */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <span className="card-title">Saved Brand Profiles ({brands.length})</span>
          <button className="btn btn-ghost btn-sm" onClick={startNew}>+ Create New Brand</button>
        </div>

        {brands.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
            {brands.map(b => {
              const isSelected = selectedBrand?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => selectBrand(b)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'var(--shadow-pressed)' : 'var(--shadow-flat)',
                    border: isSelected ? '2px solid var(--accent-primary)' : 'var(--border-light)',
                    background: isSelected ? 'var(--bg-main)' : 'var(--bg-card)',
                    padding: 'var(--space-md)',
                    transition: 'all 200ms ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-sidebar-hover)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: '800', color: 'var(--accent-primary)',
                      boxShadow: 'var(--shadow-flat-sm)', overflow: 'hidden'
                    }}>
                      {b.logo_path ? (
                        <img src={`http://localhost:8000${b.logo_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        b.brand_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-primary)' }}>{b.brand_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.developer_name || 'Official Profile'}</div>
                    </div>
                  </div>

                  {b.website_url && (
                    <div style={{ fontSize: '12px', color: 'var(--accent-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.website_url}
                    </div>
                  )}

                  <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {b.twitter_handle && <span className="chip" style={{ padding: '3px 8px', fontSize: '11px' }}><FaTwitter style={{ color: '#1DA1F2' }} /> {b.twitter_handle}</span>}
                    {b.play_store_link && <span className="chip" style={{ padding: '3px 8px', fontSize: '11px' }}><FaGooglePlay style={{ color: '#01875F' }} /> Play</span>}
                    {b.app_store_link && <span className="chip" style={{ padding: '3px 8px', fontSize: '11px' }}><FaApple style={{ color: '#000000' }} /> App Store</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No brand profiles saved yet. Fill out the ground truth form below to create your first profile.
          </div>
        )}
      </div>

      {/* Selected Brand Property Inspector Card */}
      {selectedBrand && (
        <div className="card" style={{ marginBottom: 'var(--space-xl)', borderLeft: '6px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HiEye style={{ color: 'var(--accent-primary)', fontSize: '24px' }} />
              <span className="card-title" style={{ fontSize: 'var(--font-size-md)' }}>ACTIVE BRAND PROPERTIES INSPECTOR</span>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedBrand.id)} style={{ gap: '6px' }}>
              <HiTrash />
              <span>Delete Profile</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)', background: 'var(--bg-main)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-pressed)' }}>
            <div>
              <span className="form-label" style={{ fontSize: '11px' }}>Brand Name</span>
              <div style={{ fontWeight: '800', fontSize: '16px' }}>{selectedBrand.brand_name}</div>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '11px' }}>Official Developer</span>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>{selectedBrand.developer_name || 'N/A'}</div>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '11px' }}>Website Domain</span>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--accent-primary)' }}>{selectedBrand.website_url || 'N/A'}</div>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '11px' }}>Twitter / X</span>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>{selectedBrand.twitter_handle || 'N/A'}</div>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '11px' }}>Instagram</span>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>{selectedBrand.instagram_handle || 'N/A'}</div>
            </div>
            <div>
              <span className="form-label" style={{ fontSize: '11px' }}>YouTube</span>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>{selectedBrand.youtube_channel || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {saved && (
        <div className="card" style={{
          background: 'var(--threat-safe-bg)',
          boxShadow: 'var(--threat-safe-shadow)',
          marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)',
          display: 'flex', alignItems: 'center', gap: '12px',
          color: 'var(--threat-safe)', fontWeight: '600'
        }}>
          <HiCheckCircle style={{ fontSize: '24px' }} />
          <span>Brand profile properties saved successfully!</span>
        </div>
      )}

      {errors.general && (
        <div className="card" style={{
          background: 'var(--threat-high-bg)',
          boxShadow: 'var(--threat-high-shadow)',
          marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)',
          display: 'flex', alignItems: 'center', gap: '12px',
          color: 'var(--threat-high)', fontWeight: '600'
        }}>
          <HiExclamationCircle style={{ fontSize: '24px' }} />
          <span>Error: {errors.general}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-lg)', fontSize: 'var(--font-size-md)' }}>
            {selectedBrand ? `Edit Properties for "${selectedBrand.brand_name}"` : 'Create Ground Truth Brand Profile'}
          </div>

          {/* Logo Upload + Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
            <div>
              <label className="form-label">Brand Logo</label>
              <div
                className={`upload-zone ${logoPreview ? 'has-file' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="upload-preview" />
                ) : (
                  <>
                    <div className="upload-icon"><HiCamera /></div>
                    <div className="upload-text">Upload Logo</div>
                    <div className="upload-hint">PNG, JPG, or SVG</div>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
            </div>

            <div>
              <div className="form-group">
                <label className="form-label">Brand / Company Name *</label>
                <input
                  className={`form-input ${errors.brand_name ? 'error' : ''}`}
                  name="brand_name"
                  value={form.brand_name}
                  onChange={handleChange}
                  placeholder="e.g., Nike"
                />
                {errors.brand_name && <div className="form-error">{errors.brand_name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Official Developer Name</label>
                <input
                  className="form-input"
                  name="developer_name"
                  value={form.developer_name}
                  onChange={handleChange}
                  placeholder="e.g., Nike, Inc."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Website URL</label>
                <input
                  className={`form-input ${errors.website_url ? 'error' : ''}`}
                  name="website_url"
                  value={form.website_url}
                  onChange={handleChange}
                  placeholder="e.g., https://www.nike.com"
                />
                {errors.website_url && <div className="form-error">{errors.website_url}</div>}
              </div>
            </div>
          </div>

          {/* Social Media Handles */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="form-label" style={{ marginBottom: 'var(--space-lg)', fontSize: 'var(--font-size-sm)' }}>Official Social Media Handles</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaTwitter style={{ color: '#1DA1F2' }} /> Twitter / X
                </label>
                <input className="form-input" name="twitter_handle" value={form.twitter_handle}
                  onChange={handleChange} placeholder="@Nike" />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaInstagram style={{ color: '#E4405F' }} /> Instagram
                </label>
                <input className="form-input" name="instagram_handle" value={form.instagram_handle}
                  onChange={handleChange} placeholder="@nike" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaYoutube style={{ color: '#FF0000' }} /> YouTube Channel
                </label>
                <input className="form-input" name="youtube_channel" value={form.youtube_channel}
                  onChange={handleChange} placeholder="youtube.com/@nike" />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaFacebook style={{ color: '#1877F2' }} /> Facebook Page
                </label>
                <input className="form-input" name="facebook_page" value={form.facebook_page}
                  onChange={handleChange} placeholder="facebook.com/nike" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaLinkedin style={{ color: '#0A66C2' }} /> LinkedIn Page
                </label>
                <input className="form-input" name="linkedin_page" value={form.linkedin_page}
                  onChange={handleChange} placeholder="linkedin.com/company/nike" />
              </div>
              <div className="form-group" />
            </div>
          </div>

          {/* App Store Links */}
          <div>
            <div className="form-label" style={{ marginBottom: 'var(--space-lg)', fontSize: 'var(--font-size-sm)' }}>Official App Store Links</div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaGooglePlay style={{ color: '#01875F' }} /> Google Play Store Link
              </label>
              <input className="form-input" name="play_store_link" value={form.play_store_link}
                onChange={handleChange} placeholder="https://play.google.com/store/apps/details?id=..." />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaApple style={{ color: '#000000' }} /> Apple App Store Link
              </label>
              <input className="form-input" name="app_store_link" value={form.app_store_link}
                onChange={handleChange} placeholder="https://apps.apple.com/us/app/..." />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={saving} style={{ gap: '10px' }}>
          <HiShieldCheck style={{ fontSize: '22px' }} />
          <span>{saving ? 'Saving Properties...' : selectedBrand ? 'UPDATE BRAND PROPERTIES' : 'SAVE NEW BRAND PROFILE'}</span>
        </button>
      </form>
    </div>
  );
}
