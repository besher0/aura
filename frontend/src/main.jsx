import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from './api';
import { AdminPanel } from './admin';
import { Register } from './auth';
import './styles.css';

const image = 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=80';
const heroImage = 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=1200&q=85';
const profileImage = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80';
const fallbackCategories = [
  { id: 'fallback-perfume', name: 'عطور', icon: 'styler' },
  { id: 'fallback-fashion', name: 'أزياء', icon: 'checkroom' },
  { id: 'fallback-watches', name: 'ساعات', icon: 'watch' },
  { id: 'fallback-jewelry', name: 'مجوهرات', icon: 'diamond' },
  { id: 'fallback-beauty', name: 'تجميل', icon: 'brush' },
];

const categoryIconMap = {
  عطور: 'styler',
  أزياء: 'checkroom',
  ازياء: 'checkroom',
  ساعات: 'watch',
  مجوهرات: 'diamond',
  تجميل: 'brush',
  مكياج: 'face_retouching_natural',
};

const money = (value) => `${Number(value || 0).toLocaleString('ar-SA')} ر.س`;
const plainMoney = (value) => Number(value || 0).toLocaleString('ar-SA');
const categoryIcon = (name) => categoryIconMap[name] || 'category';
const favoriteIdSet = (items) => new Set(items.map((item) => item.productId));

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
      <button className="topbar-icon" type="button" aria-label="القائمة">
        <span className="material-symbols-outlined">menu</span>
      </button>
      <Link className="brand" to="/">
        Aura
      </Link>
      <button className="topbar-icon" type="button" aria-label="الإشعارات">
        <span className="material-symbols-outlined">notifications</span>
      </button>
    </header>
  );
}

function BottomNav() {
  const location = useLocation();
  const items = [
    ['/', 'home', 'رئيسية'],
    ['/categories', 'category', 'فئات'],
    ['/cart', 'shopping_cart', 'سلة'],
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
        {title && (
          <div className="section-head">
            <h1>{title}</h1>
          </div>
        )}
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

function ProductCard({
  product,
  quantity = 0,
  onIncrease,
  onDecrease,
  isFavorite = false,
  onFavorite,
  variant = 'tile',
  showFavorite = true,
}) {
  const favorite = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (onFavorite) return onFavorite(product.id);
    try {
      await api.favorite(product.id);
    } catch (e) {
      window.alert(e.message);
    }
  };
  if (variant === 'row') {
    return (
      <article className="card product-card product-card-row">
        <img src={product.imageUrl || image} alt={product.name} />
        <div className="card-body">
          <div className="product-info">
            <h3>{product.name}</h3>
            <span className="muted">{product.category?.name || 'منتج Aura'}</span>
            <span className="price">{money(product.price)}</span>
          </div>
          <div className="product-actions">
            <span className={`card-buttons ${isFavorite ? 'has-favorite' : ''}`}>
              {showFavorite && (
                <button className="icon-btn" onClick={favorite} aria-label="إضافة للمفضلة">
                  <span className="material-symbols-outlined">{isFavorite ? 'favorite' : 'favorite_border'}</span>
                </button>
              )}
              <div className="quantity-stepper">
                <button className="icon-btn" onClick={() => onIncrease(product.id)} aria-label="زيادة الكمية">
                  <span className="material-symbols-outlined">add</span>
                </button>
                <span>{quantity}</span>
                <button
                  className="icon-btn"
                  onClick={() => onDecrease(product.id)}
                  disabled={!quantity}
                  aria-label="تقليل الكمية"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
              </div>
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="product-tile">
      <div className="product-tile-media">
        <Link className="product-tile-image-link" to={`/products/${product.id}`} aria-label={product.name}>
          <img src={product.imageUrl || image} alt={product.name} />
        </Link>
        {product.isNew && <span className="new-badge">جديد</span>}
        {showFavorite && (
          <button
            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
            onClick={favorite}
            aria-label="إضافة للمفضلة"
          >
            <span className="material-symbols-outlined">{isFavorite ? 'favorite' : 'favorite_border'}</span>
          </button>
        )}
        <button
          className="add-btn"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onIncrease(product.id);
          }}
          aria-label="إضافة للسلة"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
      <Link className="product-tile-body" to={`/products/${product.id}`}>
        <h3>{product.name}</h3>
        <span className="muted">
          {product.size || (product.category?.name === 'عطور' ? '50 مل' : product.category?.name) || '50 مل'}
        </span>
        <strong className="price">{plainMoney(product.price)}</strong>
      </Link>
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
  const [selectedHomeCategoryId, setSelectedHomeCategoryId] = useState('');
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
        .then((items) => setFavoriteIds(favoriteIdSet(items)))
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
      const syncedFavorites = await api.favorites();
      setFavoriteIds(favoriteIdSet(syncedFavorites));
    } catch (e) {
      setError(e.message);
    }
  };
  const displayCategories = categories.length ? categories : fallbackCategories;
  const activeHomeCategory =
    displayCategories.find((category) => category.id === selectedHomeCategoryId) || displayCategories[0];
  const categoryProducts =
    activeHomeCategory && !activeHomeCategory.id?.startsWith?.('fallback-')
      ? products.filter((product) => (product.category?.id || product.categoryId) === activeHomeCategory.id)
      : products;
  const featuredProducts = (categoryProducts.length ? categoryProducts : products).slice(
    0,
    Math.max(2, Math.min(6, products.length))
  );
  const newProducts = products.slice(1, 5).length ? products.slice(1, 5) : products.slice(0, 4);
  return (
    <div className="shell">
      <Header />
      <main className="content">
        <section
          className="hero"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(95, 62, 63, 0.05), rgba(111, 63, 65, 0.42)), url(${heroImage})`,
          }}
        >
          <h1>اكتشفي عطرك الجديد</h1>
          <p>تشكيلة الربيع الحصرية الآن في Aura.</p>
        </section>
        {error && <p className="error">{error}</p>}
        <section className="section category-chip-section">
          <div className="chips category-strip">
            {displayCategories.map((category, index) => (
              <button
                type="button"
                className={`chip ${activeHomeCategory?.id === category.id ? 'active' : ''}`}
                title={category.name}
                onClick={() => setSelectedHomeCategoryId(category.id)}
                key={category.id}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="section-head">
            <h2>{activeHomeCategory?.name || 'الأكثر تفضيلاً'}</h2>
            <Link className="muted" to="/categories">
              عرض الكل
            </Link>
          </div>
          {loading ? (
            <div className="state">جار التحميل...</div>
          ) : featuredProducts.length ? (
            <div className="product-list home-product-list">
              {featuredProducts.map((product) => (
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
        <section className="section">
          <div className="section-head">
            <h2>جديدنا</h2>
            <Link className="muted" to="/categories">
              عرض الكل
            </Link>
          </div>
          {loading ? (
            <div className="state">جار التحميل...</div>
          ) : newProducts.length ? (
            <div className="product-list home-product-list">
              {newProducts.map((product, index) => (
                <ProductCard
                  product={{ ...product, isNew: index === 0 }}
                  quantity={cartQuantities[product.id] || 0}
                  onIncrease={increaseCart}
                  onDecrease={decreaseCart}
                  isFavorite={favoriteIds.has(product.id)}
                  onFavorite={toggleFavorite}
                  key={`new-${product.id}`}
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
        .then((items) => setFavoriteIds(favoriteIdSet(items)))
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
      const syncedFavorites = await api.favorites();
      setFavoriteIds(favoriteIdSet(syncedFavorites));
    } catch (e) {
      setError(e.message);
    }
  };
  const selectedCategory = categoryId ? data.find((category) => category.id === categoryId) : null;
  const displayCategories = data.length ? data : fallbackCategories;
  const categorySections = (selectedCategory ? [selectedCategory] : data)
    .map((category) => ({
      category,
      products: products.filter((product) => (product.category?.id || product.categoryId) === category.id),
    }))
    .filter((section) => selectedCategory || section.products.length);
  const splitIndex = Math.max(2, Math.ceil(products.length / 2));
  const visibleCategorySections =
    !selectedCategory && categorySections.length < 2 && products.length
      ? [
          { category: data[0] || fallbackCategories[0], products: products.slice(0, splitIndex) },
          { category: fallbackCategories[1], products: products.slice(splitIndex) },
        ].filter((section) => section.products.length)
      : categorySections;
  return (
    <Page>
      {error && <p className="error">{error}</p>}
      <div className="page-head">
        <h1>جميع الفئات</h1>
        <Link className="muted" to="/categories">
          عرض الكل
        </Link>
      </div>
      <div className="category-circles">
        {displayCategories.map((category, index) => (
          <Link
            className={`category-circle ${category.id === categoryId || (!categoryId && index === 0) ? 'active' : ''}`}
            to={category.id?.startsWith?.('fallback-') ? '/categories' : `/categories?categoryId=${category.id}`}
            key={category.id}
          >
            <span className="category-circle-button">
              <span className="material-symbols-outlined">{category.icon || categoryIcon(category.name)}</span>
            </span>
            <span title={category.name}>{category.name}</span>
          </Link>
        ))}
      </div>
      {visibleCategorySections.length ? (
        visibleCategorySections.map((section) => (
          <section className="section" key={section.category.id}>
            <div className="section-head category-section-head">
              <span className="material-symbols-outlined">arrow_back</span>
              <h2>{section.category.name}</h2>
            </div>
            {section.products.length ? (
              <div className="product-list category-product-list">
                {section.products.map((product) => (
                  <ProductCard
                    product={product}
                    quantity={cartQuantities[product.id] || 0}
                    onIncrease={increaseCart}
                    onDecrease={decreaseCart}
                    isFavorite={favoriteIds.has(product.id)}
                    onFavorite={toggleFavorite}
                    showFavorite={false}
                    key={product.id}
                  />
                ))}
              </div>
            ) : (
              <div className="state">لا توجد منتجات ضمن هذه الفئة بعد.</div>
            )}
          </section>
        ))
      ) : (
        <div className="state">لا توجد منتجات بعد.</div>
      )}
    </Page>
  );
}

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [cartQuantities, setCartQuantities] = useState({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setMessage('');
    api
      .product(id)
      .then(setProduct)
      .catch((e) => setMessage(e.message || 'تعذر تحميل المنتج'))
      .finally(() => setLoading(false));

    if (localStorage.getItem('aura_token')) {
      api
        .favorites()
        .then((items) => setIsFavorite(items.some((item) => item.productId === id)))
        .catch(() => {});
      api
        .cart()
        .then((items) => setCartQuantities(Object.fromEntries(items.map((item) => [item.productId, item.quantity]))))
        .catch(() => {});
      api
        .reviews()
        .then((items) => {
          setReviews(items.filter((item) => item.productId === id));
          const current = items.find((item) => item.productId === id);
          if (current) setReviewForm({ rating: current.rating, comment: current.comment || '' });
        })
        .catch(() => {});
    }
  }, [id]);

  const increaseCart = () =>
    changeCartQuantity({
      id,
      quantity: cartQuantities[id] || 0,
      delta: 1,
      setQuantities: setCartQuantities,
      setError: setMessage,
      navigate,
    });

  const toggleFavorite = async () => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    try {
      if (nextFavorite) await api.favorite(id);
      else await api.removeFavorite(id);
    } catch (e) {
      setMessage(e.message || 'تعذر تحديث الإعجاب');
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    try {
      const saved = await api.saveReview({ productId: id, ...reviewForm });
      setReviews((items) => [saved, ...items.filter((item) => item.productId !== saved.productId)]);
      setMessage('تم حفظ التقييم بنجاح');
    } catch (e) {
      setMessage(e.message || 'تعذر حفظ التقييم');
    }
  };

  return (
    <Page>
      {message && <p className={message.includes('تم') ? 'success' : 'error'}>{message}</p>}
      {loading ? (
        <div className="state">جاري تحميل المنتج...</div>
      ) : product ? (
        <article className="product-details">
          <div className="details-media">
            <img src={product.imageUrl || image} alt={product.name} />
            <button
              className={`favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={toggleFavorite}
              aria-label="إعجاب"
            >
              <span className="material-symbols-outlined">{isFavorite ? 'favorite' : 'favorite_border'}</span>
            </button>
          </div>
          <div className="details-body">
            <span className="muted">{product.category?.name || 'منتج Aura'}</span>
            <h1>{product.name}</h1>
            {product.description && <p>{product.description}</p>}
            <div className="details-price">
              <strong>{money(product.price)}</strong>
              <span>{product.stock > 0 ? 'متوفر' : 'غير متوفر حالياً'}</span>
            </div>
            <button className="primary full checkout-button" onClick={increaseCart} disabled={product.stock <= 0}>
              <span className="material-symbols-outlined">add_shopping_cart</span>
              إضافة للسلة
            </button>
          </div>

          <section className="details-review">
            <h2>قيّمي المنتج</h2>
            <form className="review-form" onSubmit={submitReview}>
              <div className="rating-picker" aria-label="التقييم">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    className={Number(reviewForm.rating) >= rating ? 'active' : ''}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating })}
                    aria-label={`${rating} من 5`}
                    key={rating}
                  >
                    <span className="material-symbols-outlined">star</span>
                  </button>
                ))}
              </div>
              <label>
                <span>ملاحظتك</span>
                <textarea
                  value={reviewForm.comment}
                  placeholder="اكتبي رأيك بالمنتج"
                  onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
                />
              </label>
              <button className="primary full">حفظ التقييم</button>
            </form>
            {reviews.length ? (
              <div className="review-list">
                {reviews.map((review) => (
                  <article key={review.id}>
                    <strong>{review.product?.name || product.name}</strong>
                    <span>{'★'.repeat(review.rating)}</span>
                    {review.comment && <p>{review.comment}</p>}
                  </article>
                ))}
              </div>
            ) : (
              <div className="inline-state">لا يوجد تقييم محفوظ لهذا المنتج بعد.</div>
            )}
          </section>
        </article>
      ) : (
        <div className="state">المنتج غير متوفر.</div>
      )}
    </Page>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const navigate = useNavigate();
  const statusLabels = {
    PENDING: 'قيد الانتظار',
    PROCESSING: 'قيد التجهيز',
    COMPLETED: 'مكتمل',
    CANCELLED: 'ملغي',
  };
  const statusTabs = [
    { value: 'ALL', label: 'الكل' },
    { value: 'PENDING', label: statusLabels.PENDING },
    { value: 'PROCESSING', label: statusLabels.PROCESSING },
    { value: 'COMPLETED', label: statusLabels.COMPLETED },
    { value: 'CANCELLED', label: statusLabels.CANCELLED },
  ];
  const visibleOrders = activeStatus === 'ALL' ? orders : orders.filter((order) => order.status === activeStatus);

  useEffect(() => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    setLoading(true);
    setMessage('');
    api
      .orders()
      .then(setOrders)
      .catch((e) => {
        if (e.message === 'Authentication required') navigate('/login');
        else setMessage(e.message || 'تعذر تحميل الطلبات');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <Page title="مراجعة الطلبات">
      {message && <p className="error">{message}</p>}
      {loading ? (
        <div className="state">جاري تحميل الطلبات...</div>
      ) : orders.length ? (
        <>
          <div className="order-tabs" role="tablist" aria-label="حالات الطلبات">
            {statusTabs.map((tab) => {
              const count =
                tab.value === 'ALL' ? orders.length : orders.filter((order) => order.status === tab.value).length;
              return (
                <button
                  className={activeStatus === tab.value ? 'active' : ''}
                  type="button"
                  role="tab"
                  aria-selected={activeStatus === tab.value}
                  onClick={() => setActiveStatus(tab.value)}
                  key={tab.value}
                >
                  <span>{tab.label}</span>
                  <strong>{count}</strong>
                </button>
              );
            })}
          </div>
          {visibleOrders.length ? (
            <div className="orders-list">
              {visibleOrders.map((order) => (
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
            <div className="state">لا توجد طلبات بهذه الحالة.</div>
          )}
        </>
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
  const saveDeliveryAddress = (address) => {
    const cleanAddress = address.trim();
    if (!cleanAddress) {
      setMessage('اكتب الموقع الجديد أولاً');
      return false;
    }
    if (cleanAddress.length < 5) {
      setMessage('الموقع قصير جداً');
      return false;
    }
    const nextAddresses = [cleanAddress, ...deliveryAddresses.filter((item) => item !== cleanAddress)].slice(0, 5);
    localStorage.setItem('aura_delivery_addresses', JSON.stringify(nextAddresses));
    setDeliveryAddresses(nextAddresses);
    setSelectedAddress(cleanAddress);
    setNewAddress('');
    setMessage('تمت إضافة الموقع');
    return true;
  };
  const addDeliveryAddress = (event) => {
    event.preventDefault();
    saveDeliveryAddress(newAddress);
  };
  const order = async () => {
    const address = newAddress.trim() || selectedAddress;
    if (!address) {
      setMessage('اختر موقع التسليم أو أضف موقعاً جديداً');
      return;
    }
    if (newAddress.trim() && !saveDeliveryAddress(newAddress)) return;
    try {
      await api.createOrder(address);
      const nextAddresses = [address, ...deliveryAddresses.filter((item) => item !== address)].slice(0, 5);
      localStorage.setItem('aura_delivery_addresses', JSON.stringify(nextAddresses));
      setDeliveryAddresses(nextAddresses);
      setSelectedAddress(address);
      setNewAddress('');
      setItems([]);
      setMessage('تم تأكيد طلبك بنجاح');
      navigate('/orders');
    } catch (e) {
      setMessage(e.message);
    }
  };
  return (
    <Page title="سلة المشتريات">
      {message && <p className={message.includes('تم') ? 'success' : 'error'}>{message}</p>}
      {items.length ? (
        <>
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-card" key={item.productId}>
                <div className="cart-image-wrap">
                  <img src={item.product.imageUrl || image} alt={item.product.name} />
                  <button className="cart-remove" onClick={() => change(item, 0)} aria-label="حذف من السلة">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="cart-item-info">
                  <h3>{item.product.name}</h3>
                  <span>
                    {item.quantity} × {plainMoney(item.product.price)}
                  </span>
                  <strong>{plainMoney(Number(item.product.price) * item.quantity)}</strong>
                </div>
                <div className="cart-qty">
                  <button onClick={() => change(item, item.quantity + 1)} aria-label="زيادة الكمية">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                  <strong>{item.quantity}</strong>
                  <button onClick={() => change(item, item.quantity - 1)} aria-label="تقليل الكمية">
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
          <Link className="show-all-link" to="/categories">
            عرض الكل
          </Link>

          <section className="section checkout-card location-card">
            <div className="location-title">
              <span className="material-symbols-outlined">location_on</span>
              <h2>تحديد الموقع أو إضافة موقع جديد</h2>
            </div>
            <div className="delivery-box">
              <label className="address-choice selected">
                <span className="address-radio" />
                <span className="address-copy">
                  <strong>المنزل</strong>
                  <small>{selectedAddress || 'الرياض، حي العليا، شارع العروبة'}</small>
                </span>
                <select value={selectedAddress} onChange={(e) => setSelectedAddress(e.target.value)}>
                  <option value="">اختر موقع التسليم</option>
                  {deliveryAddresses.map((address) => (
                    <option key={address} value={address}>
                      {address}
                    </option>
                  ))}
                </select>
              </label>
              <form className="address-choice add-address" onSubmit={addDeliveryAddress}>
                <span className="material-symbols-outlined">add_location_alt</span>
                <input
                  value={newAddress}
                  placeholder="إضافة موقع جديد"
                  onChange={(e) => setNewAddress(e.target.value)}
                />
                <button type="submit">حفظ</button>
              </form>
            </div>
          </section>

          <section className="section checkout-card total-card">
            <h2>الإجمالي</h2>
            <div className="total-line">
              <span>المجموع الفرعي</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="total-line">
              <span>رسوم التوصيل</span>
              <strong>{money(25)}</strong>
            </div>
            <div className="total-final">
              <span>الإجمالي</span>
              <strong>{plainMoney(total + 25)}</strong>
              <small>ل.س</small>
            </div>
            <button className="primary full checkout-button" onClick={order}>
              <span className="material-symbols-outlined">shopping_cart_checkout</span>
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
  const [reviews, setReviews] = useState([]);
  const [cartQuantities, setCartQuantities] = useState({});
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('personal');
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('aura_token')) return navigate('/login');
    let mounted = true;
    api
      .me()
      .then(async (userData) => {
        if (!mounted) return;
        setUser(userData);
        setProfileForm({ name: userData.name || '', email: userData.email || '' });
        const results = await Promise.allSettled([api.favorites(), api.orders(), api.cart(), api.reviews()]);
        if (!mounted) return;
        const [favoriteData, orderData, cartData, reviewData] = results;
        if (favoriteData.status === 'fulfilled') setFavorites(favoriteData.value);
        if (orderData.status === 'fulfilled') setOrders(orderData.value);
        if (cartData.status === 'fulfilled') {
          setCartQuantities(Object.fromEntries(cartData.value.map((item) => [item.productId, item.quantity])));
        }
        if (reviewData.status === 'fulfilled') setReviews(reviewData.value);
        if (results.some((result) => result.status === 'rejected')) {
          setMessage('تعذر تحميل بعض بيانات الحساب، جرّب تحديث الصفحة');
        }
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
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

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await api.updateProfile(profileForm);
      setUser(updated);
      setProfileForm({ name: updated.name || '', email: updated.email || '' });
      setMessage('تم حفظ البيانات بنجاح');
    } catch (e) {
      setMessage(e.message || 'تعذر حفظ البيانات');
    } finally {
      setSavingProfile(false);
    }
  };

  const changeAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const updated = await api.uploadAvatar(file);
      setUser(updated);
      setMessage('تم تغيير الصورة بنجاح');
    } catch (e) {
      setMessage(e.message || 'تعذر تغيير الصورة');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const accountRows = [
    { id: 'orders', label: 'طلباتي', icon: 'local_mall', tone: 'rose' },
    { id: 'reviews', label: 'تقييماتي', icon: 'star', tone: 'sage' },
    { id: 'favorites', label: 'إعجاباتي', icon: 'favorite', tone: 'pink' },
    { id: 'personal', label: 'بيانات شخصية', icon: 'person', tone: 'brown' },
    { id: 'password', label: 'تغيير كلمة المرور', icon: 'lock', tone: 'gray' },
  ];

  return (
    <Page>
      {message && <p className={message.includes('تم') ? '' : 'error'}>{message}</p>}
      <section className="account-hero">
        <div className="avatar-wrap">
          <img src={user?.avatarUrl || profileImage} alt={user?.name || 'حساب Aura'} />
          <label className={uploadingAvatar ? 'uploading' : ''} aria-label="تعديل الصورة">
            <span className="material-symbols-outlined">edit</span>
            <input type="file" accept="image/*" onChange={changeAvatar} disabled={uploadingAvatar} />
          </label>
        </div>
        <h1>{user?.name || 'حساب Aura'}</h1>
        <p>{user?.email || 'جاري التحميل...'}</p>
      </section>

      {loading ? (
        <div className="state">جاري التحميل...</div>
      ) : (
        <>
          <section className="account-menu">
            {accountRows.map((row) => (
              <article className={`account-row ${activeSection === row.id ? 'open' : ''}`} key={row.id}>
                <button type="button" onClick={() => setActiveSection(activeSection === row.id ? null : row.id)}>
                  <span className={`account-icon ${row.tone}`}>
                    <span className="material-symbols-outlined">{row.icon}</span>
                  </span>
                  <strong>{row.label}</strong>
                  <span className="material-symbols-outlined">
                    {activeSection === row.id ? 'expand_more' : 'chevron_left'}
                  </span>
                </button>

                {row.id === 'personal' && activeSection === 'personal' && (
                  <form className="personal-panel" onSubmit={saveProfile}>
                    <label>
                      <span>الاسم</span>
                      <input
                        required
                        minLength="2"
                        value={profileForm.name}
                        onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                      />
                    </label>
                    <label>
                      <span>البريد الإلكتروني / الهاتف</span>
                      <input
                        required
                        type="email"
                        value={profileForm.email}
                        onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                      />
                    </label>
                    <button className="primary full" disabled={savingProfile}>
                      حفظ البيانات
                    </button>
                  </form>
                )}

                {row.id === 'reviews' && activeSection === 'reviews' && (
                  <div className="reviews-panel">
                    {reviews.length ? (
                      <div className="review-list">
                        {reviews.map((review) => (
                          <article key={review.id}>
                            <strong>{review.product?.name || 'منتج Aura'}</strong>
                            <span>{'★'.repeat(review.rating)}</span>
                            {review.comment && <p>{review.comment}</p>}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="inline-state">لا توجد تقييمات محفوظة بعد.</div>
                    )}
                  </div>
                )}

                {row.id === 'favorites' && activeSection === 'favorites' && (
                  <div className="account-inline-panel">
                    <div className="section-head compact">
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
                            variant="row"
                            key={item.productId}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="inline-state">لا توجد منتجات في إعجاباتك بعد.</div>
                    )}
                  </div>
                )}

                {row.id === 'orders' && activeSection === 'orders' && (
                  <div className="account-inline-panel">
                    <div className="section-head compact">
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
                      <div className="inline-state">لا توجد طلبات بعد.</div>
                    )}
                  </div>
                )}

                {row.id === 'password' && activeSection === 'password' && (
                  <div className="account-inline-panel">
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
                  </div>
                )}
              </article>
            ))}
          </section>

          <section className="section logout-section">
            <button className="primary" onClick={logout}>
              <span className="material-symbols-outlined">logout</span>
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
        <Route path="/products/:id" element={<ProductDetails />} />
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
