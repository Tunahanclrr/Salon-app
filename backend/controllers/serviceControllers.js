const Service = require('../models/Services');

// POST /api/services  – yeni hizmet
exports.createService = async (req,res)=>{
  try{
    const { name, duration, price } = req.body;
    if(!name || !duration || price === undefined || price === null) return res.status(400).json({message:'İsim, süre ve fiyat zorunlu'});
    const svc = await Service.create({ name, duration, price });
    res.status(201).json({ message:'Hizmet eklendi', data:svc });
  }catch(err){ 
    console.error('Create service error:', err);
    res.status(500).json({message:'Sunucu hatası', error: err.message}); 
  }
};

// GET /api/services – liste
exports.getServices = async (_req,res)=>{
  try{
    const list = await Service.find();
    res.json(list);
  }catch(err){ res.status(500).json({message:'Sunucu hatası'}); }
};

// DELETE /api/services/:id – hizmet silme
exports.deleteService = async (req,res)=>{
  try{
    const { id } = req.params;
    if(!id) return res.status(400).json({message:'ID gerekli'});
    const svc = await Service.findByIdAndDelete(id);
    if(!svc) return res.status(404).json({message:'Hizmet bulunamadı'});
    res.status(200).json({ message:'Hizmet silindi', data:svc });
  }catch(err){ 
    console.error('Delete service error:', err);
    res.status(500).json({message:'Sunucu hatası'}); 
  }
};

// PUT /api/services/:id – hizmet düzenleme
exports.editService = async (req,res)=>{
  try{
    const { id } = req.params;
    const { name, duration, price } = req.body;
    
    console.log('🔧 Edit service request:');
    console.log('ID:', id);
    console.log('Request body:', req.body);
    console.log('Name:', name, 'Type:', typeof name);
    console.log('Duration:', duration, 'Type:', typeof duration);
    console.log('Price:', price, 'Type:', typeof price);
    
    if(!id) return res.status(400).json({message:'ID gerekli'});
    
    // Validasyon kontrolü - boş string ve undefined/null kontrolü
    if(!name || name.trim() === '') {
      console.log('❌ Name validation failed');
      return res.status(400).json({message:'İsim zorunlu'});
    }
    if(!duration || duration === '' || isNaN(duration) || Number(duration) <= 0) {
      console.log('❌ Duration validation failed');
      return res.status(400).json({message:'Geçerli süre zorunlu'});
    }
    if(price === undefined || price === null || price === '' || isNaN(price) || Number(price) < 0) {
      console.log('❌ Price validation failed');
      return res.status(400).json({message:'Geçerli fiyat zorunlu'});
    }
    
    console.log('✅ All validations passed');
    
    const updatedService = await Service.findByIdAndUpdate(
      id, 
      { name: name.trim(), duration: Number(duration), price: Number(price) },
      { new: true, runValidators: true }
    );
    
    if(!updatedService) return res.status(404).json({message:'Hizmet bulunamadı'});
    
    console.log('✅ Service updated successfully:', updatedService);
    res.status(200).json({ message:'Hizmet güncellendi', data: updatedService });
  }catch(err){
    console.error('Edit service error:', err);
    res.status(500).json({message:'Sunucu hatası'});
  }
};