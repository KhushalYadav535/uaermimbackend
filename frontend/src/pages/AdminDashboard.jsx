import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Typography,
  Modal,
  Switch,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    emailVerified: '',
    startDate: null,
    endDate: null,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authSettings, setAuthSettings] = useState({
    requireEmailVerification: true,
    enforce2FA: false,
    enforce2FAByRole: {
      admin: true,
      moderator: true,
      user: false,
    },
    allowedSocialLogins: {
      google: true,
      apple: true,
    },
  });
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchUsers();
    fetchSettings();
  }, [page, rowsPerPage, searchQuery, filters]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: searchQuery,
          ...filters,
        },
      });
      setUsers(response.data.users);
      setTotalUsers(response.data.totalUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/admin/settings/auth');
      setAuthSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleToggleStatus = async (userId, active) => {
    try {
      await axios.put(`/api/admin/users/${userId}/status`, { active });
      fetchUsers();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      await axios.post(`/api/admin/users/${userId}/reset-password`);
      alert('Password reset email sent');
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  const handleReset2FA = async (userId) => {
    try {
      await axios.post(`/api/admin/users/${userId}/reset-2fa`);
      alert('2FA has been reset');
    } catch (error) {
      console.error('Error resetting 2FA:', error);
    }
  };

  const handleResendVerification = async (userId) => {
    try {
      await axios.post(`/api/admin/users/${userId}/resend-verification`);
      alert('Verification email sent');
    } catch (error) {
      console.error('Error sending verification:', error);
    }
  };

  const handleExportLogs = async (type, format) => {
    try {
      const response = await axios.get('/api/admin/logs/export', {
        params: { type, format },
        responseType: format === 'csv' ? 'blob' : 'json',
      });

      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}-logs.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await axios.put('/api/admin/settings/auth', authSettings);
      alert('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  if (!user?.isSuperAdmin) {
    return <div>Access denied. Super admin access required.</div>;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setSettingsOpen(true)}
          startIcon={<SecurityIcon />}
          sx={{ mr: 2 }}
        >
          Authentication Settings
        </Button>
        <Button
          variant="contained"
          onClick={() => handleExportLogs('activity', 'csv')}
          startIcon={<DownloadIcon />}
        >
          Export Logs
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                onChange={(e) =>
                  setFilters({ ...filters, role: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Email Verified</InputLabel>
              <Select
                value={filters.emailVerified}
                onChange={(e) =>
                  setFilters({ ...filters, emailVerified: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) =>
                setFilters({ ...filters, startDate: date })
              }
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) =>
                setFilters({ ...filters, endDate: date })
              }
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Email Verified</TableCell>
              <TableCell>Registration Date</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user._id, e.target.value)}
                    size="small"
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="moderator">Moderator</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.emailVerified ? 'Yes' : 'No'}
                    color={user.emailVerified ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : 'Never'}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => {
                      setSelectedUser(user);
                      setUserDetailsOpen(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleToggleStatus(user._id, !user.active)}
                  >
                    <BlockIcon color={user.active ? 'inherit' : 'error'} />
                  </IconButton>
                  <IconButton onClick={() => handleResetPassword(user._id)}>
                    <RefreshIcon />
                  </IconButton>
                  <IconButton onClick={() => handleReset2FA(user._id)}>
                    <SecurityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* User Details Modal */}
      <Dialog
        open={userDetailsOpen}
        onClose={() => setUserDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
              >
                <Tab label="Profile" />
                <Tab label="Security" />
                <Tab label="Activity" />
              </Tabs>
              <Box sx={{ mt: 2 }}>
                {activeTab === 0 && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Name</Typography>
                      <Typography>{selectedUser.name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Email</Typography>
                      <Typography>{selectedUser.email}</Typography>
                    </Grid>
                    {/* Add more profile details */}
                  </Grid>
                )}
                {activeTab === 1 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={() => handleResetPassword(selectedUser._id)}
                      >
                        Reset Password
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={() => handleReset2FA(selectedUser._id)}
                      >
                        Reset 2FA
                      </Button>
                    </Grid>
                  </Grid>
                )}
                {activeTab === 2 && (
                  <Button
                    variant="contained"
                    onClick={() => handleExportLogs('activity', 'csv')}
                    startIcon={<HistoryIcon />}
                  >
                    Export Activity Logs
                  </Button>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Authentication Settings Modal */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Authentication Settings</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Typography component="div">
                  Require Email Verification
                  <Switch
                    checked={authSettings.requireEmailVerification}
                    onChange={(e) =>
                      setAuthSettings({
                        ...authSettings,
                        requireEmailVerification: e.target.checked,
                      })
                    }
                  />
                </Typography>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Typography component="div">
                  Enforce 2FA Globally
                  <Switch
                    checked={authSettings.enforce2FA}
                    onChange={(e) =>
                      setAuthSettings({
                        ...authSettings,
                        enforce2FA: e.target.checked,
                      })
                    }
                  />
                </Typography>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6">Social Login Providers</Typography>
              <FormControl fullWidth>
                <Typography component="div">
                  Google
                  <Switch
                    checked={authSettings.allowedSocialLogins.google}
                    onChange={(e) =>
                      setAuthSettings({
                        ...authSettings,
                        allowedSocialLogins: {
                          ...authSettings.allowedSocialLogins,
                          google: e.target.checked,
                        },
                      })
                    }
                  />
                </Typography>
              </FormControl>
              <FormControl fullWidth>
                <Typography component="div">
                  Apple
                  <Switch
                    checked={authSettings.allowedSocialLogins.apple}
                    onChange={(e) =>
                      setAuthSettings({
                        ...authSettings,
                        allowedSocialLogins: {
                          ...authSettings.allowedSocialLogins,
                          apple: e.target.checked,
                        },
                      })
                    }
                  />
                </Typography>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateSettings}
            variant="contained"
            color="primary"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;