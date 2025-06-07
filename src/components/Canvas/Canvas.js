import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import image_url from '../file_paths';
import './index.css';

const tourSteps = [
  {
    selector: '.toolbar button:nth-child(1)',
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
    selector: '.toolbar button:nth-child(7)',
    content: 'Undo your last action.',
  },
  {
    selector: '.toolbar button:nth-child(8)',
    content: 'Redo your last undone action.',
  },
  {
    selector: '.toolbar button:nth-child(6)',
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
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [highlightStyle, setHighlightStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});

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
    if (!isTourActive || !currentStep) {
      setTooltipStyle({ display: 'none' });
      setHighlightStyle({ display: 'none' });
      setArrowStyle({ display: 'none' });
      return;
    }

    const elem = document.querySelector(currentStep.selector);
    if (elem) {
      const rect = elem.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;

      setTooltipStyle({
        position: 'absolute',
        top: rect.bottom + 16 + scrollTop,
        left: rect.left + scrollLeft,
        zIndex: 10001,
      });

      setHighlightStyle({
        position: 'absolute',
        top: rect.top + scrollTop - 4,
        left: rect.left + scrollLeft - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        border: '2px solid #00f',
        borderRadius: '8px',
        boxShadow: '0 0 12px rgba(0,0,255,0.6)',
        pointerEvents: 'none',
        zIndex: 10000,
      });

      setArrowStyle({
        position: 'absolute',
        top: rect.bottom + scrollTop,
        left: rect.left + scrollLeft + rect.width / 2 - 8,
        width: 0,
        height: 0,
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: '8px solid #333',
        zIndex: 10001,
        pointerEvents: 'none',
      });
    } else {
      setTooltipStyle({ display: 'none' });
      setHighlightStyle({ display: 'none' });
      setArrowStyle({ display: 'none' });
    }
  }, [tourStepIndex, isTourActive, selectedId, currentStep]);

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

  return (
    <div className="canvas-wrapper">
      <h1 className="heading">Sticker Canvas App</h1>
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
          <button onClick={() => addSticker('/smile.png')}>😀</button>
          <button onClick={() => addSticker('/star.png')}>🌟</button>
          <button onClick={() => addSticker('/fire.png')}>🔥</button>
          <button className="random-btn" onClick={addRandomSticker}>🎲 Random Sticker</button>

          <label className="upload-label">
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleImageUpload}
            />
            Upload
          </label>

          <button onClick={downloadCanvas}>Download</button>
          <button onClick={undo} disabled={history.length === 0}>↩️ Undo</button>
          <button onClick={redo} disabled={future.length === 0}>↪️ Redo</button>
        </div>

        {isTourActive && (
          <>
            <div className="highlight-box" style={highlightStyle} />
            <div className="arrow" style={arrowStyle} />
            <div className="tour-tooltip" style={tooltipStyle}>
              <div>{currentStep?.content}</div>
              <div className="tour-tooltip-buttons">
                <button className="skip-btn" onClick={skipTour}>Skip</button>
                {tourStepIndex + 1 === tourSteps.length ? (
                  <button className="get-started-btn" onClick={nextStep}>Get Started</button>
                ) : (
                  <button className="next-btn" onClick={nextStep}>Next</button>
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
