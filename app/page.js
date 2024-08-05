'use client'

import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Modal, TextField, Stack, Paper, Grid, InputAdornment, Chip, Tooltip } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import WarningIcon from '@mui/icons-material/Warning';
import { firestore } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'

const theme = createTheme({
  palette: {
    primary: {
      main: '#556B2F',
    },
    secondary: {
      main: '#8FBC8F',
    },
    background: {
      default: '#F0FFF0',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#556B2F',
      secondary: '#8FBC8F',
    },
  },
});

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
};

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemExpiration, setItemExpiration] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setItemName('')
    setItemQuantity(1)
    setItemExpiration('')
    setItemCategory('')
  }

  const addItem = async () => {
    const docRef = doc(collection(firestore, 'inventory'), itemName)
    await setDoc(docRef, { 
      quantity: itemQuantity, 
      expiration: itemExpiration,
      category: itemCategory,
    })
    await updateInventory()
    handleClose()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { ...docSnap.data(), quantity: quantity - 1 })
      }
    }
    await updateInventory()
  }

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isExpiringSoon = (expirationDate) => {
    if (!expirationDate) return false;
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  }

  const isExpired = (expirationDate) => {
    if (!expirationDate) return false;
    const today = new Date();
    const expDate = new Date(expirationDate);
    return expDate < today;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <Typography variant={'h2'} color={'primary'} textAlign={'center'}>
          Olive Pantry Tracker
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={handleOpen}
          startIcon={<AddIcon />}
          size="large"
          sx={{ bgcolor: 'primary.main', color: '#FFFFFF' }}
        >
          Add New Item
        </Button>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: { bgcolor: 'background.paper', color: 'primary.main' },
          }}
          InputLabelProps={{ style: { color: 'primary.main' } }}
        />

        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Paper sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2" gutterBottom color="primary">
              Add New Item
            </Typography>
            <Stack spacing={3}>
              <TextField
                label="Item Name"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                InputProps={{ sx: { bgcolor: 'background.paper', color: 'primary.main' } }}
                InputLabelProps={{ style: { color: 'primary.main' } }}
              />
              <TextField
                label="Quantity"
                variant="outlined"
                type="number"
                fullWidth
                value={itemQuantity}
                onChange={(e) => setItemQuantity(parseInt(e.target.value))}
                InputProps={{ inputProps: { min: 1 }, sx: { bgcolor: 'background.paper', color: 'primary.main' } }}
                InputLabelProps={{ style: { color: 'primary.main' } }}
              />
              <TextField
                label="Expiration Date"
                type="date"
                value={itemExpiration}
                onChange={(e) => setItemExpiration(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                  style: { color: 'primary.main' },
                }}
                sx={{ bgcolor: 'background.paper', color: 'primary.main' }}
              />
              <TextField
                label="Category"
                variant="outlined"
                fullWidth
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                InputProps={{ sx: { bgcolor: 'background.paper', color: 'primary.main' } }}
                InputLabelProps={{ style: { color: 'primary.main' } }}
              />
              <Button
                variant="contained"
                onClick={addItem}
                disabled={!itemName || itemQuantity < 1}
                sx={{ bgcolor: 'primary.main', color: '#FFFFFF' }}
              >
                Add Item
              </Button>
            </Stack>
          </Paper>
        </Modal>

        <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
          <Box
            bgcolor={'secondary.main'}
            py={2}
            px={3}
          >
            <Typography variant={'h4'} color={'white'} textAlign={'center'}>
              Inventory Items
            </Typography>
          </Box>
          <Box maxHeight="500px" overflow={'auto'}>
            {filteredInventory.map(({name, quantity, expiration, category}) => (
              <Paper 
                key={name} 
                elevation={1}
                sx={{ 
                  m: 2, 
                  p: 2,
                  '&:hover': {
                    boxShadow: 6,
                  },
                  position: 'relative',
                  bgcolor: 'background.paper',
                }}
              >
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant={'h6'} color={'primary'}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant={'body1'} color={'primary'}>
                      Quantity: {quantity}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant={'body1'} color={'primary'}>
                      Expires: {expiration || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Chip label={category} color="primary" size="small" />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={() => removeItem(name)}
                      startIcon={<RemoveIcon />}
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
                {isExpiringSoon(expiration) && (
                  <Tooltip title="Expiring soon">
                    <WarningIcon 
                      color="warning" 
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  </Tooltip>
                )}
                {isExpired(expiration) && (
                  <Tooltip title="Expired">
                    <WarningIcon 
                      color="error" 
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                    />
                  </Tooltip>
                )}
              </Paper>
            ))}
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  )
}
