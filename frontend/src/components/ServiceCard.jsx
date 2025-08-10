import { Link } from 'react-router-dom';

export default function ServiceCard({ service }) {
  return (
    <div className="card">
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <div className="row">
        <span className="price">${service.price.toFixed(2)}</span>
        <Link to={`/services/${service._id}`} className="btn">View</Link>
      </div>
    </div>
  );
}
