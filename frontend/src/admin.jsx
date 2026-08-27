import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from './api';

const blank = { name: '', description: '', price: '', stock: 0, storeId: '', categoryId: '', type: '' };

export function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('products');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const path = tab === 'products' ? '/products?page=1&limit=100' : `/${tab}`;
    request(path)
      .then(setItems)
      .catch((e) => {
        setError(e.message);
        if (e.message === 'Forbidden' || e.message === 'Authentication required') navigate('/login');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    request('/categories')
      .then(setCategories)
      .catch(() => {});
    load();
  }, [tab]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const payload =
      tab === 'products'
        ? { ...form, price: Number(form.price), stock: Number(form.stock) }
        : tab === 'stores'
          ? { name: form.name, type: form.type, description: form.description }
          : { name: form.name, description: form.description };
    try {
      const path = `/${tab}${editing ? `/${editing}` : ''}`;
      await request(path, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      setForm(blank);
      setEditing(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('حذف هذا العنصر؟')) return;
    try {
      await request(`/${tab}/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const startEdit = (item) =>
    setEditing(item.id) || setForm({ ...blank, ...item, price: String(item.price || ''), stock: item.stock || 0 });
  const title = tab === 'products' ? 'المنتجات' : tab === 'categories' ? 'الأقسام' : 'المتاجر';

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <Link className="brand" to="/admin">
          Aura
        </Link>
        <Link to="/admin">لوحة التحكم</Link>
        <button onClick={() => setTab('products')}>المنتجات</button>
        <button onClick={() => setTab('categories')}>الأقسام</button>
        <button onClick={() => setTab('stores')}>المتاجر</button>
        <Link to="/" onClick={() => localStorage.removeItem('aura_token')}>
          تسجيل الخروج
        </Link>
      </aside>
      <main className="admin-main">
        <div className="content">
          <div className="section-head">
            <h1>إدارة {title}</h1>
            <Link className="muted" to="/admin">
              لوحة التحكم
            </Link>
          </div>
          {error && <p className="error">{error}</p>}
          <form className="stat" onSubmit={submit}>
            <div className="grid">
              <label className="field">
                الاسم
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              {tab === 'products' && (
                <>
                  <label className="field">
                    السعر
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    المخزون
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    القسم
                    <select
                      required
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    >
                      <option value="">اختر القسم</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    معرّف المتجر
                    <input
                      required
                      value={form.storeId}
                      onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                    />
                  </label>
                </>
              )}
              {tab === 'stores' && (
                <label className="field">
                  النوع
                  <input required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                </label>
              )}
              <label className="field">
                الوصف
                <input
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
            </div>
            <button className="primary" disabled={loading}>
              {editing ? 'حفظ التعديل' : 'إضافة'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(blank);
                }}
              >
                إلغاء
              </button>
            )}
          </form>
          <div className="grid section">
            {loading ? (
              <div className="state">جار التحميل...</div>
            ) : (
              items.map((item) => (
                <article className="card" key={item.id}>
                  <div className="card-body">
                    <h3>{item.name}</h3>
                    <p className="muted">{item.description || item.type || ''}</p>
                    {item.price && <span className="price">{Number(item.price).toLocaleString('ar-SA')} ر.س</span>}
                    <div className="card-actions">
                      <button onClick={() => startEdit(item)}>تعديل</button>
                      <button className="muted" onClick={() => remove(item.id)}>
                        حذف
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
