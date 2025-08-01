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
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '', company: '', jobTitle: ''
  });
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!loading && userProfile) {
      setForm({
        name: userProfile.name || '',
        company: userProfile.company || '',
        jobTitle: userProfile.jobTitle || ''
      });
      setAvatarUrl(userProfile.picture || '');
    }
  }, [loading, userProfile]);

  if (loading) {
    return <Box p={4} display="flex" justifyContent="center"><CircularProgress/></Box>;
  }
  if (!userProfile) {
    return <Box p={4}><Typography color="error">Failed to load profile.</Typography></Box>;
  }

  const onChange = field => e => setForm(f => ({ ...f, [field]: e.target.value }));
  const onAvatarUpload = e => {
    const file = e.target.files[0];
    if (file) setAvatarUrl(URL.createObjectURL(file));
  };
  const onCancel = () => {
    setEditMode(false);
    setForm({
      name: userProfile.name || '',
      phone_number: userProfile.company || '',
      address: userProfile.jobTitle || ''
    });
    setAvatarUrl(userProfile.picture || '');
  };
  const onSave = async () => {
    const toUpdate = {
      name: form.name,
      company: form.company,
      jobTitle: form.jobTitle
      // picture: avatarUrl
    };
    try {
      await updateProfile(toUpdate);
      setEditMode(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        My Account
        {!editMode && (
          <IconButton size="small" sx={{ ml:1 }} onClick={() => setEditMode(true)}>
            <EditIcon fontSize="small"/>
          </IconButton>
        )}
      </Typography>
      <Paper sx={{p:3, maxWidth:600}}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} container justifyContent="center">
            <Box position="relative" textAlign="center">
              <Avatar src={avatarUrl} sx={{ width:100, height:100, m:'auto' }}/>
              {editMode && (
                <IconButton component="label" sx={{ position:'absolute', bottom:0, right:0 }}>
                  <UploadIcon/>
                  <input hidden type="file" accept="image/*" onChange={onAvatarUpload}/>
                </IconButton>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} sm={8} container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Email" fullWidth value={userProfile.email||''} InputProps={{ readOnly:true }}/>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Full Name" fullWidth value={form.name}
                onChange={onChange('name')} InputProps={{ readOnly:!editMode }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Company" fullWidth value={form.phone_number}
                onChange={onChange('company')} InputProps={{ readOnly:!editMode }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Job Title" fullWidth multiline rows={2}
                value={form.jobTitle} onChange={onChange('jobTitle')}
                InputProps={{ readOnly:!editMode }}
              />
            </Grid>
            {editMode && (
              <Grid item xs={12} container justifyContent="flex-end" spacing={1}>
                <Grid item>
                  <Button variant="outlined" startIcon={<CancelIcon/>} onClick={onCancel}>
                    Cancel
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" startIcon={<SaveIcon/>} onClick={onSave}>
                    Save
                  </Button>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
