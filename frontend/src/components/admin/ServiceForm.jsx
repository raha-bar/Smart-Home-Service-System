import Input from '../ui/Input';
import Button from '../ui/Button';
import { useState } from 'react';

export default function ServiceForm({ initial = {}, onSubmit, pending }) {
  const [category, setCategory] = useState(initial.category || 'Other');

  function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name')?.trim(),
      description: fd.get('description')?.trim(),
      category: fd.get('category') || 'Other',
      price: Number(fd.get('price') || 0),
      durationMin: Number(fd.get('durationMin') || 60),
      active: fd.get('active') ? true : false
    };
    onSubmit?.(payload);
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label style={{ gridColumn: '1 / -1' }}>
          Name
          <Input name="name" defaultValue={initial.name || ''} required />
        </label>

        <label>
          Category
          <select
            name="category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option>Cleaning</option>
            <option>Electrical</option>
            <option>Plumbing</option>
            <option>HVAC</option>
            <option>Repair</option>
            <option>Other</option>
          </select>
        </label>

        <label>
          Price
          <Input name="price" type="number" step="0.01" defaultValue={initial.price || 0} required />
        </label>
      </div>

      <label>
        Description
        <textarea
          className="input"
          name="description"
          rows={4}
          defaultValue={initial.description || ''}
          required
        />
      </label>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label>
          Duration (min)
          <Input name="durationMin" type="number" defaultValue={initial.durationMin || 60} />
        </label>
        <label className="row" style={{ gap: 8, alignItems: 'center' }}>
          <input type="checkbox" name="active" defaultChecked={initial.active !== false} />
          <span>Active</span>
        </label>
      </div>

      <Button variant="primary" disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
