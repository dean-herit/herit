'use client';

import { useState } from 'react';
import { Button, Card, CardBody } from '@heroui/react';
import { PersonalInfo, Signature } from '@/types/onboarding';

interface SignatureStepProps {
  personalInfo: PersonalInfo;
  initialSignature: Signature | null;
  onChange: (signature: Signature | null) => void;
  onComplete: (signature: Signature) => void;
  onBack?: () => void;
  loading: boolean;
}

export function SignatureStep({ 
  personalInfo, 
  initialSignature, 
  onChange, 
  onComplete, 
  onBack, 
  loading 
}: SignatureStepProps) {
  const [signature, setSignature] = useState<Signature | null>(initialSignature);

  const createTemplateSignature = () => {
    const templateSignature: Signature = {
      id: 'template-' + Date.now(),
      name: `${personalInfo.first_name} ${personalInfo.last_name}`,
      data: `${personalInfo.first_name} ${personalInfo.last_name}`,
      type: 'template',
      createdAt: new Date().toISOString(),
    };

    setSignature(templateSignature);
    onChange(templateSignature);
  };

  const handleSubmit = () => {
    if (signature) {
      onComplete(signature);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Create Your Digital Signature</h3>
        <p className="text-default-600">
          Your signature will be used to sign your will and other legal documents.
        </p>
      </div>

      {signature ? (
        <Card className="border-primary-200 bg-primary-50">
          <CardBody className="p-6 text-center">
            <div className="mb-4">
              <p className="text-sm text-default-600 mb-2">Your signature:</p>
              <div className="text-2xl font-cursive text-primary border-b border-primary-200 pb-2 inline-block">
                {signature.data}
              </div>
            </div>
            <div className="text-sm text-default-600">
              <p>Type: {signature.type === 'template' ? 'Text Template' : signature.type}</p>
              <p>Created: {new Date(signature.createdAt).toLocaleDateString()}</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" isPressable onPress={createTemplateSignature}>
            <CardBody className="p-6 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary text-xl">T</span>
                </div>
                <h4 className="font-semibold">Text Signature</h4>
                <p className="text-sm text-default-600 mt-2">
                  Use your typed name as a signature
                </p>
              </div>
              <div className="text-xl font-cursive text-primary border-b border-primary-200 pb-2">
                {personalInfo.first_name} {personalInfo.last_name}
              </div>
            </CardBody>
          </Card>

          <Card className="opacity-50">
            <CardBody className="p-6 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-default-400 text-xl">✏</span>
                </div>
                <h4 className="font-semibold text-default-400">Draw Signature</h4>
                <p className="text-sm text-default-400 mt-2">
                  Coming soon - draw your signature with mouse or touch
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="opacity-50">
            <CardBody className="p-6 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-default-400 text-xl">📁</span>
                </div>
                <h4 className="font-semibold text-default-400">Upload Image</h4>
                <p className="text-sm text-default-400 mt-2">
                  Coming soon - upload an image of your signature
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {onBack ? (
          <Button
            variant="bordered"
            onPress={onBack}
            isDisabled={loading}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          color="primary"
          onPress={handleSubmit}
          isLoading={loading}
          isDisabled={loading || !signature}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}