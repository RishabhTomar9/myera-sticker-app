# 🖼️ MyEra Sticker Canvas App

An interactive sticker canvas app built with React and Konva. Easily add, move, resize, and manage stickers on a grid-based canvas with intuitive controls and a built-in guided tour for new users.

---

## 🚀 Features

- 🧩 Add pre-defined stickers like 😀, 🌟, 🔥
- 🎲 Add a random sticker from a large collection
- 🖼️ Upload your own image stickers (PNG, JPEG)
- 🖱️ Drag, scale, and transform stickers
- 🧹 Snap to 40px grid for perfect alignment
- 🧭 Guided user tour highlighting key features
- ↩️ Undo / ↪️ Redo support
- 📥 Download canvas as image
- 🔄 Double-click to delete stickers

---

## 🔧 Tech Stack

- ⚛️ React.js
- 🎨 Konva (via `react-konva`)
- 🖼️ use-image hook (`use-image`)
- 🗃️ Custom image loader (`image_url.js`)
- 💅 Custom CSS for styling

---

## 📁 Folder Structure

myera-sticker-app/
│
├── public/
│ └── sticker1.png, sticker2.png, ...
│
├── src/
│ ├── components/
│ │ └── Canvas.js # Main canvas with sticker controls
│ ├── file_paths.js # Sticker image URLs
│ ├── App.js
│ └── index.css
│
├── package.json
└── README.md



---

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/RisabhTomar9/myera-sticker-app.git
cd myera-sticker-app


### 2. Install Dependencies

```bash
npm install

### 

```bash
npm start

The app will run at http://localhost:3000

🧪 Usage Instructions
Add Sticker: Click 😀/🌟/🔥 or upload your own.

Move Sticker: Drag to move (snaps to grid).

Resize: Use corners to scale.

Delete: Double-click any sticker.

Undo/Redo: Use buttons to revert/restore actions.

Download: Export canvas as PNG image.

Guided Tour: Auto-starts on first load.

✨ Credits
React Konva

Unsplash (optional for dynamic image sources)

Icons via Emoji Unicode

🙌 Author
Rishabh Tomar — @rishabhtomar

Happy Stickering! 🎉