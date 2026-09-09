import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request } from './api';

const blank = { name: '', description: '', imageUrl: '', price: '', storeId: '', categoryId: '', type: '' };
const textValue = (value) => value ?? '';

export function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('products');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const buildPayload = (nextForm = form) =>
    tab === 'products'
      ? {
          name: nextForm.name,
          description: textValue(nextForm.description),
          imageUrl: textValue(nextForm.imageUrl),
          price: Number(nextForm.price),
          storeId: nextForm.storeId,
          categoryId: nextForm.categoryId,
        }
      : tab === 'stores'
        ? {
            name: nextForm.name,
            type: nextForm.type,
            description: textValue(nextForm.description),
            imageUrl: textValue(nextForm.imageUrl),
          }
        : { name: nextForm.name, description: textValue(nextForm.description), imageUrl: textValue(nextForm.imageUrl) };

  useEffect(() => {
    setForm(blank);
    setEditing(null);
    setShowForm(false);
    setError('');
    setNotice('');
    request('/categories')
      .then(setCategories)
      .catch(() => {});
    request('/stores')
      .then(setStores)
      .catch(() => {});
    load();
  }, [tab]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const payload = buildPayload();
    try {
      const path = `/${tab}${editing ? `/${editing}` : ''}`;
      await request(path, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      setForm(blank);
      setEditing(null);
      setShowForm(false);
      setNotice(editing ? 'تم حفظ التعديل' : 'تمت الإضافة');
      load();
    } catch (e) {
      const fields = e.errors?.fieldErrors ? Object.keys(e.errors.fieldErrors).join(', ') : '';
      setError(fields ? `${e.message}: ${fields}` : e.message);
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

  const startEdit = (item) => {
    setEditing(item.id);
    setShowForm(true);
    setError('');
    setNotice('');
    setForm({
      ...blank,
      ...item,
      description: textValue(item.description),
      imageUrl: textValue(item.imageUrl),
      type: textValue(item.type),
      price: String(item.price || ''),
    });
  };

  const startCreate = () => {
    setForm(blank);
    setEditing(null);
    setShowForm(true);
    setError('');
    setNotice('');
  };

  const closeForm = () => {
    setForm(blank);
    setEditing(null);
    setShowForm(false);
    setError('');
    setNotice('');
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('اختاري ملف صورة فقط');
      setNotice('');
      event.target.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('حجم الصورة لازم يكون أقل من 8MB');
      setNotice('');
      event.target.value = '';
      return;
    }
    setUploadingImage(true);
    setError('');
    setNotice('');
    try {
      const body = new FormData();
      body.append('image', file);
      const uploaded = await request('/admin/uploads/catalog-image', { method: 'POST', body });
      setForm((current) => ({ ...current, imageUrl: uploaded.imageUrl }));
      setNotice('تم رفع الصورة. اضغطي حفظ التعديل لتثبيتها.');
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const title = tab === 'products' ? 'المنتجات' : tab === 'categories' ? 'الفئات' : 'المتاجر';
  const singularTitle = tab === 'products' ? 'منتج' : tab === 'categories' ? 'فئة' : 'متجر';
  const emptyTitle = tab === 'products' ? 'لا توجد منتجات بعد.' : tab === 'categories' ? 'لا توجد فئات بعد.' : 'لا توجد متاجر بعد.';
  const imageInputId = `admin-${tab}-image`;

  return (
    <div className="admin-layout">
      <aside className="sidebar admin-sidebar">
        <Link className="brand" to="/admin">
          Aura
        </Link>
        <Link to="/admin">لوحة التحكم</Link>
        <Link to="/admin/orders">الطلبات</Link>
        <button type="button" className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
          المنتجات
        </button>
        <button type="button" className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>
          الفئات
        </button>
        <button type="button" className={tab === 'stores' ? 'active' : ''} onClick={() => setTab('stores')}>
          المتاجر
        </button>
        <Link to="/" onClick={() => localStorage.removeItem('aura_token')}>
          تسجيل الخروج
        </Link>
      </aside>
      <main className="admin-main">
        <div className="content admin-catalog">
          <div className="admin-catalog-header">
            <div>
              <span className="muted">إدارة الكتالوج</span>
              <h1>{title}</h1>
              <p>{items.length} عنصر</p>
            </div>
            <button className="primary catalog-add-button" type="button" onClick={startCreate}>
              <span className="material-symbols-outlined">add</span>
              إضافة {singularTitle}
            </button>
          </div>
          <nav className="catalog-switcher" aria-label="أقسام الكتالوج">
            <button type="button" className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>
              المنتجات
            </button>
            <button type="button" className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>
              الفئات
            </button>
            <button type="button" className={tab === 'stores' ? 'active' : ''} onClick={() => setTab('stores')}>
              المتاجر
            </button>
          </nav>
          {error && <p className="error">{error}</p>}
          {notice && <p className="success">{notice}</p>}

          {showForm && (
            <form className="catalog-form" onSubmit={submit}>
              <div className="catalog-form-head">
                <div>
                  <span className="muted">{editing ? 'تعديل عنصر موجود' : 'إضافة عنصر جديد'}</span>
                  <h2>{editing ? `تعديل ${singularTitle}` : `إضافة ${singularTitle}`}</h2>
                </div>
                <button className="icon-btn" type="button" onClick={closeForm} aria-label="إغلاق">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="catalog-form-grid">
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
                      الفئة
                      <select
                        required
                        value={form.categoryId}
                        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      >
                        <option value="">اختر الفئة</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      المتجر
                      <select
                        required
                        value={form.storeId}
                        onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                      >
                        <option value="">اختر المتجر</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {tab === 'stores' && (
                  <label className="field">
                    النوع
                    <input required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                  </label>
                )}

                <label className="field catalog-description-field">
                  الوصف
                  <input
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </label>

                {(tab === 'products' || tab === 'categories') && (
                  <div className="field image-upload-field">
                    <span>صورة</span>
                    <div className="image-upload-box">
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt={form.name || 'صورة'} />
                      ) : (
                        <span className="material-symbols-outlined">add_photo_alternate</span>
                      )}
                      <input
                        id={imageInputId}
                        type="file"
                        accept="image/*"
                        onChange={uploadImage}
                        disabled={uploadingImage}
                      />
                    </div>
                    <label className={`image-upload-button ${uploadingImage ? 'disabled' : ''}`} htmlFor={imageInputId}>
                      {uploadingImage ? 'جار رفع الصورة...' : form.imageUrl ? 'تغيير الصورة' : 'اختيار صورة'}
                    </label>
                    {form.imageUrl && (
                      <input
                        dir="ltr"
                        type="url"
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="form-actions catalog-form-actions">
                <button className="primary" disabled={loading || uploadingImage}>
                  {editing ? 'حفظ التعديل' : `إضافة ${singularTitle}`}
                </button>
                <button type="button" onClick={closeForm}>
                  إلغاء
                </button>
              </div>
            </form>
          )}

          <div className="catalog-grid">
            {loading ? (
              <div className="state">جاري التحميل...</div>
            ) : !items.length ? (
              <div className="state">{emptyTitle}</div>
            ) : (
              items.map((item) => (
                <article className="catalog-card" key={item.id}>
                  <div className="catalog-card-image">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} />
                    ) : (
                      <span className="material-symbols-outlined">
                        {tab === 'products' ? 'shopping_bag' : tab === 'categories' ? 'category' : 'storefront'}
                      </span>
                    )}
                  </div>
                  <div className="catalog-card-body">
                    <div className="catalog-card-title">
                      <h3>{item.name}</h3>
                      {item.price && <span className="price">ل.س {Number(item.price).toLocaleString('ar-SY')}</span>}
                    </div>
                    <p>{item.description || item.type || item.store?.name || 'بدون وصف'}</p>
                    <div className="catalog-card-meta">
                      {item.category?.name && <span>{item.category.name}</span>}
                      {item.store?.name && <span>{item.store.name}</span>}
                      {item._count?.products !== undefined && <span>{item._count.products} منتج</span>}
                    </div>
                    <div className="catalog-card-actions">
                      <button type="button" onClick={() => startEdit(item)}>
                        <span className="material-symbols-outlined">edit</span>
                        تعديل
                      </button>
                      <button className="danger" type="button" onClick={() => remove(item.id)}>
                        <span className="material-symbols-outlined">delete</span>
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
