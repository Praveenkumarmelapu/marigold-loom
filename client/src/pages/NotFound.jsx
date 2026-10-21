import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="container state-box">
      <p className="eyebrow">404</p>
      <h1>This page has wandered off</h1>
      <p>The link may be old or mistyped.</p>
      <Link className="btn" to="/">Back to home</Link>
    </div>
  );
}
