async function request(path, { method = 'GET', body, formData } = {}) {
  const opts = { method, credentials: 'same-origin', headers: {} };
  if (formData) opts.body = formData;
  else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`/api${path}`, opts);
  } catch {
    throw Object.assign(new Error('Network error. Check your connection and try again.'), { status: 0 });
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    throw Object.assign(new Error((data && data.error) || 'Something went wrong'), { status: res.status, fields: (data && data.fields) || {} });
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
  upload: (p, formData) => request(p, { method: 'POST', formData }),
};

export const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// Cloudinary delivery transforms: smaller, auto-format images.
export function img(url, width = 800) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}
