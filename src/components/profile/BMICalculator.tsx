import React, { useState, useEffect } from 'react';
import { Calculator, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, Typography, Button, Input } from '../ui';
import type { UserProfile, BMIData } from '../../types';
import { userProfileService } from '../../services/userProfile.service';

interface BMICalculatorProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
}

export const BMICalculator: React.FC<BMICalculatorProps> = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [height, setHeight] = useState(profile.height || 0);
  const [weight, setWeight] = useState(profile.weight || 0);
  const [heightUnit, setHeightUnit] = useState(profile.heightUnit || 'cm');
  const [weightUnit, setWeightUnit] = useState(profile.weightUnit || 'kg');
  const [bmiData, setBmiData] = useState<BMIData | null>(null);

  useEffect(() => {
    calculateBMI();
  }, [profile.height, profile.weight]);

  const calculateBMI = () => {
    if (!profile.height || !profile.weight) return;
    
    const heightCm = profile.heightUnit === 'ft' 
      ? userProfileService.converters.ftToCm(Math.floor(profile.height), (profile.height % 1) * 12)
      : profile.height;
    
    const weightKg = profile.weightUnit === 'lbs'
      ? userProfileService.converters.lbsToKg(profile.weight)
      : profile.weight;

    const data = userProfileService.calculateBMI(heightCm, weightKg);
    setBmiData(data);
  };

  const handleSave = () => {
    // Convert to standard units (cm and kg) for storage
    let heightCm = height;
    let weightKg = weight;

    if (heightUnit === 'ft') {
      const feet = Math.floor(height);
      const inches = (height - feet) * 10; // Assuming input like 5.11 for 5'11"
      heightCm = userProfileService.converters.ftToCm(feet, inches);
    }

    if (weightUnit === 'lbs') {
      weightKg = userProfileService.converters.lbsToKg(weight);
    }

    onUpdate({
      height: heightCm,
      weight: weightKg,
      heightUnit,
      weightUnit
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setHeight(profile.height || 0);
    setWeight(profile.weight || 0);
    setHeightUnit(profile.heightUnit || 'cm');
    setWeightUnit(profile.weightUnit || 'kg');
    setIsEditing(false);
  };

  const getDisplayHeight = () => {
    if (!profile.height) return 'Not set';
    
    if (profile.heightUnit === 'ft') {
      const { feet, inches } = userProfileService.converters.cmToFt(profile.height);
      return `${feet}'${inches}"`;
    }
    
    return `${Math.round(profile.height)} cm`;
  };

  const getDisplayWeight = () => {
    if (!profile.weight) return 'Not set';
    
    if (profile.weightUnit === 'lbs') {
      return `${Math.round(userProfileService.converters.kgToLbs(profile.weight))} lbs`;
    }
    
    return `${Math.round(profile.weight)} kg`;
  };

  const getBMIColor = (category: BMIData['category']) => {
    switch (category) {
      case 'underweight': return 'text-blue-600';
      case 'normal': return 'text-green-600';
      case 'overweight': return 'text-yellow-600';
      case 'obese': return 'text-red-600';
    }
  };

  const getBMIBgColor = (category: BMIData['category']) => {
    switch (category) {
      case 'underweight': return 'bg-blue-100';
      case 'normal': return 'bg-green-100';
      case 'overweight': return 'bg-yellow-100';
      case 'obese': return 'bg-red-100';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-gray-600" />
            <Typography variant="h3">BMI Calculator</Typography>
          </div>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                leftIcon={<X className="w-4 h-4" />}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <Typography variant="body2" color="muted" className="mb-1">
                Height
              </Typography>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                    placeholder={heightUnit === 'cm' ? 'Height in cm' : 'Height (e.g., 5.11 for 5\'11")'}
                    step={heightUnit === 'cm' ? '1' : '0.01'}
                  />
                  <select
                    value={heightUnit}
                    onChange={(e) => setHeightUnit(e.target.value as 'cm' | 'ft')}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="cm">cm</option>
                    <option value="ft">ft</option>
                  </select>
                </div>
              ) : (
                <Typography variant="body1" className="font-medium">
                  {getDisplayHeight()}
                </Typography>
              )}
            </div>

            <div>
              <Typography variant="body2" color="muted" className="mb-1">
                Weight
              </Typography>
              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    placeholder={`Weight in ${weightUnit}`}
                    step="0.1"
                  />
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lbs')}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
              ) : (
                <Typography variant="body1" className="font-medium">
                  {getDisplayWeight()}
                </Typography>
              )}
            </div>
          </div>

          {/* BMI Results */}
          {bmiData && profile.height && profile.weight && (
            <div className="space-y-4">
              <div className="text-center p-6 rounded-lg bg-gray-50">
                <Typography variant="body2" color="muted" className="mb-2">
                  Your BMI
                </Typography>
                <Typography variant="h1" className={getBMIColor(bmiData.category)}>
                  {bmiData.bmi}
                </Typography>
                <div className={`inline-block px-3 py-1 rounded-full mt-2 ${getBMIBgColor(bmiData.category)}`}>
                  <Typography variant="body2" className={`font-medium ${getBMIColor(bmiData.category)}`}>
                    {bmiData.category.charAt(0).toUpperCase() + bmiData.category.slice(1)}
                  </Typography>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <Typography variant="body2" color="muted" className="mb-1">
                  Healthy Weight Range
                </Typography>
                <Typography variant="body1" className="font-medium text-blue-700">
                  {profile.weightUnit === 'lbs' ? (
                    <>
                      {Math.round(userProfileService.converters.kgToLbs(bmiData.healthyWeightRange.min))} - 
                      {Math.round(userProfileService.converters.kgToLbs(bmiData.healthyWeightRange.max))} lbs
                    </>
                  ) : (
                    <>
                      {bmiData.healthyWeightRange.min} - {bmiData.healthyWeightRange.max} kg
                    </>
                  )}
                </Typography>
              </div>
            </div>
          )}
        </div>

        {/* BMI Scale Reference */}
        <div className="mt-6 pt-6 border-t">
          <Typography variant="body2" color="muted" className="mb-3">
            BMI Categories
          </Typography>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Underweight (&lt;18.5)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Normal (18.5-24.9)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600">Overweight (25-29.9)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Obese (≥30)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};