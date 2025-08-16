import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import Button from './ui/Button';

export default function ServiceCard({ service }) {
  const price = Number(service.price || 0).toFixed(2);
  const category = service.category || 'General';
  const rating = service.rating || 4.6;

  return (
    <div className="card">
      <div className="row space-between" style={{marginBottom:8}}>
        <h3 style={{margin:0}}>{service.name}</h3>
        <Badge>{category}</Badge>
      </div>
      <p className="muted" style={{minHeight:40}}>{service.description}</p>

      <div className="row space-between" style={{marginTop:10}}>
        <div className="row" style={{gap:10}}>
          <span className="price">${price}</span>
          <span className="muted">•</span>
          <span aria-label="rating">⭐ {rating}</span>
        </div>
        <div className="row" style={{gap:8}}>
          <Button as={Link} to={`/services/${service._id}`} variant="ghost" className="btn-sm">View</Button>
          <Button as={Link} to={`/book/${service._id}`} variant="primary" className="btn-sm">Book</Button>
        </div>
      </div>
    </div>
  );
}
