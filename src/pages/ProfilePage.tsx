import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, X, Edit2, Cake, Mail, Sparkles, Award } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/Avatar';
import { GAURAV_ID } from '../data/mockData';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { containerVariants, itemVariants } from '../utils/variants';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useAuthStore();
  const isGaurav = currentUser?.uid === GAURAV_ID;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    dateOfBirth: currentUser?.dateOfBirth || '',
    interests: currentUser?.interests || [],
    skills: currentUser?.skills || [],
    avatar: currentUser?.avatar || '',
  });

  const [newInterest, setNewInterest] = useState('');
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || '',
        bio: currentUser.bio || '',
        dateOfBirth: currentUser.dateOfBirth || '',
        interests: currentUser.interests || [],
        skills: currentUser.skills || [],
        avatar: currentUser.avatar || '',
      });
    }
  }, [currentUser]);

  const addInterest = () => {
    if (newInterest.trim() && !form.interests.includes(newInterest.trim())) {
      setForm(f => ({ ...f, interests: [...f.interests, newInterest.trim()] }));
      setNewInterest('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setForm(f => ({ ...f, interests: f.interests.filter(i => i !== interestToRemove) }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !form.skills.includes(newSkill.trim())) {
      setForm(f => ({ ...f, skills: [...f.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setForm(f => ({ ...f, skills: f.skills.filter(s => s !== skillToRemove) }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    if (!form.name.trim()) {
      toast.error('Display Name is required');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile saved to Firestore! ✨');
      setIsEditing(false);
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (currentUser) {
      setForm({
        name: currentUser.name || '',
        bio: currentUser.bio || '',
        dateOfBirth: currentUser.dateOfBirth || '',
        interests: currentUser.interests || [],
        skills: currentUser.skills || [],
        avatar: currentUser.avatar || '',
      });
    }
    setIsEditing(false);
  };

  if (!currentUser) return null;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">

        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="page-title mb-1">Profile</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Manage your personal details</p>
          </div>
          {!isEditing ? (
            <button className="btn-primary" onClick={() => setIsEditing(true)}>
              <Edit2 size={14} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={handleCancel} disabled={isSaving}>Cancel</button>
              <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                <Save size={14} /> {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}
        </motion.div>

        {/* Profile Identity Card */}
        <motion.div
          variants={itemVariants}
          className="card p-6"
          style={{
            background: isGaurav
              ? 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(24,24,36,0.95))'
              : 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(24,24,36,0.95))',
            borderColor: isGaurav ? 'rgba(139,92,246,0.25)' : 'rgba(236,72,153,0.25)',
          }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar
                name={isEditing ? (form.name || currentUser.name) : currentUser.name}
                src={currentUser.avatar}
                size="2xl"
                isGaurav={isGaurav}
              />
            </div>

            {/* Info or Edit Form */}
            <div className="flex-1 space-y-4 text-center sm:text-left w-full">
              {isEditing ? (
                <>
                  <div>
                    <label className="label">Display Name *</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="Enter your display name"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Bio</label>
                    <textarea
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Write a brief bio..."
                      value={form.bio}
                      onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Date of Birth</label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.dateOfBirth}
                      onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-black text-white">{currentUser.name}</h2>
                    {currentUser.bio ? (
                      <p className="text-sm mt-1 text-gray-300">{currentUser.bio}</p>
                    ) : (
                      <p className="text-xs italic mt-1" style={{ color: 'var(--color-text-muted)' }}>No bio added yet. Click "Edit Profile" to add one.</p>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {currentUser.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail size={13} /> {currentUser.email}
                      </span>
                    )}
                    {currentUser.dateOfBirth && (
                      <span className="flex items-center gap-1.5">
                        <Cake size={13} /> {formatDate(currentUser.dateOfBirth, 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Interests Card */}
        <motion.div variants={itemVariants} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-purple-400" />
            <h2 className="section-title">Interests</h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {(isEditing ? form.interests : (currentUser.interests || [])).map(interest => (
              <span key={interest} className="badge badge-purple flex items-center gap-1.5 py-1 px-3">
                {interest}
                {isEditing && (
                  <button type="button" onClick={() => removeInterest(interest)} className="ml-0.5 hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}

            {(isEditing ? form.interests : (currentUser.interests || [])).length === 0 && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {isEditing ? 'Add interests using the input below.' : 'No interests added yet.'}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                className="input-field flex-1 text-xs"
                placeholder="Type interest and press Enter or +"
                value={newInterest}
                onChange={e => setNewInterest(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInterest())}
              />
              <button type="button" className="btn-secondary px-3" onClick={addInterest}>
                <Plus size={14} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Skills Card */}
        <motion.div variants={itemVariants} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} className="text-amber-400" />
            <h2 className="section-title">Skills</h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {(isEditing ? form.skills : (currentUser.skills || [])).map(skill => (
              <span key={skill} className="badge badge-gold flex items-center gap-1.5 py-1 px-3">
                {skill}
                {isEditing && (
                  <button type="button" onClick={() => removeSkill(skill)} className="ml-0.5 hover:text-white transition-colors">
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}

            {(isEditing ? form.skills : (currentUser.skills || [])).length === 0 && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {isEditing ? 'Add skills using the input below.' : 'No skills added yet.'}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                className="input-field flex-1 text-xs"
                placeholder="Type skill and press Enter or +"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              />
              <button type="button" className="btn-secondary px-3" onClick={addSkill}>
                <Plus size={14} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Account Details Card */}
        <motion.div variants={itemVariants} className="card p-5">
          <h2 className="section-title mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Member Since</span>
              <span className="text-xs font-semibold text-white">{formatDate(currentUser.createdAt || new Date().toISOString())}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Firebase UID</span>
              <span className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                {currentUser.uid}
              </span>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};
