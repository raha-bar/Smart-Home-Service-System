import { Link } from 'react-router-dom';

export default function ServiceCard({ service }) {
  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
      <h3 style={{ margin: '4px 0' }}>{service.name}</h3>
      <p style={{ margin: '4px 0', color: '#555' }}>{service.description}</p>
      <strong>${service.price.toFixed(2)}</strong>
      <div>
        <Link to={`/services/${service._id}`}>View</Link>
      </div>
    </div>
  );
}