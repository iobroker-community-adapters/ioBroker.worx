# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

## Adapter-Specific Context

- **Adapter Name**: iobroker.worx
- **Primary Function**: This adapter connects ioBroker to the cloud of Worx, Kress and Landxcape robotic lawn mowers and other devices
- **Key Dependencies**: 
  - AWS IoT Device SDK (v1 and v2) for MQTT communication with Worx cloud services
  - axios and axios-rate-limit for HTTP API requests with rate limiting
  - tough-cookie and http-cookie-agent for session management
  - json2iob for data structure transformation
- **Configuration Requirements**: 
  - User credentials (email/password) for Worx cloud account
  - Device selection and configuration via admin interface
  - MQTT connection settings and rate limiting configuration
  - Support for multiple device types (mowers, irrigation systems, etc.)

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', function () {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        
                        // Get adapter object using promisified pattern
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        
                        if (!obj) {
                            return reject(new Error('Adapter object not found'));
                        }

                        // Configure adapter properties
                        Object.assign(obj.native, {
                            position: TEST_COORDINATES,
                            createCurrently: true,
                            createHourly: true,
                            createDaily: true,
                            // Add other configuration as needed
                        });

                        // Set the updated configuration
                        harness.objects.setObject(obj._id, obj);

                        console.log('✅ Step 1: Configuration written, starting adapter...');
                        
                        // Start adapter and wait
                        await harness.startAdapterAndWait();
                        
                        console.log('✅ Step 2: Adapter started');

                        // Wait for adapter to process data
                        const waitMs = 15000;
                        await wait(waitMs);

                        console.log('🔍 Step 3: Checking states after adapter run...');
                        
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            }).timeout(120000);
        });
    }
});
```

## Development Patterns

### Error Handling
- Always implement comprehensive error handling for cloud API connections
- Use appropriate logging levels: `this.log.error()`, `this.log.warn()`, `this.log.info()`, `this.log.debug()`
- Handle network timeouts and connection failures gracefully
- Implement retry logic for temporary failures with exponential backoff

### State Management
- Use `json2iob` library for consistent data structure transformation
- Create appropriate state structures with proper types and roles
- Implement proper cleanup in the `unload()` method
- Handle connection state updates appropriately

### AWS IoT and MQTT Patterns
- Properly initialize AWS IoT Device SDK connections
- Handle MQTT message parsing and device state updates
- Implement proper certificate and credential management
- Use rate limiting to avoid overwhelming cloud services

### API Integration Best Practices
- Use `axios-rate-limit` to respect API rate limits
- Implement proper session management with cookies
- Handle authentication token refresh automatically
- Provide meaningful error messages for API failures

## JSON Config Management

### Admin Interface
- Use JSON Config for the admin interface configuration
- Implement proper validation for user inputs
- Provide clear descriptions and help text for configuration options
- Support device discovery and selection where possible

### Configuration Structure
```javascript
{
    "type": "tabs",
    "items": {
        "options1": {
            "type": "panel",
            "label": "Adapter options",
            "items": {
                "email": {
                    "type": "text",
                    "label": "Email",
                    "sm": 12,
                    "required": true
                },
                "password": {
                    "type": "password", 
                    "label": "Password",
                    "sm": 12,
                    "required": true
                }
            }
        }
    }
}
```

## Lifecycle Methods

### Main Functions
```javascript
class WorxAdapter extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'worx',
        });
    }

    async onReady() {
        // Initialize adapter
        // Setup API connections
        // Start data collection
    }

    onUnload(callback) {
        try {
            // Clean up timers
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            // Close connections
            // Clean up resources
            callback();
        } catch (e) {
            callback();
        }
    }
}
```

## Code Style and Standards

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods

## CI/CD and Testing Integration

### GitHub Actions for API Testing
For adapters with external API dependencies, implement separate CI/CD jobs:

```yaml
# Tests API connectivity with demo credentials (runs separately)
demo-api-tests:
  if: contains(github.event.head_commit.message, '[skip ci]') == false
  
  runs-on: ubuntu-22.04
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run demo API tests
      run: npm run test:integration-demo
```

### Worx-Specific Testing Considerations
- Mock AWS IoT MQTT connections for offline testing
- Provide sample device data for testing without live mowers
- Test rate limiting functionality
- Validate error handling for various API failure scenarios
- Test credential validation and authentication flows

### Package.json Script Integration
Add dedicated script for credential testing:
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

## Worx Cloud API Patterns

### Authentication Flow
```javascript
// Handle Worx cloud authentication
async function authenticateWithWorxCloud(email, password) {
    try {
        // Initial login request
        const loginResponse = await axios.post('/login', {
            email,
            password
        });
        
        // Store session cookies
        this.cookieJar = new tough.CookieJar();
        
        // Return authentication status
        return loginResponse.data;
    } catch (error) {
        this.log.error(`Authentication failed: ${error.message}`);
        throw error;
    }
}
```

### Device Data Processing
```javascript
// Process device data from Worx cloud
processDeviceData(deviceData) {
    const json2iob = new Json2iob(this);
    
    // Transform and create states
    json2iob.parse(deviceData.serialNumber, deviceData, {
        forceIndex: true,
        channelName: deviceData.name
    });
}
```

### MQTT Message Handling
```javascript
// Handle MQTT messages from AWS IoT
handleMqttMessage(topic, message) {
    try {
        const data = JSON.parse(message.toString());
        
        // Process different message types
        if (data.cfg) {
            this.processDeviceConfiguration(data.cfg);
        }
        
        if (data.dat) {
            this.processDeviceStatus(data.dat);
        }
    } catch (error) {
        this.log.error(`MQTT message processing failed: ${error.message}`);
    }
}
```