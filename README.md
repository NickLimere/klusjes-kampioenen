# Klusjes Kampioenen iPad App

This is the iPad version of the Klusjes Kampioenen app, built with React Native and Expo.

## Features

- Same functionality as the web version
- Optimized for iPad interface
- Offline support
- Push notifications
- Split view support
- Touch interactions

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/klusjes-kampioenen.git
cd klusjes-kampioenen
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on iPad simulator:
```bash
npm run ios
```

## Project Structure

```
src/native/
├── components/         # Reusable UI components
├── screens/           # Screen components
├── navigation/        # Navigation setup
├── contexts/          # React contexts
├── lib/              # Utility functions and services
└── assets/           # Images, fonts, etc.
```

## Development

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks

### Testing

Run tests with:
```bash
npm test
```

### Building

Build the app with:
```bash
npm run build
```

## Deployment

### iOS

1. Update version in app.json
2. Build for App Store:
```bash
expo build:ios
```

### Android

1. Update version in app.json
2. Build for Play Store:
```bash
expo build:android
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 