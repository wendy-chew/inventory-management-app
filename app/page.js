'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Stack, Typography, Button, Modal, TextField, Select, MenuItem } from '@mui/material';
import { firestore, storage } from '@/firebase';
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {Camera} from 'react-camera-pro';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: 400,
  bgcolor: '#F5F5F5',
  border: '2px solid #00796B',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const categories = [
  'Vegetable', 'Fruit', 'Dairy', 'Grain', 'Protein', 'Beverage', 'Snack', 'Condiment', 'Frozen', 'Other',
];

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const cameraRef = useRef(null);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const uploadImage = async (file) => {
    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const addItem = async (item, category, quantity, imageUrl) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity: existingQuantity } = docSnap.data();
      await setDoc(docRef, { quantity: existingQuantity + Number(quantity), category, imageUrl }, { merge: true });
    } else {
      await setDoc(docRef, { quantity: Number(quantity), category, imageUrl });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity <= 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 }, { merge: true });
      }
    }
    await updateInventory();
  };

  const editItem = async (item, newCategory, newQuantity, newImageUrl) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    await setDoc(docRef, { category: newCategory, quantity: Number(newQuantity), imageUrl: newImageUrl }, { merge: true });
    await updateInventory();
  };

  const handleOpen = (item = null) => {
    if (item) {
      setEditMode(true);
      setCurrentItem(item);
      setItemName(item.name);
      setCategory(item.category);
      setQuantity(item.quantity);
      setImageUrl(item.imageUrl);
    } else {
      setEditMode(false);
      setItemName('');
      setCategory('');
      setQuantity('');
      setImageUrl('');
    }
    setIsCameraVisible(false); // Hide camera initially
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setItemName('');
    setCategory('');
    setQuantity('');
    setCurrentItem(null);
    setImageUrl('');
    setIsCameraVisible(false); // Hide camera when modal is closed
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleCapture = async () => {
    try {
      const image = cameraRef.current.takePhoto();
      console.log('Image captured:', image);
      const blob = await fetch(image).then(res => res.blob());
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      const imageUrl = await uploadImage(file);
      console.log('Image uploaded to:', imageUrl);
      setImageUrl(imageUrl);
      setIsCameraVisible(false); // Hide camera after capture
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  };

  const handleRetake = () => {
    setIsCameraVisible(true); // Show camera to retake the picture
    setImageUrl(''); // Clear the previously captured image
  };

  const handleRemoveImage = () => {
    setImageUrl(''); // Remove captured image
    setIsCameraVisible(false); // Hide camera and captured image section
  };

  const handleAddImage = () => {
    setIsCameraVisible(true); // Show camera
  };

  const handleSubmit = async () => {
    if (editMode) {
      await editItem(currentItem.name, category, quantity, imageUrl);
    } else {
      await addItem(itemName, category, quantity, imageUrl);
    }
    handleClose();
  };

  const filteredInventory = inventory
    .filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory === '' || item.category === selectedCategory)
    )
    .sort((a, b) => b.name.toLowerCase().startsWith(searchQuery.toLowerCase()) - a.name.toLowerCase().startsWith(searchQuery.toLowerCase()));

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
      px={2}
      color={'#f5f5f5'}
      p={4}
    >
      <Box
        width="100%"
        maxWidth="1200px"
        mx="auto"
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
              {isCameraVisible ? (
                <Box>
                  <Camera ref={cameraRef} aspectRatio={16 / 9} />
                  <Button variant="contained" onClick={handleCapture}>Capture</Button>
                </Box>
              ) : imageUrl ? (
                <Box>
                  <Typography variant="body1">Captured Image:</Typography>
                  <img src={imageUrl} alt="Captured" style={{ width: '100%' }} />
                  <Stack direction="row" spacing={2}>
                    <Button variant="contained" onClick={handleRetake}>Retake</Button>
                    <Button variant="contained" color="error" onClick={handleRemoveImage}>Remove Image</Button>
                  </Stack>
                </Box>
              ) : (
                <Button variant="contained" onClick={handleAddImage}>Add Image</Button>
              )}
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={itemName === '' || category === '' || quantity === ''}
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
            bgcolor={'#00796B'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
          >
            <Typography variant={'h2'} color={'#FFFFFF'} textAlign={'center'}>
              Inventory Items
            </Typography>
          </Box>
          <Stack width="100%" height="auto" spacing={2} overflow={'auto'}>
            {filteredInventory.map(({ name, quantity, category, imageUrl }) => (
              <Box
                key={name}
                width="100%"
                minHeight="150px"
                display={'flex'}
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent={'space-between'}
                alignItems={'center'}
                bgcolor={'#FFFFFF'}
                paddingX={2}
                paddingY={1}
                border={'1px solid #E0E0E0'}
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
                {imageUrl && <img src={imageUrl} alt={name} width={100} />}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems="center"
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpen({ name, category, quantity, imageUrl })}
                    sx={{ width: { xs: '100%', sm: 'auto' }, mb: { xs: 2, sm: 0 } }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => removeItem(name)}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
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
  );
}
