import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FiCamera, FiStopCircle } from 'react-icons/fi';

export default function BarcodeScanner({ onScan }) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 100 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {} // ignore errors during scanning
      );

      setScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please enter barcode manually.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="scanner-container">
        <div id="barcode-reader" ref={containerRef} style={{ maxWidth: 400, margin: '0 auto' }} />
        {!scanning ? (
          <button className="btn btn-primary scanner-btn" onClick={startScanning}>
            <FiCamera /> Open Camera Scanner
          </button>
        ) : (
          <button className="btn btn-danger scanner-btn" onClick={stopScanning}>
            <FiStopCircle /> Stop Scanner
          </button>
        )}
      </div>

      <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Or enter barcode number manually..."
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-outline btn-sm">Lookup</button>
      </form>
    </div>
  );
}
