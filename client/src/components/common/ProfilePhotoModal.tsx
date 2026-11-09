import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, X, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabase';

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePhotoModal: React.FC<ProfilePhotoModalProps> = ({ isOpen, onClose }) => {
  const { user, role, updateAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute monogram initials from user's full name
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Selected image exceeds the 5MB file size limit.');
      return;
    }

    // Validate type
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setErrorMessage('Please select a PNG, JPG, or WEBP image.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload file directly to Supabase Storage in 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload photo to Supabase storage');
      }

      // Generate public URL from Supabase
      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      if (!publicData?.publicUrl) {
        throw new Error('Could not retrieve public URL for uploaded photo');
      }

      // Save public URL in database and user session
      await updateAvatar(publicData.publicUrl);

      setSuccessMessage('Profile photo updated successfully!');
      setTimeout(() => {
        onClose();
        setSelectedFile(null);
        setPreviewUrl(null);
        setSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setErrorMessage(err.message || 'Failed to update profile photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      await updateAvatar(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setSuccessMessage('Profile picture removed. Monogram initials restored.');
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove picture');
    } finally {
      setIsUploading(false);
    }
  };

  const activePhoto = previewUrl || user?.avatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222631]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Update Profile Photo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar Preview */}
        <div className="flex flex-col items-center justify-center py-2 space-y-3">
          <div className="relative group">
            {activePhoto ? (
              <img
                src={activePhoto}
                alt={user?.name || 'User Avatar'}
                className="w-24 h-24 rounded-full object-cover border-3 border-emerald-500/40 shadow-lg"
              />
            ) : (
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-white/20 ${
                  role === 'ADMIN'
                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-500'
                    : role === 'SALESMAN'
                      ? 'bg-gradient-to-tr from-blue-600 to-cyan-500'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                }`}
              >
                {getInitials(user?.name)}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer transition-transform active:scale-95 border-2 border-white dark:border-[#16181E]"
              title="Select Image File"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-center">
            <p className="font-bold text-sm text-slate-900 dark:text-white">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.phone}</p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {selectedFile ? (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading to Supabase...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Save Photo to Supabase</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl border border-dashed border-emerald-500/50 hover:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Choose Photo from Device</span>
            </button>
          )}

          {user?.avatarUrl && !selectedFile && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isUploading}
              className="w-full py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Photo</span>
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-400 text-center leading-tight">
          Image is stored in your private Supabase Storage bucket. Supported: PNG, JPG, WEBP &bull;
          Max 5MB
        </p>
      </div>
    </div>
  );
};
