// src/scenes/account/AccountPage.jsx
import {
  Box, Button, TextField, Typography, Avatar, IconButton,
  Grid, Paper, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import UploadIcon from '@mui/icons-material/Upload';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function AccountPage() {
  const { cognitoId, userProfile, updateProfile, loading } = useAuth();

  console.groupCollapsed('AccountPage Render');
  console.log('cognitoId:', cognitoId);
  console.log('loading:', loading);
  console.log('userProfile:', userProfile);
  console.groupEnd();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone_number: '',
    address: '',
    company: '',
  });
  const [avatarUrl, setAvatarUrl] = useState('');

  // Initialize form once profile loads
  useEffect(() => {
    console.log('[useEffect:init] loading:', loading, 'userProfile:', userProfile);
    if (!loading) {
      if (userProfile) {
        console.log('[useEffect:init] Populating form from userProfile');
        setForm({
          name: userProfile.name || '',
          phone_number: userProfile.phone_number || '',
          address: userProfile.address || '',
          company: userProfile.company || '',
        });
        setAvatarUrl(userProfile.picture || '');
        console.log('[useEffect:init] form set to:', form, 'avatarUrl:', userProfile.picture);
      } else {
        console.warn('[useEffect:init] No userProfile found after loading=false');
      }
    }
  }, [loading, userProfile]);

  // Show spinner while the context is still fetching
  if (loading) {
    console.log('AccountPage: still loading, rendering spinner');
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  console.log('AccountPage: loading=false, rendering form');

  const onChange = (field) => (e) => {
    console.log(`onChange: ${field} ->`, e.target.value);
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const onAvatarUpload = (e) => {
    const file = e.target.files[0];
    console.log('onAvatarUpload file:', file);
    if (!file) return;
    const url = URL.createObjectURL(file);
    console.log('onAvatarUpload URL:', url);
    setAvatarUrl(url);
  };

  const onCancel = () => {
    console.log('onCancel: reverting to userProfile');
    setForm({
      name: userProfile.name || '',
      phone_number: userProfile.phone_number || '',
      address: userProfile.address || '',
      company: userProfile.company || '',
    });
    setAvatarUrl(userProfile.picture || '');
    setEditMode(false);
  };

  const onSave = async () => {
    const toUpdate = {
      name: form.name,
      phone_number: form.phone_number,
      address: form.address,
      company: form.company,
      // picture: avatarUrl
    };
    console.log('onSave: updating profile with', toUpdate);
    try {
      const updated = await updateProfile(toUpdate);
      console.log('onSave: updateProfile returned', updated);
      setEditMode(false);
    } catch (err) {
      console.error('onSave: Failed to update profile:', err);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        My Account
        {!editMode && (
          <IconButton size="small" sx={{ ml: 1 }} onClick={() => {
            console.log('Entering edit mode');
            setEditMode(true);
          }}>
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Avatar */}
          <Grid item xs={12} sm={4} container justifyContent="center">
            <Box position="relative" textAlign="center">
              <Avatar src={avatarUrl} sx={{ width: 100, height: 100, margin: 'auto' }} />
              {editMode && (
                <IconButton
                  component="label"
                  sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'background.paper' }}
                  onClick={() => console.log('Click avatar upload')}
                >
                  <UploadIcon />
                  <input hidden accept="image/*" type="file" onChange={onAvatarUpload} />
                </IconButton>
              )}
            </Box>
          </Grid>

          {/* Form fields */}
          <Grid item xs={12} sm={8} container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                value={userProfile?.email || ''}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                fullWidth
                value={form.name}
                onChange={onChange('name')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Phone Number"
                fullWidth
                value={form.phone_number}
                onChange={onChange('phone_number')}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                value={form.address}
                onChange={onChange('address')}
                disabled={!editMode}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Company"
                fullWidth
                value={form.company}
                onChange={onChange('company')}
                disabled={!editMode}
              />
            </Grid>
          </Grid>

          {/* Action buttons */}
          {editMode && (
            <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
              <Grid item>
                <Button variant="outlined" startIcon={<CancelIcon />} onClick={onCancel}>
                  Cancel
                </Button>
              </Grid>
              <Grid item>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave}>
                  Save
                </Button>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
}
