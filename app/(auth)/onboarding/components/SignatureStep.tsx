'use client';

import { useState } from 'react';
import { Button, Card, CardBody, Divider } from '@heroui/react';
import { PersonalInfo, Signature } from '@/types/onboarding';
import { signatureFonts } from '@/config/fonts';

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
  const [selectedFont, setSelectedFont] = useState(signatureFonts[0]);
  const [showFontSelector, setShowFontSelector] = useState(false);

  const fullName = `${personalInfo.first_name} ${personalInfo.last_name}`;

  const createTemplateSignature = (fontData = selectedFont) => {
    const templateSignature: Signature = {
      id: 'template-' + Date.now(),
      name: fullName,
      data: fullName,
      type: 'template',
      font: fontData.name,
      className: fontData.className,
      createdAt: new Date().toISOString(),
    };

    setSignature(templateSignature);
    onChange(templateSignature);
  };

  const handleFontSelect = (fontData: typeof signatureFonts[0]) => {
    setSelectedFont(fontData);
    if (signature && signature.type === 'template') {
      // Update existing signature with new font
      createTemplateSignature(fontData);
    }
  };

  const handleStartCreating = () => {
    setShowFontSelector(true);
    createTemplateSignature();
  };

  const handleSubmit = async () => {
    if (!signature) return;
    
    try {
      const response = await fetch('/api/onboarding/signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signature.name,
          signatureType: signature.type,
          signatureData: signature.data,
          font: signature.font,
          className: signature.className,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save signature');
      }

      onComplete(signature);
    } catch (error) {
      console.error('Error saving signature:', error);
      // You might want to show an error message to the user here
    }
  };

  const resetSignature = () => {
    setSignature(null);
    setShowFontSelector(false);
    onChange(null);
  };

  if (!showFontSelector && !signature) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Create Your Digital Signature</h3>
          <p className="text-default-600">
            Your signature will be used to sign your will and other legal documents.
          </p>
        </div>

        <div className="space-y-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" isPressable onPress={handleStartCreating}>
            <CardBody className="p-6 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary text-xl">T</span>
                </div>
                <h4 className="font-semibold">Text Signature</h4>
                <p className="text-sm text-default-600 mt-2">
                  Choose from beautiful signature fonts
                </p>
              </div>
              <div className="text-xl font-dancing-script text-primary border-b border-primary-200 pb-2">
                {fullName}
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
          <div />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Your Signature Style</h3>
        <p className="text-default-600">
          Select the font that best represents your signature style.
        </p>
      </div>

      {/* Current Signature Preview */}
      {signature && (
        <Card className="border-primary-200 bg-primary-50">
          <CardBody className="p-6 text-center">
            <div className="mb-4">
              <p className="text-sm text-default-600 mb-4">Your signature:</p>
              <div className={`text-4xl text-primary border-b-2 border-primary-200 pb-2 inline-block ${signature.className || 'font-dancing-script'}`}>
                {signature.data}
              </div>
            </div>
            <div className="text-sm text-default-600">
              <p>Font: {signature.font || 'Dancing Script'}</p>
              <p>Created: {new Date(signature.createdAt).toLocaleDateString()}</p>
            </div>
          </CardBody>
        </Card>
      )}

      <Divider />

      {/* Font Selector */}
      <div>
        <h4 className="text-md font-semibold mb-4">Choose a signature font:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signatureFonts.map((fontData) => (
            <Card 
              key={fontData.name}
              className={`hover:shadow-md transition-all cursor-pointer ${
                selectedFont.name === fontData.name 
                  ? 'border-primary-500 bg-primary-50 shadow-md' 
                  : 'border-default-200'
              }`}
              isPressable 
              onPress={() => handleFontSelect(fontData)}
            >
              <CardBody className="p-6 flex items-center justify-center min-h-[80px]">
                <div className={`text-3xl text-foreground ${fontData.className} text-center`}>
                  {fullName}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <div className="flex gap-2">
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
            variant="flat"
            onPress={resetSignature}
            isDisabled={loading}
          >
            Choose Different Type
          </Button>
        </div>

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