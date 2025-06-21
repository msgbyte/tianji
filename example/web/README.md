# 🚀 Tianji Event Playground

A beautifully designed interactive playground for testing and exploring Tianji analytics platform capabilities.

## ✨ Features

### 🎨 Modern Design
- **Glassmorphism UI** - Beautiful glass-morphism cards with backdrop blur effects
- **Gradient Backgrounds** - Dynamic gradient backgrounds that adapt to dark/light themes
- **Animated Elements** - Floating background shapes and smooth transitions
- **Responsive Design** - Fully responsive layout that works on all devices

### 🔧 Functional Features
- **Tracker Initialization** - Easy setup with backend URL and website ID
- **Multiple Event Types** - Support for various event types (string, number, date, object, array)
- **Session Identification** - User session tracking with generated fake user data
- **Real-time Feedback** - Toast notifications with detailed success/error messages
- **Event Tracking** - Counter for sent events with visual indicators

### 🛠️ Technical Stack
- **Next.js 15** - React framework with App Router
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Sonner** - Beautiful toast notifications
- **Tianji Client React** - Official Tianji tracking library

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- A running Tianji backend instance
- Website ID from your Tianji dashboard

### Installation

1. Navigate to the project directory:
```bash
cd example/web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:7788](http://localhost:7788) in your browser

### Configuration

1. **Backend URL**: Enter your Tianji backend URL (e.g., `http://localhost:12345`)
2. **Website ID**: Enter your website ID from Tianji dashboard
3. Click **"Initialize Tianji Tracker"** to start tracking

## 🎯 Usage

### Event Types

1. **Basic Event** - Simple event without parameters
2. **Identify Session** - Associates user data with the current session
3. **String Event** - Event with string parameter
4. **Number Event** - Event with random number parameter
5. **Date Event** - Event with current date/time
6. **Object Event** - Event with complex nested object
7. **Array Event** - Event with array of numbers

### Visual Feedback

- **Status Indicator** - Green pulsing dot when tracker is active
- **Event Counter** - Shows total events sent
- **Individual Counters** - Badge on each event button showing count
- **Toast Messages** - Success/error notifications with details
- **Loading States** - Smooth loading animations during operations

## 🎨 Design Features

### Color Scheme
- **Primary**: Indigo gradients for main actions
- **Secondary**: Emerald gradients for events
- **Accent**: Amber gradients for special actions
- **Background**: Purple-blue gradients with floating elements

### Animations
- **Fade In Up** - Staggered entrance animations
- **Hover Effects** - Scale and glow effects on interactive elements
- **Floating Shapes** - Animated background elements
- **Pulse Animation** - Status indicator breathing effect

### Responsive Breakpoints
- **Mobile**: Single column layout
- **Tablet**: Two column event grid
- **Desktop**: Three column event grid with enhanced spacing

## 🛡️ Error Handling

- **Configuration Validation** - Checks for required fields
- **Network Error Handling** - Graceful handling of connection issues
- **User Feedback** - Clear error messages with resolution hints
- **Loading States** - Prevents multiple concurrent initialization attempts

## 🔧 Customization

### Styling
All styles are defined in `src/app/globals.css` using CSS custom properties:
- `--primary`, `--secondary`, `--accent` for color themes
- `--card-background`, `--card-border` for glassmorphism effects
- Animation keyframes for custom animations

### Event Handlers
Event configurations are defined in the `eventButtons` array in `page.tsx`:
- Easy to add new event types
- Configurable descriptions and emojis
- Custom success messages

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Tianji analytics platform. See the main repository for license information.

## 🆘 Support

If you encounter any issues:
1. Check your Tianji backend is running and accessible
2. Verify your website ID is correct
3. Check browser console for error messages
4. Open an issue in the main Tianji repository

---

Built with ❤️ for the Tianji Analytics Platform
