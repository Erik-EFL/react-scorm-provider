# React SCORM Provider

Presented by

<a href="https://s4netquest.com"><img src="https://s4-netquest.github.io/react-scorm-provider/images/s4-logo.png" alt="S4 NetQuest Logo" style="max-width: 250px;" /></a>

## Overview

@erik-efl/react-scorm-provider (RSP) is a set of React Components that simplify the inclusion of the [SCORM API](https://scorm.com/scorm-explained/) into your React projects. It utilizes the great SCORM API wrapper from [pipwerks](https://github.com/pipwerks/scorm-api-wrapper). Use RSP to easily add SCORM capabilities to your learning modules, resources, games, or *any* web content you are creating with React. RSP in its current form is meant for single SCO packages and relatively simple communications to the LMS, however it can easily be extended and modified to work for more complex projects.

Keep in mind that this project does not include any kind of packaging or bundling for SCORM. It simply enables SCORM API calls inside your React code. For SCORM packaging your React app build, check out [simple-scorm-packager](https://github.com/lmihaidaniel/simple-scorm-packager).

RSP now offers two ways to access SCORM functionality:

1. The modern React Hooks approach via `useScorm()`
2. The classic Higher-Order Component pattern with `withScorm()`

[View the live demo](https://s4-netquest.github.io/@erik-efl/react-scorm-provider)

---

## Installation

```bash
npm install @erik-efl/react-scorm-provider
# ou
yarn add @erik-efl/react-scorm-provider
```

## ScormProvider Component

`<ScormProvider></ScormProvider>`

A wrapper component which should only be included ONCE in your React application component tree. It should be included as close to the root of your component tree as possible so that child components can access SCORM functionality through either the `useScorm` hook or the `withScorm` Higher-Order Component.

The `ScormProvider` component automatically establishes a connection to the SCORM API and retrieves initial data from the LMS. Once the `ScormProvider` Component is included, any child component can access the SCORM-related properties and functions.

### Configuration

The ScormProvider Component accepts two optional configuration props:

* **version:** (String) (Optional) Specify the SCORM API version, accepts "1.2" or "2004". This is completely optional and probably not needed, as the included pipwerks SCORM API wrapper will automatically attempt to connect to any SCORM API it can find. The version found will the be stored to the ScormProvider Component.
* **debug:** (Boolean) (Optional) (Default: true) Specify if the SCORM API should be in debug mode and emit messages to the console.

Putting it together:

```jsx
// adding a ScormProvider

import React from 'react';
import { ScormProvider } from '@erik-efl/react-scorm-provider';

const App = () => {
  return (
    <ScormProvider version="1.2" debug={process.env.NODE_ENV !== 'production'}>
      <h1>Hello SCORM world!</h1>
      <p>
        A connection to the SCORM API will be made, initial values retrieved from the LMS via that API, and stored in the ScormProvider Component.
      </p>
    </ScormProvider>
  );
};

export default App;
```

---

## useScorm Hook (Recommended)

`const scorm = useScorm()`

The recommended way to access SCORM functionality in modern React. This hook provides access to all properties and functions of the `ScormProvider`. Use this hook in any functional component that is a child of the `ScormProvider`.

Example:

```jsx
// Using the useScorm hook in a functional component

import React from 'react';
import { useScorm } from '@erik-efl/react-scorm-provider';

const LearnerComponent = () => {
  const {
    apiConnected,
    learnerName,
    completionStatus,
    setStatus,
    setScore
  } = useScorm();

  return (
    <div>
      <p>SCORM API Connected: {apiConnected ? 'Yes' : 'No'}</p>
      <p>Welcome, {learnerName}!</p>
      <p>Your course status is currently: {completionStatus}</p>
      <button onClick={() => setStatus('completed')}>
        Mark me complete!
      </button>
      <button onClick={() => setScore({
        value: 100,
        min: 0,
        max: 100,
        status: 'passed'
      })}>
        Score 100%
      </button>
    </div>
  );
};

export default LearnerComponent;
```

---

## withScorm Higher-Order Component (Legacy Support)

`const YourEnhancedComponent = withScorm()(YourComponent)`

This Higher-Order Component provides access to the same properties and functions as the `useScorm` hook. Use this pattern for class components or when working with legacy code. All exposed properties and functions are passed to your enhanced component via the 'sco' prop that is added to your component.

Example:

```jsx
// enhancing a component with withScorm

import React from 'react';
import { withScorm } from '@erik-efl/react-scorm-provider';

const StandardFunctionalComponent = (props) => {
  return (
    <div>
      <p>Welcome, {props.sco.learnerName}!</p>
      <p>Your course status is currently: {props.sco.completionStatus}</p>
      <p>Click the button below to complete the course!</p>
      <button onClick={() => props.sco.setStatus('completed')}>Mark me complete!</button>
    </div>
  );
};

const EnhancedComponent = withScorm()(StandardFunctionalComponent);

export default EnhancedComponent;
```

---

## SCORM Context API

Whether you use the `useScorm` hook or the `withScorm` HOC, you'll have access to the following properties and methods:

```js
{
  // status of the connection to the SCORM API
  apiConnected: Boolean,

  // cmi.core.student_name (SCORM 1.2) || cmi.learner_name (SCORM 2004)
  learnerName: String,

  // indication of course status
  completionStatus: String,

  // cmi.suspend_data parsed as an object (all suspend_data must be a JSON.stringify'd object for the suspend_data to work properly with RSP)
  suspendData: Object,

  // SCORM API version that is connected ('1.2' or '2004')
  scormVersion: String,

  // calling this function will update the suspendData with the current suspend_data from the LMS
  getSuspendData: Function () returns a Promise,

  // Sets the suspendData in the context and saves to the LMS
  setSuspendData: Function () returns void,

  // resets the suspend_data to an empty object, clearing any existing key:value pairs
  clearSuspendData: Function () returns void,

  // sends an updated course status to the LMS, accepts one of: "passed", "completed", "failed", "incomplete", "browsed", "not attempted"
  setStatus: Function (string) returns void,

  // sends a score to the LMS via a Score object
  setScore: Function (score: Score) returns Promise<any>,

  // sets a SCORM value, ex: set('cmi.score.scaled', 100)
  set: Function (string, val) returns void,

  // gets a SCORM value from the LMS, ex: get('cmi.score.scaled')
  get: Function (string) returns the LMS value
}
```

### Score Interface

```typescript
interface Score {
  value: number;  // Score value (e.g., 80)
  min: number;    // Minimum possible score (e.g., 0)
  max: number;    // Maximum possible score (e.g., 100)
  status: string; // Optional status (e.g., 'passed', 'failed')
}
```

---

## Full Examples

### Using the useScorm hook (Modern approach)

```jsx
import React from 'react';
import { ScormProvider, useScorm } from '@erik-efl/react-scorm-provider';

// Component using the useScorm hook
function LearnerComponent() {
  const { learnerName, completionStatus, setStatus } = useScorm();

  return (
    <div>
      <p>Welcome, {learnerName}!</p>
      <p>Your course status is currently: {completionStatus}</p>
      <button onClick={() => setStatus('completed')}>
        Mark me complete!
      </button>
    </div>
  );
}

// Main App using ScormProvider
function App() {
  return (
    <ScormProvider>
      <h1>SCORM Connection Established!</h1>
      <LearnerComponent />
    </ScormProvider>
  );
}

export default App;
```

### Using the withScorm HOC (Legacy approach)

```jsx
import React from 'react';
import { ScormProvider, withScorm } from '@erik-efl/react-scorm-provider';

const Learner = (props) => {
  return (
    <div>
      <p>Welcome, {props.sco.learnerName}!</p>
      <p>Your course status is currently: {props.sco.completionStatus}</p>
      <button onClick={() => props.sco.setStatus('completed')}>Mark me complete!</button>
    </div>
  );
};

const ScoLearner = withScorm()(Learner);

const App = () => {
  return (
    <ScormProvider>
      <h1>SCORM Connection Established!</h1>
      <ScoLearner />
    </ScormProvider>
  );
};

export default App;
```

## Compatibility

This package is compatible with:
* SCORM 1.2
* SCORM 2004 (all editions)
* Works in most LMS systems: Moodle, Canvas, Blackboard, SCORM Cloud, etc.

## Credits

### Original Project
Originally created and maintained by [S4 NetQuest](https://s4netquest.com).

### Current Maintainer
This fork is maintained by [Erik Ferreira de Lima]. The library has been modernized to support React hooks and current TypeScript standards while maintaining compatibility with the original API.

### Acknowledgements
- [pipwerks SCORM API Wrapper](https://github.com/pipwerks/scorm-api-wrapper) for the underlying SCORM implementation
- All the original contributors to react-scorm-provider

## License

MIT License. See [LICENSE](LICENSE.md) for details.
