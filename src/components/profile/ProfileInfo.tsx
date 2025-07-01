import React, { useState, useRef } from 'react';
import { Camera, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, Typography, Button, Input } from '../ui';
import type { UserProfile } from '../../types';
import { userProfileService } from '../../services/userProfile.service';

interface ProfileInfoProps {
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: profile.displayName,
    birthday: profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : '',
    gender: profile.gender || '',
    experienceLevel: profile.experienceLevel || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdate({
      displayName: formData.displayName,
      birthday: formData.birthday ? new Date(formData.birthday) : undefined,
      gender: formData.gender as UserProfile['gender'],
      experienceLevel: formData.experienceLevel as UserProfile['experienceLevel']
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      displayName: profile.displayName,
      birthday: profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : '',
      gender: profile.gender || '',
      experienceLevel: profile.experienceLevel || ''
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const photoURL = await userProfileService.uploadProfilePicture(profile.uid, file);
      onUpdate({ photoURL });
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const calculateAge = (birthday: Date) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <Typography variant="h3">Personal Information</Typography>
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
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                {profile.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt={profile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera className="w-12 h-12" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
                aria-label="Upload photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                aria-label="Photo upload input"
              />
            </div>
          </div>

          {/* Profile Details */}
          <div className="flex-1 space-y-4">
            <div>
              <Typography variant="body2" color="muted" className="mb-1">
                Display Name
              </Typography>
              {isEditing ? (
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Enter your name"
                />
              ) : (
                <Typography variant="body1">{profile.displayName}</Typography>
              )}
            </div>

            <div>
              <Typography variant="body2" color="muted" className="mb-1">
                Email
              </Typography>
              <Typography variant="body1">{profile.email}</Typography>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Typography variant="body2" color="muted" className="mb-1">
                  Birthday
                </Typography>
                {isEditing ? (
                  <Input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  />
                ) : (
                  <Typography variant="body1">
                    {profile.birthday ? (
                      <>
                        {new Date(profile.birthday).toLocaleDateString()} 
                        <span className="text-gray-500 ml-2">
                          ({calculateAge(profile.birthday)} years old)
                        </span>
                      </>
                    ) : (
                      'Not set'
                    )}
                  </Typography>
                )}
              </div>

              <div>
                <Typography variant="body2" color="muted" className="mb-1">
                  Gender
                </Typography>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                ) : (
                  <Typography variant="body1">
                    {profile.gender ? 
                      profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1).replace('-', ' ') : 
                      'Not set'
                    }
                  </Typography>
                )}
              </div>
            </div>

            <div>
              <Typography variant="body2" color="muted" className="mb-1">
                Experience Level
              </Typography>
              {isEditing ? (
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select experience level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              ) : (
                <Typography variant="body1">
                  {profile.experienceLevel ? 
                    profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1) : 
                    'Not set'
                  }
                </Typography>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};