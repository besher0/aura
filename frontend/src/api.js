const API_BASE_URL = (__API_BASE_URL__ || '').replace(/\/$/, '');

export const request = async (url, options = {}) => {
  const token = localStorage.getItem('aura_token');
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}/api${url}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'تعذر إكمال الطلب');
  return body.data;
};

export const api = {
  me: () => request('/auth/me'),
  products: (params) => request(`/products?${new URLSearchParams(params)}`),
  product: (id) => request(`/products/${id}`),
  categories: () => request('/categories'),
  stores: () => request('/stores'),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data) => request('/auth/password', { method: 'PATCH', body: JSON.stringify(data) }),
  updateProfile: (data) => request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  uploadAvatar: (file) => {
    const body = new FormData();
    body.append('avatar', file);
    return request('/users/me/avatar', { method: 'POST', body });
  },
  cart: () => request('/cart'),
  addCart: (productId, quantity = 1) =>
    request('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCart: (productId, quantity) =>
    request(`/cart/items/${productId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  removeCart: (productId) => request(`/cart/items/${productId}`, { method: 'DELETE' }),
  favorites: () => request('/favorites'),
  favorite: (productId) => request(`/favorites/${productId}`, { method: 'POST' }),
  removeFavorite: (productId) => request(`/favorites/${productId}`, { method: 'DELETE' }),
  reviews: () => request('/reviews'),
  saveReview: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  orders: () => request('/orders'),
  createOrder: (address) => request('/orders', { method: 'POST', body: JSON.stringify({ address }) }),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  dashboard: () => request('/admin/dashboard'),
};
