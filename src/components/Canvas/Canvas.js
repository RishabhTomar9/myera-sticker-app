import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import image_url from '../file_paths';
import './index.css';

const tourSteps = [
  {
    selector: '.toolbar button:nth-child(1)', // 😀 button
    content: 'Click here to add a smiley sticker.',
  },
  {
    selector: '.random-btn',
    content: 'Click here to add a random sticker.',
  },
  {
    selector: '.upload-label',
    content: 'Upload your own sticker from your device here.',
  },
  {
    selector: '.toolbar button:nth-child(7)', // Undo button
    content: 'Undo your last action.',
  },
  {
    selector: '.toolbar button:nth-child(8)', // Redo button
    content: 'Redo your last undone action.',
  },
  {
    selector: '.toolbar button:nth-child(6)', // Download button
    content: 'Download the current canvas as an image.',
  },
];

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
        width={80}
        height={80}
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
        onTransformEnd={() => {
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
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
          }
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
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [isTourActive, setIsTourActive] = useState(true);
  const [stickerSources, setStickerSources] = useState([]);

  useEffect(() => {
    setStickerSources(image_url);
  }, []);

  const saveHistory = (current) => {
    setHistory((h) => [...h, current]);
    setFuture([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture((f) => [stickers, ...f]);
    setHistory((h) => h.slice(0, -1));
    setStickers(prev);
    setSelectedId(null);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, stickers]);
    setFuture((f) => f.slice(1));
    setStickers(next);
    setSelectedId(null);
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
    setSelectedId(newSticker.id);
  };

  const addRandomSticker = () => {
    if (stickerSources.length === 0) return;
    const randomIndex = Math.floor(Math.random() * stickerSources.length);
    addSticker(stickerSources[randomIndex]);
  };

  const updateSticker = (updatedSticker) => {
    saveHistory(stickers);
    const updated = stickers.map((s) =>
      s.id === updatedSticker.id ? updatedSticker : s
    );
    setStickers(updated);
  };

  const handleDelete = (id) => {
    saveHistory(stickers);
    const updated = stickers.filter((s) => s.id !== id);
    setStickers(updated);
    if (selectedId === id) setSelectedId(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const objectURL = URL.createObjectURL(file);
    addSticker(objectURL);
  };

  const downloadCanvas = () => {
    setIsTourActive(false);
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = 'sticker-canvas.png';
    link.href = uri;
    link.click();
  };

  const currentStep = tourSteps[tourStepIndex];

  useEffect(() => {
    if (
      isTourActive &&
      currentStep?.requireSelected &&
      !selectedId
    ) {
      if (tourStepIndex + 1 < tourSteps.length) {
        setTourStepIndex(tourStepIndex + 1);
      } else {
        setIsTourActive(false);
      }
    }
  }, [tourStepIndex, selectedId, isTourActive, currentStep]);

  const nextStep = () => {
    if (tourStepIndex + 1 < tourSteps.length) {
      setTourStepIndex(tourStepIndex + 1);
    } else {
      setIsTourActive(false);
    }
  };

  const skipTour = () => {
    setIsTourActive(false);
  };

  const [tooltipStyle, setTooltipStyle] = useState({});

  useEffect(() => {
    if (!isTourActive) {
      setTooltipStyle({ display: 'none' });
      return;
    }
    if (!currentStep) return;
    const elem = document.querySelector(currentStep.selector);
    if (elem) {
      const rect = elem.getBoundingClientRect();
      setTooltipStyle({
        position: 'fixed',
        top: rect.bottom + 10 + window.scrollY,
        left: rect.left + window.scrollX,
        zIndex: 10001,
      });
    } else {
      setTooltipStyle({ display: 'none' });
    }
  }, [tourStepIndex, isTourActive, selectedId, currentStep]);

  return (
    <div className="canvas-wrapper">
      <div className="canvas-controls" style={{ position: 'relative' }}>
        <Stage
          width={600}
          height={400}
          ref={stageRef}
          className="canvas"
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) setSelectedId(null);
          }}
          style={{ border: '1px solid #ccc', background: '#f9f9f9' }}
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

        <div className="toolbar" style={{ marginTop: 10 }}>
          <button onClick={() => addSticker('/smile.png')}>😀</button>
          <button onClick={() => addSticker('/star.png')}>🌟</button>
          <button onClick={() => addSticker('/fire.png')}>🔥</button>
          <button className="random-btn" onClick={addRandomSticker}>🎲 Random Sticker</button>

          <label className="upload-label" style={{ cursor: 'pointer', userSelect: 'none', marginLeft: 10 }}>
            <input type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} style={{ display: 'none' }} />
            Upload
          </label>

          <button onClick={downloadCanvas}>Download</button>
          <button onClick={undo} disabled={history.length === 0}>↩️ Undo</button>
          <button onClick={redo} disabled={future.length === 0}>↪️ Redo</button>
        </div>

        {isTourActive && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                zIndex: 10000,
              }}
              onClick={skipTour}
            />
            <div style={tooltipStyle}>
              <div style={{ marginBottom: 10 }}>{currentStep?.content}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={skipTour}
                  style={{
                    backgroundColor: '#ccc',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  Skip
                </button>
                {tourStepIndex + 1 === tourSteps.length ? (
                  <button
                    onClick={nextStep}
                    style={{
                      backgroundColor: '#4caf50',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Get Started
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    style={{
                      backgroundColor: '#2196f3',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Canvas;
