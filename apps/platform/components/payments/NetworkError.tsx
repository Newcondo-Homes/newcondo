'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@newcondo/ui';

interface NetworkErrorProps {
  onRetry?: () => void;
  showRetry?: boolean;
  autoRetry?: boolean;
  retryDelay?: number; // seconds
  className?: string;
}

const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  showRetry = true,
  autoRetry = false,
  retryDelay = 30,
  className = '',
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const [autoRetryCountdown, setAutoRetryCountdown] = useState(0);
  const [connectionHistory, setConnectionHistory] = useState<Array<{ status: 'online' | 'offline', timestamp: Date }>>([]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionHistory(prev => [...prev, { status: 'online', timestamp: new Date() }]);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionHistory(prev => [...prev, { status: 'offline', timestamp: new Date() }]);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto retry countdown
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (autoRetry && !isOnline && autoRetryCountdown === 0) {
      setAutoRetryCountdown(retryDelay);
    }

    if (autoRetryCountdown > 0) {
      intervalId = setInterval(() => {
        setAutoRetryCountdown(prev => {
          if (prev === 1) {
            handleRetry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRetry, isOnline, autoRetryCountdown, retryDelay]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setAutoRetryCountdown(0);
    
    try {
      // Test network connectivity
      await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (onRetry) {
        onRetry();
      }
    } catch (error) {
      console.error('Retry failed:', error);
      // Reset countdown if auto retry is enabled
      if (autoRetry) {
        setAutoRetryCountdown(retryDelay);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const getConnectionQuality = () => {
    // @ts-ignore - experimental API
    if ('connection' in navigator && navigator.connection) {
      // @ts-ignore
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }
    return null;
  };

  const connectionQuality = getConnectionQuality();

  if (isOnline) {
    return (
      <div className={`flex items-center space-x-2 text-green-500 ${className}`}>
        <CheckCircle size={20} />
        <span>Connected</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center p-4 rounded-lg bg-red-100 text-red-700 space-x-4 ${className}`}>
      <AlertCircle size={24} className="text-red-500" />
      <div className="flex-1">
        <h3 className="font-semibold">Network Connection Lost</h3>
        <p className="text-sm text-red-600">
          It looks like you are offline. Please check your internet connection.
        </p>
        
        {autoRetry && (
          <p className="text-xs text-red-500 mt-2">
            Auto-retrying in {autoRetryCountdown} seconds...
          </p>
        )}

        {connectionQuality && (
          <div className="text-xs text-red-500 mt-2 space-y-1">
            <p><strong>Connection Type:</strong> {connectionQuality.effectiveType}</p>
            <p><strong>Downlink:</strong> {connectionQuality.downlink} Mb/s</p>
            <p><strong>Round-trip Time:</strong> {connectionQuality.rtt} ms</p>
          </div>
        )}
      </div>

      {showRetry && (
        <Button 
          onClick={handleRetry} 
          disabled={isRetrying || autoRetryCountdown > 0} 
          variant="outline"
          className="flex-shrink-0"
        >
          {isRetrying ? (
            <>
              <RefreshCw size={16} className="animate-spin mr-2" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw size={16} className="mr-2" />
              Try Again
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default NetworkError;