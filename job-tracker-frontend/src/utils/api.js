export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Automatically parse json if response is ok
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Something went wrong');
  }

  return data;
};
