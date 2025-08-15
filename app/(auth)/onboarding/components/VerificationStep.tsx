'use client';

import { useState } from 'react';
import { Button, Card, CardBody, Progress } from '@heroui/react';

interface VerificationStepProps {
  onComplete: (data?: any) => void;
  onBack?: () => void;
  loading: boolean;
}

export function VerificationStep({ 
  onComplete, 
  onBack, 
  loading 
}: VerificationStepProps) {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [progress, setProgress] = useState(0);

  const startVerification = () => {
    setVerificationStatus('in_progress');
    setProgress(0);

    // Simulate verification process
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          setVerificationStatus('completed');
          return 100;
        }
        return next;
      });
    }, 300);
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Identity Verification</h3>
        <p className="text-default-600">
          For your security, we need to verify your identity before completing your onboarding.
        </p>
      </div>

      {verificationStatus === 'pending' && (
        <Card>
          <CardBody className="p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary text-2xl">🛡️</span>
            </div>
            <h4 className="font-semibold mb-2">Secure Identity Verification</h4>
            <p className="text-sm text-default-600 mb-4">
              This is a simplified verification process for demo purposes. 
              In a real application, this would integrate with identity verification services.
            </p>
            <Button 
              color="primary" 
              size="lg"
              onPress={startVerification}
            >
              Start Verification
            </Button>
          </CardBody>
        </Card>
      )}

      {verificationStatus === 'in_progress' && (
        <Card>
          <CardBody className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-2xl">⏳</span>
              </div>
              <h4 className="font-semibold mb-2">Verifying Your Identity</h4>
              <p className="text-sm text-default-600 mb-4">
                Please wait while we verify your information...
              </p>
            </div>
            
            <Progress 
              value={progress}
              color="primary"
              className="mb-4"
            />
            
            <div className="text-center">
              <p className="text-sm text-default-600">
                {progress < 30 && "Checking your information..."}
                {progress >= 30 && progress < 60 && "Validating documents..."}
                {progress >= 60 && progress < 90 && "Performing security checks..."}
                {progress >= 90 && "Almost complete..."}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {verificationStatus === 'completed' && (
        <Card className="border-success-200 bg-success-50">
          <CardBody className="p-6 text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-success text-2xl">✅</span>
            </div>
            <h4 className="font-semibold text-success-700 mb-2">Verification Complete!</h4>
            <p className="text-sm text-success-600 mb-4">
              Your identity has been successfully verified. You can now access all features of Herit.
            </p>
            
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-default-600">Verification Method</p>
                  <p className="font-medium">Demo Verification</p>
                </div>
                <div>
                  <p className="text-default-600">Status</p>
                  <p className="font-medium text-success-600">Verified</p>
                </div>
                <div>
                  <p className="text-default-600">Completed At</p>
                  <p className="font-medium">{new Date().toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-default-600">Valid Until</p>
                  <p className="font-medium">No expiration</p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {onBack ? (
          <Button
            variant="bordered"
            onPress={onBack}
            isDisabled={loading || verificationStatus === 'in_progress'}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          color="primary"
          onPress={handleComplete}
          isLoading={loading}
          isDisabled={loading || verificationStatus !== 'completed'}
          size="lg"
        >
          Complete Onboarding
        </Button>
      </div>
    </div>
  );
}