'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, Select, MenuItem } from '@mui/material'
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

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',  // Adjusted for responsiveness
  maxWidth: 400,
  bgcolor: '#F5F5F5', // Light grey background for the modal
  border: '2px solid #00796B', // Teal border color
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

const categories = [
  'Vegetable',
  'Fruit',
  'Dairy',
  'Grain',
  'Protein',
  'Beverage',
  'Snack',
  'Condiment',
  'Frozen',
  'Other',
]

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)

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

  const addItem = async (item, category, quantity) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity: existingQuantity } = docSnap.data()
      await setDoc(docRef, { quantity: existingQuantity + Number(quantity), category }, { merge: true })
    } else {
      await setDoc(docRef, { quantity: Number(quantity), category })
    }
    await updateInventory()
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity <= 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 }, { merge: true })
      }
    }
    await updateInventory()
  }

  const editItem = async (item, newCategory, newQuantity) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    await setDoc(docRef, { category: newCategory, quantity: Number(newQuantity) }, { merge: true })
    await updateInventory()
  }

  const handleOpen = (item = null) => {
    if (item) {
      setEditMode(true)
      setCurrentItem(item)
      setItemName(item.name)
      setCategory(item.category)
      setQuantity(item.quantity)
    } else {
      setEditMode(false)
      setItemName('')
      setCategory('')
      setQuantity('')
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setItemName('')
    setCategory('')
    setQuantity('')
    setCurrentItem(null)
  }

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
  }

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value)
  }

  const filteredInventory = inventory
    .filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === '' || item.category === selectedCategory)
    )
    .sort((a, b) => b.name.toLowerCase().startsWith(searchQuery.toLowerCase()) - a.name.toLowerCase().startsWith(searchQuery.toLowerCase()))

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
      px={2}  // Padding for mobile
      color={'#f5f5f5'}  // Light text color
      p={4}  // Added padding for spacing around the entire page
    >
      <Box
        width="100%"
        maxWidth="1200px"  // Maximum width of the content wrapper
        mx="auto"  // Center horizontally
      >
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              {editMode ? 'Edit Item' : 'Add Item'}
            </Typography>
            <Stack width="100%" spacing={2}>
              <TextField
                id="outlined-basic"
                label="Item"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                displayEmpty
                fullWidth
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
              <TextField
                id="outlined-quantity"
                label="Quantity"
                variant="outlined"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                type="number"
              />
              <Button
                variant="contained"
                onClick={() => {
                  if (editMode) {
                    editItem(currentItem.name, category, quantity)
                  } else {
                    addItem(itemName, category, quantity)
                  }
                  handleClose()
                }}
              >
                {editMode ? 'Save' : 'Add'}
              </Button>
            </Stack>
          </Box>
        </Modal>
        <Stack direction="column" spacing={2} alignItems="center" sx={{ width: '100%', mb: 2 }}>
          <Button variant="contained" onClick={() => handleOpen()} color="primary">
            Add New Item
          </Button>
          <Stack direction="column" spacing={2} alignItems="center" sx={{ width: '100%' }}>
            <TextField
              label="Search Items"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Select
              value={selectedCategory}
              onChange={handleCategoryChange}
              displayEmpty
              fullWidth
            >
              <MenuItem value=""><em>All Categories</em></MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
        <Box border={'1px solid #00796B'} width="100%">
          <Box
            width="100%"
            height="100px"
            bgcolor={'#00796B'} // Dark teal background for the header
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
          >
            <Typography variant={'h2'} color={'#FFFFFF'} textAlign={'center'}>
              Inventory Items
            </Typography>
          </Box>
          <Stack width="100%" height="auto" spacing={2} overflow={'auto'}>
            {filteredInventory.map(({ name, quantity, category }) => (
              <Box
                key={name}
                width="100%"
                minHeight="150px"
                display={'flex'}
                flexDirection={{ xs: 'column', sm: 'row' }}  // Responsive direction
                justifyContent={'space-between'}
                alignItems={'center'}
                bgcolor={'#FFFFFF'} // White background for inventory items
                paddingX={2}
                paddingY={1}
                border={'1px solid #E0E0E0'} // Light grey border for item boxes
              >
                <Typography variant={'h5'} color={'#333'} textAlign={'center'}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
                <Typography variant={'h5'} color={'#333'} textAlign={'center'}>
                  Quantity: {quantity}
                </Typography>
                <Typography variant={'h6'} color={'#555'} textAlign={'center'}>
                  {category}
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}  // Change direction based on screen size
                  spacing={2}  // Spacing between buttons
                  alignItems="center"  // Center buttons in the column direction
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpen({ name, category, quantity })}
                    sx={{ width: { xs: '100%', sm: 'auto' }, mb: { xs: 2, sm: 0 } }} // Responsive width and margin
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => removeItem(name)}
                    sx={{ width: { xs: '100%', sm: 'auto' } }} // Responsive width
                  >
                    Remove
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
