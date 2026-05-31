# Omni-Tutor: The Future of On-Device Learning

Omni-Tutor is a decentralized, adaptive learning engine. Unlike traditional AI platforms, it executes LLM inference locally in the browser via WebLLM, ensuring 100% data privacy and zero server costs.

**Key Tech:** TypeScript, WebLLM, React, CSS3.

## Live Demo

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge)](https://samuel-robotics.github.io/Omni-Tutor/)

**Try it now:** [https://samuel-robotics.github.io/Omni-Tutor/](https://samuel-robotics.github.io/Omni-Tutor/)

### How to use the demo

1. Open the link in **Chrome**, **Edge**, or **Firefox** (WebGPU support recommended for the AI tutor).
2. Click **Start Learning** to set up your profile, or **Browse Lessons** to explore Mathematics, Science, or Literacy.
3. Choose a subject and grade on the Learn page — lessons, quizzes, and the AI tutor all run on your device.
4. Visit **Settings** to download the on-device AI model for offline tutoring.

> **Note:** The first visit may download the WebLLM model over WiFi (~1–2 GB). After that, tutoring works offline with no data sent to any server.

## Local Development

```bash
git clone https://github.com/Samuel-robotics/Omni-Tutor.git
cd Omni-Tutor
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
```

Static files are exported to the `dist/` directory.
