import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api } from './api';
import { AdminPanel } from './admin';
import { Register } from './auth';
import './styles.css';

const image = 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=80';

function getSavedDeliveryAddresses() {
  try {
    const saved = JSON.parse(localStorage.getItem('aura_delivery_addresses') || '[]');
    return Array.isArray(saved) ? saved.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function Header() {
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        Aura
      </Link>
      <Link to="/categories" aria-label="البحث">
        <span className="material-symbols-outlined">search</span>
      </Link>
    </header>
  );
}

function BottomNav() {
  const location = useLocation();
  const items = [
    ['/', 'home', 'رئيسية'],
    ['/categories', 'category', 'فئات'],
    ['/cart', 'shopping_cart', 'السلة'],
    ['/orders', 'receipt_long', 'طلباتي'],
    ['/profile', 'person', 'حسابي'],
  ];
  return (
    <nav className="bottom-nav">
      {items.map(([to, icon, label]) => (
        <Link className={location.pathname === to ? 'active' : ''} to={to} key={to}>
          <span className="material-symbols-outlined">{icon}</span>
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Page({ title, children }) {
  return (
    <div className="shell">
      <Header />
      <main className="content">
        <div className="section-head">
          <h1>{title}</h1>
        </div>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

function ProductCard({ product, quantity = 0, onIncrease, onDecrease, isFavorite = false, onFavorite }) {
  const favorite = async () => {
    if (onFavorite) return onFavorite(product.id);
    try {
      await api.favorite(product.id);
    } catch (e) {
      window.alert(e.message);
    }
  };
  return (
    <article className="card product-card">
      <img src={product.imageUrl || image} alt={product.name} />
      <div className="card-body">
        <div className="product-info">
          <h3>{product.name}</h3>
          <span className="muted">{product.category?.name || 'منتج Aura'}</span>
          <span className="price">{Number(product.price).toLocaleString('ar-SA')} ر.س</span>
        </div>
        <div className="product-actions">
          <span className={`card-buttons ${isFavorite ? 'has-favorite' : ''}`}>
            <button className="icon-btn" onClick={favorite} aria-label="إضافة للمفضلة">
              <span className="material-symbols-outlined">{isFavorite ? 'favorite' : 'favorite_border'}</span>
            </button>
            <div className="quantity-stepper">
              <button
                className="icon-btn"
                onClick={() => onDecrease(product.id)}
                disabled={!quantity}
                aria-label="تقليل الكمية"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <span>{quantity}</span>
              <button className="icon-btn" onClick={() => onIncrease(product.id)} aria-label="زيادة الكمية">
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </span>
        </div>
      </div>
    </article>
  );
}

async function changeCartQuantity({ id, quantity, delta, setQuantities, setError, navigate }) {
  if (!localStorage.getItem('aura_token')) {
    navigate('/login');
    return;
  }
  const nextQuantity = Math.max(0, quantity + delta);
  setQuantities((current) => ({ ...current, [id]: nextQuantity }));
  try {
    if (delta > 0) {
      await api.addCart(id);
    } else if (nextQuantity === 0) {
      await api.removeCart(id);
    } else {
      await api.updateCart(id, nextQuantity);
    }
  } catch (e) {
    setError(e.message);
    setQuantities((current) => ({ ...current, [id]: quantity }));
  }
}

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [cartQuantities, setCartQuantities] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    Promise.all([api.products({ page: 1, limit: 20 }), api.categories()])
      .then(([productData, categoryData]) => {
        setProducts(productData);
        setCategories(categoryData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    if (localStorage.getItem('aura_token')) {
      api
        .favorites()
        .then((items) => setFavoriteIds(new Set(items.map((item) => item.productId))))
        .catch(() => {});
      api
        .cart()
        .then((items) => setCartQuantities(Object.fromEntries(items.map((item) => [item.productId, item.quantity]))))
        .catch(() => {});
    }
  }, []);
  const increaseCart = (id) =>
    changeCartQuantity({
      id,
      quantity: cartQuantities[id] || 0,
      delta: 1,
      setQuantities: setCartQuantities,
      setError,
      navigate,
    });
  const decreaseCart = (id) =>
    changeCartQuantity({
      id,
      quantity: cartQuantities[id] || 0,
      delta: -1,
      setQuantities: setCartQuantities,
      setError,
      navigate,
    });
  const toggleFavorite = async (id) => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    const nextFavoriteIds = new Set(favoriteIds);
    const shouldAdd = !nextFavoriteIds.has(id);
    if (shouldAdd) nextFavoriteIds.add(id);
    else nextFavoriteIds.delete(id);
    setFavoriteIds(nextFavoriteIds);
    try {
      if (shouldAdd) await api.favorite(id);
      else await api.removeFavorite(id);
    } catch (e) {
      setError(e.message);
      setFavoriteIds(favoriteIds);
    }
  };
  return (
    <div className="shell">
      <Header />
      <main className="content">
        <section className="hero">
          <h1>اكتشفي عطرك الجديد</h1>
          <p>تشكيلة الربيع الحصرية الآن في Aura.</p>
        </section>
        {error && <p className="error">{error}</p>}
        <section className="section">
          <div className="section-head">
            <h2>الفئات</h2>
            <Link className="muted" to="/categories">
              عرض الكل
            </Link>
          </div>
          <div className="chips">
            <Link className="chip active" to="/">
              الكل
            </Link>
            {categories.slice(0, 5).map((category) => (
              <Link className="chip" to={`/categories?categoryId=${category.id}`} key={category.id}>
                {category.name}
              </Link>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="section-head">
            <h2>الأكثر تفضيلاً</h2>
            <Link className="muted" to="/categories">
              عرض الكل
            </Link>
          </div>
          {loading ? (
            <div className="state">جار التحميل...</div>
          ) : products.length ? (
            <div className="product-list">
              {products.map((product) => (
                <ProductCard
                  product={product}
                  quantity={cartQuantities[product.id] || 0}
                  onIncrease={increaseCart}
                  onDecrease={decreaseCart}
                  isFavorite={favoriteIds.has(product.id)}
                  onFavorite={toggleFavorite}
                  key={product.id}
                />
              ))}
            </div>
          ) : (
            <div className="state">لا توجد منتجات بعد.</div>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function Categories() {
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [cartQuantities, setCartQuantities] = useState({});
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const categoryId = new URLSearchParams(location.search).get('categoryId');
  useEffect(() => {
    Promise.all([api.categories(), api.products({ page: 1, limit: 100, ...(categoryId ? { categoryId } : {}) })])
      .then(([categoryData, productData]) => {
        setData(categoryData);
        setProducts(productData);
      })
      .catch((e) => setError(e.message));
    if (localStorage.getItem('aura_token')) {
      api
        .favorites()
        .then((items) => setFavoriteIds(new Set(items.map((item) => item.productId))))
        .catch(() => {});
      api
        .cart()
        .then((items) => setCartQuantities(Object.fromEntries(items.map((item) => [item.productId, item.quantity]))))
        .catch(() => {});
    }
  }, [categoryId]);
  const increaseCart = (id) =>
    changeCartQuantity({
      id,
      quantity: cartQuantities[id] || 0,
      delta: 1,
      setQuantities: setCartQuantities,
      setError,
      navigate,
    });
  const decreaseCart = (id) =>
    changeCartQuantity({
      id,
      quantity: cartQuantities[id] || 0,
      delta: -1,
      setQuantities: setCartQuantities,
      setError,
      navigate,
    });
  const toggleFavorite = async (id) => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    const nextFavoriteIds = new Set(favoriteIds);
    const shouldAdd = !nextFavoriteIds.has(id);
    if (shouldAdd) nextFavoriteIds.add(id);
    else nextFavoriteIds.delete(id);
    setFavoriteIds(nextFavoriteIds);
    try {
      if (shouldAdd) await api.favorite(id);
      else await api.removeFavorite(id);
    } catch (e) {
      setError(e.message);
      setFavoriteIds(favoriteIds);
    }
  };
  return (
    <Page title="جميع الفئات">
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {data.map((category) => (
          <Link className="card" to={`/categories?categoryId=${category.id}`} key={category.id}>
            <img src={category.imageUrl || image} alt={category.name} />
            <div className="card-body">
              <h3>{category.name}</h3>
              <p className="muted">{category.description || 'تشكيلة مختارة من Aura'}</p>
              <span className="price">{category._count?.products || 0} منتج</span>
            </div>
          </Link>
        ))}
      </div>
      <section className="section">
        <h2>المنتجات</h2>
        <div className="product-list">
          {products.map((product) => (
            <ProductCard
              product={product}
              quantity={cartQuantities[product.id] || 0}
              onIncrease={increaseCart}
              onDecrease={decreaseCart}
              isFavorite={favoriteIds.has(product.id)}
              onFavorite={toggleFavorite}
              key={product.id}
            />
          ))}
        </div>
      </section>
    </Page>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const statusLabels = {
    PENDING: 'قيد الانتظار',
    PROCESSING: 'قيد التجهيز',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغي',
  };

  useEffect(() => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    api
      .orders()
      .then(setOrders)
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <Page title="مراجعة الطلبات">
      {message && <p className="error">{message}</p>}
      {loading ? (
        <div className="state">جاري تحميل الطلبات...</div>
      ) : orders.length ? (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-review" key={order.id}>
              <div className="order-review-head">
                <div>
                  <strong>{Number(order.total).toLocaleString('ar-SA')} ر.س</strong>
                  <p className="muted">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
                <span className={`status-badge ${order.status?.toLowerCase()}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              {order.address && <p className="muted">موقع التسليم: {order.address}</p>}
              <div className="order-items">
                {order.items?.map((item) => (
                  <span key={item.id || `${order.id}-${item.productId}`}>
                    {item.name} × {item.quantity}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="state">لا توجد طلبات بعد.</div>
      )}
    </Page>
  );
}

function Cart() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    const savedAddresses = getSavedDeliveryAddresses();
    setDeliveryAddresses(savedAddresses);
    setSelectedAddress(savedAddresses[0] || '');
    api
      .cart()
      .then(setItems)
      .catch((e) => setMessage(e.message));
  }, [navigate]);
  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const change = async (item, quantity) => {
    try {
      if (quantity < 1) {
        await api.removeCart(item.productId);
      } else {
        await api.updateCart(item.productId, quantity);
      }
      setItems(await api.cart());
    } catch (e) {
      setMessage(e.message);
    }
  };
  const order = async () => {
    const address = newAddress.trim() || selectedAddress;
    if (!address) {
      setMessage('اختر موقع التسليم أو أضف موقعاً جديداً');
      return;
    }
    try {
      await api.createOrder(address);
      const nextAddresses = [address, ...deliveryAddresses.filter((item) => item !== address)].slice(0, 5);
      localStorage.setItem('aura_delivery_addresses', JSON.stringify(nextAddresses));
      setDeliveryAddresses(nextAddresses);
      setSelectedAddress(address);
      setNewAddress('');
      setItems([]);
      setMessage('تم تأكيد طلبك بنجاح');
    } catch (e) {
      setMessage(e.message);
    }
  };
  return (
    <Page title="سلة المشتريات">
      {message && <p className={message.includes('نجاح') ? '' : 'error'}>{message}</p>}
      {items.length ? (
        <>
          <div className="cart-list">
            {items.map((item) => (
              <article className="card cart-card" key={item.productId}>
                <img src={item.product.imageUrl || image} alt={item.product.name} />
                <div className="card-body">
                  <h3>{item.product.name}</h3>
                  <p>
                    {item.quantity} × {Number(item.product.price).toLocaleString('ar-SA')} ر.س
                  </p>
                  <div className="cart-actions">
                    <button
                      className="icon-btn"
                      onClick={() => change(item, item.quantity - 1)}
                      aria-label="تقليل الكمية"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="icon-btn"
                      onClick={() => change(item, item.quantity + 1)}
                      aria-label="زيادة الكمية"
                    >
                      +
                    </button>
                    <button className="icon-btn" onClick={() => change(item, 0)} aria-label="حذف من السلة">
                      ×
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <section className="section stat">
            <span>الإجمالي</span>
            <strong>{total.toLocaleString('ar-SA')} ر.س</strong>
            <div className="delivery-box">
              <label className="field">
                موقع التسليم
                <select value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)}>
                  <option value="">اختر موقع التسليم</option>
                  {deliveryAddresses.map((address) => (
                    <option key={address} value={address}>
                      {address}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                إضافة موقع جديد
                <input
                  value={newAddress}
                  placeholder="مثال: دمشق، المزة، قرب..."
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </label>
            </div>
            <button className="primary full" onClick={order}>
              تأكيد الطلب
            </button>
          </section>
        </>
      ) : (
        <div className="state">السلة فارغة.</div>
      )}
    </Page>
  );
}

function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    api
      .me()
      .then(setUser)
      .catch(() => navigate('/login'));
  }, [navigate]);
  const logout = () => {
    localStorage.removeItem('aura_token');
    navigate('/login');
  };
  return (
    <Page title="حسابي">
      <section className="stat">
        <h2>{user?.name || 'حساب Aura'}</h2>
        <p className="muted">{user?.email || 'جار التحميل...'}</p>
        <button className="primary" onClick={logout}>
          تسجيل الخروج
        </button>
      </section>
    </Page>
  );
}

function AccountProfile() {
  return <EnhancedAccountProfile />;
}

function EnhancedAccountProfile() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cartQuantities, setCartQuantities] = useState({});
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    Promise.all([api.me(), api.favorites(), api.orders(), api.cart()])
      .then(([userData, favoriteData, orderData, cartData]) => {
        setUser(userData);
        setFavorites(favoriteData);
        setOrders(orderData);
        setCartQuantities(Object.fromEntries(cartData.map((item) => [item.productId, item.quantity])));
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('aura_token');
    navigate('/login');
  };

  const increaseCart = (id) =>
    changeCartQuantity({
      id,
      quantity: cartQuantities[id] || 0,
      delta: 1,
      setQuantities: setCartQuantities,
      setError: setMessage,
      navigate,
    });

  const decreaseCart = (id) =>
    changeCartQuantity({
      id,
      quantity: cartQuantities[id] || 0,
      delta: -1,
      setQuantities: setCartQuantities,
      setError: setMessage,
      navigate,
    });

  const removeFavorite = async (id) => {
    try {
      await api.removeFavorite(id);
      setFavorites((items) => items.filter((item) => item.productId !== id));
    } catch (e) {
      setMessage(e.message);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    try {
      await api.changePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setMessage('تم تغيير كلمة السر بنجاح');
      setActiveSection(null);
    } catch (e) {
      setMessage(e.message);
    }
  };

  return (
    <Page title="حسابي">
      {message && <p className={message.includes('تم') ? '' : 'error'}>{message}</p>}
      <section className="account-hero">
        <div>
          <span className="muted">بيانات الحساب</span>
          <h2>{user?.name || 'حساب Aura'}</h2>
          <p className="muted">{user?.email || 'جاري التحميل...'}</p>
        </div>
        <div className="account-summary">
          <span>
            <strong>{favorites.length}</strong>
            المفضلة
          </span>
          <span>
            <strong>{orders.length}</strong>
            الطلبات
          </span>
        </div>
      </section>

      {loading ? (
        <div className="state">جاري التحميل...</div>
      ) : (
        <>
          <section className="account-menu">
            <button
              className={activeSection === 'favorites' ? 'active' : ''}
              onClick={() => setActiveSection(activeSection === 'favorites' ? null : 'favorites')}
            >
              <span className="material-symbols-outlined">favorite</span>
              إعجاباتي
              <strong>{favorites.length}</strong>
            </button>
            <button
              className={activeSection === 'orders' ? 'active' : ''}
              onClick={() => setActiveSection(activeSection === 'orders' ? null : 'orders')}
            >
              <span className="material-symbols-outlined">receipt_long</span>
              طلباتي
              <strong>{orders.length}</strong>
            </button>
            <button
              className={activeSection === 'password' ? 'active' : ''}
              onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
            >
              <span className="material-symbols-outlined">lock</span>
              تغيير كلمة السر
            </button>
          </section>

          {activeSection === 'favorites' && (
            <section className="section">
              <div className="section-head">
                <h2>إعجاباتي</h2>
                <span className="muted">{favorites.length} منتج</span>
              </div>
              {favorites.length ? (
                <div className="product-list">
                  {favorites.map((item) => (
                    <ProductCard
                      product={item.product}
                      quantity={cartQuantities[item.productId] || 0}
                      onIncrease={increaseCart}
                      onDecrease={decreaseCart}
                      isFavorite
                      onFavorite={removeFavorite}
                      key={item.productId}
                    />
                  ))}
                </div>
              ) : (
                <div className="state">لا توجد منتجات في إعجاباتك بعد.</div>
              )}
            </section>
          )}

          {activeSection === 'orders' && (
            <section className="section">
              <div className="section-head">
                <h2>طلباتي</h2>
                <span className="muted">{orders.length} طلب</span>
              </div>
              {orders.length ? (
                <div className="orders-list">
                  {orders.map((order) => (
                    <article className="order-card" key={order.id}>
                      <div>
                        <strong>{Number(order.total).toLocaleString('ar-SA')} ر.س</strong>
                        <p className="muted">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                      </div>
                      <span className="chip">{order.status}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="state">لا توجد طلبات بعد.</div>
              )}
            </section>
          )}

          {activeSection === 'password' && (
            <section className="section account-card">
              <div>
                <span className="muted">الأمان</span>
                <h2>تغيير كلمة السر</h2>
              </div>
              <form className="password-form" onSubmit={changePassword}>
                <label className="field">
                  كلمة السر الحالية
                  <input
                    required
                    minLength="6"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </label>
                <label className="field">
                  كلمة السر الجديدة
                  <input
                    required
                    minLength="6"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </label>
                <button className="primary">حفظ كلمة السر</button>
              </form>
            </section>
          )}

          <section className="section logout-section">
            <button className="primary" onClick={logout}>
              تسجيل الخروج
            </button>
          </section>
        </>
      )}
    </Page>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await api.login({ email, password });
      localStorage.setItem('aura_token', result.token);
      navigate(result.user.role === 'ADMIN' ? '/admin' : '/');
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <main className="auth">
      <form className="auth-box" onSubmit={submit}>
        <Link className="brand" to="/">
          Aura
        </Link>
        <h1>تسجيل الدخول</h1>
        {error && <p className="error">{error}</p>}
        <label className="field">
          البريد الإلكتروني
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          كلمة المرور
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="primary full">دخول</button>
        <Link className="muted" to="/register">
          إنشاء حساب جديد
        </Link>
      </form>
    </main>
  );
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    api
      .dashboard()
      .then(setData)
      .catch((e) => {
        setError(e.message);
        if (e.message === 'Forbidden' || e.message === 'Authentication required') navigate('/login');
      });
  }, [navigate]);
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <Link className="brand" to="/admin">
          Aura
        </Link>
        <Link to="/admin">لوحة التحكم</Link>
        <Link to="/admin/manage">إدارة الكتالوج</Link>
        <Link to="/" onClick={() => localStorage.removeItem('aura_token')}>
          تسجيل الخروج
        </Link>
      </aside>
      <main className="admin-main">
        <Header />
        <div className="content">
          <h1>نظرة عامة</h1>
          {error && <p className="error">{error}</p>}
          <div className="stats">
            {[
              ['إجمالي المبيعات', data?.sales || 0],
              ['الطلبات', data?.orders || 0],
              ['المستخدمين', data?.users || 0],
              ['المنتجات', data?.products || 0],
            ].map(([label, value]) => (
              <div className="stat" key={label}>
                <span className="muted">{label}</span>
                <strong>{Number(value).toLocaleString('ar-SA')}</strong>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function RichAdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const statusLabels = {
    PENDING: 'قيد الانتظار',
    PROCESSING: 'قيد التجهيز',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغي',
  };

  useEffect(() => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    api
      .dashboard()
      .then(setData)
      .catch((e) => {
        setError(e.message);
        if (e.message === 'Forbidden' || e.message === 'Authentication required') navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('aura_token');
    navigate('/login');
  };

  const currency = (value) => `${Number(value || 0).toLocaleString('ar-SA')} ر.س`;
  const stats = [
    ['إجمالي المبيعات', currency(data?.sales), 'payments'],
    ['الطلبات', Number(data?.orders || 0).toLocaleString('ar-SA'), 'receipt_long'],
    ['طلبات بانتظار المعالجة', Number(data?.pendingOrders || 0).toLocaleString('ar-SA'), 'pending_actions'],
    ['المستخدمون', Number(data?.users || 0).toLocaleString('ar-SA'), 'group'],
    ['المنتجات', Number(data?.products || 0).toLocaleString('ar-SA'), 'inventory_2'],
    [
      'الفئات والمتاجر',
      `${Number(data?.categories || 0).toLocaleString('ar-SA')} / ${Number(data?.stores || 0).toLocaleString('ar-SA')}`,
      'storefront',
    ],
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar admin-sidebar">
        <Link className="brand" to="/admin">
          Aura
        </Link>
        <Link className="active" to="/admin">
          لوحة التحكم
        </Link>
        <Link to="/admin/orders">الطلبات</Link>
        <Link to="/admin/manage">إدارة الكتالوج</Link>
        <Link to="/" onClick={logout}>
          تسجيل الخروج
        </Link>
      </aside>
      <main className="admin-main">
        <div className="content admin-dashboard">
          <div className="admin-heading">
            <div>
              <span className="muted">إدارة المتجر</span>
              <h1>لوحة التحكم</h1>
            </div>
            <Link className="primary" to="/admin/manage">
              إدارة المنتجات
            </Link>
          </div>

          {error && <p className="error">{error}</p>}
          {loading ? (
            <div className="state">جاري تحميل لوحة التحكم...</div>
          ) : (
            <>
              <section className="kpi-grid">
                {stats.map(([label, value, icon]) => (
                  <article className="kpi-card" key={label}>
                    <span className="material-symbols-outlined">{icon}</span>
                    <div>
                      <p className="muted">{label}</p>
                      <strong>{value}</strong>
                    </div>
                  </article>
                ))}
              </section>

              <section className="dashboard-grid">
                <div className="dashboard-panel wide">
                  <div className="section-head">
                    <h2>آخر الطلبات</h2>
                    <span className="muted">{data?.recentOrders?.length || 0} طلب</span>
                  </div>
                  {data?.recentOrders?.length ? (
                    <div className="admin-table">
                      <div className="admin-row head">
                        <span>العميل</span>
                        <span>الحالة</span>
                        <span>المبلغ</span>
                        <span>التاريخ</span>
                      </div>
                      {data.recentOrders.map((order) => (
                        <div className="admin-row" key={order.id}>
                          <span>
                            <strong>{order.user?.name || 'عميل'}</strong>
                            <small>{order.user?.email || ''}</small>
                          </span>
                          <span className={`status-badge ${order.status?.toLowerCase()}`}>
                            {statusLabels[order.status] || order.status}
                          </span>
                          <span>{currency(order.total)}</span>
                          <span>{new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="state">لا توجد طلبات بعد.</div>
                  )}
                </div>

                <div className="dashboard-panel">
                  <div className="section-head">
                    <h2>الأكثر تفضيلاً</h2>
                  </div>
                  {data?.favoriteProducts?.length ? (
                    <div className="compact-list">
                      {data.favoriteProducts.map((product) => (
                        <article key={product.id}>
                          <div>
                            <strong>{product.name}</strong>
                            <p className="muted">{currency(product.price)}</p>
                          </div>
                          <span>{product._count?.favorites || 0}</span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="state">لا توجد مفضلات بعد.</div>
                  )}
                </div>

                <div className="dashboard-panel">
                  <div className="section-head">
                    <h2>مخزون منخفض</h2>
                  </div>
                  {data?.lowStockProducts?.length ? (
                    <div className="compact-list">
                      {data.lowStockProducts.map((product) => (
                        <article key={product.id}>
                          <div>
                            <strong>{product.name}</strong>
                            <p className="muted">{product.category?.name || product.store?.name || 'منتج'}</p>
                          </div>
                          <span>{product.stock}</span>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="state">المخزون بحالة جيدة.</div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const statuses = [
    ['PENDING', 'قيد الانتظار'],
    ['PROCESSING', 'قيد التجهيز'],
    ['COMPLETED', 'مكتمل'],
    ['CANCELLED', 'ملغي'],
  ];
  const statusLabels = Object.fromEntries(statuses);

  useEffect(() => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    api
      .orders()
      .then(setOrders)
      .catch((e) => {
        setMessage(e.message);
        if (e.message === 'Forbidden' || e.message === 'Authentication required') navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('aura_token');
    navigate('/login');
  };

  const changeStatus = async (orderId, status) => {
    const previous = orders;
    setOrders((items) => items.map((order) => (order.id === orderId ? { ...order, status } : order)));
    setMessage('');
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrders((items) => items.map((order) => (order.id === orderId ? { ...order, ...updated } : order)));
      setMessage('تم تحديث حالة الطلب');
    } catch (e) {
      setOrders(previous);
      setMessage(e.message);
    }
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar admin-sidebar">
        <Link className="brand" to="/admin">
          Aura
        </Link>
        <Link to="/admin">لوحة التحكم</Link>
        <Link className="active" to="/admin/orders">
          الطلبات
        </Link>
        <Link to="/admin/manage">إدارة الكتالوج</Link>
        <Link to="/" onClick={logout}>
          تسجيل الخروج
        </Link>
      </aside>
      <main className="admin-main">
        <div className="content admin-dashboard">
          <div className="admin-heading">
            <div>
              <span className="muted">إدارة المتجر</span>
              <h1>إدارة الطلبات</h1>
            </div>
            <Link className="primary" to="/admin/manage">
              إدارة المنتجات
            </Link>
          </div>
          {message && <p className={message.includes('تم') ? '' : 'error'}>{message}</p>}
          {loading ? (
            <div className="state">جاري تحميل الطلبات...</div>
          ) : orders.length ? (
            <div className="admin-orders">
              {orders.map((order) => (
                <article className="admin-order-card" key={order.id}>
                  <div className="admin-order-main">
                    <div>
                      <span className="muted">العميل</span>
                      <h3>{order.user?.name || 'عميل'}</h3>
                      <p className="muted">{order.user?.email || ''}</p>
                    </div>
                    <div>
                      <span className="muted">الإجمالي</span>
                      <strong>{Number(order.total).toLocaleString('ar-SA')} ر.س</strong>
                      <p className="muted">{new Date(order.createdAt).toLocaleDateString('ar-SA')}</p>
                    </div>
                    <label className="field admin-order-status">
                      الحالة
                      <select value={order.status} onChange={(e) => changeStatus(order.id, e.target.value)}>
                        {statuses.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {order.address && <p className="muted">موقع التسليم: {order.address}</p>}
                  <div className="order-items">
                    {order.items?.map((item) => (
                      <span key={item.id || `${order.id}-${item.productId}`}>
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                  <span className={`status-badge ${order.status?.toLowerCase()}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className="state">لا توجد طلبات بعد.</div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/profile" element={<EnhancedAccountProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<RichAdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/manage" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
