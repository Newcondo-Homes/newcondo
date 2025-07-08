// apps/platform/components/shared/BackendTest.tsx
'use client';

import { useState, useEffect } from 'react';
import { healthCheck } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';

interface HealthStatus {
  status: string;
  timestamp: string;
}

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function BackendTest() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState({
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    userType: 'tenant' as const,
  });

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    const startTime = Date.now();
    
    setTestResults(prev => [...prev, {
      test: testName,
      status: 'pending',
      message: 'Running...',
    }]);

    try {
      await testFn();
      const duration = Date.now() - startTime;
      
      setTestResults(prev => prev.map(result => 
        result.test === testName 
          ? { ...result, status: 'success' as const, message: 'Passed', duration }
          : result
      ));
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => prev.map(result => 
        result.test === testName 
          ? { 
              ...result, 
              status: 'error' as const, 
              message: error.message || 'Test failed',
              duration 
            }
          : result
      ));
    }
  };

  const checkHealth = async () => {
    try {
      const health = await healthCheck();
      setHealthStatus(health);
    } catch (error) {
      setHealthStatus({ status: 'unhealthy', timestamp: new Date().toISOString() });
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    // Test 1: Health Check
    await runTest('Health Check', async () => {
      const health = await healthCheck();
      if (health.status !== 'healthy') {
        throw new Error(`Backend unhealthy: ${health.status}`);
      }
    });

    // Test 2: Registration
    await runTest('User Registration', async () => {
      try {
        await authApi.register(testData);
      } catch (error: any) {
        // If user already exists, that's also a successful connection
        if (error.response?.data?.code === 'USER_ALREADY_EXISTS') {
          return; // This is fine for testing
        }
        throw error;
      }
    });

    // Test 3: Login
    await runTest('User Login', async () => {
      try {
        const response = await authApi.login({
          email: testData.email,
          password: testData.password,
        });
        
        if (!response.data.tokens.accessToken) {
          throw new Error('No access token received');
        }
        
        // Store tokens for subsequent tests
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      } catch (error: any) {
        // If registration test failed, login might fail too
        if (error.response?.data?.code === 'INVALID_CREDENTIALS') {
          throw new Error('Invalid credentials (registration might have failed)');
        }
        throw error;
      }
    });

    // Test 4: Get Profile (authenticated request)
    await runTest('Get Profile (Authenticated)', async () => {
      const response = await authApi.getProfile();
      
      if (!response.data.email) {
        throw new Error('No profile data received');
      }
    });

    // Test 5: Logout
    await runTest('User Logout', async () => {
      await authApi.logout();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });

    setIsLoading(false);
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Backend Connection Test</h2>
      
      {/* Health Status */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Health Status</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            healthStatus?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {healthStatus ? healthStatus.status : 'Checking...'}
          </span>
          <button
            onClick={checkHealth}
            className="ml-4 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
        {healthStatus && (
          <p className="text-xs text-gray-500 mt-1">
            Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
          </p>
        )}
      </div>

      {/* API Configuration */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">API Configuration</h3>
        <div className="text-sm text-gray-600">
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
          <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL_PROD}</p>
        </div>
      </div>

      {/* Test Data */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Test Data</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={testData.email}
              onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={testData.password}
              onChange={(e) => setTestData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={testData.firstName}
              onChange={(e) => setTestData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={testData.lastName}
              onChange={(e) => setTestData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      {/* Test Runner */}
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Test Results</h3>
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-l-4 ${
                result.status === 'success' ? 'border-green-500 bg-green-50' :
                result.status === 'error' ? 'border-red-500 bg-red-50' :
                'border-yellow-500 bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    result.status === 'success' ? 'bg-green-500' :
                    result.status === 'error' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <span className="font-medium">{result.test}</span>
                </div>
                {result.duration && (
                  <span className="text-xs text-gray-500">
                    {result.duration}ms
                  </span>
                )}
              </div>
              <p className={`text-sm mt-1 ${
                result.status === 'success' ? 'text-green-700' :
                result.status === 'error' ? 'text-red-700' :
                'text-yellow-700'
              }`}>
                {result.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}