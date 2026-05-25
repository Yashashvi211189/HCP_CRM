function ProtectedRoute({ token, fallback, children }) {
  return token ? children : fallback;
}

export default ProtectedRoute;
