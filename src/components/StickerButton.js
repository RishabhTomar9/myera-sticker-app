import React from 'react';

const StickerButton = ({ src, onClick }) => {
  return (
    <button className="sticker-button" onClick={onClick}>
      <img src={src} alt="sticker" width={50} height={50} />
    </button>
  );
};

export default StickerButton;
