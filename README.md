# React + Vite

# Features
Chat interface with user & assistant messages
Light/Dark mode toggle button
Clear chat functionality
Typing Indicator Animation
Show animated ellipsis or "Typing..." while awaiting API response.
Simple UI

# History
 Chat history stored in browser (localStorage)
 Support session persistence on reload 

# Clear Chat Button
 Allow users to reset the conversation history
 Submit message on Enter or via send button
 Handle multiline with Shift+Enter

# API Integration
 Gemini API by Google
 https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

# Tech Stack
 React
 Typescript
 CSS

 # Install Dependencies
 
```bash
npm install

# run frontend
npm run dev
 


Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
