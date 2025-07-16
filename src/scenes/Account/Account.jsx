// src/scenes/account/AccountPage.jsx
import {
  Box, Button, TextField, Typography, Avatar, IconButton, Grid, Paper, CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import UploadIcon from '@mui/icons-material/Upload';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function AccountPage() {
  const { userAttributes, updateAttributes } = useAuth();

  // Local state for edit mode, form values, and avatar
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone_number: '',
    address: '',
    company: '',
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);

  // When userAttributes load (or change), populate form & avatar
  useEffect(() => {
    if (userAttributes) {
      setForm({
        name: userAttributes.name || '',
        phone_number: userAttributes.phone_number || '',
        address: userAttributes.address || '',
        company: userAttributes['custom:company'] || '',
      });
      setAvatarUrl(userAttributes.picture || '');
      setLoading(false);
    }
  }, [userAttributes]);

  // Guard: show spinner until attributes are present
  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  // Field change handler
  const onChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
  };

  // Avatar upload (simulated)
  const onAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    // TODO: upload to S3 and include resulting URL as 'picture' on save
  };

  // Cancel edits, revert to last-synced values
  const onCancel = () => {
    setForm({
      name: userAttributes.name || '',
      phone_number: userAttributes.phone_number || '',
      address: userAttributes.address || '',
      company: userAttributes['custom:company'] || '',
    });
    setAvatarUrl(userAttributes.picture || '');
    setEditMode(false);
  };

  // Save edits back to Cognito
  const onSave = async () => {
    const toUpdate = {
      name: form.name,
      phone_number: form.phone_number,
      address: form.address,
      'custom:company': form.company,
      // picture: avatarUrl  // once you have real upload in place
    };
    try {
      await updateAttributes(toUpdate);
      setEditMode(false);
    } catch (err) {
      console.error('Failed to update user attributes', err);
      // Optionally show an error Snackbar here
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        My Account
        {!editMode && (
          <IconButton
            size="small"
            sx={{ ml: 1 }}
            onClick={() => setEditMode(true)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Typography>

      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Avatar */}
          <Grid item xs={12} sm={4} container justifyContent="center">
            <Box position="relative" textAlign="center">
              <Avatar
                src={avatarUrl}
                sx={{ width: 100, height: 100, margin: 'auto' }}
              />
              {editMode && (
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper'
                  }}
                >
                  <UploadIcon />
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={onAvatarUpload}
                  />
                </IconButton>
              )}
            </Box>
          </Grid>

          {/* Form fields */}
          <Grid item xs={12} sm={8} container spacing={2}>
            {/* Email (read-only) */}
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                value={userAttributes.email || ''}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Full name */}
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                fullWidth
                value={form.name}
                onChange={onChange('name')}
                disabled={!editMode}
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12}>
              <TextField
                label="Phone Number"
                fullWidth
                value={form.phone_number}
                onChange={onChange('phone_number')}
                disabled={!editMode}
              />
            </Grid>

            {/* Address */}
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

            {/* Company */}
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
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={onSave}
                >
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
