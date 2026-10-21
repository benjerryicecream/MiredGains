import { LogBox } from 'react-native';

// The legacy Kotlin project shares the app/ folder with Expo Router, so
// its Gradle output (app/build/**) gets scanned as routes and produces a
// bogus warning on every launch:
//
//   Route "./build/reports/.../report.js" is missing the required
//   default export. Ensure a React component is exported as default.
//
// That warning pops the LogBox banner ("Open debugger to view
// warnings") over the tab bar. Silence only this warning, and only for
// files under a build/ directory — a real screen that forgets its
// default export should still warn.
//
// This module is imported first by index.ts so the ignore is registered
// before Expo Router loads and scans the routes.
LogBox.ignoreLogs([/Route ".*\/build\/.*is missing the required default export/]);
