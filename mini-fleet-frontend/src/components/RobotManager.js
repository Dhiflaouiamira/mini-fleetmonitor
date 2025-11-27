import { useState } from 'react';
import axios from 'axios';

export default function RobotManager({ onUpdate }) {
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');

  const token = localStorage.getItem('token');

  const addRobot = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        'http://localhost:3000/robots',
        { name, lat: Number(lat), lon: Number(lon) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setName(''); setLat(''); setLon('');
      onUpdate(res.data); // refresh list/map
    } catch (err) {
      alert('Error adding robot');
      console.error(err);
    }
  };

  const deleteRobot = async (id) => {
    if (!window.confirm('Delete this robot?')) return;
    try {
      await axios.delete(`http://localhost:3000/robots/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate(); // refresh list/map
    } catch (err) {
      alert('Error deleting robot');
      console.error(err);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <h3>Add Robot</h3>
      <form onSubmit={addRobot} style={{ display: 'flex', gap: 6 }}>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />
        <input placeholder="Lat" value={lat} onChange={e=>setLat(e.target.value)} required />
        <input placeholder="Lon" value={lon} onChange={e=>setLon(e.target.value)} required />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
