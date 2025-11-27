// src/components/Dashboard.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import 'ol/ol.css';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Icon } from 'ol/style';

export default function Dashboard({ onLogout }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const sourceRef = useRef(new VectorSource());
  const featuresById = useRef(new Map());
  const wsRef = useRef(null);

  const [robots, setRobots] = useState([]);
  const [newRobot, setNewRobot] = useState({ name: '', lat: '', lon: '' });
  const [simulationRunning, setSimulationRunning] = useState(false);

  const makeIconStyle = (status) =>
    new Style({
      image: new Icon({
        src:
          status === 'moving'
            ? 'https://cdn-icons-png.flaticon.com/512/3530/3530107.png'
            : 'https://cdn-icons-png.flaticon.com/512/3529/3529516.png',
        scale: 0.05,
        anchor: [0.5, 1],
      }),
    });

  // Fetch robots from API
  const fetchRobots = useCallback(() => {
    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:3000/robots', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('Fetched robots', res.data);
        setRobots(res.data);
        res.data.forEach((r) => upsertFeature(r));
      })
      .catch(console.error);
  }, []);

  // Update or create feature on map
  const upsertFeature = useCallback((robot) => {
    if (!robot?.id) return;
    const id = String(robot.id);
    const coord = fromLonLat([Number(robot.lon), Number(robot.lat)]);

    console.log('upsertFeature', id, robot.lat, robot.lon, coord);

    const existing = sourceRef.current.getFeatureById(id);
    if (existing) {
      sourceRef.current.removeFeature(existing);
    }

    const f = new Feature({ geometry: new Point(coord) });
    f.setId(id);
    f.setStyle(makeIconStyle(robot.status || 'moving'));
    sourceRef.current.addFeature(f);
  }, []);

  // Start simulation
  const startSimulation = useCallback(async () => {
    const token = localStorage.getItem('token');
    console.log('Calling start simulation...');
    try {
      const res = await axios.post(
        'http://localhost:3000/simulation/start',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Start response:', res.data);
      setSimulationRunning(true);
    } catch (err) {
      console.error('Start error:', err.response?.data || err.message);
      alert('Failed to start simulation: ' + (err.response?.data?.message || err.message));
    }
  }, []);

  // Stop simulation
  const stopSimulation = useCallback(async () => {
    const token = localStorage.getItem('token');
    console.log('Calling stop simulation...');
    try {
      const res = await axios.post(
        'http://localhost:3000/simulation/stop',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Stop response:', res.data);
      setSimulationRunning(false);
    } catch (err) {
      console.error('Stop error:', err.response?.data || err.message);
      alert('Failed to stop simulation: ' + (err.response?.data?.message || err.message));
    }
  }, []);

  // Initialize map and WebSocket
  useEffect(() => {
    if (!mapRef.current) {
      vectorLayerRef.current = new VectorLayer({ source: sourceRef.current });
      mapRef.current = new Map({
        target: mapDivRef.current,
        layers: [new TileLayer({ source: new OSM() }), vectorLayerRef.current],
        view: new View({ center: fromLonLat([0, 0]), zoom: 2 }),
      });
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      window.location.href = '/';
      return;
    }

    fetchRobots();

    wsRef.current = new WebSocket('ws://localhost:8081');

    wsRef.current.onopen = () => {
      console.log('WebSocket connected to ws://localhost:8081');
    };

    wsRef.current.onmessage = (evt) => {
      try {
        const robotsData = JSON.parse(evt.data);
        console.log('WS robots', robotsData);
        if (Array.isArray(robotsData)) {
          setRobots(robotsData);
          robotsData.forEach((r) => upsertFeature(r));
        }
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    wsRef.current.onerror = (err) => {
      console.error('WebSocket error', err);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => wsRef.current?.close();
  }, [fetchRobots, upsertFeature]);

  // Add new robot
  const handleAddRobot = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        'http://localhost:3000/robots/add',
        {
          name: newRobot.name,
          lat: Number(newRobot.lat),
          lon: Number(newRobot.lon),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      upsertFeature(res.data);
      setRobots((prev) => [...prev, res.data]);
      setNewRobot({ name: '', lat: '', lon: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to add robot');
    }
  };

  // Move single robot
  const handleMoveRobot = async (robotId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        `http://localhost:3000/robots/${robotId}/move`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Robot moved:', res.data);
      upsertFeature(res.data);
    } catch (err) {
      console.error('Move robot error:', err);
      alert('Failed to move robot');
    }
  };

  // Delete robot
  const handleDeleteRobot = async (id) => {
    if (!window.confirm('Delete this robot?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:3000/robots/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRobots((prev) => prev.filter((r) => r.id !== id));
      const f = sourceRef.current.getFeatureById(String(id));
      if (f) sourceRef.current.removeFeature(f);
    } catch (err) {
      console.error(err);
      alert('Failed to delete robot');
    }
  };

  const statCard = {
    background: '#0f172a',
    color: '#e5e7eb',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxShadow: '0 6px 18px rgba(15,23,42,0.3)',
  };

  const pill = (bg) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 999,
    fontSize: 11,
    background: bg,
    color: '#0f172a',
    fontWeight: 600,
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#e5e7eb',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background:
            'radial-gradient(circle at 0% 0%, rgba(56,189,248,0.25), transparent 55%), #020617',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #22c55e, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            R
          </div>
          <div>
            <div style={{ fontWeight: 600, letterSpacing: 0.4 }}>
              Mini‑Fleet Monitor
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Live robots tracking dashboard
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Robots: <strong>{robots.length}</strong>
          </span>
          <button
            onClick={onLogout}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid #dc2626',
              background: 'rgba(220,38,38,0.12)',
              color: '#fecaca',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: '16px 24px' }}>
        {/* Top stats row */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <div style={statCard}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Robots</span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{robots.length}</span>
            <span style={pill('rgba(52,211,153,0.18)')}>Live</span>
          </div>

          <div style={statCard}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Simulation</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {simulationRunning ? 'Running' : 'Stopped'}
            </span>
            <span
              style={pill(
                simulationRunning
                  ? 'rgba(74,222,128,0.25)'
                  : 'rgba(248,250,252,0.12)'
              )}
            >
              {simulationRunning ? 'Streaming movements' : 'Idle'}
            </span>
          </div>

          <div style={{ ...statCard, flexGrow: 1, minWidth: 220 }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Controls</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button
                onClick={startSimulation}
                disabled={simulationRunning}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: simulationRunning ? 'default' : 'pointer',
                  background: simulationRunning
                    ? 'rgba(52,211,153,0.18)'
                    : 'linear-gradient(135deg,#22c55e,#16a34a)',
                  color: '#ecfdf5',
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: simulationRunning ? 0.6 : 1,
                }}
              >
                Start
              </button>
              <button
                onClick={stopSimulation}
                disabled={!simulationRunning}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.6)',
                  background: 'transparent',
                  color: '#e5e7eb',
                  fontSize: 13,
                  cursor: !simulationRunning ? 'default' : 'pointer',
                  opacity: !simulationRunning ? 0.5 : 1,
                }}
              >
                Stop
              </button>
            </div>
          </div>
        </div>

        {/* Main split: map + side panel */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'stretch',
          }}
        >
          {/* Map card */}
          <div
            style={{
              flex: 1.6,
              background: '#020617',
              borderRadius: 14,
              border: '1px solid #1f2937',
              overflow: 'hidden',
              boxShadow: '0 18px 45px rgba(15,23,42,0.65)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #1f2937',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <span style={{ fontWeight: 600 }}>Live Map</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                WebSocket: ws://localhost:8081
              </span>
            </div>
            <div ref={mapDivRef} style={{ width: '100%', height: '640px' }} />
          </div>

          {/* Right column */}
          <div
            style={{
              width: 340,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Add robot card */}
            <div
              style={{
                background: '#020617',
                borderRadius: 14,
                border: '1px solid #1f2937',
                padding: 12,
                boxShadow: '0 12px 30px rgba(15,23,42,0.7)',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Add Robot
              </h3>
              <form
                onSubmit={handleAddRobot}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <input
                  placeholder="Name"
                  value={newRobot.name}
                  onChange={(e) =>
                    setNewRobot({ ...newRobot, name: e.target.value })
                  }
                  required
                  style={{
                    padding: '6px 8px',
                    borderRadius: 8,
                    border: '1px solid #1f2937',
                    background: '#020617',
                    color: '#e5e7eb',
                    fontSize: 13,
                  }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    placeholder="Lat"
                    value={newRobot.lat}
                    onChange={(e) =>
                      setNewRobot({ ...newRobot, lat: e.target.value })
                    }
                    required
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: '1px solid #1f2937',
                      background: '#020617',
                      color: '#e5e7eb',
                      fontSize: 13,
                    }}
                  />
                  <input
                    placeholder="Lon"
                    value={newRobot.lon}
                    onChange={(e) =>
                      setNewRobot({ ...newRobot, lon: e.target.value })
                    }
                    required
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: '1px solid #1f2937',
                      background: '#020617',
                      color: '#e5e7eb',
                      fontSize: 13,
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    marginTop: 4,
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg,#3b82f6,#22c55e)',
                    color: '#f9fafb',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add robot
                </button>
              </form>
            </div>

            {/* Robots list card */}
            <div
              style={{
                flex: 1,
                background: '#020617',
                borderRadius: 14,
                border: '1px solid #1f2937',
                padding: 10,
                boxShadow: '0 12px 30px rgba(15,23,42,0.7)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 420,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Robots
                </h3>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {robots.length} tracked
                </span>
              </div>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  overflowY: 'auto',
                }}
              >
                {robots.map((r) => (
                  <li
                    key={r.id}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 10,
                      border: '1px solid #1f2937',
                      marginBottom: 6,
                      background: '#020617',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <strong style={{ fontSize: 13 }}>{r.name}</strong>
                      <span
                        style={pill(
                          r.status === 'moving'
                            ? 'rgba(74,222,128,0.3)'
                            : 'rgba(148,163,184,0.3)'
                        )}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#9ca3af',
                      }}
                    >
                      {Number(r.lat).toFixed(4)}, {Number(r.lon).toFixed(4)}
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button
                        onClick={() => handleMoveRobot(r.id)}
                        style={{
                          flex: 1,
                          padding: '3px 8px',
                          borderRadius: 999,
                          border: '1px solid rgba(59,130,246,0.7)',
                          background: 'transparent',
                          color: '#93c5fd',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Move
                      </button>
                      <button
                        onClick={() => handleDeleteRobot(r.id)}
                        style={{
                          flex: 1,
                          padding: '3px 8px',
                          borderRadius: 999,
                          border: '1px solid rgba(239,68,68,0.7)',
                          background: 'transparent',
                          color: '#fecaca',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}

                {robots.length === 0 && (
                  <li
                    style={{
                      padding: 10,
                      fontSize: 12,
                      color: '#6b7280',
                      textAlign: 'center',
                    }}
                  >
                    No robots yet. Add one to start.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
