import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api } from './api';
import { AdminPanel } from './admin';
import { Register } from './auth';
import './styles.css';

const image = 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=80';

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

function ProductCard({ product, onAdd }) {
  const favorite = async () => {
    if (!localStorage.getItem('aura_token')) return onAdd(product.id);
    try {
      await api.favorite(product.id);
    } catch (e) {
      window.alert(e.message);
    }
  };
  return (
    <article className="card">
      <img src={product.imageUrl || image} alt={product.name} />
      <div className="card-body">
        <h3>{product.name}</h3>
        <span className="muted">{product.category?.name || 'منتج Aura'}</span>
        <div className="card-actions">
          <span className="price">{Number(product.price).toLocaleString('ar-SA')} ر.س</span>
          <span className="card-buttons">
            <button className="icon-btn" onClick={favorite} aria-label="إضافة للمفضلة">
              <span className="material-symbols-outlined">favorite_border</span>
            </button>
            <button className="icon-btn" onClick={() => onAdd(product.id)} aria-label="إضافة للسلة">
              <span className="material-symbols-outlined">add</span>
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
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
  }, []);
  const addToCart = async (id) => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    try {
      await api.addCart(id);
      navigate('/cart');
    } catch (e) {
      setError(e.message);
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
            <div className="grid">
              {products.map((product) => (
                <ProductCard product={product} onAdd={addToCart} key={product.id} />
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
  }, [categoryId]);
  const addToCart = async (id) => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    try {
      await api.addCart(id);
      navigate('/cart');
    } catch (e) {
      setError(e.message);
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
        <div className="grid">
          {products.map((product) => (
            <ProductCard product={product} onAdd={addToCart} key={product.id} />
          ))}
        </div>
      </section>
    </Page>
  );
}

function Cart() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
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
    try {
      await api.createOrder('الرياض، حي الملقا');
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
          <div className="grid">
            {items.map((item) => (
              <article className="card" key={item.productId}>
                <img src={item.product.imageUrl || image} alt={item.product.name} />
                <div className="card-body">
                  <h3>{item.product.name}</h3>
                  <p>
                    {item.quantity} × {Number(item.product.price).toLocaleString('ar-SA')} ر.س
                  </p>
                  <div className="card-actions">
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/manage" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
