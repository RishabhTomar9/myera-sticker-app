import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { gsap } from 'gsap';
import '@dotlottie/player-component';
import './index.css';

const Sticker = ({ sticker, isSelected, onSelect, onChange, onDblClick }) => {
  const [image] = useImage(sticker.src);
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        image={image}
        x={sticker.x}
        y={sticker.y}
        width={60}
        height={60}
        draggable
        scaleX={sticker.scaleX || 1}
        scaleY={sticker.scaleY || 1}
        onClick={onSelect}
        onTap={onSelect}
        onDblClick={onDblClick}
        ref={shapeRef}
        onDragEnd={(e) => {
          onChange({
            ...sticker,
            x: Math.round(e.target.x() / 40) * 40,
            y: Math.round(e.target.y() / 40) * 40,
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...sticker,
            x: node.x(),
            y: node.y(),
            scaleX,
            scaleY,
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
          anchorSize={8}
        />
      )}
    </>
  );
};

const Canvas = () => {
  const stageRef = useRef();
  const [stickers, setStickers] = useState([]);
  const [stickerId, setStickerId] = useState(1);
  const [previews, setPreviews] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('stickers');
    if (stored) {
      const parsed = JSON.parse(stored);
      setStickers(parsed);
      setStickerId(parsed.length + 1);
      setPreviews(parsed.map((s) => s.src));
    }
  }, []);

  useEffect(() => {
    gsap.from('.toolbar', {
      y: -50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    });
  }, []);

  const saveToLocalStorage = (updatedStickers) => {
    const safeData = updatedStickers.filter((s) => !s.src.startsWith('blob:'));
    localStorage.setItem('stickers', JSON.stringify(safeData));
    setPreviews(updatedStickers.map((s) => s.src));
  };

  const saveHistory = (current) => {
    setHistory([...history, current]);
    setFuture([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture([stickers, ...future]);
    setHistory(history.slice(0, -1));
    setStickers(prev);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory([...history, stickers]);
    setFuture(future.slice(1));
    setStickers(next);
  };

  const addSticker = (src) => {
    saveHistory(stickers);
    const canvasWidth = 600;
    const canvasHeight = 400;
    const newSticker = {
      id: stickerId,
      src,
      x: Math.round(Math.random() * (canvasWidth - 60)),
      y: Math.round(Math.random() * (canvasHeight - 60)),
      scaleX: 1,
      scaleY: 1,
    };
    const updated = [...stickers, newSticker];
    setStickers(updated);
    setStickerId(stickerId + 1);
    saveToLocalStorage(updated);
  };

  const updateSticker = (updatedSticker) => {
    saveHistory(stickers);
    const updated = stickers.map((s) => (s.id === updatedSticker.id ? updatedSticker : s));
    setStickers(updated);
    saveToLocalStorage(updated);
  };

  const handleDelete = (id) => {
    saveHistory(stickers);
    const updated = stickers.filter((s) => s.id !== id);
    setStickers(updated);
    setSelectedId(null);
    saveToLocalStorage(updated);
  };

  const handleDeleteBySrc = (src) => {
    saveHistory(stickers);
    const updated = stickers.filter((s) => s.src !== src);
    setStickers(updated);
    setSelectedId(null);
    saveToLocalStorage(updated);
  };

  const bringToFront = (id) => {
    saveHistory(stickers);
    const index = stickers.findIndex((s) => s.id === id);
    if (index === -1) return;
    const updated = [...stickers];
    const [item] = updated.splice(index, 1);
    updated.push(item);
    setStickers(updated);
    saveToLocalStorage(updated);
  };

  const sendToBack = (id) => {
    saveHistory(stickers);
    const index = stickers.findIndex((s) => s.id === id);
    if (index === -1) return;
    const updated = [...stickers];
    const [item] = updated.splice(index, 1);
    updated.unshift(item);
    setStickers(updated);
    saveToLocalStorage(updated);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const objectURL = URL.createObjectURL(file);
    addSticker(objectURL);
  };

  const downloadCanvas = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'sticker-canvas.png';
    link.href = uri;
    link.click();
  };

  return (
    <div className="canvas-wrapper">
      <div className="canvas-controls">
        <Stage
          width={600}
          height={400}
          ref={stageRef}
          className="canvas"
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) setSelectedId(null);
          }}
        >
          <Layer>
            {stickers.map((sticker) => (
              <Sticker
                key={sticker.id}
                sticker={sticker}
                isSelected={sticker.id === selectedId}
                onSelect={() => setSelectedId(sticker.id)}
                onChange={updateSticker}
                onDblClick={() => handleDelete(sticker.id)}
              />
            ))}
          </Layer>
        </Stage>

        <div className="toolbar">
          <button onClick={() => addSticker('/logo192.png')}>😀</button>
          <button onClick={() => addSticker('/logo512.png')}>🌟</button>
          <button onClick={() => addSticker('/logo512.png')}>🔥</button>
          <dotlottie-player
            src="https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.lottie"
            background="transparent"
            speed="1"
            style={{ width: '60px', height: '60px', cursor: 'pointer' }}
            loop
            autoplay
            onClick={() => addSticker('https://assets2.lottiefiles.com/packages/lf20_u4yrau.json')}
          />

          <label className="upload-label">
            <input type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} />
            Upload
          </label>

          <button onClick={downloadCanvas}>Download</button>
          <button onClick={undo}>↩️ Undo</button>
          <button onClick={redo}>↪️ Redo</button>
          {selectedId && (
            <>
              <button onClick={() => bringToFront(selectedId)}>🔼 Front</button>
              <button onClick={() => sendToBack(selectedId)}>🔽 Back</button>
            </>
          )}
        </div>

        <div className="preview-box">
          <h4>Preview</h4>
          <div className="preview-grid">
            {previews.map((src, index) => (
              <div key={index} className="preview-item">
                <img src={src} alt={`preview-${index}`} width={40} height={40} />
                <button className="delete-btn" onClick={() => handleDeleteBySrc(src)}>✖</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
